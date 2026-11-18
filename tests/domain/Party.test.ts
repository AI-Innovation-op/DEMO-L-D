import { describe, it, expect, beforeEach } from 'vitest';
import { Party } from '../../src/domain/party/Party';

describe('Party & Hero Combat State (H01 & H16 Solution)', () => {
  let party: Party;

  beforeEach(() => {
    party = new Party('thomas');
  });

  it('initializes Thomas and Khaterine with separate independent stats', () => {
    const thomas = party.getHero('thomas');
    const khaterine = party.getHero('khaterine');

    expect(party.getActiveHeroId()).toBe('thomas');
    expect(thomas.health).toBe(100);
    expect(party.getMaxHealth('thomas')).toBe(100);
    expect(thomas.posture).toBe(0);
    expect(party.getMaxPosture('thomas')).toBe(50);
    expect(thomas.isArmed).toBe(true);

    expect(khaterine.health).toBe(90);
    expect(party.getMaxHealth('khaterine')).toBe(90);
    expect(khaterine.posture).toBe(0);
    expect(party.getMaxPosture('khaterine')).toBe(70);
    expect(khaterine.isArmed).toBe(true);
  });

  it('H01 FIX: Switching heroes does not damage Thomas or reset posture', () => {
    // 1. Initial: Thomas 100/100
    expect(party.getActiveHero().health).toBe(100);

    // 2. Switch to Khaterine
    const now = 1000;
    const switchedToK = party.switchHero('khaterine', now);
    expect(switchedToK).toBe(true);
    expect(party.getActiveHeroId()).toBe('khaterine');
    expect(party.getActiveHero().health).toBe(90);

    // 3. Switch back to Thomas after cooldown
    const switchedBack = party.switchHero('thomas', now + 800);
    expect(switchedBack).toBe(true);
    expect(party.getActiveHeroId()).toBe('thomas');
    // Thomas must strictly remain at 100 HP, NOT reduced to 90!
    expect(party.getActiveHero().health).toBe(100);
  });

  it('H01 FIX: Damage and posture are preserved independently across switches', () => {
    // Damage Thomas down to 73 HP and give him 30 posture
    party.applyDamage(27, 30);
    expect(party.getActiveHero().health).toBe(73);
    expect(party.getActiveHero().posture).toBe(30);

    // Switch to Khaterine at t=1000
    party.switchHero('khaterine', 1000);
    expect(party.getActiveHero().health).toBe(90);
    expect(party.getActiveHero().posture).toBe(0);

    // Damage Khaterine down to 60 HP
    party.applyDamage(30, 15);
    expect(party.getActiveHero().health).toBe(60);
    expect(party.getActiveHero().posture).toBe(15);

    // Switch back to Thomas at t=2000
    party.switchHero('thomas', 2000);
    expect(party.getActiveHeroId()).toBe('thomas');
    // Thomas still has 73 HP and 30 posture!
    expect(party.getActiveHero().health).toBe(73);
    expect(party.getActiveHero().posture).toBe(30);

    // Switch back to Khaterine at t=3000
    party.switchHero('khaterine', 3000);
    expect(party.getActiveHero().health).toBe(60);
    expect(party.getActiveHero().posture).toBe(15);
  });

  it('H01 FIX: Disarmed state for Thomas is retained when switching back', () => {
    // Thomas throws sword and is disarmed
    party.setArmed(false);
    expect(party.getHero('thomas').isArmed).toBe(false);

    // Switch to Khaterine (armed with bow)
    party.switchHero('khaterine', 1000);
    expect(party.getActiveHero().isArmed).toBe(true);

    // Switch back to Thomas
    party.switchHero('thomas', 2000);
    // Thomas must remain disarmed until he recovers his sword!
    expect(party.getActiveHero().isArmed).toBe(false);
  });

  it('enforces switch cooldown to prevent rapid spamming', () => {
    const switched = party.switchHero('khaterine', 1000, 700);
    expect(switched).toBe(true);

    // Immediate attempt at t=1200 (< 1700ms) should be rejected
    const check = party.canSwitch('thomas', 1200);
    expect(check.ok).toBe(false);
    expect(check.reason).toBe('cooldown');
    expect(party.switchHero('thomas', 1200)).toBe(false);

    // Attempt at t=1750 (>= 1700ms) should succeed
    expect(party.switchHero('thomas', 1750)).toBe(true);
    expect(party.getActiveHeroId()).toBe('thomas');
  });

  it('does not allow switching to a defeated hero', () => {
    // Defeat Khaterine
    party.applyDamage(100, 0, 'khaterine');
    expect(party.getHero('khaterine').health).toBe(0);
    expect(party.getHero('khaterine').action).toBe('defeated');

    const check = party.canSwitch('khaterine', 1000);
    expect(check.ok).toBe(false);
    expect(check.reason).toBe('dead');
    expect(party.switchHero('khaterine', 1000)).toBe(false);
  });

  it('H16 FIX: Checkpoint revive applies correct individual maximums', () => {
    party.applyDamage(50, 20, 'thomas');
    party.applyDamage(80, 50, 'khaterine');

    // Revive at checkpoint
    party.reviveHeroAtCheckpoint('thomas', 25); // e.g. +25 from talent
    expect(party.getHero('thomas').health).toBe(125);
    expect(party.getHero('thomas').posture).toBe(0);

    party.reviveHeroAtCheckpoint('khaterine', 0);
    // Khaterine must revive to 90, NOT hardcoded 100!
    expect(party.getHero('khaterine').health).toBe(90);
    expect(party.getHero('khaterine').posture).toBe(0);
  });

  it('serializes and deserializes party state accurately', () => {
    party.applyDamage(20, 10, 'thomas');
    party.setArmed(false, 'thomas');
    party.applyDamage(15, 5, 'khaterine');
    party.switchHero('khaterine', 1000);

    const serialized = party.serialize();
    const newParty = new Party('thomas');
    newParty.deserialize(serialized);

    expect(newParty.getActiveHeroId()).toBe('khaterine');
    expect(newParty.getHero('thomas').health).toBe(80);
    expect(newParty.getHero('thomas').posture).toBe(10);
    expect(newParty.getHero('thomas').isArmed).toBe(false);
    expect(newParty.getHero('khaterine').health).toBe(75);
    expect(newParty.getHero('khaterine').posture).toBe(5);
  });
});
