import * as THREE from 'three';

export interface AnimatedBillboardClip {
  url: string;
  frames: number;
  fps: number;
  loop: boolean;
}

interface ActiveBillboard {
  id: string;
  parent: THREE.Object3D;
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  baseTexture: THREE.Texture;
  ownTexture: THREE.Texture;
  clips: Record<string, AnimatedBillboardClip>;
  currentClipKey: string;
  currentFrame: number;
  frameTimer: number;
  hideProceduralChildren: boolean;
}

interface TransientVfxBillboard {
  mesh: THREE.Mesh;
  scene: THREE.Scene;
  baseTexture: THREE.Texture;
  ownTexture: THREE.Texture;
  frames: number;
  fps: number;
  currentFrame: number;
  frameTimer: number;
  finished: boolean;
}

/**
 * Integrates Kevin's official visual designs (65 animation sprite strips, 11 props, 11 VFX,
 * character/boss illustrations, and panoramic loading vistas) directly into the Three.js 3D world.
 */
export class ThreeVisualDesignSystem {
  private loader = new THREE.TextureLoader();
  private textureCache: Map<string, THREE.Texture> = new Map();
  private billboards: Map<string, ActiveBillboard> = new Map();
  private transientVfx: TransientVfxBillboard[] = [];
  private vistaMeshes: THREE.Mesh[] = [];
  public isEnabled: boolean = true;

  public loadStripTexture(url: string, frames: number): THREE.Texture {
    const cacheKey = `${url}#${frames}`;
    const existing = this.textureCache.get(cacheKey);
    if (existing) return existing;

    const tex = this.loader.load(url, loaded => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.magFilter = THREE.NearestFilter;
      loaded.minFilter = THREE.NearestFilter;
      loaded.needsUpdate = true;
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1 / Math.max(1, frames), 1);
    tex.offset.set(0, 0);
    this.textureCache.set(cacheKey, tex);
    return tex;
  }

