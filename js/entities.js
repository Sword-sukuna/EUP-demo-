// ========== INIMIGOS ==========

class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.alive = true;
    this.flash = 0;
    this.anim = Math.random() * 50;
    this.phase = 0;

    const stats = {
      fantasma: { hp: 30, speed: 0.95, damage: 6, size: 17, range: 160 },
      vulto:    { hp: 20, speed: 1.4, damage: 9, size: 14, range: 130 },
      aranha:   { hp: 40, speed: 1.2, damage: 8, size: 19, range: 150 },
      elite:    { hp: 80, speed: 0.75, damage: 14, size: 26, range: 200 }
    };
    const s = stats[type] || stats.fantasma;
    Object.assign(this, s);
    this.maxHp = this.hp;
  }

  update(player) {
    if (!this.alive) return;
    this.anim += 0.09;
    if (this.flash > 0) this.flash--;
    if (this.type === 'vulto') this.phase = (this.phase + 1) % 90;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const range = this.range + (100 - player.sanity) * 0.6;

    if (dist < range && dist > 14) {
      const sp = this.speed;
      const nx = this.x + (dx / dist) * sp;
      const ny = this.y + (dy / dist) * sp;
      if (!this.blocked(nx, this.y)) this.x = nx;
      if (!this.blocked(this.x, ny)) this.y = ny;
    }
    if (dist < this.size + 9) {
      player.takeDamage(this.damage * 0.1);
    }
  }

  blocked(px, py) {
    if (typeof isSolid === 'function') {
      return isSolid(px, py) || isSolid(px - 6, py) || isSolid(px + 6, py) || isSolid(px, py - 6) || isSolid(px, py + 6);
    }
    return false;
  }

  takeDamage(n) {
    this.hp -= n;
    this.flash = 8;
    if (this.hp <= 0) this.alive = false;
  }

  drawWorld(ctx) {
    if (!this.alive) return;
    if (this.type === 'vulto' && this.phase > 60) return;

    const sx = this.x, sy = this.y;
    const bob = Math.sin(this.anim) * 2;

    ctx.save();
    if (this.flash > 0) ctx.globalAlpha = 0.5;

    ctx.beginPath();
    ctx.ellipse(sx, sy + this.size * 0.45, this.size * 0.35, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    if (this.type === 'aranha') {
      ctx.fillStyle = this.flash ? '#fff' : '#5a2828';
      ctx.beginPath();
      ctx.arc(sx, sy + bob, this.size * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5a2828';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = -0.5 + i * 0.35;
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy + bob);
        ctx.lineTo(sx - 14, sy + 5 + Math.sin(a) * 7 + bob);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx + 4, sy + bob);
        ctx.lineTo(sx + 14, sy + 5 + Math.sin(a) * 7 + bob);
        ctx.stroke();
      }
      ctx.fillStyle = '#e01818';
      ctx.beginPath();
      ctx.arc(sx - 3, sy - 2 + bob, 2, 0, Math.PI * 2);
      ctx.arc(sx + 3, sy - 2 + bob, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'elite') {
      ctx.fillStyle = this.flash ? '#ccc' : '#5a4838';
      ctx.fillRect(sx - 8, sy + 2, 6, 12);
      ctx.fillRect(sx + 2, sy + 2, 6, 12);
      ctx.fillRect(sx - 10, sy - 11, 20, 16);
      ctx.beginPath();
      ctx.arc(sx, sy - 16, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a3020';
      ctx.fillRect(sx + 10, sy - 24, 4, 28);
      ctx.fillStyle = '#aaa';
      ctx.beginPath();
      ctx.moveTo(sx + 14, sy - 24);
      ctx.lineTo(sx + 24, sy - 18);
      ctx.lineTo(sx + 14, sy - 12);
      ctx.fill();
      ctx.fillStyle = '#c01818';
      ctx.fillRect(sx - 3, sy - 18, 2, 2);
      ctx.fillRect(sx + 2, sy - 18, 2, 2);
    } else {
      ctx.globalAlpha = this.type === 'vulto' ? 0.65 : 0.85;
      ctx.fillStyle = this.flash ? '#fff' : (this.type === 'vulto' ? '#3a3a48' : '#7a7aa0');
      ctx.beginPath();
      ctx.moveTo(sx - this.size * 0.32, sy + this.size * 0.22 + bob);
      ctx.quadraticCurveTo(sx - this.size * 0.4, sy - this.size * 0.12 + bob, sx, sy - this.size * 0.38 + bob);
      ctx.quadraticCurveTo(sx + this.size * 0.4, sy - this.size * 0.12 + bob, sx + this.size * 0.32, sy + this.size * 0.22 + bob);
      ctx.quadraticCurveTo(sx, sy + this.size * 0.12 + bob, sx - this.size * 0.32, sy + this.size * 0.22 + bob);
      ctx.fill();
      ctx.fillStyle = '#e01010';
      ctx.beginPath();
      ctx.arc(sx - 3.5, sy - 4 + bob, 2.2, 0, Math.PI * 2);
      ctx.arc(sx + 3.5, sy - 4 + bob, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.hp < this.maxHp) {
      ctx.globalAlpha = 1;
      const bw = this.size;
      ctx.fillStyle = '#2a1010';
      ctx.fillRect(sx - bw / 2, sy - this.size * 0.6 - 5, bw, 3);
      ctx.fillStyle = '#c02020';
      ctx.fillRect(sx - bw / 2, sy - this.size * 0.6 - 5, bw * (this.hp / this.maxHp), 3);
    }
    ctx.restore();
  }
}

function spawnMapEnemies() {
  return MAP_ENEMIES.map(e => new Enemy(e.x, e.y, e.type));
}
