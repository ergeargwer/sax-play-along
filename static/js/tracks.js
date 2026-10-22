import { arrangeAccompaniment } from './accompaniment.js';
import { InstrumentBank, makeRoomImpulse } from './instruments.js';

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
          velocity: item.velocity ?? .72,
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
          velocity: item.velocity ?? .72,
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
    this.activeVoices = new Set();
    this.bank = new InstrumentBank();
    this.channels = new Map();
    this.song = null;
    this.master = null;
    this.reverb = null;
    this.roomImpulse = null;
  }

  /**
   * 設定 AudioContext 實體
   * @param {AudioContext} ctx
   */
  setAudioContext(ctx) {
    if (this.audioCtx === ctx) return;
    this.stopAll();
    this.audioCtx = ctx;
    this.channels.clear();
    this.master = ctx.createGain();
    this.master.gain.value = 1.6;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 18;
    compressor.ratio.value = 2.5;
    compressor.attack.value = .006;
    compressor.release.value = .22;
    this.master.connect(compressor);
    compressor.connect(ctx.destination);
    this.roomImpulse = makeRoomImpulse(ctx);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.roomImpulse;
    const roomReturn = ctx.createGain();
    roomReturn.gain.value = .13;
    this.reverb.connect(roomReturn);
    roomReturn.connect(this.master);
    this.refreshMix();
  }

  /**
   * 載入曲目音軌資料
   * @param {Object} song - 曲目 JSON 物件
   */
  init(song) {
    this.song = song;
    this.songMelody = (song && Array.isArray(song.melody)) ? song.melody : [];

    const defaultTracks = [
      { id: 'melody-guide', name: '旋律導奏', type: 'melody', volume: 0.6, isMuted: false, isSolo: false },
      { id: 'chords', name: '和弦', type: 'notes', volume: 0.5, notes: [], isMuted: false, isSolo: false },
      { id: 'bass', name: '貝斯', type: 'notes', volume: 0.6, notes: [], isMuted: false, isSolo: false },
      { id: 'metronome', name: '節拍', type: 'click', volume: 0.7, isMuted: false, isSolo: false },
    ];

    if (song && Array.isArray(song.tracks) && song.tracks.length > 0) {
      this.tracks = arrangeAccompaniment(song).map((t) => ({
        id: t.id,
        name: t.id === 'chords' ? '和弦 · 柔和鋼琴' : t.id === 'bass' ? '貝斯 · 原聲貝斯' : t.name || t.id,
        type: t.type || 'notes',
        volume: typeof t.volume === 'number' ? t.volume : 0.6,
        notes: Array.isArray(t.notes) ? t.notes : [],
        isMuted: Boolean(t.isMuted),
        isSolo: false,
      }));
    } else {
      this.tracks = defaultTracks;
    }
    this.refreshMix();
  }

  async prepareAudio() {
    if (!this.audioCtx) throw new Error('AudioContext 尚未初始化');
    await this.bank.load(this.audioCtx);
  }

  channelFor(trackId) {
    if (this.channels.has(trackId)) return this.channels.get(trackId);
    const ctx = this.audioCtx;
    const input = ctx.createGain();
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = trackId === 'bass' ? 28 : trackId === 'guitar' ? 160 : trackId === 'chords' ? 120 : 80;
    highpass.Q.value = .7;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = trackId === 'bass' ? 1800 : trackId === 'guitar' ? 4200 : 5200;
    lowpass.Q.value = .7;
    const pan = ctx.createStereoPanner();
    pan.pan.value = trackId === 'chords' ? -.12 : trackId === 'guitar' ? .24 : trackId === 'bass' ? .04 : .06;
    input.connect(highpass); highpass.connect(lowpass); lowpass.connect(pan);
    pan.connect(this.master);
    const send = ctx.createGain();
    send.gain.value = trackId === 'bass' ? .08 : trackId === 'guitar' ? .65 : trackId === 'metronome' ? 0 : 1;
    pan.connect(send); send.connect(this.reverb);
    this.channels.set(trackId, input);
    return input;
  }

  refreshMix() {
    if (!this.audioCtx || !this.master) return;
    for (const [id, channel] of this.channels) {
      if (!this.getTrack(id)) {
        channel.gain.cancelScheduledValues(this.audioCtx.currentTime);
        channel.gain.setTargetAtTime(0, this.audioCtx.currentTime, .012);
      }
    }
    for (const track of this.tracks) {
      const balance = track.id === 'bass' ? .7 : track.id === 'guitar' ? .75 : track.id === 'melody-guide' ? .55
        : track.id === 'metronome' ? .22 : 1;
      const parameter = this.channelFor(track.id).gain;
      parameter.cancelScheduledValues(this.audioCtx.currentTime);
      parameter.setTargetAtTime(this.getEffectiveGain(track.id) * balance, this.audioCtx.currentTime, .012);
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
      this.refreshMix();
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
      this.refreshMix();
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
      this.refreshMix();
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
  stopAll() {
    for (const source of this.activeVoices) {
      try { source.stop(); } catch (_) { /* Already stopped. */ }
      source.disconnect();
    }
    this.activeVoices.clear();
    // Clear the room tail as well as direct sound on pause, stop and song change.
    if (this.reverb) this.reverb.buffer = null;
  }

  playNote(trackId, midiNotes, time, durationSec, velocity = .72) {
    if (!this.audioCtx || this.getEffectiveGain(trackId) <= .001) return;
    const instrument = trackId === 'bass' ? 'acoustic-bass' : trackId === 'guitar' ? 'nylon-guitar' : 'piano';
    const notes = (Array.isArray(midiNotes) ? midiNotes : [midiNotes])
      .filter(midi => Number.isFinite(midi) && midi > 0);
    if (!notes.length || !Number.isFinite(durationSec) || durationSec <= 0) return;
    if (this.reverb && !this.reverb.buffer) this.reverb.buffer = this.roomImpulse;
    const ctx = this.audioCtx;
    const duration = Math.max(.04, durationSec);
    const start = Math.max(time, ctx.currentTime);
    const release = trackId === 'bass' ? .09 : trackId === 'guitar' ? .16 : .20;
    const strength = Math.max(.1, Math.min(1, velocity));
    for (let i = 0; i < notes.length; i++) {
      const midi = notes[i];
      const sample = this.bank.select(instrument, midi, strength);
      if (!sample) throw new Error(`音色尚未載入：${instrument}`);
      const source = ctx.createBufferSource();
      const envelope = ctx.createGain();
      source.buffer = sample.buffer;
      const rate = Math.pow(2, (midi - sample.root) / 12);
      source.playbackRate.setValueAtTime(rate, start);
      // A subtle 7ms piano spread softens the attack without changing beat anchors.
      const spread = trackId === 'guitar' ? .018 : trackId === 'chords' ? .007 : 0;
      const onset = start + Math.min(i * spread, duration * .15);
      const noteOff = start + duration;
      const peak = (trackId === 'bass' ? .70 : trackId === 'guitar' ? .46 : .56) * strength / Math.sqrt(notes.length);
      envelope.gain.setValueAtTime(.0001, onset);
      envelope.gain.linearRampToValueAtTime(peak, onset + Math.min(.006, duration * .12));
      // The sample supplies the instrument's own decay; this envelope handles key release.
      envelope.gain.setValueAtTime(peak, noteOff);
      envelope.gain.exponentialRampToValueAtTime(.0001, noteOff + release);
      source.connect(envelope);
      envelope.connect(this.channelFor(trackId));
      this.activeVoices.add(source);
      source.onended = () => {
        this.activeVoices.delete(source);
        source.disconnect(); envelope.disconnect();
      };
      source.start(onset);
      source.stop(Math.min(noteOff + release + .01, onset + sample.buffer.duration / rate));
    }
  }
}
