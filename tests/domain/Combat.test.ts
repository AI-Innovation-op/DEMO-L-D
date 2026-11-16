import { describe, it, expect } from 'vitest';
import { Character } from '../../src/domain/character/Character';
import { CharacterState } from '../../src/domain/character/CharacterEnums';
import { Enemy } from '../../src/domain/enemy/Enemy';
import { Boss, BossPhaseType } from '../../src/domain/boss/Boss';
import { Vector2 } from '../../src/domain/shared/Vector2';
import { CombatUseCases } from '../../src/application/usecases/CombatUseCases';
import { FinisherStyle } from '../../src/domain/combat/CombatTypes';

describe('Domain: Character & Stats', () => {
  it('creates Thomas with high agility and lower defense', () => {
    const thomas = Character.createThomas();
    expect(thomas.name).toBe('Thomas');
    expect(thomas.stats.speed).toBe(220);
    expect(thomas.stats.isVulnerableToHeavyHits).toBe(true);
    expect(thomas.disarmManager.getCurrentWeapon().id).toBe('short_sword');
  });

  it('creates Khaterine with high durability and ranged weapon', () => {
    const khaterine = Character.createKhaterine();
    expect(khaterine.name).toBe('Khaterine');
    expect(khaterine.stats.defense).toBe(18);
    expect(khaterine.stats.speed).toBe(160);
    expect(khaterine.disarmManager.getCurrentWeapon().category).toBe('RANGED');
  });
});

describe('Domain: Disarm Mechanics (Option A & Option B)', () => {
  it('Option A (Tactical Crisis): Heavy hit breaks guard and disarms Thomas', () => {
    const thomas = Character.createThomas();
    thomas.startBlock();
    expect(thomas.state).toBe(CharacterState.BLOCKING);

    // Heavy hit breaks posture and triggers tactical crisis
    thomas.takeHit(50, true);

    expect(thomas.state).toBe(CharacterState.STUNNED);
    expect(thomas.disarmManager.isPlayerDisarmed()).toBe(true);
    expect(thomas.disarmManager.getCurrentWeapon().id).toBe('improvised_fists');
    expect(thomas.disarmManager.getDroppedWeapons().length).toBe(1);
  });

  it('Option B (Voluntary Throw): Player throws weapon to stun and fights with fists', () => {
    const thomas = Character.createThomas();
    expect(thomas.disarmManager.isPlayerDisarmed()).toBe(false);

    const thrown = thomas.throwEquippedWeapon();
    expect(thrown).toBe(true);
    expect(thomas.disarmManager.isPlayerDisarmed()).toBe(true);
    expect(thomas.disarmManager.getCurrentWeapon().id).toBe('improvised_fists');

    const dropped = thomas.disarmManager.getDroppedWeapons();
    expect(dropped.length).toBe(1);
    expect(dropped[0].isPlayerPrimary).toBe(true);
  });

  it('Recovers primary weapon when picking it up from ground', () => {
    const thomas = Character.createThomas();
    thomas.throwEquippedWeapon();
    expect(thomas.disarmManager.isPlayerDisarmed()).toBe(true);

    const dropped = thomas.disarmManager.getDroppedWeapons()[0];
    // Move Thomas to weapon position
    thomas.position = dropped.position;

    const pickedUp = thomas.tryPickupNearbyWeapon();
    expect(pickedUp).toBe(true);
    expect(thomas.disarmManager.isPlayerDisarmed()).toBe(false);
    expect(thomas.disarmManager.getCurrentWeapon().id).toBe('short_sword');
  });
});

describe('Domain: Combat, Combos & Finishers', () => {
  it('increments combo count and scales damage multiplier', () => {
    const thomas = Character.createThomas();
    const enemy = Enemy.createAshProwler('ash_1', new Vector2(100, 260));

    const res1 = CombatUseCases.executeAttackOnEnemy(thomas, enemy);
    expect(res1.comboCount).toBe(1);

    const res2 = CombatUseCases.executeAttackOnEnemy(thomas, enemy);
    expect(res2.comboCount).toBe(2);
    expect(res2.damageDealt).toBeGreaterThan(0);
  });

  it('triggers cinematic combo finisher when posture is broken and health is low', () => {
    const thomas = Character.createThomas();
    const enemy = Enemy.createAshProwler('ash_2', new Vector2(100, 260));

    // Reduce enemy health to low threshold and break posture
    enemy.health = 10;
    enemy.posture = 0;

    const style = thomas.comboSystem.evaluateFinisher(enemy.health, enemy.maxHealth, enemy.posture);
    expect(style).toBe(FinisherStyle.CINEMATIC_COMBO);
  });
});

