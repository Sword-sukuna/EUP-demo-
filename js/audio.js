// ========== ÁUDIO — trilha + SFX terror ==========
const AudioSys = {
  ctx: null,
  master: null,
  music: null,
  musicGain: null,
  sfxGain: null,
  unlocked: false,
  muted: false,
  _hurtCD: 0,
  _talkCD: 0,
  _monsterCD: 0,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.26;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.7;
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

  _now() { return this.ctx ? this.ctx.currentTime : 0; },

  _osc(type, freq, dur, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo != null) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(Math.max(0.001, vol), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.03);
  },

  _noise(dur, vol, filterFreq, type) {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const n = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(Math.max(0.001, vol), t);
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

  punch() {
    this._noise(0.09, 0.55, 1000, 'lowpass');
    this._osc('square', 100, 0.08, 0.22, 50);
  },
  hit() {
    this._noise(0.12, 0.5, 700, 'bandpass');
    this._osc('sawtooth', 160, 0.1, 0.18, 70);
  },
  playerHurt() {
    // cooldown pra não spammar
    const now = performance.now();
    if (now - this._hurtCD < 280) return;
    this._hurtCD = now;
    this._osc('square', 280, 0.12, 0.35, 90);
    this._osc('sine', 180, 0.2, 0.28, 60);
    this._noise(0.18, 0.4, 500, 'lowpass');
  },
  monsterAggro(type) {
    const now = performance.now();
    if (now - this._monsterCD < 900) return;
    this._monsterCD = now;
    if (type === 'aranha') {
      this._noise(0.2, 0.35, 2000, 'highpass');
      this._osc('sawtooth', 320, 0.15, 0.2, 120);
    } else if (type === 'elite') {
      this._osc('sawtooth', 70, 0.35, 0.3, 40);
      this._noise(0.3, 0.35, 300, 'lowpass');
    } else if (type === 'vulto') {
      this._osc('sine', 90, 0.4, 0.22, 45);
      this._noise(0.35, 0.2, 180, 'lowpass');
    } else {
      // fantasma
      this._osc('sine', 420, 0.35, 0.18, 180);
      this._osc('sine', 210, 0.4, 0.15, 90);
    }
  },
  monsterIdle() {
    const now = performance.now();
    if (now - this._monsterCD < 2500) return;
    this._monsterCD = now;
    this._osc('sine', 55 + Math.random() * 30, 0.6, 0.08, 30);
  },
  talk() {
    // beep estilo RPG clássico / point-and-click
    const now = performance.now();
    if (now - this._talkCD < 45) return;
    this._talkCD = now;
    const f = 380 + Math.random() * 220;
    this._osc('square', f, 0.045, 0.12, f * 0.85);
  },
  pickup() {
    this._osc('sine', 660, 0.08, 0.18);
    this._osc('sine', 990, 0.12, 0.14);
  },
  doorUnlock() {
    this._osc('square', 180, 0.08, 0.14);
    this._noise(0.2, 0.32, 1200, 'highpass');
    this._osc('sine', 90, 0.25, 0.16);
  },
  doorLocked() {
    this._osc('square', 70, 0.1, 0.2);
    this._noise(0.08, 0.22, 300, 'lowpass');
  },
  save() {
    this._osc('sine', 440, 0.15, 0.14);
    this._osc('sine', 554, 0.2, 0.12);
    this._osc('sine', 659, 0.25, 0.1);
  },
  window() {
    this._noise(0.25, 0.35, 2500, 'highpass');
  },
  ambientSting() {
    this._osc('sine', 55, 1.2, 0.09);
    this._noise(0.8, 0.12, 150, 'lowpass');
  },
  death() {
    this._osc('sawtooth', 120, 0.6, 0.22);
    this._osc('sine', 40, 1.2, 0.28);
    this._noise(1.0, 0.32, 200, 'lowpass');
  },
  chest() {
    this._noise(0.15, 0.28, 400, 'lowpass');
    this._osc('triangle', 200, 0.12, 0.12);
  },

  /** abaixa música e entra clima macabro */
  enterEndingMood() {
    this.init();
    if (!this.ctx) return;
    if (this.musicGain) {
      const t = this._now();
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
      this.musicGain.gain.linearRampToValueAtTime(0.06, t + 1.5);
    }
    // drone grave contínuo curto
    this._endingDrone();
  },

  _endingDrone() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const o = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o2.type = 'sine';
    o.frequency.value = 36;
    o2.frequency.value = 37.5;
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.12, t + 1.2);
    g.gain.linearRampToValueAtTime(0.08, t + 6);
    g.gain.exponentialRampToValueAtTime(0.001, t + 10);
    o.connect(g); o2.connect(g);
    g.connect(this.sfxGain);
    o.start(t); o2.start(t);
    o.stop(t + 10.1); o2.stop(t + 10.1);
  },

  jumpScare() {
    if (!this.ctx || this.muted) return;
    // stinger forte
    this._noise(0.35, 0.9, 800, 'bandpass');
    this._noise(0.25, 0.7, 3000, 'highpass');
    this._osc('sawtooth', 90, 0.4, 0.5, 30);
    this._osc('square', 180, 0.2, 0.4, 50);
    this._osc('sine', 40, 0.8, 0.35, 20);
    // boost breve no master
    if (this.master) {
      const t = this._now();
      const v = this.master.gain.value;
      this.master.gain.setValueAtTime(v, t);
      this.master.gain.linearRampToValueAtTime(Math.min(1, v + 0.15), t + 0.05);
      this.master.gain.linearRampToValueAtTime(v, t + 0.5);
    }
  },

  restoreMusic() {
    if (!this.musicGain || !this.ctx) return;
    const t = this._now();
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
    this.musicGain.gain.linearRampToValueAtTime(0.26, t + 1.5);
  },
};

['pointerdown', 'keydown'].forEach(ev => {
  window.addEventListener(ev, () => AudioSys.unlock(), { once: true });
});
