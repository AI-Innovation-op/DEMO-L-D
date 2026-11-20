import { describe, it, expect, beforeEach } from 'vitest';
import { RootProwler } from '../../src/domain/encounters/RootProwler';
import { Inventory, CANONICAL_WILLOW_RELIC } from '../../src/domain/inventory/Inventory';
import { Progression } from '../../src/domain/progression/Progression';

describe('RootProwler Domain Unit Tests', () => {
  let prowler: RootProwler;
  let inventory: Inventory;
  let progression: Progression;

  beforeEach(() => {
    prowler = new RootProwler();
    inventory = new Inventory();
    progression = new Progression();
  });

  it('initializes with canonical health, patrol state and full HP', () => {
    expect(prowler.health).toBe(140);
    expect(prowler.maxHealth).toBe(140);
    expect(prowler.state).toBe('PATROL');
    expect(prowler.isDefeated).toBe(false);
  });

  it('receives standard physical damage without vulnerability', () => {
    const res = prowler.takeDamage(30, false);
    expect(res.actualDamage).toBe(30);
    expect(res.isVulnerable).toBe(false);
    expect(prowler.health).toBe(110);
    expect(res.defeated).toBe(false);
  });

  it('receives 50% bonus damage from fire attacks (1.5x vulnerability)', () => {
    const res = prowler.takeDamage(40, true);
    expect(res.actualDamage).toBe(60);
    expect(res.isVulnerable).toBe(true);
    expect(prowler.health).toBe(80);
  });

  it('transitions to DEAD state when health reaches 0', () => {
    const res = prowler.takeDamage(150, false);
    expect(res.defeated).toBe(true);
    expect(prowler.health).toBe(0);
    expect(prowler.isDefeated).toBe(true);
    expect(prowler.state).toBe('DEAD');
  });

  it('evaluates claw attack within 2.0 meters', () => {
    const hitRes = prowler.evaluateAttack(1.8, false, false);
    expect(hitRes.hit).toBe(true);
    expect(hitRes.damage).toBe(RootProwler.CLAW_DAMAGE);

    const missRes = prowler.evaluateAttack(2.5, false, false);
    expect(missRes.hit).toBe(false);
    expect(missRes.damage).toBe(0);
  });

  it('evaluates pounce lunge attack within 3.2 meters', () => {
    const pounceRes = prowler.evaluateAttack(2.8, false, true);
    expect(pounceRes.hit).toBe(true);
    expect(pounceRes.damage).toBe(RootProwler.POUNCE_DAMAGE);
  });

  it('fails attack when player is dodging', () => {
    const dodgeRes = prowler.evaluateAttack(1.0, true, false);
    expect(dodgeRes.hit).toBe(false);
    expect(dodgeRes.damage).toBe(0);
  });

  it('cannot claim rewards if beast is alive', () => {
    const rewardRes = prowler.claimRewards(inventory, progression);
    expect(rewardRes.claimed).toBe(false);
    expect(rewardRes.expAwarded).toBe(0);
  });

  it('claims canonical EXP and items (essence + silverleaf) upon defeat', () => {
    prowler.takeDamage(150, true);
    expect(prowler.isDefeated).toBe(true);

    const initialExp = progression.getExp();
    const rewardRes = prowler.claimRewards(inventory, progression);
    expect(rewardRes.claimed).toBe(true);
    expect(rewardRes.expAwarded).toBe(RootProwler.EXP_REWARD);
    expect(progression.getExp()).toBe(initialExp + RootProwler.EXP_REWARD);

    expect(inventory.hasItem('essence_black_willow')).toBe(true);
    expect(inventory.getItem('essence_black_willow')?.quantity).toBe(1);
    expect(inventory.hasItem('herb_silverleaf')).toBe(true);
    expect(inventory.getItem('herb_silverleaf')?.quantity).toBe(2);

    // Second claim should do nothing
    const secondClaim = prowler.claimRewards(inventory, progression);
    expect(secondClaim.claimed).toBe(false);
  });

  it('verifies canonical willow relic properties in inventory', () => {
    expect(inventory.hasWillowFang()).toBe(false);
    inventory.addItem(CANONICAL_WILLOW_RELIC);
    expect(inventory.hasWillowFang()).toBe(true);
    const item = inventory.getItem('relic_willow_fang');
    expect(item?.effectType).toBe('relic_willow_echo');
    expect(item?.effectValue).toBe(60);
  });
});
