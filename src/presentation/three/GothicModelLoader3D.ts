import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type CanonicalGlbSlotId =
  | 'thomas'
  | 'khaterine'
  | 'shalem'
  | 'shalem_lion'
  | 'elowen'
  | 'cedric'
  | 'martin_ally'
  | 'tobias_ally'
  | 'hound'
  | 'cultist'
  | 'zealot'
  | 'skeleton'
  | 'morwenna'
  | 'inquisitor'
  | 'root_prowler'
  | 'crucible_guardian'
  | 'captain_vane'
  | 'rex_malphas'
  | 'astaroth';

export interface GlbSlotDefinition {
  readonly id: CanonicalGlbSlotId;
  readonly url: string;
  readonly targetHeight: number;
  readonly label: string;
}

export const CANONICAL_GLB_SLOTS: Record<CanonicalGlbSlotId, GlbSlotDefinition> = {
  thomas: { id: 'thomas', url: '/assets/models/thomas.glb', targetHeight: 1.82, label: 'Thomas el Acólito' },
  khaterine: { id: 'khaterine', url: '/assets/models/khaterine.glb', targetHeight: 1.78, label: 'Khaterine del Sauce Negro' },
  shalem: { id: 'shalem', url: '/assets/models/shalem.glb', targetHeight: 0.55, label: 'Shalem (Forma Felina)' },
  shalem_lion: { id: 'shalem_lion', url: '/assets/models/shalem_lion.glb', targetHeight: 2.25, label: 'Shalem (León de Brasas)' },
  elowen: { id: 'elowen', url: '/assets/models/elowen.glb', targetHeight: 1.72, label: 'Elowen de Oakhaven' },
  cedric: { id: 'cedric', url: '/assets/models/cedric.glb', targetHeight: 1.78, label: 'Padre Cedric' },
  martin_ally: { id: 'martin_ally', url: '/assets/models/martin_ally.glb', targetHeight: 1.80, label: 'Martín el Armero' },
  tobias_ally: { id: 'tobias_ally', url: '/assets/models/tobias_ally.glb', targetHeight: 1.84, label: 'Tobías el Leñador' },
  hound: { id: 'hound', url: '/assets/models/hound.glb', targetHeight: 1.15, label: 'Sabueso de Ceniza' },
  cultist: { id: 'cultist', url: '/assets/models/cultist.glb', targetHeight: 1.78, label: 'Cultista del Incensario' },
  zealot: { id: 'zealot', url: '/assets/models/zealot.glb', targetHeight: 1.88, label: 'Flagelante con Cadena' },
  skeleton: { id: 'skeleton', url: '/assets/models/skeleton.glb', targetHeight: 1.86, label: 'Penitente de la Cripta' },
  morwenna: { id: 'morwenna', url: '/assets/models/morwenna.glb', targetHeight: 2.25, label: 'Madre Morwenna' },
  inquisitor: { id: 'inquisitor', url: '/assets/models/inquisitor.glb', targetHeight: 2.18, label: 'El Inquisidor Caído' },
  root_prowler: { id: 'root_prowler', url: '/assets/models/root_prowler.glb', targetHeight: 1.65, label: 'Acechador de Raíces' },
  crucible_guardian: { id: 'crucible_guardian', url: '/assets/models/crucible_guardian.glb', targetHeight: 2.45, label: 'Guardián del Crisol' },
  captain_vane: { id: 'captain_vane', url: '/assets/models/captain_vane.glb', targetHeight: 2.30, label: 'Capitán Áureo Vane' },
  rex_malphas: { id: 'rex_malphas', url: '/assets/models/rex_malphas.glb', targetHeight: 2.35, label: 'Rex Malphas (Alaric)' },
  astaroth: { id: 'astaroth', url: '/assets/models/astaroth.glb', targetHeight: 4.20, label: 'Astaroth — Sol del Abismo' }
};

