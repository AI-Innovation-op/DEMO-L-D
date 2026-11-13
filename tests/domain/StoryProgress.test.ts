import { describe, it, expect } from 'vitest';
import { StoryProgress } from '../../src/domain/story/StoryProgress';

describe('Domain: StoryProgress & Scenario Milestones', () => {
  it('initializes in Act 1 with 0% progress and first milestone objective', () => {
    const story = new StoryProgress();
    expect(story.currentAct).toBe(1);
    expect(story.scenarioProgress).toBe(0);
    expect(story.getScenarioName()).toContain('OAKHAVEN');
    expect(story.getCurrentObjective()).toContain('Purga la guardia');
  });

  it('completes milestone and advances scenario progress percentage', () => {
    const story = new StoryProgress();
    const completed = story.completeMilestone('act1_monks');
    expect(completed).toBe(true);
    expect(story.scenarioProgress).toBe(25);
    expect(story.getCurrentObjective()).toContain('Acechador');
  });

  it('calculates global journey percentage across multiple acts', () => {
    const story = new StoryProgress();
    story.addProgress(50);
    // In Act 1 with 50% scenario progress -> approx 17% global
    expect(story.getGlobalJourneyPercentage()).toBe(17);

    story.setAct(2);
    expect(story.scenarioProgress).toBe(0);
    expect(story.getScenarioName()).toContain('LONDINIUM');
    expect(story.getGlobalJourneyPercentage()).toBe(33);
  });
});
