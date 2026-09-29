/**
 * ui.js -- UI 視圖切換、控制項維護與預備拍 Overlay
 */

import { PlaybackState } from './scheduler.js';

/**
 * 渲染曲目清單列表
 *
 * @param {Array} songs - 曲目清單陣列
 * @param {Function} onSelectSong - 點擊曲目時的回呼函式 (songId) => void
 */
export function renderSongList(songs, onSelectSong) {
  const container = document.getElementById('song-list');
  if (!container) return;

  container.innerHTML = '';

  if (!Array.isArray(songs) || songs.length === 0) {
    container.innerHTML = '<p class="empty-msg">目前沒有可用的曲目</p>';
    return;
  }

  songs.forEach((song) => {
    const card = document.createElement('div');
    card.className = 'song-card';

    const title = document.createElement('h3');
    title.textContent = song.title || song.id;

    const info = document.createElement('p');
    info.className = 'song-info';
    const keyConcert = song.keyConcert || '未知';
    const timeSig = Array.isArray(song.timeSignature) ? song.timeSignature.join('/') : '4/4';
    const tempo = song.tempo || 120;
    const composer = song.composer || '傳統樂曲';
    info.textContent = `作曲: ${composer} | 調性: ${keyConcert} 大調 | 拍號: ${timeSig} | 速度: ${tempo} BPM`;

    const btn = document.createElement('button');
    btn.className = 'btn-select-song';
    btn.type = 'button';
    btn.textContent = '進入練習';
    btn.addEventListener('click', () => {
      if (typeof onSelectSong === 'function') {
        onSelectSong(song.id);
      }
    });

    card.appendChild(title);
    card.appendChild(info);
    card.appendChild(btn);
    container.appendChild(card);
  });
}

/**
 * 切換至練習視圖
 * @param {string} title - 曲目標題
 */
export function showPracticeView(title) {
  const listSection = document.getElementById('song-list-section');
  const practiceSection = document.getElementById('practice-section');
  const practiceTitle = document.getElementById('practice-title');

  if (listSection) listSection.style.display = 'none';
  if (practiceSection) practiceSection.style.display = 'block';
  if (practiceTitle) practiceTitle.textContent = title;
}

/**
 * 切換至曲目清單視圖
 */
export function showSongListView() {
  const listSection = document.getElementById('song-list-section');
  const practiceSection = document.getElementById('practice-section');

  if (listSection) listSection.style.display = 'block';
  if (practiceSection) practiceSection.style.display = 'none';
}

/**
 * 初始化小節循環選單下拉選單 (1 ~ totalMeasures)
 * @param {number} totalMeasures - 曲目總小節數
 */
export function setupLoopSelects(totalMeasures) {
  const startSelect = document.getElementById('loop-start');
  const endSelect = document.getElementById('loop-end');

  if (!startSelect || !endSelect) return;

  startSelect.innerHTML = '';
  endSelect.innerHTML = '';

  for (let i = 1; i <= totalMeasures; i++) {
    const optStart = document.createElement('option');
    optStart.value = i;
    optStart.textContent = i;
    if (i === 1) optStart.selected = true;
    startSelect.appendChild(optStart);

    const optEnd = document.createElement('option');
    optEnd.value = i;
    optEnd.textContent = i;
    if (i === totalMeasures) optEnd.selected = true;
    endSelect.appendChild(optEnd);
  }
}

/**
 * 依播放狀態更新控制按鈕按壓狀態
 * @param {string} state - PlaybackState (IDLE, COUNT_IN, PLAYING, PAUSED)
 */
export function updatePlaybackButtons(state) {
  const btnPlay = document.getElementById('btn-play');
  const btnPause = document.getElementById('btn-pause');
  const btnStop = document.getElementById('btn-stop');

  if (!btnPlay || !btnPause || !btnStop) return;

  switch (state) {
    case PlaybackState.IDLE:
      btnPlay.disabled = false;
      btnPause.disabled = true;
      btnStop.disabled = true;
      btnPlay.textContent = '播放';
      break;

    case PlaybackState.COUNT_IN:
      btnPlay.disabled = true;
      btnPause.disabled = false;
      btnStop.disabled = false;
      btnPlay.textContent = '播放中...';
      break;

    case PlaybackState.PLAYING:
      btnPlay.disabled = true;
      btnPause.disabled = false;
      btnStop.disabled = false;
      btnPlay.textContent = '播放中';
      break;

    case PlaybackState.PAUSED:
      btnPlay.disabled = false;
      btnPause.disabled = true;
      btnStop.disabled = false;
      btnPlay.textContent = '繼續播放';
      break;
  }
}

/**
 * 顯示 / 隱藏預備拍大字倒數 Overlay
 * @param {number | null} num - 倒數數字 (4, 3, 2, 1) 或 null 隱藏
 */
export function updateCountInOverlay(num) {
  const overlay = document.getElementById('countin-overlay');
  const numElem = document.getElementById('countin-number');

  if (!overlay || !numElem) return;

  if (num === null || num === undefined) {
    overlay.style.display = 'none';
  } else {
    numElem.textContent = num.toString();
    overlay.style.display = 'block';
  }
}

/**
 * 更新播放速度文字顯示
 * @param {number} ratio - 速度比例 (如 1.0)
 * @param {number} baseBpm - 基礎 BPM
 */
export function updateTempoDisplay(ratio, baseBpm) {
  const display = document.getElementById('tempo-display');
  if (!display) return;
  const currentBpm = Math.round(baseBpm * ratio);
  const percent = Math.round(ratio * 100);
  display.textContent = `${percent}% (${currentBpm} BPM)`;
}
