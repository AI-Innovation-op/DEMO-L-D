import { describe, it, expect } from 'vitest';
import { Character } from '../../src/domain/character/Character';
import { ShalemCompanion } from '../../src/domain/companion/ShalemCompanion';
import { ShalemUseCases } from '../../src/application/usecases/ShalemUseCases';

describe('Domain: Shalem & Level-Up Minigames', () => {
  it('Level up bar fills with experience and activates minigame readiness', () => {
    const thomas = Character.createThomas();
    expect(thomas.levelUp.isMinigameReady).toBe(false);

    // Gain exp to trigger level up
    thomas.gainExperience(110);
    expect(thomas.levelUp.level).toBe(2);
    expect(thomas.levelUp.isMinigameReady).toBe(true);
  });

  it('Solving Shalem minigame correctly rewards a new weapon and completes minigame', () => {
    const thomas = Character.createThomas();
    const shalem = new ShalemCompanion();

    thomas.gainExperience(100);
    expect(ShalemUseCases.isMinigameAvailable(thomas)).toBe(true);

    const activeMinigame = ShalemUseCases.getActiveMinigame(thomas, shalem);
    expect(activeMinigame.title).toBeDefined();

    // Option 1 is the correct answer in the trivia
    const result = ShalemUseCases.solveMinigame(thomas, shalem, 1);
    expect(result.isCorrect).toBe(true);
    expect(result.rewardedWeapon).toBeDefined();
    expect(thomas.levelUp.isMinigameReady).toBe(false);
  });

  it('Shalem observes the Golden Rule: falls completely silent in deep tragedy', () => {
    const shalem = new ShalemCompanion();
    expect(shalem.isSilentMode).toBe(false);

    const comment = shalem.getRandomComment();
    expect(comment.length).toBeGreaterThan(0);

    // Enter tragedy
    shalem.enterTragedySilence();
    expect(shalem.isSilentMode).toBe(true);
    expect(shalem.getRandomComment()).toContain('silencio');
    expect(shalem.getCombatAdvice(true)).toBe('...');
  });
});
