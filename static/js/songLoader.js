/**
 * songLoader.js -- 載入曲目 JSON
 *
 * 預設從 Flask API 載入（api/songs、api/songs/:id）。
 * 靜態網站（GitHub Pages）由 tools/build_static.py 在 index.html 加入
 * <meta name="song-api" content="static">，改讀預先產生的 api/songs.json 與
 * api/songs/:id.json。所有網址都是相對路徑，才能放在子路徑（/專案名/）下運作。
 */

function isStaticMode() {
  return typeof document !== 'undefined'
    && document.querySelector('meta[name="song-api"]')?.content === 'static';
}

/**
 * 取得曲目簡體清單
 * @returns {Promise<Array>} 曲目簡體物件陣列
 */
export async function fetchSongsList() {
  const response = await fetch(isStaticMode() ? 'api/songs.json' : 'api/songs');
  if (!response.ok) {
    throw new Error(`無法載入曲目清單: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

/**
 * 取得單一曲目的完整 JSON 資料
 * @param {string} songId - 曲目 ID
 * @returns {Promise<Object>} 完整曲目物件
 */
export async function fetchSongDetail(songId) {
  const id = encodeURIComponent(songId);
  const response = await fetch(isStaticMode() ? `api/songs/${id}.json` : `api/songs/${id}`);
  if (!response.ok) {
    throw new Error(`無法載入曲目 (${songId}): ${response.status} ${response.statusText}`);
  }
  return await response.json();
}
