// ========== JOGADOR ==========

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.footOffset = 16; // colisão na ponta do pé
    this.speed = 3.6;
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
    // só a ponta do pé — 3 pontos (menos "grudento")
    const footY = py + this.footOffset;
    const r = this.radius * 0.7;
    const pts = [
      [px, footY],
      [px - r, footY],
      [px + r, footY],
    ];
    for (const [x, y] of pts) {
      if (typeof isSolid === 'function' && isSolid(x, y)) return true;
    }
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

  update() {
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invincible > 0) this.invincible--;
  }

  // desenha em coordenadas de MUNDO (já transformadas)
  drawWorld(ctx) {
    const x = this.x, y = this.y;
    const sc = 1.45; // personagem maior
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    ctx.translate(-x, -y);

    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // corpo
    ctx.fillStyle = '#3a5a8a';
    ctx.fillRect(x - 8, y - 4, 16, 16);
    // cabeça
    ctx.fillStyle = '#e8c8a0';
    ctx.beginPath();
    ctx.arc(x, y - 10, 8, 0, Math.PI * 2);
    ctx.fill();
    // cabelo
    ctx.fillStyle = '#4a3a2a';
    ctx.beginPath();
    ctx.arc(x, y - 13, 7, Math.PI, 0);
    ctx.fill();
    // olhos
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x - 4, y - 11, 2, 2);
    ctx.fillRect(x + 2, y - 11, 2, 2);
    // pernas
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(x - 7, y + 12, 5, 6);
    ctx.fillRect(x + 2, y + 12, 5, 6);

    if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }
    ctx.restore();
  }
}
