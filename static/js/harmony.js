/** Chord labels are stored at concert pitch; the Eb sax score sounds 9 semitones below its notation. */
import { concertToWrittenKey, midiToNoteName } from './pitch.js';

export function writtenChordSymbol(symbol, keyConcert) {
  if (typeof symbol !== 'string') return '';
  const writtenKey = concertToWrittenKey(keyConcert).writtenKey;
  const naturals = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const transpose = (_, letter, accidental = '') => {
    const pc = (naturals[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0) + 12) % 12;
    return midiToNoteName(60 + (pc + 9) % 12, writtenKey).name;
  };
  // Preserve chord quality, and transpose slash-bass notes as well as the root.
  return symbol.replace(/^([A-G])([#b]?)/, transpose)
    .replace(/\/([A-G])([#b]?)$/, (whole, letter, accidental) => '/' + transpose(whole, letter, accidental));
}

export function chordsInMeasure(song, measureIndex) {
  const beats = song.timeSignature?.[0] || 4;
  const start = measureIndex * beats;
  const stop = start + beats;
  return (song.chordSymbols || []).filter(chord => chord.start < stop - 1e-6
    && chord.start + chord.dur > start + 1e-6).map(chord => ({
      ...chord,
      // Repeat a sustained chord at the next line/measure for readability.
      displayBeat: Math.max(start, chord.start),
      writtenSymbol: writtenChordSymbol(chord.symbol, song.keyConcert || 'C'),
    }));
}
