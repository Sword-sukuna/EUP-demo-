// ========== MAIN — 1280x720 + COLISÃO GROSSA + DEBUG ==========

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const mapImg = new Image();
mapImg.src = 'assets/mapa-mansao.jpg';

const ZOOM = 1.55;

let player, enemies = [];
let items = [], objects = [];
let keys = {};
let gameRunning = false;
let frame = 0;
let leverOn = false;
let doorUnlocked = false;
let chestOpened = false;
let debugCollision = false; // tecla C

// caixas de colisão dinâmicas (objetos / porta)
let dynamicSolids = [];

function rebuildDynamicSolids() {
  dynamicSolids = [];
  for (const obj of objects) {
    const r = obj.r || 28;
    if (obj.type === 'fogueira') {
      dynamicSolids.push({ x: obj.x - 18, y: obj.y - 10, w: 36, h: 28 });
    } else if (obj.type === 'bau') {
      dynamicSolids.push({ x: obj.x - 14, y: obj.y - 10, w: 28, h: 20 });
    } else if (obj.type === 'alavanca') {
      dynamicSolids.push({ x: obj.x - 10, y: obj.y - 12, w: 20, h: 24 });
    } else if (obj.type === 'porta_trancada' && !doorUnlocked) {
      dynamicSolids.push({ x: obj.x - 40, y: obj.y - 12, w: 80, h: 24 });
    }
  }
}

function hitsDynamic(px, py, rad) {
  for (const s of dynamicSolids) {
    const nx = Math.max(s.x, Math.min(px, s.x + s.w));
    const ny = Math.max(s.y, Math.min(py, s.y + s.h));
    if ((px - nx) ** 2 + (py - ny) ** 2 < rad * rad) return true;
  }
  return false;
}

function initGame() {
  player = new Player(660, 500);
  enemies = spawnMapEnemies();
  items = MAP_ITEMS.map(i => ({ ...i, taken: false }));
  objects = MAP_OBJECTS.map(o => ({ ...o }));
  leverOn = false;
  doorUnlocked = false;
  chestOpened = false;
  frame = 0;
  gameRunning = true;
  rebuildDynamicSolids();
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  showMessage('Você entra na mansão... o ar está pesado. (C = debug colisão)', 3200);
}

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (!gameRunning) return;

  if (e.key.toLowerCase() === 'c') {
    debugCollision = !debugCollision;
    showMessage(debugCollision ? 'DEBUG: mapa inteiro + colisão (C sai)' : 'DEBUG COLISÃO OFF', 1500);
  }

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
  for (const item of items) {
    if (item.taken) continue;
    if (Math.hypot(player.x - item.x, player.y - item.y) < 42) {
      if (player.addItem(item.type)) {
        item.taken = true;
        showMessage('Pegou: ' + item.type);
      } else showMessage('Inventário cheio!');
      return;
    }
  }
  for (const obj of objects) {
    if (Math.hypot(player.x - obj.x, player.y - obj.y) > (obj.r || 36)) continue;

    if (obj.type === 'fogueira') {
      player.heal(100);
      enemies = spawnMapEnemies();
      showMessage('Sanidade restaurada. Os medos retornaram...');
      return;
    }
    if (obj.type === 'janela') {
      obj.open = !obj.open;
      if (obj.open) { player.takeDamage(10); showMessage('Janela aberta. Frio drena sanidade.'); }
      else showMessage('Janela fechada.');
      return;
    }
    if (obj.type === 'bau') {
      if (chestOpened) showMessage('Baú já aberto.');
      else if (player.hasItem('chave')) {
        chestOpened = true;
        const idx = player.inventory.indexOf('chave');
        if (idx >= 0) player.inventory[idx] = null;
        player.addItem('cafe');
        showMessage('Baú aberto! Achou café.');
      } else showMessage('Baú trancado. Precisa de chave.');
      return;
    }
    if (obj.type === 'alavanca') {
      obj.on = !obj.on;
      leverOn = obj.on;
      doorUnlocked = leverOn;
      rebuildDynamicSolids();
      showMessage(leverOn
        ? 'Alavanca ativada. Passagem do beco liberada!'
        : 'Alavanca desligada.');
      return;
    }
    if (obj.type === 'porta_trancada') {
      showMessage(doorUnlocked || player.hasItem('chave')
        ? 'Passagem livre.'
        : 'Trancada. Ache a alavanca ou a chave.');
      return;
    }
    if (obj.type === 'nota') {
      showMessage('Nota: "Alavanca no quarto oeste libera o beco. Chave no quarto inferior esquerdo."', 4500);
      return;
    }
  }
}

function attack() {
  if (player.attackCooldown > 0) return;
  player.attackCooldown = player.hasItem('faca') ? 14 : 22;
  let hit = false;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (Math.hypot(player.x - e.x, player.y - e.y) < player.attackRange + e.size * 0.4) {
      e.takeDamage(player.hasItem('faca') ? 26 : 12);
      hit = true;
    }
  }
  if (hit) showMessage('Acertou!', 500);
}

