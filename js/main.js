// ========== MAIN — sistema de cores do mapa ==========
// vermelho=parede | amarelo=objeto | azul=porta | verde=item
// branco=interação | roxo=escadas | magenta=cartas

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mapImg = new Image();
mapImg.src = 'assets/mapa-mansao.jpg';
const ZOOM = 1.55;

let player, enemies = [];
let items = [], interactables = [], storyNotes = [];
let doors = [], objectSolids = [], stairs = [];
let keys = {};
let gameRunning = false;
let frame = 0;
let leverOn = false;
let doorUnlocked = false; // beco
let chestOpened = false;
let debugCollision = false;

function initGame() {
  player = new Player(660, 500);
  enemies = spawnMapEnemies();
  items = MAP_ITEMS.map(i => ({ ...i, taken: false }));
  interactables = INTERACTABLES.map(o => ({ ...o }));
  storyNotes = STORY_NOTES.map(n => ({ ...n, read: false }));
  doors = DOORS.map(d => ({ ...d }));
  objectSolids = OBJECT_SOLIDS.map(o => ({ ...o }));
  stairs = STAIRS.map(s => ({ ...s }));
  leverOn = false;
  doorUnlocked = false;
  chestOpened = false;
  // sync beco door
  const beco = doors.find(d => d.id === 'beco');
  if (beco) beco.locked = true;
  frame = 0;
  gameRunning = true;
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  showMessage('Mansão... (C = debug do mapa)', 2800);
}

function hitsBox(px, py, rad, box) {
  const nx = Math.max(box.x, Math.min(px, box.x + box.w));
  const ny = Math.max(box.y, Math.min(py, box.y + box.h));
  return (px - nx) ** 2 + (py - ny) ** 2 < rad * rad;
}

