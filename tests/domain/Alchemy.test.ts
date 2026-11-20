import { describe, it, expect, beforeEach } from 'vitest';
import { Inventory } from '../../src/domain/inventory/Inventory';
import { AlchemyPot } from '../../src/domain/alchemy/AlchemyPot';
import { CANONICAL_MATERIALS } from '../../src/domain/alchemy/AlchemyRecipe';

describe('Alchemy & Elowen Herbalism (DDD Domain)', () => {
  let pot: AlchemyPot;
  let inventory: Inventory;

  beforeEach(() => {
    pot = new AlchemyPot();
    inventory = new Inventory(2);
  });

  it('initializes with canonical recipes from Oakhaven lore', () => {
    const recipes = pot.getRecipes();
    expect(recipes.length).toBeGreaterThanOrEqual(4);

    const maidenBalmRecipe = pot.getRecipe('craft_maiden_balm');
    expect(maidenBalmRecipe).toBeDefined();
    expect(maidenBalmRecipe?.name).toBe('Bálsamo de la Doncella');
    expect(maidenBalmRecipe?.outputItem.id).toBe('maiden_balm');
  });

  it('correctly detects missing ingredients when inventory is empty', () => {
    const check = pot.canCraft('craft_maiden_balm', inventory);
    expect(check.canCraft).toBe(false);
    expect(check.missing.length).toBe(2);
    expect(check.missing[0]).toContain('Hoja de Plata (0/2)');
    expect(check.missing[1]).toContain('Ungüento Base de Cera (0/1)');
  });

  it('refuses to craft when ingredients are insufficient', () => {
    // Give only 1 silverleaf instead of 2
    inventory.addItem(CANONICAL_MATERIALS.herb_silverleaf, 1);
    inventory.addItem(CANONICAL_MATERIALS.salve_base, 1);

    const check = pot.canCraft('craft_maiden_balm', inventory);
    expect(check.canCraft).toBe(false);
    expect(check.missing.length).toBe(1);
    expect(check.missing[0]).toContain('Hoja de Plata (1/2)');

    const result = pot.craft('craft_maiden_balm', inventory);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Faltan ingredientes');
    // Ensure no materials were consumed
    expect(inventory.getItem('herb_silverleaf')?.quantity).toBe(1);
    expect(inventory.getItem('salve_base')?.quantity).toBe(1);
  });

  it('successfully crafts item, deducts exact ingredients and awards EXP', () => {
    inventory.addItem(CANONICAL_MATERIALS.herb_silverleaf, 5);
    inventory.addItem(CANONICAL_MATERIALS.salve_base, 2);

    const check = pot.canCraft('craft_maiden_balm', inventory);
    expect(check.canCraft).toBe(true);
    expect(check.missing.length).toBe(0);

    const result = pot.craft('craft_maiden_balm', inventory);
    expect(result.success).toBe(true);
    expect(result.craftedItem?.id).toBe('maiden_balm');
    expect(result.quantityCrafted).toBe(1);
    expect(result.expGained).toBe(15);

    // Verify ingredient deductions: 5 - 2 = 3, 2 - 1 = 1
    expect(inventory.getItem('herb_silverleaf')?.quantity).toBe(3);
    expect(inventory.getItem('salve_base')?.quantity).toBe(1);

    // Verify crafted consumable is in inventory
    const crafted = inventory.getItem('maiden_balm');
    expect(crafted).toBeDefined();
    expect(crafted?.quantity).toBe(1);
  });

  it('can craft consecrated oil and saint jude rosary', () => {
    inventory.addItem(CANONICAL_MATERIALS.ash_purified, 4);
    inventory.addItem(CANONICAL_MATERIALS.blood_hound, 2);
    inventory.addItem(CANONICAL_MATERIALS.water_blessed, 2);

    // 1. Craft Rosary (1 water, 1 ash)
    const rosaryRes = pot.craft('craft_saint_jude_rosary', inventory);
    expect(rosaryRes.success).toBe(true);
    expect(rosaryRes.craftedItem?.id).toBe('saint_jude_rosary');
    expect(inventory.getItem('water_blessed')?.quantity).toBe(1);
    expect(inventory.getItem('ash_purified')?.quantity).toBe(3);

    // 2. Craft Consecrated Oil (2 ash, 1 blood)
    const oilRes = pot.craft('craft_consecrated_oil', inventory);
    expect(oilRes.success).toBe(true);
    expect(oilRes.craftedItem?.id).toBe('consecrated_ash');
    expect(inventory.getItem('ash_purified')?.quantity).toBe(1);
    expect(inventory.getItem('blood_hound')?.quantity).toBe(1);
  });
});
