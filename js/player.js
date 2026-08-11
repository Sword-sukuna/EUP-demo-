// ========== JOGADOR ==========

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 9;
    this.speed = 3.0;
    this.sanity = 100;
    this.maxSanity = 100;

    this.inventory = [null, null, null, null];
    this.selectedSlot = 0;

    this.hasLantern = false;
    this.lanternOn = false;
    this.lightRadius = 95;
    this.lanternRadius = 170;

    this.attackCooldown = 0;
    this.attackRange = 40;
    this.facing = 'down';
    this.invincible = 0;
    this.anim = 0;
  }

  get vision() {
    return (this.lanternOn && this.hasLantern) ? this.lanternRadius : this.lightRadius;
  }

  move(dx, dy) {
    if (dx === 0 && dy === 0) return;
    this.anim += 0.25;
    if (Math.abs(dx) > Math.abs(dy)) this.facing = dx > 0 ? 'right' : 'left';
    else this.facing = dy > 0 ? 'down' : 'up';

    const len = Math.hypot(dx, dy) || 1;
    const mx = (dx / len) * this.speed;
    const my = (dy / len) * this.speed;

    // separa eixos para deslizar em paredes
    if (!this.solidAt(this.x + mx, this.y)) this.x += mx;
    if (!this.solidAt(this.x, this.y + my)) this.y += my;

    this.x = Math.max(16, Math.min(MAP_W - 16, this.x));
    this.y = Math.max(16, Math.min(MAP_H - 16, this.y));
  }

  solidAt(px, py) {
    // checa 4 pontos ao redor do círculo
    const r = this.radius;
    const pts = [
      [px, py],
      [px - r, py], [px + r, py],
      [px, py - r], [px, py + r],
      [px - r * 0.7, py - r * 0.7],
      [px + r * 0.7, py - r * 0.7],
      [px - r * 0.7, py + r * 0.7],
      [px + r * 0.7, py + r * 0.7],
    ];
    for (const [x, y] of pts) {
      if (typeof isSolid === 'function' && isSolid(x, y)) return true;
    }
    return false;
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

  update() {
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invincible > 0) this.invincible--;
  }

  // desenha em coordenadas de MUNDO (já transformadas)
  drawWorld(ctx) {
    const px = this.x;
    const py = this.y;
    const bob = Math.sin(this.anim) * 1.6;

    ctx.save();
    if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // sombra
    ctx.beginPath();
    ctx.ellipse(px, py + 12, 10, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fill();

    // pernas
    ctx.fillStyle = '#1a2230';
    ctx.fillRect(px - 5, py + 2 + bob * 0.3, 4, 11);
    ctx.fillRect(px + 2, py + 2 - bob * 0.3, 4, 11);

    // corpo
    ctx.fillStyle = '#4a7aaa';
    ctx.beginPath();
    ctx.roundRect(px - 8, py - 6 + bob, 16, 13, 3);
    ctx.fill();
    ctx.fillStyle = '#2a5070';
    ctx.fillRect(px - 1, py - 4 + bob, 2, 10);

    // cabeça
    ctx.fillStyle = '#e0c0a0';
    ctx.beginPath();
    ctx.arc(px, py - 12 + bob, 7, 0, Math.PI * 2);
    ctx.fill();

    // cabelo
    ctx.fillStyle = '#1a120c';
    ctx.beginPath();
    ctx.arc(px, py - 15 + bob, 6, Math.PI, 0);
    ctx.fill();

    // olhos
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(px - 2.5, py - 12 + bob, 1.2, 0, Math.PI * 2);
    ctx.arc(px + 2.5, py - 12 + bob, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // contorno branco sutil pra destacar
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py - 12 + bob, 7.5, 0, Math.PI * 2);
    ctx.stroke();

    // lanterna
    if (this.hasLantern) {
      const lx = this.facing === 'left' ? px - 14 : px + 10;
      ctx.fillStyle = this.lanternOn ? '#ffe060' : '#5a4a30';
      ctx.fillRect(lx, py - 1 + bob, 6, 5);
      if (this.lanternOn) {
        ctx.fillStyle = 'rgba(255,230,100,0.9)';
        ctx.beginPath();
        ctx.arc(lx + 3, py + 1 + bob, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
