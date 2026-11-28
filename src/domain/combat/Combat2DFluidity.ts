export interface ComboStepSpec2D {
  readonly step: 1 | 2 | 3;
  readonly damageMultiplier: number;
  readonly bonusPostureDamage: number;
  readonly stepForwardPx: number;
  readonly cooldownMs: number;
  readonly isFinisherStep: boolean;
}

export type BufferedAttackKind2D = 'none' | 'light' | 'heavy';

/**
 * Escalating 3-hit melee combo chain + attack input buffering for Thomas in 2D Mode.
 */
export class ComboChain2D {
  private currentStep: 0 | 1 | 2 | 3 = 0;
  private lastSwingTimeMs: number = -9999;
  public readonly comboWindowMs: number;
  private bufferedInput: BufferedAttackKind2D = 'none';

  constructor(comboWindowMs: number = 950) {
    this.comboWindowMs = comboWindowMs;
  }

  public reset(): void {
    this.currentStep = 0;
    this.lastSwingTimeMs = -9999;
    this.bufferedInput = 'none';
  }

  public advanceLightCombo(nowMs: number): ComboStepSpec2D {
    const withinWindow = nowMs - this.lastSwingTimeMs <= this.comboWindowMs;
    if (!withinWindow || this.currentStep >= 3 || this.currentStep === 0) {
      this.currentStep = 1;
    } else {
      this.currentStep = (this.currentStep + 1) as 2 | 3;
    }
    this.lastSwingTimeMs = nowMs;

    if (this.currentStep === 1) {
      return {
        step: 1,
        damageMultiplier: 1.0,
        bonusPostureDamage: 0,
        stepForwardPx: 6,
        cooldownMs: 220,
        isFinisherStep: false
      };
    }
    if (this.currentStep === 2) {
      return {
        step: 2,
        damageMultiplier: 1.15,
        bonusPostureDamage: 10,
        stepForwardPx: 9,
        cooldownMs: 195,
        isFinisherStep: false
      };
    }
    return {
      step: 3,
      damageMultiplier: 1.38,
      bonusPostureDamage: 28,
      stepForwardPx: 13,
      cooldownMs: 310,
      isFinisherStep: true
    };
  }

  public getCurrentStep(): 0 | 1 | 2 | 3 {
    return this.currentStep;
  }

  public bufferAttack(kind: 'light' | 'heavy'): void {
    // Heavy overrides light buffer; light fills empty buffer
    if (kind === 'heavy' || this.bufferedInput === 'none') {
      this.bufferedInput = kind;
    }
  }

  public consumeBufferedAttack(): BufferedAttackKind2D {
    const out = this.bufferedInput;
    this.bufferedInput = 'none';
    return out;
  }
}

export type ArrowType2D = 'abyssal' | 'fire' | 'silver';

export interface ArrowSpec2D {
  readonly id: ArrowType2D;
  readonly badge: string;
  readonly shortName: string;
  readonly tint: number;
  readonly popupColor: string;
  readonly knockbackPx: number;
  readonly splashRadiusPx: number;
  readonly bonusPosture: number;
  readonly burnTicks: number;
  readonly burnTickDamage: number;
  readonly piercesFlameShield: boolean;
}

export const ARROW_ORDER_2D: readonly ArrowType2D[] = ['abyssal', 'fire', 'silver'];

export const ARROW_SPECS_2D: Record<ArrowType2D, ArrowSpec2D> = {
  abyssal: {
    id: 'abyssal',
    badge: '🌑[R] Abisal',
    shortName: 'Flecha Abisal',
    tint: 0xd477ff,
    popupColor: '#d477ff',
    knockbackPx: 22,
    splashRadiusPx: 46,
    bonusPosture: 4,
    burnTicks: 0,
    burnTickDamage: 0,
    piercesFlameShield: false
  },
  fire: {
    id: 'fire',
    badge: '🔥[R] Ígnea',
    shortName: 'Fuego Fatuo',
    tint: 0xff8833,
    popupColor: '#ff9944',
    knockbackPx: 10,
    splashRadiusPx: 0,
    bonusPosture: 6,
    burnTicks: 3,
    burnTickDamage: 6,
    piercesFlameShield: false
  },
  silver: {
    id: 'silver',
    badge: '🥈[R] Plata',
    shortName: 'Plata Sagrada',
    tint: 0x8cf4ff,
    popupColor: '#8cf4ff',
    knockbackPx: 12,
    splashRadiusPx: 0,
    bonusPosture: 26,
    burnTicks: 0,
    burnTickDamage: 0,
    piercesFlameShield: true
  }
};

