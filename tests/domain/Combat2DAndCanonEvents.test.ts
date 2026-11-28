import { describe, it, expect } from 'vitest';
import {
  ACT4_GUILT_MIRRORS_2D,
  CanonEvents2DTracker
} from '../../src/domain/combat/CanonEvents2DState';
import {
  ARROW_SPECS_2D,
  ComboChain2D,
  PerfectDodgeTracker2D,
  cycleArrowType2D,
  resolveDestructibleDrop2D
} from '../../src/domain/combat/Combat2DFluidity';
import { StoryProgress } from '../../src/domain/story/StoryProgress';

describe('Opción A — Canonical Act II–V 2D Events & Playable First Dawn Epilogue', () => {
  it('Act II Barn Slab unlocks Colmillo del Sauce Negro once and empowers Khaterine', () => {
    const tracker = new CanonEvents2DTracker();
    expect(tracker.hasOpenedBarnSlab).toBe(false);

    const firstOpen = tracker.openBarnSlab();
    expect(firstOpen.openedNow).toBe(true);
    expect(firstOpen.weaponUnlocked).toBe('colmillo_sauce');
    expect(firstOpen.expReward).toBe(45);
    expect(firstOpen.khaterineAtkBonus).toBe(3);

    const duplicateOpen = tracker.openBarnSlab();
    expect(duplicateOpen.openedNow).toBe(false);
    expect(duplicateOpen.expReward).toBe(0);
  });

  it('Act IV Venetian Guilt Mirrors shatter sequentially (1/3 -> 2/3 -> 3/3) without double-counting', () => {
    const tracker = new CanonEvents2DTracker();
    expect(ACT4_GUILT_MIRRORS_2D).toHaveLength(3);

    const m1 = tracker.shatterMirror(1);
    expect(m1.shatteredNow).toBe(true);
    expect(m1.shatteredCount).toBe(1);
    expect(m1.allShattered).toBe(false);

    const m1Dup = tracker.shatterMirror(1);
    expect(m1Dup.shatteredNow).toBe(false);
    expect(m1Dup.shatteredCount).toBe(1);

    const m2 = tracker.shatterMirror(2);
    expect(m2.shatteredCount).toBe(2);
    expect(m2.allShattered).toBe(false);

    const m3 = tracker.shatterMirror(3);
    expect(m3.shatteredNow).toBe(true);
    expect(m3.shatteredCount).toBe(3);
    expect(m3.allShattered).toBe(true);
  });

  it('Act V Chapter XX Moral Dilemma supports Eclipse de Ceniza rewind back to Canon Alba Gris choice', () => {
    const tracker = new CanonEvents2DTracker();
    expect(tracker.chapterXXChoice).toBe('UNDECIDED');

    tracker.selectChapterXXChoice('ECLIPSE_DE_CENIZA');
    expect(tracker.chapterXXChoice).toBe('ECLIPSE_DE_CENIZA');

    tracker.rewindEclipseToAltar();
    expect(tracker.chapterXXChoice).toBe('UNDECIDED');

    tracker.selectChapterXXChoice('CANON_ALBA_GRIS');
    expect(tracker.chapterXXChoice).toBe('CANON_ALBA_GRIS');
  });

  it('Playable First Dawn Epilogue (Scenario 6) tracks peaceful milestones and conversations', () => {
    const tracker = new CanonEvents2DTracker();
    const progress = new StoryProgress();
    progress.setAct(6);

    expect(progress.getScenarioName()).toBe('EPÍLOGO — EL PRIMER AMANECER');
    expect(progress.scenarioProgress).toBe(0);

    tracker.enterFirstDawnEpilogue();
    expect(tracker.isFirstDawnEpilogueActive).toBe(true);

    tracker.recordEpilogueConversation('elowen');
    progress.completeMilestone('epilogue_elowen');
    expect(progress.scenarioProgress).toBe(50);

    tracker.recordEpilogueConversation('cedric');
    progress.completeMilestone('epilogue_companions');
    expect(progress.scenarioProgress).toBe(100);
    expect(tracker.epilogueConversationsCompleted.size).toBe(2);
  });
});

