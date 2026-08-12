// ========== MAPA 2176x1632 — cores do designer ==========
const MAP_W = 2176;
const MAP_H = 1632;

const OBJECT_SOLIDS = [];

// Portas AZUIS trancadas — cada uma exige chave específica
const DOORS = [
  { id: 'porta_esq',   x: 593,  y: 503, w: 8,   h: 84,  locked: true, key: 'chave_esq',   label: 'Porta do corredor oeste' },
  { id: 'porta_dir_s', x: 1778, y: 362, w: 100, h: 8,   locked: true, key: 'chave_dir',   label: 'Porta do corredor leste' },
  { id: 'porta_dir_i', x: 1666, y: 834, w: 21,  h: 79,  locked: true, key: 'chave_dir2',  label: 'Porta inferior leste' },
  { id: 'porta_beco',  x: 1064, y: 1318,w: 138, h: 34,  locked: true, key: 'chave_beco',  label: 'Porta do beco' },
];

// Portas MARRONS (livres) — só flavor
const DOORS_FREE = [
  { x: 651,  y: 400, label: 'Passagem' },
  { x: 1608, y: 398, label: 'Passagem' },
  { x: 695,  y: 687, label: 'Passagem' },
  { x: 1546, y: 701, label: 'Passagem' },
  { x: 585,  y: 883, label: 'Passagem' },
];

// Itens VERDES
const MAP_ITEMS = [
  { x: 253,  y: 224, type: 'cafe',        taken: false },
  { x: 1779, y: 179, type: 'lanterna',    taken: false },
  { x: 187,  y: 563, type: 'chave_esq',   taken: false },
  { x: 1858, y: 609, type: 'chave_dir',   taken: false },
  { x: 411,  y: 944, type: 'chave_beco',  taken: false },
  { x: 1996, y: 917, type: 'chave_dir2',  taken: false },
  { x: 253,  y: 224, type: 'faca',        taken: false }, // extra near cafe - skip duplicate
];
// fix: separate faca
MAP_ITEMS.length = 0;
MAP_ITEMS.push(
  { x: 253,  y: 224, type: 'cafe',       taken: false },
  { x: 1779, y: 179, type: 'lanterna',   taken: false },
  { x: 187,  y: 563, type: 'chave_esq',  taken: false },
  { x: 1858, y: 609, type: 'chave_dir',  taken: false },
  { x: 411,  y: 944, type: 'chave_beco', taken: false },
  { x: 1996, y: 917, type: 'chave_dir2', taken: false },
  { x: 1800, y: 600, type: 'faca',       taken: false }
);

// Interações BRANCAS — fala específica por posição
const INTERACTABLES = [
  // fogueira (cor #880015)
  { x: 302, y: 1033, type: 'fogueira', r: 50, label: 'Fogueira' },

  // quartos esq
  { x: 362, y: 208, type: 'flavor', r: 55, text: 'Uma cama desfeita. Como se alguém tivesse saído correndo.' },
  { x: 311, y: 469, type: 'flavor', r: 50, text: 'Estante coberta de poeira. Os livros estão embolorados.' },
  { x: 280, y: 774, type: 'flavor', r: 50, text: 'Uma escrivaninha. A tinta secou há muito tempo.' },
  { x: 485, y: 774, type: 'flavor', r: 50, text: 'Gavetas abertas... vazias.' },
  { x: 209, y: 932, type: 'flavor', r: 50, text: 'Roupas jogadas no chão. Cheiro de mofo.' },

  // hall / centro
  { x: 904,  y: 763, type: 'flavor', r: 55, text: 'Um sofá antigo. As molas gritam se você sentar.' },
  { x: 1344, y: 770, type: 'flavor', r: 55, text: 'Retratos virados contra a parede. Alguém não queria olhar.' },
  { x: 711,  y: 151, type: 'flavor', r: 40, text: 'Um vaso rachado. Terra seca.' },
  { x: 896,  y: 216, type: 'flavor', r: 40, text: 'O relógio parou em 3:17.' },
  { x: 1533, y: 125, type: 'flavor', r: 45, text: 'Cortinas pesadas. A luz quase não entra.' },

  // quartos dir
  { x: 1928, y: 176, type: 'flavor', r: 55, text: 'Cama de casal. Só um lado foi usado.' },
  { x: 2005, y: 564, type: 'flavor', r: 55, text: 'Espelho rachado. Seu reflexo sai torto.' },
  { x: 1795, y: 785, type: 'flavor', r: 55, text: 'Uma cômoda. Todas as gavetas emperradas.' },
  { x: 2087, y: 896, type: 'flavor', r: 45, text: 'Janela trancada por dentro.' },
  { x: 2045, y: 1067, type: 'flavor', r: 40, text: 'Caixas empilhadas. Nada dentro.' },

  // bar
  { x: 1127, y: 1498, type: 'flavor', r: 60, text: 'O balcão do bar. Ainda tem copos sujos.' },
  { x: 1002, y: 1402, type: 'flavor', r: 40, text: 'Banquinhos altos. Um está quebrado.' },
  { x: 1265, y: 1405, type: 'flavor', r: 40, text: 'Prateleira de garrafas. Todas vazias.' },
  { x: 1296, y: 1570, type: 'flavor', r: 40, text: 'Uma mesa no canto. Cinzeiro cheio.' },

  // alavanca / bau (lógica)
  { x: 200, y: 550, type: 'alavanca', r: 35, label: 'Alavanca', on: false },
  { x: 1928, y: 200, type: 'bau', r: 40, label: 'Baú', locked: true },
];

// Cartas MAGENTA
const STORY_NOTES = [
  { x: 587,  y: 222, id: 'n1', text: 'Carta rasgada:\n\n"A alavanca no quarto oeste...\nela abre caminhos que deveriam permanecer fechados."', read: false },
  { x: 1137, y: 218, id: 'n2', text: 'Bilhete:\n\n"Não confie no que as paredes sussurram.\nSanidade é tudo o que nos resta."', read: false },
  { x: 2065, y: 194, id: 'n3', text: 'Página de diário:\n\n"Ela ainda anda pelos corredores.\nEu ouço os passos toda noite."', read: false },
  { x: 1739, y: 558, id: 'n4', text: 'Nota:\n\n"Chave do beco — quarto de baixo, lado esquerdo.\nNão abra as janelas."', read: false },
  { x: 1139, y: 1561, id: 'n5', text: 'Recado no bar:\n\n"Foi aqui que nos vimos pela última vez.\nO café ainda estava quente."', read: false },
];

const STAIRS = [
  { x: 833, y: 484, w: 120, h: 160, label: 'Escadas (2º andar)', locked: true },
  { x: 1326, y: 500, w: 110, h: 150, label: 'Escadas (2º andar)', locked: true },
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

const KEY_LABELS = {
  chave_esq: 'Chave Oeste',
  chave_dir: 'Chave Leste',
  chave_dir2: 'Chave Leste II',
  chave_beco: 'Chave do Beco',
  cafe: 'Café',
  faca: 'Faca',
  lanterna: 'Lanterna',
};
