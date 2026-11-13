import { CharacterId, CharacterState, Gender } from './CharacterEnums';
import { CharacterStats } from './CharacterStats';
import { LevelUpProgress } from './LevelUpProgress';
import { DisarmManager } from '../combat/DisarmManager';
import { ComboSystem } from '../combat/ComboSystem';
import { Weapon } from '../weapon/Weapon';
import { Vector2 } from '../shared/Vector2';
import { DomainEvent, EventBus } from '../shared/DomainEvent';

export class CharacterDamagedEvent implements DomainEvent {
  public readonly eventName = 'CharacterDamaged';
  public readonly occurredOn = new Date();
  constructor(
    public readonly characterId: CharacterId,
    public readonly damageTaken: number,
    public readonly remainingHealth: number
  ) {}
}

export class CharacterDiedEvent implements DomainEvent {
  public readonly eventName = 'CharacterDied';
  public readonly occurredOn = new Date();
  constructor(public readonly characterId: CharacterId) {}
}

export class Character {
  public state: CharacterState = CharacterState.IDLE;
  public position: Vector2;
  public facingDirection: number = 1; // 1 = right, -1 = left
  public readonly levelUp: LevelUpProgress;
  public readonly disarmManager: DisarmManager;
  public readonly comboSystem: ComboSystem;

  constructor(
    public readonly id: CharacterId,
    public readonly name: string,
    public readonly gender: Gender,
    public readonly stats: CharacterStats,
    initialWeapon: Weapon,
    initialPosition: Vector2 = new Vector2(100, 260)
  ) {
    this.position = initialPosition;
    this.levelUp = new LevelUpProgress();
    this.disarmManager = new DisarmManager(initialWeapon);
    this.comboSystem = new ComboSystem();
  }

  public static createThomas(): Character {
    return new Character(
      'thomas',
      'Thomas',
      Gender.MALE,
      CharacterStats.createThomas(),
      Weapon.createShortSword(),
      new Vector2(80, 260)
    );
  }

  public static createKhaterine(): Character {
    return new Character(
      'khaterine',
      'Khaterine',
      Gender.FEMALE,
      CharacterStats.createKhaterine(),
      Weapon.createKhaterineBow(),
      new Vector2(80, 260)
    );
  }

  public heal(amount: number): void {
    this.stats.heal(amount);
  }

  public move(dx: number, dy: number = 0): void {
    if (this.state === CharacterState.STUNNED || this.state === CharacterState.DEAD) {
      return;
    }
    if (dx !== 0) {
      this.facingDirection = dx > 0 ? 1 : -1;
    }
    if (dx !== 0 || dy !== 0) {
      if (this.state === CharacterState.IDLE) {
        this.state = CharacterState.RUNNING;
      }
    } else if (this.state === CharacterState.RUNNING) {
      this.state = CharacterState.IDLE;
    }
  }

  public jump(): boolean {
    if (this.state === CharacterState.IDLE || this.state === CharacterState.RUNNING) {
      this.state = CharacterState.JUMPING;
      return true;
    }
    return false;
  }

  public land(): void {
    if (this.state === CharacterState.JUMPING) {
      this.state = CharacterState.IDLE;
    }
  }

  public startBlock(): boolean {
    if (this.state === CharacterState.IDLE || this.state === CharacterState.RUNNING) {
      this.state = CharacterState.BLOCKING;
      return true;
    }
    return false;
  }

  public stopBlock(): void {
    if (this.state === CharacterState.BLOCKING) {
      this.state = CharacterState.IDLE;
    }
  }

  public startDodge(): boolean {
    if (this.state !== CharacterState.STUNNED && this.state !== CharacterState.DEAD) {
      this.state = CharacterState.DODGING;
      return true;
    }
    return false;
  }

  public finishDodge(): void {
    if (this.state === CharacterState.DODGING) {
      this.state = CharacterState.IDLE;
    }
  }

  public executeAttack(): { weapon: Weapon; damage: number; multiplier: number } | null {
    if (this.state === CharacterState.STUNNED || this.state === CharacterState.DEAD) {
      return null;
    }

    this.state = CharacterState.ATTACKING;
    const currentWeapon = this.disarmManager.getCurrentWeapon();
    this.comboSystem.registerHit();
    const multiplier = this.comboSystem.getDamageMultiplier();

    const totalDamage = Math.round(
      (this.stats.attackPower + currentWeapon.baseDamage) * multiplier
    );

    // Consume durability if temporary
    this.disarmManager.consumeWeaponUse();

    return {
      weapon: currentWeapon,
      damage: totalDamage,
      multiplier
    };
  }

  public finishAttack(): void {
    if (this.state === CharacterState.ATTACKING) {
      this.state = CharacterState.IDLE;
    }
  }

  public takeHit(amount: number, isHeavyAttack: boolean = false): void {
    if (this.state === CharacterState.DODGING || this.state === CharacterState.DEAD) {
      return; // Invulnerable while dodging
    }

    if (this.state === CharacterState.BLOCKING) {
      // Blocking reduces damage and takes posture hit
      const postureBroken = this.stats.damagePosture(amount * 1.5);
      const reducedDamage = Math.max(1, Math.round(amount * 0.25));
      this.stats.takeDamage(reducedDamage);

      if (postureBroken || (isHeavyAttack && this.stats.isVulnerableToHeavyHits)) {
        // Guard broken! Tactical Crisis disarm
        this.state = CharacterState.STUNNED;
        this.disarmManager.triggerTacticalCrisis(this.position);
      }
      return;
    }

    // Direct hit!
    const effectiveDamage = this.stats.takeDamage(amount);
    EventBus.getInstance().publish(
      new CharacterDamagedEvent(this.id, effectiveDamage, this.stats.health)
    );

    // Heavy attack on fragile Thomas can disarm him directly
    if (isHeavyAttack && this.stats.isVulnerableToHeavyHits) {
      this.disarmManager.triggerTacticalCrisis(this.position);
    }

    if (!this.stats.isAlive()) {
      this.state = CharacterState.DEAD;
      EventBus.getInstance().publish(new CharacterDiedEvent(this.id));
    }
  }

  public throwEquippedWeapon(): boolean {
    if (this.state === CharacterState.STUNNED || this.state === CharacterState.DEAD) {
      return false;
    }
    const thrown = this.disarmManager.throwWeapon(this.position, this.facingDirection);
    return thrown !== null;
  }

  public tryPickupNearbyWeapon(): boolean {
    return this.disarmManager.tryPickupNearby(this.position);
  }

  public gainExperience(amount: number): boolean {
    return this.levelUp.addExp(amount);
  }
}
