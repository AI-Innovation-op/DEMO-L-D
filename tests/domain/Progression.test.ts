import { describe, it, expect } from 'vitest';
import { Progression } from '../../src/domain/progression/Progression';

describe('Progression & Skill Tree Domain', () => {
  it('should initialize with default EXP and all initial skills locked', () => {
    const prog = Progression.createDefault();
    expect(prog.getExp()).toBe(50);
    expect(prog.getTotalExpEarned()).toBe(50);

    const skills = prog.getSkills();
    expect(skills.length).toBeGreaterThanOrEqual(6);
    expect(skills.every(s => !s.isUnlocked)).toBe(true);
  });

  it('should add EXP correctly', () => {
    const prog = new Progression(10);
    prog.addExp(40);
    expect(prog.getExp()).toBe(50);
    expect(prog.getTotalExpEarned()).toBe(50);

    // Negative EXP should be ignored
    prog.addExp(-10);
    expect(prog.getExp()).toBe(50);
  });

  it('should unlock basic skill when enough EXP is available', () => {
    const prog = new Progression(50);
    const result = prog.unlockSkill('thomas_shield_strike'); // Cost 40
    expect(result.success).toBe(true);
    expect(prog.getExp()).toBe(10);
    expect(prog.isSkillUnlocked('thomas_shield_strike')).toBe(true);
  });

  it('should prevent unlocking when EXP is insufficient', () => {
    const prog = new Progression(20);
    const result = prog.unlockSkill('thomas_shield_strike'); // Cost 40
    expect(result.success).toBe(false);
    expect(result.message).toContain('EXP insuficiente');
    expect(prog.isSkillUnlocked('thomas_shield_strike')).toBe(false);
  });

  it('should enforce prerequisite skills in skill tree', () => {
    const prog = new Progression(200);
    // thomas_blade_mastery requires thomas_shield_strike
    const lockedResult = prog.unlockSkill('thomas_blade_mastery');
    expect(lockedResult.success).toBe(false);
    expect(lockedResult.message).toContain('Requiere desbloquear primero');

    // Unlock prerequisite first
    prog.unlockSkill('thomas_shield_strike');
    const successResult = prog.unlockSkill('thomas_blade_mastery');
    expect(successResult.success).toBe(true);
    expect(prog.isSkillUnlocked('thomas_blade_mastery')).toBe(true);
  });

  it('should calculate modifier bonuses correctly', () => {
    const prog = new Progression(300);
    prog.unlockSkill('khaterine_piercing_arrow'); // +25% arrow dmg
    expect(prog.getArrowDamageBonusPct()).toBe(25);

    prog.unlockSkill('khaterine_shadow_step'); // +30% dodge distance
    expect(prog.getDodgeDistanceBonusPct()).toBe(30);
  });

  it('should serialize and restore progression from JSON', () => {
    const prog = new Progression(120);
    prog.unlockSkill('thomas_shield_strike');

    const json = prog.toJSON() as { currentExp: number; totalExpEarned: number; skills: any[] };
    const restored = Progression.fromJSON(json);

    expect(restored.getExp()).toBe(80);
    expect(restored.isSkillUnlocked('thomas_shield_strike')).toBe(true);
    expect(restored.isSkillUnlocked('thomas_blade_mastery')).toBe(false);
  });
});
