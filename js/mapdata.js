// ========== MAPA REAL DA MANSÃO (baseado na imagem 1324x1188) ==========

const MAP_W = 1324;
const MAP_H = 1188;

// Colisões: retângulos sólidos (paredes + void preto)
// Coordenadas aproximadas fielmente ao layout da imagem
const WALLS = [
  // === VOID / FORA DO MAPA (preto) ===
  // esquerda inferior void
  { x: 0, y: 780, w: 400, h: 408 },
  // direita inferior void
  { x: 920, y: 780, w: 404, h: 408 },
  // laterais externas
  { x: -40, y: 0, w: 40, h: 1188 },
  { x: 1324, y: 0, w: 40, h: 1188 },
  { x: 0, y: -40, w: 1324, h: 40 },
  { x: 0, y: 1188, w: 1324, h: 40 },

  // === PAREDES INTERNAS / ESTRUTURA ===
  // bloco superior esquerdo (entre quartos e hall)
  { x: 270, y: 0, w: 28, h: 260 },
  // parede horizontal topo-esq
  { x: 0, y: 255, w: 280, h: 22 },

  // parede entre quarto mid-esq e hall
  { x: 270, y: 280, w: 28, h: 240 },
  // horizontal mid
  { x: 0, y: 500, w: 290, h: 22 },

  // parede quarto inferior esquerdo
  { x: 290, y: 520, w: 28, h: 260 },
  { x: 0, y: 760, w: 310, h: 22 },

  // --- centro / hall ---
  // parede esquerda do hall (parcial, com portas)
  { x: 300, y: 0, w: 20, h: 120 },
  { x: 300, y: 200, w: 20, h: 80 },

  // parede direita do hall superior
  { x: 1000, y: 0, w: 24, h: 120 },
  { x: 1000, y: 200, w: 24, h: 100 },

  // quartos direita - paredes
  { x: 1000, y: 255, w: 324, h: 20 },
  { x: 1000, y: 280, w: 22, h: 220 },
  { x: 1000, y: 500, w: 324, h: 20 },
  { x: 1000, y: 520, w: 22, h: 250 },
  { x: 1000, y: 760, w: 324, h: 22 },

  // divisória interna direita (entre os 3 quartos)
  { x: 1160, y: 0, w: 18, h: 260 },
  { x: 1160, y: 280, w: 18, h: 220 },

  // beco (corredor estreito)
  { x: 400, y: 780, w: 180, h: 18 },   // topo esq beco
  { x: 740, y: 780, w: 180, h: 18 },   // topo dir beco
  { x: 400, y: 780, w: 22, h: 150 },   // esq beco
  { x: 740, y: 780, w: 22, h: 150 },   // dir beco

  // bar - paredes externas
  { x: 400, y: 920, w: 22, h: 268 },
  { x: 900, y: 920, w: 22, h: 268 },
  { x: 400, y: 1165, w: 522, h: 25 },
  // entrada do bar (paredes laterais do corredor)
  { x: 560, y: 900, w: 20, h: 30 },
  { x: 740, y: 900, w: 20, h: 30 },
];

// Zonas de porta aberta (buracos nas paredes onde o player pode passar)
// Usadas só como referência visual / spawn de labels
const DOORWAYS = [
  { x: 290, y: 140, w: 40, h: 50, label: 'quarto' },
  { x: 290, y: 340, w: 40, h: 50, label: 'quarto' },
  { x: 290, y: 600, w: 40, h: 50, label: 'quarto' },
  { x: 980, y: 140, w: 40, h: 50, label: 'quarto' },
  { x: 980, y: 340, w: 40, h: 50, label: 'quarto' },
  { x: 980, y: 600, w: 40, h: 50, label: 'quarto' },
  { x: 580, y: 770, w: 160, h: 30, label: 'beco' },
  { x: 580, y: 910, w: 160, h: 30, label: 'bar' },
];

// Itens no mapa (coordenadas do mundo)
const MAP_ITEMS = [
  { x: 140, y: 160, type: 'cafe', taken: false },
  { x: 180, y: 400, type: 'faca', taken: false },
  { x: 120, y: 640, type: 'chave', taken: false },
  { x: 1180, y: 150, type: 'lanterna', taken: false },
  { x: 1100, y: 650, type: 'cafe', taken: false },
];

// Objetos interativos
const MAP_OBJECTS = [
  // fogueira no hall central (perto do tapete)
  { x: 660, y: 520, type: 'fogueira', r: 40 },
  // janelas
  { x: 80, y: 80, type: 'janela', open: false, r: 30 },
  { x: 80, y: 340, type: 'janela', open: false, r: 30 },
  { x: 1240, y: 80, type: 'janela', open: false, r: 30 },
  { x: 1240, y: 400, type: 'janela', open: false, r: 30 },
  // baú trancado (quarto superior direito)
  { x: 1220, y: 180, type: 'bau', locked: true, r: 32 },
  // nota / puzzle no bar
  { x: 660, y: 1050, type: 'nota', r: 28 },
  // alavanca / puzzle (quarto mid esquerdo)
  { x: 100, y: 420, type: 'alavanca', on: false, r: 28 },
  // porta trancada do beco (precisa chave ou alavanca)
  { x: 660, y: 800, type: 'porta_trancada', locked: true, r: 36 },
];

// Inimigos (posições no mapa)
const MAP_ENEMIES = [
  { x: 160, y: 200, type: 'fantasma' },
  { x: 150, y: 450, type: 'vulto' },
  { x: 200, y: 680, type: 'fantasma' },
  { x: 1100, y: 180, type: 'aranha' },
  { x: 1150, y: 400, type: 'vulto' },
  { x: 1120, y: 620, type: 'fantasma' },
  { x: 660, y: 400, type: 'vulto' },
  { x: 700, y: 1080, type: 'elite' },
];

// Áreas nomeadas (para HUD)
const ZONES = [
  { name: 'Quarto', x: 0, y: 0, w: 290, h: 270 },
  { name: 'Quarto', x: 0, y: 270, w: 290, h: 250 },
  { name: 'Quarto', x: 0, y: 520, w: 310, h: 260 },
  { name: 'Escadas', x: 300, y: 0, w: 700, h: 280 },
  { name: 'Mansão', x: 300, y: 280, w: 700, h: 500 },
  { name: 'Quarto', x: 1000, y: 0, w: 324, h: 270 },
  { name: 'Quarto', x: 1000, y: 270, w: 324, h: 250 },
  { name: 'Quarto', x: 1000, y: 520, w: 324, h: 260 },
  { name: 'Beco', x: 420, y: 780, w: 320, h: 140 },
  { name: 'Bar', x: 420, y: 920, w: 500, h: 268 },
];
