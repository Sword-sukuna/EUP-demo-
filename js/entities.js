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
    this.state = 'parado';
    this.facing = 1;
    this.lastX = x;

    // mais fortes
    const stats = {
      fantasma: { hp: 45, speed: 1.15, damage: 10, size: 20, range: 180 },
      vulto:    { hp: 35, speed: 1.55, damage: 14, size: 18, range: 150 },
      aranha:   { hp: 55, speed: 1.4,  damage: 12, size: 22, range: 170 },
      elite:    { hp: 140, speed: 0.95, damage: 22, size: 30, range: 220 }
    };
    const s = stats[type] || stats.fantasma;
    Object.assign(this, s);
    this.maxHp = this.hp;

    if (type === 'aranha') {
      this.sprites = loadEnemySprites('aranha', 'aranha');
      this.flipInvert = true; // sprite original olha pra esquerda
    } else if (type === 'elite') {
      this.sprites = loadEnemySprites('manequim', 'manequim');
      this.flipInvert = false;
    } else {
      this.sprites = loadEnemySprites('fantasma', 'fantasma');
      this.flipInvert = false;
    }
  }

  update(player) {
    if (!this.alive) return;
    this.anim += 0.14;
    if (this.flash > 0) {
      this.flash--;
      this.state = 'dano';
    }

    if (this.type === 'vulto') this.phase = (this.phase + 1) % 90;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const range = this.range + (100 - player.sanity) * 0.7;

    // facing pela direção do MOVIMENTO (não só olhar pro player)
    if (dist < range && dist > 14) {
      const sp = this.speed;
      const mx = (dx / dist) * sp;
      const my = (dy / dist) * sp;
      if (Math.abs(mx) > 0.05) this.facing = mx > 0 ? 1 : -1;

      this.state = this.flash > 0 ? 'dano' : 'andando';
      const nx = this.x + mx;
      const ny = this.y + my;
      if (!this.blocked(nx, this.y)) this.x = nx;
      if (!this.blocked(this.x, ny)) this.y = ny;
    } else if (dist < this.size + 14) {
      this.state = 'batendo';
      if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
      player.takeDamage(this.damage * 0.16);
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
    if (this.hp <= 0) {
      this.alive = false;
      // elite dropa carta do 2º andar
      if (this.type === 'elite' && typeof onEliteDefeated === 'function') {
        onEliteDefeated(this.x, this.y);
      }
    }
  }

  _frame() {
    const frames = (this.sprites && this.sprites[this.state]) || (this.sprites && this.sprites.parado) || [];
    if (!frames.length) return null;
    return frames[Math.floor(this.anim) % frames.length];
  }

  drawWorld(ctx) {
    if (!this.alive) return;
    if (this.type === 'vulto' && this.phase > 60) return;

    const sx = this.x, sy = this.y;
    const img = this._frame();

    ctx.save();
    if (this.type === 'vulto') ctx.globalAlpha = 0.7;
    if (this.flash > 0) ctx.globalAlpha = 0.55;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 12, this.size * 0.4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (img && img.complete && img.naturalWidth > 0) {
      const scale = this.type === 'elite' ? 1.25 : (this.type === 'aranha' ? 1.05 : 1.1);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.translate(sx, sy);
      // aranha: inverte o flip porque o sprite base olha pra outro lado
      let flip = this.facing < 0;
      if (this.flipInvert) flip = !flip;
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(img, -w / 2, -h + 14, w, h);
    } else {
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
  // no bar (y > 1350) não spawna — só mansão
  return MAP_ENEMIES
    .filter(e => e.y < 1350)
    .map(e => new Enemy(e.x, e.y, e.type));
}
