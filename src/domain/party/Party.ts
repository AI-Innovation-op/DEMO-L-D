import {
  HeroId,
  HeroCombatState,
  HERO_DEFINITIONS,
  createInitialHeroState,
  ActionState
} from './HeroCombatState';

export interface SwitchResult {
  ok: boolean;
  reason?: 'same' | 'unavailable' | 'cooldown' | 'locked-action' | 'dead';
}

export interface SerializedPartyData {
  activeHeroId: HeroId;
  heroes: Record<HeroId, HeroCombatState>;
}

export class Party {
  private activeHeroId: HeroId;
  private heroes: Record<HeroId, HeroCombatState>;
  private nextSwitchAtMs: number = 0;

  constructor(
    initialActiveHero: HeroId = 'thomas',
    bonusHealthProvider?: (id: HeroId) => number
  ) {
    this.activeHeroId = initialActiveHero;
    this.heroes = {
      thomas: createInitialHeroState('thomas', bonusHealthProvider ? bonusHealthProvider('thomas') : 0),
      khaterine: createInitialHeroState('khaterine', bonusHealthProvider ? bonusHealthProvider('khaterine') : 0),
      elowen: createInitialHeroState('elowen', bonusHealthProvider ? bonusHealthProvider('elowen') : 0)
    };
  }

  public getActiveHeroId(): HeroId {
    return this.activeHeroId;
  }

  public getActiveHero(): HeroCombatState {
    return this.heroes[this.activeHeroId];
  }

  public getHero(id: HeroId): HeroCombatState {
    return this.heroes[id];
  }

  public getAllHeroes(): HeroCombatState[] {
    return Object.values(this.heroes);
  }

  public getMaxHealth(id: HeroId, bonusMaxHealth: number = 0): number {
    return HERO_DEFINITIONS[id].baseMaxHealth + bonusMaxHealth;
  }

  public getMaxPosture(id: HeroId): number {
    return HERO_DEFINITIONS[id].baseMaxPosture;
  }

  public canSwitch(target: HeroId, nowMs: number = Date.now()): SwitchResult {
    if (this.activeHeroId === target) {
      return { ok: false, reason: 'same' };
    }

    const targetHero = this.heroes[target];
    if (!targetHero || !targetHero.available) {
      return { ok: false, reason: 'unavailable' };
    }

    if (targetHero.health <= 0) {
      return { ok: false, reason: 'dead' };
    }

    if (nowMs < this.nextSwitchAtMs) {
      return { ok: false, reason: 'cooldown' };
    }

    const currentHero = this.getActiveHero();
    if (['active', 'stunned', 'defeated'].includes(currentHero.action)) {
      return { ok: false, reason: 'locked-action' };
    }

    return { ok: true };
  }

  public switchHero(
    target: HeroId,
    nowMs: number = Date.now(),
    switchCooldownMs: number = 700
  ): boolean {
    const check = this.canSwitch(target, nowMs);
    if (!check.ok) {
      return false;
    }

    // Reset temporary states on previous hero
    const prevHero = this.heroes[this.activeHeroId];
    prevHero.isGuarding = false;
    prevHero.isDodging = false;
    if (prevHero.action !== 'defeated') {
      prevHero.action = 'idle';
    }

    this.activeHeroId = target;
    this.nextSwitchAtMs = nowMs + switchCooldownMs;

    // Reset temporary states on incoming hero (preserving health, posture, isArmed!)
    const nextHero = this.heroes[this.activeHeroId];
    nextHero.isGuarding = false;
    nextHero.isDodging = false;
    if (nextHero.action !== 'defeated') {
      nextHero.action = 'idle';
    }

    return true;
  }

  public applyDamage(
    amount: number,
    postureDamage: number = 0,
    targetId?: HeroId
  ): { defeated: boolean; healthDamage: number; postureDamage: number; postureBroken: boolean } {
    const hero = targetId ? this.heroes[targetId] : this.getActiveHero();
    const effectiveHealthDamage = Math.max(0, amount);
    hero.health = Math.max(0, hero.health - effectiveHealthDamage);

    let postureBroken = false;
    if (postureDamage > 0) {
      const maxPosture = this.getMaxPosture(hero.id);
      hero.posture = Math.min(maxPosture, hero.posture + postureDamage);
      if (hero.posture >= maxPosture) {
        postureBroken = true;
        hero.action = 'stunned';
      }
    }

    const defeated = hero.health <= 0;
    if (defeated) {
      hero.action = 'defeated';
    }

    return {
      defeated,
      healthDamage: effectiveHealthDamage,
      postureDamage,
      postureBroken
    };
  }

