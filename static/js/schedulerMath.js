/**
 * schedulerMath.js -- 時間、拍數與排程純數學計算模組
 *
 * 說明:
 * 所有函式均為純函式 (Pure Functions),完全不依賴 DOM 或 AudioContext。
 * 方便單元測試與 Fake Clock 模擬測試。
 */

/**
 * 計算單一拍（四分音符）之秒數
 * @param {number} bpm - 每分鐘拍數
 * @returns {number} 每拍秒數
 */
export function bpmToBeatDuration(bpm) {
  if (typeof bpm !== 'number' || bpm <= 0) {
    throw new Error(`BPM 必須為正數,收到: ${bpm}`);
  }
  return 60.0 / bpm;
}

/**
 * 依音訊時間計算對應拍數 (考慮變速基準點)
 *
 * @param {number} currentTime - 目前音訊時間 (秒)
 * @param {number} anchorTime - 基準音訊時間 (秒)
 * @param {number} anchorBeat - 基準拍數
 * @param {number} baseBpm - 歌曲基礎 BPM
 * @param {number} tempoRatio - 速度比例 (1.0 = 100%, 0.5 = 50%, 1.2 = 120%)
 * @returns {number} 目前拍數 (可包含小數點)
 */
export function calculateBeatFromAudioTime(currentTime, anchorTime, anchorBeat, baseBpm, tempoRatio) {
  if (tempoRatio <= 0) {
    throw new Error(`速度比例必須為正數,收到: ${tempoRatio}`);
  }
  const effectiveBpm = baseBpm * tempoRatio;
  const beatsPerSecond = effectiveBpm / 60.0;
  const elapsedTime = currentTime - anchorTime;
  return anchorBeat + elapsedTime * beatsPerSecond;
}

/**
 * 依拍數計算預期的音訊時間 (考慮變速基準點)
 *
 * @param {number} targetBeat - 目標拍數
 * @param {number} anchorTime - 基準音訊時間 (秒)
 * @param {number} anchorBeat - 基準拍數
 * @param {number} baseBpm - 歌曲基礎 BPM
 * @param {number} tempoRatio - 速度比例
 * @returns {number} 音訊時間 (秒)
 */
export function calculateAudioTimeForBeat(targetBeat, anchorTime, anchorBeat, baseBpm, tempoRatio) {
  if (tempoRatio <= 0) {
    throw new Error(`速度比例必須為正數,收到: ${tempoRatio}`);
  }
  const effectiveBpm = baseBpm * tempoRatio;
  const secondsPerBeat = 60.0 / effectiveBpm;
  const elapsedBeats = targetBeat - anchorBeat;
  return anchorTime + elapsedBeats * secondsPerBeat;
}

/**
 * 變速時更新基準點，確保拍數保持連續不跳躍
 *
 * @param {number} currentTime - 變速發生時的音訊時間
 * @param {number} currentBeat - 變速發生時的精確拍數
 * @param {number} newTempoRatio - 新的速度比例
 * @returns {{ anchorTime: number, anchorBeat: number, tempoRatio: number }}
 */
export function updateTempoAnchor(currentTime, currentBeat, newTempoRatio) {
  if (newTempoRatio <= 0) {
    throw new Error(`速度比例必須為正數,收到: ${newTempoRatio}`);
  }
  return {
    anchorTime: currentTime,
    anchorBeat: currentBeat,
    tempoRatio: newTempoRatio,
  };
}

/**
 * 依拍位搜尋旋律陣列中對應的音符（包含 MIDI 0 休止符）
 *
 * @param {Array} melody - 旋律陣列 [{ start, dur, midi }, ...]
 * @param {number} beatPosition - 當前拍數 (0-indexed)
 * @param {number} totalMeasures - 總小節數
 * @param {number} beatsPerMeasure - 每小節拍數
 * @returns {{ noteIndex: number, note: Object, startBeat: number, endBeat: number, isRest: boolean } | null}
 */
export function findActiveNoteAtBeat(melody, beatPosition, totalMeasures, beatsPerMeasure) {
  const totalBeats = totalMeasures * beatsPerMeasure;

  if (beatPosition < 0 || beatPosition >= totalBeats) {
    return null;
  }

  if (!Array.isArray(melody)) {
    return null;
  }

  for (let i = 0; i < melody.length; i++) {
    const note = melody[i];
    const start = note.start;
    const end = note.start + note.dur;

    // 比對拍數區間 [start, end)
    if (beatPosition >= start && beatPosition < end) {
      return {
        noteIndex: i,
        note: note,
        startBeat: start,
        endBeat: end,
        isRest: note.midi === 0,
      };
    }
  }

  return null;
}

/**
 * 小節範圍循環之拍數換算
 *
 * @param {number} rawBeat - 原始拍數 (從循環起點算起已累積的總拍數)
 * @param {number} startMeasure - 起始小節 (1-based, 如 1)
 * @param {number} endMeasure - 結束小節 (1-based, 如 4)
 * @param {number} beatsPerMeasure - 每小節拍數
 * @returns {number} 於循環區間內換算後的實際歌曲拍數
 */
export function wrapLoopBeat(rawBeat, startMeasure, endMeasure, beatsPerMeasure) {
  const loopStartBeat = (startMeasure - 1) * beatsPerMeasure;
  const loopEndBeat = endMeasure * beatsPerMeasure;
  const loopLength = loopEndBeat - loopStartBeat;

  if (loopLength <= 0 || rawBeat < loopStartBeat) {
    return rawBeat;
  }

  const offset = (rawBeat - loopStartBeat) % loopLength;
  return loopStartBeat + offset;
}

/**
 * 產生完整的拍點列表（含預備拍與音樂拍）
 *
 * @param {number} totalMeasures - 歌曲總小節數
 * @param {number} beatsPerMeasure - 每小節拍數
 * @param {boolean} [includeCountIn=true] - 是否包含 1 小節預備拍
 * @returns {Array<{ beatIndex: number, measure: number, beatInMeasure: number, isAccent: boolean, isCountIn: boolean }>}
 */
export function generateBeatSequence(totalMeasures, beatsPerMeasure, includeCountIn = true) {
  const sequence = [];

  // 1. 預備拍 (Count-in): 小節編號 0, beatIndex 為負值 (-beatsPerMeasure 到 -1)
  if (includeCountIn) {
    for (let b = 0; b < beatsPerMeasure; b++) {
      const beatInMeasure = b + 1;
      const beatIndex = -beatsPerMeasure + b;
      sequence.push({
        beatIndex,
        measure: 0,
        beatInMeasure,
        isAccent: beatInMeasure === 1,
        isCountIn: true,
      });
    }
  }

  // 2. 歌曲正拍: beatIndex 0 到 (totalMeasures * beatsPerMeasure - 1)
  const totalBeats = totalMeasures * beatsPerMeasure;
  for (let b = 0; b < totalBeats; b++) {
    const measure = Math.floor(b / beatsPerMeasure) + 1;
    const beatInMeasure = (b % beatsPerMeasure) + 1;
    sequence.push({
      beatIndex: b,
      measure,
      beatInMeasure,
      isAccent: beatInMeasure === 1,
      isCountIn: false,
    });
  }

  return sequence;
}