describe('Opción B — Deep 2D Combat Fluidity & Destructible Props', () => {
  it('Thomas 3-hit combo escalates 1.0x -> 1.15x -> 1.38x within 950ms and resets on timeout or after finisher', () => {
    const combo = new ComboChain2D(950);

    const s1 = combo.advanceLightCombo(1000);
    expect(s1.step).toBe(1);
    expect(s1.damageMultiplier).toBe(1.0);
    expect(s1.isFinisherStep).toBe(false);

    const s2 = combo.advanceLightCombo(1450);
    expect(s2.step).toBe(2);
    expect(s2.damageMultiplier).toBe(1.15);
    expect(s2.bonusPostureDamage).toBeGreaterThan(0);

    const s3 = combo.advanceLightCombo(1900);
    expect(s3.step).toBe(3);
    expect(s3.damageMultiplier).toBe(1.38);
    expect(s3.isFinisherStep).toBe(true);
    expect(s3.bonusPostureDamage).toBe(28);

    // Next swing wraps cleanly back to Step 1
    const wrap = combo.advanceLightCombo(2200);
    expect(wrap.step).toBe(1);

    // Timeout (>950ms) resets Step 2 -> Step 1
    combo.advanceLightCombo(2500);
    const afterTimeout = combo.advanceLightCombo(3800);
    expect(afterTimeout.step).toBe(1);
  });

  it('Input buffer prioritizes heavy over light and consumes cleanly once', () => {
    const combo = new ComboChain2D(950);
    combo.bufferAttack('light');
    combo.bufferAttack('heavy');
    expect(combo.consumeBufferedAttack()).toBe('heavy');
    expect(combo.consumeBufferedAttack()).toBe('none');
  });

  it('Khaterine cycles cleanly across Abyssal, Fire, and Silver arrow specs', () => {
    let cur = cycleArrowType2D('abyssal', 1);
    expect(cur).toBe('fire');
    expect(ARROW_SPECS_2D[cur].burnTicks).toBe(3);

    cur = cycleArrowType2D(cur, 1);
    expect(cur).toBe('silver');
    expect(ARROW_SPECS_2D[cur].piercesFlameShield).toBe(true);
    expect(ARROW_SPECS_2D[cur].bonusPosture).toBeGreaterThanOrEqual(24);

    cur = cycleArrowType2D(cur, 1);
    expect(cur).toBe('abyssal');
    expect(ARROW_SPECS_2D[cur].splashRadiusPx).toBeGreaterThan(0);

    expect(cycleArrowType2D('abyssal', -1)).toBe('silver');
  });

  it('Perfect Dodge activates 0.32x enemy slow-mo and single-use +50% Critical Counter-Attack', () => {
    const tracker = new PerfectDodgeTracker2D(550, 0.32, 2200, 18);

    expect(tracker.tryTriggerPerfectDodge(false)).toBe(false);
    expect(tracker.isSlowMoActive()).toBe(false);

    expect(tracker.tryTriggerPerfectDodge(true)).toBe(true);
    expect(tracker.isSlowMoActive()).toBe(true);
    expect(tracker.getEnemyDeltaScale()).toBe(0.32);
    expect(tracker.isCounterReady()).toBe(true);

    tracker.update(600);
    expect(tracker.isSlowMoActive()).toBe(false);
    expect(tracker.getEnemyDeltaScale()).toBe(1.0);
    expect(tracker.isCounterReady()).toBe(true);

    const firstHit = tracker.consumeCounterAttack();
    expect(firstHit.triggered).toBe(true);
    expect(firstHit.damageMultiplier).toBe(1.5);

    const secondHit = tracker.consumeCounterAttack();
    expect(secondHit.triggered).toBe(false);
    expect(secondHit.damageMultiplier).toBe(1.0);
  });

  it('Destructible props grant Balm when below cap and fall back to HP/EXP orbs when full', () => {
    const balmDrop = resolveDestructibleDrop2D(0.2, 1, 3);
    expect(balmDrop.kind).toBe('balm');
    expect(balmDrop.balmGranted).toBe(1);

    const fullBalmFallback = resolveDestructibleDrop2D(0.2, 3, 3);
    expect(fullBalmFallback.kind).toBe('heal_orb');
    expect(fullBalmFallback.healAmount).toBe(20);

    const expDrop = resolveDestructibleDrop2D(0.9, 2, 3);
    expect(expDrop.kind).toBe('exp_orb');
    expect(expDrop.expAmount).toBe(22);
  });
});
