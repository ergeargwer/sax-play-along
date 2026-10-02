/**
 * tracks.js -- 多音軌合成、靜音 (Mute)、獨奏 (Solo) 與音量控制
 */

/**
 * 將 MIDI 音高號碼轉換為 Hz 頻率
 * @param {number} midi - MIDI 音高號碼 (例如 60 = C4, 69 = A4)
 * @returns {number} 頻率 (Hz)
 */
export function midiToFrequency(midi) {
  if (typeof midi !== 'number' || midi <= 0) {
    return 0;
  }
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * 解析音軌之實際音訊發聲增益 (Gain)
 * 考量單軌音量 (volume)、靜音 (isMuted) 以及全域獨奏 (isSolo) 狀態
 *
 * @param {Object} track - 音軌物件 { id, volume, isMuted, isSolo }
 * @param {Array<Object>} allTracks - 所有音軌物件陣列
 * @returns {number} 實際發聲增益 (0.0 ~ 1.0)
 */
export function resolveTrackGain(track, allTracks) {
  if (!track || track.isMuted) {
    return 0.0;
  }

  const vol = typeof track.volume === 'number' ? Math.max(0, Math.min(1, track.volume)) : 0.6;
  const safeAllTracks = Array.isArray(allTracks) ? allTracks : [];

  const anySoloed = safeAllTracks.some((t) => t.isSolo && !t.isMuted);

  if (anySoloed) {
    return track.isSolo ? vol : 0.0;
  }

  return vol;
}

/**
 * 搜尋指定拍數區間 [startBeat, endBeat) 內音軌應播放的事件
 *
 * @param {Object} track - 音軌物件 ({ type, notes, ... })
 * @param {Array<Object>} songMelody - 主旋律陣列 [{ midi, start, dur }, ...]
 * @param {number} startBeat - 區間起始拍 (包含)
 * @param {number} endBeat - 區間結束拍 (不包含)
 * @returns {Array<Object>} 事件清單 [{ midi: number[], start: number, dur: number }]
 */
export function getEventsInBeatWindow(track, songMelody, startBeat, endBeat) {
  if (!track) return [];

  const events = [];

  if (track.type === 'melody') {
    const melodyList = Array.isArray(songMelody) ? songMelody : [];
    for (const item of melodyList) {
      if (typeof item.start === 'number' && item.start >= startBeat && item.start < endBeat) {
        events.push({
          midi: Array.isArray(item.midi) ? item.midi : [item.midi],
          start: item.start,
          dur: item.dur || 1,
        });
      }
    }
  } else if (track.type === 'notes') {
    const noteList = Array.isArray(track.notes) ? track.notes : [];
    for (const item of noteList) {
      if (typeof item.start === 'number' && item.start >= startBeat && item.start < endBeat) {
        events.push({
          midi: Array.isArray(item.midi) ? item.midi : [item.midi],
          start: item.start,
          dur: item.dur || 1,
        });
      }
    }
  }

  return events;
}

/**
 * TrackManager 類別 -- 管理所有音軌之狀態與 Web Audio 合成器
 */
export class TrackManager {
  constructor() {
    this.tracks = [];
    this.songMelody = [];
    this.audioCtx = null;
  }

  /**
   * 設定 AudioContext 實體
   * @param {AudioContext} ctx
   */
  setAudioContext(ctx) {
    this.audioCtx = ctx;
  }

  /**
   * 載入曲目音軌資料
   * @param {Object} song - 曲目 JSON 物件
   */
  init(song) {
    this.songMelody = (song && Array.isArray(song.melody)) ? song.melody : [];

    const defaultTracks = [
      { id: 'melody-guide', name: '旋律導奏', type: 'melody', volume: 0.6, isMuted: false, isSolo: false },
      { id: 'chords', name: '和弦', type: 'notes', volume: 0.5, notes: [], isMuted: false, isSolo: false },
      { id: 'bass', name: '貝斯', type: 'notes', volume: 0.6, notes: [], isMuted: false, isSolo: false },
      { id: 'metronome', name: '節拍', type: 'click', volume: 0.7, isMuted: false, isSolo: false },
    ];

    if (song && Array.isArray(song.tracks) && song.tracks.length > 0) {
      this.tracks = song.tracks.map((t) => ({
        id: t.id,
        name: t.name || t.id,
        type: t.type || 'notes',
        volume: typeof t.volume === 'number' ? t.volume : 0.6,
        notes: Array.isArray(t.notes) ? t.notes : [],
        isMuted: false,
        isSolo: false,
      }));
    } else {
      this.tracks = defaultTracks;
    }
  }

  /**
   * 取得所有音軌物件
   * @returns {Array<Object>}
   */
  getAllTracks() {
    return this.tracks;
  }

  /**
   * 依 ID 取得單一音軌
   * @param {string} trackId
   * @returns {Object|null}
   */
  getTrack(trackId) {
    return this.tracks.find((t) => t.id === trackId) || null;
  }

  /**
   * 設定音軌音量 (0.0 ~ 1.0)
   * @param {string} trackId
   * @param {number} volume
   */
  setVolume(trackId, volume) {
    const track = this.getTrack(trackId);
    if (track) {
      track.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 切換 / 設定音軌 Mute 狀態
   * @param {string} trackId
   * @param {boolean} [isMuted]
   */
  setMute(trackId, isMuted) {
    const track = this.getTrack(trackId);
    if (track) {
      track.isMuted = typeof isMuted === 'boolean' ? isMuted : !track.isMuted;
    }
  }

  /**
   * 切換 / 設定音軌 Solo 狀態
   * @param {string} trackId
   * @param {boolean} [isSolo]
   */
  setSolo(trackId, isSolo) {
    const track = this.getTrack(trackId);
    if (track) {
      track.isSolo = typeof isSolo === 'boolean' ? isSolo : !track.isSolo;
    }
  }

  /**
   * 取得音軌之有效增益
   * @param {string} trackId
   * @returns {number}
   */
  getEffectiveGain(trackId) {
    const track = this.getTrack(trackId);
    if (!track) return 0.0;
    return resolveTrackGain(track, this.tracks);
  }

  /**
   * 合成與發聲單個或多個音高 (Web Audio API)
   *
   * @param {string} trackId - 音軌 ID
   * @param {Array<number>} midiNotes - MIDI 號碼陣列
   * @param {number} time - 預定發聲音訊時間 (秒)
   * @param {number} durationSec - 發聲持續時間 (秒)
   */
  playNote(trackId, midiNotes, time, durationSec) {
    if (!this.audioCtx) return;
    const gainVal = this.getEffectiveGain(trackId);
    if (gainVal <= 0.001) return;

    const track = this.getTrack(trackId);
    const type = track ? track.type : 'notes';
    const notes = Array.isArray(midiNotes) ? midiNotes : [midiNotes];

    for (const midi of notes) {
      if (typeof midi !== 'number' || midi <= 0) continue;

      const freq = midiToFrequency(midi);
      if (freq <= 0) continue;

      try {
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        // 依音軌類型選擇振盪器波形
        if (trackId === 'melody-guide') {
          osc.type = 'triangle';
        } else if (trackId === 'bass') {
          osc.type = 'sine';
        } else if (type === 'notes') {
          osc.type = 'sine';
        } else {
          osc.type = 'triangle';
        }

        osc.frequency.setValueAtTime(freq, time);

        // 音量包絡線 (ADSR)
        const peakGain = gainVal * 0.3;
        const dur = Math.max(0.05, durationSec);
        const attack = 0.01;
        const release = 0.03;

        gainNode.gain.setValueAtTime(0.0001, time);
        gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, peakGain), time + attack);
        gainNode.gain.setValueAtTime(Math.max(0.001, peakGain), time + dur - release);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + dur);

        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc.start(time);
        osc.stop(time + dur + 0.01);
      } catch (err) {
        console.error(`音軌 ${trackId} 發聲失敗:`, err);
      }
    }
  }
}
