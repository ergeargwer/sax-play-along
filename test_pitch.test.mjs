import assert from 'node:assert/strict';
import {
  concertToWrittenMidi,
  concertToWrittenKey,
  midiToNoteName,
  midiToVexFlowKey,
  midiToJianpu,
  getVexFlowKeySignature,
  durationToVexFlow
} from './static/js/pitch.js';

console.log('=== 開始執行 pitch.js 單元測試 ===\n');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

// 1. 中音薩克斯風移調測試 (Concert + 9 = Written)
test('1.1 實際 MIDI 轉寫定 MIDI (C4 -> A4)', () => {
  assert.equal(concertToWrittenMidi(60), 69);
});

test('1.2 休止符 (0) 移調保持為 0', () => {
  assert.equal(concertToWrittenMidi(0), 0);
});

test('1.3 邊界 MIDI 轉寫定 MIDI (A0=21 -> F1=30)', () => {
  assert.equal(concertToWrittenMidi(21), 30);
});

test('1.4 MIDI 超過範圍拋出例外', () => {
  assert.throws(() => concertToWrittenMidi(20), /MIDI 號碼須為 0/);
  assert.throws(() => concertToWrittenMidi(109), /MIDI 號碼須為 0/);
  assert.throws(() => concertToWrittenMidi(-1), /MIDI 號碼須為 0/);
});

test('1.5 非整數 MIDI 拋出例外', () => {
  assert.throws(() => concertToWrittenMidi(60.5), /MIDI 號碼須為整數/);
  assert.throws(() => concertToWrittenMidi('60'), /MIDI 號碼須為整數/);
});

// 2. 調性推算測試
test('2.1 C 大數實際調 -> A 大調寫定調 (3 升)', () => {
  const result = concertToWrittenKey('C');
  assert.equal(result.writtenKey, 'A');
  assert.equal(result.accidentalCount, 3);
  assert.equal(result.accidentalType, 'sharp');
});

test('2.2 Eb 大數實際調 -> C 大調寫定調 (無升降)', () => {
  const result = concertToWrittenKey('Eb');
  assert.equal(result.writtenKey, 'C');
  assert.equal(result.accidentalCount, 0);
  assert.equal(result.accidentalType, 'none');
});

test('2.3 F 大數實際調 -> D 大調寫定調 (2 升)', () => {
  const result = concertToWrittenKey('F');
  assert.equal(result.writtenKey, 'D');
  assert.equal(result.accidentalCount, 2);
  assert.equal(result.accidentalType, 'sharp');
});

test('2.4 未知調性拋出例外', () => {
  assert.throws(() => concertToWrittenKey('XYZ'), /未知的實際調性/);
  assert.throws(() => concertToWrittenKey(''), /未知的實際調性/);
});

// 3. 音名轉換測試
test('3.1 MIDI 60 (C4) 轉音名', () => {
  const res = midiToNoteName(60, 'C');
  assert.equal(res.name, 'C');
  assert.equal(res.octave, 4);
  assert.equal(res.fullName, 'C4');
});

test('3.2 休止符 (0) 回傳 "R"', () => {
  const res = midiToNoteName(0, 'C');
  assert.equal(res.name, 'R');
  assert.equal(res.octave, null);
  assert.equal(res.fullName, 'R');
});

test('3.3 降記號調 (F 大調) 音位拼寫使用 降記號', () => {
  const res = midiToNoteName(70, 'F'); // Bb4
  assert.equal(res.name, 'Bb');
  assert.equal(res.octave, 4);
  assert.equal(res.fullName, 'Bb4');
});

test('3.4 升記號調 (G 大調) 音位拼寫使用 升記號', () => {
  const res = midiToNoteName(66, 'G'); // F#4
  assert.equal(res.name, 'F#');
  assert.equal(res.octave, 4);
  assert.equal(res.fullName, 'F#4');
});

test('3.5 音名轉換非法參數拋出例外', () => {
  assert.throws(() => midiToNoteName(150, 'C'), /MIDI 號碼須為 0/);
  assert.throws(() => midiToNoteName(60, 'UnknownKey'), /未知的調性/);
});

// 4. 首調簡譜轉換測試
test('4.1 休止符 (0) 簡譜為 "0"', () => {
  const res = midiToJianpu(0, 'A');
  assert.equal(res.text, '0');
  assert.equal(res.degree, null);
  assert.equal(res.prefix, '');
  assert.equal(res.octaveDots, 0);
});

test('4.2 A 大調下 A4 (MIDI 69) 為 1', () => {
  const res = midiToJianpu(69, 'A');
  assert.equal(res.degree, 1);
  assert.equal(res.prefix, '');
  assert.equal(res.octaveDots, 0);
});

test('4.3 A 大調下 B4 (MIDI 71) 為 2', () => {
  const res = midiToJianpu(71, 'A');
  assert.equal(res.degree, 2);
  assert.equal(res.prefix, '');
});

test('4.4 A 大調下 C#5 (MIDI 73) 為 3', () => {
  const res = midiToJianpu(73, 'A');
  assert.equal(res.degree, 3);
  assert.equal(res.prefix, '');
});

test('4.5 A 大調下高八度 A5 (MIDI 81) 簡譜帶高八度點', () => {
  const res = midiToJianpu(81, 'A');
  assert.equal(res.degree, 1);
  assert.equal(res.octaveDots, 1);
  assert.ok(res.text.includes('\u0307'));
});

test('4.6 A 大調下低八度 A3 (MIDI 57) 簡譜帶低八度點', () => {
  const res = midiToJianpu(57, 'A');
  assert.equal(res.degree, 1);
  assert.equal(res.octaveDots, -1);
  assert.ok(res.text.includes('\u0323'));
});

test('4.7 簡譜轉換非法輸入拋出例外', () => {
  assert.throws(() => midiToJianpu(150, 'C'), /MIDI 號碼須為 0/);
  assert.throws(() => midiToJianpu(60, 'Invalid'), /未知的調性/);
});

// 5. VexFlow 轉換工具測試
test('5.1 VexFlow 音符鍵格式轉換', () => {
  assert.equal(midiToVexFlowKey(60, 'C'), 'c/4');
  assert.equal(midiToVexFlowKey(66, 'G'), 'f#/4');
  assert.equal(midiToVexFlowKey(0, 'C'), 'b/4');
});

test('5.2 拍數轉 VexFlow 時值', () => {
  assert.equal(durationToVexFlow(4), 'w');
  assert.equal(durationToVexFlow(2), 'h');
  assert.equal(durationToVexFlow(1), 'q');
  assert.equal(durationToVexFlow(0.5), '8');
  assert.equal(durationToVexFlow(1.5), 'qd');
  assert.throws(() => durationToVexFlow(0.1234), /無法將/);
});

console.log(`\n=== 測試完成: 通過 ${passed} / ${total} 項 ===\n`);
if (passed !== total) {
  process.exit(1);
}
