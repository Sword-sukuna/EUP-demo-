// ========== MAPA 2176x1632 — progressão em cadeia ==========
const MAP_W = 2176;
const MAP_H = 1632;
// 2º andar (com colisão + janelas)
const MAP2_W = 2176;
const MAP2_H = 1624;

const OBJECT_SOLIDS = [];

// Portas AZUIS — cadeia de chaves
// 1) chave_beco (puzzle no bar) → entra na mansão
// 2) chave_esq (hall) → quarto oeste
// 3) chave_dir (quarto oeste) → quarto leste superior
// 4) chave_dir2 (quarto leste) → quarto leste inferior (elite)
const DOORS = [
  { id: 'porta_beco',  x: 1064, y: 1318, w: 138, h: 34, locked: true, key: 'chave_beco', label: 'Porta do beco (Bar → Mansão)' },
  { id: 'porta_esq',   x: 593,  y: 503,  w: 8,   h: 84, locked: true, key: 'chave_esq',  label: 'Porta do corredor oeste' },
  { id: 'porta_dir_s', x: 1778, y: 362,  w: 100, h: 8,  locked: true, key: 'chave_dir',  label: 'Porta do corredor leste' },
  { id: 'porta_dir_i', x: 1666, y: 834,  w: 21,  h: 79, locked: true, key: 'chave_dir2', label: 'Porta do quarto do Elite' },
];

const DOORS_FREE = [
  { x: 651,  y: 400, label: 'Passagem' },
  { x: 1608, y: 398, label: 'Passagem' },
  { x: 695,  y: 687, label: 'Passagem' },
  { x: 1546, y: 701, label: 'Passagem' },
  { x: 585,  y: 883, label: 'Passagem' },
];

// Itens — ordem de coleta (cadeia)
const MAP_ITEMS = [
  // BAR: chave só aparece depois do puzzle (hidden até empurrar o baú)
  { x: 1180, y: 1520, type: 'chave_beco', taken: false, hidden: true, id: 'key_bar' },

  // Mansão — hall (acessível após abrir beco)
  { x: 900,  y: 900,  type: 'chave_esq', taken: false },
  { x: 1100, y: 700,  type: 'lanterna',  taken: false }, // única no jogo (1º)
  { x: 1300, y: 900,  type: 'cafe',      taken: false },
  { x: 1000, y: 1050, type: 'faca',      taken: false }, // única no jogo (1º)

  // Quarto oeste (após chave_esq) → chave_dir
  { x: 250,  y: 500,  type: 'chave_dir', taken: false },
  { x: 280,  y: 250,  type: 'cafe',      taken: false },

  // Quarto leste superior (após chave_dir) → chave_dir2
  { x: 1900, y: 250,  type: 'chave_dir2', taken: false },
  { x: 1850, y: 550,  type: 'cafe',       taken: false },

  // Quarto leste inferior (elite) — extras
  { x: 1950, y: 950,  type: 'cafe',       taken: false },
];

// Caixa empurrável no bar (puzzle)
const PUSHABLES = [
  {
    id: 'caixa_bar',
    x: 1180, y: 1480,
    w: 36, h: 36,
    pushed: false,
    // ao empurrar para a esquerda, revela a chave
    revealItemId: 'key_bar',
    label: 'Caixa pesada',
  },
];

const INTERACTABLES = [
  // fogueira — quarto oeste: save + baú de itens
  { x: 280, y: 900, type: 'fogueira', r: 55, label: 'Fogueira' },

  // quartos esq
  { x: 362, y: 208, type: 'flavor', r: 55, text: 'Uma cama desfeita. Como se alguém tivesse saído correndo.' },
  { x: 311, y: 469, type: 'flavor', r: 50, text: 'Estante coberta de poeira. Os livros estão embolorados.' },
  { x: 280, y: 774, type: 'flavor', r: 50, text: 'Uma escrivaninha. A tinta secou há muito tempo.' },
  { x: 485, y: 774, type: 'flavor', r: 50, text: 'Gavetas abertas... vazias.' },
  { x: 209, y: 932, type: 'flavor', r: 50, text: 'Roupas jogadas no chão. Cheiro de mofo.' },

  // hall
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
  { x: 1296, y: 1570, type: 'flavor', r: 40, text: 'Uma mesa no canto. Cinzeiro cheio. Algo brilha atrás da caixa...' },

  // baú no quarto elite (opcional)
  { x: 2000, y: 900, type: 'bau', r: 40, label: 'Baú', locked: true },
];

