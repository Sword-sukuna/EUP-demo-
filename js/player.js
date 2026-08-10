// ========== JOGADOR ==========

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 22;
    this.h = 22;
    this.speed = 2.4;
    this.sanity = 100;
    this.maxSanity = 100;

    // inventário (4 slots)
    this.inventory = [null, null, null, null];
    this.selectedSlot = 0;

    // lanterna
    this.hasLantern = false;
    this.lanternOn = false;
    this.lanternRadius = 160;      // raio com lanterna ligada
    this.baseRadius = 70;         // raio sem lanterna

    // combate
    this.attackCooldown = 0;
    this.attackRange = 38;
    this.damage = 15;

    // estado
    this.facing = 'down';
    this.invincible = 0;
  }

  get radius() {
    return this.lanternOn && this.hasLantern ? this.lanternRadius : this.baseRadius;
  }

  move(dx, dy, room) {
    const nextX = this.x + dx * this.speed;
    const nextY = this.y + dy * this.speed;

    // colisão simples com bordas da sala
    const margin = 28;
    const maxX = room.width * TILE - margin;
    const maxY = room.height * TILE - margin;

    this.x = Math.max(margin, Math.min(maxX, nextX));
    this.y = Math.max(margin, Math.min(maxY, nextY));

    if (dx !== 0 || dy !== 0) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx > 0 ? 'right' : 'left';
      } else {
        this.facing = dy > 0 ? 'down' : 'up';
      }
    }
  }

  takeDamage(amount) {
    if (this.invincible > 0) return;
    this.sanity = Math.max(0, this.sanity - amount);
    this.invincible = 40; // frames de invencibilidade
  }

  heal(amount) {
    this.sanity = Math.min(this.maxSanity, this.sanity + amount);
  }

  addItem(itemType) {
    for (let i = 0; i < 4; i++) {
      if (!this.inventory[i]) {
        this.inventory[i] = itemType;
        return true;
      }
    }
    return false; // inventário cheio
  }

  useSelectedItem() {
    const item = this.inventory[this.selectedSlot];
    if (!item) return null;

    // consumíveis
    if (item === 'cafe') {
      this.heal(20);
      this.inventory[this.selectedSlot] = null;
      return 'Você bebeu o café. +20 sanidade.';
    }
    if (item === 'lanterna') {
      this.hasLantern = true;
      this.lanternOn = true;
      this.inventory[this.selectedSlot] = null;
      return 'Você equipou a lanterna.';
    }
    // faca e chave não são consumidos no uso básico
    return null;
  }

  hasItem(type) {
    return this.inventory.includes(type);
  }

  update() {
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invincible > 0) this.invincible--;
  }
}
