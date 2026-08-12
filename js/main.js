// ========== MAIN — sistema de cores do mapa ==========
// vermelho=parede | amarelo=objeto | azul=porta | verde=item
// branco=interação | roxo=escadas | magenta=cartas

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mapImg = new Image();
mapImg.src = 'assets/mapa-mansao.jpg';
const mapImg2 = new Image();
mapImg2.src = 'assets/mapa-mansao-2andar.jpg';
const cartaImg = new Image();
cartaImg.src = 'assets/sprites/carta/carta_64.png';
const windowClosedImg = new Image();
windowClosedImg.src = 'assets/sprites/window/window_closed.png';
const windowOpenImg = new Image();
windowOpenImg.src = 'assets/sprites/window/window_open.png';



const collImg = new Image();
collImg.src = 'assets/collision-map.png';
collImg.onload = () => initCollisionMap(collImg);
const collImg2 = new Image();
collImg2.src = 'assets/collision-map-2.png';
collImg2.onload = () => initCollisionMap2(collImg2);

const ZOOM = 1.8;

let player, enemies = [];
let items = [], interactables = [], storyNotes = [];
let doors = [], objectSolids = [], stairs = [];
let keys = {};
let gameRunning = false;
let frame = 0;
let leverOn = false;
let doorUnlocked = false;
let chestOpened = false;
let debugCollision = false;
let speechTimer = null;
let letterOpen = false;
let typewriterTimer = null;
let currentFloor = 1; // 1 = térreo, 2 = segundo
let pushables = [];
let floor2Windows = [];
let floor2Items = [];
let floor2Notes = [];
let bossDoorUnlocked = false;

// intro cinemática
let introActive = false;
let introPhase = 'none'; // zoom_in | story | zoom_out | done
let introZoom = 3.2;
let introLine = 0;
let introChar = 0;
let introTimer = 0;
let introFull = '';
let introPlaying = false;
const INTRO_TARGET_ZOOM = 1.8;
const INTRO_START_ZOOM = 3.4;
const INTRO_LINES = [
  'Você abre os olhos...',
  'O bar está vazio. O silêncio pesa no peito.',
  'Os medos dela ainda habitam esta mansão.',
  'Não deixe a sanidade chegar a zero.',
  'Levante-se. Algo se move no escuro.',
];





const SAVE_KEY = 'eup_demo_save_v1';

function saveGame() {
  if (!player) return;
  const data = {
    floor: currentFloor,
    x: player.x,
    y: player.y,
    sanity: player.sanity,
    inventory: player.inventory.slice(),
    hasLantern: player.hasLantern,
    lanternOn: player.lanternOn,
    unlockedDoors: unlockedDoors.slice(),
    items: items.map(i => ({ id: i.id || null, type: i.type, taken: !!i.taken, hidden: !!i.hidden, x: i.x, y: i.y })),
    pushables: pushables.map(b => ({ id: b.id, x: b.x, y: b.y, pushed: !!b.pushed, revealItemId: b.revealItemId })),
    notes: storyNotes.map(n => ({ id: n.id, read: !!n.read })),
    doors: doors.map(d => ({ id: d.id, locked: !!d.locked })),
    chestOpened: !!chestOpened,
    bossDoorUnlocked: !!bossDoorUnlocked,
    floor2Windows: floor2Windows.map(w => ({ x: w.x, y: w.y, open: !!w.open })),
    floor2Items: floor2Items.map(i => ({ type: i.type, taken: !!i.taken, x: i.x, y: i.y })),
    floor2Notes: floor2Notes.map(n => ({ id: n.id, read: !!n.read })),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('save failed', e);
    return false;
  }
}

function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}