interface ActiveGlbInstance {
  slotId: CanonicalGlbSlotId;
  targetParent: THREE.Object3D;
  modelRoot: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  activeActionKey: string;
}

/**
 * Normalizes any loaded 3D scene/mesh so its bounding-box height equals `targetHeight`
 * and its lowest vertex rests cleanly on `y = 0`.
 */
export function normalizeAndGroundGlbModel(modelScene: THREE.Object3D, targetHeight: number): THREE.Group {
  const wrapper = new THREE.Group();
  wrapper.name = 'glb_normalized_root';

  const box = new THREE.Box3().setFromObject(modelScene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const rawHeight = Math.max(0.001, size.y);
  const scaleFactor = targetHeight / rawHeight;

  modelScene.scale.multiplyScalar(scaleFactor);

  // Recompute bounding box after scaling so feet rest at y = 0 and X/Z are centered
  const scaledBox = new THREE.Box3().setFromObject(modelScene);
  const scaledCenter = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);

  modelScene.position.x -= scaledCenter.x;
  modelScene.position.z -= scaledCenter.z;
  modelScene.position.y -= scaledBox.min.y;

  modelScene.traverse(child => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });

  wrapper.add(modelScene);
  return wrapper;
}

/**
 * Camino B: Complete GLTF / GLB 3D Character & Boss Model Pipeline.
 *
 * - Auto-discovers enabled `.glb` models from `/assets/models/manifest.json` (zero 404 console noise when empty).
 * - Supports live in-browser `.glb` file hot-swapping onto Thomas, Khaterine, or any Boss so 3D models
 *   can be previewed and played immediately.
 */
export class GothicModelLoader3D {
  private loader = new GLTFLoader();
  private bindings: Map<CanonicalGlbSlotId, THREE.Object3D> = new Map();
  private instances: Map<CanonicalGlbSlotId, ActiveGlbInstance> = new Map();

  public registerSlotTarget(slotId: CanonicalGlbSlotId, parentGroup: THREE.Object3D): void {
    this.bindings.set(slotId, parentGroup);
  }

  public hasLoadedGlb(slotId: CanonicalGlbSlotId): boolean {
    return this.instances.has(slotId);
  }

  public getLoadedSlotIds(): CanonicalGlbSlotId[] {
    return Array.from(this.instances.keys());
  }

  /**
   * Fetches `/assets/models/manifest.json` and loads every `.glb` slot listed in `enabledModels`.
   */
  public async autoLoadFromManifest(): Promise<CanonicalGlbSlotId[]> {
    if (typeof fetch === 'undefined') return [];
    try {
      const res = await fetch('/assets/models/manifest.json', { cache: 'no-cache' });
      if (!res.ok) return [];
      const data = await res.json();
      const enabled: unknown[] = Array.isArray(data?.enabledModels) ? data.enabledModels : [];
      const loaded: CanonicalGlbSlotId[] = [];

      for (const rawId of enabled) {
        if (typeof rawId === 'string' && rawId in CANONICAL_GLB_SLOTS) {
          const slotId = rawId as CanonicalGlbSlotId;
          const ok = await this.loadSlotFromUrl(slotId, CANONICAL_GLB_SLOTS[slotId].url);
          if (ok) loaded.push(slotId);
        }
      }
      return loaded;
    } catch {
      return [];
    }
  }

  public async loadSlotFromUrl(slotId: CanonicalGlbSlotId, url: string): Promise<boolean> {
    const parent = this.bindings.get(slotId);
    const def = CANONICAL_GLB_SLOTS[slotId];
    if (!parent || !def) return false;

    return new Promise<boolean>(resolve => {
      this.loader.load(
        url,
        (gltf: GLTF) => {
          this.mountGltfOnSlot(slotId, parent, gltf, def.targetHeight);
          resolve(true);
        },
        undefined,
        () => resolve(false)
      );
    });
  }

