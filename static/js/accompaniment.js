/** Playback-only accompaniment: source harmony/notation and stored tracks stay intact. */
const EPS = 1e-6;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const pitchClass = midi => ((midi % 12) + 12) % 12;

/** Compact piano inversions in the middle register, minimizing voice movement. */
export function voiceLead(pitches, previous = []) {
  const pcs = [...new Set(pitches.filter(n => finite(n) && n > 0).map(pitchClass))].sort((a, b) => a - b);
  if (!pcs.length) return [];
  const options = [];
  for (let base = 54; base <= 72; base++) {
    if (!pcs.includes(base % 12)) continue;
    const notes = pcs.map(pc => base + (pc - base % 12 + 12) % 12).sort((a, b) => a - b);
    if (notes.at(-1) > 78) continue;
    const motion = previous.length ? notes.reduce((sum, n, i) => sum
      + Math.abs(n - previous[Math.min(i, previous.length - 1)]), 0) : 0;
    const center = notes.reduce((sum, n) => sum + n, 0) / notes.length;
    options.push({ notes, cost: motion + Math.abs(center - 65) * .45 });
  }
  options.sort((a, b) => a.cost - b.cost);
  return options[0]?.notes || [];
}

function bassPitch(pc, previous) {
  const choices = [24 + pc, 36 + pc, 48 + pc].filter(n => n >= 33 && n <= 48);
  choices.sort((a, b) => Math.abs(a - (previous ?? 40)) - Math.abs(b - (previous ?? 40)));
  return choices[0] ?? 36 + pc;
}

/** Return fresh tracks using the fixed gentle accompaniment. */
export function arrangeAccompaniment(song) {
  const tracks = (song.tracks || []).map(t => ({ ...t, notes: (t.notes || []).map(n => ({ ...n,
    midi: Array.isArray(n.midi) ? [...n.midi] : n.midi })) }));
  if (song.timeSignature?.[1] !== 4) return tracks;
  // Action themes keep their existing rhythmic drive until a dedicated style is authored.
  if (song.id === 'detective-conan') return addGuitarLayer(song, tracks);
  const chords = tracks.find(t => t.id === 'chords' && t.type === 'notes');
  if (!chords?.notes.length) return tracks;
  const beats = song.timeSignature?.[0] || 4;
  const total = (song.measures || 1) * beats;
  const melody = (song.melody || []).filter(n => n.midi > 0 && finite(n.start) && n.dur > 0);
  if (!melody.length) return tracks;
  const firstSound = Math.min(...melody.map(n => n.start));
  const lastSound = Math.min(total, Math.max(...melody.map(n => n.start + n.dur)));
  const lastBar = Math.max(0, Math.ceil(lastSound / beats - EPS) - 1);
  const piano = [], bass = [];
  let previous = [], previousBass;
  const source = [...chords.notes].sort((a, b) => a.start - b.start);
  for (const chord of source) {
    if (!finite(chord.start) || !finite(chord.dur) || chord.dur <= 0) continue;
    const pitches = (Array.isArray(chord.midi) ? chord.midi : [chord.midi]).filter(n => finite(n) && n > 0);
    if (!pitches.length) continue;
    const voiced = voiceLead(pitches, previous);
    if (!voiced.length) continue;
    previous = voiced;
    const symbol = (song.chordSymbols || []).find(s => s.start <= chord.start + EPS
      && s.start + s.dur > chord.start + EPS);
    const root = Number.isInteger(symbol?.root) ? symbol.root : pitchClass(Math.min(...pitches));
    const bassRoot = bassPitch(root, previousBass);
    previousBass = bassRoot;
    const chordEnd = Math.min(total, chord.start + chord.dur, lastSound);
    for (let bar = Math.floor(chord.start / beats); bar * beats < chordEnd - EPS; bar++) {
      const barStart = bar * beats;
      const start = Math.max(chord.start, barStart, firstSound);
      const end = Math.min(chordEnd, barStart + beats);
      if (end <= start + EPS) continue;
      if (!melody.some(n => n.start < end - EPS && n.start + n.dur > start + EPS)) continue;
      // A rest after a phrase gives the accompaniment a natural breath, too.
      const soundingEnd = Math.max(...melody.filter(n => n.start < end - EPS
        && n.start + n.dur > start + EPS).map(n => Math.min(end, n.start + n.dur)));
      const phraseEnd = soundingEnd < end - .45 || (bar + 1) % 4 === 0;
      const factor = phraseEnd ? .86 : 1;
      const push = (list, midi, at, dur, velocity) => {
        const limit = phraseEnd ? soundingEnd : end;
        const length = Math.min(dur, limit - at);
        if (at >= start - EPS && length > .04) list.push({ midi, start: at, dur: length, velocity: velocity * factor });
      };
      if (bar === lastBar) {
        // Settle the final chord rather than repeating the mechanical pattern.
        push(piano, voiced, start, (end - start) * .92, .54);
        push(bass, bassRoot, start, Math.min(1.6, (end - start) * .85), .65);
        continue;
      }
      if (beats === 3) {
        push(bass, bassRoot, start, .78, .72);
        // Preserve mid-bar harmonic changes and pickups without backdating notes.
        if (start > barStart + EPS) push(piano, voiced, start, .66, .52);
        for (const beat of [1, 2]) {
          const at = barStart + beat;
          if (at > start + EPS || Math.abs(start - barStart) < EPS)
            push(piano, voiced, at, .64, beat === 1 ? .59 : .50);
        }
      } else {
        push(bass, bassRoot, start, .85, .70);
        if (barStart + 2 > start + EPS) push(bass, bassPitch((root + 7) % 12, bassRoot), barStart + 2, .72, .55);
        // Sparse, even quarter-note arpeggios keep the practice pulse clear.
        const times = [start];
        for (let at = Math.floor(start + EPS) + 1; at < end - EPS; at++) times.push(at);
        times.forEach((at, i) => {
          const order = [0, Math.min(2, voiced.length - 1), 1, Math.min(2, voiced.length - 1)];
          push(piano, [voiced[order[i % order.length]]], at, .90, i === 0 ? .67 : .55);
        });
      }
    }
  }
  if (!piano.length) return tracks;
  chords.notes = piano.sort((a, b) => a.start - b.start);
  let bassTrack = tracks.find(t => t.id === 'bass');
  if (!bassTrack) {
    bassTrack = { id: 'bass', name: '貝斯', type: 'notes', volume: .4 };
    tracks.push(bassTrack);
  }
  bassTrack.notes = bass.sort((a, b) => a.start - b.start);
  return addGuitarLayer(song, tracks);
}


