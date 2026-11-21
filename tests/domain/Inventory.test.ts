import { describe, it, expect, beforeEach } from 'vitest';
import { Inventory } from '../../src/domain/inventory/Inventory';

describe('Inventory Domain Tests', () => {
  let inventory: Inventory;

  beforeEach(() => {
    inventory = Inventory.createDefault();
  });

  it('should initialize with default consumables and relics', () => {
    const consumables = inventory.getConsumables();
    const relics = inventory.getRelics();

    expect(consumables.length).toBeGreaterThanOrEqual(3);
    expect(relics.length).toBeGreaterThanOrEqual(2);

    const balm = inventory.getItem('maiden_balm');
    expect(balm).toBeDefined();
    expect(balm?.quantity).toBe(3);
  });

  it('should consume an item and decrease quantity', () => {
    const initialQty = inventory.getItem('maiden_balm')?.quantity || 0;
    const result = inventory.useItem('maiden_balm');

    expect(result.success).toBe(true);
    expect(result.effectType).toBe('heal_health');
    expect(result.effectValue).toBe(35);
    expect(inventory.getItem('maiden_balm')?.quantity).toBe(initialQty - 1);
  });

  it('should toggle equip status of relics within slot limit', () => {
    // Starts with relic_oakhaven_cross equipped
    expect(inventory.getEquippedRelics().length).toBe(1);

    // Equip second relic (relic_willow_feather)
    const res1 = inventory.toggleEquipRelic('relic_willow_feather');
    expect(res1.success).toBe(true);
    expect(res1.isEquipped).toBe(true);
    expect(inventory.getEquippedRelics().length).toBe(2);

    // Unequip first relic
    const res2 = inventory.toggleEquipRelic('relic_oakhaven_cross');
    expect(res2.success).toBe(true);
    expect(res2.isEquipped).toBe(false);
    expect(inventory.getEquippedRelics().length).toBe(1);
  });

  it('should calculate parry bonus from equipped relics', () => {
    const bonus = inventory.getParryBonusMs();
    expect(bonus).toBe(70); // relic_oakhaven_cross gives +70ms
  });

  it('should not overflow maxRelicSlots when adding auto-equipped relics', () => {
    inventory.toggleEquipRelic('relic_willow_feather'); // now 2/2 equipped
    expect(inventory.getEquippedRelicsCount()).toBe(2);

    inventory.addItem({
      id: 'relic_extra_boss',
      name: 'Reliquia Extra',
      description: 'Prueba de límite de ranuras',
      category: 'relic',
      icon: '✨',
      quantity: 1,
      maxQuantity: 1,
      effectType: 'relic_parry_window',
      effectValue: 50,
      isEquipped: true
    });

    expect(inventory.hasItem('relic_extra_boss')).toBe(true);
    expect(inventory.getItem('relic_extra_boss')?.isEquipped).toBe(false);
    expect(inventory.getEquippedRelicsCount()).toBe(2);
  });
});
