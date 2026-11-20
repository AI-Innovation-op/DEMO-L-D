export type SpikeTrapState = 'ARMED' | 'TRIGGERED' | 'RESETTING';

export interface SpikeTrapConfig {
  x: number;
  z: number;
  triggerRadius?: number;
  damage?: number;
  resetCooldown?: number;
}

export class SpikeTrap {
  public readonly x: number;
  public readonly z: number;
  public readonly triggerRadius: number;
  public readonly damage: number;
  public readonly resetCooldown: number;

  private _state: SpikeTrapState = 'ARMED';
  private _cooldownTimer: number = 0;

  constructor(config: SpikeTrapConfig) {
    this.x = config.x;
    this.z = config.z;
    this.triggerRadius = config.triggerRadius ?? 1.2;
    this.damage = config.damage ?? 25;
    this.resetCooldown = config.resetCooldown ?? 2.5;
  }

  public get state(): SpikeTrapState {
    return this._state;
  }

  public get isArmed(): boolean {
    return this._state === 'ARMED';
  }

  public get cooldownRemaining(): number {
    return this._cooldownTimer;
  }

  /**
   * Checks if an entity at (entityX, entityZ) steps into the trap.
   * If armed, triggers the trap and returns the damage dealt (or 0 if not triggered).
   */
  public stepOn(entityX: number, entityZ: number): { triggered: boolean; damage: number } {
    if (this._state !== 'ARMED') {
      return { triggered: false, damage: 0 };
    }

    const dx = entityX - this.x;
    const dz = entityZ - this.z;
    const distance = Math.hypot(dx, dz);

    if (distance <= this.triggerRadius) {
      this._state = 'TRIGGERED';
      this._cooldownTimer = this.resetCooldown;
      return { triggered: true, damage: this.damage };
    }

    return { triggered: false, damage: 0 };
  }

  /**
   * Updates trap state over delta time.
   */
  public update(delta: number): void {
    if (this._state === 'TRIGGERED' || this._state === 'RESETTING') {
      this._state = 'RESETTING';
      this._cooldownTimer -= delta;
      if (this._cooldownTimer <= 0) {
        this._state = 'ARMED';
        this._cooldownTimer = 0;
      }
    }
  }

  public forceReset(): void {
    this._state = 'ARMED';
    this._cooldownTimer = 0;
  }
}
