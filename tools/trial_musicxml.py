"""Convert simple monophonic MusicXML to isolated trial song JSON files."""
import argparse
import json
import sys
from fractions import Fraction
from pathlib import Path
import xml.etree.ElementTree as ET

# Support both direct CLI execution and importing this converter in tests.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from harmonizer import harmonize_song

FILES = {
    'Amazing Grace': 'amazing-grace-musicxml-trial',
    '台北今夜冷清清': 'taipei-tonight-trial',
    '淡水暮色': 'tamsui-twilight-trial',
    '鑼聲若響': 'gong-sounds-trial',
}
KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']


def apply_note_corrections(part, corrections):
    """Apply explicit, source-checked PDF corrections to the in-memory XML only."""
    if not isinstance(corrections, list):
        raise ValueError('Corrections must be a list')
    allowed = {'duration', 'type'}
    for correction in corrections:
        if not isinstance(correction, dict):
            raise ValueError('Each correction must be an object')
        measure_number = str(correction.get('measure', ''))
        number = correction.get('note')
        expected = correction.get('expected')
        replacement = correction.get('replacement')
        if (type(number) is not int or number < 1 or not isinstance(expected, dict)
                or not isinstance(replacement, dict) or not replacement
                or not set(replacement).issubset(allowed) or set(expected) != set(replacement)):
            raise ValueError('Correction requires a 1-based note and matching expected/replacement fields')
        measures = [m for m in part.findall('measure') if m.get('number') == measure_number]
        if len(measures) != 1 or len(measures[0].findall('note')) < number:
            raise ValueError(f'Correction target missing or ambiguous: measure {measure_number}, note {number}')
        note = measures[0].findall('note')[number - 1]
        for field, value in expected.items():
            if note.findtext(field) != str(value):
                raise ValueError(f'Correction source mismatch: measure {measure_number}, note {number}, {field}')
        if 'duration' in replacement and Fraction(str(replacement['duration'])) <= 0:
            raise ValueError('Corrected duration must be positive')
        if 'type' in replacement and replacement['type'] not in {
                'whole', 'half', 'quarter', 'eighth', '16th', '32nd', '64th'}:
            raise ValueError('Unsupported corrected note type')
        for field, value in replacement.items():
            element = note.find(field)
            if element is None:
                raise ValueError(f'Correction field missing: {field}')
            element.text = str(value)


def convert(path, song_id, tempo, transpose, corrections=None):
    root = ET.parse(path).getroot()
    for node in root.iter():
        node.tag = node.tag.rsplit('}', 1)[-1]
    parts = root.findall('part')
    if len(parts) != 1:
        raise ValueError('Trial converter requires one part')
    part = parts[0]
    if corrections is not None:
        apply_note_corrections(part, corrections)
    for tag in ('backup', 'forward', 'chord', 'grace', 'tie', 'time-modification', 'transpose', 'repeat', 'ending', 'harmony'):
        if part.find('.//' + tag) is not None:
            raise ValueError(f'Unsupported trial structure: {tag}')
    meters = {(int(t.findtext('beats')), int(t.findtext('beat-type'))) for t in part.findall('.//time')}
    if len(meters) != 1:
        raise ValueError('Requires one constant meter')
    meter = next(iter(meters))
    if meter[1] != 4:
        raise ValueError('Trial requires quarter-note meter')
    fifths = {int(k.text) for k in part.findall('.//key/fifths')}
    if len(fifths) > 1:
        raise ValueError('Key changes unsupported')
    divisions = 1
    offset = Fraction(0)
    melody = []
    measures = part.findall('measure')
    for measure in measures:
        divisions = int(measure.findtext('attributes/divisions', str(divisions)))
        elapsed = Fraction(0)
        for note in measure.findall('note'):
            if note.findtext('voice', '1') != '1':
                raise ValueError('Requires voice 1 only')
            duration = Fraction(note.findtext('duration')) / divisions
            if duration <= 0:
                raise ValueError('Nonpositive duration')
            pitch = note.find('pitch')
            if pitch is None and note.find('rest') is None:
                raise ValueError('Missing pitch/rest')
            midi = 0 if pitch is None else (
                12 * (int(pitch.findtext('octave')) + 1)
                + dict(C=0, D=2, E=4, F=5, G=7, A=9, B=11)[pitch.findtext('step')]
                + int(pitch.findtext('alter', '0')) + transpose
            )
            if pitch is not None and not 21 <= midi <= 108:
                raise ValueError('MIDI out of range')
            notation = dict(type=note.findtext('type'), dots=len(note.findall('dot')),
                            stem=note.findtext('stem'),
                            beams=[dict(number=int(b.get('number', '1')), value=b.text) for b in note.findall('beam')])
            if pitch is not None:
                notation['writtenPitch'] = dict(step=pitch.findtext('step'),
                                               alter=int(pitch.findtext('alter', '0')),
                                               octave=int(pitch.findtext('octave')))
            melody.append(dict(midi=midi, start=round(float(offset + elapsed), 6),
                               dur=round(float(duration), 6), notation=notation))
            elapsed += duration
        if elapsed != meter[0]:
            raise ValueError(f'Measure {measure.get("number")}: {elapsed} != {meter[0]}')
        offset += elapsed
    song = dict(id=song_id, title=path.stem + '（MusicXML 試轉）', composer='',
                license='user-imported', keyConcert=KEYS[(7 * next(iter(fifths), 0) + transpose) % 12],
                timeSignature=list(meter), tempo=tempo, measures=len(measures), melody=melody,
                tracks=[dict(id='melody-guide', name='旋律導奏', type='melody', volume=0.6),
                        dict(id='metronome', name='節拍', type='click', volume=0.7)])
    if corrections:
        song['importInfo'] = {'source': path.name, 'noteCorrections': corrections}
    return harmonize_song(song)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--song-id', help='Required when source is a single MusicXML file')
    parser.add_argument('--corrections', type=Path, help='Explicit PDF-checked note corrections (single-file mode only)')
    parser.add_argument('--tempo', type=float, required=True)
    parser.add_argument('--transpose', type=int, required=True)
    args = parser.parse_args()
    if args.tempo <= 0:
        parser.error('tempo must be positive')
    if args.source.is_file():
        if not args.song_id or any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789-_' for c in args.song_id):
            parser.error('Single-file import requires --song-id with lowercase letters, digits, hyphens or underscores')
        corrections = json.loads(args.corrections.read_text(encoding='utf-8')) if args.corrections else None
        songs = [convert(args.source, args.song_id, args.tempo, args.transpose, corrections)]
    else:
        if args.song_id or args.corrections:
            parser.error('--song-id and --corrections require a single source file')
        # Complete all conversions before writing any results.
        songs = [convert(args.source / (name + '.musicxml'), sid, args.tempo, args.transpose)
                 for name, sid in FILES.items()]
    args.output.mkdir(parents=True, exist_ok=True)
    for song in songs:
        path = args.output / (song['id'] + '.json')
        path.write_text(json.dumps(song, ensure_ascii=False, indent=2) + '\n')
        print(f'{path.name}: {song["measures"]} measures, {len(song["melody"])} events')


if __name__ == '__main__':
    main()
