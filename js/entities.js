// ========== INIMIGOS E ENTIDADES ==========

class Enemy {
  constructor(x, y, type) {
    this.x = x * TILE + TILE / 2;
    this.y = y * TILE + TILE / 2;
    this.type = type;
    this.alive = true;
    this.flash = 0;

    switch (type) {
      case 'fantasma':
        this.hp = 30;
        this.maxHp = 30;
        this.speed = 1.1;
        this.damage = 8;
        this.color = '#a0a0c0';
        this.size = 18;
        this.detectRange = 180;
        break;
      case 'vulto':
        this.hp = 20;
        this.maxHp = 20;
        this.speed = 1.6;
        this.damage = 12;
        this.color = '#3a3a3a';
        this.size = 16;
        this.detectRange = 140;
        this.phase = 0;
        break;
      case 'aranha':
        this.hp = 40;
        this.maxHp = 40;
        this.speed = 1.4;
        this.damage = 10;
        this.color = '#5a2a2a';
        this.size = 20;
        this.detectRange = 160;
        break;
      case 'elite':
        this.hp = 80;
        this.maxHp = 80;
        this.speed = 0.9;
        this.damage = 18;
        this.color = '#6a4a2a';
        this.size = 28;
        this.detectRange = 220;
        break;
      default:
        this.hp = 25;
        this.maxHp = 25;
        this.speed = 1.0;
        this.damage = 8;
        this.color = '#666';
        this.size = 16;
        this.detectRange = 150;
    }
  }

  update(player, room) {
    if (!this.alive) return;

    if (this.flash > 0) this.flash--;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // persegue se o jogador estiver no alcance e com baixa sanidade aumenta aggro
    const range = this.detectRange + (100 - player.sanity) * 0.8;

    if (dist < range && dist > 12) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    // ataque
    if (dist < this.size + 14) {
      player.takeDamage(this.damage * 0.15); // dano por frame (suave)
    }

    // vulto pisca (some e aparece)
    if (this.type === 'vulto') {
      this.phase = (this.phase + 1) % 120;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.flash = 8;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }

  draw(ctx, camX, camY) {
    if (!this.alive) return;

    // vulto some parcialmente
    if (this.type === 'vulto' && this.phase > 70) return;

    const sx = this.x - camX;
    const sy = this.y - camY;

    ctx.save();
    if (this.flash > 0) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff';
    } else {
      ctx.fillStyle = this.color;
    }

    // corpo
    ctx.beginPath();
    if (this.type === 'aranha') {
      // corpo + pernas simples
      ctx.arc(sx, sy, this.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(a) * this.size, sy + Math.sin(a) * this.size * 0.7);
        ctx.stroke();
      }
    } else if (this.type === 'elite') {
      // estátua / humanoide grande
      ctx.fillRect(sx - this.size / 2, sy - this.size / 2, this.size, this.size);
      // "machado"
      ctx.fillStyle = '#888';
      ctx.fillRect(sx + this.size / 2 - 4, sy - this.size, 6, this.size);
    } else {
      // fantasma / vulto
      ctx.arc(sx, sy, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
      // olhos
      ctx.fillStyle = '#f00';
      ctx.beginPath();
      ctx.arc(sx - 4, sy - 3, 2, 0, Math.PI * 2);
      ctx.arc(sx + 4, sy - 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // barra de vida
    if (this.hp < this.maxHp) {
      const barW = this.size;
      ctx.fillStyle = '#300';
      ctx.fillRect(sx - barW / 2, sy - this.size / 2 - 10, barW, 4);
      ctx.fillStyle = '#c00';
      ctx.fillRect(sx - barW / 2, sy - this.size / 2 - 10, barW * (this.hp / this.maxHp), 4);
    }

    ctx.restore();
  }
}

// Cria inimigos de uma sala
function spawnEnemies(room) {
  return (room.enemies || []).map(e => new Enemy(e.x, e.y, e.type));
}
