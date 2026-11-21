import { Inventory } from '../inventory/Inventory';
import { Progression } from '../progression/Progression';

// ============================================================================
// ACT II BOSS: EL GUARDIÁN DEL CRISOL (CRUCIBLE GUARDIAN)
// ============================================================================
export class CrucibleGuardian {
  public static readonly BASE_MAX_HEALTH = 220;
  public static readonly HAMMER_DAMAGE = 28;
  public static readonly SLAG_BURST_DAMAGE = 38;
  public static readonly EXP_REWARD = 150;

  private _health: number = CrucibleGuardian.BASE_MAX_HEALTH;
  private _maxHealth: number = CrucibleGuardian.BASE_MAX_HEALTH;
  private _state: 'DORMANT' | 'CHASE' | 'HAMMER_SLAM' | 'SLAG_BURST' | 'STUNNED' | 'DEAD' = 'DORMANT';
  private _rewardsClaimed: boolean = false;

  public get health(): number { return this._health; }
  public get maxHealth(): number { return this._maxHealth; }
  public get state(): string { return this._state; }
  public get isDefeated(): boolean { return this._health <= 0 || this._state === 'DEAD'; }

  public setState(newState: 'DORMANT' | 'CHASE' | 'HAMMER_SLAM' | 'SLAG_BURST' | 'STUNNED' | 'DEAD'): void {
    this._state = newState;
    if (newState === 'DEAD') this._health = 0;
  }

  public takeDamage(amount: number, isVulnerable: boolean = false): { actualDamage: number; defeated: boolean } {
    if (this.isDefeated) return { actualDamage: 0, defeated: true };
    const actualDamage = isVulnerable ? Math.round(amount * 1.4) : amount;
    this._health = Math.max(0, this._health - actualDamage);
    const defeated = this._health === 0;
    if (defeated) this._state = 'DEAD';
    return { actualDamage, defeated };
  }

  public evaluateAttack(distance: number, isDodging: boolean, isBurst: boolean = false): { hit: boolean; damage: number } {
    if (this.isDefeated || isDodging) return { hit: false, damage: 0 };
    const maxDist = isBurst ? 3.8 : 2.4;
    if (distance <= maxDist) {
      return { hit: true, damage: isBurst ? CrucibleGuardian.SLAG_BURST_DAMAGE : CrucibleGuardian.HAMMER_DAMAGE };
    }
    return { hit: false, damage: 0 };
  }

  public claimRewards(inventory: Inventory, progression: Progression): { claimed: boolean; expAwarded: number } {
    if (!this.isDefeated || this._rewardsClaimed) return { claimed: false, expAwarded: 0 };
    this._rewardsClaimed = true;
    progression.addExp(CrucibleGuardian.EXP_REWARD);
    inventory.addItem({
      id: 'relic_lament_oakhaven',
      name: 'Lamento de Oakhaven',
      description: 'Incensario litúrgico del Padre Cedric. Quema resinas sacras que absorben el fuego enemigo y aumentan el parry.',
      category: 'relic',
      icon: '🕯️',
      quantity: 1,
      maxQuantity: 1,
      effectType: 'relic_parry_window',
      effectValue: 80,
      isEquipped: true
    });
    return { claimed: true, expAwarded: CrucibleGuardian.EXP_REWARD };
  }
}

// ============================================================================
// ACT III BOSS: EL CAPITÁN ÁUREO VANE (CAPTAIN VANE)
// ============================================================================
export class CaptainVane {
  public static readonly BASE_MAX_HEALTH = 280;
  public static readonly SWORD_DAMAGE = 30;
  public static readonly SHIELD_BASH_DAMAGE = 22;
  public static readonly EXP_REWARD = 220;

  private _health: number = CaptainVane.BASE_MAX_HEALTH;
  private _maxHealth: number = CaptainVane.BASE_MAX_HEALTH;
  private _shieldRaised: boolean = true;
  private _state: 'GUARDING' | 'CHASE' | 'BASH' | 'GREAT_SLASH' | 'STUNNED' | 'DEAD' = 'GUARDING';
  private _rewardsClaimed: boolean = false;

  public get health(): number { return this._health; }
  public get maxHealth(): number { return this._maxHealth; }
  public get state(): string { return this._state; }
  public get shieldRaised(): boolean { return this._shieldRaised; }
  public get isDefeated(): boolean { return this._health <= 0 || this._state === 'DEAD'; }

  public setState(newState: 'GUARDING' | 'CHASE' | 'BASH' | 'GREAT_SLASH' | 'STUNNED' | 'DEAD'): void {
    this._state = newState;
    if (newState === 'DEAD') this._health = 0;
  }

