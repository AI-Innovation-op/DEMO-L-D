import { Vector2 } from '../shared/Vector2';

export type EnemyType = 'ash_prowler' | 'fanatic_monk' | 'golden_guard' | 'pyre_inquisitor' | 'inquisitor_torre' | 'shield_knight' | 'abyssal_shadow';

export type EnemyState = 'IDLE' | 'MOVING' | 'WINDUP' | 'ATTACKING' | 'RECOVERY' | 'STUNNED' | 'DEAD';

export class Enemy {
  public posture: number;
  public maxPosture: number;
  public state: EnemyState = 'IDLE';
  public facingDirection: number = -1;

  // Combat Timing & Telegraphed Wind-up / Recovery
  public windupTimer: number = 0;
  public windupTotal: number = 420;
  public recoveryTimer: number = 0;
  public attackCooldown: number = 0;
  public stunTimer: number = 0;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: EnemyType,
    public health: number,
    public readonly maxHealth: number,
    public readonly attackPower: number,
    public readonly speed: number,
    public position: Vector2,
    maxPosture: number = 50
  ) {
    this.posture = maxPosture;
    this.maxPosture = maxPosture;
  }

  public static createAshProwler(id: string, pos: Vector2): Enemy {
    return new Enemy(id, 'Acechador de Ceniza', 'ash_prowler', 105, 105, 18, 115, pos, 55);
  }

  public static createFanaticMonk(id: string, pos: Vector2): Enemy {
    return new Enemy(id, 'Monje Fanático', 'fanatic_monk', 130, 130, 21, 72, pos, 70);
  }

  public static createGoldenGuard(id: string, pos: Vector2): Enemy {
    return new Enemy(id, 'Guardia Áureo de Londinium', 'golden_guard', 195, 195, 26, 86, pos, 95);
  }

  public static createInquisitorTorre(id: string, pos: Vector2): Enemy {
    return new Enemy(id, 'Corista Inquisitorial', 'inquisitor_torre', 155, 155, 23, 78, pos, 75);
  }

  public static createShieldKnight(id: string, pos: Vector2): Enemy {
    return new Enemy(id, 'Caballero de Escudo Pesado', 'shield_knight', 225, 225, 25, 70, pos, 110);
  }

  public static createAbyssalShadow(id: string, pos: Vector2): Enemy {
    return new Enemy(id, 'Sombra Primordial del Vacío', 'abyssal_shadow', 240, 240, 29, 108, pos, 85);
  }

  public takeDamage(amount: number): number {
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.state = 'DEAD';
    }
    return amount;
  }

  public damagePosture(amount: number): boolean {
    this.posture = Math.max(0, this.posture - amount);
    if (this.posture === 0) {
      this.state = 'STUNNED';
      return true; // Posture broken!
    }
    return false;
  }

  public recoverPosture(): void {
    this.posture = this.maxPosture;
    if (this.state === 'STUNNED') {
      this.state = 'IDLE';
    }
  }

  public isAlive(): boolean {
    return this.health > 0 && this.state !== 'DEAD';
  }

  /**
   * Start telegraphed attack wind-up.
   */
  public startWindup(durationMs: number = 420): void {
    if (!this.isAlive() || this.state === 'STUNNED') return;
    this.state = 'WINDUP';
    this.windupTimer = durationMs;
    this.windupTotal = durationMs;
  }

  /**
   * Start post-attack recovery / fatigue window.
   */
  public startRecovery(durationMs: number = 380): void {
    if (!this.isAlive() || this.state === 'STUNNED') return;
    this.state = 'RECOVERY';
    this.recoveryTimer = durationMs;
    this.attackCooldown = 1350; // Fair combat rhythm when fighting multiple enemies
  }

  /**
   * Interrupt attack windup (e.g. from parry or heavy hit).
   */
  public interruptAttack(stunDurationMs: number = 1000): void {
    this.windupTimer = 0;
    this.recoveryTimer = 0;
    this.state = 'STUNNED';
    this.stunTimer = stunDurationMs;
  }

  /**
   * Update combat timers per frame.
   */
  public updateCombatTimers(deltaMs: number): { shouldStrike: boolean; recoveryEnded: boolean; stunEnded: boolean } {
    let shouldStrike = false;
    let recoveryEnded = false;
    let stunEnded = false;

    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - deltaMs);
    }

    if (this.state === 'STUNNED') {
      this.stunTimer = Math.max(0, this.stunTimer - deltaMs);
      if (this.stunTimer === 0) {
        this.recoverPosture();
        this.state = 'IDLE';
        stunEnded = true;
      }
    } else if (this.state === 'WINDUP') {
      this.windupTimer = Math.max(0, this.windupTimer - deltaMs);
      if (this.windupTimer === 0) {
        this.state = 'ATTACKING';
        shouldStrike = true;
      }
    } else if (this.state === 'RECOVERY') {
      this.recoveryTimer = Math.max(0, this.recoveryTimer - deltaMs);
      if (this.recoveryTimer === 0) {
        this.state = 'IDLE';
        recoveryEnded = true;
      }
    }

    return { shouldStrike, recoveryEnded, stunEnded };
  }
}