  /**
   * Parses a local `.glb` / `.gltf` file dropped or selected by the user in the browser
   * and hot-swaps it live onto the chosen character or boss slot.
   */
  public async loadSlotFromFile(slotId: CanonicalGlbSlotId, file: File): Promise<boolean> {
    const parent = this.bindings.get(slotId);
    const def = CANONICAL_GLB_SLOTS[slotId];
    if (!parent || !def) return false;

    const buffer = await file.arrayBuffer();
    return new Promise<boolean>(resolve => {
      this.loader.parse(
        buffer,
        '',
        (gltf: GLTF) => {
          this.mountGltfOnSlot(slotId, parent, gltf, def.targetHeight);
          resolve(true);
        },
        () => resolve(false)
      );
    });
  }

  private mountGltfOnSlot(
    slotId: CanonicalGlbSlotId,
    parent: THREE.Object3D,
    gltf: GLTF,
    targetHeight: number
  ): void {
    // Remove previous custom GLB instance if hot-swapping again
    const prev = this.instances.get(slotId);
    if (prev) {
      prev.mixer.stopAllAction();
      parent.remove(prev.modelRoot);
      this.instances.delete(slotId);
    }

    const normalizedRoot = normalizeAndGroundGlbModel(gltf.scene, targetHeight);
    normalizedRoot.name = `glb_instance_${slotId}`;

    // Hide procedural rig / billboard meshes while keeping lights and telegraph warning rings
    parent.children.forEach(child => {
      if ((child as THREE.Light).isLight) return;
      if (child.name && child.name.includes('Warning')) return;
      child.visible = false;
    });

    parent.add(normalizedRoot);

    const mixer = new THREE.AnimationMixer(normalizedRoot);
    const actions = new Map<string, THREE.AnimationAction>();

    for (const clip of gltf.animations || []) {
      const action = mixer.clipAction(clip);
      const lower = clip.name.toLowerCase();
      actions.set(lower, action);
      if (lower.includes('idle') || lower.includes('stand')) actions.set('idle', action);
      if (lower.includes('walk')) actions.set('walk', action);
      if (lower.includes('run') || lower.includes('sprint')) actions.set('run', action);
      if (lower.includes('attack') || lower.includes('slash') || lower.includes('shoot')) actions.set('attack', action);
      if (lower.includes('dodge') || lower.includes('roll')) actions.set('dodge', action);
      if (lower.includes('guard') || lower.includes('block')) actions.set('guard', action);
      if (lower.includes('death') || lower.includes('die')) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        actions.set('death', action);
      }
    }

    // Play idle or first available clip
    let initialKey = '';
    const idleAction = actions.get('idle') || (gltf.animations[0] ? mixer.clipAction(gltf.animations[0]) : undefined);
    if (idleAction) {
      idleAction.play();
      initialKey = 'idle';
    }

    this.instances.set(slotId, {
      slotId,
      targetParent: parent,
      modelRoot: normalizedRoot,
      mixer,
      actions,
      activeActionKey: initialKey
    });
  }

  public setClipState(slotId: CanonicalGlbSlotId, desiredState: 'idle' | 'walk' | 'run' | 'attack' | 'dodge' | 'guard' | 'death'): void {
    const inst = this.instances.get(slotId);
    if (!inst || inst.activeActionKey === desiredState) return;

    const nextAction =
      inst.actions.get(desiredState) ||
      (desiredState === 'run' ? inst.actions.get('walk') : undefined) ||
      inst.actions.get('idle');
    if (!nextAction) return;

    const currentAction = inst.actions.get(inst.activeActionKey);
    if (currentAction && currentAction !== nextAction) {
      currentAction.fadeOut(0.15);
    }
    nextAction.reset().fadeIn(0.15).play();
    inst.activeActionKey = desiredState;
  }

  public update(delta: number): void {
    for (const inst of this.instances.values()) {
      inst.mixer.update(delta);
    }
  }
}
