// Colisão por cor — collision-map.png
const COLOR = {
  WALK:'walk', WALL:'wall', OBJECT:'object', DOOR:'door',
  ITEM:'item', INTERACT:'interact', STAIRS:'stairs', NOTE:'note', SCENE:'scene'
};

let collCanvas=null, collCtx=null, collReady=false;
// portas azuis destrancadas (centro x,y + raio)
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

function sampleColor(wx, wy) {
  if (!collReady) return COLOR.WALK;
  const x = Math.max(0, Math.min(MAP_W-1, Math.floor(wx)));
  const y = Math.max(0, Math.min(MAP_H-1, Math.floor(wy)));
  const p = collCtx.getImageData(x, y, 1, 1).data;
  const r=p[0], g=p[1], b=p[2];
  if (r<30 && g<30 && b<30) return COLOR.WALK;
  if (r>150 && g<90 && b<90) return COLOR.WALL;
  if (r>180 && g>140 && b<90) return COLOR.OBJECT;
  if (b>160 && r<120 && g<160) return COLOR.DOOR;
  if (g>150 && r<110 && b<130) return COLOR.ITEM;
  if (r>200 && g>200 && b>200) return COLOR.INTERACT;
  if (r>100 && b>150 && g<110) return COLOR.STAIRS;
  if (r>170 && b>120 && g<110) return COLOR.NOTE;
  if (r>200 && g>100 && g<170 && b<60) return COLOR.SCENE;
  return COLOR.WALK;
}

function isDoorUnlocked(wx, wy) {
  for (const d of unlockedDoors) {
    if (Math.hypot(wx - d.x, wy - d.y) < d.r) return true;
  }
  return false;
}

function unlockDoorAt(wx, wy) {
  unlockedDoors.push({ x: wx, y: wy, r: 80 });
}

function isSolid(wx, wy) {
  const c = sampleColor(wx, wy);
  if (c === COLOR.WALL || c === COLOR.OBJECT) return true;
  if (c === COLOR.STAIRS) return true;
  if (c === COLOR.DOOR) {
    return !isDoorUnlocked(wx, wy); // azul = trancada até usar chave
  }
  return false;
}

function getTileType(wx, wy) {
  return sampleColor(wx, wy);
}
