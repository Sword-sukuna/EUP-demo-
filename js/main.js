// ========== MAIN — MAPA REAL DA MANSÃO ==========

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const mapImg = new Image();
mapImg.src = 'assets/mapa-mansao.jpg';

let player, enemies = [], walls = [];
let items = [], objects = [];
let keys = {};
let gameRunning = false;
let frame = 0;
let leverOn = false;
let doorUnlocked = false;
let chestOpened = false;
let noteRead = false;

function initGame() {
  // spawn no centro do hall (MANSÃO)
  player = new Player(660, 550);
  enemies = spawnMapEnemies();
  walls = WALLS.map(w => ({ ...w }));
  items = MAP_ITEMS.map(i => ({ ...i }));
  objects = MAP_OBJECTS.map(o => ({ ...o }));
  leverOn = false;
  doorUnlocked = false;
  chestOpened = false;
  noteRead = false;
  frame = 0;
  gameRunning = true;
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  showMessage('Você entra na mansão... algo está errado aqui.', 3000);
}

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (!gameRunning) return;

  if (e.key >= '1' && e.key <= '4') player.selectedSlot = parseInt(e.key) - 1;

  if (e.key.toLowerCase() === 'e') {
    const msg = player.useSelectedItem();
    if (msg) showMessage(msg);
    else interact();
  }

  if (e.key.toLowerCase() === 'f') {
    if (player.hasLantern) {
      player.lanternOn = !player.lanternOn;
      showMessage(player.lanternOn ? 'Lanterna ligada.' : 'Lanterna desligada.');
    } else showMessage('Você não tem lanterna.');
  }

  if (e.key === ' ') attack();
});

window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('click', () => { if (gameRunning) attack(); });

function interact() {
  // itens
  for (const item of items) {
    if (item.taken) continue;
    if (Math.hypot(player.x - item.x, player.y - item.y) < 40) {
      if (player.addItem(item.type)) {
        item.taken = true;
        showMessage('Pegou: ' + item.type);
      } else showMessage('Inventário cheio!');
      return;
    }
  }

  // objetos
  for (const obj of objects) {
    if (Math.hypot(player.x - obj.x, player.y - obj.y) > (obj.r || 35)) continue;

    if (obj.type === 'fogueira') {
      player.heal(100);
      enemies = spawnMapEnemies();
      showMessage('Sanidade restaurada. Os medos retornaram...');
      return;
    }

    if (obj.type === 'janela') {
      obj.open = !obj.open;
      if (obj.open) {
        player.takeDamage(10);
        showMessage('Janela aberta. O frio drena sua sanidade.');
      } else showMessage('Janela fechada.');
      return;
    }

    if (obj.type === 'bau') {
      if (chestOpened) {
        showMessage('O baú já está aberto.');
      } else if (player.hasItem('chave')) {
        chestOpened = true;
        obj.locked = false;
        // remove chave
        const idx = player.inventory.indexOf('chave');
        if (idx >= 0) player.inventory[idx] = null;
        player.addItem('cafe');
        showMessage('Baú aberto! Você encontrou outro café.');
      } else {
        showMessage('Baú trancado. Precisa de uma chave.');
      }
      return;
    }

    if (obj.type === 'alavanca') {
      obj.on = !obj.on;
      leverOn = obj.on;
      if (leverOn) {
        doorUnlocked = true;
        // remove a parede da porta trancada
        walls = walls.filter(w => !(w.x === 560 && w.y === 900));
        walls = walls.filter(w => !(w.x === 740 && w.y === 900));
        showMessage('A alavanca se move... você ouve um clique metálico no beco.');
      } else {
        doorUnlocked = false;
        showMessage('Alavanca desligada.');
      }
      return;
    }

    if (obj.type === 'porta_trancada') {
      if (doorUnlocked || player.hasItem('chave')) {
        showMessage('A passagem para o beco está livre.');
      } else {
        showMessage('Porta trancada. Encontre a alavanca ou a chave.');
      }
      return;
    }

    if (obj.type === 'nota') {
      noteRead = true;
      showMessage('Nota: "A alavanca no quarto oeste abre o caminho. A chave está no quarto inferior esquerdo."', 5000);
      return;
    }
  }
}

function attack() {
  if (player.attackCooldown > 0) return;
  player.attackCooldown = player.hasItem('faca') ? 15 : 22;
  let hit = false;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (Math.hypot(player.x - e.x, player.y - e.y) < player.attackRange + e.size * 0.4) {
      e.takeDamage(player.hasItem('faca') ? 25 : 12);
      hit = true;
    }
  }
  if (hit) showMessage('Acertou!', 600);
}