function loadGame() {
  let raw;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  if (!raw) return false;
  let data;
  try { data = JSON.parse(raw); } catch (e) { return false; }

  // base reset then apply
  currentFloor = data.floor || 1;
  player = new Player(data.x || 1100, data.y || 1480);
  player.sanity = data.sanity != null ? data.sanity : 100;
  player.inventory = (data.inventory || [null,null,null,null]).slice(0, 4);
  while (player.inventory.length < 4) player.inventory.push(null);
  player.hasLantern = !!data.hasLantern;
  player.lanternOn = !!data.lanternOn;

  items = MAP_ITEMS.map(i => ({ ...i, taken: false }));
  if (data.items) {
    for (const s of data.items) {
      const match = items.find(it => (s.id && it.id === s.id) || (it.type === s.type && Math.hypot(it.x - s.x, it.y - s.y) < 5));
      if (match) {
        match.taken = !!s.taken;
        match.hidden = s.hidden != null ? !!s.hidden : match.hidden;
      }
    }
  }
  // also restore dropped carta etc that aren't in MAP_ITEMS
  if (data.items) {
    for (const s of data.items) {
      if (s.type === 'carta_2andar' && !s.taken) {
        const exists = items.some(it => it.type === 'carta_2andar' && Math.hypot(it.x - s.x, it.y - s.y) < 5);
        if (!exists) items.push({ x: s.x, y: s.y, type: 'carta_2andar', taken: false });
      }
    }
  }

  interactables = INTERACTABLES.map(o => ({ ...o }));
  storyNotes = STORY_NOTES.map(n => ({ ...n, read: false }));
  if (data.notes) {
    for (const sn of data.notes) {
      const n = storyNotes.find(x => x.id === sn.id);
      if (n) n.read = !!sn.read;
    }
  }
  doors = DOORS.map(d => ({ ...d }));
  if (data.doors) {
    for (const sd of data.doors) {
      const d = doors.find(x => x.id === sd.id);
      if (d) d.locked = !!sd.locked;
    }
  }
  objectSolids = OBJECT_SOLIDS.map(o => ({ ...o }));
  stairs = STAIRS.map(s => ({ ...s }));
  pushables = (typeof PUSHABLES !== 'undefined' ? PUSHABLES : []).map(p => ({ ...p }));
  if (data.pushables) {
    for (const sb of data.pushables) {
      const b = pushables.find(x => x.id === sb.id);
      if (b) { b.pushed = !!sb.pushed; b.x = sb.x; b.y = sb.y; }
    }
  }
  unlockedDoors = (data.unlockedDoors || []).slice();
  chestOpened = !!data.chestOpened;
  bossDoorUnlocked = !!data.bossDoorUnlocked;

  if (currentFloor === 2) {
    floor2Windows = (typeof FLOOR2_WINDOWS !== 'undefined' ? FLOOR2_WINDOWS : []).map(w => ({ ...w }));
    floor2Items = (typeof FLOOR2_ITEMS !== 'undefined' ? FLOOR2_ITEMS : []).map(i => ({ ...i }));
    floor2Notes = (typeof FLOOR2_NOTES !== 'undefined' ? FLOOR2_NOTES : []).map(n => ({ ...n }));
    if (data.floor2Windows) {
      for (let i = 0; i < floor2Windows.length; i++) {
        if (data.floor2Windows[i]) floor2Windows[i].open = !!data.floor2Windows[i].open;
      }
    }
    if (data.floor2Items) {
      for (const si of data.floor2Items) {
        const it = floor2Items.find(x => x.type === si.type && Math.hypot(x.x - si.x, x.y - si.y) < 5);
        if (it) it.taken = !!si.taken;
      }
    }
    if (data.floor2Notes) {
      for (const sn of data.floor2Notes) {
        const n = floor2Notes.find(x => x.id === sn.id);
        if (n) n.read = !!sn.read;
      }
    }
    enemies = [];
  } else {
    floor2Windows = [];
    floor2Items = [];
    floor2Notes = [];
    enemies = spawnMapEnemies();
  }

  leverOn = false;
  doorUnlocked = false;
  frame = 0;
  gameRunning = true;
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  introActive = false;
  introPhase = 'done';
  introZoom = INTRO_TARGET_ZOOM;
  setIntroUI(false);
  showMessage('Jogo carregado.', 2500);
  return true;
}



function setIntroUI(show) {
  const el = document.getElementById('intro-overlay');
  if (!el) return;
  if (show) el.classList.remove('hidden');
  else el.classList.add('hidden');
}

function startIntroCinematic() {
  introActive = true;
  introPhase = 'zoom_in';
  introZoom = INTRO_START_ZOOM;
  introLine = 0;
  introChar = 0;
  introTimer = 0;
  introPlaying = false;
  introFull = '';
  const it = document.getElementById('intro-text');
  if (it) it.textContent = '';
  setIntroUI(true);
  // player "dormindo" na cadeira do bar
  if (player) {
    player.x = 1120;
    player.y = 1490;
    player.facing = 'down';
  }
}

function skipIntro() {
  if (!introActive) return;
  introPhase = 'zoom_out';
  introPlaying = false;
  const it = document.getElementById('intro-text');
  if (it) it.textContent = '';
}

function advanceIntroLine() {
  introLine++;
  if (introLine >= INTRO_LINES.length) {
    introPhase = 'zoom_out';
    introPlaying = false;
    const it = document.getElementById('intro-text');
    if (it) it.textContent = '';
    return;
  }
  introFull = INTRO_LINES[introLine];
  introChar = 0;
  introPlaying = true;
  introTimer = 0;
  const it = document.getElementById('intro-text');
  if (it) it.textContent = '';
}

function updateIntro() {
  if (!introActive) return;

  if (introPhase === 'zoom_in') {
    introZoom += (INTRO_TARGET_ZOOM + 0.55 - introZoom) * 0.04;
    if (Math.abs(introZoom - (INTRO_TARGET_ZOOM + 0.55)) < 0.03) {
      introZoom = INTRO_TARGET_ZOOM + 0.55;
      introPhase = 'story';
      introLine = 0;
      introFull = INTRO_LINES[0];
      introChar = 0;
      introPlaying = true;
      introTimer = 0;
    }
    return;
  }

  if (introPhase === 'story') {
    // typewriter
    if (introPlaying) {
      introTimer++;
      if (introTimer % 2 === 0 && introChar < introFull.length) {
        introChar++;
        const it = document.getElementById('intro-text');
        if (it) it.textContent = introFull.slice(0, introChar);
      }
      if (introChar >= introFull.length) {
        introPlaying = false;
        introTimer = 0;
      }
    } else {
      introTimer++;
      // pausa entre linhas
      if (introTimer > 70) advanceIntroLine();
    }
    return;
  }

  if (introPhase === 'zoom_out') {
    introZoom += (INTRO_TARGET_ZOOM - introZoom) * 0.05;
    if (Math.abs(introZoom - INTRO_TARGET_ZOOM) < 0.02) {
      introZoom = INTRO_TARGET_ZOOM;
      introPhase = 'done';
      introActive = false;
      setIntroUI(false);
      showMessage('Você acordou no bar...', 2800);
    }
  }
}


