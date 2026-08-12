// ========== JOGADOR COM SPRITES ==========

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.footOffset = 28; // pés mais embaixo no sprite
    this.speed = 3.2;
    this.runSpeed = 5.0;
    this.sanity = 100;
    this.maxSanity = 100;

    this.inventory = [null, null, null, null];
    this.selectedSlot = 0;

    this.hasLantern = false;
    this.lanternOn = false;
    this.lightRadius = 95;
    this.lanternRadius = 170;

    this.attackCooldown = 0;
    this.attackRange = 48;
    this.facing = 'down'; // down | up | left | right
    this.invincible = 0;
    this.anim = 0;
    this.moving = false;
    this.running = false;
    this.attacking = false;
    this.attackFrame = 0;

    // sprites
    this.sprites = { walk: {}, run: {}, punch: {} };
    this.spritesLoaded = false;
    this._loadSprites();
  }

  _loadSprites() {
    const dirs = ['down', 'up', 'left', 'right'];
    const base = 'assets/sprites/player/';
    let pending = 0;
    const done = () => { pending--; if (pending <= 0) this.spritesLoaded = true; };

    for (const d of dirs) {
      this.sprites.walk[d] = [];
      this.sprites.run[d] = [];
      this.sprites.punch[d] = [];
      for (let i = 1; i <= 4; i++) {
        pending++;
        const img = new Image();
        img.onload = done;
        img.onerror = done;
        img.src = base + 'walk_' + d + '_' + i + '.png';
        this.sprites.walk[d].push(img);
      }
      for (let i = 1; i <= 4; i++) {
        pending++;
        const img = new Image();
        img.onload = done;
        img.onerror = done;
        img.src = base + 'run_' + d + '_' + i + '.png';
        this.sprites.run[d].push(img);
      }
      for (let i = 1; i <= 3; i++) {
        pending++;
        const img = new Image();
        img.onload = done;
        img.onerror = done;
        img.src = base + 'punch_' + d + '_' + i + '.png';
        this.sprites.punch[d].push(img);
      }
    }
  }

  get vision() {
    return (this.lanternOn && this.hasLantern) ? this.lanternRadius : this.lightRadius;
  }

  solidAt(px, py) {
    const footY = py + this.footOffset;
    if (typeof isSolid === 'function' && isSolid(px, footY)) return true;
    return false;
  }

  feetPos() {
    return { x: this.x, y: this.y + this.footOffset };
  }

  takeDamage(amount) {
    if (this.invincible > 0) return;
    this.sanity = Math.max(0, this.sanity - amount);
    this.invincible = 40;
  }

  heal(amount) {
    this.sanity = Math.min(this.maxSanity, this.sanity + amount);
  }

  addItem(type) {
    for (let i = 0; i < 4; i++) {
      if (!this.inventory[i]) { this.inventory[i] = type; return true; }
    }
    return false;
  }

  hasItem(type) { return this.inventory.includes(type); }

  useSelectedItem() {
    const item = this.inventory[this.selectedSlot];
    if (!item) return null;
    if (item === 'cafe') {
      this.heal(25);
      this.inventory[this.selectedSlot] = null;
      return 'Café. +25 sanidade.';
    }
    if (item === 'lanterna') {
      this.hasLantern = true;
      this.lanternOn = true;
      this.inventory[this.selectedSlot] = null;
      return 'Lanterna equipada.';
    }
    return null;
  }

  startAttack() {
    if (this.attackCooldown > 0 || this.attacking) return false;
    this.attacking = true;
    this.attackFrame = 0;
    this.attackCooldown = this.hasItem('faca') ? 16 : 22;
    return true;
  }

  update() {
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invincible > 0) this.invincible--;

    if (this.attacking) {
      this.attackFrame += 0.35;
      if (this.attackFrame >= 3) {
        this.attacking = false;
        this.attackFrame = 0;
      }
    }
  }

  // chamado pelo main com dx,dy e se está correndo (Shift)
  applyMove(dx, dy, running) {
    this.moving = !!(dx || dy);
    this.running = !!(running && this.moving);

    if (!this.moving) {
      this.anim = 0;
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) this.facing = dx > 0 ? 'right' : 'left';
    else this.facing = dy > 0 ? 'down' : 'up';

    const spd = this.running ? this.runSpeed : this.speed;
    const len = Math.hypot(dx, dy) || 1;
    const mx = (dx / len) * spd;
    const my = (dy / len) * spd;

    this.anim += this.running ? 0.28 : 0.18;

    if (!this.solidAt(this.x + mx, this.y)) this.x += mx;
    if (!this.solidAt(this.x, this.y + my)) this.y += my;

    this.x = Math.max(16, Math.min(MAP_W - 16, this.x));
    this.y = Math.max(16, Math.min(MAP_H - 16, this.y));
  }

  _currentFrame() {
    const dir = this.facing;
    if (this.attacking) {
      const frames = this.sprites.punch[dir] || [];
      const i = Math.min(2, Math.floor(this.attackFrame));
      return frames[i] || null;
    }
    if (this.moving) {
      const set = this.running ? this.sprites.run : this.sprites.walk;
      const frames = set[dir] || [];
      if (!frames.length) return null;
      const i = Math.floor(this.anim) % frames.length;
      return frames[i];
    }
    // idle = primeiro frame do walk
    const frames = this.sprites.walk[dir] || [];
    return frames[0] || null;
  }

  drawWorld(ctx) {
    const x = this.x, y = this.y;
    const img = this._currentFrame();

    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 30, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    if (img && img.complete && img.naturalWidth > 0) {
      const scale = 1.15;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      // âncora nos pés
      ctx.drawImage(img, x - w / 2, y - h + 32, w, h);
    } else {
      // fallback temporário
      ctx.fillStyle = '#3a5a8a';
      ctx.fillRect(x - 8, y - 4, 16, 16);
      ctx.fillStyle = '#e8c8a0';
      ctx.beginPath();
      ctx.arc(x, y - 10, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
}
