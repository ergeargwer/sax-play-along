/**
 * test_tracks.test.mjs -- 階段 4 多音軌與 Mute/Solo 邏輯單元測試
 * 使用 node --test 執行
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  midiToFrequency,
  resolveTrackGain,
  getEventsInBeatWindow,
  TrackManager,
} from './static/js/tracks.js';

test('4.1 MIDI 號碼轉換為 Hz 頻率 (midiToFrequency)', () => {
  assert.equal(midiToFrequency(69), 440); // A4
  assert.equal(midiToFrequency(60), 440 * Math.pow(2, -9 / 12)); // C4 ~ 261.63
  assert.equal(midiToFrequency(0), 0);
  assert.equal(midiToFrequency(-1), 0);
  assert.equal(midiToFrequency(null), 0);
});

test('4.2 音軌 Gain 與 Mute / Solo 解析 (resolveTrackGain)', () => {
  const tracks = [
    { id: 'melody-guide', volume: 0.6, isMuted: false, isSolo: false },
    { id: 'chords', volume: 0.5, isMuted: false, isSolo: false },
    { id: 'bass', volume: 0.8, isMuted: false, isSolo: false },
    { id: 'metronome', volume: 0.7, isMuted: false, isSolo: false },
  ];

  // 1. 無 Solo, 無 Mute -> 回傳原本音量
  assert.equal(resolveTrackGain(tracks[0], tracks), 0.6);
  assert.equal(resolveTrackGain(tracks[2], tracks), 0.8);

  // 2. Mute 優先判定 -> Gain 應為 0
  tracks[0].isMuted = true;
  assert.equal(resolveTrackGain(tracks[0], tracks), 0);

  // 3. 啟用 Solo
  tracks[0].isMuted = false;
  tracks[1].isSolo = true; // 和弦軌開 Solo

  // 開 Solo 的軌道正常發聲
  assert.equal(resolveTrackGain(tracks[1], tracks), 0.5);
  // 未開 Solo 的軌道皆被靜音
  assert.equal(resolveTrackGain(tracks[0], tracks), 0);
  assert.equal(resolveTrackGain(tracks[2], tracks), 0);

  // 4. 開 Solo 卻被 Mute -> 無聲
  tracks[1].isMuted = true;
  assert.equal(resolveTrackGain(tracks[1], tracks), 0);
});

test('4.3 時間視窗內音軌事件提取 (getEventsInBeatWindow)', () => {
  const melody = [
    { midi: 60, start: 0, dur: 1 },
    { midi: 62, start: 1, dur: 1 },
    { midi: 64, start: 2, dur: 2 },
  ];

  const melodyTrack = { type: 'melody' };

  // [0, 1.5) 區間應提取第 0, 1 音符
  const eventsInWindow = getEventsInBeatWindow(melodyTrack, melody, 0, 1.5);
  assert.equal(eventsInWindow.length, 2);
  assert.deepEqual(eventsInWindow[0].midi, [60]);
  assert.deepEqual(eventsInWindow[1].midi, [62]);

  // 和弦軌道多音測試
  const chordTrack = {
    type: 'notes',
    notes: [
      { midi: [48, 52, 55], start: 0, dur: 4 },
      { midi: [43, 47, 50], start: 4, dur: 4 },
    ],
  };

  const chordEvents = getEventsInBeatWindow(chordTrack, [], 0, 1);
  assert.equal(chordEvents.length, 1);
  assert.deepEqual(chordEvents[0].midi, [48, 52, 55]);
});

test('4.4 TrackManager 實體狀態管理', () => {
  const tm = new TrackManager();
  const sampleSong = {
    melody: [{ midi: 60, start: 0, dur: 1 }],
    tracks: [
      { id: 'melody-guide', name: '旋律導奏', type: 'melody', volume: 0.6 },
      { id: 'chords', name: '和弦', type: 'notes', volume: 0.4, notes: [] },
    ],
  };

  tm.init(sampleSong);
  assert.equal(tm.getAllTracks().length, 2);

  // 音量調整
  tm.setVolume('chords', 0.9);
  assert.equal(tm.getTrack('chords').volume, 0.9);

  // Mute / Solo
  tm.setMute('melody-guide', true);
  assert.equal(tm.getEffectiveGain('melody-guide'), 0);

  tm.setMute('melody-guide', false);
  tm.setSolo('chords', true);
  assert.equal(tm.getEffectiveGain('chords'), 0.9);
  assert.equal(tm.getEffectiveGain('melody-guide'), 0);
});

console.log('=== 階段 4 音軌單元測試全數通過 ===');
