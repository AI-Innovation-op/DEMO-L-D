import { Character } from '../character/Character';
import { CharacterId } from '../character/CharacterEnums';
import { Weapon } from '../weapon/Weapon';
import { StoryProgress } from '../story/StoryProgress';

export interface CharacterSaveData {
  id: CharacterId;
  level: number;
  currentExp: number;
  maxExp: number;
  isMinigameReady: boolean;
  health: number;
  maxHealth: number;
  posture: number;
  maxPosture: number;
  speed: number;
  defense: number;
  attackPower: number;
  equippedWeaponId: string;
}

export interface GameSaveData {
  version: string;
  timestamp: number;
  currentAct: number;
  leaderId: CharacterId;
  characters: Record<CharacterId, CharacterSaveData>;
  unlockedWeaponIds: string[];
  relics: {
    hasRosarioCedric: boolean;
    hasPajaroMadera: boolean;
    hasTablillaHerejes: boolean;
    hasGotaLuzDivina: boolean;
  };
  completedMilestones: string[];
}

export const SAVE_KEY_V1 = 'the_light_in_darkness_save_v1';
export const CURRENT_SAVE_VERSION = '1.1.0';

export class SessionStateStore {
  private static instance: SessionStateStore | null = null;

  public currentAct: number = 1;
  public leaderId: CharacterId = 'thomas';
  public characters: Record<CharacterId, CharacterSaveData>;
  public unlockedWeaponIds: string[] = ['short_sword', 'khaterine_bow'];
  public relics = {
    hasRosarioCedric: false,
    hasPajaroMadera: false,
    hasTablillaHerejes: false,
    hasGotaLuzDivina: false
  };
  public completedMilestones: string[] = [];

  private constructor() {
    this.characters = {
      thomas: this.createDefaultCharacterData('thomas'),
      khaterine: this.createDefaultCharacterData('khaterine')
    };
  }

  public static getInstance(): SessionStateStore {
    if (!SessionStateStore.instance) {
      SessionStateStore.instance = new SessionStateStore();
    }
    return SessionStateStore.instance;
  }

  public resetToDefaults(initialLeader: CharacterId = 'thomas', targetAct: number = 1): void {
    this.currentAct = targetAct;
    this.leaderId = initialLeader;
    this.characters = {
      thomas: this.createDefaultCharacterData('thomas'),
      khaterine: this.createDefaultCharacterData('khaterine')
    };
    this.unlockedWeaponIds = ['short_sword', 'khaterine_bow'];
    this.relics = {
      hasRosarioCedric: false,
      hasPajaroMadera: false,
      hasTablillaHerejes: false,
      hasGotaLuzDivina: false
    };
    this.completedMilestones = [];
  }

  private createDefaultCharacterData(id: CharacterId): CharacterSaveData {
    if (id === 'thomas') {
      return {
        id: 'thomas',
        level: 1,
        currentExp: 0,
        maxExp: 100,
        isMinigameReady: false,
        health: 125,
        maxHealth: 125,
        posture: 55,
        maxPosture: 55,
        speed: 220,
        defense: 8,
        attackPower: 14,
        equippedWeaponId: 'short_sword'
      };
    } else {
      return {
        id: 'khaterine',
        level: 1,
        currentExp: 0,
        maxExp: 100,
        isMinigameReady: false,
        health: 155,
        maxHealth: 155,
        posture: 75,
        maxPosture: 75,
        speed: 160,
        defense: 18,
        attackPower: 12,
        equippedWeaponId: 'khaterine_bow'
      };
    }
  }

  /**
   * Save the state of a live Character into the persistent session store.
   */
  public saveCharacter(char: Character): void {
    const curWeapon = char.disarmManager.getCurrentWeapon();
    const primary = char.disarmManager.getPrimaryWeapon();
    const weaponId = (primary ? primary.id : curWeapon.id) || (char.id === 'thomas' ? 'short_sword' : 'khaterine_bow');

    this.characters[char.id] = {
      id: char.id,
      level: char.levelUp.level,
      currentExp: char.levelUp.currentExp,
      maxExp: char.levelUp.maxExp,
      isMinigameReady: char.levelUp.isMinigameReady,
      health: char.stats.health,
      maxHealth: char.stats.maxHealth,
      posture: char.stats.posture,
      maxPosture: char.stats.maxPosture,
      speed: char.stats.speed,
      defense: char.stats.defense,
      attackPower: char.stats.attackPower,
      equippedWeaponId: weaponId
    };

    if (!this.unlockedWeaponIds.includes(weaponId) && weaponId !== 'improvised_fists') {
      this.unlockedWeaponIds.push(weaponId);
    }
  }

