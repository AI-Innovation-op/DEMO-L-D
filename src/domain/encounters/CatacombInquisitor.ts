import { Inventory } from '../inventory/Inventory';
import { Progression } from '../progression/Progression';

export type InquisitorState =
  | 'DORMANT'
  | 'PATROL'
  | 'ALERT'
  | 'CHASE'
  | 'MELEE_ATTACK'
  | 'SLAM_TELEGRAPH'
  | 'SLAM_IMPACT'
  | 'RECOVERY'
  | 'DEAD';

export interface InquisitorRewardResult {
  claimed: boolean;
  expAwarded: number;
  itemsGranted: string[];
}

export class CatacombInquisitor {
  public static readonly MAX_HEALTH = 180;
  public static readonly REWARD_EXP = 250;
  public static readonly SLAM_RADIUS = 3.8;
  public static readonly SLAM_DAMAGE = 30;
  public static readonly MELEE_DAMAGE = 22;

  public static readonly ITEM_SIGIL = 'inquisition_sigil';
  public static readonly ITEM_HOLY_WATER = 'water_blessed';
  public static readonly ITEM_PURIFIED_ASH = 'ash_purified';

  private _health: number;
  private _state: InquisitorState = 'DORMANT';
  private _isBlocking: boolean = true;
  private _rewardsClaimed: boolean = false;

  constructor(initialHealth: number = CatacombInquisitor.MAX_HEALTH) {
    this._health = Math.max(0, initialHealth);
    if (this._health === 0) {
      this._state = 'DEAD';
    }
  }

  public get health(): number {
    return this._health;
  }

  public get maxHealth(): number {
    return CatacombInquisitor.MAX_HEALTH;
  }

  public get state(): InquisitorState {
    return this._state;
  }

  public get isBlocking(): boolean {
    return this._isBlocking;
  }

  public set isBlocking(val: boolean) {
    this._isBlocking = val;
  }

  public get isDefeated(): boolean {
    return this._health <= 0 || this._state === 'DEAD';
  }

  public awaken(): void {
    if (this._state === 'DORMANT') {
      this._state = 'ALERT';
    }
  }

  public setState(newState: InquisitorState): void {
    this._state = newState;
    if (newState === 'DEAD') {
      this._health = 0;
    }
  }

  /**
   * Applies damage with optional frontal shield mitigation.
   * If blocking and hit is frontal, damage is reduced by 60%.
   */
  public takeDamage(amount: number, isFrontal: boolean = false): {
    actualDamage: number;
    blocked: boolean;
    defeated: boolean;
  } {
    if (this.isDefeated) {
      return { actualDamage: 0, blocked: false, defeated: true };
    }

    const blocked = this._isBlocking && isFrontal;
    const actualDamage = blocked ? Math.max(1, Math.round(amount * 0.4)) : amount;

    this._health = Math.max(0, this._health - actualDamage);
    const defeated = this._health === 0;

    if (defeated) {
      this._state = 'DEAD';
      this._isBlocking = false;
    }

    return { actualDamage, blocked, defeated };
  }

  /**
   * Evaluates if the ground slam hits an entity at a given distance.
   */
  public evaluateSlam(distanceToEntity: number, isEntityDodging: boolean): { hit: boolean; damage: number } {
    if (this.isDefeated || isEntityDodging) {
      return { hit: false, damage: 0 };
    }

    if (distanceToEntity <= CatacombInquisitor.SLAM_RADIUS) {
      return { hit: true, damage: CatacombInquisitor.SLAM_DAMAGE };
    }

    return { hit: false, damage: 0 };
  }

  /**
   * Claims rewards idempotently when defeated.
   */
  public claimRewards(inventory: Inventory, progression: Progression): InquisitorRewardResult {
    if (!this.isDefeated || this._rewardsClaimed) {
      return { claimed: false, expAwarded: 0, itemsGranted: [] };
    }

    this._rewardsClaimed = true;
    progression.addExp(CatacombInquisitor.REWARD_EXP);

    const itemsGranted: string[] = [];

    // Grant rare materials & inquisitor trophy
    inventory.addItem({
      id: CatacombInquisitor.ITEM_SIGIL,
      name: 'Sello de la Inquisición Caída',
      category: 'relic',
      quantity: 1,
      maxQuantity: 1,
      icon: '✝️',
      description: 'Emblema bendecido por el antiguo Santo Oficio de San Jude, grabado con el sol cruciforme.',
      effectType: 'none',
      effectValue: 0
    });
    itemsGranted.push(CatacombInquisitor.ITEM_SIGIL);

    inventory.addItem({
      id: CatacombInquisitor.ITEM_HOLY_WATER,
      name: 'Agua Bendita de San Jude',
      category: 'material',
      quantity: 2,
      maxQuantity: 20,
      icon: '💧',
      description: 'Agua destilada en pilas bautismales consagradas contra la ponzoña.',
      effectType: 'none',
      effectValue: 0
    });
    itemsGranted.push(CatacombInquisitor.ITEM_HOLY_WATER);

    inventory.addItem({
      id: CatacombInquisitor.ITEM_PURIFIED_ASH,
      name: 'Ceniza Purificada',
      category: 'material',
      quantity: 2,
      maxQuantity: 20,
      icon: '⚱️',
      description: 'Ceniza de la Gran Pira bendecida con oraciones fúnebres.',
      effectType: 'none',
      effectValue: 0
    });
    itemsGranted.push(CatacombInquisitor.ITEM_PURIFIED_ASH);

    return {
      claimed: true,
      expAwarded: CatacombInquisitor.REWARD_EXP,
      itemsGranted
    };
  }
}
