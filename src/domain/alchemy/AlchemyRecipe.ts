import { InventoryItem } from '../inventory/InventoryItem';

export interface IngredientRequirement {
  itemId: string;
  name: string;
  icon: string;
  quantity: number;
}

export interface AlchemyRecipe {
  id: string;
  name: string;
  description: string;
  outputItem: InventoryItem;
  outputQuantity: number;
  ingredients: IngredientRequirement[];
  expReward: number;
}

export const CANONICAL_MATERIALS: Record<string, InventoryItem> = {
  herb_silverleaf: {
    id: 'herb_silverleaf',
    name: 'Hoja de Plata',
    description: 'Hierba medicinal de flor blanca recolectada en los jardines de Oakhaven.',
    category: 'material',
    icon: '🍃',
    quantity: 1,
    maxQuantity: 30,
    effectType: 'none',
    effectValue: 0
  },
  ash_purified: {
    id: 'ash_purified',
    name: 'Ceniza Consagrada',
    description: 'Cenizas residuales extraídas de los braseros e incensarios purificados.',
    category: 'material',
    icon: '✨',
    quantity: 1,
    maxQuantity: 20,
    effectType: 'none',
    effectValue: 0
  },
  blood_hound: {
    id: 'blood_hound',
    name: 'Esencia de Fuego Fatuo',
    description: 'Fuego sombrío y sangre espesa cristalizada de los sabuesos de ceniza.',
    category: 'material',
    icon: '🔥',
    quantity: 1,
    maxQuantity: 15,
    effectType: 'none',
    effectValue: 0
  },
  water_blessed: {
    id: 'water_blessed',
    name: 'Agua Bendita de San Jude',
    description: 'Agua pura bendecida por el Padre Cedric en la pila del santuario.',
    category: 'material',
    icon: '💧',
    quantity: 1,
    maxQuantity: 15,
    effectType: 'none',
    effectValue: 0
  },
  salve_base: {
    id: 'salve_base',
    name: 'Ungüento Base de Cera',
    description: 'Base emoliente preparada con cera de panal para emulsionar pócimas.',
    category: 'material',
    icon: '🍯',
    quantity: 1,
    maxQuantity: 20,
    effectType: 'none',
    effectValue: 0
  }
};

