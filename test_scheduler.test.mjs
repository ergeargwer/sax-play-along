import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bpmToBeatDuration,
  calculateBeatFromAudioTime,
  calculateAudioTimeForBeat,
  updateTempoAnchor,
  findActiveNoteAtBeat,
  wrapLoopBeat,
  generateBeatSequence,
} from './static/js/schedulerMath.js';

// ---------------------------------------------------------------------------
// 一、純計算函式測試 (Pure Function Tests)
// ---------------------------------------------------------------------------

test('1.1 BPM 轉單拍秒數計算', () => {
  assert.equal(bpmToBeatDuration(60), 1.0);
  assert.equal(bpmToBeatDuration(120), 0.5);
  assert.equal(bpmToBeatDuration(96), 0.625);
  assert.throws(() => bpmToBeatDuration(0), /BPM 必須為正數/);
});

test('1.2 音訊時間與拍數雙向轉換', () => {
  const anchorTime = 10.0;
  const anchorBeat = 0;
  const baseBpm = 120; // 每拍 0.5 秒
  const tempoRatio = 1.0;

  // 經過 2 秒 -> 增加 4 拍
  const beat = calculateBeatFromAudioTime(12.0, anchorTime, anchorBeat, baseBpm, tempoRatio);
  assert.equal(beat, 4);

  // 計算第 4 拍的音訊時間 -> 12.0 秒
  const time = calculateAudioTimeForBeat(4, anchorTime, anchorBeat, baseBpm, tempoRatio);
  assert.equal(time, 12.0);
});

test('1.3 動態變速前後拍位置保持連續 (無跳位、無重來)', () => {
  const baseBpm = 100;
  let anchorTime = 0.0;
  let anchorBeat = 0;
  let tempoRatio = 1.0; // 100% (100 BPM)

  // 播放 3 秒後 (當前時間 3.0s -> 當前拍數 5.0)
  const timeAtChange = 3.0;
  const currentBeat = calculateBeatFromAudioTime(timeAtChange, anchorTime, anchorBeat, baseBpm, tempoRatio);
  assert.equal(currentBeat, 5.0);

  // 使用者將速度調為 50% (50 BPM)
  const newAnchor = updateTempoAnchor(timeAtChange, currentBeat, 0.5);
  anchorTime = newAnchor.anchorTime;
  anchorBeat = newAnchor.anchorBeat;
  tempoRatio = newAnchor.tempoRatio;

  // 1. 變速瞬間 (3.0s)，計算出的拍數必須精確等於 5.0 (連續性)
  const beatRightAfter = calculateBeatFromAudioTime(3.0, anchorTime, anchorBeat, baseBpm, tempoRatio);
  assert.equal(beatRightAfter, 5.0);

  // 2. 變速後再經過 2 秒 (時間 5.0s)，於 50 BPM 下 2 秒等於 1.666... 拍 -> 拍位應為 6.666...
  const beatLater = calculateBeatFromAudioTime(5.0, anchorTime, anchorBeat, baseBpm, tempoRatio);
  assert.ok(Math.abs(beatLater - (5.0 + 2.0 * (50 / 60))) < 1e-9);
});

test('1.4 休止符與音符檢索定位 (findActiveNoteAtBeat)', () => {
  const melody = [
    { start: 0, dur: 1, midi: 64 }, // 第一拍: 音符
    { start: 1, dur: 1, midi: 0 },  // 第二拍: 休止符
    { start: 2, dur: 2, midi: 67 }, // 第三、四拍: 長音
  ];
  const totalMeasures = 1;
  const beatsPerMeasure = 4;

  // 拍數 0.5 -> 音符 (index 0)
  const match1 = findActiveNoteAtBeat(melody, 0.5, totalMeasures, beatsPerMeasure);
  assert.ok(match1);
  assert.equal(match1.noteIndex, 0);
  assert.equal(match1.isRest, false);

  // 拍數 1.5 -> 休止符 (index 1)
  const match2 = findActiveNoteAtBeat(melody, 1.5, totalMeasures, beatsPerMeasure);
  assert.ok(match2);
  assert.equal(match2.noteIndex, 1);
  assert.equal(match2.isRest, true);

  // 拍數 3.0 -> 長音 (index 2)
  const match3 = findActiveNoteAtBeat(melody, 3.0, totalMeasures, beatsPerMeasure);
  assert.ok(match3);
  assert.equal(match3.noteIndex, 2);

  // 超出範圍 -> null
  assert.equal(findActiveNoteAtBeat(melody, 4.0, totalMeasures, beatsPerMeasure), null);
});

