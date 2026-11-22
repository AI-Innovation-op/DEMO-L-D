import { describe, it, expect, beforeEach } from 'vitest';
import { WebAudioSoundAdapter } from '../../src/infrastructure/audio/WebAudioSoundAdapter';
import {
  ACT_SOUNDSCAPE_CATALOG,
  resolveDynamic3DSoundscape,
  resolveSoundscapeSpec,
  DynamicAudioSnapshot3D
} from '../../src/domain/audio/ActSoundscapeCatalog';

function makeAudioSnapshot(overrides: Partial<DynamicAudioSnapshot3D> = {}): DynamicAudioSnapshot3D {
  return {
    currentArea: 'surface',
    narrativePhase: 'DAWN_CALM',
    morwennaActive: false,
    inquisitorActive: false,
    rootProwlerActive: false,
    crucibleActive: false,
    vaneActive: false,
    malphasActive: false,
    astarothActive: false,
    ...overrides
  };
}

describe('WebAudioSoundAdapter - Procedural Audio Synthesis', () => {
  let audio: WebAudioSoundAdapter;

  beforeEach(() => {
    audio = WebAudioSoundAdapter.getInstance();
  });

  it('retrieves singleton instance', () => {
    expect(audio).toBeDefined();
    expect(WebAudioSoundAdapter.getInstance()).toBe(audio);
  });

  it('supports mute toggling and state tracking', () => {
    const initialMute = audio.getIsMuted();
    const toggled = audio.toggleMute();
    expect(toggled).toBe(!initialMute);
    expect(audio.getIsMuted()).toBe(!initialMute);

    // Toggle back
    audio.toggleMute();
    expect(audio.getIsMuted()).toBe(initialMute);
  });

  it('safely handles procedural sound triggers without throwing in node/test environment', () => {
    expect(() => audio.playSpikeTrap()).not.toThrow();
    expect(() => audio.playCryptDoor()).not.toThrow();
    expect(() => audio.playHolyCurse()).not.toThrow();
    expect(() => audio.playMaceImpact()).not.toThrow();
    expect(() => audio.playCauldronBubble()).not.toThrow();
    expect(() => audio.playHeartbeat()).not.toThrow();
    expect(() => audio.playHolyFlash()).not.toThrow();
    expect(() => audio.playFlaskExplosion()).not.toThrow();
    expect(() => audio.playArrowSwitch()).not.toThrow();
    expect(() => audio.playCombatHit(true)).not.toThrow();
    expect(() => audio.playCombatHit(false)).not.toThrow();
    expect(() => audio.playFinisherSound(true)).not.toThrow();
    expect(() => audio.playBossPhaseChangeSound()).not.toThrow();
    expect(() => audio.playSfx('warning')).not.toThrow();
    expect(() => audio.playSfx('parry')).not.toThrow();
  });

  it('defines 11 valid Act, Boss, and Epilogue soundscapes with atmospheric noise & musical profiles', () => {
    const specs = Object.values(ACT_SOUNDSCAPE_CATALOG);
    expect(specs).toHaveLength(11);

    for (const spec of specs) {
      expect(spec.displayLabel.length).toBeGreaterThan(5);
      expect(spec.atmosphereTag.length).toBeGreaterThan(5);
      expect(spec.droneFreqs.length).toBeGreaterThanOrEqual(3);
      expect(spec.melodyFreqs.length).toBeGreaterThanOrEqual(8);
      expect(spec.stepMs).toBeGreaterThanOrEqual(150);
      expect(spec.noiseBaseFreqHz).toBeGreaterThan(50);
    }
  });

  it('resolves distinct soundscapes across all 7 3D zones, Boss awakenings, and First Dawn Epilogue', () => {
    // Act I Dawn vs Midnight Siege
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot())).toBe('bgm_oakhaven_dawn');
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ narrativePhase: 'MIDNIGHT_SIEGE' }))).toBe('bgm_oakhaven_night');

    // Exploration across all other areas
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ currentArea: 'crypts_interior' }))).toBe('bgm_crypts_san_jude');
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ currentArea: 'black_willow_forest' }))).toBe('bgm_black_willow');
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ currentArea: 'belltower_summit' }))).toBe('bgm_belltower_crucible');
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ currentArea: 'great_stone_bridge' }))).toBe('bgm_great_stone_bridge');
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ currentArea: 'londinium_citadel' }))).toBe('bgm_londinium_city');
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ currentArea: 'inverted_cathedral' }))).toBe('bgm_cathedral_abyss');

    // Boss awakenings override area ambience cleanly
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ currentArea: 'surface', morwennaActive: true }))).toBe('bgm_boss_inquisition');
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ currentArea: 'belltower_summit', crucibleActive: true }))).toBe('bgm_boss_inquisition');
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ currentArea: 'great_stone_bridge', vaneActive: true }))).toBe('bgm_boss_inquisition');
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ currentArea: 'londinium_citadel', malphasActive: true }))).toBe('bgm_boss_final_eclipse');
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ currentArea: 'inverted_cathedral', astarothActive: true }))).toBe('bgm_boss_final_eclipse');

    // First Dawn Epilogue takes highest priority
    expect(resolveDynamic3DSoundscape(makeAudioSnapshot({ narrativePhase: 'FIRST_DAWN_EPILOGUE' }))).toBe('bgm_first_dawn_epilogue');
  });

  it('normalizes legacy BGM track keys and updates adapter track state cleanly without throwing', () => {
    expect(resolveSoundscapeSpec('boss_morwenna').id).toBe('bgm_boss_inquisition');
    expect(resolveSoundscapeSpec('boss_astaroth_eclipse').id).toBe('bgm_boss_final_eclipse');
    expect(resolveSoundscapeSpec('bgm_londinium_city').id).toBe('bgm_londinium_city');

    expect(() => audio.playBgm('bgm_great_stone_bridge')).not.toThrow();
    expect(audio.getCurrentTrackKey()).toBe('bgm_great_stone_bridge');
    expect(audio.getCurrentTrackSpec().atmosphereKind).toBe('wind_gust');

    expect(() => audio.unlockAndResumeIfNeeded()).not.toThrow();
    expect(() => audio.stopBgm(true)).not.toThrow();
  });
});
