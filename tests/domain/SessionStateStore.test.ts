import { describe, it, expect, beforeEach } from 'vitest';
import { SessionStateStore } from '../../src/domain/save/SessionStateStore';
import { Character } from '../../src/domain/character/Character';
import { Weapon } from '../../src/domain/weapon/Weapon';

describe('Domain: SessionStateStore (Partida y Continuidad)', () => {
  let store: SessionStateStore;

  beforeEach(() => {
    store = SessionStateStore.getInstance();
    store.resetToDefaults('thomas', 1);
  });

  it('initializes with default level 1 stats for Thomas and Khaterine', () => {
    expect(store.currentAct).toBe(1);
    expect(store.leaderId).toBe('thomas');
    expect(store.characters.thomas.level).toBe(1);
    expect(store.characters.thomas.currentExp).toBe(0);
    expect(store.characters.khaterine.level).toBe(1);
  });

  it('preserves Level, EXP and weapons across scene transitions (e.g. Khaterine Lv 2 with 35 EXP)', () => {
    // Simulate playing as Khaterine in Act 1
    const khaterine = Character.createKhaterine();
    // Gain 100 EXP -> Level 2
    khaterine.gainExperience(100);
    expect(khaterine.levelUp.level).toBe(2);
    expect(khaterine.levelUp.currentExp).toBe(0);
    expect(khaterine.levelUp.maxExp).toBe(125);

    // Gain 35 more EXP -> 35/125
    khaterine.gainExperience(35);
    expect(khaterine.levelUp.currentExp).toBe(35);

    // Equip Lamento de Oakhaven
    khaterine.disarmManager.setEquippedPrimary(Weapon.createLamentoOakhaven());

    // Save session at end of Act 1
    const thomas = Character.createThomas();
    store.saveSession(khaterine, thomas, 1);

    // Simulate Act 2 loading: fresh character instances created by game engine
    const newKhaterine = Character.createKhaterine();
    expect(newKhaterine.levelUp.level).toBe(1); // initially 1

    // Hydrate from SessionStateStore
    store.hydrateCharacter(newKhaterine, true);

    // Verify progress is preserved!
    expect(newKhaterine.levelUp.level).toBe(2);
    expect(newKhaterine.levelUp.currentExp).toBe(35);
    expect(newKhaterine.levelUp.maxExp).toBe(125);
    expect(newKhaterine.disarmManager.getCurrentWeapon().id).toBe('lamento_oakhaven');
    expect(newKhaterine.stats.health).toBe(newKhaterine.stats.maxHealth); // refilled vitals for new act
  });

  it('updates unlocked weapons list when acquiring a new weapon', () => {
    const thomas = Character.createThomas();
    thomas.disarmManager.setEquippedPrimary(Weapon.createColmilloSauce());

    store.saveCharacter(thomas);
    expect(store.unlockedWeaponIds).toContain('colmillo_sauce');
  });
});
