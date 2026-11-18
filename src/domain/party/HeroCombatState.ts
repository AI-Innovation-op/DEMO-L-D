export type HeroId = 'thomas' | 'khaterine' | 'elowen';

export type ActionState =
  | 'idle'
  | 'moving'
  | 'windup'
  | 'active'
  | 'recovery'
  | 'guarding'
  | 'dodging'
  | 'stunned'
  | 'defeated';

export interface HeroDefinition {
  id: HeroId;
  name: string;
  baseMaxHealth: number;
  baseMaxPosture: number;
  moveSpeedMps: number;
  availableByDefault: boolean;
}

export const HERO_DEFINITIONS: Record<HeroId, HeroDefinition> = {
  thomas: {
    id: 'thomas',
    name: 'Thomas el Acólito',
    baseMaxHealth: 100,
    baseMaxPosture: 50,
    moveSpeedMps: 4.8,
    availableByDefault: true
  },
  khaterine: {
    id: 'khaterine',
    name: 'Khaterine la Cazadora',
    baseMaxHealth: 90,
    baseMaxPosture: 70,
    moveSpeedMps: 5.6,
    availableByDefault: true
  },
  elowen: {
    id: 'elowen',
    name: 'Elowen de Oakhaven',
    baseMaxHealth: 80,
    baseMaxPosture: 60,
    moveSpeedMps: 4.5,
    availableByDefault: false
  }
};

export interface HeroCombatState {
  id: HeroId;
  available: boolean;
  health: number;
  posture: number;
  isArmed: boolean;
  isGuarding: boolean;
  isDodging: boolean;
  action: ActionState;
}

export function createInitialHeroState(id: HeroId, bonusMaxHealth: number = 0): HeroCombatState {
  const def = HERO_DEFINITIONS[id];
  return {
    id,
    available: def.availableByDefault,
    health: def.baseMaxHealth + bonusMaxHealth,
    posture: 0,
    isArmed: true,
    isGuarding: false,
    isDodging: false,
    action: 'idle'
  };
}
