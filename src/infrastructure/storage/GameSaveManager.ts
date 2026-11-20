export interface HeroSavedState {
  health: number;
  posture: number;
  isArmed: boolean;
  available: boolean;
}

export interface WorldSaveState {
  morwennaDefeated: boolean;
  morwennaPhase2: boolean;
  cemeteryGateOpen: boolean;
  checkpoint: { x: number; y: number; z: number };
  destroyedPropIds: string[];
}

export interface GameSaveDataV2 {
  schemaVersion: 2;
  timestamp: number;
  dateStr: string;
  activeHero: 'thomas' | 'khaterine';
  heroes: {
    thomas: HeroSavedState;
    khaterine: HeroSavedState;
  };
  // Backward compatibility fields
  health: number;
  maxHealth: number;
  posture: number;
  maxPosture: number;
  inventory: any;
  progression: any;
  sanctuaryVisited: boolean;
  world: WorldSaveState;
}

export type SaveInput = Omit<GameSaveDataV2, 'schemaVersion' | 'timestamp' | 'dateStr'>;

export class GameSaveManager {
  public static readonly CURRENT_VERSION = 2;
  private static STORAGE_KEY = 'the_light_in_the_darkness_save_v2';
  private static LEGACY_V1_KEY = 'the_light_in_the_darkness_save_v1';
  private static memoryStore: Map<string, string> = new Map();

  private static getStorage(): {
    getItem: (k: string) => string | null;
    setItem: (k: string, v: string) => void;
    removeItem: (k: string) => void;
  } {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch {
      // In-memory fallback
    }
    return {
      getItem: (k: string) => GameSaveManager.memoryStore.get(k) || null,
      setItem: (k: string, v: string) => {
        GameSaveManager.memoryStore.set(k, v);
      },
      removeItem: (k: string) => {
        GameSaveManager.memoryStore.delete(k);
      }
    };
  }

  public static saveGame(data: SaveInput): boolean {
    try {
      const fullSave: GameSaveDataV2 = {
        ...data,
        schemaVersion: this.CURRENT_VERSION,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString()
      };
      const serialized = JSON.stringify(fullSave);
      this.getStorage().setItem(this.STORAGE_KEY, serialized);
      return true;
    } catch (e) {
      console.error('Error saving game to sanctuary storage:', e);
      return false;
    }
  }

  public static loadGame(): GameSaveDataV2 | null {
    try {
      const storage = this.getStorage();
      let raw = storage.getItem(this.STORAGE_KEY);

      // Check for legacy V1 migration if V2 does not exist
      if (!raw) {
        const legacyRaw = storage.getItem(this.LEGACY_V1_KEY);
        if (legacyRaw) {
          const legacyParsed = JSON.parse(legacyRaw);
          const migrated = this.migrateV1ToV2(legacyParsed);
          if (migrated) {
            this.saveGame(migrated);
            return this.loadGame();
          }
        }
        return null;
      }

      const parsed = JSON.parse(raw);
      return this.validateAndNormalizeSave(parsed);
    } catch (e) {
      console.error('Error loading game from sanctuary storage:', e);
      return null;
    }
  }

  public static hasSave(): boolean {
    const storage = this.getStorage();
    return storage.getItem(this.STORAGE_KEY) !== null || storage.getItem(this.LEGACY_V1_KEY) !== null;
  }

  public static clearSave(): void {
    const storage = this.getStorage();
    storage.removeItem(this.STORAGE_KEY);
    storage.removeItem(this.LEGACY_V1_KEY);
  }

  public static exportSaveToJson(): string | null {
    const save = this.loadGame();
    if (!save) return null;
    return JSON.stringify(save, null, 2);
  }

