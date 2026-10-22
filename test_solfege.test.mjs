import test from 'node:test';
import assert from 'node:assert/strict';
import { midiToSolfege, midiToJianpu, concertToWrittenMidi, concertToWrittenKey } from './static/js/pitch.js';

test('movable-do scale follows the key, including the Eb sax written transposition', () => {
  const writtenKey=concertToWrittenKey('C').writtenKey;
  const scale=[60,62,64,65,67,69,71].map(concertToWrittenMidi);
  assert.deepEqual(scale.map(m=>midiToSolfege(m,writtenKey).text),['Do','Re','Mi','Fa','Sol','La','Si']);
  assert.equal(midiToSolfege(63,'Eb').text,'Do');
  assert.equal(midiToSolfege(67,'G').text,'Do');
});

test('chromatic notes preserve the numbered notation prefixes and octave dots', () => {
  assert.deepEqual(Array.from({length:12},(_,i)=>midiToSolfege(60+i,'C').text),
    ['Do','#Do','Re','bMi','Mi','Fa','#Fa','Sol','#Sol','La','bSi','Si']);
  assert.equal(midiToSolfege(72,'C').text,'Do\u0307');
  assert.equal(midiToSolfege(48,'C').text,'Do\u0323');
  for(const key of ['C','A','Eb','F#'])for(let midi=48;midi<=84;midi++) {
    const actual=midiToSolfege(midi,key),numbered=midiToJianpu(midi,key);
    assert.equal(actual.degree,numbered.degree);
    assert.equal(actual.prefix,numbered.prefix);
    assert.equal(actual.octaveDots,numbered.octaveDots);
  }
});

test('rests and invalid input follow the existing pitch rules', () => {
  assert.equal(midiToSolfege(0,'C').text,'休止');
  assert.equal(midiToSolfege(0,'C').syllable,null);
  assert.throws(()=>midiToSolfege(-1,'C'));
  assert.throws(()=>midiToSolfege(60,'unknown'));
});
