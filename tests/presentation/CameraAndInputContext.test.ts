import { describe, it, expect } from 'vitest';
import * as THREE from 'three';

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
});
