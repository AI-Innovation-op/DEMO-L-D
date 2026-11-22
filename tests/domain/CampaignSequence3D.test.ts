import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveActiveCampaignObjective,
  CAMPAIGN_PROLOGUE_SLIDES,
  CampaignWorldSnapshot3D
} from '../../src/domain/story/CampaignSequence3D';
import { GameSaveManager } from '../../src/infrastructure/storage/GameSaveManager';

function createInitialSnapshot(overrides: Partial<CampaignWorldSnapshot3D> = {}): CampaignWorldSnapshot3D {
  return {
    currentArea: 'surface',
    narrativePhase: 'DAWN_CALM',
    hasAidedVillagersOrCedric: false,
    hasDeliveredBirdOnOakHill: false,
    hasTalkedToKhaterineOrFought: false,
    hasVisitedApothecary: false,
    morwennaAwakened: false,
    morwennaDefeated: false,
    cemeteryGateOpen: false,
    inquisitorDefeated: false,
    rootProwlerDefeated: false,
    hasWillowFang: false,
    hasInspectedBurnedBarn: false,
    hasCollectedWillowBird: false,
    crucibleGuardianDefeated: false,
    hasFreedRefugees: false,
    captainVaneAwakened: false,
    captainVaneDefeated: false,
    destroyedNarcoticBraziersCount: 0,
    shatteredGuiltMirrors: 0,
    hasClearedMirrorGallery: false,
    rexMalphasAwakened: false,
    rexMalphasDefeated: false,
    hasForgedAlbaGris: false,
    astarothDefeated: false,
    ...overrides
  };
}