  public breakShield(): void {
    this._shieldRaised = false;
    this._state = 'STUNNED';
  }

  public takeDamage(amount: number, isFrontal: boolean, bypassShield: boolean = false): { actualDamage: number; blocked: boolean; defeated: boolean } {
    if (this.isDefeated) return { actualDamage: 0, blocked: false, defeated: true };
    let blocked = false;
    let actualDamage = amount;

    if (this._shieldRaised && isFrontal && !bypassShield) {
      blocked = true;
      actualDamage = Math.round(amount * 0.2); // Tower shield mitigates 80%
    }

    this._health = Math.max(0, this._health - actualDamage);
    const defeated = this._health === 0;
    if (defeated) this._state = 'DEAD';
    return { actualDamage, blocked, defeated };
  }

  public evaluateAttack(distance: number, isDodging: boolean, isSlash: boolean = false): { hit: boolean; damage: number } {
    if (this.isDefeated || isDodging) return { hit: false, damage: 0 };
    const maxDist = isSlash ? 2.8 : 2.0;
    if (distance <= maxDist) {
      return { hit: true, damage: isSlash ? CaptainVane.SWORD_DAMAGE : CaptainVane.SHIELD_BASH_DAMAGE };
    }
    return { hit: false, damage: 0 };
  }

  public claimRewards(inventory: Inventory, progression: Progression): { claimed: boolean; expAwarded: number } {
    if (!this.isDefeated || this._rewardsClaimed) return { claimed: false, expAwarded: 0 };
    this._rewardsClaimed = true;
    progression.addExp(CaptainVane.EXP_REWARD);
    inventory.addItem({
      id: 'relic_false_verdict',
      name: 'Falso Veredicto',
      description: 'Mandoble inquisitorial arrebatado al Capitán Vane. Desata el Peso de la Conciencia, quebrando escudos enemigos.',
      category: 'relic',
      icon: '⚔️',
      quantity: 1,
      maxQuantity: 1,
      effectType: 'buff_attack',
      effectValue: 35,
      isEquipped: true
    });
    return { claimed: true, expAwarded: CaptainVane.EXP_REWARD };
  }
}

// ============================================================================
// ACT IV BOSS: REX MALPHAS / ALARIC (THE ASTRAL DESPOT)
// ============================================================================
export class RexMalphas {
  public static readonly BASE_MAX_HEALTH = 350;
  public static readonly PHASE2_TRIGGER_HP = 175;
  public static readonly SOLAR_SLASH_DAMAGE = 34;
  public static readonly TIME_WARP_DAMAGE = 45;
  public static readonly EXP_REWARD = 300;

  private _health: number = RexMalphas.BASE_MAX_HEALTH;
  private _maxHealth: number = RexMalphas.BASE_MAX_HEALTH;
  private _phase: 1 | 2 = 1;
  private _state: 'ASTRAL_IDLE' | 'CHASE' | 'SOLAR_COMBO' | 'LEY_DEL_DESEO' | 'STUNNED' | 'DEAD' = 'ASTRAL_IDLE';
  private _rewardsClaimed: boolean = false;

  public get health(): number { return this._health; }
  public get maxHealth(): number { return this._maxHealth; }
  public get phase(): number { return this._phase; }
  public get state(): string { return this._state; }
  public get isDefeated(): boolean { return this._health <= 0 || this._state === 'DEAD'; }

  public setState(newState: 'ASTRAL_IDLE' | 'CHASE' | 'SOLAR_COMBO' | 'LEY_DEL_DESEO' | 'STUNNED' | 'DEAD'): void {
    this._state = newState;
    if (newState === 'DEAD') this._health = 0;
  }

  public takeDamage(amount: number): { actualDamage: number; transitionedToPhase2: boolean; defeated: boolean } {
    if (this.isDefeated) return { actualDamage: 0, transitionedToPhase2: false, defeated: true };
    this._health = Math.max(0, this._health - amount);
    let transitionedToPhase2 = false;

    if (this._phase === 1 && this._health > 0 && this._health <= RexMalphas.PHASE2_TRIGGER_HP) {
      this._phase = 2;
      this._state = 'LEY_DEL_DESEO';
      transitionedToPhase2 = true;
    }

    const defeated = this._health === 0;
    if (defeated) this._state = 'DEAD';
    return { actualDamage: amount, transitionedToPhase2, defeated };
  }

