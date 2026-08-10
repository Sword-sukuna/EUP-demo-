// ========== MAIN — ECOS DA ÚLTIMA PORTA (DEMO) ==========

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player;
let currentRoomId = 'mansao';
let currentRoom;
let enemies = [];
let keys = {};
let gameRunning = false;
let frame = 0;

// ---------- Inicialização ----------
function initGame() {
  currentRoomId = 'mansao';
  currentRoom = ROOMS[currentRoomId];
  player = new Player(9 * TILE, 6 * TILE);
  enemies = spawnEnemies(currentRoom);
  frame = 0;
  gameRunning = true;
  hideStartScreen();
  document.getElementById('gameover-screen').classList.add('hidden');
  showMessage('Você entra na mansão... algo está errado.', 3000);
}

// ---------- Input ----------
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;

  if (!gameRunning) return;

  // selecionar slot
  if (e.key >= '1' && e.key <= '4') {
    player.selectedSlot = parseInt(e.key) - 1;
  }

  // usar item
  if (e.key.toLowerCase() === 'e') {
    const msg = player.useSelectedItem();
    if (msg) showMessage(msg);
    else interact();
  }

  // lanterna
  if (e.key.toLowerCase() === 'f') {
    if (player.hasLantern) {
      player.lanternOn = !player.lanternOn;
      showMessage(player.lanternOn ? 'Lanterna ligada.' : 'Lanterna desligada.');
    } else {
      showMessage('Você não tem lanterna.');
    }
  }

  // ataque (espaço ou clique)
  if (e.key === ' ') {
    attack();
  }
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('click', () => {
  if (gameRunning) attack();
});

// ---------- Interação ----------
function interact() {
  // pegar itens
  for (const item of currentRoom.items) {
    if (item.taken) continue;
    const ix = item.x * TILE + TILE / 2;
    const iy = item.y * TILE + TILE / 2;
    const dist = Math.hypot(player.x - ix, player.y - iy);
    if (dist < 40) {
      if (player.addItem(item.type)) {
        item.taken = true;
        showMessage(`Você pegou: ${item.type}`);
        if (item.type === 'lanterna') {
          // já equipa automaticamente se quiser
        }
      } else {
        showMessage('Inventário cheio!');
      }
      return;
    }
  }

  // objetos
  for (const obj of currentRoom.objects) {
    const ox = obj.x * TILE + TILE / 2;
    const oy = obj.y * TILE + TILE / 2;
    const dist = Math.hypot(player.x - ox, player.y - oy);
    if (dist < 45) {
      if (obj.type === 'fogueira') {
        player.heal(100);
        // respawna inimigos da sala
        enemies = spawnEnemies(currentRoom);
        showMessage('Você descansou na fogueira. Sanidade restaurada. Os medos retornaram...');
      } else if (obj.type === 'janela') {
        obj.open = !obj.open;
        if (obj.open) {
          player.takeDamage(15);
          showMessage('Você abriu a janela... o frio entra e sua sanidade cai.');
        } else {
          showMessage('Você fechou a janela.');
        }
      } else if (obj.type === 'bau') {
        if (player.hasItem('chave')) {
          showMessage('O baú se abre... mas está vazio. Por enquanto.');
        } else {
          showMessage('O baú está trancado. Precisa de uma chave.');
        }
      } else {
        showMessage(`Você observa o ${obj.type}.`);
      }
      return;
    }
  }
}

function attack() {
  if (player.attackCooldown > 0) return;
  if (!player.hasItem('faca') && !player.inventory.includes('faca')) {
    // ataque fraco sem arma
    player.attackCooldown = 25;
  } else {
    player.attackCooldown = 18;
  }

  const range = player.attackRange;
  let hit = false;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (dist < range + enemy.size / 2) {
      const dmg = player.hasItem('faca') ? 22 : 10;
      enemy.takeDamage(dmg);
      hit = true;
    }
  }
  if (hit) showMessage('Você atacou!', 800);
}

