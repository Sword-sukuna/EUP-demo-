// Colisão por cores — 1º e 2º andar
const COLOR = {
  WALK: 'walk',
  WALL: 'wall',
  OBJECT: 'object',
  DOOR: 'door',
  DOOR_FREE: 'door_free',
  ITEM: 'item',
  INTERACT: 'interact',
  NOTE: 'note',
  STAIRS: 'stairs',
  EXIT_STREET: 'exit_street',
  EXIT_PATIO: 'exit_patio',
  FOGUEIRA: 'fogueira',
  EXIT_F1: 'exit_f1',       // #EF88BE volta pro 1º
  BOSS_DOOR: 'boss_door',   // #75163F porta boss/sótão
  WINDOW: 'window',         // #00023D janela
};

let collCanvas = null, collCtx = null, collReady = false;
let collCanvas2 = null, collCtx2 = null, coll2Ready = false;
let unlockedDoors = [];

function initCollisionMap(img) {
  collCanvas = document.createElement('canvas');
  collCanvas.width = MAP_W;
  collCanvas.height = MAP_H;
  collCtx = collCanvas.getContext('2d', { willReadFrequently: true });
  collCtx.drawImage(img, 0, 0, MAP_W, MAP_H);
  collReady = true;
  unlockedDoors = [];
}

function initCollisionMap2(img) {
  collCanvas2 = document.createElement('canvas');
  collCanvas2.width = MAP2_W;
  collCanvas2.height = MAP2_H;
  collCtx2 = collCanvas2.getContext('2d', { willReadFrequently: true });
  collCtx2.drawImage(img, 0, 0, MAP2_W, MAP2_H);
  coll2Ready = true;
}

function _sample(ctx, ready, maxW, maxH, wx, wy) {
  if (!ready || !ctx) return COLOR.WALK;
  const x = Math.max(0, Math.min(maxW - 1, Math.floor(wx)));
  const y = Math.max(0, Math.min(maxH - 1, Math.floor(wy)));
  const p = ctx.getImageData(x, y, 1, 1).data;
  const r = p[0], g = p[1], b = p[2];

  if (r < 25 && g < 25 && b < 25) return COLOR.WALK;

  // window #00023D
  if (r < 30 && g < 30 && b > 40 && b < 100) return COLOR.WINDOW;
  // boss #75163F
  if (r > 90 && r < 150 && g < 50 && b > 40 && b < 100) return COLOR.BOSS_DOOR;
  // exit f1 #EF88BE
  if (r > 200 && g > 100 && g < 180 && b > 150) return COLOR.EXIT_F1;
  // fogueira
  if (r > 100 && r < 180 && g < 40 && b < 40) return COLOR.FOGUEIRA;
  // wall
  if (r > 180 && g < 100 && b < 100) return COLOR.WALL;
  // object yellow
  if (r > 200 && g > 150 && b < 90) return COLOR.OBJECT;
  // door locked blue
  if (b > 140 && r < 100 && g < 160) return COLOR.DOOR;
  // item green
  if (g > 140 && r < 120 && b < 120) return COLOR.ITEM;
  // interact white
  if (r > 200 && g > 200 && b > 200) return COLOR.INTERACT;
  // note magenta
  if (r > 180 && b > 120 && g < 120) return COLOR.NOTE;
  // stairs purple
  if (r > 70 && b > 120 && g < 110 && b > g) return COLOR.STAIRS;
  // exit street orange
  if (r > 200 && g > 100 && g < 180 && b < 80) return COLOR.EXIT_STREET;
  // exit patio cyan
  if (g > 150 && b > 150 && r < 100) return COLOR.EXIT_PATIO;
  // door free brown
  if (r > 120 && r < 200 && g > 70 && g < 140 && b < 100) return COLOR.DOOR_FREE;

  return COLOR.WALK;
}

function sampleColor(wx, wy) {
  if (typeof currentFloor !== 'undefined' && currentFloor === 2) {
    return _sample(collCtx2, coll2Ready, MAP2_W, MAP2_H, wx, wy);
  }
  return _sample(collCtx, collReady, MAP_W, MAP_H, wx, wy);
}

function isDoorUnlocked(wx, wy) {
  for (const d of unlockedDoors) {
    if (Math.hypot(wx - d.x, wy - d.y) < d.r) return true;
  }
  return false;
}

function unlockDoorAt(wx, wy, id) {
  unlockedDoors.push({ x: wx, y: wy, r: 100, id: id || null });
  if (typeof AudioSys !== 'undefined') AudioSys.doorUnlock();
}

function isSolid(wx, wy) {
  const c = sampleColor(wx, wy);
  if (c === COLOR.WALL || c === COLOR.OBJECT) return true;
  if (c === COLOR.STAIRS) return true;
  if (c === COLOR.DOOR || c === COLOR.BOSS_DOOR) {
    return !isDoorUnlocked(wx, wy);
  }
  // window, exit_f1, interact, etc = walkable (interaction only)
  return false;
}

function getTileType(wx, wy) {
  return sampleColor(wx, wy);
}


// ========== MAPA DE LUZ (oclusão de visão) ==========
let lightCanvas = null, lightCtx = null, lightReady = false;
let lightCanvas2 = null, lightCtx2 = null, light2Ready = false;

function initLightMap(img) {
  lightCanvas = document.createElement('canvas');
  lightCanvas.width = MAP_W;
  lightCanvas.height = MAP_H;
  lightCtx = lightCanvas.getContext('2d', { willReadFrequently: true });
  lightCtx.drawImage(img, 0, 0, MAP_W, MAP_H);
  lightReady = true;
}

function initLightMap2(img) {
  lightCanvas2 = document.createElement('canvas');
  lightCanvas2.width = MAP2_W;
  lightCanvas2.height = MAP2_H;
  lightCtx2 = lightCanvas2.getContext('2d', { willReadFrequently: true });
  lightCtx2.drawImage(img, 0, 0, MAP2_W, MAP2_H);
  light2Ready = true;
}

/** true = luz NÃO passa (parede no mapa de iluminação) */
function isLightBlocked(wx, wy) {
  let ctx, ready, maxW, maxH;
  if (typeof currentFloor !== 'undefined' && currentFloor === 2) {
    ctx = lightCtx2; ready = light2Ready; maxW = MAP2_W; maxH = MAP2_H;
  } else {
    ctx = lightCtx; ready = lightReady; maxW = MAP_W; maxH = MAP_H;
  }
  if (!ready || !ctx) {
    // fallback: usa colisão sólida
    return typeof isSolid === 'function' ? isSolid(wx, wy) : false;
  }
  const x = Math.max(0, Math.min(maxW - 1, Math.floor(wx)));
  const y = Math.max(0, Math.min(maxH - 1, Math.floor(wy)));
  const p = ctx.getImageData(x, y, 1, 1).data;
  // vermelho no light-map = bloqueia
  return p[0] > 128;
}
