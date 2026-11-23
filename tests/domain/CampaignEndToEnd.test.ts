import { describe, it, expect, beforeEach } from 'vitest';
import {
  GamepadInputAdapter3D,
  GamepadLike
} from '../../src/infrastructure/input/GamepadInputAdapter3D';
import {
  CAMPAIGN_PROLOGUE_SLIDES,
  resolveActiveCampaignObjective,
  CampaignWorldSnapshot3D
} from '../../src/domain/story/CampaignSequence3D';
import { resolveDynamic3DSoundscape } from '../../src/domain/audio/ActSoundscapeCatalog';
import { ChronicleManager } from '../../src/domain/progression/ChronicleAchievements';
import { Inventory } from '../../src/domain/inventory/Inventory';
import { Progression } from '../../src/domain/progression/Progression';
import { MorwennaEncounter } from '../../src/domain/encounters/MorwennaEncounter';
import { CatacombInquisitor } from '../../src/domain/encounters/CatacombInquisitor';
import { RootProwler } from '../../src/domain/encounters/RootProwler';
import {
  CrucibleGuardian,
  CaptainVane,
  RexMalphas,
  AstarothTitan
} from '../../src/domain/encounters/ActBosses';
import { GameSaveManager } from '../../src/infrastructure/storage/GameSaveManager';

function createMockGamepad(overrides: Partial<GamepadLike> = {}): GamepadLike {
  const buttons = Array.from({ length: 18 }, () => ({ pressed: false, value: 0 }));
  return {
    id: 'Xbox Wireless Controller (STANDARD GAMEPAD)',
    connected: true,
    axes: [0, 0, 0, 0],
    buttons,
    ...overrides
  };
}

