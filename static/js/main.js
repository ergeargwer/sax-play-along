/**
 * main.js -- 主進入點與事件綁定 (階段 3 節奏引導與排程器整合)
 */

import { fetchSongsList, fetchSongDetail } from './songLoader.js';
import {
  renderSongList,
  showPracticeView,
  showSongListView,
  setupLoopSelects,
  updatePlaybackButtons,
  updateCountInOverlay,
  updateTempoDisplay,
} from './ui.js';

import { renderScore } from './score.js';
import { Scheduler } from './scheduler.js';

const scheduler = new Scheduler();
let currentSong = null;

/**
 * 綁定控制面板事件
 */
function bindControls() {
  const btnPlay = document.getElementById('btn-play');
  const btnPause = document.getElementById('btn-pause');
  const btnStop = document.getElementById('btn-stop');
  const tempoSlider = document.getElementById('tempo-slider');
  const loopEnable = document.getElementById('loop-enable');
  const loopStart = document.getElementById('loop-start');
  const loopEnd = document.getElementById('loop-end');

  if (btnPlay) {
    btnPlay.addEventListener('click', () => scheduler.play());
  }

  if (btnPause) {
    btnPause.addEventListener('click', () => scheduler.pause());
  }

  if (btnStop) {
    btnStop.addEventListener('click', () => scheduler.stop());
  }

  // 速度滑桿 (動態變速)
  if (tempoSlider) {
    tempoSlider.addEventListener('input', () => {
      const ratio = parseFloat(tempoSlider.value);
      scheduler.setTempoRatio(ratio);
      if (currentSong) {
        updateTempoDisplay(ratio, currentSong.tempo || 120);
      }
    });
  }

  // 循環選項變更處理
  const handleLoopChange = () => {
    if (!loopEnable || !loopStart || !loopEnd) return;

    const enabled = loopEnable.checked;
    loopStart.disabled = !enabled;
    loopEnd.disabled = !enabled;

    const startM = parseInt(loopStart.value, 10) || 1;
    const endM = parseInt(loopEnd.value, 10) || (currentSong ? currentSong.measures : 8);

    scheduler.setLoopRange(startM, endM, enabled);
  };

  if (loopEnable) loopEnable.addEventListener('change', handleLoopChange);
  if (loopStart) loopStart.addEventListener('change', handleLoopChange);
  if (loopEnd) loopEnd.addEventListener('change', handleLoopChange);

  // Scheduler 回呼綁定
  scheduler.stateChangeCallback = (state) => {
    updatePlaybackButtons(state);
  };

  scheduler.countInCallback = (num) => {
    updateCountInOverlay(num);
  };
}

/**
 * 初始化應用程式
 */
async function initApp() {
  const backBtn = document.getElementById('btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      scheduler.stop();
      currentSong = null;
      showSongListView();
    });
  }

  bindControls();

  try {
    const songs = await fetchSongsList();
    renderSongList(songs, async (songId) => {
      try {
        scheduler.stop();
        currentSong = await fetchSongDetail(songId);

        // 重置速度滑桿為 100% (1.0)
        const tempoSlider = document.getElementById('tempo-slider');
        if (tempoSlider) {
          tempoSlider.value = '1.0';
        }

        showPracticeView(`${currentSong.title} (${currentSong.composer})`);
        renderScore(currentSong, 'score-container');
        setupLoopSelects(currentSong.measures || 8);

        // 初始化 Scheduler
        scheduler.init(currentSong);
        updateTempoDisplay(1.0, currentSong.tempo || 120);
        updatePlaybackButtons(scheduler.state);
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