describe('Domain: Boss Mechanics & Rex Malphas Combat', () => {
  it('Rex Malphas transitions to Phase 2 at 50% HP and is defeated at 0% HP', () => {
    const malphas = Boss.createRexMalphas();
    expect(malphas.phase).toBe(BossPhaseType.PHASE_1);

    // Hit to 50%
    malphas.takeDamage(260);
    expect(malphas.phase).toBe(BossPhaseType.PHASE_2);

    // Hit remaining HP to 0% -> Defeated
    const res = malphas.takeDamage(300);
    expect(malphas.health).toBe(0);
    expect(res.actualDamage).toBe(300);
  });

  it('Madre Morwenna transitions to Phase 2 at 50% HP', () => {
    const morwenna = Boss.createMadreMorwenna();
    expect(morwenna.phase).toBe(BossPhaseType.PHASE_1);

    // 350 max HP -> 50% is 175
    morwenna.takeDamage(180);
    expect(morwenna.phase).toBe(BossPhaseType.PHASE_2);
  });

  it('Madre Morwenna Flame Shield mitigates ranged damage and is broken by heavy melee strike', () => {
    const morwenna = Boss.createMadreMorwenna();
    morwenna.activateFlameShield(80);
    expect(morwenna.isFlameShieldActive).toBe(true);

    const khaterine = Character.createKhaterine();
    // Ranged attack against shield is mitigated
    const rangedRes = CombatUseCases.executeAttackOnBoss(khaterine, morwenna, false, true);
    expect(rangedRes.hitTarget).toBe(true);
    expect(morwenna.isFlameShieldActive).toBe(true); // Still active

    const thomas = Character.createThomas();
    // Heavy melee strike shatters the flame shield
    const heavyRes = CombatUseCases.executeAttackOnBoss(thomas, morwenna, true, false);
    expect(heavyRes.hitTarget).toBe(true);
    expect(morwenna.isFlameShieldActive).toBe(false); // Shattered!
  });
});

describe('Domain: Enemy Combat Telegraphed Wind-up & Recovery', () => {
  it('handles wind-up countdown, triggers strike, and enters recovery', () => {
    const enemy = Enemy.createAshProwler('ash_t', new Vector2(100, 260));
    enemy.startWindup(400);

    expect(enemy.state).toBe('WINDUP');
    expect(enemy.windupTimer).toBe(400);

    // Advance 200ms -> Still in windup
    const midUpdate = enemy.updateCombatTimers(200);
    expect(midUpdate.shouldStrike).toBe(false);
    expect(enemy.state).toBe('WINDUP');

    // Advance 200ms -> Reaches 0, strikes!
    const strikeUpdate = enemy.updateCombatTimers(200);
    expect(strikeUpdate.shouldStrike).toBe(true);
    expect(enemy.state).toBe('ATTACKING');

    // Enter recovery
    enemy.startRecovery(350);
    expect(enemy.state).toBe('RECOVERY');

    // Advance recovery to completion
    const recUpdate = enemy.updateCombatTimers(350);
    expect(recUpdate.recoveryEnded).toBe(true);
    expect(enemy.state).toBe('IDLE');
  });

  it('interrupts attack wind-up and stuns enemy upon parry', () => {
    const enemy = Enemy.createFanaticMonk('monk_t', new Vector2(100, 260));
    enemy.startWindup(500);
    expect(enemy.state).toBe('WINDUP');

    // Player parries -> Interrupt!
    enemy.interruptAttack(800);
    expect(enemy.state).toBe('STUNNED');
    expect(enemy.windupTimer).toBe(0);
    expect(enemy.stunTimer).toBe(800);

    // Stun expires
    const stunUpdate = enemy.updateCombatTimers(800);
    expect(stunUpdate.stunEnded).toBe(true);
    expect(enemy.state).toBe('IDLE');
  });
});
