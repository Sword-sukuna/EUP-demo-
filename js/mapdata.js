// ========== MAPA 2176x1632 (mapa corrigido do designer) ==========
const MAP_W = 2176;
const MAP_H = 1632;

// amarelo objetos — posições aproximadas (colisão principal vem do collision-map.png)
const OBJECT_SOLIDS = [];

// portas azuis (lógica de tranca; colisão visual no mapa de cores)
const DOORS = [
  { id: 'beco', x: 1050, y: 1280, w: 160, h: 40, locked: true, label: 'Beco', needs: 'alavanca' },
  { id: 'topo', x: 1050, y: 10, w: 80, h: 30, locked: true, label: 'Porta' },
];

// verdes — itens
const MAP_ITEMS = [
  { x: 240, y: 216, type: 'cafe', taken: false },
  { x: 189, y: 553, type: 'faca', taken: false },
  { x: 401, y: 927, type: 'chave', taken: false },
  { x: 1768, y: 184, type: 'lanterna', taken: false },
  { x: 1833, y: 595, type: 'cafe', taken: false },
  { x: 2015, y: 933, type: 'chave', taken: false },
];

// brancos — interações
const INTERACTABLES = [
  { x: 1100, y: 900, type: 'fogueira', r: 45, label: 'Fogueira' },
  { x: 200, y: 550, type: 'alavanca', r: 35, label: 'Alavanca', on: false },
  { x: 1900, y: 200, type: 'bau', r: 35, label: 'Baú', locked: true },
  { x: 150, y: 150, type: 'janela', r: 30, label: 'Janela', open: false },
  { x: 2000, y: 150, type: 'janela', r: 30, label: 'Janela', open: false },
];

// magenta — cartas
const STORY_NOTES = [
  { x: 400, y: 500, id: 'n1', text: 'Carta: "A alavanca no oeste abre o beco..."', read: false },
  { x: 1800, y: 600, id: 'n2', text: 'Carta: "A chave está nos quartos de baixo."', read: false },
  { x: 1100, y: 1400, id: 'n3', text: 'Carta: "O bar era nosso último encontro."', read: false },
  { x: 300, y: 250, id: 'n4', text: 'Carta: "Não abra as janelas. A sanidade escorre pelo frio."', read: false },
];

const STAIRS = [
  { x: 850, y: 520, w: 90, h: 50, label: 'Escadas (2º andar)', locked: true },
  { x: 1230, y: 520, w: 90, h: 50, label: 'Escadas (2º andar)', locked: true },
];

const MAP_ENEMIES = [
  { x: 300, y: 300, type: 'fantasma' },
  { x: 280, y: 700, type: 'vulto' },
  { x: 350, y: 1000, type: 'fantasma' },
  { x: 1800, y: 300, type: 'aranha' },
  { x: 1850, y: 700, type: 'vulto' },
  { x: 1800, y: 1000, type: 'fantasma' },
  { x: 1100, y: 600, type: 'vulto' },
  { x: 1200, y: 1450, type: 'elite' },
];

const ZONES = [
  { name: 'Quarto', x: 0, y: 0, w: 500, h: 400 },
  { name: 'Quarto', x: 0, y: 400, w: 500, h: 350 },
  { name: 'Quarto', x: 0, y: 750, w: 520, h: 400 },
  { name: 'Escadas', x: 500, y: 0, w: 1100, h: 450 },
  { name: 'Mansão', x: 500, y: 450, w: 1100, h: 750 },
  { name: 'Quarto', x: 1600, y: 0, w: 576, h: 400 },
  { name: 'Quarto', x: 1600, y: 400, w: 576, h: 350 },
  { name: 'Quarto', x: 1600, y: 750, w: 576, h: 400 },
  { name: 'Beco', x: 900, y: 1200, w: 400, h: 150 },
  { name: 'Bar', x: 700, y: 1350, w: 700, h: 280 },
];

const MAP_OBJECTS = INTERACTABLES;


// comentários do personagem (estante, cama, etc.)
const FLAVOR_LINES = [
  "Essa estante parece pronta pra cair... melhor não encostar.",
  "Móveis cobertos de poeira. Ninguém mora aqui há tempos.",
  "Uma cama desfeita. Como se alguém tivesse saído correndo.",
  "O cheiro de mofo sobe das tábuas.",
  "Retratos virados contra a parede. Alguém não queria olhar.",
  "Uma gaveta aberta... vazia.",
  "Marcas de unha na madeira. Desespero.",
  "Esse relógio parou em 3:17.",
  "Uma xícara rachada ainda com borra de café seco.",
  "Não deveria estar aqui.",
];

const DOOR_FLAVOR = {
  locked: "Trancada. Não abre por enquanto.",
  open: "A porta range, mas está livre.",
  beco: "O beco. Preciso da alavanca.",
  topo: "Porta pesada. Leva a outro lugar... talvez depois.",
};