function getZoneName() {
  for (const z of ZONES) {
    if (player.x >= z.x && player.x <= z.x + z.w && player.y >= z.y && player.y <= z.y + z.h)
      return z.name;
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

  // movimento com grid + objetos dinâmicos
  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    const mx = (dx / len) * player.speed;
    const my = (dy / len) * player.speed;
    player.anim += 0.25;
    if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? 'right' : 'left';
    else player.facing = dy > 0 ? 'down' : 'up';

    const tryX = player.x + mx;
    const tryY = player.y + my;
    if (!player.solidAt(tryX, player.y) && !hitsDynamic(tryX, player.y, player.radius))
      player.x = tryX;
    if (!player.solidAt(player.x, tryY) && !hitsDynamic(player.x, tryY, player.radius))
      player.y = tryY;

    player.x = Math.max(16, Math.min(MAP_W - 16, player.x));
    player.y = Math.max(16, Math.min(MAP_H - 16, player.y));
  }

  for (const e of enemies) e.update(player);

  if (!player.lanternOn && frame % 100 === 0)
    player.sanity = Math.max(0, player.sanity - 1);
  for (const obj of objects) {
    if (obj.type === 'janela' && obj.open && frame % 45 === 0)
      player.sanity = Math.max(0, player.sanity - 2);
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

  // ===== DEBUG: mapa INTEIRO visível, sem breu =====
  if (debugCollision) {
    const scale = Math.min(canvas.width / MAP_W, canvas.height / MAP_H);
    const ox = (canvas.width - MAP_W * scale) / 2;
    const oy = (canvas.height - MAP_H * scale) / 2;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    if (mapImg.complete && mapImg.naturalWidth > 0) {
      ctx.drawImage(mapImg, 0, 0, MAP_W, MAP_H);
    }

    // colisão vermelha em tudo
    if (typeof COLL_GRID !== 'undefined') {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.45)';
      for (let cy = 0; cy < COLL_ROWS; cy++) {
        for (let cx = 0; cx < COLL_COLS; cx++) {
          if (COLL_GRID[cy][cx] === 1) {
            ctx.fillRect(cx * COLL_CELL, cy * COLL_CELL, COLL_CELL, COLL_CELL);
          }
        }
      }
    }

    // objetos dinâmicos em azul
    ctx.fillStyle = 'rgba(0, 140, 255, 0.5)';
    for (const s of dynamicSolids) {
      ctx.fillRect(s.x, s.y, s.w, s.h);
    }

    // player em verde
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // inimigos em amarelo
    ctx.fillStyle = '#ffcc00';
    for (const e of enemies) {
      if (!e.alive) continue;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // legenda
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(8, 8, 320, 72);
    ctx.fillStyle = '#fff';
    ctx.font = '13px monospace';
    ctx.fillText('DEBUG MAPA INTEIRO (tecla C sai)', 16, 28);
    ctx.fillStyle = '#ff6666';
    ctx.fillText('VERMELHO = colisão parede', 16, 48);
    ctx.fillStyle = '#66aaff';
    ctx.fillText('AZUL = objeto/porta  |  VERDE = você', 16, 66);
    return;
  }

  // ===== jogo normal =====
  const viewW = canvas.width / ZOOM;
  const viewH = canvas.height / ZOOM;
  let camX = player.x - viewW / 2;
  let camY = player.y - viewH / 2;
  camX = Math.max(0, Math.min(MAP_W - viewW, camX));
  camY = Math.max(0, Math.min(MAP_H - viewH, camY));

  const screenPX = (player.x - camX) * ZOOM;
  const screenPY = (player.y - camY) * ZOOM;
  const radius = player.vision * ZOOM;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  ctx.arc(screenPX, screenPY, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.save();
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(-camX, -camY);

  if (mapImg.complete && mapImg.naturalWidth > 0) {
    ctx.drawImage(mapImg, 0, 0, MAP_W, MAP_H);
  }

  for (const item of items) {
    if (item.taken) continue;
    const pulse = 1 + Math.sin(frame * 0.12) * 0.1;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(201,160,64,0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(item.x, item.y, 7 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#e0b040';
    ctx.fill();
    ctx.font = '12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1008';
    const icons = { cafe: '☕', faca: '🔪', lanterna: '🔦', chave: '🔑' };
    ctx.fillText(icons[item.type] || '?', item.x, item.y + 1);
  }

  for (const obj of objects) {
    if (obj.type === 'fogueira') {
      const f = Math.sin(frame * 0.2) * 3;
      ctx.fillStyle = 'rgba(255,120,30,0.6)';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y - 4 + f * 0.2, 10 + f * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,210,70,0.9)';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y - 7 + f * 0.3, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (obj.type === 'alavanca') {
      ctx.fillStyle = obj.on ? '#3a8a3a' : '#8a3a2a';
      ctx.fillRect(obj.x - 5, obj.y - 9, 10, 18);
      ctx.fillStyle = '#e0b040';
      ctx.fillRect(obj.x - 7, obj.y - (obj.on ? 11 : 1), 14, 4);
    }
    if (obj.type === 'bau') {
      ctx.fillStyle = chestOpened ? '#2a5a2a' : '#5a2a10';
      ctx.fillRect(obj.x - 11, obj.y - 7, 22, 14);
      ctx.fillStyle = '#e0b040';
      ctx.fillRect(obj.x - 11, obj.y - 1, 22, 2);
    }
    if (obj.type === 'nota') {
      ctx.fillStyle = '#e0d090';
      ctx.fillRect(obj.x - 7, obj.y - 5, 14, 10);
    }
    if (obj.type === 'porta_trancada' && !doorUnlocked) {
      ctx.fillStyle = 'rgba(180,40,40,0.5)';
      ctx.fillRect(obj.x - 36, obj.y - 10, 72, 20);
    }
  }

  for (const e of enemies) e.drawWorld(ctx);

  ctx.restore();
  ctx.restore();

  const grd = ctx.createRadialGradient(screenPX, screenPY, radius * 0.5, screenPX, screenPY, radius);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.beginPath();
  ctx.arc(screenPX, screenPY, radius, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  ctx.save();
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(-camX, -camY);
  player.drawWorld(ctx);
  ctx.restore();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
loop();
