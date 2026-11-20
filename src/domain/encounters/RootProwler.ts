import { Inventory } from '../inventory/Inventory';
import { Progression } from '../progression/Progression';

export type RootProwlerState =
  | 'PATROL'
  | 'ALERT'
  | 'CHASE'
  | 'WINDUP'
  | 'ATTACK'
  | 'RECOVERY'
  | 'STUNNED'
  | 'DEAD';

export class RootProwler {
  public static readonly BASE_MAX_HEALTH = 140;
  public static readonly CLAW_DAMAGE = 22;
  public static readonly POUNCE_DAMAGE = 32;
  public static readonly EXP_REWARD = 90;
  public static readonly ITEM_ESSENCE = 'essence_black_willow';
  public static readonly ITEM_SILVERLEAF = 'herb_silverleaf';

  private _health: number = RootProwler.BASE_MAX_HEALTH;
  private _maxHealth: number = RootProwler.BASE_MAX_HEALTH;
  private _state: RootProwlerState = 'PATROL';
  private _rewardsClaimed: boolean = false;

  public get health(): number {
    return this._health;
  }

  public get maxHealth(): number {
    return this._maxHealth;
  }

  public get state(): RootProwlerState {
    return this._state;
  }

  public get isDefeated(): boolean {
    return this._health <= 0 || this._state === 'DEAD';
  }

  public setState(newState: RootProwlerState): void {
    this._state = newState;
    if (newState === 'DEAD') {
      this._health = 0;
    }
  }

  /**
   * Applies damage to the Root Prowler.
   * If the attack is fire-based (Fuego Fatuo or Flask), it deals 50% bonus damage.
   */
  public takeDamage(amount: number, isFire: boolean = false): {
    actualDamage: number;
    isVulnerable: boolean;
    defeated: boolean;
  } {
    if (this.isDefeated) {
      return { actualDamage: 0, isVulnerable: false, defeated: true };
    }

    const actualDamage = isFire ? Math.round(amount * 1.5) : amount;
    this._health = Math.max(0, this._health - actualDamage);
    const defeated = this._health === 0;

    if (defeated) {
      this._state = 'DEAD';
    }

    return {
      actualDamage,
      isVulnerable: isFire,
      defeated
    };
  }

  /**
   * Evaluates melee claw or lunging pounce attack against player.
   */
  public evaluateAttack(
    distanceToPlayer: number,
    isPlayerDodging: boolean,
    isPounce: boolean = false
  ): { hit: boolean; damage: number } {
    if (this.isDefeated || isPlayerDodging) {
      return { hit: false, damage: 0 };
    }

    const maxDist = isPounce ? 3.2 : 2.0;
    if (distanceToPlayer <= maxDist) {
      const damage = isPounce ? RootProwler.POUNCE_DAMAGE : RootProwler.CLAW_DAMAGE;
      return { hit: true, damage };
    }

    return { hit: false, damage: 0 };
  }

  /**
   * Claims rewards upon defeat (EXP + Essence + Silverleaf).
   */
  public claimRewards(
    inventory: Inventory,
    progression: Progression
  ): { claimed: boolean; expAwarded: number } {
    if (!this.isDefeated || this._rewardsClaimed) {
      return { claimed: false, expAwarded: 0 };
    }

    this._rewardsClaimed = true;
    progression.addExp(RootProwler.EXP_REWARD);

    inventory.addItem({
      id: RootProwler.ITEM_ESSENCE,
      name: 'Esencia del Sauce Negro',
      description: 'Savia densa y violácea extraída de las raíces ancestrales del aquelarre.',
      category: 'material',
      icon: '🔮',
      quantity: 1,
      maxQuantity: 20,
      effectType: 'none',
      effectValue: 0
    });

    inventory.addItem({
      id: RootProwler.ITEM_SILVERLEAF,
      name: 'Hoja de Plata',
      description: 'Hierba medicinal consagrada con propiedades purificadoras.',
      category: 'material',
      icon: '🍃',
      quantity: 2,
      maxQuantity: 20,
      effectType: 'none',
      effectValue: 0
    });

    return { claimed: true, expAwarded: RootProwler.EXP_REWARD };
  }
}
