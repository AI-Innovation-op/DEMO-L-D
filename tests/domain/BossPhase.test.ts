import { describe, it, expect } from 'vitest';
import { Boss, BossPhaseType } from '../../src/domain/boss/Boss';
import { Inventory } from '../../src/domain/inventory/Inventory';

describe('Domain: Boss Phase 2 & Key Progression', () => {
  it('initializes Madre Morwenna in Phase 1 with full health', () => {
    const morwenna = Boss.createMadreMorwenna();
    expect(morwenna.phase).toBe(BossPhaseType.PHASE_1);
    expect(morwenna.health).toBe(350);
    expect(morwenna.maxHealth).toBe(350);
    expect(morwenna.title).toBe('VIGÍA DE LA PIRA SAGRADA');
  });

  it('triggers Phase 2 transition when Morwenna reaches 50% health', () => {
    const morwenna = Boss.createMadreMorwenna();

    // Damage Morwenna to 60% -> still Phase 1
    const res1 = morwenna.takeDamage(140);
    expect(morwenna.health).toBe(210);
    expect(res1.phaseChanged).toBe(false);
    expect(morwenna.phase).toBe(BossPhaseType.PHASE_1);

    // Damage Morwenna to 40% -> triggers Phase 2 (PIRA DEL ABISMO DESATADA)
    const res2 = morwenna.takeDamage(70);
    expect(morwenna.health).toBe(140);
    expect(res2.phaseChanged).toBe(true);
    expect(morwenna.phase).toBe(BossPhaseType.PHASE_2);
  });

  it('stores Oakhaven Crypt Key as a key item in inventory upon boss defeat', () => {
    const inventory = Inventory.createDefault();
    const initialItems = inventory.getAllItems().length;

    inventory.addItem({
      id: 'oakhaven_crypt_key',
      name: 'Llave de las Criptas de San Jude',
      description: 'Llave de hierro negro oxidado recuperada de Madre Morwenna. Abre la verja del cementerio y las criptas subterráneas.',
      category: 'key_item',
      icon: '🗝️',
      quantity: 1,
      maxQuantity: 1,
      effectType: 'unlock_gate',
      effectValue: 1
    });

    expect(inventory.getAllItems().length).toBe(initialItems + 1);
    const key = inventory.getItem('oakhaven_crypt_key');
    expect(key).toBeDefined();
    expect(key?.category).toBe('key_item');
    expect(key?.quantity).toBe(1);
    expect(key?.effectType).toBe('unlock_gate');
  });
});