  public static importSaveFromJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      const normalized = this.validateAndNormalizeSave(parsed);
      if (!normalized) return false;
      return this.saveGame(normalized);
    } catch {
      return false;
    }
  }

  public static migrateV1ToV2(v1: any): SaveInput | null {
    if (!v1 || typeof v1 !== 'object') return null;

    const activeHero = v1.activeHero === 'khaterine' ? 'khaterine' : 'thomas';
    const rawHealth = typeof v1.health === 'number' && Number.isFinite(v1.health) ? v1.health : 100;
    const rawPosture = typeof v1.posture === 'number' && Number.isFinite(v1.posture) ? v1.posture : 0;

    return {
      activeHero,
      heroes: {
        thomas: {
          health: activeHero === 'thomas' ? rawHealth : 100,
          posture: activeHero === 'thomas' ? rawPosture : 0,
          isArmed: true,
          available: true
        },
        khaterine: {
          health: activeHero === 'khaterine' ? rawHealth : 90,
          posture: activeHero === 'khaterine' ? rawPosture : 0,
          isArmed: true,
          available: true
        }
      },
      health: rawHealth,
      maxHealth: v1.maxHealth || 100,
      posture: rawPosture,
      maxPosture: v1.maxPosture || 50,
      inventory: v1.inventory || {},
      progression: v1.progression || {},
      sanctuaryVisited: !!v1.sanctuaryVisited,
      world: {
        morwennaDefeated: false,
        morwennaPhase2: false,
        cemeteryGateOpen: false,
        checkpoint: { x: 0, y: 0, z: 4 },
        destroyedPropIds: []
      }
    };
  }

  private static validateAndNormalizeSave(save: any): GameSaveDataV2 | null {
    if (!save || typeof save !== 'object') return null;

    const activeHero: 'thomas' | 'khaterine' = save.activeHero === 'khaterine' ? 'khaterine' : 'thomas';

    // Validate health and posture strictly accepting 0 as valid (H03 fix)
    const validHealth = typeof save.health === 'number' && Number.isFinite(save.health) ? save.health : 100;
    const validPosture = typeof save.posture === 'number' && Number.isFinite(save.posture) ? save.posture : 0;
    const validMaxHealth = typeof save.maxHealth === 'number' && Number.isFinite(save.maxHealth) ? save.maxHealth : 100;
    const validMaxPosture = typeof save.maxPosture === 'number' && Number.isFinite(save.maxPosture) ? save.maxPosture : 50;

    const heroes: { thomas: HeroSavedState; khaterine: HeroSavedState } = {
      thomas: {
        health: save.heroes?.thomas && typeof save.heroes.thomas.health === 'number' && Number.isFinite(save.heroes.thomas.health)
          ? save.heroes.thomas.health
          : (activeHero === 'thomas' ? validHealth : 100),
        posture: save.heroes?.thomas && typeof save.heroes.thomas.posture === 'number' && Number.isFinite(save.heroes.thomas.posture)
          ? save.heroes.thomas.posture
          : (activeHero === 'thomas' ? validPosture : 0),
        isArmed: save.heroes?.thomas?.isArmed !== false,
        available: true
      },
      khaterine: {
        health: save.heroes?.khaterine && typeof save.heroes.khaterine.health === 'number' && Number.isFinite(save.heroes.khaterine.health)
          ? save.heroes.khaterine.health
          : (activeHero === 'khaterine' ? validHealth : 90),
        posture: save.heroes?.khaterine && typeof save.heroes.khaterine.posture === 'number' && Number.isFinite(save.heroes.khaterine.posture)
          ? save.heroes.khaterine.posture
          : (activeHero === 'khaterine' ? validPosture : 0),
        isArmed: true,
        available: true
      }
    };

    const world: WorldSaveState = {
      morwennaDefeated: !!save.world?.morwennaDefeated,
      morwennaPhase2: !!save.world?.morwennaPhase2,
      cemeteryGateOpen: !!save.world?.cemeteryGateOpen,
      checkpoint: {
        x: save.world?.checkpoint?.x ?? 0,
        y: save.world?.checkpoint?.y ?? 0,
        z: save.world?.checkpoint?.z ?? 4
      },
      destroyedPropIds: Array.isArray(save.world?.destroyedPropIds) ? save.world.destroyedPropIds : []
    };

    return {
      schemaVersion: 2,
      timestamp: save.timestamp || Date.now(),
      dateStr: save.dateStr || new Date().toLocaleString(),
      activeHero,
      heroes,
      health: validHealth,
      maxHealth: validMaxHealth,
      posture: validPosture,
      maxPosture: validMaxPosture,
      inventory: save.inventory || {},
      progression: save.progression || {},
      sanctuaryVisited: !!save.sanctuaryVisited,
      world
    };
  }
}
