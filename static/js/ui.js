/**
 * ui.js -- UI 視圖切換與元件渲染
 */

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
