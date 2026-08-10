// ========== SISTEMA DE SALAS (estilo Binding of Isaac) ==========

const TILE = 40; // tamanho do tile em px

const RoomTypes = {
  HALL: 'hall',
  BEDROOM: 'bedroom',
  STAIRS: 'stairs',
  ALLEY: 'alley',
  BAR: 'bar'
};

// Definição das salas (mapa simplificado da mansão)
const ROOMS = {
  mansao: {
    id: 'mansao',
    name: 'Mansão',
    type: RoomTypes.HALL,
    width: 18,
    height: 12,
    // portas: direção -> sala destino + posição de spawn
    doors: {
      north: { to: 'escadas_n', spawnX: 9, spawnY: 10 },
      south: { to: 'beco', spawnX: 5, spawnY: 1 },
      west:  { to: 'quarto1', spawnX: 10, spawnY: 5 },
      east:  { to: 'quarto2', spawnX: 1, spawnY: 5 }
    },
    // objetos interativos
    objects: [
      { x: 9, y: 6, type: 'fogueira', active: true },
      { x: 3, y: 3, type: 'mesa' },
      { x: 14, y: 3, type: 'mesa' },
      { x: 4, y: 9, type: 'cadeira' },
      { x: 13, y: 9, type: 'cadeira' }
    ],
    // itens no chão
    items: [
      { x: 6, y: 4, type: 'cafe', taken: false },
      { x: 12, y: 8, type: 'faca', taken: false }
    ],
    enemies: []
  },

  quarto1: {
    id: 'quarto1',
    name: 'Quarto',
    type: RoomTypes.BEDROOM,
    width: 12,
    height: 10,
    doors: {
      east: { to: 'mansao', spawnX: 1, spawnY: 5 }
    },
    objects: [
      { x: 3, y: 3, type: 'cama' },
      { x: 8, y: 2, type: 'janela', open: false },
      { x: 2, y: 7, type: 'guarda-roupa' }
    ],
    items: [
      { x: 9, y: 7, type: 'chave', taken: false }
    ],
    enemies: [
      { x: 6, y: 5, type: 'fantasma', hp: 30 }
    ]
  },

  quarto2: {
    id: 'quarto2',
    name: 'Quarto',
    type: RoomTypes.BEDROOM,
    width: 12,
    height: 10,
    doors: {
      west: { to: 'mansao', spawnX: 16, spawnY: 5 }
    },
    objects: [
      { x: 8, y: 3, type: 'cama' },
      { x: 3, y: 2, type: 'janela', open: false },
      { x: 9, y: 7, type: 'mesa' }
    ],
    items: [],
    enemies: [
      { x: 5, y: 6, type: 'vulto', hp: 20 }
    ]
  },

  escadas_n: {
    id: 'escadas_n',
    name: 'Escadas',
    type: RoomTypes.STAIRS,
    width: 10,
    height: 8,
    doors: {
      south: { to: 'mansao', spawnX: 9, spawnY: 1 },
      north: { to: 'quarto3', spawnX: 5, spawnY: 8 }
    },
    objects: [
      { x: 5, y: 3, type: 'escada' }
    ],
    items: [],
    enemies: []
  },

  quarto3: {
    id: 'quarto3',
    name: 'Quarto Superior',
    type: RoomTypes.BEDROOM,
    width: 11,
    height: 9,
    doors: {
      south: { to: 'escadas_n', spawnX: 5, spawnY: 1 }
    },
    objects: [
      { x: 3, y: 3, type: 'cama' },
      { x: 8, y: 2, type: 'janela', open: false },
      { x: 5, y: 6, type: 'bau' }
    ],
    items: [
      { x: 7, y: 5, type: 'lanterna', taken: false }
    ],
    enemies: [
      { x: 4, y: 5, type: 'aranha', hp: 40 },
      { x: 8, y: 6, type: 'fantasma', hp: 25 }
    ]
  },

  beco: {
    id: 'beco',
    name: 'Beco',
    type: RoomTypes.ALLEY,
    width: 8,
    height: 10,
    doors: {
      north: { to: 'mansao', spawnX: 9, spawnY: 10 },
      south: { to: 'bar', spawnX: 6, spawnY: 1 }
    },
    objects: [],
    items: [],
    enemies: [
      { x: 4, y: 5, type: 'vulto', hp: 25 }
    ]
  },

  bar: {
    id: 'bar',
    name: 'Bar',
    type: RoomTypes.BAR,
    width: 14,
    height: 9,
    doors: {
      north: { to: 'beco', spawnX: 4, spawnY: 8 }
    },
    objects: [
      { x: 3, y: 3, type: 'balcao' },
      { x: 7, y: 3, type: 'balcao' },
      { x: 11, y: 3, type: 'balcao' },
      { x: 5, y: 6, type: 'mesa' },
      { x: 9, y: 6, type: 'mesa' }
    ],
    items: [
      { x: 2, y: 7, type: 'cafe', taken: false }
    ],
    enemies: [
      { x: 10, y: 5, type: 'elite', hp: 80 }
    ]
  }
};

// Cores por tipo de sala (para o chão)
const ROOM_COLORS = {
  hall:     { floor: '#2a2520', wall: '#1a1510', accent: '#3d3428' },
  bedroom:  { floor: '#252028', wall: '#18141c', accent: '#322a38' },
  stairs:   { floor: '#222222', wall: '#151515', accent: '#2e2e2e' },
  alley:    { floor: '#1c1c1c', wall: '#0f0f0f', accent: '#252525' },
  bar:      { floor: '#2a2218', wall: '#1a140e', accent: '#3a2e20' }
};
