import { Vector2 } from '../shared/Vector2';
import { DomainEvent, EventBus } from '../shared/DomainEvent';

export type BossId = 'madre_morwenna' | 'guardian_crisol' | 'capitan_aureo' | 'rex_malphas' | 'astaroth';

export enum BossPhaseType {
  PHASE_1 = 'PHASE_1',
  PHASE_2 = 'PHASE_2',
  PHASE_3_UNBEATABLE = 'PHASE_3_UNBEATABLE'
}

export class BossPhaseChangedEvent implements DomainEvent {
  public readonly eventName = 'BossPhaseChanged';
  public readonly occurredOn = new Date();
  constructor(
    public readonly bossId: BossId,
    public readonly newPhase: BossPhaseType,
    public readonly uiMessage: string
  ) {}
}

export class BossUiShatteredEvent implements DomainEvent {
  public readonly eventName = 'BossUiShattered';
  public readonly occurredOn = new Date();
  constructor(
    public readonly bossId: BossId,
    public readonly decreeTitle: string
  ) {}
}

export class Boss {
  public phase: BossPhaseType = BossPhaseType.PHASE_1;
  public posture: number;
  public maxPosture: number;
  public isInvulnerable: boolean = false;
  public isUiBroken: boolean = false;
  public surviveTimer: number = 0; // Countdown when in unbeatable phase

  // Combat Timing & Telegraphed Wind-up / Recovery
  public state: 'IDLE' | 'MOVING' | 'WINDUP' | 'ATTACKING' | 'RECOVERY' | 'STUNNED' = 'IDLE';
  public windupTimer: number = 0;
  public windupTotal: number = 600;
  public recoveryTimer: number = 0;
  public stunTimer: number = 0;

  // Anti-kite & Flame Shield
  public isFlameShieldActive: boolean = false;
  public flameShieldHp: number = 0;
  public teleportCooldown: number = 0;

  constructor(
    public readonly id: BossId,
    public readonly name: string,
    public readonly title: string,
    public health: number,
    public readonly maxHealth: number,
    public attackPower: number,
    public position: Vector2 = new Vector2(500, 260),
    maxPosture: number = 140
  ) {
    this.posture = maxPosture;
    this.maxPosture = maxPosture;
  }

  public static createMadreMorwenna(): Boss {
    return new Boss(
      'madre_morwenna',
      'Madre Morwenna',
      'VIGÍA DE LA PIRA SAGRADA',
      560,
      560,
      26,
      new Vector2(545, 260),
      140
    );
  }

  public static createGuardianCrisol(): Boss {
    return new Boss(
      'guardian_crisol',
      'Inquisidor Mayor (Crisol)',
      'CUSTODIO DEL CAMPANARIO',
      680,
      680,
      29,
      new Vector2(535, 260),
      160
    );
  }

  public static createCapitanAureo(): Boss {
    return new Boss(
      'capitan_aureo',
      'Capitán Áureo Vane',
      'COMANDANTE DEL GRAN PUENTE',
      780,
      780,
      32,
      new Vector2(535, 260),
      180
    );
  }

  public static createRexMalphas(): Boss {
    return new Boss(
      'rex_malphas',
      'Rex Malphas (Alaric)',
      'SOBERANO DEL ESPEJISMO',
      920,
      920,
      36,
      new Vector2(545, 260),
      200
    );
  }

  public static createAstaroth(): Boss {
    return new Boss(
      'astaroth',
      'Astaroth',
      'PADRE DE LAS CENIZAS Y SOL DEL ABISMO',
      1350,
      1350,
      42,
      new Vector2(545, 260),
      240
    );
  }

  public takeDamage(amount: number): { actualDamage: number; phaseChanged: boolean } {
    if (this.isInvulnerable) {
      return { actualDamage: 0, phaseChanged: false };
    }

    this.health = Math.max(0, this.health - amount);
    let phaseChanged = false;

    if (this.id === 'rex_malphas') {
      if (this.phase === BossPhaseType.PHASE_1 && this.health <= this.maxHealth * 0.5) {
        this.phase = BossPhaseType.PHASE_2;
        phaseChanged = true;
        EventBus.getInstance().publish(
          new BossPhaseChangedEvent(this.id, this.phase, 'FASE 2: DECRETO REAL — LEY DEL DESEO')
        );
      }
    } else if (this.id === 'madre_morwenna') {
      if (this.phase === BossPhaseType.PHASE_1 && this.health <= this.maxHealth * 0.5) {
        this.phase = BossPhaseType.PHASE_2;
        phaseChanged = true;
        EventBus.getInstance().publish(
          new BossPhaseChangedEvent(this.id, this.phase, 'FASE 2: PIRA DEL ABISMO DESATADA')
        );
      }
    } else if (this.id === 'guardian_crisol') {
      if (this.phase === BossPhaseType.PHASE_1 && this.health <= this.maxHealth * 0.45) {
        this.phase = BossPhaseType.PHASE_2;
        phaseChanged = true;
        EventBus.getInstance().publish(
          new BossPhaseChangedEvent(this.id, this.phase, 'FASE 2: CRISOL DE BRONCE CALCINANTE')
        );
      }
    } else if (this.id === 'capitan_aureo') {
      if (this.phase === BossPhaseType.PHASE_1 && this.health <= this.maxHealth * 0.45) {
        this.phase = BossPhaseType.PHASE_2;
        phaseChanged = true;
        EventBus.getInstance().publish(
          new BossPhaseChangedEvent(this.id, this.phase, 'FASE 2: FORMACIÓN DE ESCUDO IMPENETRABLE')
        );
      }
    }

    return { actualDamage: amount, phaseChanged };
  }

  public damagePosture(amount: number): boolean {
    if (this.isInvulnerable) return false;
    this.posture = Math.max(0, this.posture - amount);
    return this.posture === 0;
  }

  public recoverPosture(): void {
    this.posture = this.maxPosture;
    if (this.state === 'STUNNED') {
      this.state = 'IDLE';
    }
  }

  public startWindup(durationMs: number = 600): void {
    if (this.health <= 0 || this.state === 'STUNNED') return;
    this.state = 'WINDUP';
    this.windupTimer = durationMs;
    this.windupTotal = durationMs;
  }

  public startRecovery(durationMs: number = 500): void {
    if (this.health <= 0 || this.state === 'STUNNED') return;
    this.state = 'RECOVERY';
    this.recoveryTimer = durationMs;
  }

  public interruptAttack(stunDurationMs: number = 1400): void {
    this.windupTimer = 0;
    this.recoveryTimer = 0;
    this.state = 'STUNNED';
    this.stunTimer = stunDurationMs;
  }

  public activateFlameShield(shieldHp: number = 80): void {
    this.isFlameShieldActive = true;
    this.flameShieldHp = shieldHp;
  }

  public damageFlameShield(amount: number): boolean {
    if (!this.isFlameShieldActive) return false;
    this.flameShieldHp = Math.max(0, this.flameShieldHp - amount);
    if (this.flameShieldHp === 0) {
      this.isFlameShieldActive = false;
      return true; // Shield broken!
    }
    return false;
  }

  public updateBossCombatTimers(deltaMs: number): { shouldStrike: boolean; recoveryEnded: boolean; stunEnded: boolean } {
    let shouldStrike = false;
    let recoveryEnded = false;
    let stunEnded = false;

    if (this.teleportCooldown > 0) {
      this.teleportCooldown = Math.max(0, this.teleportCooldown - deltaMs);
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
