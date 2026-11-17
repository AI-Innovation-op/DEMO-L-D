export interface GameSaveData {
  timestamp: number;
  dateStr: string;
  activeHero: 'thomas' | 'khaterine';
  health: number;
  maxHealth: number;
  posture: number;
  maxPosture: number;
  inventory: any;
  progression: any;
  sanctuaryVisited: boolean;
}

export class GameSaveManager {
  private static STORAGE_KEY = 'the_light_in_the_darkness_save_v1';
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

  public static saveGame(data: Omit<GameSaveData, 'timestamp' | 'dateStr'>): boolean {
    try {
      const fullSave: GameSaveData = {
        ...data,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString()
      };
      this.getStorage().setItem(this.STORAGE_KEY, JSON.stringify(fullSave));
      return true;
    } catch (e) {
      console.error('Error saving game to sanctuary storage:', e);
      return false;
    }
  }

  public static loadGame(): GameSaveData | null {
    try {
      const raw = this.getStorage().getItem(this.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as GameSaveData;
    } catch (e) {
      console.error('Error loading game from sanctuary storage:', e);
      return null;
    }
  }

  public static hasSave(): boolean {
    return this.getStorage().getItem(this.STORAGE_KEY) !== null;
  }

  public static clearSave(): void {
    this.getStorage().removeItem(this.STORAGE_KEY);
  }
}
