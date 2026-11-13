import { Vector2 } from '../shared/Vector2';
import { Weapon } from '../weapon/Weapon';
import { DomainEvent } from '../shared/DomainEvent';

export enum CombatRhythm {
  DUELIST = 'DUELIST', // Tense, precision block/dodge, parry window
  ARCADE = 'ARCADE'    // Fast combos, crowd control, beat 'em up
}

export enum DisarmReason {
  TACTICAL_CRISIS = 'TACTICAL_CRISIS', // Broken guard by heavy hit
  VOLUNTARY_THROW = 'VOLUNTARY_THROW'  // Player threw weapon to stun
}

export enum FinisherStyle {
  NONE = 'NONE',
  REALTIME_FLUID = 'REALTIME_FLUID',       // High HP remaining, instant dynamic execute
  CINEMATIC_COMBO = 'CINEMATIC_COMBO'      // Low HP remaining, camera zooms in, high-energy sequence
}

export interface DroppedWeaponItem {
  readonly id: string;
  readonly weapon: Weapon;
  position: Vector2;
  readonly isPlayerPrimary: boolean;
  isRecoverable: boolean;
}

export class WeaponThrownEvent implements DomainEvent {
  public readonly eventName = 'WeaponThrown';
  public readonly occurredOn = new Date();
  constructor(
    public readonly weapon: Weapon,
    public readonly origin: Vector2,
    public readonly direction: number
  ) {}
}

export class WeaponDisarmedEvent implements DomainEvent {
  public readonly eventName = 'WeaponDisarmed';
  public readonly occurredOn = new Date();
  constructor(
    public readonly characterId: string,
    public readonly reason: DisarmReason,
    public readonly droppedAt: Vector2
  ) {}
}

export class FinisherTriggeredEvent implements DomainEvent {
  public readonly eventName = 'FinisherTriggered';
  public readonly occurredOn = new Date();
  constructor(
    public readonly targetId: string,
    public readonly style: FinisherStyle,
    public readonly damage: number
  ) {}
}