// ---------- Troca de sala ----------
function checkDoors() {
  const margin = 30;
  const rw = currentRoom.width * TILE;
  const rh = currentRoom.height * TILE;

  let dir = null;
  if (player.y < margin + 10 && currentRoom.doors.north) dir = 'north';
  else if (player.y > rh - margin - 10 && currentRoom.doors.south) dir = 'south';
  else if (player.x < margin + 10 && currentRoom.doors.west) dir = 'west';
  else if (player.x > rw - margin - 10 && currentRoom.doors.east) dir = 'east';

  if (dir) {
    const door = currentRoom.doors[dir];
    currentRoomId = door.to;
    currentRoom = ROOMS[currentRoomId];
    player.x = door.spawnX * TILE;
    player.y = door.spawnY * TILE;
    enemies = spawnEnemies(currentRoom);
    showMessage(`Entrou: ${currentRoom.name}`);
  }
}

// ---------- Update ----------
function update() {
  if (!gameRunning) return;

  frame++;
  player.update();

  // movimento
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy = -1;
  if (keys['s'] || keys['arrowdown']) dy = 1;
  if (keys['a'] || keys['arrowleft']) dx = -1;
  if (keys['d'] || keys['arrowright']) dx = 1;

  if (dx || dy) {
    // normaliza diagonal
    if (dx && dy) {
      dx *= 0.707;
      dy *= 0.707;
    }
    player.move(dx, dy, currentRoom);
  }

  // inimigos
  for (const e of enemies) e.update(player, currentRoom);

  // sanidade passa devagar no escuro
  if (!player.lanternOn && frame % 90 === 0) {
    player.sanity = Math.max(0, player.sanity - 1);
  }

  // janelas abertas drenam sanidade
  for (const obj of currentRoom.objects) {
    if (obj.type === 'janela' && obj.open && frame % 60 === 0) {
      player.sanity = Math.max(0, player.sanity - 2);
    }
  }

  checkDoors();

  // game over
  if (player.sanity <= 0) {
    gameRunning = false;
    showGameOver();
  }

  updateHUD(player, currentRoom.name);
}

