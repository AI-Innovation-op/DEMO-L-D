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
});
