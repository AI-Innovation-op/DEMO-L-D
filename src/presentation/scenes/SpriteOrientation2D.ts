/**
 * Pure orientation, depth-scaling, world-bounds, and act-progression helpers
 * for the 2.5D Phaser mode of The Light in the Darkness.
 *
 * Visual Pack Convention (verified directly against public/assets/ PNG sprite sheets):
 * All 65 animation sheets (heroes, companions, NPCs, enemies, bosses) and directional VFX
 * are authored facing RIGHT (+1). Therefore:
 *   - Moving/facing RIGHT (dx > 0) => flipX = false
 *   - Moving/facing LEFT  (dx < 0) => flipX = true
 */

export const WORLD_2D = {
  WIDTH: 1180,
  HEIGHT: 360,
  VIEWPORT_WIDTH: 640,
  VIEWPORT_HEIGHT: 360,
  MIN_X: 35,
  MAX_X: 1145,
  MIN_Y: 205,
  MAX_Y: 315,
  ELEVATED_MIN_Y: 178,
  HORIZON_Y: 202
} as const;

/**
 * Computes Phaser's `flipX` boolean so a sprite always faces toward `dx`
 * without rapid left/right flickering when `|dx| <= deadzone`.
 *
 * @param dx Target X minus Entity X (or horizontal velocity vx).
 * @param currentFlipX Current sprite `flipX` preserved inside the deadzone.
 * @param deadzone Minimum horizontal delta (px) required to change facing.
 * @param nativeFacing Native facing direction of the source art (`1` = faces right, `-1` = faces left).
 */
export function computeFacingFlipX(
  dx: number,
  currentFlipX: boolean,
  deadzone: number = 4,
  nativeFacing: 1 | -1 = 1
): boolean {
  if (Math.abs(dx) <= deadzone) {
    return currentFlipX;
  }
  const wantsLeft = dx < 0;
  return nativeFacing === 1 ? wantsLeft : !wantsLeft;
}

/**
 * Computes the 2.5D perspective scale factor for a given Y floor coordinate.
 * Walkable plane [205..315] maps smoothly from 0.90 to 1.12;
 * elevated terraces [178..205] taper subtly to 0.84..0.90.
 */
export function computeDepthScale2D(
  y: number,
  minY: number = WORLD_2D.MIN_Y,
  maxY: number = WORLD_2D.MAX_Y
): number {
  if (y < minY) {
    const elevatedT = Math.max(0, Math.min(1, (y - WORLD_2D.ELEVATED_MIN_Y) / Math.max(1, minY - WORLD_2D.ELEVATED_MIN_Y)));
    return 0.84 + elevatedT * 0.06;
  }
  const t = Math.max(0, Math.min(1, (y - minY) / Math.max(1, maxY - minY)));
  return 0.90 + t * 0.22;
}

/** Clamps any world X coordinate safely inside the 1180px 2.5D panoramic arena. */
export function clampWorldX2D(x: number, margin: number = WORLD_2D.MIN_X): number {
  const minX = Math.max(0, margin);
  const maxX = Math.max(minX, WORLD_2D.WIDTH - margin);
  return Math.max(minX, Math.min(maxX, x));
}

/** Clamps any walkable Y coordinate safely inside the 2.5D belt-scroll depth plane. */
export function clampWorldY2D(y: number, allowElevated: boolean = false): number {
  const minY = allowElevated ? WORLD_2D.ELEVATED_MIN_Y : WORLD_2D.MIN_Y;
  return Math.max(minY, Math.min(WORLD_2D.MAX_Y, y));
}

export interface ActEnemyClearInfo {
  milestoneIds: string[];
  bossLabel: string;
  shalemCallout: string;
}

/** Returns canonical milestones and Shalem's callout when an act's vanguard enemies are defeated. */
export function resolveActEnemyClearInfo(scenarioIndex: number): ActEnemyClearInfo {
  switch (scenarioIndex) {
    case 1:
      return {
        milestoneIds: ['act1_monks', 'act1_beast'],
        bossLabel: 'Madre Morwenna',
        shalemCallout:
          'Shalem: «¡Los acechadores han caído! ¡Ahora enfrenta a Madre Morwenna junto a la Gran Pira!»'
      };
    case 2:
      return {
        milestoneIds: ['act2_coristas'],
        bossLabel: 'el Guardián del Crisol',
        shalemCallout:
          'Shalem: «¡Las coristas de azufre han caído! ¡Lanza tu espada [T] o quiebra al Guardián del Crisol!»'
      };
    case 3:
      return {
        milestoneIds: ['act3_vanguard'],
        bossLabel: 'el Capitán Áureo Vane',
        shalemCallout:
          'Shalem: «¡La vanguardia del puente ha caído! ¡Rompe el escudo del Capitán Áureo Vane con [K] o Parry [L]!»'
      };
    case 4:
      return {
        milestoneIds: ['act4_guards'],
        bossLabel: 'Rex Malphas',
        shalemCallout:
          'Shalem: «¡Los guardias áureos han caído! ¡Destruye los braseros dorados y derriba a Rex Malphas!»'
      };
    default:
      return {
        milestoneIds: ['act5_abyss'],
        bossLabel: 'Astaroth',
        shalemCallout:
          'Shalem: «¡Las sombras del vacío han sido purgadas! ¡Habla con Elowen para forjar Alba Gris y vence a Astaroth!»'
      };
  }
}
