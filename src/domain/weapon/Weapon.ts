export type WeaponId =
  | 'short_sword'
  | 'lamento_oakhaven'
  | 'colmillo_sauce'
  | 'falso_veredicto'
  | 'espejismo_oro'
  | 'alba_gris'
  | 'improvised_fists'
  | 'improvised_enemy_blade'
  | 'khaterine_bow';

export enum SpecialEffect {
  ASCUA_PRESTADA = 'ASCUA_PRESTADA',
  COSECHA_CULPA = 'COSECHA_CULPA',
  ECO_AQUELARRE = 'ECO_AQUELARRE',
  PESO_CONCIENCIA = 'PESO_CONCIENCIA',
  PASO_ASTRAL = 'PASO_ASTRAL',
  LUZ_EN_TINIEBLAS = 'LUZ_EN_TINIEBLAS',
  NONE = 'NONE'
}

export enum WeaponCategory {
  MELEE_FAST = 'MELEE_FAST',
  MELEE_HEAVY = 'MELEE_HEAVY',
  RANGED = 'RANGED',
  IMPROVISED = 'IMPROVISED'
}

export class Weapon {
  constructor(
    public readonly id: WeaponId,
    public readonly name: string,
    public readonly baseDamage: number,
    public readonly range: number,
    public readonly attackSpeed: number,
    public readonly category: WeaponCategory,
    public readonly specialEffect: SpecialEffect,
    public readonly description: string,
    public durability: number = Infinity // Improvised weapons have limited durability
  ) {}

  public static createShortSword(): Weapon {
    return new Weapon(
      'short_sword',
      'Espada Corta del Monaguillo',
      25,
      45,
      1.2,
      WeaponCategory.MELEE_FAST,
      SpecialEffect.ASCUA_PRESTADA,
      'Deja marcas de hollín que explotan al esquivar.'
    );
  }

  public static createLamentoOakhaven(): Weapon {
    return new Weapon(
      'lamento_oakhaven',
      'Lamento de Oakhaven (Incensario)',
      38,
      80,
      0.9,
      WeaponCategory.MELEE_FAST,
      SpecialEffect.COSECHA_CULPA,
      'Absorbe el fuego cercano y cura levemente tras combo completo.'
    );
  }

  public static createColmilloSauce(): Weapon {
    return new Weapon(
      'colmillo_sauce',
      'Colmillo del Sauce Negro',
      30,
      35,
      1.6,
      WeaponCategory.MELEE_FAST,
      SpecialEffect.ECO_AQUELARRE,
      'Críticos invocan la silueta espectral de Lyra repitiendo el tajo.'
    );
  }

  public static createFalsoVeredicto(): Weapon {
    return new Weapon(
      'falso_veredicto',
      'Falso Veredicto (Mandoble)',
      55,
      65,
      0.7,
      WeaponCategory.MELEE_HEAVY,
      SpecialEffect.PESO_CONCIENCIA,
      'Lento y demoledor; rompe escudos dorados y devuelve proyectiles.'
    );
  }

  public static createEspejismoOro(): Weapon {
    return new Weapon(
      'espejismo_oro',
      'Espejismo de Oro y Humo',
      42,
      50,
      1.3,
      WeaponCategory.MELEE_FAST,
      SpecialEffect.PASO_ASTRAL,
      'Sustituye la esquiva por humo púrpura e ilusión explosiva.'
    );
  }

  public static createAlbaGris(): Weapon {
    return new Weapon(
      'alba_gris',
      'Alba Gris (Espada de la Elección)',
      70,
      75,
      1.1,
      WeaponCategory.MELEE_HEAVY,
      SpecialEffect.LUZ_EN_TINIEBLAS,
      'Fuego negro abismal y luz blanca pura que purifica la corrupción.'
    );
  }

  public static createKhaterineBow(): Weapon {
    return new Weapon(
      'khaterine_bow',
      'Arco del Exilio Abismal',
      35,
      250,
      1.0,
      WeaponCategory.RANGED,
      SpecialEffect.NONE,
      'Proyectiles mágicos teledirigidos a distancia.'
    );
  }

  public static createFists(): Weapon {
    return new Weapon(
      'improvised_fists',
      'Puños y Empujones',
      12,
      25,
      1.5,
      WeaponCategory.IMPROVISED,
      SpecialEffect.NONE,
      'Golpes desesperados con las manos desnudas al estar desarmado.'
    );
  }

  public static createImprovisedBlade(): Weapon {
    return new Weapon(
      'improvised_enemy_blade',
      'Espada Enemiga Recogida',
      28,
      45,
      1.0,
      WeaponCategory.IMPROVISED,
      SpecialEffect.NONE,
      'Arma enemiga temporal. Se rompe tras 5 impactos.',
      5
    );
  }

  public consumeDurability(): boolean {
    if (this.durability !== Infinity) {
      this.durability -= 1;
      return this.durability <= 0; // True if broken
    }
    return false;
  }
}