function hitsDynamic(px, py, rad) {
  for (const o of objectSolids) {
    if (hitsBox(px, py, rad, o)) return true;
  }
  for (const d of doors) {
    if (d.locked && hitsBox(px, py, rad, d)) return true;
  }
  for (const s of stairs) {
    if (s.locked && hitsBox(px, py, rad, s)) return true;
  }
  return false;
}

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (!gameRunning) return;
  if (e.key.toLowerCase() === 'c') {
    debugCollision = !debugCollision;
    showMessage(debugCollision ? 'DEBUG mapa (C sai)' : 'Debug off', 1200);
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
  // itens verdes
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
  // cartas magenta
  for (const n of storyNotes) {
    if (Math.hypot(player.x - n.x, player.y - n.y) < 36) {
      n.read = true;
      showMessage(n.text, 5000);
      return;
    }
  }
  // interações brancas
  for (const obj of interactables) {
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
      const beco = doors.find(d => d.id === 'beco');
      if (beco) beco.locked = !leverOn;
      showMessage(leverOn ? 'Alavanca ON — beco liberado!' : 'Alavanca OFF.');
      return;
    }
  }
  // portas azuis
  for (const d of doors) {
    if (Math.hypot(player.x - (d.x + d.w / 2), player.y - (d.y + d.h / 2)) < 50) {
      if (d.locked) showMessage('Porta trancada: ' + (d.label || ''));
      else showMessage(d.label || 'Porta');
      return;
    }
  }
  // escadas roxas
  for (const s of stairs) {
    if (hitsBox(player.x, player.y, 20, s)) {
      showMessage('Escadas para o 2º andar — em breve.');
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

  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    const mx = (dx / len) * player.speed;
    const my = (dy / len) * player.speed;
    player.anim += 0.25;
    if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? 'right' : 'left';
    else player.facing = dy > 0 ? 'down' : 'up';
    const tx = player.x + mx, ty = player.y + my;
    if (!player.solidAt(tx, player.y) && !hitsDynamic(tx, player.y, player.radius)) player.x = tx;
    if (!player.solidAt(player.x, ty) && !hitsDynamic(player.x, ty, player.radius)) player.y = ty;
    player.x = Math.max(16, Math.min(MAP_W - 16, player.x));
    player.y = Math.max(16, Math.min(MAP_H - 16, player.y));
  }

  for (const e of enemies) e.update(player);
  if (!player.lanternOn && frame % 100 === 0) player.sanity = Math.max(0, player.sanity - 1);
  for (const obj of interactables) {
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

  // ===== DEBUG: mapa inteiro + cores =====
  if (debugCollision) {
    const scale = Math.min(canvas.width / MAP_W, canvas.height / MAP_H);
    const ox = (canvas.width - MAP_W * scale) / 2;
    const oy = (canvas.height - MAP_H * scale) / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    if (mapImg.complete && mapImg.naturalWidth > 0) ctx.drawImage(mapImg, 0, 0, MAP_W, MAP_H);

    // VERMELHO paredes
    if (typeof COLL_GRID !== 'undefined') {
      ctx.fillStyle = 'rgba(255,0,0,0.4)';
      for (let cy = 0; cy < COLL_ROWS; cy++)
        for (let cx = 0; cx < COLL_COLS; cx++)
          if (COLL_GRID[cy][cx] === 1)
            ctx.fillRect(cx * COLL_CELL, cy * COLL_CELL, COLL_CELL, COLL_CELL);
    }
    // AMARELO objetos
    ctx.fillStyle = 'rgba(255,220,0,0.45)';
    for (const o of objectSolids) ctx.fillRect(o.x, o.y, o.w, o.h);
    // AZUL portas
    for (const d of doors) {
      ctx.fillStyle = d.locked ? 'rgba(30,100,255,0.55)' : 'rgba(80,180,255,0.35)';
      ctx.fillRect(d.x, d.y, d.w, d.h);
    }
    // ROXO escadas
    ctx.fillStyle = 'rgba(160,60,220,0.5)';
    for (const s of stairs) ctx.fillRect(s.x, s.y, s.w, s.h);
    // BRANCO interações
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    for (const o of interactables) {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r || 28, 0, Math.PI * 2);
      ctx.stroke();
    }
    // MAGENTA cartas
    ctx.fillStyle = 'rgba(255,0,180,0.7)';
    for (const n of storyNotes) {
      ctx.fillRect(n.x - 8, n.y - 6, 16, 12);
    }
    // VERDE itens
    ctx.fillStyle = 'rgba(0,255,80,0.8)';
    for (const it of items) {
      if (it.taken) continue;
      ctx.beginPath();
      ctx.arc(it.x, it.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    // player
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);

    ctx.restore();
    // legenda
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(8, 8, 340, 100);
    ctx.font = '12px monospace';
    const legend = [
      ['#ff4444', 'VERMELHO = parede'],
      ['#ffcc00', 'AMARELO = objeto'],
      ['#4488ff', 'AZUL = porta'],
      ['#00ff50', 'VERDE = item'],
      ['#ffffff', 'BRANCO = interação'],
      ['#cc44ff', 'ROXO = escadas | MAGENTA = carta'],
    ];
    legend.forEach((L, i) => {
      ctx.fillStyle = L[0];
      ctx.fillText(L[1], 16, 26 + i * 14);
    });
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
  if (mapImg.complete && mapImg.naturalWidth > 0) ctx.drawImage(mapImg, 0, 0, MAP_W, MAP_H);

  for (const item of items) {
    if (item.taken) continue;
    const pulse = 1 + Math.sin(frame * 0.12) * 0.1;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,80,0.25)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(item.x, item.y, 7 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#40e060';
    ctx.fill();
    ctx.font = '12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0a1a08';
    const icons = { cafe: '☕', faca: '🔪', lanterna: '🔦', chave: '🔑' };
    ctx.fillText(icons[item.type] || '?', item.x, item.y + 1);
  }

  for (const n of storyNotes) {
    ctx.fillStyle = n.read ? '#8060a0' : '#ff40c0';
    ctx.fillRect(n.x - 7, n.y - 5, 14, 10);
  }

  for (const obj of interactables) {
    if (obj.type === 'fogueira') {
      const f = Math.sin(frame * 0.2) * 3;
      ctx.fillStyle = 'rgba(255,120,30,0.6)';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y - 4 + f * 0.2, 10, 0, Math.PI * 2);
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
    }
  }

  for (const d of doors) {
    if (d.locked) {
      ctx.fillStyle = 'rgba(40,80,200,0.35)';
      ctx.fillRect(d.x, d.y, d.w, d.h);
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
