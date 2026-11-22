import * as THREE from 'three';
import { GothicMaterialLibrary3D } from './GothicMaterialLibrary3D';

export type ArticulatedRigArchetype3D =
  | 'thomas'
  | 'khaterine'
  | 'cultist'
  | 'zealot'
  | 'skeleton'
  | 'morwenna'
  | 'inquisitor'
  | 'crucible_guardian'
  | 'captain_vane'
  | 'rex_malphas'
  | 'bridge_guard'
  | 'martin_ally'
  | 'tobias_ally';

export type LowerBodyState3D = 'idle' | 'walk' | 'run' | 'dodge' | 'hurt' | 'death';
export type UpperBodyState3D =
  | 'none'
  | 'slash_light'
  | 'slash_heavy'
  | 'unarmed_punch'
  | 'shoot_light'
  | 'shoot_heavy'
  | 'guard'
  | 'ward'
  | 'throw_sword'
  | 'cast_heal';

export type ClipEventType3D = 'footLeft' | 'footRight' | 'weaponContact' | 'actionComplete';

export interface RigUpdateInput3D {
  delta: number;
  elapsedTime: number;
  planarSpeed: number;
  isMoving: boolean;
  isDodging: boolean;
  isGuarding: boolean;
  isAttacking: boolean;
  isHeavyAttack: boolean;
  isArmed: boolean;
  isDefeated: boolean;
  aimYawOffset?: number;
  windSway?: number;
  comboStep?: number;
}

interface ArchetypeStyleConfig {
  primaryColor: number;
  trimColor: number;
  armorColor: number;
  skinColor: number;
  hairColor: number;
  eyeColor: number;
  runeColor: number;
  scale: number;
  headgear: 'hair' | 'hood' | 'helm' | 'crown' | 'thorns';
  usesBow: boolean;
}