  public loadArtTexture(url: string): THREE.Texture {
    const existing = this.textureCache.get(url);
    if (existing) return existing;

    const tex = this.loader.load(url, loaded => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.needsUpdate = true;
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    this.textureCache.set(url, tex);
    return tex;
  }

  private createOwnInstanceTexture(baseTex: THREE.Texture, frames: number): THREE.Texture {
    const own = baseTex.clone();
    own.colorSpace = THREE.SRGBColorSpace;
    own.magFilter = THREE.NearestFilter;
    own.minFilter = THREE.NearestFilter;
    own.wrapS = THREE.RepeatWrapping;
    own.wrapT = THREE.ClampToEdgeWrapping;
    own.repeat.set(1 / Math.max(1, frames), 1);
    own.offset.set(0, 0);
    if (baseTex.image) {
      own.image = baseTex.image;
      own.needsUpdate = true;
    }
    return own;
  }

  /**
   * Attaches an animated pixel-art / illustrated billboard plane to a 3D entity group.
   */
  public attachAnimatedBillboard(
    id: string,
    parent: THREE.Object3D,
    width: number,
    height: number,
    yOffset: number,
    initialClipKey: string,
    clips: Record<string, AnimatedBillboardClip>,
    hideProceduralChildren: boolean = false
  ): THREE.Mesh {
    const initialClip = clips[initialClipKey] || Object.values(clips)[0];
    const baseTex = this.loadStripTexture(initialClip.url, initialClip.frames);
    const ownTex = this.createOwnInstanceTexture(baseTex, initialClip.frames);

    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshBasicMaterial({
      map: ownTex,
      transparent: true,
      alphaTest: 0.12,
      side: THREE.DoubleSide,
      depthWrite: true
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, yOffset, 0);
    mesh.name = `visual_billboard_${id}`;
    mesh.renderOrder = 2;

    if (hideProceduralChildren) {
      parent.children.forEach(child => {
        if ((child as THREE.Light).isLight) return;
        if (child.name && child.name.includes('Warning')) return;
        child.visible = false;
      });
    }

    parent.add(mesh);

    this.billboards.set(id, {
      id,
      parent,
      mesh,
      material: mat,
      baseTexture: baseTex,
      ownTexture: ownTex,
      clips,
      currentClipKey: initialClipKey,
      currentFrame: 0,
      frameTimer: 0,
      hideProceduralChildren
    });

    return mesh;
  }

  public setClip(id: string, clipKey: string): void {
    const b = this.billboards.get(id);
    if (!b || b.currentClipKey === clipKey) return;
    const clip = b.clips[clipKey];
    if (!clip) return;

    b.currentClipKey = clipKey;
    b.currentFrame = 0;
    b.frameTimer = 0;

    const baseTex = this.loadStripTexture(clip.url, clip.frames);
    b.baseTexture = baseTex;
    b.ownTexture.dispose();
    b.ownTexture = this.createOwnInstanceTexture(baseTex, clip.frames);
    b.material.map = b.ownTexture;
    b.material.needsUpdate = true;
  }

  /**
   * Creates illuminated panoramic art backdrop murals in the 3D world so each zone showcases
   * Kevin's official environmental artwork.
   */
  public createPanoramicVistas(scene: THREE.Scene): void {
    const vistas = [
      { url: '/assets/loading/oakhaven-aftermath.png', x: 0, y: 8.5, z: -26, w: 32, h: 16, opacity: 0.55 },
      { url: '/assets/loading/shalem-opening.png', x: 0, y: 8.5, z: -176, w: 32, h: 16, opacity: 0.55 },
      { url: '/assets/loading/shalem-opening.png', x: 0, y: 9.0, z: -222, w: 34, h: 17, opacity: 0.6 },
      { url: '/assets/loading/road-to-londinium.png', x: 0, y: 8.5, z: -282, w: 34, h: 17, opacity: 0.65 },
      { url: '/assets/loading/londinium-gates.png', x: 0, y: 9.5, z: -346, w: 36, h: 18, opacity: 0.65 },
      { url: '/assets/title_cover.png', x: 0, y: 10.5, z: -414, w: 40, h: 20, opacity: 0.7 }
    ];

    for (const v of vistas) {
      const tex = this.loadArtTexture(v.url);
      const geo = new THREE.PlaneGeometry(v.w, v.h);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: v.opacity,
        side: THREE.DoubleSide,
        fog: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(v.x, v.y, v.z);
      scene.add(mesh);
      this.vistaMeshes.push(mesh);
    }
  }

  /**
   * Spawns a one-shot animated VFX sprite strip billboard in 3D space (e.g., slash, parry spark, explosion, flame pillar, bone shatter).
   */
  public spawnVfxBillboard(
    scene: THREE.Scene,
    worldPos: THREE.Vector3,
    width: number,
    height: number,
    url: string,
    frames: number,
    fps: number = 18
  ): void {
    if (!this.isEnabled) return;
    const baseTex = this.loadStripTexture(url, frames);
    const ownTex = this.createOwnInstanceTexture(baseTex, frames);

    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshBasicMaterial({
      map: ownTex,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(worldPos);
    mesh.renderOrder = 10;
    scene.add(mesh);

    this.transientVfx.push({
      mesh,
      scene,
      baseTexture: baseTex,
      ownTexture: ownTex,
      frames,
      fps,
      currentFrame: 0,
      frameTimer: 0,
      finished: false
    });
  }

  public toggleVisualStyle(): boolean {
    this.isEnabled = !this.isEnabled;
    for (const b of this.billboards.values()) {
      b.mesh.visible = this.isEnabled;
      if (b.hideProceduralChildren) {
        b.parent.children.forEach(child => {
          if (child === b.mesh || (child as THREE.Light).isLight) return;
          if (child.name && child.name.includes('Warning')) return;
          child.visible = !this.isEnabled;
        });
      }
    }
    for (const vm of this.vistaMeshes) {
      vm.visible = this.isEnabled;
    }
    return this.isEnabled;
  }

  public update(delta: number, camera: THREE.Camera): void {
    if (!this.isEnabled) return;

    const camPos = camera.position;

    for (const b of this.billboards.values()) {
      if (!b.parent.visible) continue;

      // Sync image reference once asynchronous TextureLoader completes
      if (b.baseTexture.image && b.ownTexture.image !== b.baseTexture.image) {
        b.ownTexture.image = b.baseTexture.image;
        b.ownTexture.needsUpdate = true;
      }

      const clip = b.clips[b.currentClipKey];
      if (clip && clip.frames > 1 && clip.fps > 0) {
        b.frameTimer += delta;
        const frameDuration = 1 / clip.fps;
        if (b.frameTimer >= frameDuration) {
          b.frameTimer -= frameDuration;
          if (b.currentFrame < clip.frames - 1) {
            b.currentFrame++;
          } else if (clip.loop) {
            b.currentFrame = 0;
          }
        }
        b.ownTexture.repeat.set(1 / clip.frames, 1);
        b.ownTexture.offset.set(b.currentFrame / clip.frames, 0);
      }

      // Upright Y-axis billboarding towards camera in world space
      const worldPos = new THREE.Vector3();
      b.mesh.getWorldPosition(worldPos);
      const dx = camPos.x - worldPos.x;
      const dz = camPos.z - worldPos.z;
      const worldAngleY = Math.atan2(dx, dz);

      let parentRotY = 0;
      let curr: THREE.Object3D | null = b.parent;
      while (curr) {
        parentRotY += curr.rotation.y;
        curr = curr.parent;
      }
      b.mesh.rotation.set(0, worldAngleY - parentRotY, 0);
    }

    // Update transient one-shot VFX billboards
    for (let i = this.transientVfx.length - 1; i >= 0; i--) {
      const fx = this.transientVfx[i];
      if (fx.baseTexture.image && fx.ownTexture.image !== fx.baseTexture.image) {
        fx.ownTexture.image = fx.baseTexture.image;
        fx.ownTexture.needsUpdate = true;
      }

      fx.frameTimer += delta;
      const frameDuration = 1 / Math.max(1, fx.fps);
      if (fx.frameTimer >= frameDuration) {
        fx.frameTimer -= frameDuration;
        fx.currentFrame++;
        if (fx.currentFrame >= fx.frames) {
          fx.finished = true;
        }
      }

      if (fx.finished) {
        fx.scene.remove(fx.mesh);
        fx.mesh.geometry.dispose();
        (fx.mesh.material as THREE.Material).dispose();
        fx.ownTexture.dispose();
        this.transientVfx.splice(i, 1);
        continue;
      }

      fx.ownTexture.repeat.set(1 / fx.frames, 1);
      fx.ownTexture.offset.set(fx.currentFrame / fx.frames, 0);

      const dx = camPos.x - fx.mesh.position.x;
      const dz = camPos.z - fx.mesh.position.z;
      fx.mesh.rotation.set(0, Math.atan2(dx, dz), 0);
    }
  }

  public dispose(): void {
    for (const fx of this.transientVfx) {
      fx.scene.remove(fx.mesh);
      fx.ownTexture.dispose();
    }
    this.transientVfx = [];
    for (const b of this.billboards.values()) {
      b.ownTexture.dispose();
    }
    for (const tex of this.textureCache.values()) {
      tex.dispose();
    }
    this.textureCache.clear();
    this.billboards.clear();
    this.vistaMeshes = [];
  }
}