function initGame() {
  currentFloor = 1;
  player = new Player(1100, 1480); // spawn no BAR
  enemies = spawnMapEnemies();
  items = MAP_ITEMS.map(i => ({ ...i, taken: false }));
  interactables = INTERACTABLES.map(o => ({ ...o }));
  storyNotes = STORY_NOTES.map(n => ({ ...n, read: false }));
  doors = DOORS.map(d => ({ ...d }));
  objectSolids = OBJECT_SOLIDS.map(o => ({ ...o }));
  stairs = STAIRS.map(s => ({ ...s }));
  pushables = (typeof PUSHABLES !== 'undefined' ? PUSHABLES : []).map(p => ({ ...p }));
  leverOn = false;
  doorUnlocked = false;
  unlockedDoors = [];
  chestOpened = false;
  frame = 0;
  gameRunning = true;
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  // cinemática de abertura (dormindo no bar)
  startIntroCinematic();
}

function onEliteDefeated(x, y) {
  // drop carta
  items.push({ x: x, y: y - 20, type: 'carta_2andar', taken: false });
  showSpeech('O manequim caiu. Uma carta caiu no chão...');
  showMessage('Carta do 2º andar obtida — vá às escadas.', 4000);
}

function goToFloor2() {
  currentFloor = 2;
  enemies = typeof spawnMapEnemiesFloor2 === 'function' ? spawnMapEnemiesFloor2() : [];
  player.x = 1129;
  player.y = 750;
  floor2Windows = (typeof FLOOR2_WINDOWS !== 'undefined' ? FLOOR2_WINDOWS : []).map(w => ({ ...w }));
  floor2Items = (typeof FLOOR2_ITEMS !== 'undefined' ? FLOOR2_ITEMS : []).map(i => ({ ...i }));
  floor2Notes = (typeof FLOOR2_NOTES !== 'undefined' ? FLOOR2_NOTES : []).map(n => ({ ...n }));
  bossDoorUnlocked = false;
  showMessage('2º andar. Janelas drenam sanidade se abertas.', 3500);
  showSpeech('O ar aqui em cima é mais frio...');
}

function goToFloor1() {
  currentFloor = 1;
  enemies = spawnMapEnemies();
  player.x = 1100;
  player.y = 560; // perto das escadas
  floor2Windows = [];
  floor2Items = [];
  floor2Notes = [];
  showMessage('Térreo.', 2000);
}

function hitsBox(px, py, rad, box) {
  const nx = Math.max(box.x, Math.min(px, box.x + box.w));
  const ny = Math.max(box.y, Math.min(py, box.y + box.h));
  return (px - nx) ** 2 + (py - ny) ** 2 < rad * rad;
}

function hitsDynamic(px, py, rad) {
  // colisão principal vem do collision-map.png (cores)
  // só bloqueia escadas por caixa (roxo futuro)
  for (const s of stairs) {
    if (s.locked && hitsBox(px, py, rad * 0.5, s)) return true;
  }
  return false;
}

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (!gameRunning) return;
  if (introActive) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'e') {
      e.preventDefault();
      skipIntro();
    }
    return;
  }
  if (e.key.toLowerCase() === 'c') {
    debugCollision = !debugCollision;
    showMessage(debugCollision ? ('DEBUG ' + (currentFloor===2?'2º':'1º') + ' andar (C sai)') : 'Debug off', 1200);
  }
  if (e.key >= '1' && e.key <= '4') player.selectedSlot = parseInt(e.key) - 1;
  if (e.key === 'Escape') { closeLetter(); return; }
  if (e.key.toLowerCase() === 'e') {
    if (letterOpen) { closeLetter(); return; }
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



function typewriter(el, fullText, speed, done) {
  clearInterval(typewriterTimer);
  el.textContent = '';
  let i = 0;
  typewriterTimer = setInterval(() => {
    i++;
    el.textContent = fullText.slice(0, i);
    if (i >= fullText.length) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
      if (done) done();
    }
  }, speed);
}

function showSpeech(text) {
  const bubble = document.getElementById('speech-bubble');
  const st = document.getElementById('speech-text');
  if (!bubble || !st) return;
  letterOpen = false;
  document.getElementById('letter-overlay')?.classList.add('hidden');
  bubble.classList.remove('hidden');
  typewriter(st, text, 28, () => {
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => bubble.classList.add('hidden'), 3200);
  });
}

