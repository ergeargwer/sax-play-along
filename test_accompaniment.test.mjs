import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { voiceLead, arrangeAccompaniment } from './static/js/accompaniment.js';
import { InstrumentBank } from './static/js/instruments.js';
import { TrackManager } from './static/js/tracks.js';

const fixture = () => ({ id:'amazing-grace',keyConcert:'C',timeSignature:[3,4],measures:3,
  melody:[{midi:67,start:0,dur:9}],
  chordSymbols:[{root:0,start:0,dur:3},{root:5,start:3,dur:3},{root:0,start:6,dur:3}],
  tracks:[{id:'chords',type:'notes',volume:.5,notes:[
    {midi:[48,52,55],start:0,dur:3},{midi:[53,57,60],start:3,dur:3},{midi:[48,52,55],start:6,dur:3}]},
    {id:'bass',type:'notes',volume:.6,notes:[{midi:36,start:0,dur:9}]}] });

test('3/4 plays bass on beat one, quiet piano on two/three, ending settles', () => {
  const song = fixture(), before = structuredClone(song);
  const result = arrangeAccompaniment(song);
  assert.deepEqual(result[0].notes.slice(0,4).map(n=>n.start),[1,2,4,5]);
  assert.deepEqual(result[1].notes.map(n=>n.start),[0,3,6]);
  assert.equal(result[0].notes.at(-1).start,6);
  assert.ok(result[0].notes.at(-1).dur > 2);
  assert.ok(result[0].notes[0].velocity > result[0].notes[1].velocity);
  assert.deepEqual(song,before);
});

test('voicings preserve chord pitch classes with modest movement and clear register', () => {
  let previous=[];
  for(const pitches of [[48,52,55],[53,57,60],[55,59,62,65],[48,52,55]]) {
    const voiced=voiceLead(pitches,previous);
    assert.deepEqual(new Set(voiced.map(n=>n%12)),new Set(pitches.map(n=>n%12)));
    assert.ok(voiced.every(n=>n>=54 && n<=78));
    if(previous.length===voiced.length) assert.ok(voiced.reduce((sum,n,i)=>sum+Math.abs(n-previous[i]),0)<=12);
    previous=voiced;
  }
});

test('pickup and silent measures do not get spurious accompaniment; events stay in bounds', () => {
  const song=fixture(); song.melody=[{midi:67,start:2,dur:1},{midi:60,start:6,dur:2}];
  const tracks=arrangeAccompaniment(song);
  for(const track of tracks) for(const n of track.notes) {
    assert.ok(n.start>=2 && n.start+n.dur<=8+1e-6);
    assert.ok(!(n.start>=3 && n.start<6));
    assert.ok(n.dur>0);
  }
});

test('mid-measure harmony changes are preserved, never scheduled before source onset', () => {
  const song=fixture(); song.tracks[0].notes=[{midi:[48,52,55],start:0,dur:1.5},
    {midi:[55,59,62,65],start:1.5,dur:1.5}];
  const notes=arrangeAccompaniment(song)[0].notes;
  assert.ok(notes.some(n=>n.start===1.5));
  assert.ok(notes.filter(n=>n.start<1.5).every(n=>n.start+n.dur<=1.5));
});

test('4/4 ballad uses sparse arpeggios; action theme retains its rhythm', () => {
  const song=fixture(); song.timeSignature=[4,4]; song.measures=2; song.melody=[{midi:60,start:0,dur:8}];
  song.tracks[0].notes=[{midi:[48,52,55],start:0,dur:4},{midi:[48,52,55],start:4,dur:4}];
  const arranged=arrangeAccompaniment(song);
  assert.deepEqual(arranged[0].notes.slice(0,4).map(n=>n.start),[0,1,2,3]);
  assert.ok(arranged[0].notes.slice(0,4).every(n=>n.midi.length===1));
  song.id='detective-conan';
  const action=arrangeAccompaniment(song);
  assert.deepEqual(action.filter(t=>t.id!=='guitar'),song.tracks);
  assert.ok(action.find(t=>t.id==='guitar').notes.length);
});

