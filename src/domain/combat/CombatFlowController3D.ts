export type ThomasComboStep3D = 1 | 2 | 3;

export interface ComboStepSpec3D {
  readonly step: ThomasComboStep3D;
  readonly label: string;
  readonly damageMultiplier: number;
  readonly forwardLungeSpeed: number;
  readonly cooldownSec: number;
  readonly animDurationMs: number;
  readonly grantsStagger: boolean;
  readonly arcColorHex: number;
}

export interface CombatFlowTickResult3D {
  readonly worldTimeScale: number;
  readonly playerTimeScale: number;
  readonly isSlowMo: boolean;
  readonly isCounterWindowActive: boolean;
  readonly activeComboStep: number;
}

export const THOMAS_COMBO_SPECS_3D: Record<ThomasComboStep3D, ComboStepSpec3D> = {
  1: {
    step: 1,
    label: 'TAJO DIAGONAL I',
    damageMultiplier: 1.0,
    forwardLungeSpeed: 2.3,
    cooldownSec: 0.24,
    animDurationMs: 175,
    grantsStagger: false,
    arcColorHex: 0xbb66ff
  },
  2: {
    step: 2,
    label: 'REVÉS CRUZADO II',
    damageMultiplier: 1.18,
    forwardLungeSpeed: 3.0,
    cooldownSec: 0.25,
    animDurationMs: 185,
    grantsStagger: false,
    arcColorHex: 0xffcc44
  },
  3: {
    step: 3,
    label: 'REMATE FUEGO NEGRO III',
    damageMultiplier: 1.48,
    forwardLungeSpeed: 4.1,
    cooldownSec: 0.36,
    animDurationMs: 255,
    grantsStagger: true,
    arcColorHex: 0xff4422
  }
};

/**
 * Pure domain controller for 3D combat fluidity:
 * - Thomas's 3-hit escalating melee combo chain with link window & input buffering
 * - Perfect Dodge brief slow-motion ("Sombra del Sauce") + rewarded +50% Counter-Attack window
 */
export class CombatFlowController3D {
  private currentComboStep: number = 0;
  private comboWindowSec: number = 0;
  private bufferedAttack: 'none' | 'light' | 'heavy' = 'none';

  private slowMoRemainingSec: number = 0;
  private counterWindowRemainingSec: number = 0;
  private perfectDodgeCooldownSec: number = 0;

  public readonly comboLinkWindowDurationSec: number = 1.1;
  public readonly slowMoDurationSec: number = 0.58;
  public readonly counterWindowDurationSec: number = 2.5;
  public readonly counterDamageMultiplier: number = 1.5;

  public get activeComboStep(): number {
    return this.currentComboStep;
  }

  public get isSlowMoActive(): boolean {
    return this.slowMoRemainingSec > 0;
  }

  public get isCounterReady(): boolean {
    return this.counterWindowRemainingSec > 0;
  }

  public get counterRemainingSec(): number {
    return this.counterWindowRemainingSec;
  }

  public get hasBufferedAttack(): boolean {
    return this.bufferedAttack !== 'none';
  }

  /**
   * Advances Thomas's 3-hit light combo chain (1 -> 2 -> 3 -> 1) within the link window.
   */
  public advanceLightCombo(): ComboStepSpec3D {
    const nextStep: ThomasComboStep3D =
      this.comboWindowSec > 0 && this.currentComboStep === 1
        ? 2
        : this.comboWindowSec > 0 && this.currentComboStep === 2
          ? 3
          : 1;

    this.currentComboStep = nextStep;
    this.comboWindowSec = nextStep === 3 ? 0.55 : this.comboLinkWindowDurationSec;
    return THOMAS_COMBO_SPECS_3D[nextStep];
  }

  /**
   * Resolves a Heavy Attack: grants a +15% finisher synergy bonus if chained right after Combo Hit 2 or 3.
   */
  public consumeHeavyFinisherBonus(): { chainedFromCombo: boolean; bonusMultiplier: number } {
    const chained = this.comboWindowSec > 0 && this.currentComboStep >= 2;
    this.currentComboStep = 0;
    this.comboWindowSec = 0;
    return {
      chainedFromCombo: chained,
      bonusMultiplier: chained ? 1.15 : 1.0
    };
  }

  public bufferAttack(kind: 'light' | 'heavy'): void {
    this.bufferedAttack = kind;
  }

  public popBufferedAttack(): 'none' | 'light' | 'heavy' {
    const queued = this.bufferedAttack;
    this.bufferedAttack = 'none';
    return queued;
  }

  /**
   * Triggers Perfect Dodge slow-motion and opens the +50% Counter-Attack window.
   * Returns false if called inside the brief deduplication cooldown.
   */
  public triggerPerfectDodge(): boolean {
    if (this.perfectDodgeCooldownSec > 0) {
      return false;
    }
    this.slowMoRemainingSec = this.slowMoDurationSec;
    this.counterWindowRemainingSec = this.counterWindowDurationSec;
    this.perfectDodgeCooldownSec = 0.5;
    return true;
  }

  /**
   * Consumes an active Counter-Attack window when the hero lands/launches their counter strike.
   */
  public consumeCounterAttack(): { triggered: boolean; multiplier: number } {
    if (this.counterWindowRemainingSec > 0) {
      this.counterWindowRemainingSec = 0;
      return { triggered: true, multiplier: this.counterDamageMultiplier };
    }
    return { triggered: false, multiplier: 1.0 };
  }

  public reset(): void {
    this.currentComboStep = 0;
    this.comboWindowSec = 0;
    this.bufferedAttack = 'none';
    this.slowMoRemainingSec = 0;
    this.counterWindowRemainingSec = 0;
    this.perfectDodgeCooldownSec = 0;
  }

  /**
   * Advances all combat flow timers using unscaled real frame delta.
   */
  public tick(rawDelta: number): CombatFlowTickResult3D {
    const safeDelta = Math.max(0, Math.min(rawDelta, 0.1));

    if (this.comboWindowSec > 0) {
      this.comboWindowSec = Math.max(0, this.comboWindowSec - safeDelta);
      if (this.comboWindowSec === 0) {
        this.currentComboStep = 0;
      }
    }

    if (this.slowMoRemainingSec > 0) {
      this.slowMoRemainingSec = Math.max(0, this.slowMoRemainingSec - safeDelta);
    }

    if (this.counterWindowRemainingSec > 0) {
      this.counterWindowRemainingSec = Math.max(0, this.counterWindowRemainingSec - safeDelta);
    }

    if (this.perfectDodgeCooldownSec > 0) {
      this.perfectDodgeCooldownSec = Math.max(0, this.perfectDodgeCooldownSec - safeDelta);
    }

    const isSlowMo = this.slowMoRemainingSec > 0;
    return {
      worldTimeScale: isSlowMo ? 0.32 : 1.0,
      playerTimeScale: isSlowMo ? 0.85 : 1.0,
      isSlowMo,
      isCounterWindowActive: this.counterWindowRemainingSec > 0,
      activeComboStep: this.currentComboStep
    };
  }
}