function showLetter(text) {
  const ov = document.getElementById('letter-overlay');
  const lt = document.getElementById('letter-text');
  if (!ov || !lt) return;
  document.getElementById('speech-bubble')?.classList.add('hidden');
  letterOpen = true;
  ov.classList.remove('hidden');
  typewriter(lt, text, 22, null);
}

function closeLetter() {
  letterOpen = false;
  clearInterval(typewriterTimer);
  document.getElementById('letter-overlay')?.classList.add('hidden');
  document.getElementById('letter-text').textContent = '';
}

function randomFlavor() {
  if (typeof FLAVOR_LINES === 'undefined' || !FLAVOR_LINES.length)
    return 'Não há nada de especial aqui.';
  return FLAVOR_LINES[Math.floor(Math.random() * FLAVOR_LINES.length)];
}



// prioriza interações num raio (não só 1 pixel do pé)
function nearbyTileType(fx, fy, rad) {
  const priority = ['note', 'item', 'interact', 'door', 'scene', 'stairs'];
  const found = {};
  const step = 4;
  for (let dy = -rad; dy <= rad; dy += step) {
    for (let dx = -rad; dx <= rad; dx += step) {
      if (dx*dx + dy*dy > rad*rad) continue;
      const c = getTileType(fx + dx, fy + dy);
      if (c && c !== 'walk' && c !== 'wall' && c !== 'object') found[c] = true;
    }
  }
  for (const p of priority) if (found[p]) return p;
  return 'walk';
}

function getNearbyPrompt() {
  if (!player) return null;
  const fx = player.x;
  const fy = player.y + player.footOffset;
  const reach = 56;

  if (currentFloor === 2) {
    for (const w of floor2Windows) {
      if (Math.hypot(fx - w.x, fy - w.y) < 48)
        return w.open ? 'Aperte E para fechar a janela' : 'Aperte E para abrir a janela';
    }
    for (const item of floor2Items) {
      if (!item.taken && Math.hypot(fx - item.x, fy - item.y) < reach)
        return 'Aperte E para pegar';
    }
    for (const n of floor2Notes) {
      if (Math.hypot(fx - n.x, fy - n.y) < reach)
        return 'Aperte E para ler a carta';
    }
    if (typeof FLOOR2_BOSS_DOOR !== 'undefined') {
      const d = FLOOR2_BOSS_DOOR;
      if (Math.hypot(fx - d.x, fy - d.y) < 60)
        return bossDoorUnlocked ? 'Porta do sótão aberta' : 'Aperte E (Chave do Sótão)';
    }
    if (typeof FLOOR2_EXIT_F1 !== 'undefined') {
      const e = FLOOR2_EXIT_F1;
      if (Math.hypot(fx - e.x, fy - e.y) < (e.r || 50))
        return 'Aperte E para voltar ao 1º andar';
    }
    const tt = getTileType(fx, fy);
    if (tt === 'exit_f1') return 'Aperte E para voltar ao 1º andar';
    if (tt === 'window') return 'Aperte E — janela';
    if (tt === 'boss_door') return 'Aperte E — porta do sótão';
    return null;
  }

  for (const box of (pushables || [])) {
    if (!box.pushed && Math.hypot(fx - box.x, fy - box.y) < 48)
      return 'Aperte E para empurrar a caixa';
  }
  for (const item of items) {
    if (item.taken || item.hidden) continue;
    if (Math.hypot(fx - item.x, fy - item.y) < reach)
      return 'Aperte E para pegar';
  }
  for (const n of storyNotes) {
    if (Math.hypot(fx - n.x, fy - n.y) < reach)
      return n.read ? 'Aperte E para ler novamente' : 'Aperte E para ler a carta';
  }
  for (const obj of interactables) {
    if (Math.hypot(fx - obj.x, fy - obj.y) > (obj.r || 48)) continue;
    if (obj.type === 'fogueira') return 'Aperte E para descansar na fogueira';
    if (obj.type === 'janela') return obj.open ? 'Aperte E para fechar a janela' : 'Aperte E para abrir a janela';
    if (obj.type === 'bau') return chestOpened ? 'Baú aberto' : 'Aperte E para abrir o baú';
    if (obj.type === 'alavanca') return obj.on ? 'Aperte E para desligar a alavanca' : 'Aperte E para puxar a alavanca';
  }
  for (const d of doors) {
    if (Math.hypot(fx - (d.x + d.w/2), fy - (d.y + d.h/2)) < 50) {
      if (d.locked) return 'Porta trancada';
      return 'Aperte E para examinar a porta';
    }
  }
  for (const s of stairs) {
    const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
    if (Math.hypot(fx - cx, fy - cy) < 36) return player.hasItem('carta_2andar') ? 'Aperte E para subir ao 2º andar' : 'Escadas — precisa da carta';
  }
  if (typeof getTileType === 'function') {
    const tt = nearbyTileType(fx, fy, 18);
    if (tt === 'interact') return 'Aperte E para examinar';
    if (tt === 'note') return 'Aperte E para ler a carta';
    if (tt === 'item') return 'Aperte E para pegar';
    if (tt === 'scene') return 'Aperte E para examinar a saída';
    if (tt === 'door') {
      return isDoorUnlocked(fx, fy) ? 'Porta aberta' : 'Aperte E (chave específica)';
    }
    if (tt === 'door_free') return 'Passagem livre';
    if (tt === 'exit_street') return 'Aperte E — saída para a rua';
    if (tt === 'exit_patio') return 'Aperte E — saída para o pátio';
    if (tt === 'fogueira') return 'Aperte E — fogueira';
  }
  return null;
}

