import { describe, it, expect } from 'vitest';
import {
  WORLD_2D,
  computeFacingFlipX,
  computeDepthScale2D,
  clampWorldX2D,
  clampWorldY2D,
  resolveActEnemyClearInfo
} from '../../src/presentation/scenes/SpriteOrientation2D';

describe('2D Sprite Orientation, Depth Scaling, World Bounds & Act Milestones', () => {
  it('orients sprites natively facing RIGHT (+1) toward targets on both left and right', () => {
    // Player is to the RIGHT of the enemy (dx > 0) -> enemy advances RIGHT -> must NOT flipX
    expect(computeFacingFlipX(120, true)).toBe(false);
    // Player walks past enemy to the LEFT (dx < 0) -> enemy chases LEFT -> must flipX = true
    expect(computeFacingFlipX(-95, false)).toBe(true);
    // Player walks past enemy again to the RIGHT (dx > 0) -> enemy flips back to face RIGHT (flipX = false)
    expect(computeFacingFlipX(42, true)).toBe(false);
  });

  it('preserves current facing inside the horizontal deadzone to prevent sprite jitter', () => {
    expect(computeFacingFlipX(2, true, 4)).toBe(true);
    expect(computeFacingFlipX(-3, false, 4)).toBe(false);
    expect(computeFacingFlipX(0, true, 4)).toBe(true);
    expect(computeFacingFlipX(5, true, 4)).toBe(false);
    expect(computeFacingFlipX(-5, false, 4)).toBe(true);
  });

  it('supports nativeFacing = -1 sprites if added in the future', () => {
    expect(computeFacingFlipX(50, false, 4, -1)).toBe(true);
    expect(computeFacingFlipX(-50, true, 4, -1)).toBe(false);
  });

  it('computes smooth 2.5D perspective depth scale across elevated terraces and walkable floor', () => {
    expect(computeDepthScale2D(WORLD_2D.MIN_Y)).toBeCloseTo(0.90, 2);
    expect(computeDepthScale2D(WORLD_2D.MAX_Y)).toBeCloseTo(1.12, 2);
    expect(computeDepthScale2D(260)).toBeCloseTo(1.01, 2);
    expect(computeDepthScale2D(WORLD_2D.ELEVATED_MIN_Y)).toBeCloseTo(0.84, 2);
  });

  it('clamps coordinates across the full 1180px panoramic 2.5D world (never stuck at 605px)', () => {
    expect(clampWorldX2D(950)).toBe(950);
    expect(clampWorldX2D(1120)).toBe(1120);
    expect(clampWorldX2D(1500)).toBe(WORLD_2D.MAX_X);
    expect(clampWorldX2D(-20)).toBe(WORLD_2D.MIN_X);

    expect(clampWorldY2D(185, false)).toBe(WORLD_2D.MIN_Y);
    expect(clampWorldY2D(185, true)).toBe(185);
    expect(clampWorldY2D(400, false)).toBe(WORLD_2D.MAX_Y);
  });

  it('returns canonical act milestones and boss callouts for all 5 acts', () => {
    expect(resolveActEnemyClearInfo(1).bossLabel).toBe('Madre Morwenna');
    expect(resolveActEnemyClearInfo(2).milestoneIds).toContain('act2_coristas');
    expect(resolveActEnemyClearInfo(3).milestoneIds).toContain('act3_vanguard');
    expect(resolveActEnemyClearInfo(4).milestoneIds).toContain('act4_guards');
    expect(resolveActEnemyClearInfo(5).milestoneIds).toContain('act5_abyss');
    expect(resolveActEnemyClearInfo(4).shalemCallout).toContain('Rex Malphas');
    expect(resolveActEnemyClearInfo(5).shalemCallout).toContain('Astaroth');
  });
});
