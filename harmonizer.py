"""Deterministic major-key harmony enrichment for concert-pitch song JSON.

Preserve authored chord/bass notes and symbols. Infer from melody only where no
existing harmony covers a measure. No score files or input objects are mutated.
"""
from copy import deepcopy
import math
import re

KEY_PC = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5,
          'F#': 6, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11, 'Cb': 11}
SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
QUALITIES = {'': (0, 4, 7), 'm': (0, 3, 7), '7': (0, 4, 7, 10),
             'maj7': (0, 4, 7, 11), 'm7': (0, 3, 7, 10), 'dim': (0, 3, 6), 'aug': (0, 4, 8)}
EPS = 1e-6


def _name(root, key):
    return (FLAT if key in ('F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb') else SHARP)[root]


def _event(root, quality, start, dur, key, source):
    return dict(symbol=_name(root, key) + quality, root=root, quality=quality,
                start=start, dur=dur, source=source)


def _overlap(start, dur, other_start, other_dur):
    return min(start + dur, other_start + other_dur) - max(start, other_start) > EPS


def _recognize(note, key):
    """Exact pitch-class match, including inversions; never relabel unknown voicings."""
    pitches = note['midi'] if isinstance(note['midi'], list) else [note['midi']]
    pcs = {m % 12 for m in pitches if m > 0}
    if len(pcs) < 3:
        return None
    # Symmetric augmented chords are ambiguous: use the lowest sounding root.
    root_order = list(dict.fromkeys(m % 12 for m in sorted(pitches) if m > 0))
    for root in root_order:
        for quality, intervals in QUALITIES.items():
            if pcs == {(root + i) % 12 for i in intervals}:
                return _event(root, quality, note['start'], note['dur'], key, 'existing-notes')
    return None


def validate_chord_symbols(symbols, total):
    """Raise ValueError for malformed optional harmony events."""
    if not isinstance(symbols, list):
        raise ValueError('chordSymbols must be a list')
    for symbol in symbols:
        if (not isinstance(symbol, dict) or not isinstance(symbol.get('symbol'), str)
                or not symbol['symbol']
                or any(isinstance(symbol.get(k), bool)
                       or not isinstance(symbol.get(k), (int, float))
                       or not math.isfinite(symbol[k]) for k in ('start', 'dur'))
                or symbol['start'] < 0 or symbol['dur'] <= 0
                or symbol['start'] + symbol['dur'] > total + EPS):
            raise ValueError('Invalid chordSymbols event')
        if 'root' in symbol and (type(symbol['root']) is not int or not 0 <= symbol['root'] < 12):
            raise ValueError('Chord root must be a MIDI pitch class (0..11)')


