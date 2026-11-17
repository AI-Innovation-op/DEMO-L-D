import { describe, it, expect, beforeEach } from 'vitest';
import { GameSaveManager } from '../../src/infrastructure/storage/GameSaveManager';

describe('GameSaveManager Sanctuary Storage', () => {
  beforeEach(() => {
    GameSaveManager.clearSave();
  });

  it('should detect when no save exists', () => {
    expect(GameSaveManager.hasSave()).toBe(false);
    expect(GameSaveManager.loadGame()).toBeNull();
  });

  it('should save and retrieve full game state', () => {
    const success = GameSaveManager.saveGame({
      activeHero: 'thomas',
      health: 85,
      maxHealth: 100,
      posture: 40,
      maxPosture: 50,
      inventory: { items: [{ id: 'maiden_balm', quantity: 2 }] },
      progression: { currentExp: 140 },
      sanctuaryVisited: true
    });

    expect(success).toBe(true);
    expect(GameSaveManager.hasSave()).toBe(true);

    const loaded = GameSaveManager.loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.activeHero).toBe('thomas');
    expect(loaded?.health).toBe(85);
    expect(loaded?.progression.currentExp).toBe(140);
    expect(loaded?.sanctuaryVisited).toBe(true);
  });

  it('should clear save correctly', () => {
    GameSaveManager.saveGame({
      activeHero: 'khaterine',
      health: 90,
      maxHealth: 90,
      posture: 70,
      maxPosture: 70,
      inventory: {},
      progression: {},
      sanctuaryVisited: true
    });

    expect(GameSaveManager.hasSave()).toBe(true);
    GameSaveManager.clearSave();
    expect(GameSaveManager.hasSave()).toBe(false);
  });
});
