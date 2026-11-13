import { IAudioPort } from '../../application/ports/IAudioPort';

/**
 * Procedural WebAudio sound generator.
 * Produces crisp arcade / medieval fantasy SFX without requiring external audio files.
 */
export class WebAudioSoundAdapter implements IAudioPort {
  private ctx: AudioContext | null = null;
  private currentBgmOsc: OscillatorNode | null = null;
  private bgmInterval: number | null = null;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playBgm(trackKey: string, _loop: boolean = true): void {
    try {
      this.stopBgm();
      const ctx = this.initContext();

      // Simple procedural ambient synth loop for arcade vibe
      let noteSeq = [220, 247, 261, 293, 329, 293, 261, 196]; // A minor medieval mode
      if (trackKey.includes('boss')) {
        noteSeq = [164, 174, 164, 155, 146, 155, 164, 220]; // Dissonant tense boss motif
      }

      let step = 0;
      this.bgmInterval = window.setInterval(() => {
        if (!this.ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = trackKey.includes('boss') ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(noteSeq[step % noteSeq.length], ctx.currentTime);

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.36);
        step++;
      }, 350);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public stopBgm(): void {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.currentBgmOsc) {
      this.currentBgmOsc.stop();
      this.currentBgmOsc.disconnect();
      this.currentBgmOsc = null;
    }
  }

  public playSfx(sfxKey: string): void {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (sfxKey === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (sfxKey === 'dodge') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.18);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch {
      // Safe fallback
    }
  }

  public playCombatHit(isCritical: boolean = false): void {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isCritical ? 'sawtooth' : 'square';
      const now = ctx.currentTime;
      const freq = isCritical ? 480 : 280;

      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

      gain.gain.setValueAtTime(isCritical ? 0.2 : 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  public playDisarmSound(): void {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      // Metallic clang and clatter
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }

  public playWeaponThrowSound(): void {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch {}
  }

  public playFinisherSound(isCinematic: boolean): void {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(isCinematic ? 650 : 400, now);
      osc1.frequency.exponentialRampToValueAtTime(50, now + (isCinematic ? 0.6 : 0.3));

      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + (isCinematic ? 0.6 : 0.3));

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + (isCinematic ? 0.61 : 0.31));
    } catch {}
  }

  public playBossPhaseChangeSound(): void {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.5);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.51);
    } catch {}
  }
}
