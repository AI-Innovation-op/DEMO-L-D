import { IAudioPort } from '../../application/ports/IAudioPort';

/**
 * Procedural WebAudio sound generator with full Mute / Unmute capability.
 * Produces crisp arcade / medieval fantasy SFX without requiring external audio files.
 */
export class WebAudioSoundAdapter implements IAudioPort {
  private static instance: WebAudioSoundAdapter;
  private ctx: AudioContext | null = null;
  private currentBgmOsc: OscillatorNode | null = null;
  private bgmInterval: number | null = null;
  private bellInterval: number | null = null;
  private droneOscs: OscillatorNode[] = [];
  private isMuted: boolean = false;
  private lastTrackKey: string = 'bgm_oakhaven_night';

  constructor() {
    // Restore mute preference from localStorage if available
    try {
      const savedMute = localStorage.getItem('totd_audio_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    } catch {}
  }

  public static getInstance(): WebAudioSoundAdapter {
    if (!WebAudioSoundAdapter.instance) {
      WebAudioSoundAdapter.instance = new WebAudioSoundAdapter();
    }
    return WebAudioSoundAdapter.instance;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('totd_audio_muted', String(this.isMuted));
    } catch {}

    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.playBgm(this.lastTrackKey);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  private initContext(): AudioContext | null {
    if (this.isMuted) return null;
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
    this.lastTrackKey = trackKey;
    if (this.isMuted) return;

    try {
      this.stopBgm();
      const ctx = this.initContext();
      if (!ctx) return;

      const isBoss = trackKey.includes('boss');

      // 1. Polyphonic Cathedral Organ Drone (lowpass filtered open fifths)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isBoss ? 260 : 380, ctx.currentTime);
      filter.connect(ctx.destination);

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.04, ctx.currentTime);
      droneGain.connect(filter);

      const droneFreqs = isBoss ? [73.4, 110.0, 146.8] : [110.0, 164.8, 220.0];
      droneFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = isBoss ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.connect(droneGain);
        osc.start();
        this.droneOscs.push(osc);
      });

      // 2. Arpeggiated melody line (medieval fantasy mode)
      const noteSeq = isBoss
        ? [146.8, 155.6, 146.8, 174.6, 130.8, 146.8, 174.6, 220.0]
        : [220.0, 246.9, 261.6, 293.7, 329.6, 293.7, 261.6, 196.0];

      let step = 0;
      this.bgmInterval = window.setInterval(() => {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = isBoss ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(noteSeq[step % noteSeq.length], now);

        const vol = isBoss ? 0.05 : 0.045;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isBoss ? 0.28 : 0.38));

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + (isBoss ? 0.29 : 0.39));
        step++;
      }, isBoss ? 280 : 380);

      // 3. Cathedral Bell Chime (every 12 seconds in normal mode)
      if (!isBoss) {
        this.bellInterval = window.setInterval(() => {
          if (!this.ctx || this.isMuted) return;
          this.triggerCathedralBell();
        }, 12000);
      }
    } catch {}
  }

  private triggerCathedralBell(): void {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const bellPartials = [440, 880, 1320];
    bellPartials.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const amp = 0.035 / (idx + 1);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 3.9);
    });
  }

  public stopBgm(): void {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bellInterval) {
      clearInterval(this.bellInterval);
      this.bellInterval = null;
    }
    this.droneOscs.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.droneOscs = [];
    if (this.currentBgmOsc) {
      try {
        this.currentBgmOsc.stop();
        this.currentBgmOsc.disconnect();
      } catch {}
      this.currentBgmOsc = null;
    }
  }

  public playSfx(sfxKey: string): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
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
      } else if (sfxKey === 'warning') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.1);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (sfxKey === 'parry') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.28);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (sfxKey === 'shield_break') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.32);
      }
    } catch {}
  }

  public playCombatHit(isCritical: boolean = false): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
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
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

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
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
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
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
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
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
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

  public playGlassShatter(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Burst of high-frequency white noise / crashing squares
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200 + i * 400, now + i * 0.04);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35 + i * 0.04);

        gain.gain.setValueAtTime(0.3, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + i * 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + 0.36 + i * 0.04);
      }
    } catch {}
  }

  public playClockRewind(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Rapid high-pitched backward tick-tock clicks
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900 - i * 150, now + i * 0.05);

        gain.gain.setValueAtTime(0.18, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.03);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.035);
      }
    } catch {}
  }

  public playHealingEmber(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }

  public playCenserSwing(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch {}
  }

  public playWoodBreak(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Deep wood splinter crunch (two detuned square/triangle pulses)
      [160, 240].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.02);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.22 + idx * 0.02);

        gain.gain.setValueAtTime(0.25, now + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22 + idx * 0.02);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.02);
        osc.stop(now + 0.23 + idx * 0.02);
      });
    } catch {}
  }

  public playBowShot(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Whistling abyssal arrow release (fast sine sweep with resonant twang)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.22);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch {}
  }

  public playSpikeTrap(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Sharp mechanical trigger snap (high sawtooth burst)
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'sawtooth';
      snapOsc.frequency.setValueAtTime(1400, now);
      snapOsc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

      snapGain.gain.setValueAtTime(0.25, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.09);

      // 2. Iron spikes piercing upward (clang + metal friction)
      const clangOsc = ctx.createOscillator();
      const clangGain = ctx.createGain();
      clangOsc.type = 'square';
      clangOsc.frequency.setValueAtTime(320, now + 0.02);
      clangOsc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

      clangGain.gain.setValueAtTime(0.28, now + 0.02);
      clangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      clangOsc.connect(clangGain);
      clangGain.connect(ctx.destination);
      clangOsc.start(now + 0.02);
      clangOsc.stop(now + 0.27);
    } catch {}
  }

  public playCryptDoor(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Heavy grinding stone slab rumble (low frequency triangle with sub-bass drone)
      const stoneOsc = ctx.createOscillator();
      const stoneGain = ctx.createGain();
      stoneOsc.type = 'triangle';
      stoneOsc.frequency.setValueAtTime(85, now);
      stoneOsc.frequency.linearRampToValueAtTime(45, now + 0.7);

      stoneGain.gain.setValueAtTime(0.32, now);
      stoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      stoneOsc.connect(stoneGain);
      stoneGain.connect(ctx.destination);
      stoneOsc.start(now);
      stoneOsc.stop(now + 0.76);

      // Resonant iron hinges / lock mechanism click
      const hingeOsc = ctx.createOscillator();
      const hingeGain = ctx.createGain();
      hingeOsc.type = 'sawtooth';
      hingeOsc.frequency.setValueAtTime(420, now + 0.1);
      hingeOsc.frequency.exponentialRampToValueAtTime(110, now + 0.45);

      hingeGain.gain.setValueAtTime(0.18, now + 0.1);
      hingeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      hingeOsc.connect(hingeGain);
      hingeGain.connect(ctx.destination);
      hingeOsc.start(now + 0.1);
      hingeOsc.stop(now + 0.5);
    } catch {}
  }

  public playHolyCurse(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Ominous dissonant choir / corrupted holy flare
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.linearRampToValueAtTime(110, now + 0.6);
      osc2.frequency.setValueAtTime(330, now);
      osc2.frequency.linearRampToValueAtTime(165, now + 0.6);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.66);
      osc2.stop(now + 0.66);
    } catch {}
  }

  public playMaceImpact(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Heavy blunt iron mace crunch
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.28);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.31);
    } catch {}
  }

  public playCauldronBubble(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Rapid playful bubbling pops
      [0, 0.05, 0.11, 0.16].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const startFreq = 420 + idx * 80;
        osc.frequency.setValueAtTime(startFreq, now + delay);
        osc.frequency.exponentialRampToValueAtTime(startFreq + 260, now + delay + 0.045);

        gain.gain.setValueAtTime(0.14, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.05);
      });
    } catch {}
  }

  public playHeartbeat(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Double thump: lub-dub
      [0, 0.14].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const startFreq = idx === 0 ? 70 : 55;
        osc.frequency.setValueAtTime(startFreq, now + delay);
        osc.frequency.exponentialRampToValueAtTime(30, now + delay + 0.12);

        gain.gain.setValueAtTime(0.4, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.13);
      });
    } catch {}
  }

  public playHolyFlash(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Resonant sacred chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.35);
      osc2.frequency.setValueAtTime(1320, now);
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.4);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.46);
      osc2.stop(now + 0.46);
    } catch {}
  }

  public playFlaskExplosion(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Glass shatter burst + flame whoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    } catch {}
  }

  public playArrowSwitch(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.09);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }
}
