/**
 * songLoader.js -- 從 Flask API 載入曲目 JSON
 */

/**
 * 取得曲目簡體清單 (/api/songs)
 * @returns {Promise<Array>} 曲目簡體物件陣列
 */
export async function fetchSongsList() {
  const response = await fetch('/api/songs');
  if (!response.ok) {
    throw new Error(`無法載入曲目清單: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

/**
 * 取得單一曲目的完整 JSON 資料 (/api/songs/:id)
 * @param {string} songId - 曲目 ID
 * @returns {Promise<Object>} 完整曲目物件
 */
export async function fetchSongDetail(songId) {
  const response = await fetch(`/api/songs/${encodeURIComponent(songId)}`);
  if (!response.ok) {
    throw new Error(`無法載入曲目 (${songId}): ${response.status} ${response.statusText}`);
  }
  return await response.json();
}
