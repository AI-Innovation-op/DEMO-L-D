import { Inventory } from '../inventory/Inventory';
import { InventoryItem } from '../inventory/InventoryItem';
import { AlchemyRecipe, CANONICAL_RECIPES } from './AlchemyRecipe';

export interface CraftResult {
  success: boolean;
  message: string;
  craftedItem?: InventoryItem;
  quantityCrafted?: number;
  expGained?: number;
}

export class AlchemyPot {
  private recipes: Map<string, AlchemyRecipe> = new Map();

  constructor(customRecipes?: AlchemyRecipe[]) {
    const list = customRecipes || CANONICAL_RECIPES;
    for (const r of list) {
      this.recipes.set(r.id, r);
    }
  }

  public getRecipes(): AlchemyRecipe[] {
    return Array.from(this.recipes.values());
  }

  public getRecipe(recipeId: string): AlchemyRecipe | undefined {
    return this.recipes.get(recipeId);
  }

  public canCraft(recipeId: string, inventory: Inventory): { canCraft: boolean; missing: string[] } {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) {
      return { canCraft: false, missing: ['Receta desconocida'] };
    }

    const missing: string[] = [];
    for (const ing of recipe.ingredients) {
      const item = inventory.getItem(ing.itemId);
      const currentQty = item ? item.quantity : 0;
      if (currentQty < ing.quantity) {
        missing.push(`${ing.name} (${currentQty}/${ing.quantity})`);
      }
    }

    return {
      canCraft: missing.length === 0,
      missing
    };
  }

  public craft(recipeId: string, inventory: Inventory): CraftResult {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) {
      return { success: false, message: 'La receta no existe en el caldero.' };
    }

    const check = this.canCraft(recipeId, inventory);
    if (!check.canCraft) {
      return {
        success: false,
        message: `Faltan ingredientes: ${check.missing.join(', ')}`
      };
    }

    // Deduct ingredients
    for (const ing of recipe.ingredients) {
      const removed = inventory.removeItem(ing.itemId, ing.quantity);
      if (!removed) {
        return { success: false, message: `Error al consumir ${ing.name}` };
      }
    }

    // Add crafted output to inventory
    inventory.addItem(recipe.outputItem, recipe.outputQuantity);

    return {
      success: true,
      message: `¡${recipe.outputItem.name} sintetizado con éxito!`,
      craftedItem: recipe.outputItem,
      quantityCrafted: recipe.outputQuantity,
      expGained: recipe.expReward
    };
  }
}
