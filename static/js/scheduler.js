/**
 * scheduler.js -- Web Audio Lookahead 節拍排程器與跟譜控制 (階段 4 整合多音軌合成)
 *
 * 說明:
 * 1. 以 AudioContext.currentTime 為唯一時間基準
 * 2. 採 Lookahead 模式: 約 25 ms 定時檢查未來約 100 ms 內拍點與伴奏音符事先排入 Web Audio
 * 3. 預備拍 (Count-in): 一小節大字倒數與短促點擊音
 * 4. 游標與音符高亮: requestAnimationFrame + 扣除音訊延遲 (outputLatency / baseLatency)
 * 5. 動態變速與小節循環: 變速時錨點重算保持拍位連續
 * 6. 多音軌控制: 整合 TrackManager (旋律導奏、和弦、貝斯、節拍)
 */

import {
  bpmToBeatDuration,
  calculateBeatFromAudioTime,
  calculateAudioTimeForBeat,
  updateTempoAnchor,
  findActiveNoteAtBeat,
  wrapLoopBeat,
  generateBeatSequence,
} from './schedulerMath.js';

import { highlightNoteByIndex, clearHighlights } from './score.js';
import { TrackManager, getEventsInBeatWindow } from './tracks.js';

export const PlaybackState = {
  IDLE: 'IDLE',
  COUNT_IN: 'COUNT_IN',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
};

export class Scheduler {
  /**
   * @param {Object} [options]
   * @param {Function} [options.getAudioTime] - 注入式時鐘函式,預設使用 AudioContext.currentTime
   */
  constructor(options = {}) {
    this.audioCtx = null;
    this.getAudioTimeOverride = options.getAudioTime || null;

    // 音軌管理器
    this.trackManager = new TrackManager();

    // 狀態
    this.state = PlaybackState.IDLE;
    this.song = null;
    this.baseBpm = 120;
    this.tempoRatio = 1.0;
    this.beatsPerMeasure = 4;
    this.totalMeasures = 8;

    // 錨點時間與拍數 (用於動態變速)
    this.anchorTime = 0.0;
    this.anchorBeat = 0.0;

    // 循環與預備拍
    this.loopEnabled = false;
    this.loopStartMeasure = 1;
    this.loopEndMeasure = 8;
    this.hasCountedIn = false;

    // Lookahead 排程內部狀態
    this.timerId = null;
    this.animFrameId = null;
    this.lookaheadInterval = 25; // ms
    this.scheduleAheadTime = 0.100; // 秒

    this.scheduledBeatEvents = [];
    this.nextBeatIndex = 0;
    this.scheduledNoteKeys = new Set();

    // 回呼函式
    this.countInCallback = null;
    this.stateChangeCallback = null;
  }

  /**
   * 取得目前音訊時間
   * @returns {number} 秒
   */
  getCurrentAudioTime() {
    if (typeof this.getAudioTimeOverride === 'function') {
      return this.getAudioTimeOverride();
    }
    if (this.audioCtx) {
      return this.audioCtx.currentTime;
    }
    return 0.0;
  }

  /**
   * 取得目前音訊延遲
   * @returns {number} 秒
   */
  getAudioLatency() {
    if (!this.audioCtx) return 0.0;
    return (this.audioCtx.outputLatency || this.audioCtx.baseLatency || 0.0);
  }

  /**
   * 載入曲目
   * @param {Object} song
   */
  init(song) {
    this.stop();
    this.song = song;
    this.baseBpm = song.tempo || 120;
    this.beatsPerMeasure = song.timeSignature ? song.timeSignature[0] : 4;
    this.totalMeasures = song.measures || 8;
    this.loopStartMeasure = 1;
    this.loopEndMeasure = this.totalMeasures;
    this.hasCountedIn = false;
    this.tempoRatio = 1;
    this.loopEnabled = false;
    this.scheduledNoteKeys.clear();

    // 初始化音軌
    this.trackManager.init(song);
  }