test('1.5 小節範圍循環換算 (wrapLoopBeat)', () => {
  const beatsPerMeasure = 4;
  // 循環 2 到 4 小節 (第 4 拍 到 第 16 拍前, 長度 12 拍)
  const startM = 2;
  const endM = 4;

  // 尚未進入循環起點
  assert.equal(wrapLoopBeat(2, startM, endM, beatsPerMeasure), 2);

  // 正好在起點
  assert.equal(wrapLoopBeat(4, startM, endM, beatsPerMeasure), 4);

  // 播放到 15.9 拍 (循環內最後)
  assert.equal(wrapLoopBeat(15.9, startM, endM, beatsPerMeasure), 15.9);

  // 播放到 16 拍 (撞到終點) -> 換算回起點 4
  assert.equal(wrapLoopBeat(16, startM, endM, beatsPerMeasure), 4);

  // 播放到 18 拍 -> 換算為 6
  assert.equal(wrapLoopBeat(18, startM, endM, beatsPerMeasure), 6);
});

// ---------------------------------------------------------------------------
// 二、5 分鐘 Lookahead 排程模擬測試 (Fake Clock Scheduler Simulation)
// ---------------------------------------------------------------------------

test('2.1 假時鐘模擬 5 分鐘連續播放: 誤差 < 1ms、零漏拍、零重複拍', () => {
  const baseBpm = 120; // 120 BPM = 0.5 秒/拍
  const tempoRatio = 1.0;
  const totalMeasures = 150; // 150 小節 * 4 拍 = 600 拍 (剛好 300 秒 = 5 分鐘)
  const beatsPerMeasure = 4;

  // 生成理論拍數序列 (不含預備拍)
  const beatSeq = generateBeatSequence(totalMeasures, beatsPerMeasure, false);

  // 假時鐘與模擬 Lookahead
  let fakeAudioTime = 0.0;
  const lookaheadInterval = 0.025; // 25 ms 輪詢
  const scheduleAheadTime = 0.100;  // 100 ms 預排

  const scheduledEvents = [];
  let nextBeatIndex = 0;

  // 模擬 5 分鐘 (300 秒) 運轉, 每次推進 25 ms
  const totalSimulationTime = 300.0;
  while (fakeAudioTime <= totalSimulationTime + scheduleAheadTime) {
    const windowEnd = fakeAudioTime + scheduleAheadTime;

    while (nextBeatIndex < beatSeq.length) {
      const beatItem = beatSeq[nextBeatIndex];
      // 理論時間: beatIndex * 0.5s
      const theoreticalTime = calculateAudioTimeForBeat(beatItem.beatIndex, 0.0, 0, baseBpm, tempoRatio);

      // 若理論時間落在預排視窗內 [fakeAudioTime, windowEnd)
      if (theoreticalTime < windowEnd) {
        scheduledEvents.push({
          beatIndex: beatItem.beatIndex,
          scheduledTime: theoreticalTime,
          fakeClockAtSchedule: fakeAudioTime,
        });
        nextBeatIndex++;
      } else {
        break; // 尚未進入預排視窗
      }
    }

    fakeAudioTime += lookaheadInterval;
  }

  // 驗證 1: 所有 600 拍皆已被排程 (零漏拍)
  assert.equal(scheduledEvents.length, 600, `應排程 600 拍,實際排程: ${scheduledEvents.length}`);

  // 驗證 2: 無重複拍 (beatIndex 嚴格連續)
  for (let i = 0; i < scheduledEvents.length; i++) {
    assert.equal(scheduledEvents[i].beatIndex, i, `第 ${i} 拍索引不相符`);
  }

  // 驗證 3: 每一拍的排程時間與理論值誤差小於 1 ms (0.001s)
  let maxError = 0;
  for (let i = 0; i < scheduledEvents.length; i++) {
    const expectedTime = i * 0.5; // 120 BPM 下第 i 拍的理論時間
    const actualTime = scheduledEvents[i].scheduledTime;
    const error = Math.abs(actualTime - expectedTime);
    if (error > maxError) maxError = error;

    assert.ok(
      error < 0.001,
      `第 ${i} 拍排程時間誤差過大: 期望 ${expectedTime}s, 實際 ${actualTime}s, 誤差 ${error * 1000}ms`
    );
  }

  console.log(`    [Fake Clock Test Success] 5分鐘 (600拍) 模擬通過，最大時間誤差: ${(maxError * 1000).toFixed(4)} ms`);
});