function getZoneName() {
  for (const z of ZONES) {
    if (player.x >= z.x && player.x <= z.x + z.w && player.y >= z.y && player.y <= z.y + z.h) {
      return z.name;
    }
  }
  return 'Mansão';
}

function update() {
  if (!gameRunning) return;
  frame++;
  player.update();

  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy = -1;
  if (keys['s'] || keys['arrowdown']) dy = 1;
  if (keys['a'] || keys['arrowleft']) dx = -1;
  if (keys['d'] || keys['arrowright']) dx = 1;
  player.move(dx, dy, walls);

  for (const e of enemies) e.update(player, walls);

  // sanidade no escuro
  if (!player.lanternOn && frame % 110 === 0) {
    player.sanity = Math.max(0, player.sanity - 1);
  }
  // janelas abertas
  for (const obj of objects) {
    if (obj.type === 'janela' && obj.open && frame % 50 === 0) {
      player.sanity = Math.max(0, player.sanity - 2);
    }
  }

  if (player.sanity <= 0) {
    gameRunning = false;
    document.getElementById('gameover-screen').classList.remove('hidden');
  }

  updateHUD(player, getZoneName());
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!player) return;

  // câmera centrada no player
  let camX = player.x - canvas.width / 2;
  let camY = player.y - canvas.height / 2;
  camX = Math.max(0, Math.min(MAP_W - canvas.width, camX));
  camY = Math.max(0, Math.min(MAP_H - canvas.height, camY));

  // === FUNDO = IMAGEM DO MAPA (idêntico) ===
  if (mapImg.complete && mapImg.naturalWidth > 0) {
    ctx.drawImage(mapImg, -camX, -camY, MAP_W, MAP_H);
  } else {
    ctx.fillStyle = '#1a1410';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // itens no chão
  for (const item of items) {
    if (item.taken) continue;
    const ix = item.x - camX;
    const iy = item.y - camY;
    const pulse = 1 + Math.sin(frame * 0.12) * 0.12;
    const g = ctx.createRadialGradient(ix, iy, 0, ix, iy, 16);
    g.addColorStop(0, 'rgba(201,160,64,0.4)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ix, iy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ix, iy, 8 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#c9a040';
    ctx.fill();
    ctx.font = '12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1008';
    const icons = { cafe: '☕', faca: '🔪', lanterna: '🔦', chave: '🔑' };
    ctx.fillText(icons[item.type] || '?', ix, iy + 1);
  }

  // indicadores de objetos interativos
  for (const obj of objects) {
    const ox = obj.x - camX;
    const oy = obj.y - camY;
    if (obj.type === 'fogueira') {
      const f = Math.sin(frame * 0.2) * 3;
      ctx.fillStyle = 'rgba(255,120,30,0.5)';
      ctx.beginPath();
      ctx.arc(ox, oy - 5 + f * 0.3, 10 + f * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (obj.type === 'alavanca') {
      ctx.fillStyle = obj.on ? '#4a8a4a' : '#8a4a2a';
      ctx.fillRect(ox - 6, oy - 10, 12, 20);
      ctx.fillStyle = '#c9a040';
      ctx.fillRect(ox - 8, oy - (obj.on ? 12 : 2), 16, 5);
    }
    if (obj.type === 'bau') {
      ctx.fillStyle = chestOpened ? '#3a5a2a' : '#5a3a18';
      ctx.fillRect(ox - 12, oy - 8, 24, 16);
      ctx.fillStyle = '#c9a040';
      ctx.fillRect(ox - 12, oy - 1, 24, 2);
    }
    if (obj.type === 'nota') {
      ctx.fillStyle = '#d4c090';
      ctx.fillRect(ox - 8, oy - 6, 16, 12);
      ctx.strokeStyle = '#8a7050';
      ctx.strokeRect(ox - 8, oy - 6, 16, 12);
    }
    if (obj.type === 'porta_trancada' && !doorUnlocked) {
      ctx.fillStyle = 'rgba(180,40,40,0.35)';
      ctx.fillRect(ox - 30, oy - 8, 60, 16);
    }
  }

  // inimigos
  for (const e of enemies) e.draw(ctx, camX, camY);

  // jogador
  player.draw(ctx, camX, camY);

  // === ESCURIDÃO + LANTERNA ===
  const px = player.x - camX;
  const py = player.y - camY;
  const radius = player.vision;

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = 'destination-out';
  const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.4, 'rgba(0,0,0,0.88)');
  grad.addColorStop(0.75, 'rgba(0,0,0,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (player.lanternOn && player.hasLantern) {
    ctx.save();
    const light = ctx.createRadialGradient(px, py, 0, px, py, radius);
    light.addColorStop(0, 'rgba(255,200,100,0.15)');
    light.addColorStop(0.5, 'rgba(255,160,50,0.05)');
    light.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
loop();