export function cycleArrowType2D(current: ArrowType2D, direction: 1 | -1 = 1): ArrowType2D {
  const idx = ARROW_ORDER_2D.indexOf(current);
  const nextIdx = (idx + direction + ARROW_ORDER_2D.length) % ARROW_ORDER_2D.length;
  return ARROW_ORDER_2D[nextIdx];
}

/**
 * Tracks Perfect Dodge slow-motion & +50% Critical Counter-Attack empowerment window in 2D Mode.
 */
export class PerfectDodgeTracker2D {
  public slowMoRemainingMs: number = 0;
  public counterWindowRemainingMs: number = 0;
  public readonly slowMoDurationMs: number;
  public readonly slowMoScale: number;
  public readonly counterWindowDurationMs: number;
  public readonly postureRestoreAmount: number;

  constructor(
    slowMoDurationMs: number = 550,
    slowMoScale: number = 0.32,
    counterWindowDurationMs: number = 2200,
    postureRestoreAmount: number = 18
  ) {
    this.slowMoDurationMs = slowMoDurationMs;
    this.slowMoScale = slowMoScale;
    this.counterWindowDurationMs = counterWindowDurationMs;
    this.postureRestoreAmount = postureRestoreAmount;
  }

  public reset(): void {
    this.slowMoRemainingMs = 0;
    this.counterWindowRemainingMs = 0;
  }

  public tryTriggerPerfectDodge(hasNearbyThreatInWindup: boolean): boolean {
    if (!hasNearbyThreatInWindup) return false;
    this.slowMoRemainingMs = this.slowMoDurationMs;
    this.counterWindowRemainingMs = this.counterWindowDurationMs;
    return true;
  }

  public update(deltaMs: number): void {
    if (this.slowMoRemainingMs > 0) {
      this.slowMoRemainingMs = Math.max(0, this.slowMoRemainingMs - deltaMs);
    }
    if (this.counterWindowRemainingMs > 0) {
      this.counterWindowRemainingMs = Math.max(0, this.counterWindowRemainingMs - deltaMs);
    }
  }

  public getEnemyDeltaScale(): number {
    return this.slowMoRemainingMs > 0 ? this.slowMoScale : 1.0;
  }

  public isSlowMoActive(): boolean {
    return this.slowMoRemainingMs > 0;
  }

  public isCounterReady(): boolean {
    return this.counterWindowRemainingMs > 0;
  }

  public consumeCounterAttack(): { triggered: boolean; damageMultiplier: number; bonusPosture: number } {
    if (this.counterWindowRemainingMs <= 0) {
      return { triggered: false, damageMultiplier: 1.0, bonusPosture: 0 };
    }
    this.counterWindowRemainingMs = 0;
    return { triggered: true, damageMultiplier: 1.5, bonusPosture: 22 };
  }
}

export type DestructibleDropType2D = 'balm' | 'heal_orb' | 'exp_orb';

export interface DestructibleDropOutcome2D {
  readonly kind: DestructibleDropType2D;
  readonly healAmount: number;
  readonly expAmount: number;
  readonly balmGranted: number;
  readonly label: string;
  readonly color: string;
}

export function resolveDestructibleDrop2D(
  roll0to1: number,
  currentBalms: number,
  maxBalms: number
): DestructibleDropOutcome2D {
  if (roll0to1 < 0.42 && currentBalms < maxBalms) {
    return {
      kind: 'balm',
      healAmount: 0,
      expAmount: 10,
      balmGranted: 1,
      label: '+1 🌿 BÁLSAMO',
      color: '#7ef5a6'
    };
  }
  if (roll0to1 < 0.78) {
    return {
      kind: 'heal_orb',
      healAmount: 20,
      expAmount: 10,
      balmGranted: 0,
      label: '+20 HP',
      color: '#88ffaa'
    };
  }
  return {
    kind: 'exp_orb',
    healAmount: 0,
    expAmount: 22,
    balmGranted: 0,
    label: '+22 EXP',
    color: '#d9a8ff'
  };
}
