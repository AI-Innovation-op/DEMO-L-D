export type HeroType = 'thomas' | 'khaterine' | 'shared';

export interface SkillNode {
  id: string;
  hero: HeroType;
  name: string;
  description: string;
  cost: number;
  icon: string;
  isUnlocked: boolean;
  requiredSkillId?: string;
  modifierType:
    | 'damage_bonus_pct'
    | 'max_health_bonus'
    | 'stagger_bonus_pct'
    | 'arrow_damage_pct'
    | 'dodge_distance_pct'
    | 'ward_reflect_pct';
  modifierValue: number;
}

export const INITIAL_SKILLS: SkillNode[] = [
  // Thomas Skills
  {
    id: 'thomas_shield_strike',
    hero: 'thomas',
    name: 'Golpe de Escudo Santo',
    description: 'Aumenta el impacto contra la postura enemiga un +35% y desestabiliza con mayor facilidad.',
    cost: 40,
    icon: '🛡️',
    isUnlocked: false,
    modifierType: 'stagger_bonus_pct',
    modifierValue: 35
  },
  {
    id: 'thomas_blade_mastery',
    hero: 'thomas',
    name: 'Filo Consagrado',
    description: 'Imbuye la espada corta del monaguillo con +20% de daño cortante continuo.',
    cost: 70,
    icon: '⚔️',
    isUnlocked: false,
    requiredSkillId: 'thomas_shield_strike',
    modifierType: 'damage_bonus_pct',
    modifierValue: 20
  },
  {
    id: 'thomas_iron_will',
    hero: 'thomas',
    name: 'Tenacidad Inquebrantable',
    description: 'La devoción a San Jude otorga +25 puntos a la Salud Máxima (100 -> 125).',
    cost: 110,
    icon: '❤️‍🔥',
    isUnlocked: false,
    requiredSkillId: 'thomas_blade_mastery',
    modifierType: 'max_health_bonus',
    modifierValue: 25
  },

  // Khaterine Skills
  {
    id: 'khaterine_piercing_arrow',
    hero: 'khaterine',
    name: 'Disparo Abisal Perforante',
    description: 'Las flechas místicas del Sauce Negro infligen un +25% de daño perforante.',
    cost: 40,
    icon: '🏹',
    isUnlocked: false,
    modifierType: 'arrow_damage_pct',
    modifierValue: 25
  },
  {
    id: 'khaterine_shadow_step',
    hero: 'khaterine',
    name: 'Paso Espectral',
    description: 'Khaterine se disuelve en las sombras al rodar, aumentando la distancia de esquiva un +30%.',
    cost: 70,
    icon: '💨',
    isUnlocked: false,
    requiredSkillId: 'khaterine_piercing_arrow',
    modifierType: 'dodge_distance_pct',
    modifierValue: 30
  },
  {
    id: 'khaterine_abyssal_ward',
    hero: 'khaterine',
    name: 'Sagrario del Sauce',
    description: 'La barrera mística [L] dispersa el fuego de Morwenna y reduce el daño de guardia a la mitad.',
    cost: 110,
    icon: '🔮',
    isUnlocked: false,
    requiredSkillId: 'khaterine_shadow_step',
    modifierType: 'ward_reflect_pct',
    modifierValue: 50
  }
];