  /**
   * Hydrate a newly created Character with the persisted session state.
   */
  public hydrateCharacter(char: Character, refillVitals: boolean = false): void {
    const data = this.characters[char.id];
    if (!data) return;

    // Restore LevelUp progress
    char.levelUp.level = data.level;
    char.levelUp.currentExp = data.currentExp;
    char.levelUp.maxExp = data.maxExp;
    char.levelUp.isMinigameReady = data.isMinigameReady;

    // Restore Stats
    char.stats.maxHealth = data.maxHealth;
    char.stats.health = refillVitals ? data.maxHealth : Math.max(1, data.health);
    char.stats.maxPosture = data.maxPosture;
    char.stats.posture = refillVitals ? data.maxPosture : data.posture;
    char.stats.speed = data.speed;
    char.stats.defense = data.defense;
    char.stats.attackPower = data.attackPower;

    // Restore weapon if unlocked
    if (data.equippedWeaponId && data.equippedWeaponId !== 'improvised_fists') {
      const weaponMap: Record<string, () => Weapon> = {
        short_sword: () => Weapon.createShortSword(),
        khaterine_bow: () => Weapon.createKhaterineBow(),
        lamento_oakhaven: () => Weapon.createLamentoOakhaven(),
        colmillo_sauce: () => Weapon.createColmilloSauce(),
        falso_veredicto: () => Weapon.createFalsoVeredicto(),
        espejismo_oro: () => Weapon.createEspejismoOro(),
        alba_gris: () => Weapon.createAlbaGris()
      };

      const creator = weaponMap[data.equippedWeaponId];
      if (creator) {
        char.disarmManager.setEquippedPrimary(creator());
      }
    }
  }

  /**
   * Save entire active game session including player, ally, and current Act.
   */
  public saveSession(
    player: Character,
    ally: Character,
    act: number,
    storyProgress?: StoryProgress
  ): void {
    this.currentAct = act;
    this.leaderId = player.id;
    this.saveCharacter(player);
    this.saveCharacter(ally);

    if (storyProgress) {
      this.completedMilestones = storyProgress.getCompletedMilestones();
    }

    this.persistToStorage();
  }

  /**
   * Persist in-memory state to browser localStorage.
   */
  public persistToStorage(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const payload: GameSaveData = {
        version: CURRENT_SAVE_VERSION,
        timestamp: Date.now(),
        currentAct: this.currentAct,
        leaderId: this.leaderId,
        characters: this.characters,
        unlockedWeaponIds: this.unlockedWeaponIds,
        relics: this.relics,
        completedMilestones: this.completedMilestones
      };
      window.localStorage.setItem(SAVE_KEY_V1, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load saved session from browser localStorage. Returns true if valid save found.
   */
  public loadFromStorage(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const raw = window.localStorage.getItem(SAVE_KEY_V1);
      if (!raw) return false;

      const data = JSON.parse(raw) as GameSaveData;
      if (!data || !data.version) return false;

      this.currentAct = data.currentAct || 1;
      this.leaderId = data.leaderId || 'thomas';
      if (data.characters) {
        const isLegacyBalance = data.version === '1.0.0';
        if (data.characters.thomas) {
          this.characters.thomas = isLegacyBalance
            ? {
                ...data.characters.thomas,
                maxHealth: 125,
                health: Math.min(125, data.characters.thomas.health),
                maxPosture: 55,
                posture: Math.min(55, data.characters.thomas.posture),
                attackPower: 14
              }
            : data.characters.thomas;
        }
        if (data.characters.khaterine) {
          this.characters.khaterine = isLegacyBalance
            ? {
                ...data.characters.khaterine,
                maxHealth: 155,
                health: Math.min(155, data.characters.khaterine.health),
                maxPosture: 75,
                posture: Math.min(75, data.characters.khaterine.posture),
                attackPower: 12
              }
            : data.characters.khaterine;
        }
      }
      if (Array.isArray(data.unlockedWeaponIds)) {
        this.unlockedWeaponIds = data.unlockedWeaponIds;
      }
      if (data.relics) {
        this.relics = data.relics;
      }
      if (Array.isArray(data.completedMilestones)) {
        this.completedMilestones = data.completedMilestones;
      }
      return true;
    } catch {
      return false;
    }
  }
}
