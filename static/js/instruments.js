/** Small local multisample bank. No runtime CDN, soundfont parser or audio driver. */
export class InstrumentBank {
  constructor(fetcher = (...args) => fetch(...args)) {
    this.fetcher = fetcher;
    this.context = null;
    this.promise = null;
    this.instruments = {};
  }

  async load(context) {
    if (this.context === context && this.promise) return this.promise;
    this.context = context;
    this.promise = this.loadAll(context).catch(error => {
      this.promise = null; // Allow retry after a missing/corrupt sample is repaired.
      this.instruments = {};
      throw error;
    });
    return this.promise;
  }

  async loadAll(context) {
    const base = '/static/audio/instruments/';
    const response = await this.fetcher(base + 'manifest.json');
    if (!response.ok) throw new Error('無法載入鋼琴／貝斯／吉他音色清單');
    const manifest = await response.json();
    if (['piano', 'acoustic-bass', 'nylon-guitar'].some(name => !manifest.instruments?.[name]?.length))
      throw new Error('鋼琴／貝斯／吉他音色清單不完整');
    const banks = {};
    // Limit parallel requests and decoder work on small computers/mobile devices.
    const jobs = Object.entries(manifest.instruments).flatMap(([name, entries]) => entries.map(entry => ({name, entry})));
    const worker = async () => {
      while (jobs.length) {
        const { name, entry } = jobs.shift();
        const result = await this.fetcher(base + entry.file);
        if (!result.ok) throw new Error(`音色載入失敗：${entry.file}`);
        const buffer = await context.decodeAudioData(await result.arrayBuffer());
        (banks[name] ||= []).push({ ...entry, buffer });
      }
    };
    // Wait for all workers, including those still decoding after another fails.
    const results = await Promise.allSettled(Array.from({ length: 4 }, worker));
    const failure = results.find(result => result.status === 'rejected');
    if (failure) throw failure.reason;
    this.instruments = banks;
  }

  select(instrument, midi, velocity = .7) {
    const entries = this.instruments[instrument] || [];
    const target = Math.max(1, Math.min(127, velocity * 127));
    // Prefer the closest pitch first, then the closest recorded velocity layer.
    return [...entries].sort((a, b) => Math.abs(a.root - midi) - Math.abs(b.root - midi)
      || Math.abs(a.velocity - target) - Math.abs(b.velocity - target)
      || a.root - b.root)[0] || null;
  }
}

/** Short, subdued room response; deterministic so renders/tests are reproducible. */
export function makeRoomImpulse(context) {
  const frames = Math.ceil(context.sampleRate * .65);
  const buffer = context.createBuffer(2, frames, context.sampleRate);
  let seed = 1907;
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < frames; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const seconds = i / context.sampleRate;
      data[i] = seconds < .014 ? 0 : (seed / 4294967296 * 2 - 1) * Math.exp(-seconds * 12);
    }
  }
  return buffer;
}
