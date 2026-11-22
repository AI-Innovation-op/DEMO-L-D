import { DungeonArea } from '../encounters/DungeonAreaManager';

export type SoundscapeTrackId =
  | 'bgm_oakhaven_dawn'
  | 'bgm_oakhaven_night'
  | 'bgm_crypts_san_jude'
  | 'bgm_black_willow'
  | 'bgm_belltower_crucible'
  | 'bgm_great_stone_bridge'
  | 'bgm_londinium_city'
  | 'bgm_cathedral_abyss'
  | 'bgm_boss_inquisition'
  | 'bgm_boss_final_eclipse'
  | 'bgm_first_dawn_epilogue';

export type AtmosphereNoiseKind =
  | 'morning_breeze'
  | 'hearth_crackle'
  | 'cavern_drip'
  | 'willow_whisper'
  | 'forge_rumble'
  | 'wind_gust'
  | 'narcotic_choir'
  | 'abyss_void';

export interface ActSoundscapeSpec {
  readonly id: SoundscapeTrackId;
  readonly displayLabel: string;
  readonly atmosphereTag: string;
  readonly isBoss: boolean;
  readonly droneFreqs: readonly number[];
  readonly droneWave: OscillatorType;
  readonly droneFilterHz: number;
  readonly droneGain: number;
  readonly detuneCents?: number;
  readonly melodyFreqs: readonly number[];
  readonly melodyWave: OscillatorType;
  readonly stepMs: number;
  readonly noteGain: number;
  readonly noteDurationSec: number;
  readonly atmosphereKind: AtmosphereNoiseKind;
  readonly noiseFilterType: BiquadFilterType;
  readonly noiseBaseFreqHz: number;
  readonly noiseLfoRateHz: number;
  readonly noiseLfoDepthHz: number;
  readonly noiseGain: number;
  readonly percussionPattern: 'none' | 'anvil' | 'march' | 'war_timpani' | 'eclipse_cataclysm';
  readonly accentChimeIntervalMs: number;
  readonly accentChimeKind: 'none' | 'cathedral_bell' | 'bronze_bell' | 'crystal_drip' | 'venetian_glass' | 'dawn_harp' | 'abyss_pulse';
}

export interface DynamicAudioSnapshot3D {
  readonly currentArea: DungeonArea;
  readonly narrativePhase: 'DAWN_CALM' | 'MIDNIGHT_SIEGE' | 'FIRST_DAWN_EPILOGUE';
  readonly morwennaActive: boolean;
  readonly inquisitorActive: boolean;
  readonly rootProwlerActive: boolean;
  readonly crucibleActive: boolean;
  readonly vaneActive: boolean;
  readonly malphasActive: boolean;
  readonly astarothActive: boolean;
}

/**
 * 11 canonical procedural soundscapes & dynamic boss themes spanning all 5 Acts + Epilogue
 * of "The Light in the Darkness (Double Blood)".
 */
