import { describe, it, expect, beforeEach } from 'vitest';
import { MorwennaEncounter } from '../../src/domain/encounters/MorwennaEncounter';
import { Inventory } from '../../src/domain/inventory/Inventory';
import { Progression } from '../../src/domain/progression/Progression';

describe('Mother Morwenna Encounter (H04 Solution)', () => {
  let encounter: MorwennaEncounter;
  let inventory: Inventory;
  let progression: Progression;

  beforeEach(() => {
    encounter = new MorwennaEncounter(280);
    inventory = new Inventory();
    progression = Progression.createDefault();
  });

  it('initializes in Phase 1 with 280 HP', () => {
    expect(encounter.phase).toBe(1);
    expect(encounter.health).toBe(280);
    expect(encounter.maxHealth).toBe(280);
    expect(encounter.isDefeated).toBe(false);
  });

  it('triggers Phase 2 transition when HP drops to or below 50% (<= 140 HP)', () => {
    // Deal 140 damage: health reaches 140/280 (50%)
    const res = encounter.takeDamage(140);
    expect(res.transitionedToPhase2).toBe(true);
    expect(encounter.phase).toBe(2);
    expect(encounter.isTransitioning).toBe(true);
    expect(encounter.health).toBe(140);

    // Further damage in phase 2 does not re-trigger transition
    const res2 = encounter.takeDamage(20);
    expect(res2.transitionedToPhase2).toBe(false);
    expect(encounter.phase).toBe(2);
    expect(encounter.health).toBe(120);
  });

  it('handles lethal hit and claims rewards idempotently', () => {
    // Drop directly to 0 HP
    const res = encounter.takeDamage(280);
    expect(res.defeated).toBe(true);
    expect(encounter.isDefeated).toBe(true);
    expect(encounter.health).toBe(0);

    // Initial claim
    const initialExp = progression.getExp();
    const rewards = encounter.claimRewards(inventory, progression);
    expect(rewards.keyGranted).toBe(true);
    expect(rewards.expAwarded).toBe(350);
    expect(rewards.gateOpened).toBe(true);

    expect(inventory.getItem(MorwennaEncounter.REWARD_KEY_ID)?.quantity).toBe(1);
    expect(progression.getExp()).toBe(initialExp + 350);

    // Second claim attempt must be rejected (idempotent reward ledger)
    const rewards2 = encounter.claimRewards(inventory, progression);
    expect(rewards2.keyGranted).toBe(false);
    expect(rewards2.expAwarded).toBe(0);
    expect(inventory.getItem(MorwennaEncounter.REWARD_KEY_ID)?.quantity).toBe(1);
  });
});