const ARCHETYPE_STYLES: Record<ArticulatedRigArchetype3D, ArchetypeStyleConfig> = {
  thomas: {
    primaryColor: 0x261d30,
    trimColor: 0x4c2a59,
    armorColor: 0x8d889c,
    skinColor: 0xdcb691,
    hairColor: 0x3a2416,
    eyeColor: 0x3b2314,
    runeColor: 0x9933ff,
    scale: 1.0,
    headgear: 'hair',
    usesBow: false
  },
  khaterine: {
    primaryColor: 0x1e112b,
    trimColor: 0x3b184f,
    armorColor: 0x6a5578,
    skinColor: 0xe8cfc0,
    hairColor: 0x140f1c,
    eyeColor: 0xd580ff,
    runeColor: 0xd580ff,
    scale: 0.98,
    headgear: 'hood',
    usesBow: true
  },
  cultist: {
    primaryColor: 0x22162e,
    trimColor: 0x4a1d1f,
    armorColor: 0x7c532c,
    skinColor: 0xc9bdb3,
    hairColor: 0x1a141c,
    eyeColor: 0xff6622,
    runeColor: 0xff6622,
    scale: 1.02,
    headgear: 'hood',
    usesBow: false
  },
  zealot: {
    primaryColor: 0x3d1015,
    trimColor: 0x611920,
    armorColor: 0x6a6a78,
    skinColor: 0xd4c2b2,
    hairColor: 0x2a1a18,
    eyeColor: 0xff2233,
    runeColor: 0xff2233,
    scale: 1.08,
    headgear: 'hood',
    usesBow: false
  },
  skeleton: {
    primaryColor: 0x1c2530,
    trimColor: 0x2b3d4a,
    armorColor: 0x5c6873,
    skinColor: 0xd8d2c5,
    hairColor: 0xc5bfb2,
    eyeColor: 0x00e5ff,
    runeColor: 0x00e5ff,
    scale: 1.05,
    headgear: 'helm',
    usesBow: false
  },
  morwenna: {
    primaryColor: 0x3b101c,
    trimColor: 0x7a1c28,
    armorColor: 0xb8860b,
    skinColor: 0xe6d4c8,
    hairColor: 0x24161a,
    eyeColor: 0xff5511,
    runeColor: 0xff4400,
    scale: 1.22,
    headgear: 'thorns',
    usesBow: false
  },
  inquisitor: {
    primaryColor: 0x26122e,
    trimColor: 0x541e66,
    armorColor: 0x7a6885,
    skinColor: 0xc9b8c8,
    hairColor: 0x1c1222,
    eyeColor: 0xbb55ff,
    runeColor: 0x9b59b6,
    scale: 1.18,
    headgear: 'helm',
    usesBow: false
  },
  crucible_guardian: {
    primaryColor: 0x2e1e14,
    trimColor: 0x6e4726,
    armorColor: 0x8c5a2b,
    skinColor: 0x3a2a22,
    hairColor: 0x221612,
    eyeColor: 0xff5500,
    runeColor: 0xff5500,
    scale: 1.32,
    headgear: 'helm',
    usesBow: false
  },
  captain_vane: {
    primaryColor: 0xf0ead6,
    trimColor: 0xd4af37,
    armorColor: 0xd4af37,
    skinColor: 0xdfc2a4,
    hairColor: 0x5c4228,
    eyeColor: 0xffea77,
    runeColor: 0xffd700,
    scale: 1.24,
    headgear: 'helm',
    usesBow: false
  },
  rex_malphas: {
    primaryColor: 0x3a1452,
    trimColor: 0x800018,
    armorColor: 0xd4af37,
    skinColor: 0xdec0a8,
    hairColor: 0x2c1b12,
    eyeColor: 0xcc66ff,
    runeColor: 0xcc44ff,
    scale: 1.26,
    headgear: 'crown',
    usesBow: false
  },
  bridge_guard: {
    primaryColor: 0x423318,
    trimColor: 0xb8860b,
    armorColor: 0xd4af37,
    skinColor: 0xd6b898,
    hairColor: 0x2b1e14,
    eyeColor: 0xffdd55,
    runeColor: 0xffd700,
    scale: 1.05,
    headgear: 'helm',
    usesBow: false
  },
  martin_ally: {
    primaryColor: 0x2f3b28,
    trimColor: 0x5c4429,
    armorColor: 0x7c7c88,
    skinColor: 0xd9b38c,
    hairColor: 0x4a3220,
    eyeColor: 0x3b2314,
    runeColor: 0x88ffaa,
    scale: 0.98,
    headgear: 'hair',
    usesBow: false
  },
  tobias_ally: {
    primaryColor: 0x3d2e22,
    trimColor: 0x2e4a38,
    armorColor: 0x6e6a64,
    skinColor: 0xd4aa82,
    hairColor: 0x2e1f14,
    eyeColor: 0x3b2314,
    runeColor: 0x88ffaa,
    scale: 1.02,
    headgear: 'hair',
    usesBow: false
  }
};

export interface GothicHeroRigNodes {
  root: THREE.Group;
  pelvis: THREE.Group;
  torso: THREE.Group;
  headGroup: THREE.Group;
  capeGroup: THREE.Group;
  shoulderL: THREE.Group;
  forearmL: THREE.Group;
  shoulderR: THREE.Group;
  forearmR: THREE.Group;
  weaponSocketR: THREE.Group;
  weaponSocketL: THREE.Group;
  hipL: THREE.Group;
  shinL: THREE.Group;
  hipR: THREE.Group;
  shinR: THREE.Group;
}

/**
 * OpenLara & Vice City inspired Hierarchical 3D Articulated Character Rig (`CharacterMotionView`).
 *
 * Implements:
 * - Articulated pelvis, torso, head, cape/veil, upper arms, forearms, weapon sockets, thighs, shins, and boots.
 * - Independent Lower-Body locomotion layer (stride-calibrated to planar velocity so feet never skate)
 *   and Upper-Body combat/interaction layer (sword slashes, unarmed strikes, bow draw, guard/ward).
 * - Single-fire `ClipEvent` emission on normalized cycle crossings (`footLeft`, `footRight`, `weaponContact`).
 */
export class GothicArticulatedRig3D {
  public readonly heroId: ArticulatedRigArchetype3D;
  public readonly nodes: GothicHeroRigNodes;
  private readonly style: ArchetypeStyleConfig;

