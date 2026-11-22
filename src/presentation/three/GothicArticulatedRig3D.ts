import * as THREE from 'three';

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
}

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
  public readonly heroId: 'thomas' | 'khaterine';
  public readonly nodes: GothicHeroRigNodes;

  private stridePhase: number = 0;
  private prevStrideSin: number = 0;
  private upperTimer: number = 0;
  private upperDuration: number = 0.3;
  private currentLowerState: LowerBodyState3D = 'idle';
  private currentUpperState: UpperBodyState3D = 'none';
  private emittedWeaponContact: boolean = false;
  private eventListeners: Array<(event: ClipEventType3D) => void> = [];

  // Reference stride length (meters per full step cycle)
  private readonly strideLength: number = 1.65;

  constructor(heroId: 'thomas' | 'khaterine') {
    this.heroId = heroId;
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

    const isThomas = this.heroId === 'thomas';

    // Shared Gothic PBR Materials
    const primaryClothMat = new THREE.MeshStandardMaterial({
      color: isThomas ? 0x261d30 : 0x1e112b,
      roughness: 0.78,
      metalness: 0.12
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: isThomas ? 0x4c2a59 : 0x3b184f,
      roughness: 0.65,
      metalness: 0.25
    });
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x3b2618,
      roughness: 0.72,
      metalness: 0.15
    });
    const metalArmorMat = new THREE.MeshStandardMaterial({
      color: isThomas ? 0x8d889c : 0x6a5578,
      roughness: 0.35,
      metalness: 0.82
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: isThomas ? 0xdcb691 : 0xe8cfc0,
      roughness: 0.55
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: isThomas ? 0x3a2416 : 0x140f1c,
      roughness: 0.88
    });
    const runeGlowMat = new THREE.MeshBasicMaterial({
      color: isThomas ? 0x9933ff : 0xd580ff
    });
    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.85
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

    // Tunic / Robe lower skirt flaps around pelvis
    const skirtGeo = new THREE.CylinderGeometry(0.26, isThomas ? 0.38 : 0.44, isThomas ? 0.42 : 0.54, 10, 1, true);
    const skirtMat = new THREE.MeshStandardMaterial({
      color: isThomas ? 0x201729 : 0x170c24,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    const skirt = new THREE.Mesh(skirtGeo, skirtMat);
    skirt.position.y = isThomas ? -0.18 : -0.24;
    skirt.castShadow = true;
    pelvis.add(skirt);

    // 2. TORSO (child of pelvis, pivots at waist y = +0.10m)
    const torso = new THREE.Group();
    torso.position.set(0, 0.1, 0);
    pelvis.add(torso);

    const chestMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(isThomas ? 0.28 : 0.24, 0.23, 0.56, 10),
      primaryClothMat
    );
    chestMesh.position.y = 0.28;
    chestMesh.castShadow = true;
    torso.add(chestMesh);

    // Pauldrons / Shoulder Guards
    [-0.31, 0.31].forEach(sideX => {
      const pauldron = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6),
        isThomas ? metalArmorMat : trimMat
      );
      pauldron.position.set(sideX, 0.52, 0);
      pauldron.rotation.z = sideX < 0 ? 0.35 : -0.35;
      pauldron.castShadow = true;
      torso.add(pauldron);
    });

    // Glowing Ash Seal (Thomas) or Willow Sigil (Khaterine) on Chest
    const sigilRing = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.11, 12), runeGlowMat);
    sigilRing.position.set(0, 0.34, isThomas ? 0.27 : 0.24);
    torso.add(sigilRing);

    // 3. FLOWING CAPE / VEIL (attached at upper torso back)
    const capeGroup = new THREE.Group();
    capeGroup.position.set(0, 0.52, -0.18);
    torso.add(capeGroup);

    const capeGeo = new THREE.BoxGeometry(isThomas ? 0.56 : 0.52, isThomas ? 0.88 : 1.02, 0.04);
    const capeMesh = new THREE.Mesh(capeGeo, trimMat);
    capeMesh.position.set(0, isThomas ? -0.42 : -0.48, -0.04);
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

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(isThomas ? 0.21 : 0.195, 12, 12), skinMat);
    headMesh.position.y = 0.18;
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: isThomas ? 0x3b2314 : 0xd580ff });
    [-0.07, 0.07].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), eyeMat);
      eye.position.set(ex, 0.19, isThomas ? 0.185 : 0.172);
      headGroup.add(eye);
    });

    // Hair / Hood
    const hairCrown = new THREE.Mesh(
      new THREE.SphereGeometry(isThomas ? 0.225 : 0.215, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.72),
      hairMat
    );
    hairCrown.position.set(0, 0.21, -0.02);
    hairCrown.rotation.x = -0.35;
    headGroup.add(hairCrown);

    if (!isThomas) {
      // Khaterine's Outcast Hood & Back Locks
      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.42, 8), trimMat);
      hood.position.set(0, 0.24, -0.06);
      hood.rotation.x = -0.25;
      headGroup.add(hood);
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
      aimYawOffset = 0
    } = input;

    const n = this.nodes;

    if (isDefeated) {
      this.currentLowerState = 'death';
      n.pelvis.position.y = THREE.MathUtils.lerp(n.pelvis.position.y, 0.25, delta * 8);
      n.pelvis.rotation.x = THREE.MathUtils.lerp(n.pelvis.rotation.x, -1.35, delta * 8);
      return;
    }

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
      n.capeGroup.rotation.x = THREE.MathUtils.lerp(n.capeGroup.rotation.x, 0.14 + breathe * 0.03, delta * 8);
    }

    // =====================================================================
    // 2. UPPER BODY LAYER (INDEPENDENT COMBAT & AIM OVERRIDE)
    // =====================================================================
    if (isAttacking) {
      const targetUpper: UpperBodyState3D =
        this.heroId === 'thomas'
          ? isArmed
            ? isHeavyAttack
              ? 'slash_heavy'
              : 'slash_light'
            : 'unarmed_punch'
          : isHeavyAttack
            ? 'shoot_heavy'
            : 'shoot_light';

      if (this.currentUpperState !== targetUpper) {
        this.currentUpperState = targetUpper;
        this.upperTimer = 0;
        this.upperDuration = isHeavyAttack ? 0.38 : 0.24;
        this.emittedWeaponContact = false;
      }

      this.upperTimer += delta;
      const t = THREE.MathUtils.clamp(this.upperTimer / Math.max(0.05, this.upperDuration), 0, 1);

      if (!this.emittedWeaponContact && t >= 0.45) {
        this.emittedWeaponContact = true;
        this.emit('weaponContact');
      }

      if (this.heroId === 'thomas') {
        if (isArmed) {
          // Dynamic sword cleave arc: windup -> cleave across torso -> follow-through
          const swingArc = Math.sin(t * Math.PI);
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

    this.currentUpperState = isGuarding ? (this.heroId === 'thomas' ? 'guard' : 'ward') : 'none';

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
