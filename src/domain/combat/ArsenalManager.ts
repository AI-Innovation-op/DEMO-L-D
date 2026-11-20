import { Inventory } from '../inventory/Inventory';

export type ArrowType = 'abyssal' | 'fire' | 'silver';

export interface ArrowShotResult {
  arrowType: ArrowType;
  baseDamage: number;
  postureMultiplier: number;
  burnDoTTicks: number;
  burnDoTDamagePerTick: number;
  ignoresFrontalBlock: boolean;
  consumedAmmo: boolean;
  arrowName: string;
  icon: string;
  colorHex: number;
}

export interface ThrownFlaskResult {
  success: boolean;
  message: string;
  damage: number;
  radius: number;
  consumed: boolean;
  burnDuration: number;
}

export class ArsenalManager {
  private selectedArrow: ArrowType = 'abyssal';

  public getSelectedArrowType(): ArrowType {
    return this.selectedArrow;
  }

  public getSelectedArrow(): ArrowType {
    return this.selectedArrow;
  }

  public setSelectedArrowType(type: ArrowType): void {
    this.selectedArrow = type;
  }

  public setSelectedArrow(type: ArrowType): void {
    this.selectedArrow = type;
  }

  public cycleNextArrow(): ArrowType {
    if (this.selectedArrow === 'abyssal') {
      this.selectedArrow = 'fire';
    } else if (this.selectedArrow === 'fire') {
      this.selectedArrow = 'silver';
    } else {
      this.selectedArrow = 'abyssal';
    }
    return this.selectedArrow;
  }

  public getArrowStock(inventory: Inventory, type: ArrowType): number | 'infinite' {
    if (type === 'abyssal') return 'infinite';
    const itemId = type === 'fire' ? 'arrow_fire' : 'arrow_silver';
    const item = inventory.getItem(itemId);
    return item ? item.quantity : 0;
  }

  public getFlaskStock(inventory: Inventory): number {
    const item = inventory.getItem('holy_fire_flask');
    return item ? item.quantity : 0;
  }

  public prepareArrowShot(inventory: Inventory, isHeavy: boolean): ArrowShotResult {
    let effectiveType = this.selectedArrow;

    // Check stock for special arrows
    if (effectiveType === 'fire') {
      const stock = this.getArrowStock(inventory, 'fire');
      if (typeof stock === 'number' && stock <= 0) {
        effectiveType = 'abyssal';
      }
    } else if (effectiveType === 'silver') {
      const stock = this.getArrowStock(inventory, 'silver');
      if (typeof stock === 'number' && stock <= 0) {
        effectiveType = 'abyssal';
      }
    }

    if (effectiveType === 'fire') {
      inventory.removeItem('arrow_fire', 1);
      return {
        arrowType: 'fire',
        baseDamage: isHeavy ? 42 : 26,
        postureMultiplier: 1.0,
        burnDoTTicks: 6,
        burnDoTDamagePerTick: 4,
        ignoresFrontalBlock: false,
        consumedAmmo: true,
        arrowName: 'Flecha de Fuego Fatuo',
        icon: '🔥',
        colorHex: 0xff5500
      };
    }

    if (effectiveType === 'silver') {
      inventory.removeItem('arrow_silver', 1);
      return {
        arrowType: 'silver',
        baseDamage: isHeavy ? 54 : 34,
        postureMultiplier: 2.5,
        burnDoTTicks: 0,
        burnDoTDamagePerTick: 0,
        ignoresFrontalBlock: true, // Breaks through shield defenses
        consumedAmmo: true,
        arrowName: 'Flecha de Plata Consagrada',
        icon: '🏹',
        colorHex: 0x00e5ff
      };
    }

    // Default Abyssal Arrow (Infinite stock)
    return {
      arrowType: 'abyssal',
      baseDamage: isHeavy ? 48 : 28,
      postureMultiplier: 1.0,
      burnDoTTicks: 0,
      burnDoTDamagePerTick: 0,
      ignoresFrontalBlock: false,
      consumedAmmo: false,
      arrowName: 'Flecha Abisal',
      icon: '✨',
      colorHex: isHeavy ? 0xff44ee : 0xaa44ff
    };
  }

  public throwHolyFireFlask(inventory: Inventory): ThrownFlaskResult {
    const flask = inventory.getItem('holy_fire_flask');
    if (!flask || flask.quantity <= 0) {
      return {
        success: false,
        message: 'No tienes Frascos de Fuego Fatuo en tu bolsa.',
        damage: 0,
        radius: 0,
        consumed: false,
        burnDuration: 0
      };
    }

    inventory.removeItem('holy_fire_flask', 1);
    return {
      success: true,
      message: '¡Frasco de Fuego Fatuo arrojado!',
      damage: 55,
      radius: 3.8,
      consumed: true,
      burnDuration: 4.0
    };
  }
}
