// Synthesises the app's sound effects into assets/audio/sfx/*.wav.
// Every sound is built from sine partials here, so the set
// is original and can be retuned by editing this file and re-running:
//
//   node scripts/generate-sounds.js
//
// Output is 44.1 kHz 16-bit mono WAV, which iOS, Android and web all play.

const fs = require('fs');
const path = require('path');

const SR = 44100;
const OUT = path.join(__dirname, '..', 'assets', 'audio', 'sfx');

// ─── Building blocks ────────────────────────────────────────────────────

const buffer = (seconds) => new Float32Array(Math.ceil(seconds * SR));

// A struck note: fast attack, exponential decay, optional pitch glide and
// extra partials ([ratio, gain, decayScale]) for bell or marimba colour.
function note(out, { at = 0, freq, to = freq, glide = 0.03, attack = 0.003, decay = 0.12, gain = 1, partials = [[1, 1, 1]] }) {
  const start = Math.floor(at * SR);
  const len = Math.min(out.length - start, Math.ceil((attack + decay * 7) * SR));
  const phase = partials.map(() => 0);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = to === freq ? freq : to + (freq - to) * Math.exp(-t / glide);
    const rise = t < attack ? t / attack : 1;
    let s = 0;
    partials.forEach(([ratio, g, d], k) => {
      phase[k] += (2 * Math.PI * f * ratio) / SR;
      s += Math.sin(phase[k]) * g * Math.exp(-t / (decay * d));
    });
    out[start + i] += s * rise * gain;
  }
}

// Air sliding past: noise through a resonant band-pass that sweeps from
// `from` to `to` Hz, under a smooth rise-and-fall envelope.
function swoosh(out, { at = 0, dur = 0.15, from = 700, to = 2600, q = 1.6, gain = 1, seed = 11 }) {
  let x = seed;
  const rand = () => ((x = (x * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const start = Math.floor(at * SR);
  const len = Math.min(out.length - start, Math.ceil(dur * SR));
  let low = 0, band = 0;
  for (let i = 0; i < len; i++) {
    const p = i / len;
    const f = from * Math.pow(to / from, p);
    const k = 2 * Math.sin((Math.PI * f) / SR);
    // Chamberlin state-variable filter.
    const high = rand() - low - band / q;
    band += k * high;
    low += k * band;
    const env = Math.pow(Math.sin(Math.PI * Math.pow(p, 0.7)), 2);
    out[start + i] += band * env * gain;
  }
}

// Softens a sound: two one-pole low-passes in a row take the grit off noise.
function smooth(buf, hz) {
  const a = 1 - Math.exp((-2 * Math.PI * hz) / SR);
  let x = 0, y = 0;
  for (let i = 0; i < buf.length; i++) {
    x += a * (buf[i] - x);
    y += a * (x - y);
    buf[i] = y;
  }
}

// A light room: a few feedback delays mixed under the dry signal.
function room(buf, { mix = 0.18, times = [0.029, 0.037, 0.043], feedback = 0.35 }) {
  const wet = new Float32Array(buf.length);
  for (const time of times) {
    const d = Math.floor(time * SR);
    const line = new Float32Array(buf.length);
    for (let i = 0; i < buf.length; i++) {
      line[i] = buf[i] + (i >= d ? line[i - d] * feedback : 0);
      wet[i] += (i >= d ? line[i - d] : 0) / times.length;
    }
  }
  for (let i = 0; i < buf.length; i++) buf[i] += wet[i] * mix;
}

// Loud but clean: soft saturation lifts the body and tail of each sound, then
// the peak is normalised just under full scale. Edges are faded to avoid clicks.
function master(buf, { drive = 2.4, peak = 0.97 } = {}) {
  const norm = peakOf(buf);
  for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] / norm * drive) / Math.tanh(drive);
  const max = peakOf(buf);
  const fadeIn = Math.floor(0.001 * SR), fadeOut = Math.floor(0.012 * SR);
  for (let i = 0; i < buf.length; i++) {
    let g = peak / max;
    if (i < fadeIn) g *= i / fadeIn;
    if (i > buf.length - fadeOut) g *= (buf.length - i) / fadeOut;
    buf[i] *= g;
  }
  return buf;
}
const peakOf = (buf) => buf.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;

function writeWav(name, buf) {
  const data = Buffer.alloc(buf.length * 2);
  buf.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const head = Buffer.alloc(44);
  head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVE', 8);
  head.write('fmt ', 12); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22);
  head.writeUInt32LE(SR, 24); head.writeUInt32LE(SR * 2, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34);
  head.write('data', 36); head.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(OUT, `${name}.wav`), Buffer.concat([head, data]));
  console.log(`${name}.wav  ${Math.round((buf.length / SR) * 1000)} ms`);
}

