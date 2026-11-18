import { Inventory } from '../inventory/Inventory';
import { Progression } from '../progression/Progression';

export type MorwennaPhase = 1 | 2;

export interface DamageResult {
  transitionedToPhase2: boolean;
  defeated: boolean;
  currentHealth: number;
}

export interface MorwennaRewardResult {
  keyGranted: boolean;
  expAwarded: number;
  gateOpened: boolean;
}

export class MorwennaEncounter {
  public static readonly DEFAULT_MAX_HP = 280;
  public static readonly PHASE_2_THRESHOLD_PCT = 0.5; // 50% HP (<= 140 HP)
  public static readonly VICTORY_EXP = 350;
  public static readonly REWARD_KEY_ID = 'oakhaven_crypt_key';

  public health: number;
  public readonly maxHealth: number;
  public phase: MorwennaPhase = 1;
  public isTransitioning: boolean = false;
  public isDefeated: boolean = false;
  public rewardClaimed: boolean = false;

  constructor(maxHealth: number = MorwennaEncounter.DEFAULT_MAX_HP) {
    this.maxHealth = maxHealth;
    this.health = maxHealth;
  }

  public takeDamage(amount: number): DamageResult {
    if (this.isDefeated) {
      return { transitionedToPhase2: false, defeated: true, currentHealth: 0 };
    }

    const effectiveDamage = Math.max(0, amount);
    this.health = Math.max(0, this.health - effectiveDamage);

    let transitionedToPhase2 = false;

    // Phase 2 transition check at 50% HP
    const phase2Threshold = this.maxHealth * MorwennaEncounter.PHASE_2_THRESHOLD_PCT;
    if (this.phase === 1 && this.health <= phase2Threshold && this.health > 0) {
      this.phase = 2;
      this.isTransitioning = true;
      transitionedToPhase2 = true;
    }

    if (this.health <= 0) {
      this.isDefeated = true;
      this.isTransitioning = false;
    }

    return {
      transitionedToPhase2,
      defeated: this.isDefeated,
      currentHealth: this.health
    };
  }

  public completePhase2Transition(): void {
    if (this.phase === 2) {
      this.isTransitioning = false;
    }
  }

  public claimRewards(inventory: Inventory, progression: Progression): MorwennaRewardResult {
    if (!this.isDefeated || this.rewardClaimed) {
      return { keyGranted: false, expAwarded: 0, gateOpened: false };
    }

    this.rewardClaimed = true;

    // Grant Crypt Key to inventory
    inventory.addItem({
      id: MorwennaEncounter.REWARD_KEY_ID,
      name: 'Llave de las Criptas de San Jude',
      description: 'Antigua llave forjada en hierro bendito. Abre la verja que conduce al camposanto y las catacumbas.',
      category: 'key_item',
      icon: '🗝️',
      quantity: 1,
      maxQuantity: 1,
      effectType: 'unlock_gate',
      effectValue: 1
    });

    // Grant 350 EXP to progression
    progression.addExp(MorwennaEncounter.VICTORY_EXP);

    return {
      keyGranted: true,
      expAwarded: MorwennaEncounter.VICTORY_EXP,
      gateOpened: true
    };
  }
}