  public evaluateAttack(distance: number, isDodging: boolean, isTimeWarp: boolean = false): { hit: boolean; damage: number } {
    if (this.isDefeated || isDodging) return { hit: false, damage: 0 };
    const maxDist = isTimeWarp ? 4.5 : 2.6;
    if (distance <= maxDist) {
      return { hit: true, damage: isTimeWarp ? RexMalphas.TIME_WARP_DAMAGE : RexMalphas.SOLAR_SLASH_DAMAGE };
    }
    return { hit: false, damage: 0 };
  }

  public claimRewards(inventory: Inventory, progression: Progression): { claimed: boolean; expAwarded: number } {
    if (!this.isDefeated || this._rewardsClaimed) return { claimed: false, expAwarded: 0 };
    this._rewardsClaimed = true;
    progression.addExp(RexMalphas.EXP_REWARD);
    inventory.addItem({
      id: 'relic_golden_mirage',
      name: 'Espejismo de Oro y Humo',
      description: 'Estoque cortesano del Salón de los Espejos. Otorga el Paso Astral, reduciendo el coste de fatiga de esquiva un 35%.',
      category: 'relic',
      icon: '💎',
      quantity: 1,
      maxQuantity: 1,
      effectType: 'relic_dodge_cost',
      effectValue: 35,
      isEquipped: true
    });
    return { claimed: true, expAwarded: RexMalphas.EXP_REWARD };
  }
}

// ============================================================================
// ACT V FINAL TITAN: ASTAROTH (PADRE DE LAS CENIZAS / SOL DEL ABISMO)
// ============================================================================
export class AstarothTitan {
  public static readonly BASE_MAX_HEALTH = 500;
  public static readonly METEOR_DAMAGE = 48;
  public static readonly ABYSSAL_COLLAPSE_DAMAGE = 65;
  public static readonly EXP_REWARD = 500;

  private _health: number = AstarothTitan.BASE_MAX_HEALTH;
  private _maxHealth: number = AstarothTitan.BASE_MAX_HEALTH;
  private _state: 'COSMIC_DAWN' | 'CHASE' | 'METEOR_STORM' | 'BLACK_SUN_BURST' | 'STUNNED' | 'DEAD' = 'COSMIC_DAWN';
  private _rewardsClaimed: boolean = false;

  public get health(): number { return this._health; }
  public get maxHealth(): number { return this._maxHealth; }
  public get state(): string { return this._state; }
  public get isDefeated(): boolean { return this._health <= 0 || this._state === 'DEAD'; }

  public setState(newState: 'COSMIC_DAWN' | 'CHASE' | 'METEOR_STORM' | 'BLACK_SUN_BURST' | 'STUNNED' | 'DEAD'): void {
    this._state = newState;
    if (newState === 'DEAD') this._health = 0;
  }

  public takeDamage(amount: number, withAlbaGris: boolean = false): { actualDamage: number; defeated: boolean } {
    if (this.isDefeated) return { actualDamage: 0, defeated: true };
    // Alba Gris deals 2.0x critical damage to the primordial titan!
    const actualDamage = withAlbaGris ? Math.round(amount * 2.0) : amount;
    this._health = Math.max(0, this._health - actualDamage);
    const defeated = this._health === 0;
    if (defeated) this._state = 'DEAD';
    return { actualDamage, defeated };
  }

  public evaluateAttack(distance: number, isDodging: boolean, isBlackSun: boolean = false): { hit: boolean; damage: number } {
    if (this.isDefeated || isDodging) return { hit: false, damage: 0 };
    const maxDist = isBlackSun ? 5.5 : 3.5;
    if (distance <= maxDist) {
      return { hit: true, damage: isBlackSun ? AstarothTitan.ABYSSAL_COLLAPSE_DAMAGE : AstarothTitan.METEOR_DAMAGE };
    }
    return { hit: false, damage: 0 };
  }

  public claimRewards(inventory: Inventory, progression: Progression): { claimed: boolean; expAwarded: number } {
    if (!this.isDefeated || this._rewardsClaimed) return { claimed: false, expAwarded: 0 };
    this._rewardsClaimed = true;
    progression.addExp(AstarothTitan.EXP_REWARD);
    inventory.addItem({
      id: 'weapon_dawn_grey',
      name: 'Alba Gris (Espada de la Elección)',
      description: 'Espada sagrada biseccionada forjada por Elowen y Thomas. Une la Gota de Luz y el Fuego Negro en perfecta armonía.',
      category: 'relic',
      icon: '✨',
      quantity: 1,
      maxQuantity: 1,
      effectType: 'buff_attack',
      effectValue: 70,
      isEquipped: true
    });
    return { claimed: true, expAwarded: AstarothTitan.EXP_REWARD };
  }
}