export const ACT_SOUNDSCAPE_CATALOG: Record<SoundscapeTrackId, ActSoundscapeSpec> = {
  bgm_oakhaven_dawn: {
    id: 'bgm_oakhaven_dawn',
    displayLabel: 'Acto I · Alba de Niebla en Oakhaven',
    atmosphereTag: 'Brisa matinal y laúd de San Jude',
    isBoss: false,
    // D Dorian warm open fifths (D2, A2, D3)
    droneFreqs: [73.42, 110.0, 146.83],
    droneWave: 'sine',
    droneFilterHz: 420,
    droneGain: 0.032,
    melodyFreqs: [293.66, 329.63, 349.23, 440.0, 392.0, 349.23, 329.63, 261.63],
    melodyWave: 'triangle',
    stepMs: 480,
    noteGain: 0.036,
    noteDurationSec: 0.55,
    atmosphereKind: 'morning_breeze',
    noiseFilterType: 'bandpass',
    noiseBaseFreqHz: 520,
    noiseLfoRateHz: 0.16,
    noiseLfoDepthHz: 180,
    noiseGain: 0.014,
    percussionPattern: 'none',
    accentChimeIntervalMs: 14000,
    accentChimeKind: 'dawn_harp'
  },

  bgm_oakhaven_night: {
    id: 'bgm_oakhaven_night',
    displayLabel: 'Acto I · Asedio Nocturno de Oakhaven',
    atmosphereTag: 'Pira encendida y órgano de vigilia',
    isBoss: false,
    // A Aeolian cathedral organ (A2, E3, A3)
    droneFreqs: [110.0, 164.81, 220.0],
    droneWave: 'triangle',
    droneFilterHz: 360,
    droneGain: 0.038,
    melodyFreqs: [220.0, 246.94, 261.63, 293.66, 329.63, 293.66, 261.63, 196.0],
    melodyWave: 'triangle',
    stepMs: 380,
    noteGain: 0.042,
    noteDurationSec: 0.4,
    atmosphereKind: 'hearth_crackle',
    noiseFilterType: 'bandpass',
    noiseBaseFreqHz: 420,
    noiseLfoRateHz: 0.45,
    noiseLfoDepthHz: 210,
    noiseGain: 0.018,
    percussionPattern: 'none',
    accentChimeIntervalMs: 11500,
    accentChimeKind: 'cathedral_bell'
  },

  bgm_crypts_san_jude: {
    id: 'bgm_crypts_san_jude',
    displayLabel: 'Acto I · Criptas de San Jude',
    atmosphereTag: 'Eco subterráneo y gotas en piedra',
    isBoss: false,
    // E Phrygian subterranean drone (E2, B2, F3 subtle tension)
    droneFreqs: [82.41, 123.47, 164.81],
    droneWave: 'sine',
    droneFilterHz: 230,
    droneGain: 0.042,
    melodyFreqs: [164.81, 174.61, 196.0, 164.81, 146.83, 164.81, 220.0, 174.61],
    melodyWave: 'sine',
    stepMs: 520,
    noteGain: 0.034,
    noteDurationSec: 0.62,
    atmosphereKind: 'cavern_drip',
    noiseFilterType: 'lowpass',
    noiseBaseFreqHz: 190,
    noiseLfoRateHz: 0.12,
    noiseLfoDepthHz: 60,
    noiseGain: 0.022,
    percussionPattern: 'none',
    accentChimeIntervalMs: 5500,
    accentChimeKind: 'crystal_drip'
  },

  bgm_black_willow: {
    id: 'bgm_black_willow',
    displayLabel: 'Bosque del Sauce Negro',
    atmosphereTag: 'Susurros del aquelarre y savia etérea',
    isBoss: false,
    // F# mystical minor/ethereal chord
    droneFreqs: [92.5, 138.59, 185.0],
    droneWave: 'triangle',
    droneFilterHz: 460,
    droneGain: 0.034,
    detuneCents: 6,
    melodyFreqs: [277.18, 329.63, 369.99, 415.3, 369.99, 329.63, 293.66, 277.18],
    melodyWave: 'sine',
    stepMs: 460,
    noteGain: 0.036,
    noteDurationSec: 0.58,
    atmosphereKind: 'willow_whisper',
    noiseFilterType: 'bandpass',
    noiseBaseFreqHz: 680,
    noiseLfoRateHz: 0.28,
    noiseLfoDepthHz: 290,
    noiseGain: 0.017,
    percussionPattern: 'none',
    accentChimeIntervalMs: 9000,
    accentChimeKind: 'dawn_harp'
  },

  bgm_belltower_crucible: {
    id: 'bgm_belltower_crucible',
    displayLabel: 'Acto II · Campanario del Sur y Gran Crisol',
    atmosphereTag: 'Fragua de bronce fundido y tañido',
    isBoss: false,
    // D Phrygian Dominant metallic forge drone
    droneFreqs: [73.42, 110.0, 155.56],
    droneWave: 'sawtooth',
    droneFilterHz: 250,
    droneGain: 0.034,
    melodyFreqs: [146.83, 155.56, 185.0, 220.0, 185.0, 155.56, 146.83, 130.81],
    melodyWave: 'triangle',
    stepMs: 370,
    noteGain: 0.04,
    noteDurationSec: 0.36,
    atmosphereKind: 'forge_rumble',
    noiseFilterType: 'lowpass',
    noiseBaseFreqHz: 165,
    noiseLfoRateHz: 0.55,
    noiseLfoDepthHz: 75,
    noiseGain: 0.032,
    percussionPattern: 'anvil',
    accentChimeIntervalMs: 9500,
    accentChimeKind: 'bronze_bell'
  },

  bgm_great_stone_bridge: {
    id: 'bgm_great_stone_bridge',
    displayLabel: 'Acto III · El Gran Puente de Piedra',
    atmosphereTag: 'Vendaval fluvial y marcha de vanguardia',
    isBoss: false,
    // C Minor heroic bridge cadence
    droneFreqs: [65.41, 98.0, 130.81],
    droneWave: 'triangle',
    droneFilterHz: 320,
    droneGain: 0.036,
    melodyFreqs: [261.63, 293.66, 311.13, 392.0, 349.23, 311.13, 293.66, 233.08],
    melodyWave: 'triangle',
    stepMs: 330,
    noteGain: 0.042,
    noteDurationSec: 0.34,
    atmosphereKind: 'wind_gust',
    noiseFilterType: 'bandpass',
    noiseBaseFreqHz: 460,
    noiseLfoRateHz: 0.32,
    noiseLfoDepthHz: 260,
    noiseGain: 0.034,
    percussionPattern: 'march',
    accentChimeIntervalMs: 13000,
    accentChimeKind: 'cathedral_bell'
  },

  bgm_londinium_city: {
    id: 'bgm_londinium_city',
    displayLabel: 'Acto IV · Londinium, Ciudadela Dorada',
    atmosphereTag: 'Coro distorsionado e incienso narcótico',
    isBoss: false,
    // G Harmonic Minor opulent & slightly detuned false-gold choir
    droneFreqs: [98.0, 146.83, 196.0],
    droneWave: 'sawtooth',
    droneFilterHz: 340,
    droneGain: 0.032,
    detuneCents: 11,
    melodyFreqs: [196.0, 220.0, 233.08, 293.66, 311.13, 369.99, 392.0, 311.13],
    melodyWave: 'triangle',
    stepMs: 410,
    noteGain: 0.038,
    noteDurationSec: 0.48,
    atmosphereKind: 'narcotic_choir',
    noiseFilterType: 'bandpass',
    noiseBaseFreqHz: 840,
    noiseLfoRateHz: 0.22,
    noiseLfoDepthHz: 190,
    noiseGain: 0.015,
    percussionPattern: 'none',
    accentChimeIntervalMs: 8200,
    accentChimeKind: 'venetian_glass'
  },

  bgm_cathedral_abyss: {
    id: 'bgm_cathedral_abyss',
    displayLabel: 'Acto V · La Catedral Invertida',
    atmosphereTag: 'Resonancia del Sol Negro y vacío cósmico',
    isBoss: false,
    // B Locrian cosmic abyss resonance
    droneFreqs: [61.74, 87.31, 123.47],
    droneWave: 'sawtooth',
    droneFilterHz: 210,
    droneGain: 0.04,
    detuneCents: 14,
    melodyFreqs: [246.94, 261.63, 293.66, 349.23, 329.63, 293.66, 261.63, 220.0],
    melodyWave: 'sine',
    stepMs: 450,
    noteGain: 0.038,
    noteDurationSec: 0.56,
    atmosphereKind: 'abyss_void',
    noiseFilterType: 'lowpass',
    noiseBaseFreqHz: 140,
    noiseLfoRateHz: 0.14,
    noiseLfoDepthHz: 55,
    noiseGain: 0.036,
    percussionPattern: 'none',
    accentChimeIntervalMs: 7000,
    accentChimeKind: 'abyss_pulse'
  },

  bgm_boss_inquisition: {
    id: 'bgm_boss_inquisition',
    displayLabel: 'Combate de Jefe · Furia del Cáliz',
    atmosphereTag: 'Timbales de guerra y órgano inquisitorial',
    isBoss: true,
    droneFreqs: [73.42, 110.0, 146.83],
    droneWave: 'sawtooth',
    droneFilterHz: 290,
    droneGain: 0.042,
    melodyFreqs: [146.83, 155.56, 146.83, 174.61, 130.81, 146.83, 174.61, 220.0],
    melodyWave: 'sawtooth',
    stepMs: 225,
    noteGain: 0.044,
    noteDurationSec: 0.24,
    atmosphereKind: 'hearth_crackle',
    noiseFilterType: 'bandpass',
    noiseBaseFreqHz: 340,
    noiseLfoRateHz: 0.8,
    noiseLfoDepthHz: 140,
    noiseGain: 0.018,
    percussionPattern: 'war_timpani',
    accentChimeIntervalMs: 0,
    accentChimeKind: 'none'
  },

  bgm_boss_final_eclipse: {
    id: 'bgm_boss_final_eclipse',
    displayLabel: 'Jefe Clímax · Eclipse de la Doble Sangre',
    atmosphereTag: 'Cataclismo coral y pulso del Sol Negro',
    isBoss: true,
    // C# diminished/harmonic cataclysmic double-blood climax
    droneFreqs: [69.3, 103.83, 138.59],
    droneWave: 'sawtooth',
    droneFilterHz: 330,
    droneGain: 0.045,
    detuneCents: 9,
    melodyFreqs: [277.18, 293.66, 329.63, 415.3, 392.0, 329.63, 293.66, 207.65],
    melodyWave: 'sawtooth',
    stepMs: 195,
    noteGain: 0.046,
    noteDurationSec: 0.22,
    atmosphereKind: 'abyss_void',
    noiseFilterType: 'lowpass',
    noiseBaseFreqHz: 200,
    noiseLfoRateHz: 1.1,
    noiseLfoDepthHz: 95,
    noiseGain: 0.028,
    percussionPattern: 'eclipse_cataclysm',
    accentChimeIntervalMs: 6400,
    accentChimeKind: 'abyss_pulse'
  },

  bgm_first_dawn_epilogue: {
    id: 'bgm_first_dawn_epilogue',
    displayLabel: 'Epílogo · El Primer Amanecer del Viejo Roble',
    atmosphereTag: 'Arpa luminosa y brisa dorada de paz',
    isBoss: false,
    // G Major radiant warm open harmony
    droneFreqs: [98.0, 146.83, 196.0],
    droneWave: 'sine',
    droneFilterHz: 620,
    droneGain: 0.032,
    melodyFreqs: [392.0, 440.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0],
    melodyWave: 'sine',
    stepMs: 470,
    noteGain: 0.038,
    noteDurationSec: 0.68,
    atmosphereKind: 'morning_breeze',
    noiseFilterType: 'bandpass',
    noiseBaseFreqHz: 600,
    noiseLfoRateHz: 0.14,
    noiseLfoDepthHz: 150,
    noiseGain: 0.011,
    percussionPattern: 'none',
    accentChimeIntervalMs: 9000,
    accentChimeKind: 'dawn_harp'
  }
};