/** Quiet offbeat picking complements piano attacks and leaves the low end to bass. */
function addGuitarLayer(song, tracks) {
  // An authored guitar part, including an intentionally empty one, is authoritative.
  if (tracks.some(t => t.id === 'guitar')) return tracks;
  const source = song.tracks?.find(t => t.id === 'chords' && t.type === 'notes');
  const melody = (song.melody || []).filter(n => n.midi > 0 && finite(n.start) && n.dur > 0);
  if (!source?.notes?.length || !melody.length) return tracks;
  const beats = song.timeSignature[0];
  const firstSound = Math.min(...melody.map(n => n.start));
  const lastSound = Math.min(song.measures * beats, Math.max(...melody.map(n => n.start + n.dur)));
  const lastBar = Math.ceil(lastSound / beats - EPS) - 1;
  const notes = [];
  let previous = [];
  for (const chord of [...source.notes].sort((a, b) => a.start - b.start)) {
    if (!finite(chord.start) || !finite(chord.dur) || chord.dur <= 0) continue;
    const voiced = voiceLead(Array.isArray(chord.midi) ? chord.midi : [chord.midi], previous);
    if (!voiced.length) continue;
    previous = voiced;
    const chordEnd = Math.min(chord.start + chord.dur, lastSound);
    for (let bar = Math.floor(chord.start / beats); bar * beats < chordEnd - EPS; bar++) {
      const start = Math.max(chord.start, bar * beats, firstSound);
      const end = Math.min(chordEnd, (bar + 1) * beats);
      const sounding = melody.filter(n => n.start < end - EPS && n.start + n.dur > start + EPS);
      if (!sounding.length || end <= start + EPS) continue;
      const soundingEnd = Math.max(...sounding.map(n => Math.min(end, n.start + n.dur)));
      const limit = soundingEnd < end - .45 ? soundingEnd : end;
      const factor = (bar + 1) % 4 === 0 ? .85 : 1;
      const push = (midi, at, duration, velocity) => {
        const dur = Math.min(duration, limit - at);
        if (at >= start - EPS && dur > .04) notes.push({ midi, start: at, dur, velocity: velocity * factor });
      };
      if (bar === lastBar) {
        // A quiet final brush, slightly behind piano/bass, instead of endless picking.
        push(voiced.slice(0, 3), start + Math.min(.12, (limit - start) / 4),
          (limit - start) * .8, .42);
        continue;
      }
      const order = [0, Math.min(2, voiced.length - 1), 1, Math.min(2, voiced.length - 1)];
      const step = song.id === 'detective-conan' ? 2 : 1;
      let index = 0;
      for (let at = bar * beats + .5; at < limit - EPS; at += step) {
        if (at < start - EPS) continue;
        push([voiced[order[index % order.length]]], at, .70, index === 0 ? .54 : .46);
        index++;
      }
    }
  }
  if (notes.length) tracks.push({ id: 'guitar', name: '木吉他 · 輕柔撥弦', type: 'notes',
    volume: .25, notes: notes.sort((a, b) => a.start - b.start) });
  return tracks;
}
