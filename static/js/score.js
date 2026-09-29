/**
 * score.js -- VexFlow 譜面繪製與音符標記
 *
 * 階段 2 實作:
 * 1. 使用 static/vendor/vexflow.js 本地副本（無 CDN 依賴）
 * 2. 高音譜號,依寫定調顯示調號與拍號,按小節排列,寬度隨容器自適應
 * 3. 譜面音符下方加註寫定音名與簡譜（如 "A4 / 1"）
 * 4. 休止符在譜面上正確顯示 ("R / 0")
 * 5. 視窗 resize 時重繪譜面（使用 debounce 防止頻繁重繪）
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
 * 將旋律音符按小節分組。
 *
 * @param {Array} melody - 曲目的旋律陣列 [{ start, dur, midi }, ...]
 * @param {number} totalMeasures - 總小節數
 * @param {number} beatsPerMeasure - 每小節拍數
 * @returns {Array<Array>} 每小節的音符陣列
 */
function groupNotesByMeasure(melody, totalMeasures, beatsPerMeasure) {
  const measures = Array.from({ length: totalMeasures }, () => []);

  if (Array.isArray(melody)) {
    for (const note of melody) {
      const mIdx = Math.floor(note.start / beatsPerMeasure);
      if (mIdx >= 0 && mIdx < totalMeasures) {
        measures[mIdx].push(note);
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
      });
    }
  }

  return measures;
}

/**
 * 繪製樂譜 (VexFlow)
 *
 * @param {Object} song - 階段 1 資料結構的曲目物件
 * @param {string | HTMLElement} [containerTarget='score-container'] - 放置譜面的 DOM 元素或 ID
 */
export function renderScore(song, containerTarget = 'score-container') {
  if (!song) {
    throw new Error('renderScore 需要有效的曲目物件');
  }

  currentSongData = song;
  currentContainerTarget = containerTarget;

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
  // 每小節最小寬度 200px
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

  // 逐步繪製各行與小節
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
        // 第一行第一個小節加註拍號
        if (rowIndex === 0) {
          stave.addTimeSignature(`${beatsPerMeasure}/${beatValue}`);
        }
      }

      stave.setContext(context).draw();

      // 建立該小節的 VexFlow StaveNote 列表
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

        // 若為附點音符,加上 Dot 裝飾
        if (durStr.includes('d')) {
          VF.Dot.buildAndAttach([staveNote]);
        }

        // 音符下方加註寫定音名與簡譜
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

      // 建立 Voice 與 Formatter
      try {
        const voice = new VF.Voice({
          num_beats: beatsPerMeasure,
          beat_value: beatValue,
        });
        voice.setStrict(false);
        voice.addTickables(vfNotes);

        // 自動對齊音符與升降記號
        VF.Accidental.applyAccidentals([voice], vexKeySig);

        const formatter = new VF.Formatter();
        const minPadding = stave.getNoteStartX() - stave.getX();
        const availableWidth = lineMeasureWidth - minPadding - 10;
        formatter.joinByTicks([voice]).format([voice], availableWidth);

        voice.draw(context, stave);
      } catch (err) {
        console.error(`小節 ${globalMeasureIndex + 1} 繪製失敗:`, err);
      }

      globalMeasureIndex++;
    });
  });
}