export const CANONICAL_RECIPES: AlchemyRecipe[] = [
  {
    id: 'craft_maiden_balm',
    name: 'Bálsamo de la Doncella',
    description: 'Elixir de curación bendecido por Elowen. Restaura +35 puntos de salud.',
    outputQuantity: 1,
    expReward: 15,
    outputItem: {
      id: 'maiden_balm',
      name: 'Bálsamo de la Doncella',
      description: 'Hierbas sagradas bendecidas por Elowen. Restaura +35 puntos de salud.',
      category: 'consumable',
      icon: '🌿',
      quantity: 1,
      maxQuantity: 10,
      effectType: 'heal_health',
      effectValue: 35
    },
    ingredients: [
      { itemId: 'herb_silverleaf', name: 'Hoja de Plata', icon: '🍃', quantity: 2 },
      { itemId: 'salve_base', name: 'Ungüento Base de Cera', icon: '🍯', quantity: 1 }
    ]
  },
  {
    id: 'craft_saint_jude_rosary',
    name: 'Rosario de San Jude',
    description: 'Rosario consagrado que restaura la postura (+50) y confiere serenidad.',
    outputQuantity: 1,
    expReward: 20,
    outputItem: {
      id: 'saint_jude_rosary',
      name: 'Rosario de San Jude',
      description: 'Rosario tallado en roble de Oakhaven por el Padre Cedric. Restaura la postura y confiere serenidad.',
      category: 'consumable',
      icon: '📿',
      quantity: 1,
      maxQuantity: 5,
      effectType: 'restore_posture',
      effectValue: 50
    },
    ingredients: [
      { itemId: 'water_blessed', name: 'Agua Bendita de San Jude', icon: '💧', quantity: 1 },
      { itemId: 'ash_purified', name: 'Ceniza Consagrada', icon: '✨', quantity: 1 }
    ]
  },
  {
    id: 'craft_consecrated_oil',
    name: 'Óleo Consagrado de San Jude',
    description: 'Imbuye las armas con fuego sagrado. Otorga +25% de daño durante 20 segundos.',
    outputQuantity: 1,
    expReward: 25,
    outputItem: {
      id: 'consecrated_ash',
      name: 'Ceniza Consagrada',
      description: 'Cenizas de santos de Londinium. Imbuye las armas con +25% de daño sagrado durante 20 segundos.',
      category: 'consumable',
      icon: '✨',
      quantity: 1,
      maxQuantity: 5,
      effectType: 'buff_attack',
      effectValue: 25,
      durationSeconds: 20
    },
    ingredients: [
      { itemId: 'ash_purified', name: 'Ceniza Consagrada', icon: '✨', quantity: 2 },
      { itemId: 'blood_hound', name: 'Esencia de Fuego Fatuo', icon: '🔥', quantity: 1 }
    ]
  },
  {
    id: 'craft_elixir_sunset',
    name: 'Bálsamo del Ocaso Concentrado',
    description: 'Destilado aromático de boticaria. Restaura +40 salud.',
    outputQuantity: 1,
    expReward: 25,
    outputItem: {
      id: 'balm_health',
      name: 'Bálsamo del Ocaso',
      description: 'Extracto aromático destilado por las Hermanas de Oakhaven. Restaura +40 salud.',
      category: 'consumable',
      icon: '🌿',
      quantity: 1,
      maxQuantity: 5,
      effectType: 'heal_health',
      effectValue: 40
    },
    ingredients: [
      { itemId: 'herb_silverleaf', name: 'Hoja de Plata', icon: '🍃', quantity: 3 },
      { itemId: 'water_blessed', name: 'Agua Bendita de San Jude', icon: '💧', quantity: 1 }
    ]
  },
  {
    id: 'craft_fire_arrows',
    name: 'Flechas de Fuego Fatuo (x5)',
    description: 'Flechas de caza imbuidas en fuego sombrío de sabueso. Aplican daño ardiente residual continuo.',
    outputQuantity: 5,
    expReward: 25,
    outputItem: {
      id: 'arrow_fire',
      name: 'Flechas de Fuego Fatuo',
      description: 'Flechas con punta imbuida en llamas de Oakhaven. Provocan quemadura continua en enemigos alcanzados.',
      category: 'ammunition',
      icon: '🔥',
      quantity: 5,
      maxQuantity: 30,
      effectType: 'special_ammo',
      effectValue: 24
    },
    ingredients: [
      { itemId: 'blood_hound', name: 'Esencia de Fuego Fatuo', icon: '🔥', quantity: 1 },
      { itemId: 'ash_purified', name: 'Ceniza Consagrada', icon: '✨', quantity: 1 }
    ]
  },
  {
    id: 'craft_silver_arrows',
    name: 'Flechas de Plata Consagrada (x5)',
    description: 'Flechas bendecidas en la pila bautismal. Destrozan la guardia y postura de los no-muertos e inquisidores.',
    outputQuantity: 5,
    expReward: 25,
    outputItem: {
      id: 'arrow_silver',
      name: 'Flechas de Plata Consagrada',
      description: 'Flechas de plata pura bendecida. Ignoran bloqueos frontales y causan daño crítico masivo a la postura.',
      category: 'ammunition',
      icon: '🏹',
      quantity: 5,
      maxQuantity: 30,
      effectType: 'special_ammo',
      effectValue: 45
    },
    ingredients: [
      { itemId: 'herb_silverleaf', name: 'Hoja de Plata', icon: '🍃', quantity: 2 },
      { itemId: 'water_blessed', name: 'Agua Bendita de San Jude', icon: '💧', quantity: 1 }
    ]
  },
  {
    id: 'craft_holy_fire_flask',
    name: 'Frascos de Fuego Fatuo (x2)',
    description: 'Frascos arrojadizos de vidrio sellados con cera y fuego concentrado. Estallan en un pilar ardiente.',
    outputQuantity: 2,
    expReward: 30,
    outputItem: {
      id: 'holy_fire_flask',
      name: 'Frasco de Fuego Fatuo',
      description: 'Frasco arrojadizo que estalla en un pilar de fuego sagrado ardiente al impactar contra el suelo o enemigos.',
      category: 'consumable',
      icon: '🧪',
      quantity: 2,
      maxQuantity: 10,
      effectType: 'throwable_flask',
      effectValue: 55
    },
    ingredients: [
      { itemId: 'blood_hound', name: 'Esencia de Fuego Fatuo', icon: '🔥', quantity: 1 },
      { itemId: 'salve_base', name: 'Ungüento Base de Cera', icon: '🍯', quantity: 1 }
    ]
  }
];
