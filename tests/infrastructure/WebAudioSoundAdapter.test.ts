import { describe, it, expect, beforeEach } from 'vitest';
import { WebAudioSoundAdapter } from '../../src/infrastructure/audio/WebAudioSoundAdapter';

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
    expect(() => audio.playCombatHit(true)).not.toThrow();
    expect(() => audio.playCombatHit(false)).not.toThrow();
    expect(() => audio.playFinisherSound(true)).not.toThrow();
    expect(() => audio.playBossPhaseChangeSound()).not.toThrow();
    expect(() => audio.playSfx('warning')).not.toThrow();
    expect(() => audio.playSfx('parry')).not.toThrow();
  });
});