describe('3D Sequential Story Campaign Director (Prologue -> Caps. I-XX -> First Dawn Epilogue)', () => {
  beforeEach(() => {
    GameSaveManager.clearSave();
  });

  it('defines the 3 canonical Prologue slides from La Noche de la Luna Roja', () => {
    expect(CAMPAIGN_PROLOGUE_SLIDES).toHaveLength(3);
    expect(CAMPAIGN_PROLOGUE_SLIDES[0].header).toContain('LUNA ROJA');
    expect(CAMPAIGN_PROLOGUE_SLIDES[1].body).toContain('Elowen');
    expect(CAMPAIGN_PROLOGUE_SLIDES[2].body).toContain('Shalem');
    for (const slide of CAMPAIGN_PROLOGUE_SLIDES) {
      expect(slide.imageUrl.startsWith('/assets/')).toBe(true);
    }
  });

  it('guides the player smoothly through Act I (Dawn -> Old Oak Hill -> Midnight Siege -> Morwenna -> Crypts)', () => {
    const cap1 = resolveActiveCampaignObjective(createInitialSnapshot());
    expect(cap1.chapterId).toBe(1);
    expect(cap1.waypoint).toEqual({ x: -2.5, y: 0, z: 2.7 });

    const cap2 = resolveActiveCampaignObjective(createInitialSnapshot({ hasAidedVillagersOrCedric: true }));
    expect(cap2.chapterId).toBe(2);
    expect(cap2.waypoint).toEqual({ x: 9.4, y: 2.2, z: 5.0 });
    expect(cap2.progressPct).toBeGreaterThan(cap1.progressPct);

    const cap3 = resolveActiveCampaignObjective(createInitialSnapshot({
      hasAidedVillagersOrCedric: true,
      hasDeliveredBirdOnOakHill: true,
      narrativePhase: 'MIDNIGHT_SIEGE'
    }));
    expect(cap3.chapterId).toBe(3);

    const cap4 = resolveActiveCampaignObjective(createInitialSnapshot({
      hasAidedVillagersOrCedric: true,
      hasDeliveredBirdOnOakHill: true,
      narrativePhase: 'MIDNIGHT_SIEGE',
      hasTalkedToKhaterineOrFought: true
    }));
    expect(cap4.chapterId).toBe(4);
    expect(cap4.waypoint).toEqual({ x: -2.4, y: 0, z: -0.7 });

    const cap5 = resolveActiveCampaignObjective(createInitialSnapshot({
      narrativePhase: 'MIDNIGHT_SIEGE',
      hasTalkedToKhaterineOrFought: true,
      hasVisitedApothecary: true,
      morwennaAwakened: true
    }));
    expect(cap5.chapterId).toBe(5);
    expect(cap5.waypoint).toEqual({ x: 0, y: 0, z: -21.0 });

    const cap6Surface = resolveActiveCampaignObjective(createInitialSnapshot({
      narrativePhase: 'MIDNIGHT_SIEGE',
      morwennaDefeated: true,
      cemeteryGateOpen: true
    }));
    expect(cap6Surface.chapterId).toBe(6);
    expect(cap6Surface.waypoint).toEqual({ x: 0, y: 0, z: -44.2 });

    const cap6Crypts = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'crypts_interior',
      morwennaDefeated: true
    }));
    expect(cap6Crypts.chapterId).toBe(6);
    expect(cap6Crypts.waypoint).toEqual({ x: 0, y: 0, z: -102 });
  });

  it('chains Crypts -> Black Willow Forest -> Act II Belltower -> Act III Great Stone Bridge', () => {
    const forestProwler = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'black_willow_forest',
      inquisitorDefeated: true
    }));
    expect(forestProwler.chapterId).toBe(8);
    expect(forestProwler.waypoint).toEqual({ x: 0, y: 0, z: -146 });

    const forestAltar = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'black_willow_forest',
      inquisitorDefeated: true,
      rootProwlerDefeated: true
    }));
    expect(forestAltar.waypoint).toEqual({ x: 0, y: 0, z: -155 });

    const belltowerBarn = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'belltower_summit',
      inquisitorDefeated: true,
      rootProwlerDefeated: true,
      hasWillowFang: true
    }));
    expect(belltowerBarn.waypoint).toEqual({ x: 3.8, y: 0, z: -191.5 });

    const belltowerCell = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'belltower_summit',
      hasInspectedBurnedBarn: true
    }));
    expect(belltowerCell.chapterId).toBe(7);
    expect(belltowerCell.waypoint).toEqual({ x: -5.0, y: 2.8, z: -202 });

    const belltowerBoss = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'belltower_summit',
      hasInspectedBurnedBarn: true,
      hasCollectedWillowBird: true
    }));
    expect(belltowerBoss.chapterId).toBe(9);
    expect(belltowerBoss.waypoint).toEqual({ x: 0, y: 0, z: -204 });

    const bridgeCart = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'great_stone_bridge',
      crucibleGuardianDefeated: true
    }));
    expect(bridgeCart.chapterId).toBe(10);
    expect(bridgeCart.waypoint).toEqual({ x: -2.6, y: 0, z: -249 });

    const bridgeVane = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'great_stone_bridge',
      crucibleGuardianDefeated: true,
      hasFreedRefugees: true,
      captainVaneAwakened: true
    }));
    expect(bridgeVane.chapterId).toBe(12);
    expect(bridgeVane.waypoint).toEqual({ x: 0, y: 0, z: -260 });
  });

  it('chains Act IV Londinium -> Act V Inverted Cathedral -> Playable First Dawn Epilogue (100%)', () => {
    const londiniumBraziers = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'londinium_citadel',
      captainVaneDefeated: true,
      destroyedNarcoticBraziersCount: 1
    }));
    expect(londiniumBraziers.chapterId).toBe(14);
    expect(londiniumBraziers.waypoint).toEqual({ x: 4.2, y: 0.55, z: -311 });

    const londiniumMirrors = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'londinium_citadel',
      captainVaneDefeated: true,
      destroyedNarcoticBraziersCount: 3,
      shatteredGuiltMirrors: 1
    }));
    expect(londiniumMirrors.chapterId).toBe(15);
    expect(londiniumMirrors.waypoint).toEqual({ x: -7.0, y: 0, z: -320 });

    const londiniumMalphas = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'londinium_citadel',
      captainVaneDefeated: true,
      destroyedNarcoticBraziersCount: 3,
      hasClearedMirrorGallery: true,
      rexMalphasAwakened: true
    }));
    expect(londiniumMalphas.chapterId).toBe(16);
    expect(londiniumMalphas.waypoint).toEqual({ x: 0, y: 0, z: -325 });

    const act5Altar = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'inverted_cathedral',
      rexMalphasDefeated: true
    }));
    expect(act5Altar.chapterId).toBe(18);
    expect(act5Altar.waypoint).toEqual({ x: 0, y: 0.86, z: -378 });

    const act5Astaroth = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'inverted_cathedral',
      rexMalphasDefeated: true,
      hasForgedAlbaGris: true
    }));
    expect(act5Astaroth.chapterId).toBe(19);
    expect(act5Astaroth.waypoint).toEqual({ x: 0, y: 2.35, z: -395 });

    const act5Core = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'inverted_cathedral',
      rexMalphasDefeated: true,
      hasForgedAlbaGris: true,
      astarothDefeated: true
    }));
    expect(act5Core.chapterId).toBe(20);
    expect(act5Core.progressPct).toBe(98);

    const epilogue = resolveActiveCampaignObjective(createInitialSnapshot({
      currentArea: 'surface',
      narrativePhase: 'FIRST_DAWN_EPILOGUE',
      astarothDefeated: true
    }));
    expect(epilogue.isEpilogue).toBe(true);
    expect(epilogue.progressPct).toBe(100);
    expect(epilogue.waypoint).toEqual({ x: 9.6, y: 2.2, z: 5.0 });
  });

  it('persists and restores unlockedChapterIds and currentChapterId in GameSaveManager', () => {
    const saved = GameSaveManager.saveGame({
      activeHero: 'thomas',
      heroes: {
        thomas: { health: 90, posture: 50, isArmed: true, available: true },
        khaterine: { health: 90, posture: 50, isArmed: true, available: true }
      },
      health: 90,
      maxHealth: 100,
      posture: 50,
      maxPosture: 50,
      inventory: {},
      progression: {},
      sanctuaryVisited: true,
      world: {
        morwennaDefeated: true,
        morwennaPhase2: true,
        cemeteryGateOpen: true,
        checkpoint: { x: 0, y: 0, z: -188 },
        destroyedPropIds: [],
        unlockedChapterIds: [1, 2, 3, 4, 5, 6, 7],
        currentChapterId: 7
      }
    });
    expect(saved).toBe(true);

    const loaded = GameSaveManager.loadGame();
    expect(loaded?.world.unlockedChapterIds).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(loaded?.world.currentChapterId).toBe(7);
  });
});
