/**
 * score.js -- VexFlow 譜面繪製、音符座標定位與高亮顯示
 *
 * 階段 3 擴充:
 * 1. 繪製音符時紀錄 SVG 節點與座標資訊
 * 2. 提供 highlightNoteByIndex(noteIndex) 高亮特定音符/休止符並移動游標
 * 3. 提供 clearHighlights() 清除高亮與游標
 */

import {
  concertToWrittenMidi,
  concertToWrittenKey,
  midiToNoteName,
  midiToVexFlowKey,
  midiToJianpu,
  getVexFlowKeySignature,
  durationToVexFlow,
} from './pitch.js';

/** 當前渲染的曲目資料快取 */
let currentSongData = null;
/** 當前容器 ID 或 DOM 元素 */
let currentContainerTarget = 'score-container';
/** Debounce timer ID */
let resizeTimer = null;
/** 視窗 resize 監聽器是否已綁定 */
let resizeListenerBound = false;

/** 快取繪製完成的音符 SVG 節點與座標資訊 */
let renderedNotesCache = [];
/** 當前高亮之音符索引 */
let currentHighlightedIndex = -1;

/**
 * 防抖動函式 (Debounce)
 * @param {Function} fn - 欲執行的函式
 * @param {number} delay - 延遲毫秒數
 * @returns {Function}
 */
