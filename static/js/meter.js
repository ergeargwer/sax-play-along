/**
 * meter.js -- 逐小節拍數（變拍）輔助函式。
 *
 * 歌曲可選用 `measureBeats`（長度等於 measures 的正整數陣列，單位為四分音符拍數）。
 * 缺省時每小節皆為 timeSignature[0]，與舊曲目行為完全相同。
 */
const isCount = n => Number.isInteger(n) && n > 0;

/** 每小節拍數陣列；無效或缺省時退回固定拍號。 */
export function getMeasureBeats(song) {
  const count = song?.measures || 1;
  const fixed = song?.timeSignature?.[0] || 4;
  const custom = song?.measureBeats;
  if (Array.isArray(custom) && custom.length === count && custom.every(isCount)) return [...custom];
  return Array.from({ length: count }, () => fixed);
}

/** 每小節起點（拍），最後多一格為總拍數。 */
export function getMeasureStarts(song) {
  const starts = [0];
  for (const beats of getMeasureBeats(song)) starts.push(starts.at(-1) + beats);
  return starts;
}

export function getTotalBeats(song) {
  return getMeasureStarts(song).at(-1);
}

/** 拍位所在小節索引（0 起算）；超出範圍時夾在最後一小節。 */
export function measureIndexAtBeat(starts, beat) {
  for (let i = starts.length - 2; i >= 0; i--) {
    if (beat >= starts[i] - 1e-6) return i;
  }
  return 0;
}