test('all eight songs produce finite, bounded events without changing their source', () => {
  const paths=['data/songs','data/trials/musicxml'].flatMap(dir=>fs.readdirSync(dir)
    .filter(file=>file.endsWith('.json')).map(file=>`${dir}/${file}`));
  for(const path of paths) {
    const song=JSON.parse(fs.readFileSync(path)), before=structuredClone(song);
    const total=song.measures*song.timeSignature[0];
    for(const track of arrangeAccompaniment(song)) for(const n of track.notes) {
      assert.ok(Number.isFinite(n.start) && n.start>=0 && n.dur>0 && n.start+n.dur<=total+1e-5,path);
    }
    assert.deepEqual(song,before);
  }
});


test('bank decodes once per context and selects nearby pitch/velocity', async () => {
  let fetched=0,decoded=0;
  const manifest={instruments:{piano:[{root:60,velocity:60,file:'soft'},{root:60,velocity:88,file:'medium'},
    {root:63,velocity:60,file:'higher'}],'acoustic-bass':[{root:36,velocity:80,file:'bass'}],
    'nylon-guitar':[{root:60,velocity:56,file:'guitar'}]}};
  const bank=new InstrumentBank(async path=>{fetched++;return {ok:true,json:async()=>manifest,arrayBuffer:async()=>new ArrayBuffer(4)};});
  const ctx={decodeAudioData:async()=>{decoded++;return {duration:4};}};
  await Promise.all([bank.load(ctx),bank.load(ctx)]);
  assert.equal(fetched,6);assert.equal(decoded,5);
  assert.equal(bank.select('piano',61,.45).file,'soft');
  assert.equal(bank.select('piano',60,.75).file,'medium');
  assert.equal(bank.select('piano',64,.5).file,'higher');
});

test('failed sample load reports failure and can retry', async () => {
  let fail=true;
  const manifest={instruments:{piano:[{root:60,velocity:60,file:'piano'}],'acoustic-bass':[{root:36,velocity:80,file:'bass'}],
    'nylon-guitar':[{root:60,velocity:56,file:'guitar'}]}};
  const bank=new InstrumentBank(async path=>({ok:!(fail&&!path.endsWith('json')),json:async()=>manifest,arrayBuffer:async()=>new ArrayBuffer(4)}));
  const ctx={decodeAudioData:async()=>({duration:4})};
  await assert.rejects(bank.load(ctx),/音色載入失敗/);
  fail=false;await bank.load(ctx);assert.ok(bank.select('piano',60));
});



test('guitar complements piano on offbeats, stays in harmony and has low default volume', () => {
  const song=fixture(),original=structuredClone(song);
  const guitar=arrangeAccompaniment(song).find(t=>t.id==='guitar');
  assert.equal(guitar.volume,.25);
  assert.deepEqual(guitar.notes.slice(0,3).map(n=>n.start),[.5,1.5,2.5]);
  for(const note of guitar.notes) {
    const chord=song.tracks[0].notes.find(c=>c.start<=note.start && c.start+c.dur>note.start);
    const pcs=new Set(chord.midi.map(n=>n%12));
    assert.ok(note.midi.every(m=>pcs.has(m%12)));
    assert.ok(note.start+note.dur<=chord.start+chord.dur+1e-6);
  }
  assert.ok(guitar.notes.at(-1).start>6);
  assert.deepEqual(song,original);
});

test('authored guitar is preserved by the gentle accompaniment', () => {
  const song=fixture();
  const authored={id:'guitar',type:'notes',volume:.2,notes:[{midi:[55],start:0,dur:2}]};
  song.tracks.push(authored);
  assert.deepEqual(arrangeAccompaniment(song).find(t=>t.id==='guitar'),authored);
});



test('fixed gentle accompaniment adds missing bass and guitar without changing the source', () => {
  const song=fixture();song.tracks=song.tracks.filter(t=>t.id!=='bass');
  const original=structuredClone(song),tm=new TrackManager();tm.init(song);
  assert.equal(tm.getTrack('chords').notes[0].start,1);
  assert.ok(tm.getTrack('bass').notes.length);
  assert.ok(tm.getTrack('guitar').notes.length);
  tm.setVolume('guitar',.15);tm.setMute('bass',true);tm.setSolo('guitar',true);
  assert.equal(tm.getEffectiveGain('guitar'),.15);
  assert.equal(tm.getEffectiveGain('chords'),0);
  assert.equal(tm.getEffectiveGain('bass'),0);
  assert.deepEqual(song,original);
});
