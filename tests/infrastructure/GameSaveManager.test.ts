import { describe, it, expect, beforeEach } from 'vitest';
import { GameSaveManager, SaveInput } from '../../src/infrastructure/storage/GameSaveManager';

describe('GameSaveManager V2 Storage (H02 & H03 Solution)', () => {
  beforeEach(() => {
    GameSaveManager.clearSave();
  });

  it('detects when no save exists', () => {
    expect(GameSaveManager.hasSave()).toBe(false);
    expect(GameSaveManager.loadGame()).toBeNull();
  });

  it('H02 FIX: saves and retrieves full game state including world progress and both heroes', () => {
    const saveInput: SaveInput = {
      activeHero: 'thomas',
      heroes: {
        thomas: { health: 73, posture: 20, isArmed: false, available: true },
        khaterine: { health: 90, posture: 0, isArmed: true, available: true }
      },
      health: 73,
      maxHealth: 100,
      posture: 20,
      maxPosture: 50,
      inventory: { items: [{ id: 'oakhaven_crypt_key', quantity: 1 }] },
      progression: { currentExp: 350 },
      sanctuaryVisited: true,
      world: {
        morwennaDefeated: true,
        morwennaPhase2: true,
        cemeteryGateOpen: true,
        checkpoint: { x: 0, y: 0, z: -25 },
        destroyedPropIds: ['prop_barrel_1', 'prop_gravestone_2']
      }
    };

    const success = GameSaveManager.saveGame(saveInput);
    expect(success).toBe(true);
    expect(GameSaveManager.hasSave()).toBe(true);

    const loaded = GameSaveManager.loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.schemaVersion).toBe(2);
    expect(loaded?.activeHero).toBe('thomas');
    expect(loaded?.heroes.thomas.health).toBe(73);
    expect(loaded?.heroes.thomas.isArmed).toBe(false);
    expect(loaded?.heroes.khaterine.health).toBe(90);

    // World state verification
    expect(loaded?.world.morwennaDefeated).toBe(true);
    expect(loaded?.world.cemeteryGateOpen).toBe(true);
    expect(loaded?.world.checkpoint.z).toBe(-25);
    expect(loaded?.world.destroyedPropIds).toContain('prop_gravestone_2');
  });

  it('H03 FIX: strictly preserves 0 health and 0 posture instead of discarding them as falsy', () => {
    const saveInput: SaveInput = {
      activeHero: 'khaterine',
      heroes: {
        thomas: { health: 0, posture: 50, isArmed: true, available: true },
        khaterine: { health: 0, posture: 0, isArmed: true, available: true }
      },
      health: 0,
      maxHealth: 90,
      posture: 0,
      maxPosture: 70,
      inventory: {},
      progression: {},
      sanctuaryVisited: true,
      world: {
        morwennaDefeated: false,
        morwennaPhase2: false,
        cemeteryGateOpen: false,
        checkpoint: { x: 0, y: 0, z: 4 },
        destroyedPropIds: []
      }
    };

    GameSaveManager.saveGame(saveInput);
    const loaded = GameSaveManager.loadGame();
    expect(loaded).not.toBeNull();
    // Must be 0, not defaulted to 100!
    expect(loaded?.health).toBe(0);
    expect(loaded?.posture).toBe(0);
    expect(loaded?.heroes.thomas.health).toBe(0);
    expect(loaded?.heroes.khaterine.health).toBe(0);
    expect(loaded?.heroes.khaterine.posture).toBe(0);
  });

  it('migrates legacy V1 save data to V2 transparently', () => {
    const legacyV1 = {
      activeHero: 'khaterine',
      health: 65,
      maxHealth: 90,
      posture: 15,
      maxPosture: 70,
      inventory: { items: [{ id: 'maiden_balm', quantity: 2 }] },
      progression: { currentExp: 100 },
      sanctuaryVisited: true
    };

    const migrated = GameSaveManager.migrateV1ToV2(legacyV1);
    expect(migrated).not.toBeNull();
    expect(migrated?.activeHero).toBe('khaterine');
    expect(migrated?.heroes.khaterine.health).toBe(65);
    expect(migrated?.heroes.thomas.health).toBe(100);
    expect(migrated?.world.cemeteryGateOpen).toBe(false);
  });
});
