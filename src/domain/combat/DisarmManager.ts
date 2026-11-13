import { Vector2 } from '../shared/Vector2';
import { Weapon } from '../weapon/Weapon';
import { DisarmReason, DroppedWeaponItem, WeaponDisarmedEvent, WeaponThrownEvent } from './CombatTypes';
import { EventBus } from '../shared/DomainEvent';

export class DisarmManager {
  private primaryWeapon: Weapon | null = null;
  private currentWeapon: Weapon;
  private droppedWeapons: DroppedWeaponItem[] = [];
  private isDisarmed: boolean = false;

  constructor(initialWeapon: Weapon) {
    this.primaryWeapon = initialWeapon;
    this.currentWeapon = initialWeapon;
  }

  public getCurrentWeapon(): Weapon {
    return this.currentWeapon;
  }

  public getPrimaryWeapon(): Weapon | null {
    return this.primaryWeapon;
  }

  public getDroppedWeapons(): readonly DroppedWeaponItem[] {
    return this.droppedWeapons;
  }

  public isPlayerDisarmed(): boolean {
    return this.isDisarmed;
  }

  /**
   * Option A (Tactical Crisis): Forced disarm caused by heavy hit breaking guard.
   */
  public triggerTacticalCrisis(playerPos: Vector2): void {
    if (this.isDisarmed && this.currentWeapon.category === 'IMPROVISED') {
      return; // Already disarmed
    }

    const lostWeapon = this.currentWeapon;
    this.isDisarmed = true;
    this.currentWeapon = Weapon.createFists();

    // Drop weapon with slight offset
    const dropPosition = new Vector2(playerPos.x + (Math.random() > 0.5 ? 40 : -40), playerPos.y);
    const droppedItem: DroppedWeaponItem = {
      id: `dropped_${Date.now()}_${Math.random()}`,
      weapon: lostWeapon,
      position: dropPosition,
      isPlayerPrimary: lostWeapon.id === this.primaryWeapon?.id,
      isRecoverable: true
    };
    this.droppedWeapons.push(droppedItem);

    EventBus.getInstance().publish(
      new WeaponDisarmedEvent('player', DisarmReason.TACTICAL_CRISIS, dropPosition)
    );
  }

  /**
   * Option B (Tool & Resource): Voluntary weapon throw to stun or finish enemy at range.
   */
  public throwWeapon(playerPos: Vector2, facingDirection: number): WeaponThrownEvent | null {
    if (this.currentWeapon.id === 'improvised_fists') {
      return null; // Cannot throw fists
    }

    const thrown = this.currentWeapon;
    this.isDisarmed = true;
    this.currentWeapon = Weapon.createFists();

    // The thrown weapon lands ahead
    const landPosition = new Vector2(playerPos.x + facingDirection * 180, playerPos.y);
    const droppedItem: DroppedWeaponItem = {
      id: `thrown_${Date.now()}_${Math.random()}`,
      weapon: thrown,
      position: landPosition,
      isPlayerPrimary: thrown.id === this.primaryWeapon?.id,
      isRecoverable: true
    };
    this.droppedWeapons.push(droppedItem);

    const event = new WeaponThrownEvent(thrown, playerPos, facingDirection);
    EventBus.getInstance().publish(event);
    return event;
  }

  /**
   * Pick up weapon lying nearby on the ground.
   */
  public tryPickupNearby(playerPos: Vector2, pickupRadius: number = 40): boolean {
    const index = this.droppedWeapons.findIndex(
      item => item.position.distanceTo(playerPos) <= pickupRadius && item.isRecoverable
    );

    if (index === -1) {
      return false;
    }

    const item = this.droppedWeapons[index];
    this.droppedWeapons.splice(index, 1);

    if (item.isPlayerPrimary && this.primaryWeapon) {
      this.currentWeapon = this.primaryWeapon;
      this.isDisarmed = false;
    } else {
      this.currentWeapon = item.weapon;
      this.isDisarmed = false;
    }

    return true;
  }

  /**
   * Spawn a temporary enemy weapon on ground after enemy defeat.
   */
  public spawnEnemyDroppedWeapon(position: Vector2): void {
    const enemyWeapon = Weapon.createImprovisedBlade();
    this.droppedWeapons.push({
      id: `enemy_drop_${Date.now()}_${Math.random()}`,
      weapon: enemyWeapon,
      position,
      isPlayerPrimary: false,
      isRecoverable: true
    });
  }

  /**
   * Use current weapon and handle durability if improvised.
   */
  public consumeWeaponUse(): void {
    if (this.currentWeapon.category === 'IMPROVISED' && this.currentWeapon.durability !== Infinity) {
      const isBroken = this.currentWeapon.consumeDurability();
      if (isBroken) {
        // Weapon shattered, revert to fists
        this.currentWeapon = Weapon.createFists();
        this.isDisarmed = true;
      }
    }
  }

  public setEquippedPrimary(weapon: Weapon): void {
    this.primaryWeapon = weapon;
    this.currentWeapon = weapon;
    this.isDisarmed = false;
  }
}
