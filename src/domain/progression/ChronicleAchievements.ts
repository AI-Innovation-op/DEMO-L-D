export type CanonicalAchievementId =
  | 'first_parry'
  | 'first_perfect_dodge'
  | 'combo_master_3'
  | 'burned_barn_truth'
  | 'crucible_saboteur'
  | 'bridge_abyss_push'
  | 'londinium_awakener'
  | 'mirror_shatterer'
  | 'alba_gris_forged'
  | 'first_dawn_champion';

export interface CanonicalAchievementSpec {
  readonly id: CanonicalAchievementId;
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly actLabel: string;
}

export interface ChronicleCombatStats {
  perfectParries: number;
  perfectDodges: number;
  comboFinishers: number;
  enemiesPurified: number;
  bossesPurified: number;
  mirrorsShattered: number;
  braziersDestroyed: number;
  bridgeKnockoffs: number;
  playTimeSec: number;
}

export interface ChronicleRankSummary {
  readonly grade: 'S' | 'A' | 'B' | 'C';
  readonly title: string;
  readonly score: number;
  readonly unlockedCount: number;
  readonly totalCount: number;
}

export const CANONICAL_ACHIEVEMENTS: readonly CanonicalAchievementSpec[] = [
  {
    id: 'first_parry',
    icon: '🛡️',
    title: 'Ojo de la Vigilia',
    description: 'Ejecuta tu primer Parry Perfecto [L] desviando un golpe enemigo.',
    actLabel: 'Combate'
  },
  {
    id: 'first_perfect_dodge',
    icon: '⚡',
    title: 'Sombra del Sauce',
    description: 'Activa una Esquiva Perfecta [Espacio] con cámara lenta y contraataque.',
    actLabel: 'Combate'
  },
  {
    id: 'combo_master_3',
    icon: '🔥',
    title: 'Fuego Negro Desatado',
    description: 'Encadena el combo completo de 3 golpes de Thomas hasta el Remate III.',
    actLabel: 'Combate'
  },
  {
    id: 'burned_barn_truth',
    icon: '🗡️',
    title: 'Memoria de las Nueve',
    description: 'Inspecciona la losa grabada del Granero del Sur Quemado (Cap. VIII).',
    actLabel: 'Acto II'
  },
  {
    id: 'crucible_saboteur',
    icon: '⚙️',
    title: 'Saboteador del Crisol',
    description: 'Lanza tu espada [T] para trabar el engranaje del Gran Crisol de Bronce.',
    actLabel: 'Acto II'
  },
  {
    id: 'bridge_abyss_push',
    icon: '🌊',
    title: 'Viento del Abismo',
    description: 'Arroja a un guardia de vanguardia por una brecha del Gran Puente.',
    actLabel: 'Acto III'
  },
  {
    id: 'londinium_awakener',
    icon: '🌿',
    title: 'Mente Despierta',
    description: 'Destruye los 3 Braseros de Incienso Narcótico en Londinium.',
    actLabel: 'Acto IV'
  },
  {
    id: 'mirror_shatterer',
    icon: '🪞',
    title: 'Sin Ilusiones ni Culpa',
    description: 'Quiebra los 3 Espejos Venecianos del Salón de los Espejos (Cap. XV).',
    actLabel: 'Acto IV'
  },
  {
    id: 'alba_gris_forged',
    icon: '✨',
    title: 'Forjador de Alba Gris',
    description: 'Une la Gota de Luz y el Fuego Negro en el Altar de la Comunión.',
    actLabel: 'Acto V'
  },
  {
    id: 'first_dawn_champion',
    icon: '🌅',
    title: 'La Oscuridad que Eligió Amar',
    description: 'Derrota a Astaroth y contempla el Primer Amanecer bajo el Viejo Roble.',
    actLabel: 'Epílogo'
  }
];

const STORAGE_KEY = 'totd_chronicle_v1';

export class ChronicleManager {
  private unlockedIds: Set<CanonicalAchievementId> = new Set();
  private stats: ChronicleCombatStats = {
    perfectParries: 0,
    perfectDodges: 0,
    comboFinishers: 0,
    enemiesPurified: 0,
    bossesPurified: 0,
    mirrorsShattered: 0,
    braziersDestroyed: 0,
    bridgeKnockoffs: 0,
    playTimeSec: 0
  };
  private onUnlockCallback?: (spec: CanonicalAchievementSpec) => void;

