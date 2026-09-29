/**
 * main.js -- 主進入點與事件綁定
 */

import { fetchSongsList, fetchSongDetail } from './songLoader.js';
import { renderSongList, showPracticeView, showSongListView } from './ui.js';
import { renderScore } from './score.js';

let currentSong = null;

/**
 * 初始化應用程式
 */
async function initApp() {
  const backBtn = document.getElementById('btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      currentSong = null;
      showSongListView();
    });
  }

  try {
    const songs = await fetchSongsList();
    renderSongList(songs, async (songId) => {
      try {
        currentSong = await fetchSongDetail(songId);
        showPracticeView(`${currentSong.title} (${currentSong.composer})`);
        renderScore(currentSong, 'score-container');
      } catch (err) {
        console.error('載入曲目失敗:', err);
        alert(`無法載入曲目詳情: ${err.message}`);
      }
    });
  } catch (err) {
    console.error('載入曲目清單失敗:', err);
    const container = document.getElementById('song-list');
    if (container) {
      container.innerHTML = `<p class="error-msg">無法連線後端取得曲目清單: ${err.message}</p>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', initApp);
