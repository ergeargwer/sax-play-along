"""Build small, offline piano/acoustic-bass/nylon-guitar multisamples from MIT FluidR3.

Requires libfluidsynth and ffmpeg only for rebuilding. Playback needs neither.
Usage: python3 tools/build_instrument_samples.py /path/to/FluidR3_GM.sf2
"""
import argparse
from array import array
import ctypes as C
from ctypes.util import find_library
import hashlib
import json
from pathlib import Path
import subprocess
import sys

RATE = 32000
OUTPUT = Path(__file__).resolve().parents[1] / 'static/audio/instruments'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('soundfont', type=Path)
    parser.add_argument('--instrument', choices=['piano', 'acoustic-bass', 'nylon-guitar'], nargs='+',
                        help='Rebuild only these instruments; preserve other existing entries')
    args = parser.parse_args()
    lib = C.CDLL(find_library('fluidsynth'))
    def api(name, restype, *argtypes):
        f = getattr(lib, name); f.restype = restype; f.argtypes = argtypes
        return f
    ptr, integer = C.c_void_p, C.c_int
    settings = api('new_fluid_settings', ptr)()
    setnum = api('fluid_settings_setnum', integer, ptr, C.c_char_p, C.c_double)
    setint = api('fluid_settings_setint', integer, ptr, C.c_char_p, integer)
    setnum(settings, b'synth.sample-rate', RATE)
    setnum(settings, b'synth.gain', .8)
    setint(settings, b'synth.reverb.active', 0)
    setint(settings, b'synth.chorus.active', 0)
    synth = api('new_fluid_synth', ptr, ptr)(settings)
    load = api('fluid_synth_sfload', integer, ptr, C.c_char_p, integer)
    noteon = api('fluid_synth_noteon', integer, ptr, integer, integer, integer)
    noteoff = api('fluid_synth_noteoff', integer, ptr, integer, integer)
    off = api('fluid_synth_all_sounds_off', integer, ptr, integer)
    program = api('fluid_synth_program_change', integer, ptr, integer, integer)
    write = api('fluid_synth_write_s16', integer, ptr, integer, ptr, integer, integer, ptr, integer, integer)
    def render(seconds):
        frames = round(seconds * RATE)
        buffer = (C.c_short * (frames * 2))()
        if write(synth, frames, buffer, 0, 2, buffer, 1, 2) != 0:
            raise RuntimeError('FluidSynth render failed')
        result = array('h'); result.frombytes(bytes(buffer))
        return result
    try:
        if not synth or load(synth, str(args.soundfont).encode(), 1) < 0:
            raise RuntimeError('Cannot load SoundFont')
        OUTPUT.mkdir(parents=True, exist_ok=True)
        manifest = {'version': 1, 'source': 'FluidR3 GM', 'license': 'MIT',
                    'sourceSha256': hashlib.sha256(args.soundfont.read_bytes()).hexdigest(),
                    'sampleRate': RATE, 'instruments': {}}
        if args.instrument and (OUTPUT/'manifest.json').exists():
            existing = json.loads((OUTPUT/'manifest.json').read_text())
            if existing.get('sourceSha256') != manifest['sourceSha256']:
                raise ValueError('Partial rebuild requires the same source SoundFont')
            manifest['instruments'] = existing['instruments']
        for instrument, preset, roots, velocities, hold in [
            ('piano', 0, range(42, 91, 3), (60, 88), 6.0),
            ('acoustic-bass', 32, range(28, 56, 3), (80,), 3.5),
            ('nylon-guitar', 24, range(45, 82, 3), (56, 80), 3.5),
        ]:
            if args.instrument and instrument not in args.instrument:
                continue
            program(synth, 0, preset)
            samples = []
            for root in roots:
                for velocity in velocities:
                    off(synth, 0); render(.01)
                    if noteon(synth, 0, root, velocity) != 0:
                        raise RuntimeError('FluidSynth note-on failed')
                    pcm = render(hold)
                    noteoff(synth, 0, root)
                    pcm.extend(render(.65))
                    samples.append((root, velocity, pcm))
            # One normalization factor per instrument, preserving velocity layers.
            peak = max(abs(value) for _, _, pcm in samples for value in pcm)
            factor = .82 * 32767 / max(1, peak)
            entries = []
            for root, velocity, pcm in samples:
                pcm = array('h', (round(value * factor) for value in pcm))
                # Short deterministic terminal fade prevents truncated sample clicks.
                fade_frames = round(.04 * RATE)
                for frame in range(fade_frames):
                    scale = 1 - frame / fade_frames
                    for channel in (0, 1):
                        idx = len(pcm) - fade_frames * 2 + frame * 2 + channel
                        pcm[idx] = round(pcm[idx] * scale)
                if sys.byteorder != 'little': pcm.byteswap()
                name = f'{instrument}-{root}-v{velocity}.mp3'
                subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                    '-f', 's16le', '-ar', str(RATE), '-ac', '2', '-i', 'pipe:0',
                    '-codec:a', 'libmp3lame', '-b:a', '96k', '-map_metadata', '-1', str(OUTPUT/name)],
                    input=pcm.tobytes(), check=True)
                entries.append({'root': root, 'velocity': velocity, 'file': name,
                                'sha256': hashlib.sha256((OUTPUT/name).read_bytes()).hexdigest()})
            manifest['instruments'][instrument] = entries
            print(f'{instrument}: {len(entries)} samples', flush=True)
        (OUTPUT/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    finally:
        api('delete_fluid_synth', None, ptr)(synth)
        api('delete_fluid_settings', None, ptr)(settings)


if __name__ == '__main__':
    main()