  /**
   * 初始化 / 恢復 AudioContext
   */
  async ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) {
        throw new Error('您的瀏覽器不支援 Web Audio API');
      }
      this.audioCtx = new AudioCtxClass();
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.trackManager.setAudioContext(this.audioCtx);
  }

  /**
   * 播放節拍點擊音 (Web Audio 短促音)
   *
   * @param {number} time - 預定發聲音訊時間 (秒)
   * @param {boolean} isAccent - 是否為第一拍重拍
   */
  playClick(time, isAccent) {
    if (!this.audioCtx) return;

    const gainVal = this.trackManager.getEffectiveGain('metronome');
    if (gainVal <= 0.001) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // 重拍 1200 Hz,輕拍 800 Hz
      osc.frequency.setValueAtTime(isAccent ? 1200 : 800, time);

      // 短包絡線 0.03 秒
      const peakGain = (isAccent ? 0.4 : 0.25) * gainVal;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peakGain), time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      this.trackManager.activeVoices.add(osc);
      osc.onended = () => {
        this.trackManager.activeVoices.delete(osc);
        osc.disconnect();
        gain.disconnect();
      };
      osc.start(time);
      osc.stop(time + 0.035);
    } catch (err) {
      console.error('發聲失敗:', err);
    }
  }

  /**
   * 設定狀態並發送回呼通知
   * @param {string} newState
   */
  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      if (typeof this.stateChangeCallback === 'function') {
        this.stateChangeCallback(this.state);
      }
    }
  }

  /**
   * 開始 / 繼續播放
   */
  async play() {
    if (!this.song) return;

    try {
      await this.ensureAudioContext();
    } catch (err) {
      alert(`無法啟動音訊: ${err.message}`);
      return;
    }

    if (this.state !== PlaybackState.IDLE && this.state !== PlaybackState.PAUSED) return;
    const now = this.getCurrentAudioTime();

    if (this.state === PlaybackState.IDLE) {
      // 首次播放，進行預備拍（若尚未執行過）
      const needCountIn = !this.hasCountedIn;
      this.scheduledBeatEvents = generateBeatSequence(this.totalMeasures, this.beatsPerMeasure, needCountIn);

      if (needCountIn) {
        // 預備拍起點：第一個預備拍定在 0.1s 後
        const firstBeatTime = now + 0.1;
        const countInBeatDuration = bpmToBeatDuration(this.baseBpm * this.tempoRatio);
        // 歌曲第一拍 (beat 0) 對應之音訊時間
        const songStartAudioTime = firstBeatTime + this.beatsPerMeasure * countInBeatDuration;

        this.anchorTime = songStartAudioTime;
        this.anchorBeat = 0;
        this.setState(PlaybackState.COUNT_IN);
      } else {
        this.anchorTime = now + 0.1;
        this.anchorBeat = 0;
        this.setState(PlaybackState.PLAYING);
      }

      this.nextBeatIndex = needCountIn ? -this.beatsPerMeasure : 0;
      this.scheduledNoteKeys.clear();
    } else if (this.state === PlaybackState.PAUSED) {
      // 從暫停處繼續
      this.anchorTime = now;
      this.setState(PlaybackState.PLAYING);
    }

    // 啟動 Lookahead 排程輪詢與動畫禎
    this.startSchedulerLoop();
    this.startAnimFrameLoop();
  }

  /**
   * 暫停播放
   */
  pause() {
    if (this.state === PlaybackState.PLAYING || this.state === PlaybackState.COUNT_IN) {
      const now = this.getCurrentAudioTime();
      const currentBeat = calculateBeatFromAudioTime(now, this.anchorTime, this.anchorBeat, this.baseBpm, this.tempoRatio);
      this.anchorBeat = Math.max(0, currentBeat);
      this.anchorTime = now;

      this.trackManager.stopAll();
      this.scheduledNoteKeys.clear();
      this.nextBeatIndex = Math.ceil(this.anchorBeat);
      if (this.countInCallback) this.countInCallback(null);
      this.setState(PlaybackState.PAUSED);
      this.stopSchedulerLoop();
      this.stopAnimFrameLoop();
    }
  }

  /**
   * 停止播放並重置
   */
  stop() {
    this.trackManager.stopAll();
    this.setState(PlaybackState.IDLE);
    this.stopSchedulerLoop();
    this.stopAnimFrameLoop();

    this.anchorTime = 0.0;
    this.anchorBeat = 0.0;
    this.nextBeatIndex = 0;
    this.hasCountedIn = false;
    this.scheduledNoteKeys.clear();

    clearHighlights();

    if (typeof this.countInCallback === 'function') {
      this.countInCallback(null);
    }
  }

  /**
   * 動態調整速度 (50% ~ 120%)
   * @param {number} ratio
   */
  setTempoRatio(ratio) {
    const newRatio = Math.max(0.5, Math.min(1.2, ratio));
    if (Math.abs(newRatio - this.tempoRatio) < 0.001) return;

    const now = this.getCurrentAudioTime();

    if (this.state === PlaybackState.PLAYING || this.state === PlaybackState.COUNT_IN) {
      const currentBeat = calculateBeatFromAudioTime(now, this.anchorTime, this.anchorBeat, this.baseBpm, this.tempoRatio);
      const newAnchor = updateTempoAnchor(now, currentBeat, newRatio);
      this.anchorTime = newAnchor.anchorTime;
      this.anchorBeat = newAnchor.anchorBeat;
    }

    this.tempoRatio = newRatio;
  }

  /**
   * 設定小節循環範圍
   */
  setLoopRange(startMeasure, endMeasure, enabled) {
    this.loopStartMeasure = Math.max(1, startMeasure);
    this.loopEndMeasure = Math.min(this.totalMeasures, Math.max(this.loopStartMeasure, endMeasure));
    this.loopEnabled = !!enabled;
  }

  /**
   * 啟動 Lookahead 排程輪詢
   */
  startSchedulerLoop() {
    this.stopSchedulerLoop();
    this.timerId = setInterval(() => this.schedulerTick(), this.lookaheadInterval);
  }

  /**
   * 停止 Lookahead 排程輪詢
   */
  stopSchedulerLoop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * 排程目前時間視窗內的音軌伴奏音符 (melody-guide, chords, bass)
   */
  scheduleTrackNotesInWindow(now, windowEnd) {
    const start = calculateBeatFromAudioTime(now, this.anchorTime, this.anchorBeat, this.baseBpm, this.tempoRatio);
    const end = calculateBeatFromAudioTime(windowEnd, this.anchorTime, this.anchorBeat, this.baseBpm, this.tempoRatio);
    const loopStart = (this.loopStartMeasure - 1) * this.beatsPerMeasure;
    const loopEnd = this.loopEndMeasure * this.beatsPerMeasure;
    const length = loopEnd - loopStart;
    let cursor = Math.max(0, start);
    while (cursor < end) {
      const cycle = this.loopEnabled && cursor >= loopEnd ? Math.floor((cursor - loopStart) / length) : 0;
      const offset = cycle * length;
      const boundary = this.loopEnabled ? loopEnd + offset : this.totalMeasures * this.beatsPerMeasure;
      const segmentEnd = Math.min(end, boundary);
      if (segmentEnd <= cursor) break;
      for (const track of this.trackManager.getAllTracks()) {
        if (track.type === 'click') continue;
        for (const ev of getEventsInBeatWindow(track, this.song.melody, cursor - offset, segmentEnd - offset)) {
          const key = `${track.id}_${ev.start}_${ev.midi.join(',')}_${cycle}`;
          if (this.scheduledNoteKeys.has(key)) continue;
          const time = calculateAudioTimeForBeat(ev.start + offset, this.anchorTime, this.anchorBeat, this.baseBpm, this.tempoRatio);
          const dur = Math.min(ev.dur, boundary - ev.start - offset) * bpmToBeatDuration(this.baseBpm * this.tempoRatio);
          this.trackManager.playNote(track.id, ev.midi, time, dur);
          this.scheduledNoteKeys.add(key);
        }
      }
      cursor = segmentEnd;
    }
  }

  schedulerTick() {
    if (this.state !== PlaybackState.PLAYING && this.state !== PlaybackState.COUNT_IN) return;
    const now = this.getCurrentAudioTime();
    const windowEnd = now + this.scheduleAheadTime;
    const currentBeat = calculateBeatFromAudioTime(now, this.anchorTime, this.anchorBeat, this.baseBpm, this.tempoRatio);
    if (this.state === PlaybackState.COUNT_IN && currentBeat >= 0) {
      this.hasCountedIn = true;
      this.setState(PlaybackState.PLAYING);
      if (this.countInCallback) this.countInCallback(null);
    }
    const total = this.totalMeasures * this.beatsPerMeasure;
    while (this.loopEnabled || this.nextBeatIndex < total) {
      const beat = this.nextBeatIndex;
      const time = calculateAudioTimeForBeat(beat, this.anchorTime, this.anchorBeat, this.baseBpm, this.tempoRatio);
      if (time >= windowEnd) break;
      if (time >= now - 0.05) this.playClick(Math.max(now, time), beat % this.beatsPerMeasure === 0);
      this.nextBeatIndex++;
    }
    if (this.state === PlaybackState.COUNT_IN && this.countInCallback) {
      this.countInCallback(Math.max(1, Math.ceil(-currentBeat)));
    }
    // 預備拍結束前也預排歌曲第一個音，避免依賴動畫幀啟動音訊。
    this.scheduleTrackNotesInWindow(now, windowEnd);
  }

  /**
   * 啟動 requestAnimationFrame 動畫畫幀進行游標與音符高亮更新
   */
  startAnimFrameLoop() {
    this.stopAnimFrameLoop();
    const loop = () => {
      this.updateCursorAndHighlight();
      if (this.state === PlaybackState.PLAYING || this.state === PlaybackState.COUNT_IN) {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  /**
   * 停止 requestAnimationFrame 動畫畫幀
   */
  stopAnimFrameLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /**
   * 每幀更新：音訊時間 -> 拍位 -> 音符高亮
   */
  updateCursorAndHighlight() {
    const rawAudioTime = this.getCurrentAudioTime();
    const latency = this.getAudioLatency();
    const effectiveAudioTime = Math.max(0, rawAudioTime - latency);

    const rawBeat = calculateBeatFromAudioTime(
      effectiveAudioTime,
      this.anchorTime,
      this.anchorBeat,
      this.baseBpm,
      this.tempoRatio
    );

    if (this.state === PlaybackState.COUNT_IN) {
      if (rawBeat >= 0) {
        this.hasCountedIn = true;
        this.setState(PlaybackState.PLAYING);
        if (typeof this.countInCallback === 'function') {
          this.countInCallback(null);
        }
      } else {
        return;
      }
    }

    if (this.state === PlaybackState.PLAYING) {
      const totalBeats = this.totalMeasures * this.beatsPerMeasure;
      let targetBeat = rawBeat;

      if (this.loopEnabled) {
        targetBeat = wrapLoopBeat(rawBeat, this.loopStartMeasure, this.loopEndMeasure, this.beatsPerMeasure);


      }

      if (!this.loopEnabled && targetBeat >= totalBeats) {
        this.stop();
        return;
      }

      if (this.song && Array.isArray(this.song.melody)) {
        const noteMatch = findActiveNoteAtBeat(
          this.song.melody,
          targetBeat,
          this.totalMeasures,
          this.beatsPerMeasure
        );

        if (noteMatch) {
          highlightNoteByIndex(noteMatch.noteIndex);
        } else {
          clearHighlights();
        }
      }
    }
  }
}
