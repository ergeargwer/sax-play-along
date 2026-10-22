import test from 'node:test';
import assert from 'node:assert/strict';
import { Scheduler, PlaybackState } from './static/js/scheduler.js';

globalThis.document = { getElementById: () => null };
function fixture() {
  let now = 0;
  const scheduler = new Scheduler({ getAudioTime: () => now });
  scheduler.init({ tempo: 60, timeSignature: [4, 4], measures: 2,
    melody: [{ midi: 60, start: 0, dur: 1 }, { midi: 62, start: 3, dur: 1 }],
    tracks: [{ id: 'melody-guide', type: 'melody', volume: 1 }] });
  scheduler.state = PlaybackState.PLAYING;
  scheduler.playClick = () => {};
  const notes = [];
  scheduler.trackManager.playNote = (...args) => notes.push(args);
  return { scheduler, notes, at: value => { now = value; } };
}
test('循環最後一拍完整播放，跨邊界預排下一輪且不重複', () => {
  const { scheduler: s, notes, at } = fixture();
  s.setLoopRange(1, 1, true);
  at(3); s.schedulerTick(); s.updateCursorAndHighlight();
  assert.equal(s.anchorTime, 0);
  assert.equal(notes[0][2], 3);
  at(3.95); s.schedulerTick(); s.schedulerTick();
  assert.equal(notes.length, 2);
  assert.equal(notes[1][2], 4);
  at(7.95); s.schedulerTick();
  assert.equal(notes.at(-1)[2], 8);
});
test('預備拍期間便預排歌曲首音，不依賴動畫幀', () => {
  const { scheduler: s, notes, at } = fixture();
  s.state = PlaybackState.COUNT_IN;
  s.anchorTime = 4;
  at(3.95); s.schedulerTick();
  assert.equal(notes.length, 1);
  assert.equal(notes[0][2], 4);
});
test('暫停、停止取消發聲；換曲重設速度與循環', () => {
  const { scheduler: s } = fixture();
  let stopped = 0;
  s.trackManager.activeVoices.add({ stop() { stopped++; }, disconnect() {} });
  s.pause();
  assert.equal(stopped, 1);
  assert.equal(s.trackManager.activeVoices.size, 0);
  s.tempoRatio = 0.5; s.loopEnabled = true;
  s.init(s.song);
  assert.equal(s.tempoRatio, 1);
  assert.equal(s.loopEnabled, false);
});

test('音色載入期間停止或換曲，不會在載入完成後突然播放', async () => {
  const { scheduler: s }=fixture();
  s.state=PlaybackState.IDLE;
  let ready;
  s.ensureAudioContext=()=>new Promise(resolve=>{ready=resolve;});
  let started=0;s.startSchedulerLoop=()=>{started++;};s.startAnimFrameLoop=()=>{};
  const pending=s.play();s.stop();ready();await pending;
  assert.equal(s.state,PlaybackState.IDLE);assert.equal(started,0);
  const another=s.play();s.init({...s.song,id:'another-song'});ready();await another;
  assert.equal(s.state,PlaybackState.IDLE);assert.equal(started,0);
});
