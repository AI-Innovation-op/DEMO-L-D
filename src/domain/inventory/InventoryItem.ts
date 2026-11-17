export type ItemCategory = 'consumable' | 'relic' | 'key_item';

export type ItemEffectType =
  | 'heal_health'
  | 'restore_posture'
  | 'buff_attack'
  | 'buff_speed'
  | 'relic_parry_window'
  | 'relic_dodge_cost'
  | 'relic_danger_sense'
  | 'unlock_gate';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  icon: string;
  quantity: number;
  maxQuantity: number;
  effectType: ItemEffectType;
  effectValue: number;
  durationSeconds?: number;
  isEquipped?: boolean;
}
