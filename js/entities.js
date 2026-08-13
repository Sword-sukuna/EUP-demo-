// ========== INIMIGOS — IA melhorada ==========

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
    this.aggro = false;
    this.idleTimer = Math.random() * 120;
    this.idleDX = 0;
    this.idleDY = 0;

    // 1º andar um pouco mais tenso; 2º usa scale em spawn
    const stats = {
      fantasma: { hp: 40, speed: 1.0,  damage: 8,  size: 20, alert: 95, chase: 150 },
      vulto:    { hp: 30, speed: 1.25, damage: 10, size: 18, alert: 85, chase: 135 },
      aranha:   { hp: 48, speed: 1.15, damage: 9,  size: 22, alert: 100, chase: 145 },
      elite:    { hp: 120, speed: 0.85, damage: 16, size: 30, alert: 110, chase: 180 }
    };
    const s = stats[type] || stats.fantasma;
    Object.assign(this, s);
    this.maxHp = this.hp;

    if (type === 'aranha') {
      this.sprites = loadEnemySprites('aranha', 'aranha');
      this.flipInvert = true;
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
    this.anim += 0.12;
    if (this.flash > 0) {
      this.flash--;
      this.state = 'dano';
    }
    if (this.type === 'vulto') this.phase = (this.phase + 1) % 90;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // sanidade baixa = inimigos mais alertas
    const alertR = this.alert + (100 - player.sanity) * 0.35;
    const chaseR = this.chase + (100 - player.sanity) * 0.5;
    const loseR = chaseR * 1.25;

    // entra em aggro só se o jogador chegar perto
    if (!this.aggro && dist < alertR) {
      this.aggro = true;
      if (typeof AudioSys !== 'undefined') AudioSys.monsterAggro(this.type);
    }
    // perde aggro se fugir longe
    if (this.aggro && dist > loseR) this.aggro = false;
    // som idle ocasional se perto
    if (!this.aggro && dist < alertR * 1.6 && Math.random() < 0.002) {
      if (typeof AudioSys !== 'undefined') AudioSys.monsterIdle();
    }

    if (this.aggro && dist < chaseR) {
      // PERSEGUE
      if (dist < this.size + 14) {
        this.state = 'batendo';
        if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
        // dano a cada ~0.5s (invincible do player controla)
        player.takeDamage(this.damage);
      } else if (dist > 12) {
        this.state = this.flash > 0 ? 'dano' : 'andando';
        const sp = this.speed;
        const mx = (dx / dist) * sp;
        const my = (dy / dist) * sp;
        if (Math.abs(mx) > 0.05) this.facing = mx > 0 ? 1 : -1;
        if (!this.blocked(this.x + mx, this.y)) this.x += mx;
        if (!this.blocked(this.x, this.y + my)) this.y += my;
      }
    } else {
      // IDLE / patrulha lenta — NÃO ataca de longe
      this.state = this.flash > 0 ? 'dano' : 'parado';
      this.idleTimer--;
      if (this.idleTimer <= 0) {
        this.idleTimer = 60 + Math.random() * 100;
        const a = Math.random() * Math.PI * 2;
        this.idleDX = Math.cos(a) * 0.35;
        this.idleDY = Math.sin(a) * 0.35;
        if (Math.abs(this.idleDX) > 0.05) this.facing = this.idleDX > 0 ? 1 : -1;
      }
      if (this.idleTimer > 40) {
        this.state = 'andando';
        if (!this.blocked(this.x + this.idleDX, this.y)) this.x += this.idleDX;
        if (!this.blocked(this.x, this.y + this.idleDY)) this.y += this.idleDY;
      }
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
    this.aggro = true; // bater nele chama atenção
    if (this.hp <= 0) {
      this.alive = false;
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
  return MAP_ENEMIES.filter(e => e.y < 1350).map(e => new Enemy(e.x, e.y, e.type));
}

function spawnMapEnemiesFloor2() {
  if (typeof MAP_ENEMIES_F2 === 'undefined') return [];
  return MAP_ENEMIES_F2.map(e => {
    const en = new Enemy(e.x, e.y, e.type);
    // 2º andar: menos agressivo
    en.hp = Math.floor(en.hp * 0.85);
    en.maxHp = en.hp;
    en.damage = Math.max(5, Math.floor(en.damage * 0.7));
    en.speed *= 0.85;
    en.alert *= 0.9;
    en.chase *= 0.9;
    return en;
  });
}