def harmonize_song(song):
    """Return an enriched copy. The app currently uses numerator beats per bar.

    Inference follows that existing timeline (quarter-note meters only). Unknown
    keys, explicit non-major modes and non-quarter meters are rejected rather
    than silently inventing a different timeline or tonality.
    """
    result = deepcopy(song)
    key = result['keyConcert']
    if key not in KEY_PC:
        raise ValueError(f'Automatic harmony: unsupported concert key {key!r}')
    if result.get('mode', 'major') != 'major' or result['timeSignature'][1] != 4:
        raise ValueError('Automatic harmony currently requires major mode and quarter-note meter')
    beats = result['timeSignature'][0]
    total = beats * result['measures']
    tracks = result['tracks']
    chord_track = next((t for t in tracks if t['id'] == 'chords'), None)
    bass_track = next((t for t in tracks if t['id'] == 'bass'), None)
    if chord_track is not None and chord_track['type'] != 'notes':
        raise ValueError('Reserved chords track must have type notes')
    if bass_track is not None and bass_track['type'] != 'notes':
        raise ValueError('Reserved bass track must have type notes')
    chord_notes = chord_track.get('notes', []) if chord_track else []
    symbols = result.setdefault('chordSymbols', [])
    validate_chord_symbols(symbols, total)
    for symbol in symbols:
        match = re.fullmatch(r'([A-G](?:#|b)?)(maj7|m7|dim|aug|m|7)?', symbol['symbol'])
        if match and match[1] in KEY_PC:
            symbol.setdefault('root', KEY_PC[match[1]])
            symbol.setdefault('quality', match[2] or '')
    # Preserve symbols supplied by the importer/user; infer missing names from
    # authored accompaniment before considering a melody-based guess.
    for note in chord_notes:
        if any(_overlap(note['start'], note['dur'], s['start'], s['dur']) for s in symbols):
            continue
        event = _recognize(note, key)
        if event:
            symbols.append(event)

    tonic = KEY_PC[key]
    candidates = [(tonic, ''), ((tonic + 5) % 12, ''), ((tonic + 7) % 12, '7'),
                  ((tonic + 9) % 12, 'm'), ((tonic + 2) % 12, 'm')]
    generated_notes = []
    for symbol in symbols:
        if symbol.get('quality') not in QUALITIES or 'root' not in symbol:
            continue
        if not any(_overlap(symbol['start'], symbol['dur'], n['start'], n['dur']) for n in chord_notes):
            generated_notes.append(dict(midi=[48 + symbol['root'] + i for i in QUALITIES[symbol['quality']]],
                                        start=symbol['start'], dur=symbol['dur']))
    previous = None
    for measure in range(result['measures']):
        start = measure * beats
        # Even an unrecognized existing voicing is authoritative: do not add
        # a competing chord or label in that measure.
        if any(_overlap(start, beats, s['start'], s['dur']) for s in symbols + chord_notes):
            previous = None
            continue
        hist = [0.0] * 12
        for note in result['melody']:
            if not note['midi']:
                continue
            duration = min(start + beats, note['start'] + note['dur']) - max(start, note['start'])
            if duration <= EPS:
                continue
            # Count cross-bar sustains, and favor notes sounding on the downbeat.
            accent = 1.5 if note['start'] <= start + EPS else 1.0
            hist[note['midi'] % 12] += duration * accent
        if not any(hist):
            previous = None
            continue
        scores = []
        for i, (root, quality) in enumerate(candidates):
            pcs = {(root + interval) % 12 for interval in QUALITIES[quality]}
            score = sum(w * (1 if pc in pcs else -1.1) for pc, w in enumerate(hist))
            score += hist[root] * .1 + (.18 if i == 0 else 0)
            score += .15 if previous == i else 0
            score += .25 if previous == 2 and i == 0 else 0
            scores.append(score)
        previous = max(range(len(scores)), key=scores.__getitem__)
        root, quality = candidates[previous]
        symbols.append(_event(root, quality, start, beats, key, 'automatic'))
        generated_notes.append(dict(midi=[48 + root + i for i in QUALITIES[quality]],
                                    start=start, dur=beats))

    if generated_notes:
        if chord_track is None:
            chord_track = dict(id='chords', name='和弦', type='notes', volume=.35, notes=[])
            tracks.append(chord_track)
        chord_track['notes'].extend(generated_notes)
        chord_track['notes'].sort(key=lambda n: n['start'])
    # Existing nonempty bass is left intact. Missing bass follows known symbols;
    # unknown qualities/roots are left silent rather than guessed.
    if bass_track is None or not bass_track.get('notes'):
        bass_notes = []
        for s in sorted(symbols, key=lambda s: s['start']):
            if s.get('quality') not in QUALITIES or not isinstance(s.get('root'), int):
                continue
            start, dur = max(0, s['start']), min(s['dur'], total - s['start'])
            if dur <= EPS:
                continue
            root = s['root'] % 12
            bass_notes.append(dict(midi=36 + root, start=start, dur=min(1, dur)))
            if dur > 1 + EPS:
                bass_notes.append(dict(midi=36 + (root + 7) % 12, start=start + 1,
                                       dur=dur - 1))
        if bass_notes:
            if bass_track is None:
                bass_track = dict(id='bass', name='貝斯', type='notes', volume=.4, notes=[])
                tracks.append(bass_track)
            bass_track['notes'] = bass_notes
    symbols.sort(key=lambda s: s['start'])
    return result
