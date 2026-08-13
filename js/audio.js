// ========== ÁUDIO — trilha + SFX terror ==========
const AudioSys = {
  ctx: null,
  master: null,
  music: null,
  musicGain: null,
  sfxGain: null,
  unlocked: false,
  muted: false,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.28;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.55;
    this.sfxGain.connect(this.master);
  },

  unlock() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.unlocked = true;
    this.startMusic();
  },

  startMusic() {
    if (!this.ctx || this.music) return;
    const a = new Audio('assets/audio/theme.mp3');
    a.loop = true;
    a.volume = 1;
    const src = this.ctx.createMediaElementSource(a);
    src.connect(this.musicGain);
    a.play().catch(() => {});
    this.music = a;
  },

  // --- util ---
  _now() { return this.ctx ? this.ctx.currentTime : 0; },
  _osc(type, freq, dur, vol, dest) {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(dest || this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  },
  _noise(dur, vol, filterFreq, type) {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    if (filterFreq) {
      const f = this.ctx.createBiquadFilter();
      f.type = type || 'lowpass';
      f.frequency.value = filterFreq;
      src.connect(f); f.connect(g);
    } else src.connect(g);
    g.connect(this.sfxGain);
    src.start(t);
  },

  // --- SFX ---
  punch() {
    this._noise(0.08, 0.5, 900, 'lowpass');
    this._osc('square', 90, 0.07, 0.2);
  },
  hit() {
    this._noise(0.12, 0.45, 600, 'bandpass');
    this._osc('sawtooth', 140, 0.1, 0.15);
  },
  playerHurt() {
    this._osc('sine', 220, 0.15, 0.2);
    this._osc('sine', 160, 0.2, 0.18);
    this._noise(0.15, 0.25, 400, 'lowpass');
  },
  pickup() {
    this._osc('sine', 660, 0.08, 0.15);
    this._osc('sine', 990, 0.12, 0.12);
  },
  doorUnlock() {
    this._osc('square', 180, 0.08, 0.12);
    this._noise(0.2, 0.3, 1200, 'highpass');
    this._osc('sine', 90, 0.25, 0.15);
  },
  doorLocked() {
    this._osc('square', 70, 0.1, 0.18);
    this._noise(0.08, 0.2, 300, 'lowpass');
  },
  save() {
    this._osc('sine', 440, 0.15, 0.12);
    this._osc('sine', 554, 0.2, 0.1);
    this._osc('sine', 659, 0.25, 0.08);
  },
  window() {
    this._noise(0.25, 0.35, 2500, 'highpass');
  },
  footsteps() {
    this._noise(0.04, 0.12, 200, 'lowpass');
  },
  ambientSting() {
    this._osc('sine', 55, 1.2, 0.08);
    this._noise(0.8, 0.1, 150, 'lowpass');
  },
  death() {
    this._osc('sawtooth', 120, 0.6, 0.2);
    this._osc('sine', 40, 1.2, 0.25);
    this._noise(1.0, 0.3, 200, 'lowpass');
  },
  typewriter() {
    this._noise(0.015, 0.08, 3000, 'highpass');
  },
  chest() {
    this._noise(0.15, 0.25, 400, 'lowpass');
    this._osc('triangle', 200, 0.12, 0.1);
  },
};

// auto-unlock on first input
['pointerdown', 'keydown'].forEach(ev => {
  window.addEventListener(ev, () => AudioSys.unlock(), { once: true });
});
