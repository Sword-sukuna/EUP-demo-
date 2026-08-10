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
      fantasma: { hp: 30, speed: 1.0, damage: 6, size: 18, range: 170 },
      vulto:    { hp: 20, speed: 1.5, damage: 10, size: 15, range: 140 },
      aranha:   { hp: 40, speed: 1.3, damage: 8, size: 20, range: 160 },
      elite:    { hp: 85, speed: 0.8, damage: 15, size: 28, range: 210 }
    };
    const s = stats[type] || stats.fantasma;
    Object.assign(this, s);
    this.maxHp = this.hp;
  }

  update(player, walls) {
    if (!this.alive) return;
    this.anim += 0.09;
    if (this.flash > 0) this.flash--;
    if (this.type === 'vulto') this.phase = (this.phase + 1) % 90;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const range = this.range + (100 - player.sanity) * 0.7;

    if (dist < range && dist > 16) {
      const sp = this.speed;
      const nx = this.x + (dx / dist) * sp;
      const ny = this.y + (dy / dist) * sp;
      if (!this.hitWall(nx, this.y, walls)) this.x = nx;
      if (!this.hitWall(this.x, ny, walls)) this.y = ny;
    }
    if (dist < this.size + 10) {
      player.takeDamage(this.damage * 0.11);
    }
  }

  hitWall(px, py, walls) {
    const r = this.size * 0.4;
    for (const w of walls) {
      const nx = Math.max(w.x, Math.min(px, w.x + w.w));
      const ny = Math.max(w.y, Math.min(py, w.y + w.h));
      if ((px - nx) ** 2 + (py - ny) ** 2 < r * r) return true;
    }
    return false;
  }

  takeDamage(n) {
    this.hp -= n;
    this.flash = 8;
    if (this.hp <= 0) this.alive = false;
  }

  draw(ctx, camX, camY) {
    if (!this.alive) return;
    if (this.type === 'vulto' && this.phase > 60) return;

    const sx = this.x - camX;
    const sy = this.y - camY;
    const bob = Math.sin(this.anim) * 2;

    ctx.save();
    if (this.flash > 0) ctx.globalAlpha = 0.5;

    ctx.beginPath();
    ctx.ellipse(sx, sy + this.size * 0.5, this.size * 0.4, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    if (this.type === 'aranha') {
      ctx.fillStyle = this.flash ? '#fff' : '#5a2828';
      ctx.beginPath();
      ctx.arc(sx, sy + bob, this.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sx, sy + 7 + bob, this.size * 0.32, this.size * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5a2828';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = -0.5 + i * 0.35;
        ctx.beginPath();
        ctx.moveTo(sx - 5, sy + bob);
        ctx.lineTo(sx - 16, sy + 6 + Math.sin(a) * 8 + bob);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx + 5, sy + bob);
        ctx.lineTo(sx + 16, sy + 6 + Math.sin(a) * 8 + bob);
        ctx.stroke();
      }
      ctx.fillStyle = '#e01818';
      ctx.beginPath();
      ctx.arc(sx - 4, sy - 2 + bob, 2.2, 0, Math.PI * 2);
      ctx.arc(sx + 4, sy - 2 + bob, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'elite') {
      ctx.fillStyle = this.flash ? '#ccc' : '#5a4838';
      ctx.fillRect(sx - 9, sy + 2, 7, 13);
      ctx.fillRect(sx + 2, sy + 2, 7, 13);
      ctx.fillRect(sx - 11, sy - 12, 22, 18);
      ctx.beginPath();
      ctx.arc(sx, sy - 17, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a3020';
      ctx.fillRect(sx + 11, sy - 26, 4, 30);
      ctx.fillStyle = '#999';
      ctx.beginPath();
      ctx.moveTo(sx + 15, sy - 26);
      ctx.lineTo(sx + 26, sy - 20);
      ctx.lineTo(sx + 15, sy - 14);
      ctx.fill();
      ctx.fillStyle = '#c01818';
      ctx.fillRect(sx - 4, sy - 19, 2.5, 2.5);
      ctx.fillRect(sx + 2, sy - 19, 2.5, 2.5);
    } else {
      ctx.globalAlpha = this.type === 'vulto' ? 0.65 : 0.85;
      ctx.fillStyle = this.flash ? '#fff' : (this.type === 'vulto' ? '#3a3a48' : '#7a7aa0');
      ctx.beginPath();
      ctx.moveTo(sx - this.size * 0.35, sy + this.size * 0.25 + bob);
      ctx.quadraticCurveTo(sx - this.size * 0.45, sy - this.size * 0.15 + bob, sx, sy - this.size * 0.4 + bob);
      ctx.quadraticCurveTo(sx + this.size * 0.45, sy - this.size * 0.15 + bob, sx + this.size * 0.35, sy + this.size * 0.25 + bob);
      ctx.quadraticCurveTo(sx, sy + this.size * 0.15 + bob, sx - this.size * 0.35, sy + this.size * 0.25 + bob);
      ctx.fill();
      ctx.fillStyle = '#e01010';
      ctx.beginPath();
      ctx.arc(sx - 4, sy - 5 + bob, 2.5, 0, Math.PI * 2);
      ctx.arc(sx + 4, sy - 5 + bob, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.hp < this.maxHp) {
      ctx.globalAlpha = 1;
      const bw = this.size;
      ctx.fillStyle = '#2a1010';
      ctx.fillRect(sx - bw / 2, sy - this.size * 0.65 - 6, bw, 3);
      ctx.fillStyle = '#c02020';
      ctx.fillRect(sx - bw / 2, sy - this.size * 0.65 - 6, bw * (this.hp / this.maxHp), 3);
    }
    ctx.restore();
  }
}

function spawnMapEnemies() {
  return MAP_ENEMIES.map(e => new Enemy(e.x, e.y, e.type));
}
