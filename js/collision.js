// Colisão por cores — mapa do designer
const COLOR = {
  WALK: 'walk',
  WALL: 'wall',
  OBJECT: 'object',
  DOOR: 'door',       // azul = trancada (chave)
  DOOR_FREE: 'door_free', // marrom = livre
  ITEM: 'item',
  INTERACT: 'interact',
  NOTE: 'note',
  STAIRS: 'stairs',
  EXIT_STREET: 'exit_street',
  EXIT_PATIO: 'exit_patio',
  FOGUEIRA: 'fogueira',
};

let collCanvas = null, collCtx = null, collReady = false;
let unlockedDoors = []; // {x,y,r, id?}

function initCollisionMap(img) {
  collCanvas = document.createElement('canvas');
  collCanvas.width = MAP_W;
  collCanvas.height = MAP_H;
  collCtx = collCanvas.getContext('2d', { willReadFrequently: true });
  collCtx.drawImage(img, 0, 0, MAP_W, MAP_H);
  collReady = true;
  unlockedDoors = [];
}

function sampleColor(wx, wy) {
  if (!collReady) return COLOR.WALK;
  const x = Math.max(0, Math.min(MAP_W - 1, Math.floor(wx)));
  const y = Math.max(0, Math.min(MAP_H - 1, Math.floor(wy)));
  const p = collCtx.getImageData(x, y, 1, 1).data;
  const r = p[0], g = p[1], b = p[2];

  if (r < 25 && g < 25 && b < 25) return COLOR.WALK;

  // fogueira #880015 (antes do vermelho genérico)
  if (r > 100 && r < 180 && g < 40 && b < 40) return COLOR.FOGUEIRA;

  // parede vermelha
  if (r > 180 && g < 100 && b < 100) return COLOR.WALL;

  // objeto amarelo
  if (r > 200 && g > 150 && b < 90) return COLOR.OBJECT;

  // porta trancada azul
  if (b > 140 && r < 100 && g < 160) return COLOR.DOOR;

  // item verde
  if (g > 140 && r < 120 && b < 120) return COLOR.ITEM;

  // interação branca
  if (r > 200 && g > 200 && b > 200) return COLOR.INTERACT;

  // nota magenta
  if (r > 180 && b > 120 && g < 120) return COLOR.NOTE;

  // escadas roxo
  if (r > 70 && b > 120 && g < 110 && b > g) return COLOR.STAIRS;

  // saída rua laranja
  if (r > 200 && g > 100 && g < 180 && b < 80) return COLOR.EXIT_STREET;

  // saída pátio ciano
  if (g > 150 && b > 150 && r < 100) return COLOR.EXIT_PATIO;

  // porta livre marrom
  if (r > 120 && r < 200 && g > 70 && g < 140 && b < 100) return COLOR.DOOR_FREE;

  return COLOR.WALK;
}

function isDoorUnlocked(wx, wy) {
  for (const d of unlockedDoors) {
    if (Math.hypot(wx - d.x, wy - d.y) < d.r) return true;
  }
  return false;
}

function unlockDoorAt(wx, wy, id) {
  unlockedDoors.push({ x: wx, y: wy, r: 100, id: id || null });
}

function isSolid(wx, wy) {
  const c = sampleColor(wx, wy);
  if (c === COLOR.WALL || c === COLOR.OBJECT) return true;
  if (c === COLOR.STAIRS) return true;
  if (c === COLOR.DOOR) return !isDoorUnlocked(wx, wy);
  // door_free, fogueira, interact, etc = andável
  return false;
}

function getTileType(wx, wy) {
  return sampleColor(wx, wy);
}
