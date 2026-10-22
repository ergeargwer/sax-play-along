"""Harmony generation, preservation, loader integration and MusicXML regression tests."""
from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import app
from harmonizer import harmonize_song
from tools.trial_musicxml import convert


def song(melody=None, measures=2):
    return dict(id='test', title='test', composer='', license='test', keyConcert='C',
                timeSignature=[3, 4], tempo=80, measures=measures,
                melody=melody if melody is not None else [
                    dict(midi=60, start=0, dur=1), dict(midi=64, start=1, dur=1),
                    dict(midi=67, start=2, dur=1), dict(midi=65, start=3, dur=1),
                    dict(midi=69, start=4, dur=1), dict(midi=72, start=5, dur=1)],
                tracks=[dict(id='melody-guide', name='旋律', type='melody', volume=.6)])


class HarmonyTests(unittest.TestCase):
    def test_symbols_and_playable_tracks(self):
        result = harmonize_song(song())
        self.assertEqual([s['symbol'] for s in result['chordSymbols']], ['C', 'F'])
        self.assertEqual(app.validate_song(result, 'test'), [])
        self.assertEqual({t['id'] for t in result['tracks']}, {'melody-guide', 'chords', 'bass'})
        for track in result['tracks']:
            for event in track.get('notes', []):
                self.assertGreater(event['dur'], 0)
                self.assertLessEqual(event['start'] + event['dur'], 6)

    def test_no_mutation_and_idempotent(self):
        original = song()
        before = deepcopy(original)
        result = harmonize_song(original)
        self.assertEqual(before, original)
        self.assertEqual(result, harmonize_song(result))

    def test_cross_bar_sustain_and_rest(self):
        result = harmonize_song(song([dict(midi=60, start=2, dur=3), dict(midi=0, start=5, dur=1)]))
        self.assertEqual([s['symbol'] for s in result['chordSymbols']], ['C', 'C'])
        self.assertEqual(harmonize_song(song([dict(midi=0,start=0,dur=6)]))['chordSymbols'], [])

    def test_flat_concert_key(self):
        source = song([dict(midi=63,start=0,dur=3)], measures=1)
        source['keyConcert'] = 'Eb'
        result = harmonize_song(source)
        self.assertEqual(result['chordSymbols'][0]['symbol'], 'Eb')
        self.assertEqual(result['chordSymbols'][0]['root'], 3)

    def test_authoritative_inverted_minor_and_bass(self):
        source = song()
        tracks = [dict(id='chords',name='和弦',type='notes',volume=.5,
                       notes=[dict(midi=[60,64,69],start=0,dur=3)]),
                  dict(id='bass',name='貝斯',type='notes',volume=.6,
                       notes=[dict(midi=45,start=0,dur=6)])]
        source['tracks'].extend(deepcopy(tracks))
        result = harmonize_song(source)
        self.assertEqual(result['chordSymbols'][0]['symbol'], 'Am')
        self.assertEqual(result['tracks'][1]['notes'][0], tracks[0]['notes'][0])
        self.assertEqual(result['tracks'][2], tracks[1])

    def test_unknown_voicing_never_overwritten(self):
        source = song(measures=1)
        source['melody'] = source['melody'][:3]
        track = dict(id='chords',name='和弦',type='notes',volume=.5,
                     notes=[dict(midi=[60,61,67],start=0,dur=3)])
        source['tracks'].append(track)
        result = harmonize_song(source)
        self.assertEqual(result['tracks'][1], track)
        self.assertEqual(result['chordSymbols'], [])

    def test_augmented_chord_uses_lowest_sounding_root(self):
        source = song([dict(midi=67, start=0, dur=3)], measures=1)
        source['tracks'].append(dict(id='chords', name='和弦', type='notes', volume=.5,
                                    notes=[dict(midi=[39,43,47],start=0,dur=3)]))
        source['keyConcert'] = 'Ab'
        self.assertEqual(harmonize_song(source)['chordSymbols'][0]['symbol'], 'Ebaug')

    def test_existing_split_bar_chords(self):
        source = song()
        source['tracks'].append(dict(id='chords',name='和弦',type='notes',volume=.5,
            notes=[dict(midi=[60,64,67],start=0,dur=1),dict(midi=[55,59,62,65],start=1,dur=2)]))
        result = harmonize_song(source)
        self.assertEqual([(s['symbol'],s['start']) for s in result['chordSymbols']], [('C',0),('G7',1),('F',3)])

    def test_explicit_symbol_wins_and_gets_audio(self):
        source = song()
        source['chordSymbols'] = [dict(symbol='Dm7',start=0,dur=3)]
        result = harmonize_song(source)
        self.assertEqual(result['chordSymbols'][0]['symbol'],'Dm7')
        chord_track = next(t for t in result['tracks'] if t['id']=='chords')
        self.assertEqual(chord_track['notes'][0]['midi'], [50,53,57,60])
        self.assertEqual(harmonize_song(result), result)

    def test_invalid_symbols_and_unsupported_modes(self):
        for symbols in (None, [{}], [dict(symbol='C',start=float('nan'),dur=3)]):
            source = song(); source['chordSymbols'] = symbols
            with self.assertRaises(ValueError): harmonize_song(source)
            self.assertTrue(app.validate_song(source, "invalid.json"))
        for field, value in [('keyConcert','?'),('mode','minor'),('timeSignature',[6,8])]:
            source = song(); source[field] = value
            with self.assertRaises(ValueError): harmonize_song(source)

    def test_load_enriches_without_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'song.json'
            text = json.dumps(song()); path.write_text(text)
            with patch.object(app, 'SONGS_DIR', Path(directory)):
                loaded = app.load_songs()
            self.assertEqual(len(loaded['test']['chordSymbols']),2)
            self.assertEqual(path.read_text(), text)

    def test_all_existing_songs_keep_accompaniment(self):
        root = Path(__file__).parent
        for path in (root / 'data/songs').glob('*.json'):
            source = json.loads(path.read_text())
            result = harmonize_song(source)
            for track in source['tracks']:
                if track['id'] in ('chords','bass') and track.get('notes'):
                    self.assertEqual(next(t for t in result['tracks'] if t['id']==track['id']),track)
            self.assertTrue(result['chordSymbols'])
            self.assertEqual(app.validate_song(result,path.name),[])

    def test_musicxml_conversion_is_automatically_harmonized(self):
        xml = '''<score-partwise><part id="P1"><measure number="1"><attributes>
            <divisions>1</divisions><key><fifths>0</fifths></key>
            <time><beats>3</beats><beat-type>4</beat-type></time></attributes>
            <note><pitch><step>C</step><octave>5</octave></pitch><duration>3</duration>
            <type>half</type><dot/></note></measure></part></score-partwise>'''
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'example.musicxml'; path.write_text(xml)
            result = convert(path,'example',80,-9)
        self.assertEqual(result['keyConcert'],'Eb')
        self.assertEqual(result['chordSymbols'][0]['symbol'],'Eb')
        self.assertEqual(result['melody'][0]['notation']['writtenPitch']['step'],'C')


if __name__ == '__main__':
    unittest.main()
