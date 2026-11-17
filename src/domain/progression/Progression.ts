import { SkillNode, INITIAL_SKILLS, HeroType } from './Skill';

export interface UnlockResult {
  success: boolean;
  message: string;
  skill?: SkillNode;
}

export class Progression {
  private currentExp: number = 0;
  private totalExpEarned: number = 0;
  private skills: Map<string, SkillNode> = new Map();

  constructor(initialExp: number = 0, customSkills?: SkillNode[]) {
    this.currentExp = initialExp;
    this.totalExpEarned = initialExp;

    const sourceSkills = customSkills || INITIAL_SKILLS;
    sourceSkills.forEach(s => {
      this.skills.set(s.id, { ...s });
    });
  }

  public static createDefault(): Progression {
    return new Progression(50); // Starts with 50 initial EXP to try unlocking right away!
  }

  public getExp(): number {
    return this.currentExp;
  }

  public getTotalExpEarned(): number {
    return this.totalExpEarned;
  }

  public addExp(amount: number): number {
    if (amount <= 0) return this.currentExp;
    this.currentExp += amount;
    this.totalExpEarned += amount;
    return this.currentExp;
  }

  public getSkills(): SkillNode[] {
    return Array.from(this.skills.values());
  }

  public getSkillsForHero(hero: HeroType): SkillNode[] {
    return Array.from(this.skills.values()).filter(s => s.hero === hero || s.hero === 'shared');
  }

  public getSkill(skillId: string): SkillNode | undefined {
    return this.skills.get(skillId);
  }

  public isSkillUnlocked(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    return skill ? skill.isUnlocked : false;
  }

  public unlockSkill(skillId: string): UnlockResult {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return { success: false, message: 'La habilidad no existe en el códice.' };
    }

    if (skill.isUnlocked) {
      return { success: false, message: 'Esta bendición ya ha sido consagrada.' };
    }

    if (skill.requiredSkillId) {
      const parent = this.skills.get(skill.requiredSkillId);
      if (!parent || !parent.isUnlocked) {
        return {
          success: false,
          message: `Requiere desbloquear primero: ${parent?.name || skill.requiredSkillId}.`
        };
      }
    }

    if (this.currentExp < skill.cost) {
      const missing = skill.cost - this.currentExp;
      return {
        success: false,
        message: `EXP insuficiente. Necesitas ${skill.cost} EXP (te faltan ${missing} EXP).`
      };
    }

    this.currentExp -= skill.cost;
    skill.isUnlocked = true;

    return {
      success: true,
      message: `¡Habilidad consagrada: ${skill.name}!`,
      skill
    };
  }

  public getDamageBonusPct(hero: HeroType): number {
    let bonus = 0;
    this.skills.forEach(s => {
      if (s.isUnlocked && (s.hero === hero || s.hero === 'shared')) {
        if (s.modifierType === 'damage_bonus_pct') {
          bonus += s.modifierValue;
        }
      }
    });
    return bonus;
  }

  public getMaxHealthBonus(hero: HeroType): number {
    let bonus = 0;
    this.skills.forEach(s => {
      if (s.isUnlocked && (s.hero === hero || s.hero === 'shared')) {
        if (s.modifierType === 'max_health_bonus') {
          bonus += s.modifierValue;
        }
      }
    });
    return bonus;
  }

  public getArrowDamageBonusPct(): number {
    let bonus = 0;
    this.skills.forEach(s => {
      if (s.isUnlocked && s.modifierType === 'arrow_damage_pct') {
        bonus += s.modifierValue;
      }
    });
    return bonus;
  }

  public getDodgeDistanceBonusPct(): number {
    let bonus = 0;
    this.skills.forEach(s => {
      if (s.isUnlocked && s.modifierType === 'dodge_distance_pct') {
        bonus += s.modifierValue;
      }
    });
    return bonus;
  }

  public toJSON(): object {
    return {
      currentExp: this.currentExp,
      totalExpEarned: this.totalExpEarned,
      skills: Array.from(this.skills.values())
    };
  }

  public static fromJSON(data: { currentExp?: number; totalExpEarned?: number; skills?: SkillNode[] }): Progression {
    const prog = new Progression(data.currentExp || 0, data.skills);
    if (data.totalExpEarned !== undefined) {
      prog.totalExpEarned = data.totalExpEarned;
    }
    return prog;
  }
}