function updatePrompt() {
  const el = document.getElementById('prompt');
  if (!el) return;
  const text = getNearbyPrompt();
  if (text) {
    el.textContent = text;
    el.classList.add('show');
  } else {
    el.classList.remove('show');
  }
}

function canPickItem(type) {
  // faca e lanterna: só 1 no inventário (ou já equipada)
  if (type === 'faca' && player.hasItem('faca')) return false;
  if (type === 'lanterna' && (player.hasItem('lanterna') || player.hasLantern)) return false;
  return true;
}

function interact() {
  if (letterOpen) { closeLetter(); return; }
  const fx = player.x, fy = player.y + player.footOffset;

  // ===== 2º ANDAR =====
  if (currentFloor === 2) {
    // janelas
    for (const w of floor2Windows) {
      if (Math.hypot(fx - w.x, fy - w.y) < 48) {
        w.open = !w.open;
        showSpeech(w.open
          ? 'Abri a janela. Um vento gelado corta a sanidade...'
          : 'Fechei a janela. O silêncio volta.');
        return;
      }
    }
    // itens 2f
    for (const item of floor2Items) {
      if (item.taken) continue;
      if (Math.hypot(fx - item.x, fy - item.y) < 56) {
        if (!canPickItem(item.type)) {
          showSpeech('Já tenho isso.');
          return;
        }
        if (player.addItem(item.type)) {
          item.taken = true;
          const nome = (KEY_LABELS && KEY_LABELS[item.type]) || item.type;
          showSpeech('Peguei: ' + nome + '.');
        } else showSpeech('Inventário cheio.');
        return;
      }
    }
    // notas 2f
    for (const n of floor2Notes) {
      if (Math.hypot(fx - n.x, fy - n.y) < 56) {
        n.read = true;
        showLetter(n.text);
        return;
      }
    }
    // porta boss
    if (typeof FLOOR2_BOSS_DOOR !== 'undefined') {
      const d = FLOOR2_BOSS_DOOR;
      if (Math.hypot(fx - d.x, fy - d.y) < 60) {
        if (bossDoorUnlocked || isDoorUnlocked(d.x, d.y)) {
          showSpeech('A porta do sótão está aberta... (boss em breve)');
        } else if (player.hasItem('chave_boss')) {
          unlockDoorAt(d.x, d.y, 'boss');
          bossDoorUnlocked = true;
          const idx = player.inventory.indexOf('chave_boss');
          if (idx >= 0) player.inventory[idx] = null;
          showSpeech('A Chave do Sótão girou. A porta cedeu.');
        } else {
          showSpeech('Porta selada. Preciso da Chave do Sótão.');
        }
        return;
      }
    }
    // saída pro 1º
    if (typeof FLOOR2_EXIT_F1 !== 'undefined') {
      const e = FLOOR2_EXIT_F1;
      if (Math.hypot(fx - e.x, fy - e.y) < (e.r || 50)) {
        goToFloor1();
        return;
      }
    }
    // cores
    const tt = getTileType(fx, fy);
    if (tt === 'exit_f1') { goToFloor1(); return; }
    if (tt === 'window') {
      showSpeech('Uma janela. Aperte E perto dela para abrir/fechar.');
      return;
    }
    if (tt === 'boss_door') {
      showSpeech(bossDoorUnlocked ? 'Porta do sótão aberta.' : 'Porta do sótão. Trancada.');
      return;
    }
    if (tt === 'interact') { showSpeech('Nada de especial...'); return; }
    return;
  }

  // ===== 1º ANDAR =====
  // itens (hidden só após puzzle)
  for (const item of items) {
    if (item.taken || item.hidden) continue;
    if (Math.hypot(fx - item.x, fy - item.y) < 56) {
      if (!canPickItem(item.type)) {
        showSpeech('Já tenho isso.');
        return;
      }
      if (player.addItem(item.type)) {
        item.taken = true;
        const nome = (typeof KEY_LABELS !== 'undefined' && KEY_LABELS[item.type]) ? KEY_LABELS[item.type] : item.type;
        showSpeech('Peguei: ' + nome + '.');
      } else showSpeech('Inventário cheio.');
      return;
    }
  }

  // cartas
  for (const n of storyNotes) {
    if (Math.hypot(fx - n.x, fy - n.y) < 56) {
      n.read = true;
      showLetter(n.text);
      return;
    }
  }

  // caixa empurrável (puzzle do bar)
  for (const box of pushables) {
    if (box.pushed) continue;
    if (Math.hypot(fx - box.x, fy - box.y) < 48) {
      // empurra para a esquerda
      box.x -= 50;
      box.pushed = true;
      if (box.revealItemId) {
        for (const it of items) {
          if (it.id === box.revealItemId) it.hidden = false;
        }
      }
      showSpeech('Empurrei a caixa. Uma chave estava escondida atrás!');
      showMessage('Chave da Mansão revelada!', 2500);
      return;
    }
  }

  // interações posicionadas
  for (const obj of interactables) {
    if (Math.hypot(fx - obj.x, fy - obj.y) > (obj.r || 48)) continue;

    if (obj.type === 'fogueira') {
      player.heal(100);
      // não respawna inimigos — só cura + save
      const ok = saveGame();
      showSpeech(ok
        ? 'O calor da fogueira acalma a mente. Progresso salvo.'
        : 'O calor da fogueira acalma a mente. Sanidade restaurada.');
      showMessage(ok ? 'Jogo salvo na fogueira.' : 'Sanidade restaurada.', 2500);
      return;
    }
    if (obj.type === 'flavor') {
      showSpeech(obj.text || '...');
      return;
    }
    if (obj.type === 'janela') {
      obj.open = !obj.open;
      showSpeech(obj.open ? 'Abri a janela. Um vento gelado corta a pele...' : 'Fechei a janela.');
      if (obj.open) player.takeDamage(10);
      return;
    }
    if (obj.type === 'bau') {
      if (chestOpened) { showSpeech('O baú já está aberto.'); return; }
      if (player.hasItem('chave_beco') || player.hasItem('chave_esq')) {
        chestOpened = true;
        // gasta uma chave genérica se tiver
        for (const k of ['chave_beco','chave_esq','chave_dir']) {
          const idx = player.inventory.indexOf(k);
          if (idx >= 0) { player.inventory[idx] = null; break; }
        }
        player.addItem('cafe');
        showSpeech('O baú abriu. Achei um café.');
      } else showSpeech('Trancado.');
      return;
    }
    if (obj.type === 'alavanca') {
      obj.on = !obj.on;
      leverOn = obj.on;
      showSpeech(leverOn ? 'A alavanca cedeu com um estalo.' : 'Alavanca desligada.');
      return;
    }
  }

  // portas AZUIS — chave específica
  for (const d of doors) {
    const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
    if (Math.hypot(fx - cx, fy - cy) > 70) continue;
    if (!d.locked || isDoorUnlocked(cx, cy)) {
      showSpeech('A porta está aberta.');
      return;
    }
    const need = d.key;
    if (player.hasItem(need)) {
      unlockDoorAt(cx, cy, d.id);
      d.locked = false;
      const idx = player.inventory.indexOf(need);
      if (idx >= 0) player.inventory[idx] = null;
      const nome = (KEY_LABELS && KEY_LABELS[need]) || need;
      showSpeech('Usei a ' + nome + '. A porta destrancou.');
    } else {
      showSpeech('Trancada. Preciso da chave certa.');
    }
    return;
  }

  // escadas (caixa)
  if (currentFloor === 1) {
    for (const s of stairs) {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      if (Math.hypot(fx - cx, fy - cy) < 50) {
        if (player.hasItem('carta_2andar')) goToFloor2();
        else showSpeech('Escadas... preciso da carta do manequim.');
        return;
      }
    }
  } else {
    // no 2º andar: E perto do centro volta
    if (Math.hypot(fx - MAP2_W/2, fy - MAP2_H/2) < 80) {
      // optional: nothing
    }
  }

  // cores sob o pé
  if (typeof getTileType === 'function' && currentFloor === 1) {
    const tt = nearbyTileType(fx, fy, 20);
    if (tt === 'note') {
      showLetter('O papel está quase ilegível...');
      return;
    }
    if (tt === 'interact') {
      showSpeech('Nada de especial...');
      return;
    }
    if (tt === 'door') {
      showSpeech('Porta trancada. Preciso da chave certa.');
      return;
    }
    if (tt === 'door_free') {
      showSpeech('A passagem está livre.');
      return;
    }
    if (tt === 'exit_street') {
      showSpeech('A saída para a rua. Ainda não é a hora de ir.');
      return;
    }
    if (tt === 'exit_patio') {
      showSpeech('A porta do pátio. O ar lá fora é pesado.');
      return;
    }
    if (tt === 'stairs') {
      if (player.hasItem('carta_2andar')) {
      goToFloor2();
    } else {
      showSpeech('Escadas para o segundo andar... preciso de uma carta especial.');
    }
      return;
    }
    if (tt === 'item') {
      showSpeech('Tem algo aqui.');
      return;
    }
  }
}

