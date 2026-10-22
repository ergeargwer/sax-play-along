import assert from 'node:assert/strict';
import test from 'node:test';
import { writtenChordSymbol, chordsInMeasure } from './static/js/harmony.js';

test('Eb alto sax labels transpose chord root and slash bass, preserving quality', () => {
  assert.equal(writtenChordSymbol('Eb', 'Eb'), 'C');
  assert.equal(writtenChordSymbol('Ab', 'Eb'), 'F');
  assert.equal(writtenChordSymbol('Bb7', 'Eb'), 'G7');
  assert.equal(writtenChordSymbol('Cm7', 'Eb'), 'Am7');
  assert.equal(writtenChordSymbol('C/E', 'C'), 'A/C#');
  assert.equal(writtenChordSymbol('N.C.', 'C'), 'N.C.');
});

test('split-bar and sustained chord labels use exclusive measure end', () => {
  const song = {keyConcert:'Eb',timeSignature:[3,4],chordSymbols:[
    {symbol:'Eb',start:0,dur:1}, {symbol:'Bb7',start:1,dur:3},
    {symbol:'Ab',start:4,dur:2},
  ]};
  assert.deepEqual(chordsInMeasure(song,0).map(s => [s.writtenSymbol,s.displayBeat]), [['C',0],['G7',1]]);
  assert.deepEqual(chordsInMeasure(song,1).map(s => [s.writtenSymbol,s.displayBeat]), [['G7',3],['F',4]]);
  assert.deepEqual(chordsInMeasure(song,2), []);
  assert.deepEqual(chordsInMeasure({keyConcert:'C'},0), []);
});
