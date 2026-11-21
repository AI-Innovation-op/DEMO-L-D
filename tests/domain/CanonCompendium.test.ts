import { describe, it, expect, beforeEach } from 'vitest';
import { CanonChapterManager, CANON_CHAPTERS } from '../../src/domain/story/CanonChapterCompendium';
import { CrucibleGuardian, CaptainVane, RexMalphas, AstarothTitan } from '../../src/domain/encounters/ActBosses';
import { Inventory } from '../../src/domain/inventory/Inventory';
import { Progression } from '../../src/domain/progression/Progression';

describe('Canon Chapter Compendium & Act Bosses Domain Tests', () => {
  describe('CanonChapterManager', () => {
    let manager: CanonChapterManager;

    beforeEach(() => {
      manager = new CanonChapterManager(1);
    });

    it('contains all 20 canonical chapters distributed in 5 Acts', () => {
      expect(CANON_CHAPTERS.length).toBe(20);

      const act1 = CANON_CHAPTERS.filter(c => c.act === 1);
      const act2 = CANON_CHAPTERS.filter(c => c.act === 2);
      const act3 = CANON_CHAPTERS.filter(c => c.act === 3);
      const act4 = CANON_CHAPTERS.filter(c => c.act === 4);
      const act5 = CANON_CHAPTERS.filter(c => c.act === 5);

      expect(act1.length).toBe(6); // Caps I - VI
      expect(act2.length).toBe(3); // Caps VII - IX
      expect(act3.length).toBe(4); // Caps X - XIII
      expect(act4.length).toBe(4); // Caps XIV - XVII
      expect(act5.length).toBe(3); // Caps XVIII - XX
    });

    it('initializes with Chapter 1 active and unlocked', () => {
      const cur = manager.getCurrentChapter();
      expect(cur.id).toBe(1);
      expect(cur.romanNumber).toBe('I');
      expect(cur.title).toBe('El Monaguillo de las Sombras');
      expect(manager.isChapterUnlocked(1)).toBe(true);
      expect(manager.isChapterUnlocked(2)).toBe(false);
    });

    it('advances sequentially through chapters and tracks percentage', () => {
      expect(manager.getProgressPercentage()).toBe(5); // 1 / 20 = 5%
      manager.advanceToNextChapter();
      expect(manager.getCurrentChapter().id).toBe(2);
      expect(manager.isChapterUnlocked(2)).toBe(true);
      expect(manager.getProgressPercentage()).toBe(10);
    });

    it('allows unlocking all chapters for free travel / compendium access', () => {
      manager.unlockAllChapters();
      expect(manager.getUnlockedCount()).toBe(20);
      expect(manager.getProgressPercentage()).toBe(100);
      expect(manager.selectChapter(20)).toBe(true);
      expect(manager.getCurrentChapter().title).toBe('El Sol de las Tinieblas y el Primer Amanecer');
    });
  });

  describe('Act II: CrucibleGuardian', () => {
    let guardian: CrucibleGuardian;
    let inv: Inventory;
    let prog: Progression;

    beforeEach(() => {
      guardian = new CrucibleGuardian();
      inv = new Inventory();
      prog = new Progression();
    });

    it('initializes with 220 HP in DORMANT state', () => {
      expect(guardian.health).toBe(220);
      expect(guardian.isDefeated).toBe(false);
    });

    it('takes bonus damage when vulnerable', () => {
      const res = guardian.takeDamage(50, true);
      expect(res.actualDamage).toBe(70); // 50 * 1.4 = 70
      expect(guardian.health).toBe(150);
    });

    it('evaluates attacks within range', () => {
      expect(guardian.evaluateAttack(2.0, false, false).hit).toBe(true);
      expect(guardian.evaluateAttack(2.0, true, false).hit).toBe(false);
      expect(guardian.evaluateAttack(3.5, false, true).hit).toBe(true);
    });

    it('claims Lament of Oakhaven relic upon defeat', () => {
      guardian.takeDamage(300);
      expect(guardian.isDefeated).toBe(true);
      const res = guardian.claimRewards(inv, prog);
      expect(res.claimed).toBe(true);
      expect(res.expAwarded).toBe(CrucibleGuardian.EXP_REWARD);
      expect(inv.hasItem('relic_lament_oakhaven')).toBe(true);
    });
  });

  describe('Act III: CaptainVane', () => {
    let vane: CaptainVane;
    let inv: Inventory;
    let prog: Progression;

    beforeEach(() => {
      vane = new CaptainVane();
      inv = new Inventory();
      prog = new Progression();
    });

    it('mitigates 80% damage when blocking frontal hits with tower shield', () => {
      const res = vane.takeDamage(100, true, false);
      expect(res.blocked).toBe(true);
      expect(res.actualDamage).toBe(20); // 100 * 0.2
      expect(vane.health).toBe(260);
    });

    it('takes full damage when attacking from the rear or bypassing shield', () => {
      const rearRes = vane.takeDamage(50, false, false);
      expect(rearRes.blocked).toBe(false);
      expect(rearRes.actualDamage).toBe(50);

      const bypassRes = vane.takeDamage(40, true, true);
      expect(bypassRes.blocked).toBe(false);
      expect(bypassRes.actualDamage).toBe(40);
    });

    it('breaks shield into stunned state and awards False Verdict', () => {
      vane.breakShield();
      expect(vane.shieldRaised).toBe(false);
      expect(vane.state).toBe('STUNNED');

      vane.takeDamage(300, false);
      expect(vane.isDefeated).toBe(true);
      const res = vane.claimRewards(inv, prog);
      expect(res.claimed).toBe(true);
      expect(inv.hasItem('relic_false_verdict')).toBe(true);
    });
  });

  describe('Act IV: RexMalphas', () => {
    let malphas: RexMalphas;
    let inv: Inventory;
    let prog: Progression;

    beforeEach(() => {
      malphas = new RexMalphas();
      inv = new Inventory();
      prog = new Progression();
    });

    it('transitions to Phase 2 Ley del Deseo at 50% HP (175 HP)', () => {
      expect(malphas.phase).toBe(1);
      const res = malphas.takeDamage(180);
      expect(res.transitionedToPhase2).toBe(true);
      expect(malphas.phase).toBe(2);
      expect(malphas.state).toBe('LEY_DEL_DESEO');
    });

    it('claims Golden Mirage relic on defeat without triggering phase 2 on lethal one-shot', () => {
      const resHit = malphas.takeDamage(400);
      expect(resHit.defeated).toBe(true);
      expect(resHit.transitionedToPhase2).toBe(false);
      expect(malphas.isDefeated).toBe(true);
      const res = malphas.claimRewards(inv, prog);
      expect(res.claimed).toBe(true);
      expect(inv.hasItem('relic_golden_mirage')).toBe(true);
      // Idempotency check
      expect(malphas.claimRewards(inv, prog).claimed).toBe(false);
    });
  });

  describe('Act V: AstarothTitan', () => {
    let astaroth: AstarothTitan;
    let inv: Inventory;
    let prog: Progression;

    beforeEach(() => {
      astaroth = new AstarothTitan();
      inv = new Inventory();
      prog = new Progression();
    });

    it('receives 2.0x critical damage when struck by Alba Gris', () => {
      const normalRes = astaroth.takeDamage(50, false);
      expect(normalRes.actualDamage).toBe(50);
      expect(astaroth.health).toBe(450);

      const albaRes = astaroth.takeDamage(50, true);
      expect(albaRes.actualDamage).toBe(100);
      expect(astaroth.health).toBe(350);
    });

    it('awards Dawn Grey (Alba Gris) and 500 EXP upon cosmic defeat', () => {
      astaroth.takeDamage(600);
      expect(astaroth.isDefeated).toBe(true);
      const res = astaroth.claimRewards(inv, prog);
      expect(res.claimed).toBe(true);
      expect(res.expAwarded).toBe(500);
      expect(inv.hasItem('weapon_dawn_grey')).toBe(true);
    });
  });
});
