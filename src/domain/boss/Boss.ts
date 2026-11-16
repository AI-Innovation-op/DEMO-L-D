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

  constructor(
    public readonly id: BossId,
    public readonly name: string,
    public readonly title: string,
    public health: number,
    public readonly maxHealth: number,
    public attackPower: number,
    public position: Vector2 = new Vector2(500, 260)
  ) {
    this.posture = 120;
    this.maxPosture = 120;
  }

  public static createMadreMorwenna(): Boss {
    return new Boss(
      'madre_morwenna',
      'Madre Morwenna',
      'VIGÍA DE LA PIRA SAGRADA',
      350,
      350,
      22,
      new Vector2(500, 260)
    );
  }

  public static createGuardianCrisol(): Boss {
    return new Boss(
      'guardian_crisol',
      'Inquisidor Mayor (Crisol)',
      'CUSTODIO DEL CAMPANARIO',
      380,
      380,
      24,
      new Vector2(510, 260)
    );
  }

  public static createCapitanAureo(): Boss {
    return new Boss(
      'capitan_aureo',
      'Capitán Áureo Vane',
      'COMANDANTE DEL GRAN PUENTE',
      440,
      440,
      26,
      new Vector2(510, 260)
    );
  }

  public static createRexMalphas(): Boss {
    return new Boss(
      'rex_malphas',
      'Rex Malphas (Alaric)',
      'SOBERANO DEL ESPEJISMO',
      500,
      500,
      30,
      new Vector2(500, 260)
    );
  }

  public static createAstaroth(): Boss {
    return new Boss(
      'astaroth',
      'Astaroth',
      'PADRE DE LAS CENIZAS Y SOL DEL ABISMO',
      800,
      800,
      45,
      new Vector2(500, 260)
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
      if (this.phase === BossPhaseType.PHASE_1 && this.health <= this.maxHealth * 0.4) {
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
  }
}
