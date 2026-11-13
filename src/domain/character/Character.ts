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

  public takeHit(amount: number, isHeavyAttack: boolean = false): { absorbedByGuard: number; damageToHealth: number } {
    if (this.state === CharacterState.DODGING || this.state === CharacterState.DEAD) {
      return { absorbedByGuard: 0, damageToHealth: 0 }; // Invulnerable while dodging
    }

    let absorbedByGuard = 0;
    let damageToHealth = 0;

    if (this.state === CharacterState.BLOCKING) {
      // Actively blocking with [L]: posture absorbs incoming attack with high efficiency
      const blockDamage = Math.max(1, Math.round(amount * 0.7));
      if (this.stats.posture > 0) {
        absorbedByGuard = Math.min(this.stats.posture, blockDamage);
        const postureBroken = this.stats.damagePosture(blockDamage);

        if (postureBroken || (isHeavyAttack && this.stats.isVulnerableToHeavyHits)) {
          // Posture broken or heavy attack crisis!
          damageToHealth = Math.max(1, Math.round(blockDamage * 0.3));
          this.stats.takeDamage(damageToHealth);
          this.state = CharacterState.STUNNED;
          this.disarmManager.triggerTacticalCrisis(this.position);
        }
      } else {
        // Posture is 0: takes chip damage
        damageToHealth = this.stats.takeDamage(Math.round(amount * 0.4));
      }
    } else {
      // Normal hit: GUARDIA (Armadura/Escudo) absorbs damage FIRST!
      if (this.stats.posture > 0) {
        if (this.stats.posture >= amount) {
          // Fully absorbed by Guardia! Health is 100% protected!
          absorbedByGuard = amount;
          this.stats.damagePosture(amount);
          damageToHealth = 0;
        } else {
          // Guardia is broken, overflow hits health
          absorbedByGuard = this.stats.posture;
          const overflow = amount - this.stats.posture;
          this.stats.damagePosture(absorbedByGuard); // sets posture to 0
          damageToHealth = this.stats.takeDamage(overflow);
        }
      } else {
        // Guardia is 0: Full direct damage to health
        damageToHealth = this.stats.takeDamage(amount);
      }

      // Heavy attack on fragile Thomas can disarm him if guard breaks
      if (isHeavyAttack && this.stats.isVulnerableToHeavyHits && this.stats.posture === 0) {
        this.state = CharacterState.STUNNED;
        this.disarmManager.triggerTacticalCrisis(this.position);
      }
    }

    if (damageToHealth > 0) {
      EventBus.getInstance().publish(
        new CharacterDamagedEvent(this.id, damageToHealth, this.stats.health)
      );
    }

    if (!this.stats.isAlive()) {
      this.state = CharacterState.DEAD;
      EventBus.getInstance().publish(new CharacterDiedEvent(this.id));
    }

    return { absorbedByGuard, damageToHealth };
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
