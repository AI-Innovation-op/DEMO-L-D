import { IAudioPort } from '../../application/ports/IAudioPort';
import {
  ActSoundscapeSpec,
  resolveSoundscapeSpec
} from '../../domain/audio/ActSoundscapeCatalog';

/**
 * Procedural WebAudio sound & adaptive dark-gothic soundscape generator
 * with full Mute / Unmute capability, smooth BGM crossfades, LFO-modulated
 * atmospheric noise beds (wind, forge, hearth, abyss) and dynamic boss themes.
 */
export class WebAudioSoundAdapter implements IAudioPort {
  private static instance: WebAudioSoundAdapter;
  private ctx: AudioContext | null = null;
  private currentBgmOsc: OscillatorNode | null = null;
  private bgmInterval: number | null = null;
  private bellInterval: number | null = null;
  private droneOscs: OscillatorNode[] = [];
  private ambientSources: AudioScheduledSourceNode[] = [];
  private bgmMasterGain: GainNode | null = null;
  private masterOutputGain: GainNode | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.85;
  private isBgmPlaying: boolean = false;
  private lastTrackKey: string = 'bgm_oakhaven_dawn';

  constructor() {
    // Restore mute & volume preferences from localStorage if available
    try {
      const savedMute = localStorage.getItem('totd_audio_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedVol = localStorage.getItem('totd_audio_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!Number.isNaN(parsed)) {
          this.masterVolume = Math.max(0, Math.min(1, parsed));
        }
      }
    } catch {}
  }

  public static getInstance(): WebAudioSoundAdapter {
    if (!WebAudioSoundAdapter.instance) {
      WebAudioSoundAdapter.instance = new WebAudioSoundAdapter();
    }
    return WebAudioSoundAdapter.instance;
  }

  public getCurrentTrackKey(): string {
    return this.lastTrackKey;
  }

  public getCurrentTrackSpec(): ActSoundscapeSpec {
    return resolveSoundscapeSpec(this.lastTrackKey);
  }

  public unlockAndResumeIfNeeded(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (!this.isBgmPlaying && this.lastTrackKey) {
        this.playBgm(this.lastTrackKey, true);
      }
    } catch {}
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

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setMasterVolume(volume: number): number {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 0.85));
    this.masterVolume = clamped;
    try {
      localStorage.setItem('totd_audio_volume', String(clamped));
    } catch {}
    if (this.masterOutputGain && this.ctx) {
      try {
        this.masterOutputGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.04);
      } catch {}
    }
    return this.masterVolume;
  }

  private getOutputNode(ctx: AudioContext): AudioNode {
    if (!this.masterOutputGain) {
      this.masterOutputGain = ctx.createGain();
      this.masterOutputGain.gain.setValueAtTime(this.masterVolume, ctx.currentTime);
      this.masterOutputGain.connect(ctx.destination);
    }
    return this.masterOutputGain;
  }

  private initContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getOrCreatePinkNoiseBuffer(ctx: AudioContext): AudioBuffer | null {
    if (this.pinkNoiseBuffer && this.pinkNoiseBuffer.sampleRate === ctx.sampleRate) {
      return this.pinkNoiseBuffer;
    }
    try {
      const durationSec = 3.0;
      const bufferSize = Math.floor(ctx.sampleRate * durationSec);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      // Paul Kellet's refined pink-noise filter for warm, organic wind/fire/void ambience
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
      this.pinkNoiseBuffer = buffer;
      return buffer;
    } catch {
      return null;
    }
  }

  public playBgm(trackKey: string, _loop: boolean = true): void {
    const spec = resolveSoundscapeSpec(trackKey);
    const normalizedKey = spec.id;

    // Idempotent guard: avoid restarting active track when area/boss polling re-checks
    if (this.isBgmPlaying && this.lastTrackKey === normalizedKey && !this.isMuted) {
      return;
    }

    this.lastTrackKey = normalizedKey;
    if (this.isMuted) return;

    try {
      this.stopBgm(true);
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Dedicated Master Bus per track with smooth 0.75s fade-in routed through Master Volume
      const masterBus = ctx.createGain();
      masterBus.gain.setValueAtTime(0.0001, now);
      masterBus.gain.linearRampToValueAtTime(1.0, now + 0.75);
      masterBus.connect(this.getOutputNode(ctx));
      this.bgmMasterGain = masterBus;
      this.isBgmPlaying = true;

      // 1. Polyphonic Gothic Harmonic Drone (lowpass filtered, optional eerie detune for Londinium/Abyss)
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(spec.droneFilterHz, now);
      droneFilter.connect(masterBus);

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(spec.droneGain, now);
      droneGain.connect(droneFilter);

      spec.droneFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = spec.droneWave;
        osc.frequency.setValueAtTime(freq, now);
        if (spec.detuneCents && idx > 0) {
          osc.detune.setValueAtTime(idx % 2 === 1 ? spec.detuneCents : -spec.detuneCents, now);
        }
        osc.connect(droneGain);
        osc.start(now);
        this.droneOscs.push(osc);
      });

      // 2. LFO-Modulated Atmospheric Noise Bed (wind gusts, forge heat, hearth fire, subterranean hum, abyss void)
      const noiseBuffer = this.getOrCreatePinkNoiseBuffer(ctx);
      if (noiseBuffer) {
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;
        noiseSrc.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = spec.noiseFilterType;
        noiseFilter.frequency.setValueAtTime(spec.noiseBaseFreqHz, now);
        noiseFilter.Q.setValueAtTime(spec.noiseFilterType === 'bandpass' ? 2.4 : 0.9, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(spec.noiseGain, now);

        // Slow LFO sweeps the filter frequency to create organic gusts / breathing abyss
        const lfoOsc = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfoOsc.type = 'sine';
        lfoOsc.frequency.setValueAtTime(spec.noiseLfoRateHz, now);
        lfoGain.gain.setValueAtTime(spec.noiseLfoDepthHz, now);
        lfoOsc.connect(lfoGain);
        lfoGain.connect(noiseFilter.frequency);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterBus);

        noiseSrc.start(now);
        lfoOsc.start(now);
        this.ambientSources.push(noiseSrc, lfoOsc);
      }

      // 3. Adaptive Melodic Arpeggiator + Dynamic Percussion Layer
      let step = 0;
      const melodyFilter = ctx.createBiquadFilter();
      melodyFilter.type = 'lowpass';
      melodyFilter.frequency.setValueAtTime(spec.isBoss ? 1450 : 1200, now);
      melodyFilter.connect(masterBus);

      this.bgmInterval = window.setInterval(() => {
        if (!this.ctx || this.isMuted || this.bgmMasterGain !== masterBus) return;
        const t = this.ctx.currentTime;
        const freq = spec.melodyFreqs[step % spec.melodyFreqs.length];

        // Primary melody voice
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = spec.melodyWave;
        osc.frequency.setValueAtTime(freq, t);
        if (spec.detuneCents && step % 3 === 0) {
          osc.detune.setValueAtTime(spec.detuneCents * 0.7, t);
        }

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(spec.noteGain, t + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + spec.noteDurationSec);

        osc.connect(gain);
        gain.connect(melodyFilter);
        osc.start(t);
        osc.stop(t + spec.noteDurationSec + 0.02);

        // Climax boss harmonic choir upper-fifth shimmer on accented beats
        if (spec.id === 'bgm_boss_final_eclipse' && step % 4 === 0) {
          const choir = this.ctx.createOscillator();
          const choirGain = this.ctx.createGain();
          choir.type = 'triangle';
          choir.frequency.setValueAtTime(freq * 1.5, t);
          choirGain.gain.setValueAtTime(0.001, t);
          choirGain.gain.linearRampToValueAtTime(0.024, t + 0.05);
          choirGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.42);
          choir.connect(choirGain);
          choirGain.connect(melodyFilter);
          choir.start(t);
          choir.stop(t + 0.44);
        }

        // Rhythmic percussion synthesis per Act / Boss pattern
        this.triggerStepPercussion(spec.percussionPattern, step, t, masterBus);

        step++;
      }, spec.stepMs);

      // 4. Periodic Environmental & Musical Accents (bells, cavern drips, venetian glass, dawn harp, abyss pulse)
      if (spec.accentChimeIntervalMs > 0 && spec.accentChimeKind !== 'none') {
        this.bellInterval = window.setInterval(() => {
          if (!this.ctx || this.isMuted || this.bgmMasterGain !== masterBus) return;
          this.triggerSoundscapeAccent(spec.accentChimeKind, masterBus);
        }, spec.accentChimeIntervalMs);
      }
    } catch {}
  }

  private triggerStepPercussion(
    pattern: ActSoundscapeSpec['percussionPattern'],
    step: number,
    now: number,
    dest: AudioNode
  ): void {
    if (!this.ctx || pattern === 'none') return;

    if (pattern === 'anvil' && step % 8 === 0) {
      // Distant resonant bronze forge strike in Act II Belltower
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.22);
      gain.gain.setValueAtTime(0.028, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.24);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.25);
      return;
    }

    if (pattern === 'march' && step % 4 === 0) {
      // Subtle heroic bridge march drum
      const drum = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      drum.type = 'sine';
      drum.frequency.setValueAtTime(105, now);
      drum.frequency.exponentialRampToValueAtTime(48, now + 0.14);
      gain.gain.setValueAtTime(0.048, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.16);
      drum.connect(gain);
      gain.connect(dest);
      drum.start(now);
      drum.stop(now + 0.17);
      return;
    }

    if (pattern === 'war_timpani' && (step % 4 === 0 || step % 4 === 2)) {
      const strong = step % 4 === 0;
      const drum = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      drum.type = 'sine';
      drum.frequency.setValueAtTime(strong ? 118 : 92, now);
      drum.frequency.exponentialRampToValueAtTime(42, now + 0.16);
      gain.gain.setValueAtTime(strong ? 0.085 : 0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.18);
      drum.connect(gain);
      gain.connect(dest);
      drum.start(now);
      drum.stop(now + 0.19);
      return;
    }

    if (pattern === 'eclipse_cataclysm' && (step % 2 === 0)) {
      const downbeat = step % 4 === 0;
      const drum = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      drum.type = downbeat ? 'triangle' : 'sine';
      drum.frequency.setValueAtTime(downbeat ? 128 : 88, now);
      drum.frequency.exponentialRampToValueAtTime(36, now + 0.15);
      gain.gain.setValueAtTime(downbeat ? 0.095 : 0.052, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.17);
      drum.connect(gain);
      gain.connect(dest);
      drum.start(now);
      drum.stop(now + 0.18);
    }
  }

  private triggerSoundscapeAccent(
    kind: ActSoundscapeSpec['accentChimeKind'],
    dest: AudioNode
  ): void {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (kind === 'cathedral_bell' || kind === 'bronze_bell') {
      const base = kind === 'bronze_bell' ? 146.83 : 440;
      const partials = kind === 'bronze_bell' ? [base, base * 2.42, base * 3.1] : [base, base * 2, base * 3];
      partials.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        const amp = (kind === 'bronze_bell' ? 0.042 : 0.03) / (idx + 1);
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 3.5);
      });
      return;
    }

    if (kind === 'crystal_drip') {
      // Echoing subterranean water drop in San Jude Crypts
      [0, 0.24].forEach((delay, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1180, now + delay);
        osc.frequency.exponentialRampToValueAtTime(1680, now + delay + 0.06);
        gain.gain.setValueAtTime(idx === 0 ? 0.032 : 0.014, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.0002, now + delay + 0.14);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + delay);
        osc.stop(now + delay + 0.15);
      });
      return;
    }

    if (kind === 'venetian_glass') {
      // Shimmering gilded glass overtones in Londinium
      [784, 1175, 1480].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.022, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0002, now + idx * 0.07 + 1.4);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 1.45);
      });
      return;
    }

    if (kind === 'dawn_harp') {
      // Gentle ascending sacred harp shimmer for Oakhaven Dawn / Black Willow / First Dawn Epilogue
      [392, 493.88, 587.33, 783.99].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.024, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0002, now + idx * 0.09 + 1.5);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 1.55);
      });
      return;
    }

    if (kind === 'abyss_pulse') {
      // Deep Black Sun gravity resonance pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(78, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 1.6);
      gain.gain.setValueAtTime(0.058, now);
      gain.gain.exponentialRampToValueAtTime(0.0003, now + 1.65);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 1.7);
    }
  }

  public stopBgm(fadeOut: boolean = false): void {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bellInterval) {
      clearInterval(this.bellInterval);
      this.bellInterval = null;
    }

    const oldDrones = this.droneOscs;
    const oldAmbients = this.ambientSources;
    const oldMaster = this.bgmMasterGain;
    this.droneOscs = [];
    this.ambientSources = [];
    this.bgmMasterGain = null;

    const cleanupNodes = (): void => {
      oldDrones.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      oldAmbients.forEach(src => {
        try {
          src.stop();
          src.disconnect();
        } catch {}
      });
      if (oldMaster) {
        try {
          oldMaster.disconnect();
        } catch {}
      }
    };

    if (fadeOut && this.ctx && oldMaster) {
      try {
        const now = this.ctx.currentTime;
        oldMaster.gain.cancelScheduledValues(now);
        oldMaster.gain.setValueAtTime(Math.max(0.0001, oldMaster.gain.value), now);
        oldMaster.gain.linearRampToValueAtTime(0.0001, now + 0.35);
        window.setTimeout(cleanupNodes, 380);
      } catch {
        cleanupNodes();
      }
    } else {
      cleanupNodes();
    }

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

  public playWillowWhisper(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Ethereal dual sine resonance with gentle chorus sweep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(380, now);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.4);
      osc1.frequency.exponentialRampToValueAtTime(290, now + 0.9);

      osc2.frequency.setValueAtTime(570, now);
      osc2.frequency.exponentialRampToValueAtTime(660, now + 0.4);
      osc2.frequency.exponentialRampToValueAtTime(435, now + 0.9);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.96);
      osc2.stop(now + 0.96);
    } catch {}
  }

  public playBeastRoar(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Low guttural growl with harmonic distortion sweep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.linearRampToValueAtTime(85, now + 0.35);
      osc1.frequency.linearRampToValueAtTime(55, now + 0.7);

      osc2.frequency.setValueAtTime(70, now);
      osc2.frequency.linearRampToValueAtTime(45, now + 0.7);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.73);
      osc2.stop(now + 0.73);
    } catch {}
  }

  public playDaggerVortex(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Fast slicing metallic sweep + resonant ring
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880 + i * 220, now + i * 0.08);
        osc.frequency.exponentialRampToValueAtTime(220, now + i * 0.08 + 0.22);

        gain.gain.setValueAtTime(0.24, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.23);
      }
    } catch {}
  }

  public playBellToll(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Heavy resonant bronze bell toll with sub-bass fundamental and metallic overtones
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, now);
      osc1.frequency.exponentialRampToValueAtTime(108, now + 1.8);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(277, now);
      osc2.frequency.exponentialRampToValueAtTime(270, now + 1.2);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.05);
      osc2.stop(now + 2.05);
    } catch {}
  }

  public playShieldCrush(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Heavy metallic armor impact with brass resonance
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.39);
    } catch {}
  }

  public playAstralDistortion(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Time warp / Ley del Deseo warped frequency sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.6);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.62);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.63);
    } catch {}
  }

  public playCosmicChime(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Sacred celestial chime chord for Alba Gris / Primer Amanecer
      const freqs = [528, 660, 792, 1056];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.18, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 1.25);
      });
    } catch {}
  }
}
