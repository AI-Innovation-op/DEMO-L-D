import { describe, it, expect, beforeEach } from 'vitest';
import { Inventory } from '../../src/domain/inventory/Inventory';
import { ArsenalManager } from '../../src/domain/combat/ArsenalManager';

describe('ArsenalManager & Elemental Munitions (DDD Domain)', () => {
  let arsenal: ArsenalManager;
  let inventory: Inventory;

  beforeEach(() => {
    arsenal = new ArsenalManager();
    inventory = new Inventory(2);
  });

  it('initializes with default abyssal arrows and infinite stock', () => {
    expect(arsenal.getSelectedArrowType()).toBe('abyssal');
    expect(arsenal.getArrowStock(inventory, 'abyssal')).toBe('infinite');
    expect(arsenal.getArrowStock(inventory, 'fire')).toBe(0);
    expect(arsenal.getArrowStock(inventory, 'silver')).toBe(0);
  });

  it('cycles arrow types correctly', () => {
    expect(arsenal.cycleNextArrow()).toBe('fire');
    expect(arsenal.cycleNextArrow()).toBe('silver');
    expect(arsenal.cycleNextArrow()).toBe('abyssal');
  });

  it('fires default abyssal arrow without consuming ammo when special stock is empty', () => {
    arsenal.setSelectedArrowType('fire');
    // Inventory has 0 fire arrows -> should gracefully fallback to abyssal arrow
    const shot = arsenal.prepareArrowShot(inventory, false);
    expect(shot.arrowType).toBe('abyssal');
    expect(shot.consumedAmmo).toBe(false);
    expect(shot.baseDamage).toBe(28);
    expect(shot.burnDoTTicks).toBe(0);
  });

  it('consumes fire arrow, deals burn DoT and triggers flame visuals', () => {
    inventory.addItem({
      id: 'arrow_fire',
      name: 'Flechas de Fuego Fatuo',
      description: 'Flechas ardientes',
      category: 'ammunition',
      icon: '🔥',
      quantity: 5,
      maxQuantity: 30,
      effectType: 'special_ammo',
      effectValue: 24
    }, 5);

    arsenal.setSelectedArrowType('fire');
    expect(arsenal.getArrowStock(inventory, 'fire')).toBe(5);

    const shot = arsenal.prepareArrowShot(inventory, true); // heavy shot
    expect(shot.arrowType).toBe('fire');
    expect(shot.consumedAmmo).toBe(true);
    expect(shot.baseDamage).toBe(42);
    expect(shot.burnDoTTicks).toBe(6);
    expect(shot.burnDoTDamagePerTick).toBe(4);
    expect(shot.colorHex).toBe(0xff5500);

    // Remaining stock should be 4
    expect(arsenal.getArrowStock(inventory, 'fire')).toBe(4);
  });

  it('consumes silver arrow, deals massive posture damage and ignores frontal shield blocks', () => {
    inventory.addItem({
      id: 'arrow_silver',
      name: 'Flechas de Plata Consagrada',
      description: 'Flechas de plata',
      category: 'ammunition',
      icon: '🏹',
      quantity: 3,
      maxQuantity: 30,
      effectType: 'special_ammo',
      effectValue: 45
    }, 3);

    arsenal.setSelectedArrowType('silver');
    expect(arsenal.getArrowStock(inventory, 'silver')).toBe(3);

    const shot = arsenal.prepareArrowShot(inventory, false); // light shot
    expect(shot.arrowType).toBe('silver');
    expect(shot.consumedAmmo).toBe(true);
    expect(shot.baseDamage).toBe(34);
    expect(shot.postureMultiplier).toBe(2.5);
    expect(shot.ignoresFrontalBlock).toBe(true);
    expect(shot.colorHex).toBe(0x00e5ff);

    expect(arsenal.getArrowStock(inventory, 'silver')).toBe(2);
  });

  it('handles holy fire flask throws with area radius and inventory deduction', () => {
    // 1. Without flasks
    const throwFail = arsenal.throwHolyFireFlask(inventory);
    expect(throwFail.success).toBe(false);
    expect(throwFail.consumed).toBe(false);

    // 2. With flasks
    inventory.addItem({
      id: 'holy_fire_flask',
      name: 'Frasco de Fuego Fatuo',
      description: 'Frasco arrojadizo ardiente',
      category: 'consumable',
      icon: '🧪',
      quantity: 2,
      maxQuantity: 10,
      effectType: 'throwable_flask',
      effectValue: 55
    }, 2);

    const throwSuccess = arsenal.throwHolyFireFlask(inventory);
    expect(throwSuccess.success).toBe(true);
    expect(throwSuccess.damage).toBe(55);
    expect(throwSuccess.radius).toBe(3.8);
    expect(throwSuccess.consumed).toBe(true);
    expect(inventory.getItem('holy_fire_flask')?.quantity).toBe(1);
  });
});