  public applyPostureDamage(
    amount: number,
    targetId?: HeroId
  ): { postureBroken: boolean; currentPosture: number } {
    const hero = targetId ? this.heroes[targetId] : this.getActiveHero();
    const maxPosture = this.getMaxPosture(hero.id);
    hero.posture = Math.min(maxPosture, hero.posture + Math.max(0, amount));
    const postureBroken = hero.posture >= maxPosture;
    if (postureBroken) {
      hero.action = 'stunned';
    }
    return { postureBroken, currentPosture: hero.posture };
  }

  public heal(amount: number, targetId?: HeroId, bonusMaxHealth: number = 0): number {
    const hero = targetId ? this.heroes[targetId] : this.getActiveHero();
    const maxHealth = this.getMaxHealth(hero.id, bonusMaxHealth);
    const prevHealth = hero.health;
    hero.health = Math.min(maxHealth, hero.health + Math.max(0, amount));
    return hero.health - prevHealth;
  }

  public restorePosture(amount: number, targetId?: HeroId): number {
    const hero = targetId ? this.heroes[targetId] : this.getActiveHero();
    const prevPosture = hero.posture;
    hero.posture = Math.max(0, hero.posture - Math.max(0, amount));
    return prevPosture - hero.posture;
  }

  public setArmed(armed: boolean, targetId?: HeroId): void {
    const hero = targetId ? this.heroes[targetId] : this.getActiveHero();
    hero.isArmed = armed;
  }

  public setGuarding(guarding: boolean, targetId?: HeroId): void {
    const hero = targetId ? this.heroes[targetId] : this.getActiveHero();
    hero.isGuarding = guarding;
    hero.action = guarding ? 'guarding' : 'idle';
  }

  public setDodging(dodging: boolean, targetId?: HeroId): void {
    const hero = targetId ? this.heroes[targetId] : this.getActiveHero();
    hero.isDodging = dodging;
    hero.action = dodging ? 'dodging' : 'idle';
  }

  public setAction(action: ActionState, targetId?: HeroId): void {
    const hero = targetId ? this.heroes[targetId] : this.getActiveHero();
    hero.action = action;
  }

  public restoreFullSanctuary(bonusHealthProvider?: (id: HeroId) => number): void {
    for (const id of ['thomas', 'khaterine'] as HeroId[]) {
      const hero = this.heroes[id];
      const bonus = bonusHealthProvider ? bonusHealthProvider(id) : 0;
      hero.health = this.getMaxHealth(id, bonus);
      hero.posture = 0;
      hero.action = 'idle';
      hero.isGuarding = false;
      hero.isDodging = false;
    }
  }

  public reviveHeroAtCheckpoint(id: HeroId, bonusMaxHealth: number = 0): void {
    const hero = this.heroes[id];
    hero.health = this.getMaxHealth(id, bonusMaxHealth);
    hero.posture = 0;
    hero.action = 'idle';
    hero.isGuarding = false;
    hero.isDodging = false;
  }

  public isPartyDefeated(): boolean {
    return this.heroes.thomas.health <= 0 && this.heroes.khaterine.health <= 0;
  }

  public serialize(): SerializedPartyData {
    return {
      activeHeroId: this.activeHeroId,
      heroes: JSON.parse(JSON.stringify(this.heroes))
    };
  }

  public deserialize(data: Partial<SerializedPartyData>): void {
    if (data.activeHeroId && (data.activeHeroId === 'thomas' || data.activeHeroId === 'khaterine')) {
      this.activeHeroId = data.activeHeroId;
    }
    if (data.heroes) {
      for (const id of ['thomas', 'khaterine', 'elowen'] as HeroId[]) {
        if (data.heroes[id]) {
          const incoming = data.heroes[id];
          const target = this.heroes[id];
          if (typeof incoming.health === 'number' && Number.isFinite(incoming.health)) {
            target.health = incoming.health;
          }
          if (typeof incoming.posture === 'number' && Number.isFinite(incoming.posture)) {
            target.posture = incoming.posture;
          }
          if (typeof incoming.isArmed === 'boolean') {
            target.isArmed = incoming.isArmed;
          }
          if (typeof incoming.available === 'boolean') {
            target.available = incoming.available;
          }
        }
      }
    }
  }
}