const STORY_NOTES = [
  { x: 1139, y: 1561, id: 'n5', text: 'Recado no bar:\n\n"Empurre a caixa atrás do balcão.\nA chave da mansão está escondida.\n\n— Foi aqui que nos vimos pela última vez."', read: false },
  { x: 1100, y: 1100, id: 'n0', text: 'Mapa rasgado:\n\nBAR → BECO → MANSÃO\nOeste → Leste → Quarto do Manequim\nDepois: escadas (2º andar)\n\nAs chaves abrem em ordem. Sem a anterior, a próxima porta não cede."', read: false },
  { x: 900,  y: 850,  id: 'n6', text: 'Bilhete no hall:\n\n"Procure a chave neste hall.\nEla abre o corredor oeste."', read: false },
  { x: 587,  y: 222, id: 'n1', text: 'Carta rasgada:\n\n"As chaves se escondem em cadeia.\nUma porta abre o caminho para a próxima."', read: false },
  { x: 1137, y: 218, id: 'n2', text: 'Bilhete:\n\n"Não confie no que as paredes sussurram.\nSanidade é tudo o que nos resta."', read: false },
  { x: 2065, y: 194, id: 'n3', text: 'Página de diário:\n\n"Ela ainda anda pelos corredores.\nEu ouço os passos toda noite."', read: false },
  { x: 1739, y: 558, id: 'n4', text: 'Nota:\n\n"O manequim guarda o segredo do segundo andar.\nDerrote-o e a carta será sua.\nCom a carta, as escadas respondem."', read: false },
];

const STAIRS = [
  { x: 833,  y: 484, w: 120, h: 160, label: 'Escadas (2º andar)', locked: true },
  { x: 1326, y: 500, w: 110, h: 150, label: 'Escadas (2º andar)', locked: true },
];

// Inimigos mais fortes + mais spawns (sem bar no início — só mansão)
const MAP_ENEMIES = [
  // oeste
  { x: 300,  y: 280,  type: 'fantasma' },
  { x: 350,  y: 520,  type: 'vulto' },
  { x: 280,  y: 750,  type: 'aranha' },
  { x: 400,  y: 950,  type: 'fantasma' },
  // centro
  { x: 900,  y: 550,  type: 'vulto' },
  { x: 1100, y: 650,  type: 'fantasma' },
  { x: 1300, y: 550,  type: 'aranha' },
  { x: 1000, y: 950,  type: 'vulto' },
  { x: 1200, y: 1100, type: 'fantasma' },
  // leste
  { x: 1800, y: 280,  type: 'aranha' },
  { x: 1900, y: 500,  type: 'vulto' },
  { x: 1850, y: 750,  type: 'fantasma' },
  { x: 1950, y: 900,  type: 'aranha' },
  // elite — quarto final (leste inferior)
  { x: 1850, y: 950,  type: 'elite' },
  // beco / transição
  { x: 1100, y: 1250, type: 'vulto' },
  { x: 700,  y: 800,  type: 'aranha' },
  { x: 1500, y: 900,  type: 'fantasma' },
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
  { name: '2º Andar', x: 0, y: 0, w: 2176, h: 1624 },
];

const MAP_OBJECTS = INTERACTABLES;

const KEY_LABELS = {
  chave_esq: 'Chave Oeste',
  chave_dir: 'Chave Leste',
  chave_dir2: 'Chave do Elite',
  chave_beco: 'Chave da Mansão',
  carta_2andar: 'Carta do 2º Andar',
  cafe: 'Café',
  faca: 'Faca',
  lanterna: 'Lanterna',
};

