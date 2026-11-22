import * as THREE from 'three';

export type BossSpectacleTheme =
  | 'fire_crimson'
  | 'molten_bronze'
  | 'solar_gold'
  | 'mirror_astral'
  | 'black_sun'
  | 'parry_holy'
  | 'abyss_willow';

interface ActiveTelegraph3D {
  group: THREE.Group;
  fillMesh: THREE.Mesh;
  outerMat: THREE.MeshBasicMaterial;
  fillMat: THREE.MeshBasicMaterial;
  elapsed: number;
  duration: number;
}

interface ActiveShockwave3D {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  light?: THREE.PointLight;
  elapsed: number;
  duration: number;
  startScale: number;
  endScale: number;
  initialLightIntensity: number;
}

interface ActiveParticle3D {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  gravity: number;
  elapsed: number;
  life: number;
  initialScale: number;
}

interface ActiveMeteor3D {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  targetPos: THREE.Vector3;
  velocity: THREE.Vector3;
  colorHex: number;
  impacted: boolean;
}

interface ActiveDefeatPillar3D {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  light: THREE.PointLight;
  elapsed: number;
  duration: number;
}

const THEME_COLORS: Record<BossSpectacleTheme, { primary: number; secondary: number }> = {
  fire_crimson: { primary: 0xff3300, secondary: 0xffaa22 },
  molten_bronze: { primary: 0xff7722, secondary: 0xffdd55 },
  solar_gold: { primary: 0xffd700, secondary: 0xfff5bb },
  mirror_astral: { primary: 0xcc44ff, secondary: 0x88eeff },
  black_sun: { primary: 0xff2288, secondary: 0x6611aa },
  parry_holy: { primary: 0x66ddff, secondary: 0xffdd66 },
  abyss_willow: { primary: 0xbb44ff, secondary: 0x55ffaa }
};

/**
 * High-performance 3D Combat Spectacle & Boss Telegraph VFX Engine.
 * Handles expanding ground danger rings, shockwave novas, flying shards/embers,
 * Astaroth falling meteors, dramatic boss purification pillars, and tactile hitstop.
 */
export class CombatSpectacleVfx3D {
  private readonly scene: THREE.Scene;
  private readonly rootGroup: THREE.Group;

  // Shared reusable geometries (zero per-spawn geometry allocation)
  private readonly ringGeo: THREE.RingGeometry;
  private readonly discGeo: THREE.CircleGeometry;
  private readonly shardGeo: THREE.OctahedronGeometry;
  private readonly sparkGeo: THREE.BoxGeometry;
  private readonly meteorGeo: THREE.DodecahedronGeometry;
  private readonly pillarGeo: THREE.CylinderGeometry;

  private telegraphs: ActiveTelegraph3D[] = [];
  private shockwaves: ActiveShockwave3D[] = [];
  private particles: ActiveParticle3D[] = [];
  private meteors: ActiveMeteor3D[] = [];
  private pillars: ActiveDefeatPillar3D[] = [];

  private hitstopRemainingSec: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'CombatSpectacleVfx3D';
    this.scene.add(this.rootGroup);

