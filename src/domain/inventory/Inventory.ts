import { InventoryItem } from './InventoryItem';
import { CANONICAL_MATERIALS } from '../alchemy/AlchemyRecipe';

export interface UseItemResult {
  success: boolean;
  message: string;
  effectType?: string;
  effectValue?: number;
  durationSeconds?: number;
}

export class Inventory {
  private items: Map<string, InventoryItem> = new Map();
  private maxRelicSlots: number = 2;

  constructor(maxRelicSlots: number = 2) {
    this.maxRelicSlots = maxRelicSlots;
  }

  public static createDefault(): Inventory {
    const inv = new Inventory(2);

    // Consumables
    inv.addItem({
      id: 'maiden_balm',
      name: 'Bálsamo de la Doncella',
      description: 'Hierbas sagradas bendecidas por Elowen. Restaura +35 puntos de salud.',
      category: 'consumable',
      icon: '🌿',
      quantity: 3,
      maxQuantity: 10,
      effectType: 'heal_health',
      effectValue: 35
    });

    inv.addItem({
      id: 'saint_jude_rosary',
      name: 'Rosario de San Jude',
      description: 'Rosario tallado en roble de Oakhaven por el Padre Cedric. Restaura la postura y confiere serenidad.',
      category: 'consumable',
      icon: '📿',
      quantity: 2,
      maxQuantity: 5,
      effectType: 'restore_posture',
      effectValue: 50
    });

    inv.addItem({
      id: 'consecrated_ash',
      name: 'Ceniza Consagrada',
      description: 'Cenizas de santos de Londinium. Imbuye las armas con +25% de daño sagrado durante 20 segundos.',
      category: 'consumable',
      icon: '✨',
      quantity: 1,
      maxQuantity: 5,
      effectType: 'buff_attack',
      effectValue: 25,
      durationSeconds: 20
    });

    // Relics (Passive Equippable Artifacts)
    inv.addItem({
      id: 'relic_oakhaven_cross',
      name: 'Cruz de Oakhaven',
      description: 'Astilla de la cruz del santuario. Amplía la ventana de Parry en +70 ms.',
      category: 'relic',
      icon: '✝️',
      quantity: 1,
      maxQuantity: 1,
      effectType: 'relic_parry_window',
      effectValue: 70,
      isEquipped: true
    });

    inv.addItem({
      id: 'relic_willow_feather',
      name: 'Pluma del Sauce Negro',
      description: 'Pluma oscura imbuida por Khaterine. Reduce el coste de fatiga de esquiva un 20%.',
      category: 'relic',
      icon: '🪶',
      quantity: 1,
      maxQuantity: 1,
      effectType: 'relic_dodge_cost',
      effectValue: 20,
      isEquipped: false
    });

    // Starter Alchemy Materials (Botica de Elowen)
    inv.addItem({ ...CANONICAL_MATERIALS.herb_silverleaf, quantity: 2 });
    inv.addItem({ ...CANONICAL_MATERIALS.salve_base, quantity: 1 });
    inv.addItem({ ...CANONICAL_MATERIALS.ash_purified, quantity: 1 });

    return inv;
  }

  public addItem(item: InventoryItem, qty: number = item.quantity || 1): boolean {
    const existing = this.items.get(item.id);
    if (existing) {
      existing.quantity = Math.min(existing.maxQuantity, existing.quantity + qty);
      return true;
    } else {
      this.items.set(item.id, {
        ...item,
        quantity: Math.min(item.maxQuantity, qty),
        isEquipped: item.isEquipped ?? false
      });
      return true;
    }
  }

  public removeItem(itemId: string, qty: number = 1): boolean {
    const existing = this.items.get(itemId);
    if (!existing || existing.quantity < qty) {
      return false;
    }
    existing.quantity -= qty;
    if (existing.quantity <= 0) {
      this.items.delete(itemId);
    }
    return true;
  }

  public getItem(itemId: string): InventoryItem | undefined {
    return this.items.get(itemId);
  }

