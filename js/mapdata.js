// ========== MAPA + ZONAS POR COR (sistema do designer) ==========
// vermelho  = parede (COLL_GRID)
// amarelo   = colisão de objeto
// branco    = interação (falar / coletar)
// azul      = porta desbloqueável
// verde     = item-chave
// roxo      = escadas (futuro 2º andar)
// magenta   = cartas/notas da história

const MAP_W = 1324;
const MAP_H = 1188;

// --- AMARELO: objetos sólidos (móveis) ---
const OBJECT_SOLIDS = [
  // camas
  { x: 70, y: 80, w: 55, h: 40, label: 'cama' },
  { x: 70, y: 330, w: 55, h: 40, label: 'cama' },
  { x: 70, y: 590, w: 55, h: 40, label: 'cama' },
  { x: 1190, y: 80, w: 55, h: 40, label: 'cama' },
  { x: 1190, y: 330, w: 55, h: 40, label: 'cama' },
  { x: 1190, y: 590, w: 55, h: 40, label: 'cama' },
  // mesas / móveis hall
  { x: 400, y: 360, w: 45, h: 35, label: 'mesa' },
  { x: 850, y: 360, w: 45, h: 35, label: 'mesa' },
  { x: 400, y: 620, w: 45, h: 35, label: 'mesa' },
  { x: 850, y: 620, w: 45, h: 35, label: 'mesa' },
  // fogueira
  { x: 640, y: 500, w: 40, h: 35, label: 'fogueira' },
  // balcão do bar
  { x: 500, y: 1000, w: 320, h: 30, label: 'balcao' },
  // mesas bar
  { x: 500, y: 1080, w: 40, h: 30, label: 'mesa' },
  { x: 780, y: 1080, w: 40, h: 30, label: 'mesa' },
];

// --- AZUL: portas desbloqueáveis ---
// locked: true = precisa alavanca/chave
const DOORS = [
  { id: 'q1', x: 275, y: 110, w: 50, h: 80, locked: false, label: 'Quarto' },
  { id: 'q2', x: 275, y: 325, w: 50, h: 80, locked: false, label: 'Quarto' },
  { id: 'q3', x: 285, y: 575, w: 50, h: 80, locked: false, label: 'Quarto' },
  { id: 'q4', x: 980, y: 110, w: 60, h: 80, locked: false, label: 'Quarto' },
  { id: 'q5', x: 980, y: 325, w: 60, h: 80, locked: false, label: 'Quarto' },
  { id: 'q6', x: 980, y: 575, w: 60, h: 80, locked: false, label: 'Quarto' },
  { id: 'beco', x: 545, y: 765, w: 180, h: 40, locked: true, label: 'Beco', needs: 'alavanca' },
  { id: 'bar', x: 545, y: 900, w: 180, h: 40, locked: false, label: 'Bar' },
  // portas topo (futuro / decorativas)
  { id: 'topo_l', x: 480, y: 12, w: 50, h: 25, locked: true, label: 'Porta trancada' },
  { id: 'topo_r', x: 760, y: 12, w: 50, h: 25, locked: true, label: 'Porta trancada' },
];

// --- VERDE: itens-chave ---
const MAP_ITEMS = [
  { x: 140, y: 640, type: 'chave', taken: false },      // quarto inferior esq
  { x: 1180, y: 150, type: 'lanterna', taken: false },  // quarto superior dir
  { x: 150, y: 180, type: 'cafe', taken: false },
  { x: 180, y: 400, type: 'faca', taken: false },
  { x: 1100, y: 650, type: 'cafe', taken: false },
  { x: 200, y: 620, type: 'chave', taken: false }, // X verde no desenho
];

// --- BRANCO: interações (E para usar) ---
const INTERACTABLES = [
  { x: 660, y: 520, type: 'fogueira', r: 40, label: 'Fogueira' },
  { x: 100, y: 420, type: 'alavanca', r: 30, label: 'Alavanca', on: false },
  { x: 1220, y: 180, type: 'bau', r: 32, label: 'Baú', locked: true },
  { x: 80, y: 80, type: 'janela', r: 28, label: 'Janela', open: false },
  { x: 80, y: 340, type: 'janela', r: 28, label: 'Janela', open: false },
  { x: 1240, y: 80, type: 'janela', r: 28, label: 'Janela', open: false },
  { x: 1240, y: 400, type: 'janela', r: 28, label: 'Janela', open: false },
];

// --- MAGENTA: cartas / notas da história ---
const STORY_NOTES = [
  { x: 160, y: 360, id: 'nota1', text: 'Carta: "Ele ainda anda pelos corredores... procure a alavanca no oeste."', read: false },
  { x: 1120, y: 380, id: 'nota2', text: 'Carta: "A chave do baú está no quarto de baixo, à esquerda."', read: false },
  { x: 660, y: 1050, id: 'nota3', text: 'Carta: "O bar era o último lugar onde nos vimos. Não confie nas sombras."', read: false },
  { x: 150, y: 150, id: 'nota4', text: 'Carta: "Sanidade é tudo o que nos resta. Não abra as janelas."', read: false },
];

// --- ROXO: escadas (2º andar futuro) ---
const STAIRS = [
  { x: 480, y: 280, w: 80, h: 50, label: 'Escadas (em breve)', locked: true },
  { x: 720, y: 280, w: 80, h: 50, label: 'Escadas (em breve)', locked: true },
];

// inimigos
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

// compat: MAP_OBJECTS usado pelo main antigo
const MAP_OBJECTS = INTERACTABLES;