/**
 * Resolves any track key (including legacy keys like 'boss_morwenna' or 'bgm_oakhaven_night')
 * into a concrete ActSoundscapeSpec.
 */
export function resolveSoundscapeSpec(trackKey: string): ActSoundscapeSpec {
  if (trackKey in ACT_SOUNDSCAPE_CATALOG) {
    return ACT_SOUNDSCAPE_CATALOG[trackKey as SoundscapeTrackId];
  }
  const lower = trackKey.toLowerCase();
  if (lower.includes('eclipse') || lower.includes('astaroth') || lower.includes('malphas')) {
    return ACT_SOUNDSCAPE_CATALOG.bgm_boss_final_eclipse;
  }
  if (lower.includes('boss')) {
    return ACT_SOUNDSCAPE_CATALOG.bgm_boss_inquisition;
  }
  if (lower.includes('epilogue') || lower.includes('first_dawn')) {
    return ACT_SOUNDSCAPE_CATALOG.bgm_first_dawn_epilogue;
  }
  if (lower.includes('dawn')) {
    return ACT_SOUNDSCAPE_CATALOG.bgm_oakhaven_dawn;
  }
  if (lower.includes('crypt')) {
    return ACT_SOUNDSCAPE_CATALOG.bgm_crypts_san_jude;
  }
  if (lower.includes('willow')) {
    return ACT_SOUNDSCAPE_CATALOG.bgm_black_willow;
  }
  if (lower.includes('belltower') || lower.includes('crucible')) {
    return ACT_SOUNDSCAPE_CATALOG.bgm_belltower_crucible;
  }
  if (lower.includes('bridge')) {
    return ACT_SOUNDSCAPE_CATALOG.bgm_great_stone_bridge;
  }
  if (lower.includes('londinium')) {
    return ACT_SOUNDSCAPE_CATALOG.bgm_londinium_city;
  }
  if (lower.includes('cathedral') || lower.includes('abyss')) {
    return ACT_SOUNDSCAPE_CATALOG.bgm_cathedral_abyss;
  }
  return ACT_SOUNDSCAPE_CATALOG.bgm_oakhaven_night;
}