function attack() {
  if (!player.startAttack()) return;
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

  // intro cinemática — sem controle
  if (introActive) {
    updateIntro();
    updateHUD(player, getZoneName());
    return;
  }

  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy = -1;
  if (keys['s'] || keys['arrowdown']) dy = 1;
  if (keys['a'] || keys['arrowleft']) dx = -1;
  if (keys['d'] || keys['arrowright']) dx = 1;
  if (!player.attacking && !letterOpen) {
    player.applyMove(dx, dy);
  }

  for (const e of enemies) e.update(player);
  if (!player.lanternOn && frame % 100 === 0) player.sanity = Math.max(0, player.sanity - 1);
  for (const obj of interactables) {
    if (obj.type === 'janela' && obj.open && frame % 45 === 0)
      player.sanity = Math.max(0, player.sanity - 2);
  }
  if (currentFloor === 2) {
    // janelas abrem/fecham sozinhas de vez em quando
    if (frame % 180 === 0 && floor2Windows.length) {
      const w = floor2Windows[Math.floor(Math.random() * floor2Windows.length)];
      w.open = !w.open;
      if (Math.hypot(player.x - w.x, player.y - w.y) < 200) {
        showMessage(w.open ? 'Uma janela se abriu sozinha...' : 'Uma janela bateu...', 1800);
      }
    }
    for (const w of floor2Windows) {
      if (w.open && frame % 40 === 0)
        player.sanity = Math.max(0, player.sanity - 3);
    }
  }
  if (player.sanity <= 0) {
    gameRunning = false;
    document.getElementById('gameover-screen').classList.remove('hidden');
  }
  updateHUD(player, getZoneName());
  updatePrompt();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!player) return;

  // ===== DEBUG: mapa inteiro + cores =====
  if (debugCollision) {
    const dw = currentFloor === 2 ? MAP2_W : MAP_W;
    const dh = currentFloor === 2 ? MAP2_H : MAP_H;
    const scale = Math.min(canvas.width / dw, canvas.height / dh);
    const ox = (canvas.width - dw * scale) / 2;
    const oy = (canvas.height - dh * scale) / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    if (currentFloor === 2 && mapImg2 && mapImg2.complete) {
      ctx.drawImage(mapImg2, 0, 0, MAP2_W, MAP2_H);
    } else if (mapImg.complete && mapImg.naturalWidth > 0) {
      ctx.drawImage(mapImg, 0, 0, MAP_W, MAP_H);
    }

    // mapa de colisão do andar atual
    if (currentFloor === 2 && coll2Ready && collCanvas2) {
      ctx.globalAlpha = 0.55;
      ctx.drawImage(collCanvas2, 0, 0, MAP2_W, MAP2_H);
      ctx.globalAlpha = 1;
    } else if (collReady && collCanvas) {
      ctx.globalAlpha = 0.55;
      ctx.drawImage(collCanvas, 0, 0, MAP_W, MAP_H);
      ctx.globalAlpha = 1;
    }
    // entidades do andar atual
    if (currentFloor === 2) {
      ctx.fillStyle = 'rgba(0,255,80,0.9)';
      for (const it of floor2Items) {
        if (it.taken) continue;
        ctx.beginPath(); ctx.arc(it.x, it.y, 8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,0,180,0.9)';
      for (const n of floor2Notes) ctx.fillRect(n.x - 8, n.y - 6, 16, 12);
      ctx.fillStyle = 'rgba(0,2,180,0.85)';
      for (const w of floor2Windows) ctx.fillRect(w.x - 10, w.y - 10, 20, 20);
      if (typeof FLOOR2_EXIT_F1 !== 'undefined') {
        ctx.fillStyle = 'rgba(239,136,190,0.9)';
        ctx.beginPath(); ctx.arc(FLOOR2_EXIT_F1.x, FLOOR2_EXIT_F1.y, 20, 0, Math.PI*2); ctx.fill();
      }
      if (typeof FLOOR2_BOSS_DOOR !== 'undefined') {
        ctx.fillStyle = 'rgba(117,22,63,0.95)';
        ctx.fillRect(FLOOR2_BOSS_DOOR.x - 15, FLOOR2_BOSS_DOOR.y - 20, 30, 40);
      }
    } else {
      ctx.fillStyle = 'rgba(0,255,80,0.9)';
      for (const it of items) {
        if (it.taken || it.hidden) continue;
        ctx.beginPath(); ctx.arc(it.x, it.y, 8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,0,180,0.9)';
      for (const n of storyNotes) ctx.fillRect(n.x - 8, n.y - 6, 16, 12);
    }
    // inimigos
    ctx.fillStyle = 'rgba(255,80,80,0.85)';
    for (const e of enemies) {
      if (!e.alive) continue;
      ctx.beginPath(); ctx.arc(e.x, e.y, 10, 0, Math.PI * 2); ctx.fill();
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
  const z = introActive ? introZoom : ZOOM;
  const viewW = canvas.width / z;
  const viewH = canvas.height / z;
  let camX = player.x - viewW / 2;
  let camY = player.y - viewH / 2;
  const worldW = currentFloor === 2 ? MAP2_W : MAP_W;
  const worldH = currentFloor === 2 ? MAP2_H : MAP_H;
  camX = Math.max(0, Math.min(worldW - viewW, camX));
  camY = Math.max(0, Math.min(worldH - viewH, camY));
  const screenPX = (player.x - camX) * z;
  const screenPY = (player.y - camY) * z;
  const radius = player.vision * z;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  // Visão CIRCULAR com oclusão por paredes (raycast)
  const rays = 96;
  const px = player.x, py = player.y + (player.footOffset || 0) * 0.35;
  ctx.beginPath();
  ctx.moveTo(screenPX, screenPY);
  for (let i = 0; i <= rays; i++) {
    const ang = (i / rays) * Math.PI * 2;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    let dist = radius / z; // em coords de mundo
    // marcha de raios até bater em parede
    const step = 6;
    let hit = dist;
    for (let d = step; d <= dist; d += step) {
      const wx = px + cos * d;
      const wy = py + sin * d;
      if (typeof isSolid === 'function' && isSolid(wx, wy)) {
        hit = d;
        break;
      }
    }
    const sx = (px + cos * hit - camX) * z;
    const sy = (py + sin * hit - camY) * z;
    ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.clip();
  ctx.save();
  ctx.scale(z, z);
  ctx.translate(-camX, -camY);
  if (currentFloor === 2 && mapImg2 && mapImg2.complete) {
    ctx.drawImage(mapImg2, 0, 0, MAP2_W, MAP2_H);
  } else if (mapImg.complete && mapImg.naturalWidth > 0) {
    ctx.drawImage(mapImg, 0, 0, MAP_W, MAP_H);
  }

  // 2º andar: janelas + itens
  if (currentFloor === 2) {
    for (const w of floor2Windows) {
      const img = w.open ? windowOpenImg : windowClosedImg;
      if (img && img.complete && img.naturalWidth > 0) {
        const s = 0.9;
        const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
        ctx.drawImage(img, w.x - iw/2, w.y - ih/2, iw, ih);
      } else {
        ctx.fillStyle = w.open ? '#4af' : '#224';
        ctx.fillRect(w.x - 16, w.y - 16, 32, 32);
      }
      if (w.open) {
        ctx.strokeStyle = 'rgba(100,200,255,0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x - 18, w.y - 18, 36, 36);
      }
    }
    for (const item of floor2Items) {
      if (item.taken) continue;
      const pulse = 1 + Math.sin(frame * 0.12) * 0.1;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 8 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#40e060';
      ctx.fill();
    }
    for (const n of floor2Notes) {
      if (cartaImg && cartaImg.complete) {
        const s = n.read ? 0.6 : 0.8;
        ctx.globalAlpha = n.read ? 0.5 : 1;
        ctx.drawImage(cartaImg, n.x - 14*s, n.y - 14*s, 28*s, 28*s);
        ctx.globalAlpha = 1;
      }
    }
  }

  // caixas empurráveis (só térreo)
  if (currentFloor === 1) for (const box of (pushables || [])) {
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(box.x - 18, box.y - 18, 36, 36);
    ctx.strokeStyle = '#5a4010';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x - 18, box.y - 18, 36, 36);
    if (!box.pushed) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText('E', box.x - 4, box.y + 4);
    }
  }

  if (currentFloor === 1) for (const item of items) {
    if (item.taken || item.hidden) continue;
    const pulse = 1 + Math.sin(frame * 0.12) * 0.1;
    // carta usa sprite pixel
    if ((item.type === 'carta_2andar' || (item.type || '').startsWith('carta')) && cartaImg && cartaImg.complete) {
      const bob = Math.sin(frame * 0.1) * 2;
      const s = 0.85 + pulse * 0.08;
      const w = 32 * s, h = 32 * s;
      ctx.drawImage(cartaImg, item.x - w/2, item.y - h/2 + bob, w, h);
      continue;
    }
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
    const icons = { cafe: '☕', faca: '🔪', lanterna: '🔦', chave: '🔑', chave_esq: '🔑', chave_dir: '🔑', chave_dir2: '🔑', chave_beco: '🔑', carta_2andar: '📜' };
    ctx.fillText(icons[item.type] || '?', item.x, item.y + 1);
  }

  if (currentFloor === 1) for (const n of storyNotes) {
    if (cartaImg && cartaImg.complete && cartaImg.naturalWidth > 0) {
      const s = n.read ? 0.65 : 0.85;
      const bob = Math.sin(frame * 0.08 + n.x * 0.01) * 2;
      const w = 28 * s, h = 28 * s;
      ctx.globalAlpha = n.read ? 0.5 : 1;
      ctx.drawImage(cartaImg, n.x - w/2, n.y - h/2 + bob, w, h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = n.read ? '#8060a0' : '#ff40c0';
      ctx.fillRect(n.x - 7, n.y - 5, 14, 10);
    }
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

  // portas: sem overlay azul na tela (só no mapa de colisão)

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
  ctx.scale(z, z);
  ctx.translate(-camX, -camY);
  player.drawWorld(ctx);
  ctx.restore();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
document.getElementById('btn-start').addEventListener('click', () => {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  initGame();
});
document.getElementById('btn-restart').addEventListener('click', () => {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  initGame();
});
const btnCont = document.getElementById('btn-continue');
if (btnCont) {
  if (hasSave()) btnCont.classList.remove('hidden');
  else btnCont.classList.add('hidden');
  btnCont.addEventListener('click', () => {
    if (!loadGame()) initGame();
  });
}
// atualiza botão continuar ao voltar pro menu
window.addEventListener('focus', () => {
  const b = document.getElementById('btn-continue');
  if (b) b.classList.toggle('hidden', !hasSave());
});
loop();

document.getElementById('btn-skip-intro')?.addEventListener('click', skipIntro);
