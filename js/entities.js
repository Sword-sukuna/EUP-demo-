// ========== INIMIGOS COM SPRITES ==========

const ENEMY_SPRITE_CACHE = {};

function loadEnemySprites(folder, prefix) {
  if (ENEMY_SPRITE_CACHE[folder]) return ENEMY_SPRITE_CACHE[folder];
  const base = 'assets/sprites/' + folder + '/';
  const sets = { parado: [], andando: [], batendo: [], dano: [] };
  for (const anim of Object.keys(sets)) {
    for (let i = 1; i <= 4; i++) {
      const img = new Image();
      img.src = base + prefix + '_' + anim + '_' + i + '.png';
      sets[anim].push(img);
    }
  }
  ENEMY_SPRITE_CACHE[folder] = sets;
  return sets;
}

class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.alive = true;
    this.flash = 0;
    this.anim = Math.random() * 10;
    this.phase = 0;
    this.state = 'parado'; // parado | andando | batendo | dano
    this.facing = 1; // 1 right, -1 left

    const stats = {
      fantasma: { hp: 30, speed: 0.95, damage: 6, size: 20, range: 160 },
      vulto:    { hp: 22, speed: 1.35, damage: 9, size: 18, range: 130 },
      aranha:   { hp: 40, speed: 1.2,  damage: 8, size: 22, range: 150 },
      elite:    { hp: 80, speed: 0.75, damage: 14, size: 28, range: 200 }
    };
    const s = stats[type] || stats.fantasma;
    Object.assign(this, s);
    this.maxHp = this.hp;

    // sprites
    if (type === 'aranha') {
      this.sprites = loadEnemySprites('aranha', 'aranha');
    } else if (type === 'elite') {
      this.sprites = loadEnemySprites('manequim', 'manequim');
    } else {
      // fantasma + vulto
      this.sprites = loadEnemySprites('fantasma', 'fantasma');
    }
  }

  update(player) {
    if (!this.alive) return;
    this.anim += 0.12;
    if (this.flash > 0) {
      this.flash--;
      this.state = 'dano';
    }

    if (this.type === 'vulto') this.phase = (this.phase + 1) % 90;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const range = this.range + (100 - player.sanity) * 0.6;

    if (dx !== 0) this.facing = dx > 0 ? 1 : -1;

    if (dist < this.size + 12) {
      // ataque corpo a corpo
      this.state = 'batendo';
      player.takeDamage(this.damage * 0.12);
    } else if (dist < range && dist > 14) {
      this.state = this.flash > 0 ? 'dano' : 'andando';
      const sp = this.speed;
      const nx = this.x + (dx / dist) * sp;
      const ny = this.y + (dy / dist) * sp;
      if (!this.blocked(nx, this.y)) this.x = nx;
      if (!this.blocked(this.x, ny)) this.y = ny;
    } else {
      if (this.flash <= 0) this.state = 'parado';
    }
  }

  blocked(px, py) {
    if (typeof isSolid === 'function') {
      return isSolid(px, py) || isSolid(px - 6, py) || isSolid(px + 6, py);
    }
    return false;
  }

  takeDamage(n) {
    this.hp -= n;
    this.flash = 10;
    this.state = 'dano';
    if (this.hp <= 0) this.alive = false;
  }

  _frame() {
    const frames = (this.sprites && this.sprites[this.state]) || (this.sprites && this.sprites.parado) || [];
    if (!frames.length) return null;
    const i = Math.floor(this.anim) % frames.length;
    return frames[i];
  }

  drawWorld(ctx) {
    if (!this.alive) return;
    if (this.type === 'vulto' && this.phase > 60) return;

    const sx = this.x, sy = this.y;
    const img = this._frame();

    ctx.save();
    if (this.type === 'vulto') ctx.globalAlpha = 0.7;
    if (this.flash > 0) ctx.globalAlpha = 0.55;

    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 12, this.size * 0.4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (img && img.complete && img.naturalWidth > 0) {
      const scale = this.type === 'elite' ? 1.2 : (this.type === 'aranha' ? 1.0 : 1.1);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.translate(sx, sy);
      if (this.facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(img, -w / 2, -h + 14, w, h);
    } else {
      // fallback
      ctx.fillStyle = this.flash ? '#fff' : '#7a7aa0';
      ctx.beginPath();
      ctx.arc(sx, sy, this.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.hp < this.maxHp) {
      ctx.globalAlpha = 1;
      const bw = this.size;
      ctx.fillStyle = '#2a1010';
      ctx.fillRect(sx - bw / 2, sy - this.size * 0.7, bw, 3);
      ctx.fillStyle = '#c02020';
      ctx.fillRect(sx - bw / 2, sy - this.size * 0.7, bw * (this.hp / this.maxHp), 3);
    }
    ctx.restore();
  }
}

function spawnMapEnemies() {
  return MAP_ENEMIES.map(e => new Enemy(e.x, e.y, e.type));
}