  public getAllItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  public getConsumables(): InventoryItem[] {
    return Array.from(this.items.values()).filter(i => i.category === 'consumable');
  }

  public getRelics(): InventoryItem[] {
    return Array.from(this.items.values()).filter(i => i.category === 'relic');
  }

  public getMaterials(): InventoryItem[] {
    return Array.from(this.items.values()).filter(i => i.category === 'material');
  }

  public getEquippedRelics(): InventoryItem[] {
    return Array.from(this.items.values()).filter(i => i.category === 'relic' && i.isEquipped);
  }

  public useItem(itemId: string): UseItemResult {
    const item = this.items.get(itemId);
    if (!item) {
      return { success: false, message: 'El objeto no existe en el inventario.' };
    }

    if (item.category !== 'consumable') {
      return { success: false, message: 'Este objeto no es un consumible directo.' };
    }

    if (item.quantity <= 0) {
      return { success: false, message: 'No quedan unidades disponibles.' };
    }

    item.quantity -= 1;
    if (item.quantity <= 0) {
      this.items.delete(itemId);
    }

    let message = '';
    switch (item.effectType) {
      case 'heal_health':
        message = `¡Usaste ${item.name}! Recuperas +${item.effectValue} Salud.`;
        break;
      case 'restore_posture':
        message = `¡Usaste ${item.name}! Postura restaurada al 100%.`;
        break;
      case 'buff_attack':
        message = `¡Usaste ${item.name}! Ataque incrementado un +${item.effectValue}% por ${item.durationSeconds || 20}s.`;
        break;
      case 'buff_speed':
        message = `¡Usaste ${item.name}! Velocidad aumentada un +${item.effectValue}%.`;
        break;
      default:
        message = `Usaste ${item.name}.`;
    }

    return {
      success: true,
      message,
      effectType: item.effectType,
      effectValue: item.effectValue,
      durationSeconds: item.durationSeconds
    };
  }

  public toggleEquipRelic(relicId: string): { success: boolean; message: string; isEquipped: boolean } {
    const relic = this.items.get(relicId);
    if (!relic || relic.category !== 'relic') {
      return { success: false, message: 'No es una reliquia válida.', isEquipped: false };
    }

    if (relic.isEquipped) {
      relic.isEquipped = false;
      return { success: true, message: `Desequipaste ${relic.name}.`, isEquipped: false };
    } else {
      const equippedCount = this.getEquippedRelics().length;
      if (equippedCount >= this.maxRelicSlots) {
        return {
          success: false,
          message: `Ranuras de reliquia llenas (${this.maxRelicSlots}/${this.maxRelicSlots}). Desequipa una antes.`,
          isEquipped: false
        };
      }
      relic.isEquipped = true;
      return { success: true, message: `Equipaste ${relic.name}.`, isEquipped: true };
    }
  }

  public getMaxRelicSlots(): number {
    return this.maxRelicSlots;
  }

  public getEquippedRelicsCount(): number {
    return this.getEquippedRelics().length;
  }

  public getDodgeCostReduction(): number {
    return this.getDodgeFatigueReductionPct() / 100;
  }

  public getParryBonusMs(): number {
    return this.getEquippedRelics()
      .filter(r => r.effectType === 'relic_parry_window')
      .reduce((acc, r) => acc + r.effectValue, 0);
  }

  public getDodgeFatigueReductionPct(): number {
    return this.getEquippedRelics()
      .filter(r => r.effectType === 'relic_dodge_cost')
      .reduce((acc, r) => acc + r.effectValue, 0);
  }

  public toJSON(): object {
    return {
      items: Array.from(this.items.values()),
      maxRelicSlots: this.maxRelicSlots
    };
  }

  public static fromJSON(data: { items: InventoryItem[]; maxRelicSlots?: number }): Inventory {
    const inv = new Inventory(data.maxRelicSlots || 2);
    if (Array.isArray(data.items)) {
      data.items.forEach(item => inv.addItem(item, item.quantity));
    }
    return inv;
  }
}
