import { Character } from '../../domain/character/Character';
import { Enemy } from '../../domain/enemy/Enemy';
import { Boss } from '../../domain/boss/Boss';
import { FinisherStyle, FinisherTriggeredEvent } from '../../domain/combat/CombatTypes';
import { EventBus } from '../../domain/shared/DomainEvent';

export class AttackResult {
  constructor(
    public readonly hitTarget: boolean,
    public readonly damageDealt: number,
    public readonly comboCount: number,
    public readonly finisherStyle: FinisherStyle,
    public readonly targetKilled: boolean,
    public readonly droppedEnemyWeapon: boolean
  ) {}
}

export class CombatUseCases {
  /**
   * Execute Player Attack against an enemy.
   */
  public static executeAttackOnEnemy(player: Character, enemy: Enemy, isHeavy: boolean = false): AttackResult {
    const attackInfo = player.executeAttack();
    if (!attackInfo) {
      return new AttackResult(false, 0, 0, FinisherStyle.NONE, false, false);
    }

    const { damage, multiplier } = attackInfo;
    const baseDamage = Math.max(1, damage);
    const effectiveDamage = isHeavy ? Math.round(baseDamage * 1.45) : baseDamage;

    // Apply exact damage to enemy health
    enemy.takeDamage(effectiveDamage);

    // Apply posture damage (heavy attacks crack posture quickly to open [E] Finishers!)
    const postureDamage = Math.round((isHeavy ? 38 : 18) * multiplier);
    const postureBroken = enemy.damagePosture(postureDamage);

    let finisherStyle = FinisherStyle.NONE;
    if (postureBroken || enemy.posture === 0) {
      finisherStyle = player.comboSystem.evaluateFinisher(
        enemy.health,
        enemy.maxHealth,
        enemy.posture
      );

      if (finisherStyle !== FinisherStyle.NONE) {
        EventBus.getInstance().publish(
          new FinisherTriggeredEvent(enemy.id, finisherStyle, effectiveDamage * 1.5)
        );
      }
    }

    const targetKilled = !enemy.isAlive();
    let droppedEnemyWeapon = false;

    if (targetKilled) {
      // Reward experience for defeat
      player.gainExperience(35);
      // Spawn temporary dropped weapon on ground
      player.disarmManager.spawnEnemyDroppedWeapon(enemy.position);
      droppedEnemyWeapon = true;
    }

    return new AttackResult(
      true,
      effectiveDamage,
      player.comboSystem.getComboCount(),
      finisherStyle,
      targetKilled,
      droppedEnemyWeapon
    );
  }

  /**
   * Execute Player Attack against a Boss.
   */
  public static executeAttackOnBoss(
    player: Character,
    boss: Boss,
    isHeavy: boolean = false,
    isRanged: boolean = false
  ): AttackResult {
    const attackInfo = player.executeAttack();
    if (!attackInfo) {
      return new AttackResult(false, 0, 0, FinisherStyle.NONE, false, false);
    }

    const { damage } = attackInfo;
    let effectiveDamage = isHeavy ? Math.round(damage * 1.45) : damage;

    // Boss Flame Shield mechanic (mitigates ranged spam, broken by heavy melee)
    if (boss.isFlameShieldActive) {
      if (isHeavy) {
        boss.damageFlameShield(100);
      } else if (isRanged) {
        effectiveDamage = Math.max(1, Math.round(effectiveDamage * 0.3));
        boss.damageFlameShield(15);
      } else {
        effectiveDamage = Math.max(1, Math.round(effectiveDamage * 0.6));
        boss.damageFlameShield(25);
      }
    }

    const { actualDamage } = boss.takeDamage(effectiveDamage);
    boss.damagePosture(isHeavy ? 30 : 14);

    const targetKilled = boss.health <= 0 && boss.phase !== 'PHASE_3_UNBEATABLE';
    if (targetKilled) {
      player.gainExperience(100);
    }

    return new AttackResult(
      true,
      actualDamage,
      player.comboSystem.getComboCount(),
      FinisherStyle.NONE,
      targetKilled,
      false
    );
  }

  /**
   * Enemy hits Player.
   */
  public static executeEnemyAttack(
    enemy: Enemy,
    player: Character,
    isHeavyAttack: boolean = false
  ): { absorbedByGuard: number; damageToHealth: number } {
    if (!enemy.isAlive()) return { absorbedByGuard: 0, damageToHealth: 0 };
    return player.takeHit(enemy.attackPower, isHeavyAttack);
  }

  /**
   * Voluntary Throw Weapon (Option B).
   */
  public static throwEquippedWeapon(player: Character): boolean {
    return player.throwEquippedWeapon();
  }

  /**
   * Pickup Weapon from Ground.
   */
  public static pickupNearbyWeapon(player: Character): boolean {
    return player.tryPickupNearbyWeapon();
  }

  /**
   * Execute Finisher Combo.
   */
  public static triggerFinisher(player: Character, enemy: Enemy, style: FinisherStyle): number {
    const bonusDamage = style === FinisherStyle.CINEMATIC_COMBO ? 120 : 60;
    enemy.takeDamage(bonusDamage);
    if (!enemy.isAlive()) {
      player.gainExperience(50);
      player.disarmManager.spawnEnemyDroppedWeapon(enemy.position);
    }
    return bonusDamage;
  }
}