const FLAVOR_LINES = [
  'Nada de especial...',
  'O cheiro de mofo sobe das tábuas.',
  'Não deveria estar aqui.',
];


// ========== 2º ANDAR ==========
// Janelas #00023D — abrem/fecham e drenam sanidade quando abertas
const FLOOR2_WINDOWS = [
  { x: 41,   y: 568,  open: false },
  { x: 57,   y: 992,  open: false },
  { x: 2144, y: 1079, open: false },
  { x: 393,  y: 1559, open: false },
  { x: 1465, y: 1566, open: false },
  { x: 1262, y: 1566, open: false },
  { x: 1129, y: 1572, open: false },
  { x: 234,  y: 1575, open: false },
];

// ===== 2º ANDAR — cadeia como o 1º =====
// Spawn centro. 3 portas azuis + porta boss.
// 1) chave_f2a (corredor) → porta sul (700,1186)
// 2) chave_f2b (após porta sul) → porta leste (1550,690)
// 3) chave_f2c (após porta leste) → porta leste-inferior (1803,1009)
// 4) chave_boss → porta do sótão
const FLOOR2_ITEMS = [
  { x: 1120, y: 950,  type: 'chave_f2a', taken: false },
  { x: 500,  y: 1400, type: 'chave_f2b', taken: false },
  { x: 1900, y: 400,  type: 'chave_f2c', taken: false },
  { x: 1950, y: 1200, type: 'chave_boss', taken: false },
  { x: 1000, y: 1200, type: 'cafe', taken: false },
  { x: 280,  y: 450,  type: 'cafe', taken: false },
  { x: 400,  y: 900,  type: 'cafe', taken: false },
];

const FLOOR2_DOORS = [
  { id: 'f2_porta_s', x: 700,  y: 1186, key: 'chave_f2a', label: 'Porta Sul 2º', locked: true },
  { id: 'f2_porta_l', x: 1550, y: 690,  key: 'chave_f2b', label: 'Porta Leste 2º', locked: true },
  { id: 'f2_porta_li', x: 1803, y: 1009, key: 'chave_f2c', label: 'Porta Leste Inferior', locked: true },
];

// Notas 2º andar
const FLOOR2_NOTES = [
  { x: 1120, y: 800, id: 'f2n0', text: "Mapa do 2º:\n\n1) Chave no corredor\n2) Porta sul → próxima chave\n3) Porta leste → próxima chave\n4) Porta interior → chave do sótão\n5) Porta escura (sótão)\n\nFeche as janelas. O ar gelado drena a sanidade.", read: false },
  { x: 700, y: 400, id: 'f2n1', text: "Diário:\n\n\"O sótão guarda o que não deveria existir.\nA porta escura só abre com a chave certa.\"", read: false },
  { x: 1800, y: 500, id: 'f2n2', text: "Bilhete:\n\n\"As janelas... não as deixe abertas.\nO frio come a mente.\"", read: false },
];

// Porta boss #75163F
const FLOOR2_BOSS_DOOR = { x: 2072, y: 799, w: 40, h: 60, locked: true, key: 'chave_boss', label: 'Porta do Sótão' };

// Saída pro 1º #EF88BE
const FLOOR2_EXIT_F1 = { x: 1129, y: 690, r: 50 };

// Inimigos 2º andar
const MAP_ENEMIES_F2 = [
  { x: 300,  y: 400,  type: 'fantasma' },
  { x: 450,  y: 1300, type: 'vulto' },
  { x: 1100, y: 1100, type: 'aranha' },
  { x: 1700, y: 400,  type: 'fantasma' },
  { x: 1900, y: 1200, type: 'vulto' },
  { x: 900,  y: 500,  type: 'fantasma' },
];

const KEY_LABELS_EXTRA = {
  chave_boss: 'Chave do Sótão',
  chave_f2a: 'Chave 2º — Sul',
  chave_f2b: 'Chave 2º — Leste',
  chave_f2c: 'Chave 2º — Interior',
};
Object.assign(KEY_LABELS, KEY_LABELS_EXTRA);