  constructor() {
    this.load();
  }

  public setOnUnlock(cb: (spec: CanonicalAchievementSpec) => void): void {
    this.onUnlockCallback = cb;
  }

  public getStats(): Readonly<ChronicleCombatStats> {
    return { ...this.stats };
  }

  public getUnlockedIds(): CanonicalAchievementId[] {
    return Array.from(this.unlockedIds);
  }

  public isUnlocked(id: CanonicalAchievementId): boolean {
    return this.unlockedIds.has(id);
  }

  public unlock(id: CanonicalAchievementId): boolean {
    if (this.unlockedIds.has(id)) return false;
    this.unlockedIds.add(id);
    this.save();
    const spec = CANONICAL_ACHIEVEMENTS.find(a => a.id === id);
    if (spec && this.onUnlockCallback) {
      this.onUnlockCallback(spec);
    }
    return true;
  }

  public recordPerfectParry(): void {
    this.stats.perfectParries++;
    this.unlock('first_parry');
    this.save();
  }

  public recordPerfectDodge(): void {
    this.stats.perfectDodges++;
    this.unlock('first_perfect_dodge');
    this.save();
  }

  public recordComboFinisher(): void {
    this.stats.comboFinishers++;
    this.unlock('combo_master_3');
    this.save();
  }

  public recordEnemyPurified(isBoss: boolean = false): void {
    this.stats.enemiesPurified++;
    if (isBoss) this.stats.bossesPurified++;
    this.save();
  }

  public recordBridgeKnockoff(): void {
    this.stats.bridgeKnockoffs++;
    this.unlock('bridge_abyss_push');
    this.save();
  }

  public recordBrazierDestroyed(totalDestroyed: number): void {
    this.stats.braziersDestroyed = Math.max(this.stats.braziersDestroyed, totalDestroyed);
    if (totalDestroyed >= 3) {
      this.unlock('londinium_awakener');
    }
    this.save();
  }

  public recordMirrorShattered(totalShattered: number): void {
    this.stats.mirrorsShattered = Math.max(this.stats.mirrorsShattered, totalShattered);
    if (totalShattered >= 3) {
      this.unlock('mirror_shatterer');
    }
    this.save();
  }

  public addPlayTime(deltaSec: number): void {
    if (deltaSec > 0 && deltaSec < 1) {
      this.stats.playTimeSec += deltaSec;
    }
  }

  public computeRank(): ChronicleRankSummary {
    const unlockedCount = this.unlockedIds.size;
    const totalCount = CANONICAL_ACHIEVEMENTS.length;
    const score =
      unlockedCount * 120 +
      this.stats.perfectParries * 35 +
      this.stats.perfectDodges * 30 +
      this.stats.comboFinishers * 20 +
      this.stats.bossesPurified * 100 +
      this.stats.enemiesPurified * 15;

    let grade: 'S' | 'A' | 'B' | 'C' = 'C';
    let title = 'Acólito de la Niebla';
    if (unlockedCount >= 8 || score >= 1400) {
      grade = 'S';
      title = 'Portador Supremo de Alba Gris';
    } else if (unlockedCount >= 5 || score >= 800) {
      grade = 'A';
      title = 'Centinela de la Doble Sangre';
    } else if (unlockedCount >= 2 || score >= 350) {
      grade = 'B';
      title = 'Caminante del Sauce Negro';
    }

    return { grade, title, score, unlockedCount, totalCount };
  }

  public reset(): void {
    this.unlockedIds.clear();
    this.stats = {
      perfectParries: 0,
      perfectDodges: 0,
      comboFinishers: 0,
      enemiesPurified: 0,
      bossesPurified: 0,
      mirrorsShattered: 0,
      braziersDestroyed: 0,
      bridgeKnockoffs: 0,
      playTimeSec: 0
    };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  private save(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          unlockedIds: Array.from(this.unlockedIds),
          stats: this.stats
        })
      );
    } catch {}
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        unlockedIds?: CanonicalAchievementId[];
        stats?: Partial<ChronicleCombatStats>;
      };
      if (Array.isArray(parsed.unlockedIds)) {
        parsed.unlockedIds.forEach(id => this.unlockedIds.add(id));
      }
      if (parsed.stats) {
        this.stats = { ...this.stats, ...parsed.stats };
      }
    } catch {}
  }
}