function debounce(fn, delay = 200) {
  return function (...args) {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 將旋律音符按小節分組，同時保留原始全域索引
 *
 * @param {Array} melody - 曲目的旋律陣列 [{ start, dur, midi }, ...]
 * @param {number} totalMeasures - 總小節數
 * @param {number} beatsPerMeasure - 每小節拍數
 * @returns {Array<Array>} 每小節的音符陣列 (含 globalIndex)
 */
function groupNotesByMeasure(melody, totalMeasures, beatsPerMeasure) {
  const measures = Array.from({ length: totalMeasures }, () => []);

  if (Array.isArray(melody)) {
    for (let i = 0; i < melody.length; i++) {
      const note = melody[i];
      // 浮點數容錯與對齊 (對齊至 1/24 拍)
      const snappedStart = Math.round(note.start * 24) / 24;
      const snappedDur = Math.round(note.dur * 24) / 24;
      const mIdx = Math.floor(snappedStart / beatsPerMeasure);
      if (mIdx >= 0 && mIdx < totalMeasures) {
        measures[mIdx].push({
          ...note,
          start: snappedStart,
          dur: snappedDur,
          globalIndex: i,
        });
      }
    }
  }

  // 若某小節無音符,自動補上全小節休止符
  for (let i = 0; i < totalMeasures; i++) {
    if (measures[i].length === 0) {
      measures[i].push({
        start: i * beatsPerMeasure,
        dur: beatsPerMeasure,
        midi: 0,
        globalIndex: -1,
      });
    }
  }

  return measures;
}

/**
 * 繪製樂譜 (VexFlow)
 *
 * @param {Object} song - 曲目物件
 * @param {string | HTMLElement} [containerTarget='score-container'] - 放置譜面的 DOM 元素或 ID
 */
export function renderScore(song, containerTarget = 'score-container') {
  if (!song) {
    throw new Error('renderScore 需要有效的曲目物件');
  }

  currentSongData = song;
  currentContainerTarget = containerTarget;
  renderedNotesCache = [];
  currentHighlightedIndex = -1;

  // 取得 DOM 容器
  const container = typeof containerTarget === 'string'
    ? document.getElementById(containerTarget)
    : containerTarget;

  if (!container) {
    throw new Error(`找不到譜面容器: ${containerTarget}`);
  }

  // 綁定視窗 resize 事件（僅一次）
  if (!resizeListenerBound) {
    window.addEventListener('resize', debounce(() => {
      if (currentSongData) {
        renderScore(currentSongData, currentContainerTarget);
      }
    }, 200));
    resizeListenerBound = true;
  }

  // 清空舊譜面
  container.innerHTML = '';

  // 確保 VexFlow 已載入
  const VF = window.VexFlow || window.Vex?.Flow;
  if (!VF) {
    throw new Error('未找到 VexFlow 全域物件,請確認 vendor/vexflow.js 已正確載入');
  }

  // 曲目與移調參數
  const keyConcert = song.keyConcert || 'C';
  const timeSignature = song.timeSignature || [4, 4];
  const beatsPerMeasure = timeSignature[0];
  const beatValue = timeSignature[1];
  const totalMeasures = song.measures || 8;

  // 推算寫定調資訊
  const writtenKeyInfo = concertToWrittenKey(keyConcert);
  const writtenKey = writtenKeyInfo.writtenKey;
  const vexKeySig = getVexFlowKeySignature(writtenKey);

  // 依小節分組旋律
  const measuresData = groupNotesByMeasure(song.melody, totalMeasures, beatsPerMeasure);

  // 容器寬度計算
  const containerWidth = Math.max(340, container.clientWidth - 16);
  const minMeasureWidth = 210;
  const measuresPerLine = Math.max(1, Math.floor(containerWidth / minMeasureWidth));

  // 將小節劃分至各行
  const rows = [];
  for (let i = 0; i < totalMeasures; i += measuresPerLine) {
    rows.push(measuresData.slice(i, i + measuresPerLine));
  }

  const rowHeight = 140;
  const totalHeight = rows.length * rowHeight + 30;

  // 建立 VexFlow Renderer (SVG 模式)
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
  renderer.resize(containerWidth, totalHeight);
  const context = renderer.getContext();
  const svgSvg = container.querySelector('svg');

  // 建立垂直播放游標線
  let cursorLine = null;
  if (svgSvg) {
    cursorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    cursorLine.setAttribute('id', 'score-cursor');
    cursorLine.setAttribute('class', 'score-cursor');
    cursorLine.setAttribute('x1', '0');
    cursorLine.setAttribute('y1', '0');
    cursorLine.setAttribute('x2', '0');
    cursorLine.setAttribute('y2', '0');
    cursorLine.style.display = 'none';
    cursorLine.style.stroke = '#e67e22';
    cursorLine.style.strokeWidth = '3px';
    cursorLine.style.strokeLinecap = 'round';
    cursorLine.style.opacity = '0.95';
    cursorLine.style.pointerEvents = 'none';
    svgSvg.appendChild(cursorLine);
  }

  let globalMeasureIndex = 0;

  rows.forEach((lineMeasures, rowIndex) => {
    const lineMeasureWidth = (containerWidth - 10) / lineMeasures.length;
    const startY = 10 + rowIndex * rowHeight;

    lineMeasures.forEach((measureNotes, colIndex) => {
      const startX = 5 + colIndex * lineMeasureWidth;

      // 建立五線譜 Stave
      const stave = new VF.Stave(startX, startY, lineMeasureWidth);

      // 第一個小節繪製高音譜號與調號
      if (colIndex === 0) {
        stave.addClef('treble');
        stave.addKeySignature(vexKeySig);
        if (rowIndex === 0) {
          stave.addTimeSignature(`${beatsPerMeasure}/${beatValue}`);
        }
      }

      stave.setContext(context).draw();

      const vfNotes = [];

      for (const item of measureNotes) {
        const writtenMidi = concertToWrittenMidi(item.midi);
        const isRest = writtenMidi === 0;
        let durStr = durationToVexFlow(item.dur);

        if (isRest) {
          durStr += 'r';
        }

        const keyStr = isRest ? 'b/4' : midiToVexFlowKey(writtenMidi, writtenKey);

        const staveNote = new VF.StaveNote({
          clef: 'treble',
          keys: [keyStr],
          duration: durStr,
        });

        if (durStr.includes('d') && (typeof staveNote.getModifiers !== 'function' || staveNote.getModifiers().length === 0)) {
          if (typeof VF.Dot?.buildAndAttach === 'function') {
            VF.Dot.buildAndAttach([staveNote]);
          }
        }

        let annotationText = '';
        if (isRest) {
          annotationText = 'R / 0';
        } else {
          const noteNameInfo = midiToNoteName(writtenMidi, writtenKey);
          const jianpuInfo = midiToJianpu(writtenMidi, writtenKey);
          annotationText = `${noteNameInfo.fullName} / ${jianpuInfo.text}`;
        }

        const annotation = new VF.Annotation(annotationText)
          .setFont('sans-serif', 10, 'bold')
          .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);

        staveNote.addModifier(annotation, 0);
        vfNotes.push(staveNote);
      }

      try {
        const voice = new VF.Voice({
          num_beats: beatsPerMeasure,
          beat_value: beatValue,
        });
        voice.setStrict(false);
        voice.addTickables(vfNotes);

        VF.Accidental.applyAccidentals([voice], vexKeySig);

        const formatter = new VF.Formatter();
        const minPadding = stave.getNoteStartX() - stave.getX();
        const availableWidth = lineMeasureWidth - minPadding - 10;
        if (typeof formatter.joinVoices === 'function') {
          formatter.joinVoices([voice]);
        } else if (typeof formatter.joinByTicks === 'function') {
          formatter.joinByTicks([voice]);
        }
        formatter.format([voice], availableWidth);

        voice.draw(context, stave);

        // 紀錄音符 SVG 節點與座標資訊
        vfNotes.forEach((staveNote, idx) => {
          const noteItem = measureNotes[idx];
          if (noteItem && noteItem.globalIndex >= 0) {
            const svgElem = staveNote.getSVGElement ? staveNote.getSVGElement() : null;
            const x = staveNote.getAbsoluteX();
            const yTop = stave.getYForLine(0) - 20;
            const yBottom = stave.getYForLine(4) + 30;

            renderedNotesCache[noteItem.globalIndex] = {
              noteIndex: noteItem.globalIndex,
              svgElement: svgElem,
              x,
              yTop,
              yBottom,
              measureIndex: globalMeasureIndex,
            };
          }
        });
      } catch (err) {
        console.error(`小節 ${globalMeasureIndex + 1} 繪製失敗:`, err);
      }

      globalMeasureIndex++;
    });
  });
}

/**
 * 清除所有音符高亮與游標
 */
export function clearHighlights() {
  renderedNotesCache.forEach((item) => {
    if (item && item.svgElement) {
      item.svgElement.classList.remove('note-highlight');
    }
  });

  const cursorLine = document.getElementById('score-cursor');
  if (cursorLine) {
    cursorLine.style.display = 'none';
  }

  currentHighlightedIndex = -1;
}

/**
 * 高亮特定音符並將游標移動至該位置
 *
 * @param {number} noteIndex - 旋律中的音符全域索引
 */
export function highlightNoteByIndex(noteIndex) {
  if (noteIndex === currentHighlightedIndex) {
    return;
  }

  // 先清除舊高亮
  clearHighlights();

  const item = renderedNotesCache[noteIndex];
  if (!item) {
    return;
  }

  currentHighlightedIndex = noteIndex;

  // 加上高亮 Class (CSS 定義樣式)
  if (item.svgElement) {
    item.svgElement.classList.add('note-highlight');
  }

  // 更新 SVG 游標位置
  const cursorLine = document.getElementById('score-cursor');
  if (cursorLine) {
    cursorLine.setAttribute('x1', item.x.toString());
    cursorLine.setAttribute('x2', item.x.toString());
    cursorLine.setAttribute('y1', item.yTop.toString());
    cursorLine.setAttribute('y2', item.yBottom.toString());
    cursorLine.style.display = 'block';
  }
}