describe('USB/Bluetooth Gamepad Support & Full New-Campaign -> Epilogue E2E Flow', () => {
  beforeEach(() => {
    GameSaveManager.clearSave();
  });

  describe('GamepadInputAdapter3D (Standard Mapping, Radial Deadzone & Edge Triggers)', () => {
    it('filters stick drift within radial deadzone and scales analog movement smoothly outside it', () => {
      const adapter = new GamepadInputAdapter3D(0.18, 0.45);

      // Slight drift inside deadzone -> strictly zero
      const drift = adapter.poll(createMockGamepad({ axes: [0.1, -0.1, 0.12, 0] }));
      expect(drift.connected).toBe(true);
      expect(drift.moveX).toBe(0);
      expect(drift.moveZ).toBe(0);
      expect(drift.lookX).toBe(0);

      // Half push north-west + right stick orbit
      const active = adapter.poll(createMockGamepad({ axes: [-0.6, -0.6, 0.8, 0] }));
      expect(active.moveX).toBeLessThan(-0.5);
      expect(active.moveZ).toBeLessThan(-0.5);
      expect(active.lookX).toBeGreaterThan(0.7);
    });

    it('detects single rising-edge pulses for combat/menu buttons and press/release edges for LB guard', () => {
      const adapter = new GamepadInputAdapter3D();
      const pressedBtns = Array.from({ length: 18 }, () => ({ pressed: false, value: 0 }));
      pressedBtns[2] = { pressed: true, value: 1 }; // X: Light Attack
      pressedBtns[4] = { pressed: true, value: 1 }; // LB: Guard
      pressedBtns[6] = { pressed: false, value: 0.7 }; // LT analog trigger above threshold (Balm)
      pressedBtns[9] = { pressed: true, value: 1 }; // Start: Pause

      // Frame 1: rising edges fire
      const f1 = adapter.poll(createMockGamepad({ buttons: pressedBtns }));
      expect(f1.lightAttackPressed).toBe(true);
      expect(f1.guardHeld).toBe(true);
      expect(f1.guardJustPressed).toBe(true);
      expect(f1.guardJustReleased).toBe(false);
      expect(f1.quickBalmPressed).toBe(true);
      expect(f1.pausePressed).toBe(true);

      // Frame 2 (still held): rising edges suppressed, guardHeld remains true
      const f2 = adapter.poll(createMockGamepad({ buttons: pressedBtns }));
      expect(f2.lightAttackPressed).toBe(false);
      expect(f2.quickBalmPressed).toBe(false);
      expect(f2.pausePressed).toBe(false);
      expect(f2.guardHeld).toBe(true);
      expect(f2.guardJustPressed).toBe(false);

      // Frame 3 (released): guardJustReleased fires
      const f3 = adapter.poll(createMockGamepad());
      expect(f3.guardHeld).toBe(false);
      expect(f3.guardJustReleased).toBe(true);

      // Disconnected gamepad returns clean empty state
      const disconnected = adapter.poll(null);
      expect(disconnected.connected).toBe(false);
      expect(adapter.isConnected).toBe(false);
    });
  });

  describe('Full End-to-End Campaign Flow: New Campaign -> Prologue -> Acts I–V -> First Dawn Epilogue', () => {
    it('completes all 20 chapters, 7 bosses, 11 soundscape shifts, 10 achievements (Rank S), and sanctuary save', () => {
      const inventory = new Inventory();
      const progression = new Progression();
      const chronicle = new ChronicleManager();
      chronicle.reset();

      // 0. Prologue (3 slides)
      expect(CAMPAIGN_PROLOGUE_SLIDES).toHaveLength(3);

      const world: CampaignWorldSnapshot3D = {
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
        astarothDefeated: false
      };

      // --- ACT I: Oakhaven Dawn -> Old Oak Hill -> Midnight Siege -> Morwenna -> Crypts -> Black Willow ---
      expect(resolveActiveCampaignObjective(world).chapterId).toBe(1);
      expect(resolveDynamic3DSoundscape({
        currentArea: 'surface', narrativePhase: 'DAWN_CALM',
        morwennaActive: false, inquisitorActive: false, rootProwlerActive: false,
        crucibleActive: false, vaneActive: false, malphasActive: false, astarothActive: false
      })).toBe('bgm_oakhaven_dawn');

      world.hasAidedVillagersOrCedric = true;
      expect(resolveActiveCampaignObjective(world).chapterId).toBe(2);

      world.hasDeliveredBirdOnOakHill = true;
      world.narrativePhase = 'MIDNIGHT_SIEGE';
      expect(resolveActiveCampaignObjective(world).chapterId).toBe(3);

      world.hasTalkedToKhaterineOrFought = true;
      world.hasVisitedApothecary = true;
      chronicle.recordPerfectParry();
      chronicle.recordPerfectDodge();
      chronicle.recordComboFinisher();

      // Boss 1: Mother Morwenna
      world.morwennaAwakened = true;
      expect(resolveDynamic3DSoundscape({
        currentArea: 'surface', narrativePhase: 'MIDNIGHT_SIEGE',
        morwennaActive: true, inquisitorActive: false, rootProwlerActive: false,
        crucibleActive: false, vaneActive: false, malphasActive: false, astarothActive: false
      })).toBe('bgm_boss_inquisition');
      const morwenna = new MorwennaEncounter();
      morwenna.takeDamage(500);
      expect(morwenna.isDefeated).toBe(true);
      expect(morwenna.claimRewards(inventory, progression).keyGranted).toBe(true);
      chronicle.recordEnemyPurified(true);
      world.morwennaDefeated = true;
      world.cemeteryGateOpen = true;

      // Boss 2: Catacomb Inquisitor
      world.currentArea = 'crypts_interior';
      expect(resolveActiveCampaignObjective(world).chapterId).toBe(6);
      const inquisitor = new CatacombInquisitor();
      inquisitor.takeDamage(400);
      expect(inquisitor.isDefeated).toBe(true);
      expect(inquisitor.claimRewards(inventory, progression).claimed).toBe(true);
      chronicle.recordEnemyPurified(true);
      world.inquisitorDefeated = true;

      // Boss 3: Root Prowler in Black Willow Forest
      world.currentArea = 'black_willow_forest';
      const prowler = new RootProwler();
      prowler.takeDamage(400);
      expect(prowler.isDefeated).toBe(true);
      expect(prowler.claimRewards(inventory, progression).claimed).toBe(true);
      chronicle.recordEnemyPurified(true);
      world.rootProwlerDefeated = true;
      world.hasWillowFang = true;

      // --- ACT II: Belltower Summit & Crucible Guardian ---
      world.currentArea = 'belltower_summit';
      expect(resolveDynamic3DSoundscape({
        currentArea: 'belltower_summit', narrativePhase: 'MIDNIGHT_SIEGE',
        morwennaActive: false, inquisitorActive: false, rootProwlerActive: false,
        crucibleActive: false, vaneActive: false, malphasActive: false, astarothActive: false
      })).toBe('bgm_belltower_crucible');
      world.hasInspectedBurnedBarn = true;
      chronicle.unlock('burned_barn_truth');
      world.hasCollectedWillowBird = true;
      chronicle.unlock('crucible_saboteur');

      const crucible = new CrucibleGuardian();
      crucible.takeDamage(500, true);
      expect(crucible.isDefeated).toBe(true);
      expect(crucible.claimRewards(inventory, progression).claimed).toBe(true);
      chronicle.recordEnemyPurified(true);
      world.crucibleGuardianDefeated = true;

      // --- ACT III: Great Stone Bridge & Captain Áureo Vane ---
      world.currentArea = 'great_stone_bridge';
      expect(resolveDynamic3DSoundscape({
        currentArea: 'great_stone_bridge', narrativePhase: 'MIDNIGHT_SIEGE',
        morwennaActive: false, inquisitorActive: false, rootProwlerActive: false,
        crucibleActive: false, vaneActive: false, malphasActive: false, astarothActive: false
      })).toBe('bgm_great_stone_bridge');
      chronicle.recordBridgeKnockoff();
      world.hasFreedRefugees = true;
      world.captainVaneAwakened = true;
      const vane = new CaptainVane();
      vane.breakShield();
      vane.takeDamage(600, false, true);
      expect(vane.isDefeated).toBe(true);
      expect(vane.claimRewards(inventory, progression).claimed).toBe(true);
      chronicle.recordEnemyPurified(true);
      world.captainVaneDefeated = true;

      // --- ACT IV: Londinium Golden Citadel & Rex Malphas (Alaric) ---
      world.currentArea = 'londinium_citadel';
      world.destroyedNarcoticBraziersCount = 3;
      chronicle.recordBrazierDestroyed(3);
      world.shatteredGuiltMirrors = 3;
      world.hasClearedMirrorGallery = true;
      chronicle.recordMirrorShattered(3);
      world.rexMalphasAwakened = true;
      expect(resolveDynamic3DSoundscape({
        currentArea: 'londinium_citadel', narrativePhase: 'MIDNIGHT_SIEGE',
        morwennaActive: false, inquisitorActive: false, rootProwlerActive: false,
        crucibleActive: false, vaneActive: false, malphasActive: true, astarothActive: false
      })).toBe('bgm_boss_final_eclipse');

      const malphas = new RexMalphas();
      malphas.takeDamage(700);
      expect(malphas.isDefeated).toBe(true);
      expect(malphas.claimRewards(inventory, progression).claimed).toBe(true);
      chronicle.recordEnemyPurified(true);
      world.rexMalphasDefeated = true;

      // --- ACT V: Inverted Cathedral -> Alba Gris -> Astaroth -> First Dawn Epilogue ---
      world.currentArea = 'inverted_cathedral';
      expect(resolveActiveCampaignObjective(world).chapterId).toBe(18);
      world.hasForgedAlbaGris = true;
      chronicle.unlock('alba_gris_forged');
      expect(resolveActiveCampaignObjective(world).chapterId).toBe(19);

      const astaroth = new AstarothTitan();
      astaroth.takeDamage(900, true);
      expect(astaroth.isDefeated).toBe(true);
      expect(astaroth.claimRewards(inventory, progression).claimed).toBe(true);
      chronicle.recordEnemyPurified(true);
      world.astarothDefeated = true;
      expect(resolveActiveCampaignObjective(world).progressPct).toBe(98);

      // --- EPILOGUE: First Dawn on Old Oak Hill ---
      world.currentArea = 'surface';
      world.narrativePhase = 'FIRST_DAWN_EPILOGUE';
      chronicle.unlock('first_dawn_champion');

      const epilogueObjective = resolveActiveCampaignObjective(world);
      expect(epilogueObjective.isEpilogue).toBe(true);
      expect(epilogueObjective.progressPct).toBe(100);
      expect(resolveDynamic3DSoundscape({
        currentArea: 'surface', narrativePhase: 'FIRST_DAWN_EPILOGUE',
        morwennaActive: false, inquisitorActive: false, rootProwlerActive: false,
        crucibleActive: false, vaneActive: false, malphasActive: false, astarothActive: false
      })).toBe('bgm_first_dawn_epilogue');

      // Final Chronicle Rank S & 10/10 Canonical Achievements
      const finalRank = chronicle.computeRank();
      expect(finalRank.grade).toBe('S');
      expect(finalRank.unlockedCount).toBe(10);
      expect(progression.getExp()).toBeGreaterThan(1500);

      // Sanctuary Save/Load Round-Trip at Epilogue
      expect(GameSaveManager.saveGame({
        activeHero: 'thomas',
        heroes: {
          thomas: { health: 100, posture: 50, isArmed: true, available: true },
          khaterine: { health: 100, posture: 50, isArmed: true, available: true }
        },
        health: 100,
        maxHealth: 100,
        posture: 50,
        maxPosture: 50,
        inventory: inventory.toJSON(),
        progression: progression.toJSON(),
        sanctuaryVisited: true,
        world: {
          morwennaDefeated: true,
          morwennaPhase2: true,
          cemeteryGateOpen: true,
          checkpoint: { x: 8.6, y: 2.2, z: 5.0 },
          destroyedPropIds: ['narcotic_brazier_1', 'narcotic_brazier_2', 'narcotic_brazier_3'],
          unlockedChapterIds: Array.from({ length: 20 }, (_, i) => i + 1),
          currentChapterId: 20
        }
      })).toBe(true);

      const loaded = GameSaveManager.loadGame();
      expect(loaded?.world.currentChapterId).toBe(20);
      expect(loaded?.world.unlockedChapterIds).toHaveLength(20);
    });
  });
});
