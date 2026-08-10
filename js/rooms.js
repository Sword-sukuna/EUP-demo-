// ========== SALAS — estilo mansão sombria ==========

const TILE = 48;

const ROOMS = {
  mansao: {
    id: 'mansao',
    name: 'Hall da Mansão',
    type: 'hall',
    width: 16,
    height: 11,
    doors: {
      north: { to: 'escadas', spawnX: 7, spawnY: 9 },
      south: { to: 'beco', spawnX: 4, spawnY: 1 },
      west:  { to: 'quarto1', spawnX: 10, spawnY: 5 },
      east:  { to: 'quarto2', spawnX: 1, spawnY: 5 }
    },
    objects: [
      { x: 8, y: 5, type: 'fogueira' },
      { x: 3, y: 3, type: 'mesa' },
      { x: 12, y: 3, type: 'mesa' },
      { x: 3, y: 8, type: 'cadeira' },
      { x: 12, y: 8, type: 'cadeira' },
      { x: 8, y: 2, type: 'tapete' }
    ],
    items: [
      { x: 5, y: 4, type: 'cafe', taken: false },
      { x: 11, y: 7, type: 'faca', taken: false }
    ],
    enemies: [],
    lamps: [[2,2],[13,2],[2,9],[13,9],[8,1]]
  },

  quarto1: {
    id: 'quarto1',
    name: 'Quarto Oeste',
    type: 'bedroom',
    width: 11,
    height: 9,
    doors: {
      east: { to: 'mansao', spawnX: 1, spawnY: 5 }
    },
    objects: [
      { x: 3, y: 3, type: 'cama' },
      { x: 8, y: 2, type: 'janela', open: false },
      { x: 2, y: 7, type: 'guarda-roupa' },
      { x: 7, y: 6, type: 'mesa' }
    ],
    items: [
      { x: 9, y: 7, type: 'chave', taken: false }
    ],
    enemies: [
      { x: 6, y: 5, type: 'fantasma' }
    ],
    lamps: [[2,2],[9,2]]
  },

  quarto2: {
    id: 'quarto2',
    name: 'Quarto Leste',
    type: 'bedroom',
    width: 11,
    height: 9,
    doors: {
      west: { to: 'mansao', spawnX: 14, spawnY: 5 }
    },
    objects: [
      { x: 7, y: 3, type: 'cama' },
      { x: 2, y: 2, type: 'janela', open: false },
      { x: 8, y: 7, type: 'mesa' }
    ],
    items: [],
    enemies: [
      { x: 5, y: 5, type: 'vulto' }
    ],
    lamps: [[2,2],[9,7]]
  },

  escadas: {
    id: 'escadas',
    name: 'Escadas',
    type: 'stairs',
    width: 9,
    height: 8,
    doors: {
      south: { to: 'mansao', spawnX: 8, spawnY: 1 },
      north: { to: 'quarto3', spawnX: 5, spawnY: 7 }
    },
    objects: [
      { x: 4, y: 3, type: 'escada' }
    ],
    items: [],
    enemies: [],
    lamps: [[2,2],[6,2]]
  },

  quarto3: {
    id: 'quarto3',
    name: 'Quarto Superior',
    type: 'bedroom',
    width: 12,
    height: 9,
    doors: {
      south: { to: 'escadas', spawnX: 4, spawnY: 1 }
    },
    objects: [
      { x: 3, y: 3, type: 'cama' },
      { x: 9, y: 2, type: 'janela', open: false },
      { x: 6, y: 6, type: 'bau' },
      { x: 2, y: 7, type: 'guarda-roupa' }
    ],
    items: [
      { x: 8, y: 5, type: 'lanterna', taken: false }
    ],
    enemies: [
      { x: 5, y: 4, type: 'aranha' },
      { x: 9, y: 6, type: 'fantasma' }
    ],
    lamps: [[2,2],[10,2]]
  },

  beco: {
    id: 'beco',
    name: 'Beco',
    type: 'alley',
    width: 7,
    height: 9,
    doors: {
      north: { to: 'mansao', spawnX: 8, spawnY: 9 },
      south: { to: 'bar', spawnX: 6, spawnY: 1 }
    },
    objects: [],
    items: [],
    enemies: [
      { x: 3, y: 4, type: 'vulto' }
    ],
    lamps: [[3,1],[3,7]]
  },

  bar: {
    id: 'bar',
    name: 'Bar',
    type: 'bar',
    width: 13,
    height: 9,
    doors: {
      north: { to: 'beco', spawnX: 3, spawnY: 7 }
    },
    objects: [
      { x: 3, y: 3, type: 'balcao' },
      { x: 6, y: 3, type: 'balcao' },
      { x: 9, y: 3, type: 'balcao' },
      { x: 4, y: 6, type: 'mesa' },
      { x: 9, y: 6, type: 'mesa' }
    ],
    items: [
      { x: 2, y: 7, type: 'cafe', taken: false }
    ],
    enemies: [
      { x: 10, y: 5, type: 'elite' }
    ],
    lamps: [[2,2],[11,2],[2,7],[11,7]]
  }
};

// Paleta inspirada na imagem da mansão (tons quentes escuros)
const THEME = {
  hall: {
    floor: '#2c241c',
    floorAlt: '#342c22',
    wall: '#1a140e',
    wallEdge: '#0e0a06',
    accent: '#3d3428'
  },
  bedroom: {
    floor: '#2a2228',
    floorAlt: '#322830',
    wall: '#18121a',
    wallEdge: '#0c0810',
    accent: '#3a3040'
  },
  stairs: {
    floor: '#252018',
    floorAlt: '#2e2820',
    wall: '#16120c',
    wallEdge: '#0a0804',
    accent: '#383028'
  },
  alley: {
    floor: '#1c1a16',
    floorAlt: '#24221c',
    wall: '#100e0a',
    wallEdge: '#080604',
    accent: '#2a2820'
  },
  bar: {
    floor: '#2e2418',
    floorAlt: '#382c1e',
    wall: '#1a140c',
    wallEdge: '#0e0a06',
    accent: '#40301e'
  }
};
