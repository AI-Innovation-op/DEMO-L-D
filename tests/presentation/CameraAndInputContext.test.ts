import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { GothicArticulatedRig3D, ClipEventType3D, ArticulatedRigArchetype3D } from '../../src/presentation/three/GothicArticulatedRig3D';
import {
  normalizeAndGroundGlbModel,
  CANONICAL_GLB_SLOTS
} from '../../src/presentation/three/GothicModelLoader3D';
import {
  computeWorldTerrainHeight,
  isBridgeAbyssDropZone,
  computeMalphasBrazierMultiplier
} from '../../src/presentation/three/Oakhaven3DExperience';
import { HudCompactController3D } from '../../src/presentation/three/HudCompactController3D';
import { CombatSpectacleVfx3D } from '../../src/presentation/three/CombatSpectacleVfx3D';
import { GothicArchitectureBuilder3D } from '../../src/presentation/three/GothicArchitectureBuilder3D';

describe('Camera & Input Architecture (Vice City & OpenLara Solution)', () => {
  describe('Shortest Angular Arc & Turning Math', () => {
    function computeAngleDiff(targetAngle: number, currentAngle: number): number {
      return Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
    }

    it('smoothly takes the shortest arc across the -PI to +PI boundary', () => {
      // Crossing from +3.1 radians (close to +PI) to -3.1 radians (close to -PI)
      const current = 3.1;
      const target = -3.1;

      const diff = computeAngleDiff(target, current);
      // Instead of spinning 350+ degrees (-6.2 rad), shortest arc is ~ +0.083 rad
      expect(Math.abs(diff)).toBeLessThan(0.1);
      expect(diff).toBeGreaterThan(0);
    });

    it('correctly calculates 90 degree and 180 degree turning arcs', () => {
      const rightTurn = computeAngleDiff(-Math.PI / 2, 0);
      expect(rightTurn).toBeCloseTo(-Math.PI / 2, 4);

      const leftTurn = computeAngleDiff(Math.PI / 2, 0);
      expect(leftTurn).toBeCloseTo(Math.PI / 2, 4);

      const uTurn = Math.abs(computeAngleDiff(Math.PI, 0));
      expect(uTurn).toBeCloseTo(Math.PI, 4);
    });
  });

  describe('Camera-Relative WASD Movement in Third-Person Mode', () => {
    function calculateCameraRelativeMove(
      moveX: number,
      moveZ: number,
      cameraYaw: number
    ): THREE.Vector3 {
      const camFwd = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
      const camRight = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
      const inputDir = new THREE.Vector3(0, 0, 0);

      if (moveZ < 0) inputDir.add(camFwd);
      if (moveZ > 0) inputDir.sub(camFwd);
      if (moveX > 0) inputDir.add(camRight);
      if (moveX < 0) inputDir.sub(camRight);

      if (inputDir.lengthSq() > 0) inputDir.normalize();
      return inputDir;
    }

    it('pressing W moves directly forward away from camera into the screen', () => {
      // Camera looking North (cameraYaw = 0, looking in -Z)
      const moveNorth = calculateCameraRelativeMove(0, -1, 0);
      expect(moveNorth.x).toBeCloseTo(0, 4);
      expect(moveNorth.z).toBeCloseTo(-1, 4);

      // Camera rotated 90 deg (cameraYaw = -PI/2, looking in +X East)
      const moveEast = calculateCameraRelativeMove(0, -1, -Math.PI / 2);
      expect(moveEast.x).toBeCloseTo(1, 4);
      expect(moveEast.z).toBeCloseTo(0, 4);

      // Camera rotated 180 deg (cameraYaw = PI, looking in +Z South)
      const moveSouth = calculateCameraRelativeMove(0, -1, Math.PI);
      expect(moveSouth.x).toBeCloseTo(0, 4);
      expect(moveSouth.z).toBeCloseTo(1, 4);
    });

    it('pressing S moves towards camera, A moves left, D moves right relative to camera view', () => {
      const cameraYaw = 0; // Camera behind looking North (-Z)

      const moveBack = calculateCameraRelativeMove(0, 1, cameraYaw);
      expect(moveBack.z).toBeCloseTo(1, 4); // South, towards camera

      const moveLeft = calculateCameraRelativeMove(-1, 0, cameraYaw);
      expect(moveLeft.x).toBeCloseTo(-1, 4); // West, screen left

      const moveRight = calculateCameraRelativeMove(1, 0, cameraYaw);
      expect(moveRight.x).toBeCloseTo(1, 4); // East, screen right
    });

    it('forward vector matches movement direction for combat and projectile alignment', () => {
      // For any movement direction (dx, dz), character target yaw is atan2(-dx, -dz)
      const testDirections = [
        { x: 0, z: -1 }, // North
        { x: 0, z: 1 },  // South
        { x: 1, z: 0 },  // East
        { x: -1, z: 0 }, // West
        { x: 0.7071, z: -0.7071 } // North-East
      ];

      for (const dir of testDirections) {
        const targetYaw = Math.atan2(-dir.x, -dir.z);
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, targetYaw, 0));
        expect(forward.x).toBeCloseTo(dir.x, 3);
        expect(forward.z).toBeCloseTo(dir.z, 3);
      }
    });
  });

  describe('Obstacle Resolution & Street Facade Pullback (traceClip)', () => {
    function resolveCameraObstacle(
      targetLook: THREE.Vector3,
      desiredCamPos: THREE.Vector3,
      maxStreetX: number
    ): THREE.Vector3 {
      let { x: camX, y: camY, z: camZ } = desiredCamPos;
      if (Math.abs(camX) > maxStreetX) {
        const boundX = Math.sign(camX) * maxStreetX;
        if (Math.abs(targetLook.x) < maxStreetX) {
          const t = THREE.MathUtils.clamp((boundX - targetLook.x) / (camX - targetLook.x), 0.15, 0.95);
          camX = THREE.MathUtils.lerp(targetLook.x, camX, t);
          camZ = THREE.MathUtils.lerp(targetLook.z, camZ, t);
          camY = THREE.MathUtils.lerp(targetLook.y + 0.5, camY, t);
        } else {
          camX = boundX;
        }
      }
      return new THREE.Vector3(camX, camY, camZ);
    }

    it('pulls camera inward when player hugs building wall to prevent facade clipping', () => {
      const maxStreetX = 4.75;
      // Player is at x: 3.5 near right side, camera wants to swing out to x: 6.5
      const targetLook = new THREE.Vector3(3.5, 1.35, 0);
      const desiredPos = new THREE.Vector3(6.5, 2.4, 3.5);

      const resolved = resolveCameraObstacle(targetLook, desiredPos, maxStreetX);
      // Resolved camera X must not exceed the street limit
      expect(Math.abs(resolved.x)).toBeLessThanOrEqual(maxStreetX + 0.01);
      // Camera is pulled closer along the ray without snapping
      expect(resolved.distanceTo(targetLook)).toBeLessThan(desiredPos.distanceTo(targetLook));
    });

    it('clamps camera strictly when player is at the wall boundary', () => {
      const maxStreetX = 4.75;
      const targetLook = new THREE.Vector3(4.8, 1.35, 0);
      const desiredPos = new THREE.Vector3(6.5, 2.4, 3.5);

      const resolved = resolveCameraObstacle(targetLook, desiredPos, maxStreetX);
      expect(resolved.x).toBe(maxStreetX);
    });
  });

  describe('Frame-Rate Independent Exponential Smoothing', () => {
    it('exponential alpha is strictly time-step independent', () => {
      const k = 6.0;
      const fullDelta = 1 / 30; // 30 FPS step
      const halfDelta = 1 / 60; // 60 FPS step

      // Two half-steps should equal one full step in continuous decay:
      // (1 - alpha_half)^2 = exp(-k * dt/2)^2 = exp(-k * dt) = 1 - alpha_full
      const alphaFull = 1 - Math.exp(-k * fullDelta);
      const alphaHalf = 1 - Math.exp(-k * halfDelta);

      const remainingAfterFull = 1 - alphaFull;
      const remainingAfterTwoHalves = (1 - alphaHalf) * (1 - alphaHalf);

      expect(remainingAfterTwoHalves).toBeCloseTo(remainingAfterFull, 6);
    });
  });

  describe('Modal Context Hierarchy & Alchemy Input Context', () => {
    type TestInputContext = 'gameplay' | 'dialogue' | 'inventory' | 'skillTree' | 'alchemy' | 'defeated';

    function resolveInputContext(flags: {
      isPlayerDefeated?: boolean;
      isDialogueOpen?: boolean;
      isInventoryOpen?: boolean;
      isSkillTreeOpen?: boolean;
      isAlchemyOpen?: boolean;
    }): TestInputContext {
      if (flags.isPlayerDefeated) return 'defeated';
      if (flags.isDialogueOpen) return 'dialogue';
      if (flags.isInventoryOpen) return 'inventory';
      if (flags.isSkillTreeOpen) return 'skillTree';
      if (flags.isAlchemyOpen) return 'alchemy';
      return 'gameplay';
    }

    it('resolves alchemy context when alchemy modal is open', () => {
      expect(resolveInputContext({ isAlchemyOpen: true })).toBe('alchemy');
    });

    it('prioritizes dialogue and defeat contexts above alchemy modal', () => {
      expect(resolveInputContext({ isPlayerDefeated: true, isAlchemyOpen: true })).toBe('defeated');
      expect(resolveInputContext({ isDialogueOpen: true, isAlchemyOpen: true })).toBe('dialogue');
    });

    it('defaults to gameplay context when all modal flags are false', () => {
      expect(resolveInputContext({})).toBe('gameplay');
    });
  });

  describe('OpenLara Hierarchical 3D Articulated Rig (GothicArticulatedRig3D)', () => {
    it('constructs full hierarchical joint tree for Thomas and Khaterine', () => {
      const thomasRig = new GothicArticulatedRig3D('thomas');
      const khaterineRig = new GothicArticulatedRig3D('khaterine');

      expect(thomasRig.nodes.pelvis.parent).toBe(thomasRig.nodes.root);
      expect(thomasRig.nodes.torso.parent).toBe(thomasRig.nodes.pelvis);
      expect(thomasRig.nodes.shoulderR.parent).toBe(thomasRig.nodes.torso);
      expect(thomasRig.nodes.forearmR.parent).toBe(thomasRig.nodes.shoulderR);
      expect(thomasRig.nodes.weaponSocketR.parent).toBe(thomasRig.nodes.forearmR);
      expect(thomasRig.nodes.shinL.parent).toBe(thomasRig.nodes.hipL);

      expect(khaterineRig.nodes.weaponSocketL.parent).toBe(khaterineRig.nodes.forearmL);
    });

    it('separates lower-body stride locomotion from upper-body sword slash & emits ClipEvents', () => {
      const rig = new GothicArticulatedRig3D('thomas');
      const emittedEvents: ClipEventType3D[] = [];
      rig.onClipEvent(ev => emittedEvents.push(ev));

      // Simulate running while executing a heavy sword cleave
      for (let i = 1; i <= 15; i++) {
        rig.update({
          delta: 0.05,
          elapsedTime: i * 0.05,
          planarSpeed: 4.8,
          isMoving: true,
          isDodging: false,
          isGuarding: false,
          isAttacking: true,
          isHeavyAttack: true,
          isArmed: true,
          isDefeated: false
        });
      }

      expect(rig.getLowerState()).toBe('run');
      expect(rig.getUpperState()).toBe('slash_heavy');
      expect(emittedEvents).toContain('weaponContact');
      expect(emittedEvents.some(e => e === 'footLeft' || e === 'footRight')).toBe(true);
    });
  });

  describe('Multi-Sector Oakhaven Terrain Elevation (Colina del Viejo Roble +2.2m)', () => {
    it('returns 0m on the main Oakhaven street and rises smoothly to +2.2m on Old Oak Hill', () => {
      expect(computeWorldTerrainHeight('surface', 0, 4.0)).toBe(0);
      expect(computeWorldTerrainHeight('surface', 4.5, 5.0)).toBe(0);
      expect(computeWorldTerrainHeight('surface', 6.45, 5.0)).toBeCloseTo(1.1, 2);
      expect(computeWorldTerrainHeight('surface', 9.5, 5.0)).toBeCloseTo(2.2, 4);
    });
  });

  describe('Phases 2, 3 & 4 World Architecture (Acts II–V Elevation, Bridge Abyss, Narcotic Braziers & Boss Rigs)', () => {
    it('elevates Act II helical western stone stairs smoothly up to +2.8m at Elowen Salt Cell', () => {
      expect(computeWorldTerrainHeight('belltower_summit', 0, -195)).toBe(0);
      expect(computeWorldTerrainHeight('belltower_summit', -4.5, -192.0)).toBe(0);
      expect(computeWorldTerrainHeight('belltower_summit', -4.5, -196.25)).toBeCloseTo(1.4, 2);
      expect(computeWorldTerrainHeight('belltower_summit', -5.0, -202.0)).toBeCloseTo(2.8, 4);
    });

    it('elevates Act V Inverted Cathedral floating marble slabs progressively to +2.4m', () => {
      expect(computeWorldTerrainHeight('inverted_cathedral', 0, -366)).toBe(0);
      expect(computeWorldTerrainHeight('inverted_cathedral', 0, -382)).toBeCloseTo(1.2, 2);
      expect(computeWorldTerrainHeight('inverted_cathedral', 0, -396)).toBeCloseTo(2.4, 4);
    });

    it('detects Act III Great Stone Bridge broken balustrade abyss knock-off zones accurately', () => {
      // Center walkway is safe
      expect(isBridgeAbyssDropZone(0, -245)).toBe(false);
      // Pushed past |x| >= 4.1 inside broken balustrade gap 1 (z ∈ [-249, -241]) or gap 2 (z ∈ [-265, -255]) -> abyss!
      expect(isBridgeAbyssDropZone(-4.15, -245)).toBe(true);
      expect(isBridgeAbyssDropZone(4.2, -260)).toBe(true);
      // Intact wall zone at |x| = 4.15 stays blocked unless pushed past outer parapet edge |x| >= 4.3
      expect(isBridgeAbyssDropZone(4.15, -252)).toBe(false);
      expect(isBridgeAbyssDropZone(4.35, -252)).toBe(true);
    });

    it('amplifies Act IV damage dealt to Rex Malphas by +15% per destroyed narcotic brazier (up to +45%)', () => {
      expect(computeMalphasBrazierMultiplier(0)).toBeCloseTo(1.0, 4);
      expect(computeMalphasBrazierMultiplier(1)).toBeCloseTo(1.15, 4);
      expect(computeMalphasBrazierMultiplier(2)).toBeCloseTo(1.30, 4);
      expect(computeMalphasBrazierMultiplier(3)).toBeCloseTo(1.45, 4);
      expect(computeMalphasBrazierMultiplier(9)).toBeCloseTo(1.45, 4);
    });

    it('builds Phase 4 articulated 3D rigs for Act II–IV bosses/allies and reacts to lateral bridge windSway', () => {
      const archetypes: ArticulatedRigArchetype3D[] = [
        'crucible_guardian',
        'captain_vane',
        'rex_malphas',
        'bridge_guard',
        'martin_ally',
        'tobias_ally'
      ];

      for (const archetype of archetypes) {
        const rig = new GothicArticulatedRig3D(archetype);
        expect(rig.nodes.weaponSocketR.parent).toBe(rig.nodes.forearmR);
        expect(rig.nodes.weaponSocketL.parent).toBe(rig.nodes.forearmL);
      }

      const vaneCalm = new GothicArticulatedRig3D('captain_vane');
      const vaneWind = new GothicArticulatedRig3D('captain_vane');
      vaneCalm.update({
        delta: 0.05, elapsedTime: 1.0, planarSpeed: 0, isMoving: false,
        isDodging: false, isGuarding: true, isAttacking: false, isHeavyAttack: false,
        isArmed: true, isDefeated: false, windSway: 0
      });
      vaneWind.update({
        delta: 0.05, elapsedTime: 1.0, planarSpeed: 0, isMoving: false,
        isDodging: false, isGuarding: true, isAttacking: false, isHeavyAttack: false,
        isArmed: true, isDefeated: false, windSway: 1.0
      });

      expect(vaneWind.nodes.capeGroup.rotation.x).toBeGreaterThan(vaneCalm.nodes.capeGroup.rotation.x);
      expect(Math.abs(vaneWind.nodes.capeGroup.rotation.z)).toBeGreaterThan(0);
    });

    it('normalizes and grounds imported .GLB / .GLTF 3D models to exact canonical height (Camino B)', () => {
      expect(CANONICAL_GLB_SLOTS.thomas.targetHeight).toBeCloseTo(1.82, 2);
      expect(CANONICAL_GLB_SLOTS.khaterine.targetHeight).toBeCloseTo(1.78, 2);
      expect(CANONICAL_GLB_SLOTS.astaroth.targetHeight).toBeCloseTo(4.2, 2);

      // Simulate an unscaled 10-meter tall mesh offset floating at y = +5..+15
      const rawMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4, 10, 4),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      rawMesh.position.set(3, 10, -2);
      const rawGroup = new THREE.Group();
      rawGroup.add(rawMesh);

      const normalized = normalizeAndGroundGlbModel(rawGroup, CANONICAL_GLB_SLOTS.thomas.targetHeight);
      const finalBox = new THREE.Box3().setFromObject(normalized);
      const finalSize = new THREE.Vector3();
      finalBox.getSize(finalSize);

      expect(finalSize.y).toBeCloseTo(1.82, 2);
      expect(finalBox.min.y).toBeCloseTo(0, 2);
    });
  });

  describe('Compact 3D HUD & Collapsible Drawer Controller (HudCompactController3D)', () => {
    it('starts with both drawers collapsed and enforces mutual exclusivity between Menu and Dev drawers', () => {
      const hud = new HudCompactController3D(7.5);
      expect(hud.state.activeDrawer).toBe('none');
      expect(hud.state.minimalHud).toBe(false);
      expect(hud.state.toastVisible).toBe(true);

      expect(hud.toggleDrawer('menu')).toBe('menu');
      expect(hud.state.activeDrawer).toBe('menu');

      // Opening Dev drawer automatically closes Menu drawer
      expect(hud.toggleDrawer('dev')).toBe('dev');
      expect(hud.state.activeDrawer).toBe('dev');

      // Toggling same drawer closes it
      expect(hud.toggleDrawer('dev')).toBe('none');
      expect(hud.state.activeDrawer).toBe('none');
    });

    it('hides peripheral HUD chrome during cinematic beats and restores cleanly after', () => {
      const hud = new HudCompactController3D(7.5);
      hud.toggleDrawer('menu');
      expect(hud.state.activeDrawer).toBe('menu');

      hud.setCinematicActive(true);
      expect(hud.shouldHidePeripheralChrome()).toBe(true);
      expect(hud.state.activeDrawer).toBe('none');

      hud.setCinematicActive(false);
      expect(hud.shouldHidePeripheralChrome()).toBe(false);
    });

    it('auto-fades dialogue toast after countdown and glides bottom stack anchors cleanly without overlap', () => {
      const hud = new HudCompactController3D(2.0);
      expect(hud.state.toastVisible).toBe(true);
      const anchorsWithToast = hud.computeBottomAnchors();
      expect(anchorsWithToast.proximityBadgeBottomPx).toBeGreaterThan(anchorsWithToast.compassBottomPx + 25);

      // Tick 10 x 0.25s = 2.5s -> should fade out
      let changed = false;
      for (let i = 0; i < 10; i++) {
        if (hud.tick(0.25)) changed = true;
      }
      expect(changed).toBe(true);
      expect(hud.state.toastVisible).toBe(false);

      // Compass & proximity badge glide downward cleanly when toast disappears
      const anchorsNoToast = hud.computeBottomAnchors();
      expect(anchorsNoToast.compassBottomPx).toBeLessThan(anchorsWithToast.compassBottomPx);
      expect(anchorsNoToast.proximityBadgeBottomPx).toBeGreaterThan(anchorsNoToast.compassBottomPx + 25);

      // New toast restores visibility & timer
      hud.notifyDialogueToast(6.0);
      expect(hud.state.toastVisible).toBe(true);
      hud.dismissDialogueToast();
      expect(hud.state.toastVisible).toBe(false);
    });

    it('exits minimal HUD when opening a drawer and closes drawers when entering minimal HUD', () => {
      const hud = new HudCompactController3D(5.0);
      hud.toggleDrawer('dev');
      expect(hud.toggleMinimalHud()).toBe(true);
      expect(hud.state.activeDrawer).toBe('none');

      hud.toggleDrawer('menu');
      expect(hud.state.minimalHud).toBe(false);
      expect(hud.state.activeDrawer).toBe('menu');

      expect(hud.toggleQuestTrackerCollapsed()).toBe(true);
      expect(hud.toggleQuestTrackerCollapsed()).toBe(false);
    });
  });

  describe('3D Combat Spectacle, Boss Telegraphs, Falling Meteors & Hitstop (CombatSpectacleVfx3D)', () => {
    it('slows simulation delta to 8% during hitstop and restores normal speed cleanly', () => {
      const scene = new THREE.Scene();
      const vfx = new CombatSpectacleVfx3D(scene);

      expect(vfx.isHitstopActive).toBe(false);
      expect(vfx.consumeSimulationDelta(0.05)).toBeCloseTo(0.05, 5);

      vfx.triggerHitstop(0.08);
      expect(vfx.isHitstopActive).toBe(true);
      const slowed = vfx.consumeSimulationDelta(0.05);
      expect(slowed).toBeCloseTo(0.05 * 0.08, 5);
      expect(vfx.isHitstopActive).toBe(true);

      // Consume remaining 0.03s hitstop -> next step returns full speed
      vfx.consumeSimulationDelta(0.05);
      expect(vfx.isHitstopActive).toBe(false);
      expect(vfx.consumeSimulationDelta(0.04)).toBeCloseTo(0.04, 5);

      vfx.dispose();
    });

    it('spawns and cleans up boss ground telegraphs, shockwaves, mirror shards, and defeat cataclysms', () => {
      const scene = new THREE.Scene();
      const vfx = new CombatSpectacleVfx3D(scene);
      const origin = new THREE.Vector3(0, 0, -200);

      vfx.spawnGroundTelegraph(origin, 3.8, 0.5, 'molten_bronze');
      vfx.spawnParryOrCritFlash(origin, 'parry');
      vfx.spawnBossDefeatCataclysm(origin, 'mirror_astral');
      expect(vfx.activeEffectCount).toBeGreaterThan(20);
      expect(vfx.isHitstopActive).toBe(true);

      // Advance 2.5 seconds in small steps so every telegraph, particle, shockwave, and pillar expires cleanly
      for (let i = 0; i < 50; i++) {
        vfx.update(0.05);
      }
      expect(vfx.activeEffectCount).toBe(0);

      vfx.dispose();
    });

    it('drops Astaroth cosmic meteors from sky and detonates them on touchdown into shockwaves and shards', () => {
      const scene = new THREE.Scene();
      const vfx = new CombatSpectacleVfx3D(scene);
      const target = new THREE.Vector3(0, 2.0, -390);

      vfx.spawnMeteorVolley(target, 3, 3.0, 'black_sun');
      // 3 meteors + 3 ground telegraphs = 6 active effects initially
      expect(vfx.activeEffectCount).toBe(6);

      // After 0.8s meteors impact ground and spawn shockwaves + particle bursts
      for (let i = 0; i < 16; i++) {
        vfx.update(0.05);
      }
      expect(vfx.activeEffectCount).toBeGreaterThan(10);

      // Clean dispose wipes everything
      vfx.dispose();
      expect(vfx.activeEffectCount).toBe(0);
    });
  });

  describe('Gothic Architectural Detail & Living Atmosphere Across Acts I–V (GothicArchitectureBuilder3D)', () => {
    it('builds pointed arches, stained-glass rose windows, gears, banners, torches, and monoliths across all 5 Acts', () => {
      const scene = new THREE.Scene();
      const act2 = new THREE.Group();
      const act3 = new THREE.Group();
      const act4 = new THREE.Group();
      const act5 = new THREE.Group();

      const builder = new GothicArchitectureBuilder3D();
      builder.enhanceOakhavenSanJudeAct1(scene);
      builder.enhanceBelltowerAct2(act2);
      builder.enhanceGreatStoneBridgeAct3(act3);
      builder.enhanceLondiniumCitadelAct4(act4);
      builder.enhanceInvertedCathedralAct5(act5);

      const stats = builder.getStats();
      expect(stats.archCount).toBeGreaterThanOrEqual(20);
      expect(stats.stainedGlassCount).toBeGreaterThanOrEqual(6);
      expect(stats.torchFlameCount).toBeGreaterThanOrEqual(20);
      expect(stats.animatedGearCount).toBeGreaterThanOrEqual(4);
      expect(stats.bannerCount).toBe(6);
      expect(stats.floatingMonolithCount).toBe(8);

      // Verify living architecture animations advance smoothly without error
      expect(() => {
        for (let i = 1; i <= 10; i++) {
          builder.update(i * 0.1, 0.05);
        }
      }).not.toThrow();
    });
  });
});