// Tone colours.
const MARIMBA = [[1, 1, 1], [4, 0.25, 0.25], [10, 0.05, 0.1]];
const BELL = [[1, 1, 1], [2.76, 0.32, 0.55], [5.4, 0.12, 0.3], [8.93, 0.05, 0.2]];
const HOLLOW = [[1, 1, 1], [3, 0.12, 0.8], [5, 0.04, 0.6]];

// ─── The set ────────────────────────────────────────────────────────────

const SOUNDS = {
  // Switching papers in the carousel: a crisp mouse-button click — a sharp
  // plastic snap over a short low knock — so each paper lands with a tick.
  click() {
    const b = buffer(0.04);
    swoosh(b, { dur: 0.004, from: 5000, to: 7000, q: 0.8, gain: 1.2 });
    note(b, { freq: 3200, attack: 0.0003, decay: 0.0025, gain: 0.8, partials: [[1, 1, 1], [1.6, 0.4, 0.6]] });
    note(b, { freq: 1250, attack: 0.0005, decay: 0.006, gain: 0.5 });
    return b;
  },

  // A subject card lifting to reveal its details: a soft, warm breath of air
  // that rises gently, loudest as the card moves fastest and fading as the
  // spring settles. Wide, low bands and a low-pass keep it free of hiss.
  air() {
    const b = buffer(0.45);
    swoosh(b, { dur: 0.42, from: 300, to: 900, q: 0.7 });
    swoosh(b, { dur: 0.4, from: 150, to: 400, q: 0.7, gain: 0.6, seed: 23 });
    smooth(b, 1400);
    return b;
  },

  // Opening a paper or starting a session: two rising marimba plucks.
  open() {
    const b = buffer(0.32);
    note(b, { freq: 784, decay: 0.05, gain: 0.8, partials: MARIMBA });
    note(b, { at: 0.065, freq: 1175, decay: 0.07, partials: MARIMBA });
    room(b, { mix: 0.12 });
    return b;
  },

  // Submitting: a firm settled fifth that resolves up an octave.
  submit() {
    const b = buffer(0.45);
    note(b, { freq: 523, decay: 0.07, gain: 0.7, partials: MARIMBA });
    note(b, { freq: 784, decay: 0.07, gain: 0.55, partials: MARIMBA });
    note(b, { at: 0.09, freq: 1047, decay: 0.1, partials: MARIMBA });
    room(b, { mix: 0.14 });
    return b;
  },

  // Correct answer: a bright two-note bell, rising a fifth.
  correct() {
    const b = buffer(0.6);
    note(b, { freq: 1319, decay: 0.07, gain: 0.75, partials: BELL });
    note(b, { at: 0.075, freq: 1976, decay: 0.12, partials: BELL });
    room(b, { mix: 0.16 });
    return b;
  },

  // Finishing a test, a streak or a milestone: a quick major arpeggio with a
  // sparkle on top, ringing out a little longer than everything else.
  success() {
    const b = buffer(1.1);
    [523, 659, 784].forEach((freq, i) => note(b, { at: i * 0.07, freq, decay: 0.08, gain: 0.7, partials: MARIMBA }));
    note(b, { at: 0.21, freq: 1047, decay: 0.2, partials: BELL });
    note(b, { at: 0.21, freq: 2093, decay: 0.12, gain: 0.25, partials: BELL });
    room(b, { mix: 0.22, feedback: 0.4 });
    return b;
  },

  // Wrong answer: two soft low notes stepping down — a gentle "not quite".
  wrong() {
    const b = buffer(0.5);
    note(b, { freq: 247, decay: 0.06, gain: 0.85, attack: 0.006, partials: HOLLOW });
    note(b, { at: 0.11, freq: 196, decay: 0.1, attack: 0.006, partials: HOLLOW });
    room(b, { mix: 0.1 });
    return b;
  },

  // Errors and failed actions: two short, slightly reedy beeps — clearly an
  // alert, different from the musical wrong-answer cue.
  error() {
    const b = buffer(0.36);
    const REED = [[1, 1, 1], [3, 0.3, 1], [5, 0.12, 1], [7, 0.05, 1]];
    note(b, { freq: 392, attack: 0.002, decay: 0.035, partials: REED });
    note(b, { at: 0.11, freq: 392, attack: 0.002, decay: 0.05, partials: REED });
    return b;
  },
};

fs.mkdirSync(OUT, { recursive: true });
// The click and air sounds repeat while browsing, so they sit below the feedback
// sounds instead of being pushed to full loudness.
const MASTERING = { click: { drive: 1.5, peak: 0.75 }, air: { drive: 0.5, peak: 0.2 } };

for (const [name, make] of Object.entries(SOUNDS)) writeWav(name, master(make(), MASTERING[name]));