// ---------- Draw ----------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!currentRoom) return;

  const colors = ROOM_COLORS[currentRoom.type] || ROOM_COLORS.hall;
  const roomW = currentRoom.width * TILE;
  const roomH = currentRoom.height * TILE;

  // câmera centrada no player
  const camX = player.x - canvas.width / 2;
  const camY = player.y - canvas.height / 2;

  // fundo da sala
  ctx.fillStyle = colors.floor;
  ctx.fillRect(-camX, -camY, roomW, roomH);

  // grid sutil
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  for (let x = 0; x <= currentRoom.width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * TILE - camX, -camY);
    ctx.lineTo(x * TILE - camX, roomH - camY);
    ctx.stroke();
  }
  for (let y = 0; y <= currentRoom.height; y++) {
    ctx.beginPath();
    ctx.moveTo(-camX, y * TILE - camY);
    ctx.lineTo(roomW - camX, y * TILE - camY);
    ctx.stroke();
  }

  // paredes (borda)
  ctx.strokeStyle = colors.wall;
  ctx.lineWidth = 8;
  ctx.strokeRect(-camX, -camY, roomW, roomH);

  // portas (indicação visual)
  ctx.fillStyle = '#4a3a2a';
  const doorSize = 36;
  if (currentRoom.doors.north) {
    ctx.fillRect(roomW / 2 - doorSize / 2 - camX, -camY - 4, doorSize, 12);
  }
  if (currentRoom.doors.south) {
    ctx.fillRect(roomW / 2 - doorSize / 2 - camX, roomH - camY - 8, doorSize, 12);
  }
  if (currentRoom.doors.west) {
    ctx.fillRect(-camX - 4, roomH / 2 - doorSize / 2 - camY, 12, doorSize);
  }
  if (currentRoom.doors.east) {
    ctx.fillRect(roomW - camX - 8, roomH / 2 - doorSize / 2 - camY, 12, doorSize);
  }

  // objetos
  for (const obj of currentRoom.objects) {
    const ox = obj.x * TILE + TILE / 2 - camX;
    const oy = obj.y * TILE + TILE / 2 - camY;

    ctx.fillStyle = '#3a3028';
    if (obj.type === 'fogueira') {
      // fogueira
      ctx.beginPath();
      ctx.arc(ox, oy, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#5a2a10';
      ctx.fill();
      // chama
      const flicker = Math.sin(frame * 0.2) * 3;
      ctx.beginPath();
      ctx.arc(ox, oy - 6 + flicker * 0.3, 8 + flicker * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${140 + flicker * 10}, 30, 0.9)`;
      ctx.fill();
    } else if (obj.type === 'cama') {
      ctx.fillStyle = '#2a2030';
      ctx.fillRect(ox - 22, oy - 14, 44, 28);
      ctx.fillStyle = '#3a2a40';
      ctx.fillRect(ox - 18, oy - 10, 36, 12);
    } else if (obj.type === 'janela') {
      ctx.fillStyle = obj.open ? '#1a3a4a' : '#1a1a2a';
      ctx.fillRect(ox - 16, oy - 20, 32, 28);
      ctx.strokeStyle = '#555';
      ctx.strokeRect(ox - 16, oy - 20, 32, 28);
      if (obj.open) {
        ctx.fillStyle = 'rgba(100, 180, 220, 0.15)';
        ctx.fillRect(ox - 16, oy - 20, 32, 28);
      }
    } else if (obj.type === 'escada') {
      ctx.fillStyle = '#333';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(ox - 20 + i * 2, oy - 20 + i * 8, 40 - i * 4, 6);
      }
    } else if (obj.type === 'balcao') {
      ctx.fillStyle = '#2a2018';
      ctx.fillRect(ox - 20, oy - 10, 40, 20);
    } else {
      // genérico (mesa, cadeira, etc)
      ctx.fillRect(ox - 12, oy - 12, 24, 24);
    }
  }

  // itens no chão
  for (const item of currentRoom.items) {
    if (item.taken) continue;
    const ix = item.x * TILE + TILE / 2 - camX;
    const iy = item.y * TILE + TILE / 2 - camY;

    ctx.beginPath();
    ctx.arc(ix, iy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#c9a227';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    const icons = { cafe: '☕', faca: '🔪', lanterna: '🔦', chave: '🔑' };
    ctx.fillText(icons[item.type] || '?', ix, iy + 4);
  }

  // inimigos
  for (const e of enemies) e.draw(ctx, camX, camY);

  // jogador
  const px = player.x - camX;
  const py = player.y - camY;

  ctx.save();
  if (player.invincible > 0 && frame % 6 < 3) {
    ctx.globalAlpha = 0.4;
  }

  // contorno para destacar o personagem no escuro
  ctx.beginPath();
  ctx.arc(px, py, 13, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fill();

  // corpo
  ctx.fillStyle = '#7ab0e0';
  ctx.beginPath();
  ctx.arc(px, py, 11, 0, Math.PI * 2);
  ctx.fill();

  // cabeça
  ctx.fillStyle = '#a8d0f0';
  ctx.beginPath();
  ctx.arc(px, py - 4, 7, 0, Math.PI * 2);
  ctx.fill();

  // lanterna na mão
  if (player.hasLantern && player.lanternOn) {
    ctx.fillStyle = '#ffe080';
    ctx.fillRect(px + 8, py - 2, 10, 5);
  }

  ctx.restore();

  // ========== ESCURIDÃO + LANTERNA ==========
  const radius = player.radius;

  // máscara de escuridão (mais suave)
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // buraco da visão / lanterna
  ctx.globalCompositeOperation = 'destination-out';
  const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
  gradient.addColorStop(0, 'rgba(0,0,0,1)');
  gradient.addColorStop(0.4, 'rgba(0,0,0,0.85)');
  gradient.addColorStop(0.75, 'rgba(0,0,0,0.4)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // luz quente da lanterna (overlay)
  if (player.lanternOn && player.hasLantern) {
    ctx.save();
    const light = ctx.createRadialGradient(px, py, 0, px, py, radius);
    light.addColorStop(0, 'rgba(255, 210, 120, 0.18)');
    light.addColorStop(0.5, 'rgba(255, 170, 60, 0.08)');
    light.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

// ---------- Loop ----------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ---------- Eventos de botão ----------
document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);

// inicia o loop (tela de start aparece primeiro)
loop();
