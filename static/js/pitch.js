/**
 * pitch.js -- MIDI 號碼、音名、簡譜、移調換算
 *
 * 中音薩克斯風為降 E 調樂器。
 * 寫定音高(written pitch)= 實際音高(concert pitch)+ 9 個半音。
 * 所有函式為純函式,不依賴 DOM。
 */

// ---------------------------------------------------------------------------
// 常數
// ---------------------------------------------------------------------------

/** 中音薩克斯風移調半音數 */
const ALTO_SAX_TRANSPOSE = 9;

/** 合法 MIDI 範圍(0 為休止符,21-108 為鋼琴音域) */
const MIDI_MIN = 21;
const MIDI_MAX = 108;

/** 音名索引(pitch class 0 = C) */
const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * 各調的調號資訊:正數為升記號數,負數為降記號數。
 * 鍵為調名(僅大調）。
 */
const KEY_SIGNATURES = {
  'C': 0,
  'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7,
  'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6, 'Cb': -7,
};

/**
 * 實際調 -> 寫定調 對照表(中音薩克斯風）。
 * 每個實際調都對應一個音樂上慣用的寫定調名。
 */
const CONCERT_TO_WRITTEN_KEY = {
  'C':  'A',
  'G':  'E',
  'D':  'B',
  'A':  'F#',
  'E':  'C#',
  'B':  'Ab',
  'F#': 'Eb',
  'C#': 'Bb',
  'F':  'D',
  'Bb': 'G',
  'Eb': 'C',
  'Ab': 'F',
  'Db': 'Bb',
  'Gb': 'Eb',
  'Cb': 'Ab',
};

/**
 * 各調名對應的 pitch class(0 = C）。
 */
const KEY_TO_PITCH_CLASS = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

/**
 * 半音數(相對於主音)-> 簡譜資訊。
 * degree: 簡譜數字(1-7）
 * prefix: 升降前綴（空字串、'#' 或 'b'）
 */
const INTERVAL_TO_JIANPU = [
  { degree: 1, prefix: '' },   // 0: 主音
  { degree: 1, prefix: '#' },  // 1
  { degree: 2, prefix: '' },   // 2
  { degree: 3, prefix: 'b' },  // 3
  { degree: 3, prefix: '' },   // 4
  { degree: 4, prefix: '' },   // 5
  { degree: 4, prefix: '#' },  // 6
  { degree: 5, prefix: '' },   // 7
  { degree: 5, prefix: '#' },  // 8
  { degree: 6, prefix: '' },   // 9
  { degree: 7, prefix: 'b' },  // 10
  { degree: 7, prefix: '' },   // 11
];

// ---------------------------------------------------------------------------
// 內部工具
// ---------------------------------------------------------------------------

/**
 * 檢查 MIDI 號碼是否合法(0 或 21-108）。
 * @param {number} midi
 * @throws {Error} 不合法時丟出例外
 */
function assertValidMidi(midi) {
  if (!Number.isInteger(midi)) {
    throw new Error(`MIDI 號碼須為整數,收到: ${midi}`);
  }
  if (midi !== 0 && (midi < MIDI_MIN || midi > MIDI_MAX)) {
    throw new Error(
      `MIDI 號碼須為 0（休止符）或 ${MIDI_MIN}-${MIDI_MAX},收到: ${midi}`
    );
  }
}

/**
 * 檢查調名是否已知。
 * @param {string} key
 * @throws {Error} 未知調名時丟出例外
 */
function assertValidKey(key) {
  if (KEY_SIGNATURES[key] === undefined) {
    throw new Error(
      `未知的調性: '${key}',支援的調性: ${Object.keys(KEY_SIGNATURES).join(', ')}`
    );
  }
}

/**
 * 檢查實際調名是否有對應的寫定調。
 * @param {string} keyConcert
 * @throws {Error} 無對應時丟出例外
 */
function assertValidConcertKey(keyConcert) {
  if (CONCERT_TO_WRITTEN_KEY[keyConcert] === undefined) {
    throw new Error(
      `未知的實際調性: '${keyConcert}',支援的調性: ${Object.keys(CONCERT_TO_WRITTEN_KEY).join(', ')}`
    );
  }
}

/**
 * 判斷調性是否使用升記號（包含 C 大調）。
 * @param {string} key
 * @returns {boolean}
 */
function isSharpKey(key) {
  return KEY_SIGNATURES[key] >= 0;
}

// ---------------------------------------------------------------------------
// 匯出函式
// ---------------------------------------------------------------------------

/**
 * 實際音高 MIDI 轉寫定音高 MIDI（中音薩克斯風）。
 * 休止符（midi=0）不變。
 *
 * @param {number} concertMidi - 實際音高 MIDI 號碼（0 或 21-108）
 * @returns {number} 寫定音高 MIDI 號碼
 * @throws {Error} MIDI 不合法時
 */
export function concertToWrittenMidi(concertMidi) {
  assertValidMidi(concertMidi);
  if (concertMidi === 0) return 0;
  return concertMidi + ALTO_SAX_TRANSPOSE;
}

/**
 * 依實際調性推算寫定調與調號資訊。
 *
 * @param {string} keyConcert - 實際調名（如 'C', 'G', 'Bb'）
 * @returns {{ writtenKey: string, accidentalCount: number, accidentalType: string }}
 *   writtenKey: 寫定調名
 *   accidentalCount: 升降記號數（絕對值）
 *   accidentalType: 'sharp' | 'flat' | 'none'
 * @throws {Error} 未知調性時
 */
export function concertToWrittenKey(keyConcert) {
  assertValidConcertKey(keyConcert);
  const writtenKey = CONCERT_TO_WRITTEN_KEY[keyConcert];
  const sigValue = KEY_SIGNATURES[writtenKey];
  let accidentalType = 'none';
  if (sigValue > 0) accidentalType = 'sharp';
  else if (sigValue < 0) accidentalType = 'flat';
  return {
    writtenKey,
    accidentalCount: Math.abs(sigValue),
    accidentalType,
  };
}

/**
 * MIDI 號碼轉英文音名與八度。
 * 升降拼法依指定調的調號決定（升記號調用 #,降記號調用 b）。
 *
 * @param {number} midi - MIDI 號碼（0 為休止符）
 * @param {string} key - 調名,用來決定升降拼法
 * @returns {{ name: string, octave: number | null, fullName: string }}
 *   name: 音名（如 'C#'）或 'R'（休止符）
 *   octave: 八度數（如 5）或 null（休止符）
 *   fullName: 完整表示（如 'C#5'）或 'R'
 * @throws {Error} MIDI 或調性不合法時
 */
export function midiToNoteName(midi, key) {
  assertValidMidi(midi);
  assertValidKey(key);

  if (midi === 0) {
    return { name: 'R', octave: null, fullName: 'R' };
  }

  const pitchClass = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  const names = isSharpKey(key) ? NOTE_NAMES_SHARP : NOTE_NAMES_FLAT;
  const name = names[pitchClass];

  return { name, octave, fullName: `${name}${octave}` };
}

/**
 * MIDI 號碼轉 VexFlow 音符字串（如 'c#/5'）。
 * 休止符回傳 VexFlow 休止符格式。
 *
 * @param {number} midi - MIDI 號碼
 * @param {string} key - 調名
 * @returns {string} VexFlow 音符鍵（如 'c#/5'）或 'b/4'（休止符佔位）
 * @throws {Error} MIDI 或調性不合法時
 */
export function midiToVexFlowKey(midi, key) {
  assertValidMidi(midi);
  assertValidKey(key);

  if (midi === 0) {
    return 'b/4'; // 休止符在 VexFlow 中的佔位
  }

  const { name, octave } = midiToNoteName(midi, key);
  // VexFlow 格式:小寫音名/八度,如 'c#/5'
  return `${name.toLowerCase()}//${octave}`.replace('//', '/');
}

/**
 * MIDI 號碼轉首調簡譜。
 *
 * 寫定調的主音為 1,以 1-7 表示音階。
 * 升降以 # 與 b 前綴,高低八度以上下點標示。
 *
 * 八度記號:
 * - 主音所在的八度（含主音到下一個主音前）為基準八度,無點
 * - 每高一個八度加一個上點（U+0307 combining dot above）
 * - 每低一個八度加一個下點（U+0323 combining dot below）
 *
 * 基準八度定義:寫定音高 MIDI 60（C4）所在的主音八度。
 * 即基準主音 MIDI = 60 + pitchClass（若 pitchClass <= 5），
 * 或 48 + pitchClass（若 pitchClass > 5,避免跳到太高的參考點）。
 *
 * @param {number} midi - 寫定音高的 MIDI 號碼（0 為休止符）
 * @param {string} key - 寫定調名
 * @returns {{ text: string, degree: number | null, prefix: string, octaveDots: number }}
 *   text: 完整簡譜文字表示（含前綴與八度點）
 *   degree: 數字（1-7）或 null（休止符）
 *   prefix: '#'、'b' 或 ''
 *   octaveDots: 正數為上點數,負數為下點數,0 為無
 * @throws {Error} MIDI 或調性不合法時
 */
export function midiToJianpu(midi, key) {
  assertValidMidi(midi);
  assertValidKey(key);

  if (midi === 0) {
    return { text: '0', degree: null, prefix: '', octaveDots: 0 };
  }

  const tonicPitchClass = KEY_TO_PITCH_CLASS[key];
  if (tonicPitchClass === undefined) {
    throw new Error(`無法取得調性 '${key}' 的 pitch class`);
  }

  // 基準主音 MIDI:選擇 C4(60) 附近的主音
  // 若 pitchClass > 5（如 A=9,B=11）,放在八度 3 較自然
  // 否則放在八度 4
  const referenceTonic = tonicPitchClass > 5
    ? 48 + tonicPitchClass   // 八度 3（如 A3=57）
    : 60 + tonicPitchClass;  // 八度 4（如 C4=60, D4=62）

  // 計算與基準主音的間距
  const interval = midi - referenceTonic;

  // 半音數（0-11）與八度偏移
  const semitones = ((interval % 12) + 12) % 12;
  const octaveDots = Math.floor(interval / 12);

  const jianpuInfo = INTERVAL_TO_JIANPU[semitones];
  const { degree, prefix } = jianpuInfo;

  // 組合文字表示
  let text = `${prefix}${degree}`;

  // 加入八度點
  if (octaveDots > 0) {
    // 上點:combining dot above (U+0307)
    for (let i = 0; i < octaveDots; i++) {
      text += '\u0307';
    }
  } else if (octaveDots < 0) {
    // 下點:combining dot below (U+0323)
    for (let i = 0; i < Math.abs(octaveDots); i++) {
      text += '\u0323';
    }
  }

  return { text, degree, prefix, octaveDots };
}

/**
 * 取得指定調的調號升降記號列表（給 VexFlow 用）。
 *
 * @param {string} key - 調名
 * @returns {string} VexFlow 調號字串（如 'A', 'E', 'C#'）
 * @throws {Error} 未知調性時
 */
export function getVexFlowKeySignature(key) {
  assertValidKey(key);
  // VexFlow 使用調名直接作為 key signature 參數
  return key;
}

/**
 * 將拍數轉為 VexFlow 時值字串。
 *
 * @param {number} dur - 拍數（四分音符 = 1）
 * @returns {string} VexFlow 時值（如 'q', 'h', 'w', '8' 等）
 * @throws {Error} 無法對應的時值
 */
export function durationToVexFlow(dur) {
  // 常見時值對照
  const map = {
    4:    'w',     // 全音符
    3:    'hd',    // 附點二分音符
    2:    'h',     // 二分音符
    1.5:  'qd',    // 附點四分音符
    1:    'q',     // 四分音符
    0.75: '8d',    // 附點八分音符
    0.5:  '8',     // 八分音符
    0.25: '16',    // 十六分音符
  };

  // 使用接近的時值（浮點容差）
  for (const [beats, vfDur] of Object.entries(map)) {
    if (Math.abs(dur - parseFloat(beats)) < 0.001) {
      return vfDur;
    }
  }

  throw new Error(`無法將 ${dur} 拍轉換為 VexFlow 時值`);
}
