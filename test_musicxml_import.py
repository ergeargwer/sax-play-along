"""Explicit PDF corrections and single-file MusicXML import regressions."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from tools.trial_musicxml import convert
from app import validate_song

XML = '''<score-partwise><part id="P1"><measure number="6"><attributes>
<divisions>2</divisions><key><fifths>3</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time>
</attributes>{notes}</measure></part></score-partwise>'''
NOTES = ''.join(f'<note><pitch><step>E</step><octave>4</octave></pitch><duration>{d}</duration><type>{t}</type>{dot}</note>'
                for d,t,dot in [(2,'quarter',''),(1,'eighth',''),(1,'eighth',''),(3,'quarter','<dot/>'),(2,'quarter','')])
CORRECTION = {'measure':'6','note':5,'expected':{'duration':'2','type':'quarter'},
              'replacement':{'duration':'1','type':'eighth'}}


class MusicXMLImportTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path=Path(self.directory.name)/'source.musicxml'
        self.text=XML.format(notes=NOTES)
        self.path.write_text(self.text)

    def test_unrepaired_extra_half_beat_rejected(self):
        with self.assertRaisesRegex(ValueError,'9/2 != 4'):
            convert(self.path,'test',80,-9)

    def test_explicit_correction_keeps_source_unchanged(self):
        song=convert(self.path,'test',80,-9,[CORRECTION])
        self.assertEqual(sum(n['dur'] for n in song['melody']),4)
        self.assertEqual(song['melody'][-1]['dur'],.5)
        self.assertEqual(song['melody'][-1]['notation']['type'],'eighth')
        self.assertEqual(song['keyConcert'],'C')
        self.assertEqual(song['importInfo']['noteCorrections'],[CORRECTION])
        self.assertEqual(self.path.read_text(),self.text)
        self.assertEqual(validate_song(song,'test'),[])

    def test_source_guard_prevents_wrong_or_repeated_patch(self):
        wrong={**CORRECTION,'expected':{'duration':'99','type':'quarter'}}
        with self.assertRaisesRegex(ValueError,'source mismatch'):
            convert(self.path,'test',80,-9,[wrong])
        with self.assertRaisesRegex(ValueError,'source mismatch'):
            convert(self.path,'test',80,-9,[CORRECTION,CORRECTION])

    def test_missing_target_rejected(self):
        with self.assertRaisesRegex(ValueError,'target missing'):
            convert(self.path,'test',80,-9,[{**CORRECTION,'measure':'99'}])

    def test_single_file_cli_and_safe_output_id(self):
        root=Path(__file__).parent
        patch=Path(self.directory.name)/'patch.json';patch.write_text(json.dumps([CORRECTION]))
        output=Path(self.directory.name)/'output'
        command=[sys.executable,str(root/'tools/trial_musicxml.py'),str(self.path),str(output),
                 '--tempo','80','--transpose','-9','--song-id','example', '--corrections',str(patch)]
        subprocess.run(command,check=True,capture_output=True)
        self.assertEqual(json.loads((output/'example.json').read_text())['measures'],1)
        command[command.index('example')]='../escape'
        result=subprocess.run(command,capture_output=True)
        self.assertNotEqual(result.returncode,0)
        self.assertFalse((output.parent/'escape.json').exists())


if __name__=='__main__':
    unittest.main()
