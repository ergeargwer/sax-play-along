"""Convert simple monophonic MusicXML to isolated trial song JSON files."""
import argparse
import json
from fractions import Fraction
from pathlib import Path
import xml.etree.ElementTree as ET

FILES = {
    'Amazing Grace': 'amazing-grace-musicxml-trial',
    '台北今夜冷清清': 'taipei-tonight-trial',
    '淡水暮色': 'tamsui-twilight-trial',
    '鑼聲若響': 'gong-sounds-trial',
}
KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']


def convert(path, song_id, tempo, transpose):
    root = ET.parse(path).getroot()
    for node in root.iter():
        node.tag = node.tag.rsplit('}', 1)[-1]
    parts = root.findall('part')
    if len(parts) != 1:
        raise ValueError('Trial converter requires one part')
    part = parts[0]
    for tag in ('backup', 'forward', 'chord', 'grace', 'tie', 'time-modification', 'transpose', 'repeat', 'ending'):
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
    return dict(id=song_id, title=path.stem + '（MusicXML 試轉）', composer='',
                license='user-imported', keyConcert=KEYS[(7 * next(iter(fifths), 0) + transpose) % 12],
                timeSignature=list(meter), tempo=tempo, measures=len(measures), melody=melody,
                tracks=[dict(id='melody-guide', name='旋律導奏', type='melody', volume=0.6),
                        dict(id='metronome', name='節拍', type='click', volume=0.7)])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--tempo', type=float, required=True)
    parser.add_argument('--transpose', type=int, required=True)
    args = parser.parse_args()
    if args.tempo <= 0:
        parser.error('tempo must be positive')
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
