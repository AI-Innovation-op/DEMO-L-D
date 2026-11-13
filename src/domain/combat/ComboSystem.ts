import { FinisherStyle } from './CombatTypes';

export class ComboSystem {
  private comboCount: number = 0;
  private lastHitTimestamp: number = 0;
  private readonly comboResetWindowMs: number = 1800;

  public registerHit(now: number = Date.now()): number {
    if (now - this.lastHitTimestamp > this.comboResetWindowMs) {
      this.comboCount = 1;
    } else {
      this.comboCount += 1;
    }
    this.lastHitTimestamp = now;
    return this.comboCount;
  }

  public getComboCount(): number {
    return this.comboCount;
  }

  public getDamageMultiplier(): number {
    // Each hit in combo adds 5% extra damage, capped at 2.5x
    return Math.min(2.5, 1.0 + (this.comboCount - 1) * 0.05);
  }

  public reset(): void {
    this.comboCount = 0;
    this.lastHitTimestamp = 0;
  }

  public evaluateFinisher(enemyCurrentHealth: number, enemyMaxHealth: number, enemyPosture: number): FinisherStyle {
    if (enemyPosture > 0) {
      return FinisherStyle.NONE;
    }

    const healthRatio = enemyCurrentHealth / enemyMaxHealth;
    if (healthRatio <= 0.35) {
      // Enemy is broken and near death: trigger cinematic combo finisher
      return FinisherStyle.CINEMATIC_COMBO;
    }

    // Enemy is broken posture but has higher health: real-time fluid finisher
    return FinisherStyle.REALTIME_FLUID;
  }
}
