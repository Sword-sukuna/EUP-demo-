// ========== JOGADOR ==========

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.speed = 2.8;
    this.sanity = 100;
    this.maxSanity = 100;

    this.inventory = [null, null, null, null];
    this.selectedSlot = 0;

    this.hasLantern = false;
    this.lanternOn = false;
    this.lightRadius = 140;
    this.lanternRadius = 260;

    this.attackCooldown = 0;
    this.attackRange = 44;
    this.facing = 'down';
    this.invincible = 0;
    this.anim = 0;
  }

  get vision() {
    return (this.lanternOn && this.hasLantern) ? this.lanternRadius : this.lightRadius;
  }

  move(dx, dy, walls) {
    if (dx === 0 && dy === 0) return;
    this.anim += 0.22;

    if (Math.abs(dx) > Math.abs(dy)) this.facing = dx > 0 ? 'right' : 'left';
    else this.facing = dy > 0 ? 'down' : 'up';

    const len = Math.hypot(dx, dy) || 1;
    dx = (dx / len) * this.speed;
    dy = (dy / len) * this.speed;

    let nx = this.x + dx;
    if (!this.collides(nx, this.y, walls)) this.x = nx;
    let ny = this.y + dy;
    if (!this.collides(this.x, ny, walls)) this.y = ny;

    this.x = Math.max(20, Math.min(MAP_W - 20, this.x));
    this.y = Math.max(20, Math.min(MAP_H - 20, this.y));
  }

  collides(px, py, walls) {
    const r = this.radius;
    for (const w of walls) {
      const nearestX = Math.max(w.x, Math.min(px, w.x + w.w));
      const nearestY = Math.max(w.y, Math.min(py, w.y + w.h));
      const distX = px - nearestX;
      const distY = py - nearestY;
      if (distX * distX + distY * distY < r * r) return true;
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
      if (!this.inventory[i]) {
        this.inventory[i] = type;
        return true;
      }
    }
    return false;
  }

  hasItem(type) {
    return this.inventory.includes(type);
  }

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

  draw(ctx, camX, camY) {
    const px = this.x - camX;
    const py = this.y - camY;
    const bob = Math.sin(this.anim) * 1.8;

    ctx.save();
    if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    ctx.beginPath();
    ctx.ellipse(px, py + 13, 11, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();

    ctx.fillStyle = '#1e2838';
    ctx.fillRect(px - 6, py + 3 + bob * 0.3, 5, 12);
    ctx.fillRect(px + 2, py + 3 - bob * 0.3, 5, 12);

    ctx.fillStyle = '#3a5a7a';
    ctx.beginPath();
    ctx.roundRect(px - 9, py - 7 + bob, 18, 15, 3);
    ctx.fill();
    ctx.fillStyle = '#2a4060';
    ctx.fillRect(px - 1.5, py - 5 + bob, 3, 11);

    ctx.fillStyle = '#d4b090';
    ctx.beginPath();
    ctx.arc(px, py - 13 + bob, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1510';
    ctx.beginPath();
    ctx.arc(px, py - 16 + bob, 6.5, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(px - 2.5, py - 13 + bob, 1.3, 0, Math.PI * 2);
    ctx.arc(px + 2.5, py - 13 + bob, 1.3, 0, Math.PI * 2);
    ctx.fill();

    if (this.hasLantern) {
      const lx = this.facing === 'left' ? px - 15 : px + 11;
      ctx.fillStyle = this.lanternOn ? '#f0d060' : '#5a4a30';
      ctx.fillRect(lx, py - 1 + bob, 7, 5);
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(lx + 1.5, py + 4 + bob, 4, 5);
      if (this.lanternOn) {
        ctx.fillStyle = 'rgba(255,220,100,0.8)';
        ctx.beginPath();
        ctx.arc(lx + 3.5, py + 1 + bob, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