    this.ringGeo = new THREE.RingGeometry(0.84, 1.0, 32);
    this.discGeo = new THREE.CircleGeometry(0.95, 32);
    this.shardGeo = new THREE.OctahedronGeometry(0.14, 0);
    this.sparkGeo = new THREE.BoxGeometry(0.09, 0.09, 0.24);
    this.meteorGeo = new THREE.DodecahedronGeometry(0.42, 0);
    this.pillarGeo = new THREE.CylinderGeometry(0.55, 1.35, 14.0, 16, 1, true);
  }

  public get activeEffectCount(): number {
    return (
      this.telegraphs.length +
      this.shockwaves.length +
      this.particles.length +
      this.meteors.length +
      this.pillars.length
    );
  }

  public get isHitstopActive(): boolean {
    return this.hitstopRemainingSec > 0;
  }

  /**
   * Triggers a crisp, short tactile freeze-frame slowdown on parries, crits, finishers, and boss defeats.
   */
  public triggerHitstop(durationSec: number): void {
    const clamped = THREE.MathUtils.clamp(durationSec, 0.02, 0.14);
    this.hitstopRemainingSec = Math.max(this.hitstopRemainingSec, clamped);
  }

  /**
   * Consumes frame delta for hitstop and returns the effective gameplay simulation delta
   * (slowed to 8% speed during freeze-frame impact beats).
   */
  public consumeSimulationDelta(rawDelta: number): number {
    const safeDelta = Math.max(0, Math.min(rawDelta, 0.1));
    if (this.hitstopRemainingSec > 0) {
      this.hitstopRemainingSec = Math.max(0, this.hitstopRemainingSec - safeDelta);
      return safeDelta * 0.08;
    }
    return safeDelta;
  }

  /**
   * Projects an expanding double-ring ground danger telegraph synchronized with a boss windup.
   */
  public spawnGroundTelegraph(
    position: THREE.Vector3,
    radius: number,
    durationSec: number,
    theme: BossSpectacleTheme
  ): void {
    const palette = THEME_COLORS[theme];
    const group = new THREE.Group();
    group.position.set(position.x, position.y + 0.07, position.z);
    group.rotation.x = -Math.PI / 2;

    const outerMat = new THREE.MeshBasicMaterial({
      color: palette.primary,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const outerRing = new THREE.Mesh(this.ringGeo, outerMat);
    outerRing.scale.setScalar(radius);

    const fillMat = new THREE.MeshBasicMaterial({
      color: palette.secondary,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const fillMesh = new THREE.Mesh(this.discGeo, fillMat);
    fillMesh.scale.setScalar(0.08 * radius);
    fillMesh.userData.maxRadius = radius;

    group.add(outerRing, fillMesh);
    this.rootGroup.add(group);

    this.telegraphs.push({
      group,
      fillMesh,
      outerMat,
      fillMat,
      elapsed: 0,
      duration: Math.max(0.2, durationSec)
    });
  }

  /**
   * Spawns a fast expanding 3D shockwave ring + brief point-light flash.
   */
  public spawnShockwaveRing(
    position: THREE.Vector3,
    startRadius: number,
    endRadius: number,
    durationSec: number,
    colorHex: number,
    withLight: boolean = true
  ): void {
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.position.set(position.x, position.y + 0.14, position.z);
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.setScalar(Math.max(0.2, startRadius));
    this.rootGroup.add(mesh);

    let light: THREE.PointLight | undefined;
    const initialLightIntensity = 4.2;
    if (withLight) {
      light = new THREE.PointLight(colorHex, initialLightIntensity, Math.max(8, endRadius * 2.5));
      light.position.set(position.x, position.y + 1.1, position.z);
      this.rootGroup.add(light);
    }

    this.shockwaves.push({
      mesh,
      mat,
      light,
      elapsed: 0,
      duration: Math.max(0.18, durationSec),
      startScale: Math.max(0.2, startRadius),
      endScale: Math.max(startRadius + 0.5, endRadius),
      initialLightIntensity
    });
  }

  /**
   * Emits a radial burst of 3D sparks, shards (e.g., Venetian mirrors), or molten embers.
   */
  public spawnParticleBurst(
    position: THREE.Vector3,
    count: number,
    theme: BossSpectacleTheme,
    options: {
      speed?: number;
      upwardBoost?: number;
      gravity?: number;
      life?: number;
      useShards?: boolean;
      scale?: number;
    } = {}
  ): void {
    const palette = THEME_COLORS[theme];
    const cappedCount = Math.min(count, 40);
    const speed = options.speed ?? 5.5;
    const upwardBoost = options.upwardBoost ?? 3.6;
    const gravity = options.gravity ?? -9.5;
    const life = options.life ?? 0.65;
    const baseScale = options.scale ?? 1.0;
    const geo = options.useShards ? this.shardGeo : this.sparkGeo;

    for (let i = 0; i < cappedCount; i++) {
      const angle = (i / cappedCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const radialSpeed = speed * (0.45 + Math.random() * 0.75);
      const color = i % 2 === 0 ? palette.primary : palette.secondary;

      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.4,
        position.y + 0.45 + Math.random() * 0.6,
        position.z + (Math.random() - 0.5) * 0.4
      );
      const s = baseScale * (0.65 + Math.random() * 0.7);
      mesh.scale.setScalar(s);
      this.rootGroup.add(mesh);

      this.particles.push({
        mesh,
        mat,
        velocity: new THREE.Vector3(
          Math.cos(angle) * radialSpeed,
          upwardBoost * (0.5 + Math.random() * 0.8),
          Math.sin(angle) * radialSpeed
        ),
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12
        ),
        gravity,
        elapsed: 0,
        life: life * (0.75 + Math.random() * 0.5),
        initialScale: s
      });
    }
  }

  /**
   * Launches a volley of glowing 3D cosmic meteors from the sky (Astaroth's Meteor Storm)
   * with ground impact rings and shockwave detonation on touchdown.
   */
  public spawnMeteorVolley(
    centerPos: THREE.Vector3,
    count: number = 3,
    spreadRadius: number = 3.8,
    theme: BossSpectacleTheme = 'black_sun'
  ): void {
    const palette = THEME_COLORS[theme];
    const capped = Math.min(Math.max(1, count), 5);

    for (let i = 0; i < capped; i++) {
      const angle = (i / capped) * Math.PI * 2 + Math.random() * 0.8;
      const dist = 1.0 + Math.random() * spreadRadius;
      const targetPos = new THREE.Vector3(
        centerPos.x + Math.cos(angle) * dist,
        centerPos.y,
        centerPos.z + Math.sin(angle) * dist
      );

      this.spawnGroundTelegraph(targetPos, 1.45, 0.72, theme);

      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? palette.primary : palette.secondary,
        transparent: true,
        opacity: 0.96
      });
      const mesh = new THREE.Mesh(this.meteorGeo, mat);
      const spawnOffsetX = (Math.random() - 0.5) * 3.0;
      const spawnHeight = 10.5 + i * 1.4;
      mesh.position.set(targetPos.x + spawnOffsetX, targetPos.y + spawnHeight, targetPos.z - 2.0);
      this.rootGroup.add(mesh);

      const travelTime = 0.72;
      const velocity = targetPos.clone().sub(mesh.position).divideScalar(travelTime);

      this.meteors.push({
        mesh,
        mat,
        targetPos,
        velocity,
        colorHex: palette.primary,
        impacted: false
      });
    }
  }

  /**
   * Dramatic signature spectacle when a hero lands a Perfect Parry [L] or Critical/Finisher hit.
   */
  public spawnParryOrCritFlash(
    position: THREE.Vector3,
    kind: 'parry' | 'crit' | 'finisher'
  ): void {
    if (kind === 'parry') {
      this.triggerHitstop(0.075);
      this.spawnShockwaveRing(position, 0.35, 3.2, 0.36, 0x66ddff, true);
      this.spawnParticleBurst(position, 14, 'parry_holy', { speed: 6.2, upwardBoost: 3.4, life: 0.48 });
      return;
    }
    if (kind === 'finisher') {
      this.triggerHitstop(0.095);
      this.spawnShockwaveRing(position, 0.4, 4.4, 0.48, 0xffd700, true);
      this.spawnParticleBurst(position, 22, 'solar_gold', {
        speed: 7.4,
        upwardBoost: 4.8,
        life: 0.65,
        useShards: true
      });
      return;
    }
    // Crit hit
    this.triggerHitstop(0.05);
    this.spawnShockwaveRing(position, 0.25, 2.2, 0.28, 0xffaa33, false);
    this.spawnParticleBurst(position, 10, 'fire_crimson', { speed: 5.2, upwardBoost: 2.8, life: 0.4 });
  }

  /**
   * Dramatic Boss Defeat Cataclysm: ascending purification light pillar, triple shockwaves,
   * rising luminous ash burst, and impactful hitstop.
   */
  public spawnBossDefeatCataclysm(position: THREE.Vector3, theme: BossSpectacleTheme): void {
    const palette = THEME_COLORS[theme];
    this.triggerHitstop(0.11);

    // Ascending luminous column
    const pillarMat = new THREE.MeshBasicMaterial({
      color: palette.secondary,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const pillar = new THREE.Mesh(this.pillarGeo, pillarMat);
    pillar.position.set(position.x, position.y + 6.8, position.z);
    this.rootGroup.add(pillar);

    const light = new THREE.PointLight(palette.primary, 8.0, 22);
    light.position.set(position.x, position.y + 2.5, position.z);
    this.rootGroup.add(light);

    this.pillars.push({
      mesh: pillar,
      mat: pillarMat,
      light,
      elapsed: 0,
      duration: 1.85
    });

    // Double concentric shockwaves
    this.spawnShockwaveRing(position, 0.5, 6.2, 0.72, palette.primary, false);
    this.spawnShockwaveRing(position, 0.3, 4.4, 0.54, palette.secondary, false);

    // Rising ash/shard nova (negative-less gentle upward float)
    this.spawnParticleBurst(position, 32, theme, {
      speed: 5.4,
      upwardBoost: 6.4,
      gravity: -2.2,
      life: 1.35,
      useShards: true,
      scale: 1.25
    });
  }

  public update(delta: number): void {
    const safeDelta = Math.max(0, Math.min(delta, 0.1));

    // 1. Update expanding ground telegraphs
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const t = this.telegraphs[i];
      t.elapsed += safeDelta;
      const pct = THREE.MathUtils.clamp(t.elapsed / t.duration, 0, 1);
      const maxR = (t.fillMesh.userData.maxRadius as number) || 3.0;
      t.fillMesh.scale.setScalar(Math.max(0.1, pct * maxR));
      t.fillMat.opacity = 0.16 + pct * 0.48;
      t.outerMat.opacity = 0.55 + Math.sin(t.elapsed * 26) * 0.3;

      if (t.elapsed >= t.duration) {
        this.rootGroup.remove(t.group);
        t.outerMat.dispose();
        t.fillMat.dispose();
        this.telegraphs.splice(i, 1);
      }
    }

    // 2. Update expanding shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.elapsed += safeDelta;
      const pct = THREE.MathUtils.clamp(s.elapsed / s.duration, 0, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      s.mesh.scale.setScalar(THREE.MathUtils.lerp(s.startScale, s.endScale, eased));
      s.mat.opacity = (1 - pct) * 0.9;
      if (s.light) {
        s.light.intensity = (1 - pct) * s.initialLightIntensity;
      }

      if (s.elapsed >= s.duration) {
        this.rootGroup.remove(s.mesh);
        s.mat.dispose();
        if (s.light) this.rootGroup.remove(s.light);
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update 3D particles & mirror shards
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.elapsed += safeDelta;
      p.velocity.y += p.gravity * safeDelta;
      p.mesh.position.addScaledVector(p.velocity, safeDelta);
      p.mesh.rotation.x += p.spin.x * safeDelta;
      p.mesh.rotation.y += p.spin.y * safeDelta;
      p.mesh.rotation.z += p.spin.z * safeDelta;

      const pct = THREE.MathUtils.clamp(p.elapsed / p.life, 0, 1);
      p.mat.opacity = 1 - pct;
      p.mesh.scale.setScalar(Math.max(0.01, p.initialScale * (1 - pct * 0.7)));

      if (p.elapsed >= p.life) {
        this.rootGroup.remove(p.mesh);
        p.mat.dispose();
        this.particles.splice(i, 1);
      }
    }

    // 4. Update falling Astaroth meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.mesh.position.addScaledVector(m.velocity, safeDelta);
      m.mesh.rotation.x += safeDelta * 7.5;
      m.mesh.rotation.z += safeDelta * 5.2;

      if (m.mesh.position.y <= m.targetPos.y + 0.35 && !m.impacted) {
        m.impacted = true;
        this.spawnShockwaveRing(m.targetPos, 0.35, 3.0, 0.45, m.colorHex, true);
        this.spawnParticleBurst(m.targetPos, 14, 'black_sun', {
          speed: 5.8,
          upwardBoost: 4.2,
          life: 0.55,
          useShards: true
        });
        this.rootGroup.remove(m.mesh);
        m.mat.dispose();
        this.meteors.splice(i, 1);
      }
    }

    // 5. Update dramatic boss defeat purification pillars
    for (let i = this.pillars.length - 1; i >= 0; i--) {
      const pl = this.pillars[i];
      pl.elapsed += safeDelta;
      const pct = THREE.MathUtils.clamp(pl.elapsed / pl.duration, 0, 1);
      const shrink = 1 - pct * 0.65;
      pl.mesh.scale.set(shrink, 1 + pct * 0.35, shrink);
      pl.mesh.rotation.y += safeDelta * 2.4;
      pl.mat.opacity = (1 - pct) * 0.75;
      pl.light.intensity = (1 - pct) * 8.0;

      if (pl.elapsed >= pl.duration) {
        this.rootGroup.remove(pl.mesh);
        this.rootGroup.remove(pl.light);
        pl.mat.dispose();
        this.pillars.splice(i, 1);
      }
    }
  }

  public dispose(): void {
    this.telegraphs.forEach(t => {
      this.rootGroup.remove(t.group);
      t.outerMat.dispose();
      t.fillMat.dispose();
    });
    this.shockwaves.forEach(s => {
      this.rootGroup.remove(s.mesh);
      s.mat.dispose();
      if (s.light) this.rootGroup.remove(s.light);
    });
    this.particles.forEach(p => {
      this.rootGroup.remove(p.mesh);
      p.mat.dispose();
    });
    this.meteors.forEach(m => {
      this.rootGroup.remove(m.mesh);
      m.mat.dispose();
    });
    this.pillars.forEach(pl => {
      this.rootGroup.remove(pl.mesh);
      this.rootGroup.remove(pl.light);
      pl.mat.dispose();
    });

    this.telegraphs = [];
    this.shockwaves = [];
    this.particles = [];
    this.meteors = [];
    this.pillars = [];

    this.ringGeo.dispose();
    this.discGeo.dispose();
    this.shardGeo.dispose();
    this.sparkGeo.dispose();
    this.meteorGeo.dispose();
    this.pillarGeo.dispose();

    this.scene.remove(this.rootGroup);
  }
}