/**
 * Pure music director that chooses the exact dynamic 3D soundscape for the active
 * zone, narrative phase, and awakened boss encounters.
 */
export function resolveDynamic3DSoundscape(snapshot: DynamicAudioSnapshot3D): SoundscapeTrackId {
  if (snapshot.narrativePhase === 'FIRST_DAWN_EPILOGUE') {
    return 'bgm_first_dawn_epilogue';
  }

  // Climax Boss Music Priority (Acts IV & V)
  if (
    (snapshot.currentArea === 'londinium_citadel' && snapshot.malphasActive) ||
    (snapshot.currentArea === 'inverted_cathedral' && snapshot.astarothActive)
  ) {
    return 'bgm_boss_final_eclipse';
  }

  // Act & Dungeon Boss Music Priority (Acts I, II, III)
  if (
    (snapshot.currentArea === 'surface' && snapshot.morwennaActive) ||
    (snapshot.currentArea === 'crypts_interior' && snapshot.inquisitorActive) ||
    (snapshot.currentArea === 'black_willow_forest' && snapshot.rootProwlerActive) ||
    (snapshot.currentArea === 'belltower_summit' && snapshot.crucibleActive) ||
    (snapshot.currentArea === 'great_stone_bridge' && snapshot.vaneActive)
  ) {
    return 'bgm_boss_inquisition';
  }

  // Exploration & Atmospheric Act Soundscapes
  switch (snapshot.currentArea) {
    case 'surface':
      return snapshot.narrativePhase === 'DAWN_CALM'
        ? 'bgm_oakhaven_dawn'
        : 'bgm_oakhaven_night';
    case 'crypts_interior':
      return 'bgm_crypts_san_jude';
    case 'black_willow_forest':
      return 'bgm_black_willow';
    case 'belltower_summit':
      return 'bgm_belltower_crucible';
    case 'great_stone_bridge':
      return 'bgm_great_stone_bridge';
    case 'londinium_citadel':
      return 'bgm_londinium_city';
    case 'inverted_cathedral':
      return 'bgm_cathedral_abyss';
    default:
      return 'bgm_oakhaven_night';
  }
}