  private stridePhase: number = 0;
  private prevStrideSin: number = 0;
  private upperTimer: number = 0;
  private upperDuration: number = 0.3;
  private currentLowerState: LowerBodyState3D = 'idle';
  private currentUpperState: UpperBodyState3D = 'none';
  private lastComboStep: number = 0;
  private emittedWeaponContact: boolean = false;
  private eventListeners: Array<(event: ClipEventType3D) => void> = [];

  // Reference stride length (meters per full step cycle)
  private readonly strideLength: number = 1.65;

  constructor(heroId: ArticulatedRigArchetype3D) {
    this.heroId = heroId;
    this.style = ARCHETYPE_STYLES[heroId] || ARCHETYPE_STYLES.thomas;
    this.nodes = this.buildArticulatedHierarchy();
  }

  public onClipEvent(listener: (event: ClipEventType3D) => void): void {
    this.eventListeners.push(listener);
  }

  private emit(event: ClipEventType3D): void {
    for (const fn of this.eventListeners) {
      fn(event);
    }
  }

  public getLowerState(): LowerBodyState3D {
    return this.currentLowerState;
  }

  public getUpperState(): UpperBodyState3D {
    return this.currentUpperState;
  }

  private buildArticulatedHierarchy(): GothicHeroRigNodes {
    const root = new THREE.Group();
    root.name = `gothic_rig_${this.heroId}`;
    root.scale.setScalar(this.style.scale);

    const isSlender = this.heroId === 'khaterine' || this.heroId === 'morwenna';

    const clothBump = GothicMaterialLibrary3D.getSurfaceTexture('woven_cloth');
    const metalBump = GothicMaterialLibrary3D.getSurfaceTexture('forged_metal');

    // Shared Gothic PBR Materials with procedural weave & hammered-metal bump relief
    const primaryClothMat = new THREE.MeshStandardMaterial({
      color: this.style.primaryColor,
      roughness: 0.72,
      metalness: 0.18,
      ...(clothBump ? { bumpMap: clothBump, bumpScale: 0.035 } : {})
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: this.style.trimColor,
      roughness: 0.58,
      metalness: 0.28,
      side: THREE.DoubleSide,
      ...(clothBump ? { bumpMap: clothBump, bumpScale: 0.03 } : {})
    });
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x3b2618,
      roughness: 0.72,
      metalness: 0.15,
      ...(clothBump ? { bumpMap: clothBump, bumpScale: 0.025 } : {})
    });
    const metalArmorMat = new THREE.MeshStandardMaterial({
      color: this.style.armorColor,
      roughness: 0.32,
      metalness: 0.85,
      ...(metalBump ? { bumpMap: metalBump, bumpScale: 0.045 } : {})
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: this.style.skinColor,
      roughness: 0.55
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: this.style.hairColor,
      roughness: 0.88
    });
    const runeGlowMat = new THREE.MeshBasicMaterial({
      color: this.style.runeColor
    });
    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.85,
      ...(metalBump ? { bumpMap: metalBump, bumpScale: 0.04 } : {})
    });

    // 1. PELVIS ROOT (y = 0.88m)
    const pelvis = new THREE.Group();
    pelvis.position.set(0, 0.88, 0);
    root.add(pelvis);

    const pelvisMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.27, 0.24, 10),
      leatherMat
    );
    pelvisMesh.castShadow = true;
    pelvis.add(pelvisMesh);

    // Belt buckle
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.06), goldAccentMat);
    buckle.position.set(0, 0, 0.25);
    pelvis.add(buckle);

    // Tunic / Robe lower skirt flaps around pelvis (16-segment pleated gothic silhouette)
    const skirtGeo = new THREE.CylinderGeometry(0.25, isSlender ? 0.45 : 0.39, isSlender ? 0.54 : 0.42, 16, 1, true);
    const skirtMat = new THREE.MeshStandardMaterial({
      color: this.style.primaryColor,
      roughness: 0.78,
      side: THREE.DoubleSide,
      ...(clothBump ? { bumpMap: clothBump, bumpScale: 0.04 } : {})
    });
    const skirt = new THREE.Mesh(skirtGeo, skirtMat);
    skirt.position.y = isSlender ? -0.24 : -0.18;
    skirt.castShadow = true;
    pelvis.add(skirt);

    // 2. TORSO (child of pelvis, pivots at waist y = +0.10m)
    const torso = new THREE.Group();
    torso.position.set(0, 0.1, 0);
    pelvis.add(torso);

    const chestMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(isSlender ? 0.23 : 0.27, 0.22, 0.56, 16),
      primaryClothMat
    );
    chestMesh.position.y = 0.28;
    chestMesh.castShadow = true;
    torso.add(chestMesh);

    // Pauldrons / Shoulder Guards
    [-0.31, 0.31].forEach(sideX => {
      const pauldron = new THREE.Mesh(
        new THREE.SphereGeometry(0.145, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
        isSlender ? trimMat : metalArmorMat
      );
      pauldron.position.set(sideX, 0.52, 0);
      pauldron.rotation.z = sideX < 0 ? 0.35 : -0.35;
      pauldron.castShadow = true;
      torso.add(pauldron);
    });

    // Glowing Sigil on Chest
    const sigilRing = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.11, 16), runeGlowMat);
    sigilRing.position.set(0, 0.34, isSlender ? 0.235 : 0.265);
    torso.add(sigilRing);

    // 3. FLOWING DRAPED GOTHIC CAPE / VEIL (curved cylindrical mantle instead of flat box)
    const capeGroup = new THREE.Group();
    capeGroup.position.set(0, 0.52, -0.15);
    torso.add(capeGroup);

    const capeGeo = new THREE.CylinderGeometry(
      isSlender ? 0.24 : 0.27,
      isSlender ? 0.44 : 0.48,
      isSlender ? 1.02 : 0.88,
      14,
      1,
      true,
      Math.PI * 0.65,
      Math.PI * 0.7
    );
    const capeMesh = new THREE.Mesh(capeGeo, trimMat);
    capeMesh.position.set(0, isSlender ? -0.48 : -0.42, 0.12);
    capeMesh.rotation.x = 0.14;
    capeMesh.castShadow = true;
    capeGroup.add(capeMesh);

    // Collar / Scarf around neck
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.065, 8, 12), trimMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.56, 0);
    torso.add(collar);

    // 4. HEAD GROUP (pivots at neck y = +0.62m above waist)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.62, 0);
    torso.add(headGroup);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(isSlender ? 0.195 : 0.21, 12, 12), skinMat);
    headMesh.position.y = 0.18;
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: this.style.eyeColor });
    [-0.07, 0.07].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), eyeMat);
      eye.position.set(ex, 0.19, isSlender ? 0.172 : 0.185);
      headGroup.add(eye);
    });

    // Headgear by Archetype (hair, hood, helm, crown, thorns)
    const hairCrown = new THREE.Mesh(
      new THREE.SphereGeometry(isSlender ? 0.215 : 0.225, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.72),
      hairMat
    );
    hairCrown.position.set(0, 0.21, -0.02);
    hairCrown.rotation.x = -0.35;
    headGroup.add(hairCrown);

    if (this.style.headgear === 'hood') {
      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.44, 8), trimMat);
      hood.position.set(0, 0.24, -0.06);
      hood.rotation.x = -0.25;
      headGroup.add(hood);
    } else if (this.style.headgear === 'helm') {
      const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.42, 8), metalArmorMat);
      helm.position.set(0, 0.21, 0);
      headGroup.add(helm);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.04), runeGlowMat);
      visor.position.set(0, 0.2, 0.22);
      headGroup.add(visor);
    } else if (this.style.headgear === 'crown') {
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.21, 0.22, 6), goldAccentMat);
      crown.position.set(0, 0.36, 0);
      headGroup.add(crown);
    } else if (this.style.headgear === 'thorns') {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 6, 12), runeGlowMat);
      halo.position.set(0, 0.34, -0.04);
      halo.rotation.x = Math.PI * 0.35;
      headGroup.add(halo);
    }

    // 5. LEFT ARM (Shoulder -> Upper Arm -> Forearm -> WeaponSocketL)
    const shoulderL = new THREE.Group();
    shoulderL.position.set(-0.32, 0.48, 0);
    torso.add(shoulderL);

    const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.3, 8), primaryClothMat);
    upperArmL.position.y = -0.14;
    upperArmL.castShadow = true;
    shoulderL.add(upperArmL);

    const forearmL = new THREE.Group();
    forearmL.position.set(0, -0.28, 0);
    shoulderL.add(forearmL);

    const forearmMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.28, 8), leatherMat);
    forearmMeshL.position.y = -0.13;
    forearmMeshL.castShadow = true;
    forearmL.add(forearmMeshL);

    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skinMat);
    handL.position.y = -0.27;
    forearmL.add(handL);

    const weaponSocketL = new THREE.Group();
    weaponSocketL.position.set(0, -0.27, 0.04);
    forearmL.add(weaponSocketL);

    // 6. RIGHT ARM (Shoulder -> Upper Arm -> Forearm -> WeaponSocketR)
    const shoulderR = new THREE.Group();
    shoulderR.position.set(0.32, 0.48, 0);
    torso.add(shoulderR);

    const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.3, 8), primaryClothMat);
    upperArmR.position.y = -0.14;
    upperArmR.castShadow = true;
    shoulderR.add(upperArmR);

    const forearmR = new THREE.Group();
    forearmR.position.set(0, -0.28, 0);
    shoulderR.add(forearmR);

    const forearmMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.28, 8), leatherMat);
    forearmMeshR.position.y = -0.13;
    forearmMeshR.castShadow = true;
    forearmR.add(forearmMeshR);

    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skinMat);
    handR.position.y = -0.27;
    forearmR.add(handR);

    const weaponSocketR = new THREE.Group();
    weaponSocketR.position.set(0, -0.27, 0.05);
    forearmR.add(weaponSocketR);

    // 7. LEFT LEG (Hip -> Thigh -> Shin -> Boot)
    const hipL = new THREE.Group();
    hipL.position.set(-0.13, -0.06, 0);
    pelvis.add(hipL);

    const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.42, 8), primaryClothMat);
    thighL.position.y = -0.2;
    thighL.castShadow = true;
    hipL.add(thighL);

    const shinL = new THREE.Group();
    shinL.position.set(0, -0.4, 0);
    hipL.add(shinL);

    const shinMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.065, 0.4, 8), leatherMat);
    shinMeshL.position.y = -0.19;
    shinMeshL.castShadow = true;
    shinL.add(shinMeshL);

    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.24), leatherMat);
    bootL.position.set(0, -0.39, 0.05);
    bootL.castShadow = true;
    shinL.add(bootL);

    // 8. RIGHT LEG (Hip -> Thigh -> Shin -> Boot)
    const hipR = new THREE.Group();
    hipR.position.set(0.13, -0.06, 0);
    pelvis.add(hipR);

    const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.42, 8), primaryClothMat);
    thighR.position.y = -0.2;
    thighR.castShadow = true;
    hipR.add(thighR);

    const shinR = new THREE.Group();
    shinR.position.set(0, -0.4, 0);
    hipR.add(shinR);

    const shinMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.065, 0.4, 8), leatherMat);
    shinMeshR.position.y = -0.19;
    shinMeshR.castShadow = true;
    shinR.add(shinMeshR);

    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.24), leatherMat);
    bootR.position.set(0, -0.39, 0.05);
    bootR.castShadow = true;
    shinR.add(bootR);

    return {
      root,
      pelvis,
      torso,
      headGroup,
      capeGroup,
      shoulderL,
      forearmL,
      shoulderR,
      forearmR,
      weaponSocketR,
      weaponSocketL,
      hipL,
      shinL,
      hipR,
      shinR
    };
  }

  /**
   * Updates both Lower-Body locomotion and Upper-Body combat layers every frame.
   */
  public update(input: RigUpdateInput3D): void {
    const {
      delta,
      elapsedTime,
      planarSpeed,
      isMoving,
      isDodging,
      isGuarding,
      isAttacking,
      isHeavyAttack,
      isArmed,
      isDefeated,
      aimYawOffset = 0,
      windSway = 0,
      comboStep = 1
    } = input;

    const n = this.nodes;

    if (isDefeated) {
      this.currentLowerState = 'death';
      n.pelvis.position.y = THREE.MathUtils.lerp(n.pelvis.position.y, 0.25, delta * 8);
      n.pelvis.rotation.x = THREE.MathUtils.lerp(n.pelvis.rotation.x, -1.35, delta * 8);
      return;
    }

    // Apply lateral bridge wind to flowing cape/veil
    n.capeGroup.rotation.z = THREE.MathUtils.lerp(
      n.capeGroup.rotation.z,
      windSway * (0.28 + Math.sin(elapsedTime * 7.5) * 0.1),
      delta * 8
    );

    // =====================================================================
    // 1. LOWER BODY LAYER (STRIDE-CALIBRATED LOCOMOTION)
    // =====================================================================
    if (isDodging) {
      this.currentLowerState = 'dodge';
      n.pelvis.position.y = 0.68;
      n.pelvis.rotation.x = 0.42;
      n.hipL.rotation.x = 0.65;
      n.shinL.rotation.x = -0.85;
      n.hipR.rotation.x = -0.55;
      n.shinR.rotation.x = -0.65;
      n.capeGroup.rotation.x = 0.75;
    } else if (isMoving && planarSpeed > 0.15) {
      this.currentLowerState = planarSpeed > 3.2 ? 'run' : 'walk';

      // Advance stride phase proportional to actual distance traveled
      const phaseAdvance = (planarSpeed / this.strideLength) * Math.PI * 2 * delta;
      this.stridePhase = (this.stridePhase + phaseAdvance) % (Math.PI * 2);

      const sinP = Math.sin(this.stridePhase);
      const cosP = Math.cos(this.stridePhase);

      // Emit footstep ClipEvents on zero-crossings
      if (this.prevStrideSin <= 0 && sinP > 0) {
        this.emit('footLeft');
      } else if (this.prevStrideSin >= 0 && sinP < 0) {
        this.emit('footRight');
      }
      this.prevStrideSin = sinP;

      const amplitude = THREE.MathUtils.clamp(planarSpeed / 4.8, 0.35, 1.05);
      // Left and right thighs swing in opposition (+X rotation swings leg forward in local +Z space)
      n.hipL.rotation.x = sinP * 0.72 * amplitude;
      n.hipR.rotation.x = -sinP * 0.72 * amplitude;

      // Knees bend backward (-X rotation) during the recovery half of the stride
      n.shinL.rotation.x = -Math.max(0, -cosP) * 0.85 * amplitude;
      n.shinR.rotation.x = -Math.max(0, cosP) * 0.85 * amplitude;

      // Pelvis vertical double-frequency bob and subtle hip sway
      n.pelvis.position.y = 0.88 + Math.abs(sinP) * 0.065 * amplitude;
      n.pelvis.rotation.x = 0.08 * amplitude;
      n.pelvis.rotation.y = -sinP * 0.08 * amplitude;

      // Cape billows back with velocity
      n.capeGroup.rotation.x = 0.22 + amplitude * 0.38 + Math.sin(elapsedTime * 10) * 0.06;
    } else {
      this.currentLowerState = 'idle';
      const breathe = Math.sin(elapsedTime * 2.6);
      n.pelvis.position.y = THREE.MathUtils.lerp(n.pelvis.position.y, 0.88 + breathe * 0.015, delta * 10);
      n.pelvis.rotation.x = THREE.MathUtils.lerp(n.pelvis.rotation.x, 0, delta * 10);
      n.pelvis.rotation.y = THREE.MathUtils.lerp(n.pelvis.rotation.y, 0, delta * 10);

      n.hipL.rotation.x = THREE.MathUtils.lerp(n.hipL.rotation.x, 0.05, delta * 10);
      n.hipR.rotation.x = THREE.MathUtils.lerp(n.hipR.rotation.x, -0.05, delta * 10);
      n.shinL.rotation.x = THREE.MathUtils.lerp(n.shinL.rotation.x, -0.06, delta * 10);
      n.shinR.rotation.x = THREE.MathUtils.lerp(n.shinR.rotation.x, -0.06, delta * 10);
      n.capeGroup.rotation.x = THREE.MathUtils.lerp(n.capeGroup.rotation.x, 0.14 + breathe * 0.03 + windSway * 0.16, delta * 8);
    }

    // =====================================================================
    // 2. UPPER BODY LAYER (INDEPENDENT COMBAT & AIM OVERRIDE)
    // =====================================================================
    if (isAttacking) {
      const targetUpper: UpperBodyState3D = !this.style.usesBow
        ? isArmed
          ? isHeavyAttack
            ? 'slash_heavy'
            : 'slash_light'
          : 'unarmed_punch'
        : isHeavyAttack
          ? 'shoot_heavy'
          : 'shoot_light';

      if (this.currentUpperState !== targetUpper || (!isHeavyAttack && this.lastComboStep !== comboStep)) {
        this.currentUpperState = targetUpper;
        this.lastComboStep = comboStep;
        this.upperTimer = 0;
        this.upperDuration = isHeavyAttack ? 0.38 : comboStep === 3 ? 0.30 : 0.22;
        this.emittedWeaponContact = false;
      }

      this.upperTimer += delta;
      const t = THREE.MathUtils.clamp(this.upperTimer / Math.max(0.05, this.upperDuration), 0, 1);

      if (!this.emittedWeaponContact && t >= 0.45) {
        this.emittedWeaponContact = true;
        this.emit('weaponContact');
      }

      if (!this.style.usesBow) {
        if (isArmed) {
          const swingArc = Math.sin(t * Math.PI);
          if (!isHeavyAttack && comboStep === 2) {
            // Combo Step 2: Reverse Cross-Slash (left-to-right horizontal backhand sweep)
            const reverseSweep = t < 0.3 ? THREE.MathUtils.lerp(0.6, 1.1, t / 0.3) : THREE.MathUtils.lerp(1.1, -1.25, (t - 0.3) / 0.7);
            n.torso.rotation.y = aimYawOffset + (t < 0.3 ? 0.52 : -0.62);
            n.torso.rotation.x = 0.14 * swingArc;
            n.shoulderR.rotation.x = 0.75 * swingArc;
            n.shoulderR.rotation.z = reverseSweep * 0.68;
            n.forearmR.rotation.x = 0.35 + 0.4 * swingArc;
            n.shoulderL.rotation.x = -0.45 * swingArc;
            n.shoulderL.rotation.z = 0.42;
            n.forearmL.rotation.x = 0.45;
          } else if (!isHeavyAttack && comboStep === 3) {
            // Combo Step 3: Rising Black-Fire Finisher (deep windup -> explosive ascending cleave)
            const risingArc = t < 0.32 ? THREE.MathUtils.lerp(0.95, 1.45, t / 0.32) : THREE.MathUtils.lerp(1.45, -1.55, (t - 0.32) / 0.68);
            n.pelvis.position.y += 0.08 * swingArc;
            n.torso.rotation.y = aimYawOffset + (t < 0.32 ? -0.72 : 0.85);
            n.torso.rotation.x = -0.22 * swingArc;
            n.shoulderR.rotation.x = risingArc;
            n.shoulderR.rotation.z = -0.52 * swingArc;
            n.forearmR.rotation.x = 0.25 + 0.55 * swingArc;
            n.shoulderL.rotation.x = 0.55 * swingArc;
            n.shoulderL.rotation.z = 0.35;
            n.forearmL.rotation.x = 0.65;
          } else {
            // Combo Step 1 & Heavy Cleave: Dynamic diagonal overhead slash
            const cleaveProgress = t < 0.35 ? THREE.MathUtils.lerp(-0.7, -1.35, t / 0.35) : THREE.MathUtils.lerp(-1.35, 1.15, (t - 0.35) / 0.65);

            n.torso.rotation.y = aimYawOffset + (t < 0.35 ? -0.45 : 0.55) * (isHeavyAttack ? 1.25 : 1.0);
            n.torso.rotation.x = 0.18 * swingArc;

            n.shoulderR.rotation.x = cleaveProgress;
            n.shoulderR.rotation.z = -0.35 * swingArc;
            n.forearmR.rotation.x = 0.45 + 0.35 * swingArc;

            // Counter-balance left arm
            n.shoulderL.rotation.x = -0.35 * swingArc;
            n.shoulderL.rotation.z = 0.28;
            n.forearmL.rotation.x = 0.5;
          }
        } else {
          // Unarmed rapid punch combo
          const punchExtend = Math.sin(t * Math.PI);
          n.torso.rotation.y = aimYawOffset + 0.45 * punchExtend;
          n.shoulderR.rotation.x = 1.45 * punchExtend;
          n.forearmR.rotation.x = 1.1 * (1 - punchExtend) + 0.15;
          n.shoulderL.rotation.x = 0.65;
          n.forearmL.rotation.x = 1.15;
        }
      } else {
        // Khaterine Abyssal Bow Draw & Release
        const drawAmount = t < 0.65 ? t / 0.65 : 1 - (t - 0.65) / 0.35;
        n.torso.rotation.y = aimYawOffset - 0.55;
        n.headGroup.rotation.y = 0.5;

        // Left arm holds the Abyssal Bow extended forward
        n.shoulderL.rotation.x = 1.48;
        n.shoulderL.rotation.y = 0.45;
        n.forearmL.rotation.x = 0.12;

        // Right arm draws the glowing string back to cheek
        n.shoulderR.rotation.x = 1.35;
        n.shoulderR.rotation.y = -0.35 * drawAmount;
        n.forearmR.rotation.x = 1.15 * drawAmount;
      }

      if (t >= 1) {
        this.emit('actionComplete');
      }
      return;
    }

    this.currentUpperState = isGuarding ? (!this.style.usesBow ? 'guard' : 'ward') : 'none';

    if (isGuarding) {
      // Defensive parry stance (Thomas) or Abyssal Ward invocation (Khaterine)
      n.torso.rotation.y = THREE.MathUtils.lerp(n.torso.rotation.y, aimYawOffset + 0.35, delta * 14);
      n.torso.rotation.x = THREE.MathUtils.lerp(n.torso.rotation.x, 0.12, delta * 14);
      n.shoulderR.rotation.x = THREE.MathUtils.lerp(n.shoulderR.rotation.x, 1.05, delta * 14);
      n.shoulderR.rotation.z = THREE.MathUtils.lerp(n.shoulderR.rotation.z, 0.45, delta * 14);
      n.forearmR.rotation.x = THREE.MathUtils.lerp(n.forearmR.rotation.x, 0.95, delta * 14);

      n.shoulderL.rotation.x = THREE.MathUtils.lerp(n.shoulderL.rotation.x, 0.9, delta * 14);
      n.forearmL.rotation.x = THREE.MathUtils.lerp(n.forearmL.rotation.x, 0.85, delta * 14);
      return;
    }

    // Natural arm counter-swing synchronized with lower-body stride
    const sinP = isMoving ? Math.sin(this.stridePhase) : 0;
    const armSwing = isMoving ? sinP * 0.45 : Math.sin(elapsedTime * 2.4) * 0.04;

    n.torso.rotation.y = THREE.MathUtils.lerp(n.torso.rotation.y, aimYawOffset + sinP * 0.08, delta * 10);
    n.torso.rotation.x = THREE.MathUtils.lerp(n.torso.rotation.x, isMoving ? 0.08 : 0, delta * 10);
    n.headGroup.rotation.y = THREE.MathUtils.lerp(n.headGroup.rotation.y, aimYawOffset * 0.5, delta * 10);

    // Opposite arm swings forward with opposite leg
    n.shoulderL.rotation.x = THREE.MathUtils.lerp(n.shoulderL.rotation.x, -armSwing + 0.12, delta * 12);
    n.shoulderL.rotation.y = THREE.MathUtils.lerp(n.shoulderL.rotation.y, 0, delta * 12);
    n.shoulderL.rotation.z = THREE.MathUtils.lerp(n.shoulderL.rotation.z, 0.12, delta * 12);
    n.forearmL.rotation.x = THREE.MathUtils.lerp(n.forearmL.rotation.x, 0.35, delta * 12);

    n.shoulderR.rotation.x = THREE.MathUtils.lerp(n.shoulderR.rotation.x, armSwing + 0.22, delta * 12);
    n.shoulderR.rotation.y = THREE.MathUtils.lerp(n.shoulderR.rotation.y, 0, delta * 12);
    n.shoulderR.rotation.z = THREE.MathUtils.lerp(n.shoulderR.rotation.z, -0.14, delta * 12);
    n.forearmR.rotation.x = THREE.MathUtils.lerp(n.forearmR.rotation.x, 0.42, delta * 12);
  }
}
