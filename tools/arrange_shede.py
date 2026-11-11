"""Apply an authored A-minor practice arrangement; not a transcription of source harmony.

Run after the melody import, from the project root. Existing unrelated tracks,
melody, mode and source metadata are preserved. Re-running is deterministic.
"""
from copy import deepcopy
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import validate_song
from harmonizer import KEY_PC, QUALITIES

PATH = Path(__file__).resolve().parents[1] / 'data/trials/musicxml/shede-wo-nanguo-musicxml-trial.json'
# Each row is one bar; two symbols split a bar evenly at beats 1 and 3.
PLAN = [
    ['Am'], ['Dm'], ['G7'], ['C'],
    ['Dm'], ['C'], ['Am'], ['E7'],
    ['Am'], ['Dm'], ['G7'], ['C'],
    ['Dm'], ['C'], ['Am', 'E7'], ['Am'], ['Am'],
    ['Dm'], ['Am'], ['Dm', 'E7'], ['Am'],
    ['Dm'], ['Am'], ['Dm', 'E7'], ['E7', 'Am'],
]


def arrange(song):
    if (song['id'] != 'shede-wo-nanguo-musicxml-trial'
            or song['measures'] != 25 or song['timeSignature'] != [4, 4]
            or song['keyConcert'] != 'C' or song.get('mode') != 'minor'):
        raise ValueError('Arrangement requires the documented 25-bar A-minor import')
    result = deepcopy(song)
    symbols, chords, bass = [], [], []
    for bar, names in enumerate(PLAN):
        dur = 4 / len(names)
        for index, name in enumerate(names):
            root = KEY_PC[name[0]]
            quality = name[1:]
            start = bar * 4 + index * dur
            symbols.append(dict(symbol=name, root=root, quality=quality,
                                start=start, dur=dur, source='manual'))
            chords.append(dict(midi=[48 + root + i for i in QUALITIES[quality]],
                               start=start, dur=dur))
            bass.append(dict(midi=36 + root, start=start, dur=dur))
    result['chordSymbols'] = symbols
    result['tracks'] = [t for t in result['tracks'] if t['id'] not in ('chords', 'bass')]
    result['tracks'].extend([
        dict(id='chords', name='和弦', type='notes', volume=.35, notes=chords),
        dict(id='bass', name='貝斯', type='notes', volume=.4, notes=bass),
    ])
    result.setdefault('importInfo', {})['harmonyArrangement'] = {
        'tonic': 'A', 'mode': 'minor', 'source': 'manual',
        'basis': '依匯入旋律設計的 A 小調練習配法，非原曲／PDF 和弦；待真人聆聽校對。',
        'rebuild': '.venv/bin/python tools/arrange_shede.py',
    }
    errors = validate_song(result, PATH.name)
    if errors:
        raise ValueError(errors)
    return result


if __name__ == '__main__':
    song = arrange(json.loads(PATH.read_text(encoding='utf-8')))
    PATH.write_text(json.dumps(song, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{PATH}: {len(song["chordSymbols"])} authored chord events')
