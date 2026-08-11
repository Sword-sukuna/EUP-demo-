// ========== MAIN — MAPA REAL + COLISÃO + ESCURIDÃO ==========

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
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  showMessage('Você entra na mansão... o ar está pesado.', 2800);
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
      showMessage(leverOn
        ? 'Alavanca ativada. Você ouve um clique no beco...'
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
  player.move(dx, dy);

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

  const viewW = canvas.width / ZOOM;
  const viewH = canvas.height / ZOOM;
  let camX = player.x - viewW / 2;
  let camY = player.y - viewH / 2;
  camX = Math.max(0, Math.min(MAP_W - viewW, camX));
  camY = Math.max(0, Math.min(MAP_H - viewH, camY));

  const screenPX = (player.x - camX) * ZOOM;
  const screenPY = (player.y - camY) * ZOOM;
  const radius = player.vision * ZOOM;

  // 1) tela toda preta
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2) só dentro do círculo de visão desenha o mundo
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
      ctx.fillStyle = 'rgba(180,40,40,0.45)';
      ctx.fillRect(obj.x - 28, obj.y - 6, 56, 12);
    }
  }

  for (const e of enemies) e.drawWorld(ctx);

  ctx.restore();
  ctx.restore();

  // 3) vinheta na borda do círculo
  const grd = ctx.createRadialGradient(screenPX, screenPY, radius * 0.5, screenPX, screenPY, radius);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.beginPath();
  ctx.arc(screenPX, screenPY, radius, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  // 4) personagem SEMPRE por cima (visível)
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
