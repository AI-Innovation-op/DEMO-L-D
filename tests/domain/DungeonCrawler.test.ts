import { describe, it, expect, beforeEach } from 'vitest';
import { SpikeTrap } from '../../src/domain/encounters/SpikeTrap';
import { CatacombInquisitor } from '../../src/domain/encounters/CatacombInquisitor';
import { DungeonAreaManager } from '../../src/domain/encounters/DungeonAreaManager';
import { Inventory } from '../../src/domain/inventory/Inventory';
import { Progression } from '../../src/domain/progression/Progression';

describe('Dungeon Crawler Domain - San Jude Crypts', () => {
  describe('SpikeTrap', () => {
    let trap: SpikeTrap;

    beforeEach(() => {
      trap = new SpikeTrap({ x: 0, z: -80, triggerRadius: 1.2, damage: 25, resetCooldown: 2.0 });
    });

    it('initializes in ARMED state with 0 cooldown', () => {
      expect(trap.state).toBe('ARMED');
      expect(trap.isArmed).toBe(true);
      expect(trap.cooldownRemaining).toBe(0);
    });

    it('triggers and deals damage when stepping inside radius', () => {
      const stepFar = trap.stepOn(0, -78); // 2m away
      expect(stepFar.triggered).toBe(false);
      expect(stepFar.damage).toBe(0);
      expect(trap.isArmed).toBe(true);

      const stepNear = trap.stepOn(0.5, -80.5); // inside 1.2m
      expect(stepNear.triggered).toBe(true);
      expect(stepNear.damage).toBe(25);
      expect(trap.state).toBe('TRIGGERED');
      expect(trap.cooldownRemaining).toBe(2.0);
    });

    it('does not re-trigger while in RESETTING state until cooldown finishes', () => {
      trap.stepOn(0, -80);
      expect(trap.state).toBe('TRIGGERED');

      // Immediate second step
      const stepWhileResetting = trap.stepOn(0, -80);
      expect(stepWhileResetting.triggered).toBe(false);

      // Advance time by 1.0s
      trap.update(1.0);
      expect(trap.state).toBe('RESETTING');
      expect(trap.cooldownRemaining).toBe(1.0);

      // Step again before finished
      const stepAgain = trap.stepOn(0, -80);
      expect(stepAgain.triggered).toBe(false);

      // Advance remaining 1.0s
      trap.update(1.0);
      expect(trap.state).toBe('ARMED');
      expect(trap.isArmed).toBe(true);

      // Now it triggers again
      const retrigger = trap.stepOn(0, -80);
      expect(retrigger.triggered).toBe(true);
      expect(retrigger.damage).toBe(25);
    });
  });

  describe('CatacombInquisitor', () => {
    let inquisitor: CatacombInquisitor;
    let inventory: Inventory;
    let progression: Progression;

    beforeEach(() => {
      inquisitor = new CatacombInquisitor();
      inventory = new Inventory();
      progression = Progression.createDefault();
    });

    it('initializes with 180 HP in DORMANT state and shield raised', () => {
      expect(inquisitor.health).toBe(180);
      expect(inquisitor.maxHealth).toBe(180);
      expect(inquisitor.state).toBe('DORMANT');
      expect(inquisitor.isBlocking).toBe(true);
      expect(inquisitor.isDefeated).toBe(false);
    });

    it('awakens into ALERT state', () => {
      inquisitor.awaken();
      expect(inquisitor.state).toBe('ALERT');
    });

    it('mitigates 60% damage when blocking frontal hits', () => {
      // Frontal attack of 30 damage: 30 * 0.4 = 12 damage
      const result = inquisitor.takeDamage(30, true);
      expect(result.blocked).toBe(true);
      expect(result.actualDamage).toBe(12);
      expect(inquisitor.health).toBe(168);

      // Flank / rear attack of 30 damage: full 30 damage
      const flankResult = inquisitor.takeDamage(30, false);
      expect(flankResult.blocked).toBe(false);
      expect(flankResult.actualDamage).toBe(30);
      expect(inquisitor.health).toBe(138);
    });

    it('evaluates AoE ground slam damage within radius, dodge negates hit', () => {
      // Within radius, not dodging
      const hitResult = inquisitor.evaluateSlam(2.5, false);
      expect(hitResult.hit).toBe(true);
      expect(hitResult.damage).toBe(CatacombInquisitor.SLAM_DAMAGE);

      // Outside radius
      const missResult = inquisitor.evaluateSlam(4.5, false);
      expect(missResult.hit).toBe(false);
      expect(missResult.damage).toBe(0);

      // Within radius, but player is dodging
      const dodgedResult = inquisitor.evaluateSlam(2.0, true);
      expect(dodgedResult.hit).toBe(false);
      expect(dodgedResult.damage).toBe(0);
    });

    it('handles defeat and awards rewards idempotently', () => {
      inquisitor.takeDamage(200, false);
      expect(inquisitor.isDefeated).toBe(true);
      expect(inquisitor.health).toBe(0);
      expect(inquisitor.state).toBe('DEAD');

      const initialExp = progression.getExp();
      const rewards = inquisitor.claimRewards(inventory, progression);

      expect(rewards.claimed).toBe(true);
      expect(rewards.expAwarded).toBe(250);
      expect(progression.getExp()).toBe(initialExp + 250);
      expect(inventory.getItem(CatacombInquisitor.ITEM_SIGIL)?.quantity).toBe(1);
      expect(inventory.getItem(CatacombInquisitor.ITEM_HOLY_WATER)?.quantity).toBe(2);
      expect(inventory.getItem(CatacombInquisitor.ITEM_PURIFIED_ASH)?.quantity).toBe(2);

      // Second claim attempt must be rejected
      const secondClaim = inquisitor.claimRewards(inventory, progression);
      expect(secondClaim.claimed).toBe(false);
      expect(secondClaim.expAwarded).toBe(0);
    });
  });

  describe('DungeonAreaManager', () => {
    let areaManager: DungeonAreaManager;

    beforeEach(() => {
      areaManager = new DungeonAreaManager();
    });

    it('starts on surface with cemetery gate closed', () => {
      expect(areaManager.currentArea).toBe('surface');
      expect(areaManager.isCemeteryGateOpen).toBe(false);
      const bounds = areaManager.getBounds();
      expect(bounds.minZ).toBe(-23.0);
    });

    it('updates bounds when cemetery gate opens', () => {
      areaManager.setCemeteryGateOpen(true);
      expect(areaManager.isCemeteryGateOpen).toBe(true);
      const bounds = areaManager.getBounds();
      expect(bounds.minZ).toBe(-46.5);
    });

    it('transitions to crypts_interior and returns subterranean bounds', () => {
      areaManager.enterCrypts();
      expect(areaManager.currentArea).toBe('crypts_interior');
      const bounds = areaManager.getBounds();
      expect(bounds.minZ).toBe(-112.0);
      expect(bounds.maxZ).toBe(-70.0);

      areaManager.exitToSurface();
      expect(areaManager.currentArea).toBe('surface');
    });

    it('manages sarcophagi loot and ambush states', () => {
      const lootSarc = areaManager.getSarcophagus('sarcophagus_loot');
      expect(lootSarc?.isOpened).toBe(false);

      const opened = areaManager.openSarcophagus('sarcophagus_loot');
      expect(opened).toBe(true);
      expect(areaManager.getSarcophagus('sarcophagus_loot')?.isOpened).toBe(true);

      const openedAgain = areaManager.openSarcophagus('sarcophagus_loot');
      expect(openedAgain).toBe(false);
    });
  });
});
