import * as THREE from 'three';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';
import { Inventory, CANONICAL_WILLOW_RELIC } from '../../domain/inventory/Inventory';
import { Progression } from '../../domain/progression/Progression';
import { HeroType } from '../../domain/progression/Skill';
import { GameSaveManager } from '../../infrastructure/storage/GameSaveManager';
import { Party } from '../../domain/party/Party';
import { HeroId, HERO_DEFINITIONS } from '../../domain/party/HeroCombatState';
import { MorwennaEncounter } from '../../domain/encounters/MorwennaEncounter';
import { AlchemyPot } from '../../domain/alchemy/AlchemyPot';
import { CANONICAL_MATERIALS } from '../../domain/alchemy/AlchemyRecipe';
import { DungeonAreaManager, DungeonArea } from '../../domain/encounters/DungeonAreaManager';
import { SpikeTrap } from '../../domain/encounters/SpikeTrap';
import { CatacombInquisitor } from '../../domain/encounters/CatacombInquisitor';
import { RootProwler } from '../../domain/encounters/RootProwler';
import { CrucibleGuardian, CaptainVane, RexMalphas, AstarothTitan } from '../../domain/encounters/ActBosses';
import { CanonChapterManager } from '../../domain/story/CanonChapterCompendium';
import { ArsenalManager, ArrowType } from '../../domain/combat/ArsenalManager';

export interface CombatStats3D {
  health: number;
  maxHealth: number;
  posture: number;
  maxPosture: number;
  isGuarding: boolean;
  isDodging: boolean;
  isArmed: boolean;
}

export interface Projectile3D {
  mesh: THREE.Group;
  light: THREE.PointLight;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  damage: number;
  isHeavy: boolean;
  arrowType?: ArrowType;
  isThrownFlask?: boolean;
}

export interface DestructibleProp3D {
  id: string;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  radius: number;
  isDestroyed: boolean;
  name: string;
}

export interface DebrisParticle3D {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  life: number;
  maxLife: number;
}

export type InputContext = 'gameplay' | 'dialogue' | 'inventory' | 'skillTree' | 'alchemy' | 'compendium' | 'defeated';

export class Oakhaven3DExperience {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock!: THREE.Clock;
  private audio: WebAudioSoundAdapter;

  // Inventory & Relics System
  private inventory: Inventory = Inventory.createDefault();
  private isInventoryOpen: boolean = false;
  private attackBuffMultiplier: number = 1.0;
  private attackBuffTimer: number = 0;

  // Alchemy & Apothecary System (Elowen's Cauldron)
  private alchemyPot: AlchemyPot = new AlchemyPot();
  private isAlchemyOpen: boolean = false;
  private alchemyModalEl?: HTMLDivElement;
  private cauldronGroup!: THREE.Group;
  private cauldronLight!: THREE.PointLight;
  private cauldronVapors: { mesh: THREE.Mesh; basePos: THREE.Vector3; speed: number; phase: number }[] = [];

  // Camera & View Settings (OpenLara & Vice City Architecture)
  private cameraMode: 'isometric' | 'third_person' = 'isometric';
  private targetCameraPos = new THREE.Vector3();
  private targetCameraLook = new THREE.Vector3();
  private currentCameraLook = new THREE.Vector3(0, 1.4, 4);
  private cameraYaw: number = 0;
  private targetCameraYaw: number = 0;
  private isPointerDragging: boolean = false;
  private pointerDragStartX: number = 0;
  private lastManualOrbitTime: number = 0;

  // Dual Hero System (Thomas & Khaterine)
  public get activeHero(): 'thomas' | 'khaterine' {
    return (this.party.getActiveHeroId() === 'khaterine' ? 'khaterine' : 'thomas');
  }
  private playerGroup!: THREE.Group;
  private playerBody!: THREE.Mesh;
  private thomasModelGroup!: THREE.Group;
  private khaterineModelGroup!: THREE.Group;
  private khaterineBowMesh!: THREE.Group;
  private wardBarrierMesh!: THREE.Mesh;
  private thomasNpcGroup!: THREE.Group;
  private playerSwordMesh!: THREE.Group;
  private playerFistsGroup!: THREE.Group;
  private playerLight!: THREE.PointLight;
  public party: Party = new Party('thomas');
  public morwennaEncounter: MorwennaEncounter = new MorwennaEncounter(280);

  public get playerStats(): CombatStats3D {
    const active = this.party.getActiveHero();
    const id = this.party.getActiveHeroId();
    const bonusHp = this.progression && (id === 'thomas' || id === 'khaterine')
      ? this.progression.getMaxHealthBonus(id as HeroType)
      : 0;
    return {
      get health() { return active.health; },
      set health(v: number) { active.health = v; },
      get maxHealth() { return HERO_DEFINITIONS[id].baseMaxHealth + bonusHp; },
      set maxHealth(_v: number) {},
      get posture() { return active.posture; },
      set posture(v: number) { active.posture = v; },
      get maxPosture() { return HERO_DEFINITIONS[id].baseMaxPosture; },
      set maxPosture(_v: number) {},
      get isGuarding() { return active.isGuarding; },
      set isGuarding(v: boolean) { active.isGuarding = v; },
      get isDodging() { return active.isDodging; },
      set isDodging(v: boolean) { active.isDodging = v; },
      get isArmed() { return active.isArmed; },
      set isArmed(v: boolean) { active.isArmed = v; }
    };
  }
  private playerVelocity = new THREE.Vector3();
  private isPlayerAttacking: boolean = false;
  private attackCooldown: number = 0;
  private dodgeTimer: number = 0;
  private lastGuardTime: number = 0;

  // Dropped Sword in 3D
  private droppedSwordGroup?: THREE.Group;
  private droppedSwordLight?: THREE.PointLight;

  // Abyssal Ranged Projectiles & Destructible Environment
  private projectiles: Projectile3D[] = [];
  private destructibles: DestructibleProp3D[] = [];
  private debrisParticles: DebrisParticle3D[] = [];

  // Enemy 1: Ash Prowler (Sabueso de Ceniza con Patrulla)
  private enemyGroup!: THREE.Group;
  private enemyHealth: number = 120;
  private enemyMaxHealth: number = 120;
  private enemyState: 'PATROL' | 'ALERT' | 'CHASE' | 'WINDUP' | 'ATTACK' | 'RECOVERY' | 'STUNNED' | 'DEAD' | 'RETURNING' = 'PATROL';
  private enemyTimer: number = 0;
  private enemyWarningMesh!: THREE.Mesh;
  private enemyHpBarContainer!: HTMLDivElement;
  private enemyHpBarFill!: HTMLDivElement;
  private enemyWaypoints: THREE.Vector3[] = [new THREE.Vector3(-1.2, 0, -4.5), new THREE.Vector3(1.2, 0, -9.5)];
  private enemyCurrentWaypointIndex: number = 0;

  // Enemy 2: Censer Bearer Cultist (Cultista del Incensario con Patrulla)
  private cultistGroup!: THREE.Group;
  private cultistHealth: number = 90;
  private cultistMaxHealth: number = 90;
  private cultistState: 'PATROL' | 'ALERT' | 'CHASE' | 'WINDUP' | 'ATTACK' | 'RECOVERY' | 'STUNNED' | 'DEAD' | 'RETURNING' = 'PATROL';
  private cultistTimer: number = 0;
  private cultistWarningMesh!: THREE.Mesh;
  private cultistCenserMesh!: THREE.Group;
  private cultistCenserLight!: THREE.PointLight;
  private cultistWaypoints: THREE.Vector3[] = [new THREE.Vector3(-2.4, 0, -11.0), new THREE.Vector3(2.4, 0, -15.0)];
  private cultistCurrentWaypointIndex: number = 0;
  private cultistHpBarContainer?: HTMLDivElement;
  private cultistHpBarFill?: HTMLDivElement;

  // Enemy 3: Chain Zealot Flagellant (Flagelante con Cadena y Mangual)
  private zealotGroup!: THREE.Group;
  private zealotHealth: number = 130;
  private zealotMaxHealth: number = 130;
  private zealotState: 'PATROL' | 'ALERT' | 'CHASE' | 'WINDUP' | 'ATTACK' | 'RECOVERY' | 'STUNNED' | 'DEAD' | 'RETURNING' = 'PATROL';
  private zealotTimer: number = 0;
  private zealotWarningMesh!: THREE.Mesh;
  private zealotChainGroup!: THREE.Group;
  private zealotFlailBallMesh!: THREE.Mesh;
  private zealotWaypoints: THREE.Vector3[] = [new THREE.Vector3(-2.8, 0, -16.0), new THREE.Vector3(2.8, 0, -19.5)];
  private zealotCurrentWaypointIndex: number = 0;
  private zealotHpBarContainer?: HTMLDivElement;
  private zealotHpBarFill?: HTMLDivElement;

  // Progression & Skill Tree System
  private progression: Progression = Progression.createDefault();
  private isSkillTreeOpen: boolean = false;
  private skillTreeModalEl?: HTMLDivElement;

  // Sanctuary Checkpoint Altar Light
  private sanctuaryCrossLight?: THREE.PointLight;

  // Shalem 3D (Gato Guía)
  private shalemGroup!: THREE.Group;
  private shalemTail!: THREE.Mesh;
  private shalemSpoke: boolean = false;

  // Interactive Characters 3D (Elowen, Cedric, Khaterine, Thomas NPC)
  private elowenGroup!: THREE.Group;
  private elowenLight!: THREE.PointLight;
  private hasTalkedToElowen3D: boolean = false;

  private cedricGroup!: THREE.Group;
  private cedricLanternLight!: THREE.PointLight;
  private hasTalkedToCedric3D: boolean = false;

  private khaterineGroup!: THREE.Group;
  private hasTalkedToKhaterine3D: boolean = false;
  private hasTalkedToThomas3D: boolean = false;

  // Boss 3D (Madre Morwenna en la Gran Pira & Fase 2 Desatada)
  private morwennaGroup!: THREE.Group;
  private morwennaHealth: number = 280;
  private morwennaMaxHealth: number = 280;
  private morwennaPhase: 1 | 2 = 1;
  private morwennaState:
    | 'DORMANT'
    | 'CHASE'
    | 'WINDUP'
    | 'ATTACK'
    | 'RECOVERY'
    | 'STUNNED'
    | 'PHASE2_TRANSITION'
    | 'DEAD' = 'DORMANT';
  private morwennaTimer: number = 0;
  private morwennaCrucibleLight!: THREE.PointLight;
  private morwennaWarningMesh!: THREE.Mesh;
  private morwennaHpBarContainer?: HTMLDivElement;
  private morwennaHpBarFill?: HTMLDivElement;
  private morwennaFlameWingsGroup?: THREE.Group;
  private morwennaFlameSwordMesh?: THREE.Mesh;
  private morwennaThornHaloMesh?: THREE.Mesh;
  private morwennaEyeL!: THREE.Mesh;
  private morwennaEyeR!: THREE.Mesh;
  private morwennaAttackPattern: 'CRUCIBLE_STRIKE' | 'WHIRLWIND' | 'FLAME_GEYSERS' | 'LUNGE' = 'CRUCIBLE_STRIKE';
  private flameGeysers: Array<{ markerMesh: THREE.Mesh; pillarMesh: THREE.Mesh; pos: THREE.Vector3; timer: number; hasErupted: boolean }> = [];

  // Cemetery & Crypts Expansion (North of Pyre)
  private cemeteryGateLeft!: THREE.Group;
  private cemeteryGateRight!: THREE.Group;
  private cemeteryGateOpen: boolean = false;

  // Enemy 4: Crypt Penitent (Penitente de la Cripta)
  private skeletonGroup!: THREE.Group;
  private skeletonHealth: number = 130;
  private skeletonMaxHealth: number = 130;
  private skeletonState: 'PATROL' | 'ALERT' | 'CHASE' | 'WINDUP' | 'ATTACK' | 'RECOVERY' | 'STUNNED' | 'DEAD' = 'PATROL';
  private skeletonTimer: number = 0;
  private skeletonWarningMesh!: THREE.Mesh;
  private skeletonWaypoints: THREE.Vector3[] = [];
  private skeletonCurrentWaypointIndex: number = 0;
  private skeletonHpBarContainer?: HTMLDivElement;
  private skeletonHpBarFill?: HTMLDivElement;
  private skeletonSwordMesh!: THREE.Mesh;

  // Subterranean Crypts (Dungeon Crawler Expansion)
  private dungeonAreaManager: DungeonAreaManager = new DungeonAreaManager();
  private spikeTraps: { trap: SpikeTrap; meshGroup: THREE.Group; spikeMeshes: THREE.Mesh[] }[] = [];
  private inquisitorEncounter: CatacombInquisitor = new CatacombInquisitor();
  private inquisitorGroup!: THREE.Group;
  private inquisitorHpBarContainer?: HTMLDivElement;
  private inquisitorHpBarFill?: HTMLDivElement;
  private inquisitorWarningMesh!: THREE.Mesh;
  private inquisitorSlamTelegraphMesh!: THREE.Mesh;
  private inquisitorTimer: number = 0;
  private inquisitorSpecialCooldown: number = 4.0;
  private cryptInteriorGroup!: THREE.Group;
  private cryptSarcophagusLootGroup!: THREE.Group;
  private cryptSarcophagusAmbushGroup!: THREE.Group;
  private cryptAmbushSkeletonGroup!: THREE.Group;
  private cryptAmbushAwakened: boolean = false;
  private cryptAmbushDead: boolean = false;
  private cryptAmbushHp: number = 70;
  private cryptAmbushTimer: number = 0;
  private isZoneTransitioning: boolean = false;
  private zoneTransitionOverlay?: HTMLDivElement;
  private zoneTitleEl?: HTMLDivElement;
  private zoneSubtitleEl?: HTMLDivElement;

  // Black Willow Forest & Root Prowler (Zone 3 Expansion)
  private rootProwlerEncounter: RootProwler = new RootProwler();
  private rootProwlerGroup!: THREE.Group;
  private rootProwlerHpBarContainer?: HTMLDivElement;
  private rootProwlerHpBarFill?: HTMLDivElement;
  private rootProwlerWarningMesh!: THREE.Mesh;
  private rootProwlerEyesLight!: THREE.PointLight;
  private rootProwlerTimer: number = 0;
  private rootProwlerPatrolDir: number = 1;
  private blackWillowForestGroup!: THREE.Group;
  private willowSporesPoints!: THREE.Points;
  private willowRelicMeshGroup!: THREE.Group;
  private sisterAltarGroup!: THREE.Group;
  private daggerVortexMeshGroup!: THREE.Group;
  private isDaggerVortexActive: boolean = false;
  private daggerVortexTimer: number = 0;
  private daggerVortexCooldown: number = 0;

  // Canonical 20-Chapter Compendium System
  private canonChapterManager: CanonChapterManager = new CanonChapterManager();
  private compendiumModalEl?: HTMLDivElement;
  private isCompendiumOpen: boolean = false;
  private currentCanonChapterId: number = 1;

  // Act II: Campanario del Sur & Guardián del Crisol
  private belltowerGroup!: THREE.Group;
  private crucibleGuardianEncounter: CrucibleGuardian = new CrucibleGuardian();
  private crucibleGuardianGroup!: THREE.Group;
  private crucibleHpBarContainer?: HTMLDivElement;
  private crucibleHpBarFill?: HTMLDivElement;
  private crucibleTimer: number = 0;
  private crucibleWarningMesh?: THREE.Mesh;
  private willowBirdMesh?: THREE.Group;
  private crucibleSlagLight?: THREE.PointLight;

  // Act III: Gran Puente de Piedra & Capitán Áureo Vane
  private greatStoneBridgeGroup!: THREE.Group;
  private captainVaneEncounter: CaptainVane = new CaptainVane();
  private captainVaneGroup!: THREE.Group;
  private vaneHpBarContainer?: HTMLDivElement;
  private vaneHpBarFill?: HTMLDivElement;
  private vaneTimer: number = 0;
  private vaneWarningMesh?: THREE.Mesh;
  private vaneShieldMesh?: THREE.Mesh;

  // Act IV: Londinium & Rex Malphas (Alaric)
  private londiniumCitadelGroup!: THREE.Group;
  private rexMalphasEncounter: RexMalphas = new RexMalphas();
  private rexMalphasGroup!: THREE.Group;
  private malphasHpBarContainer?: HTMLDivElement;
  private malphasHpBarFill?: HTMLDivElement;
  private malphasTimer: number = 0;
  private malphasWarningMesh?: THREE.Mesh;
  private malphasWarpRingMesh?: THREE.Mesh;

  // Act V: La Catedral Invertida & Astaroth (Sol del Abismo)
  private invertedCathedralGroup!: THREE.Group;
  private astarothEncounter: AstarothTitan = new AstarothTitan();
  private astarothGroup!: THREE.Group;
  private astarothHpBarContainer?: HTMLDivElement;
  private astarothHpBarFill?: HTMLDivElement;
  private astarothTimer: number = 0;
  private astarothWarningMesh?: THREE.Mesh;
  private astarothCoreLight?: THREE.PointLight;
  private astarothCoronaMesh?: THREE.Mesh;
  private dawnGreyTearMesh?: THREE.Mesh;
  private albaGrisBladeMesh?: THREE.Group;
  private hasForgedAlbaGris: boolean = false;
  private hasCollectedWillowBird: boolean = false;
  private hasFreedRefugees: boolean = false;
  private hasClearedMirrorGallery: boolean = false;

  // 3D Proximity Interactions & Modals
  private activeInteractTarget?: 'elowen' | 'cauldron' | 'cedric' | 'shalem' | 'khaterine' | 'thomas' | 'sword' | 'finisher' | 'cemetery_gate' | 'crypt_entrance' | 'crypt_exit' | 'crypt_sarcophagus_loot' | 'crypt_sarcophagus_ambush' | 'crypt_to_forest' | 'forest_to_crypt' | 'sister_altar' | 'forest_to_belltower' | 'belltower_to_forest' | 'elowen_cell' | 'crucible_furnace' | 'belltower_to_bridge' | 'refugees_cart' | 'vane_gate' | 'mirror_gallery' | 'astral_throne' | 'dawn_grey_altar' | 'black_sun_core';
  private proximityBadgeEl?: HTMLDivElement;
  private dialogueModalEl?: HTMLDivElement;
  private inventoryModalEl?: HTMLDivElement;
  private isDialogueOpen: boolean = false;
  private isPlayerDefeated: boolean = false;

  // Arsenal & Munitions Manager
  private arsenalManager: ArsenalManager = new ArsenalManager();
  private activeBurnEffects: Array<{ targetId: string; ticksLeft: number; dmgPerTick: number; timer: number }> = [];

  // Dynamic Screen Effects (Damage Vignette, Holy Flash, Screen Trauma)
  private damageVignetteEl?: HTMLDivElement;
  private holyFlashEl?: HTMLDivElement;
  private damageVignetteOpacity: number = 0;
  private holyFlashOpacity: number = 0;
  private screenTrauma: number = 0;
  private lastHeartbeatTime: number = 0;

  // Environment & Lights
  private streetLamps: { light: THREE.PointLight; mesh: THREE.Mesh; baseIntensity: number }[] = [];
  private embersParticles!: THREE.Points;

  // Input states
  private keys: { [key: string]: boolean } = {};
  private isRunning: boolean = false;
  private animationFrameId?: number;

  // Floating Damage Numbers
  private floatingTexts: { el: HTMLDivElement; pos: THREE.Vector3; life: number; maxLife: number }[] = [];

  // UI Overlays
  private uiOverlay!: HTMLDivElement;
  private onExitCallback?: () => void;

  constructor(container: HTMLElement, onExit?: () => void) {
    this.container = container;
    this.onExitCallback = onExit;
    this.audio = WebAudioSoundAdapter.getInstance();
  }

  public init(): void {
    this.clock = new THREE.Clock();

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06040b);
    this.scene.fog = new THREE.FogExp2(0x0a0614, 0.045);

    // 2. Camera (oblique 3/4 isometric by default)
    const aspect = this.container.clientWidth / this.container.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 100);
    this.camera.position.set(0, 7.5, 9);

    // 3. Renderer with antialiasing and shadow maps
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Build Environment & World
    this.createLighting();
    this.createStreetEnvironment();
    this.createSceneryProps();
    this.createEmbers();

    // 5. Build Characters & Allies
    this.createPlayer();
    this.createEnemy();
    this.createCultistEnemy();
    this.createZealotEnemy();
    this.createShalem();
    this.createElowen();
    this.createAlchemyCauldron();
    this.createCedric();
    this.createKhaterine();
    this.createThomasNPC();
    this.createBossMorwenna();
    this.createCemeteryAndCrypts();
    this.createSkeletonEnemy();
    this.createCryptInterior();
    this.createInquisitorBoss();
    this.createCryptAmbushSkeleton();
    this.createBlackWillowForest();
    this.createRootProwlerBeast();
    this.createDaggerVortexMesh();

    // Acts II - V Canonical Expansions
    this.createBelltowerAct2();
    this.createCrucibleGuardianBoss();
    this.createGreatStoneBridgeAct3();
    this.createCaptainVaneBoss();
    this.createLondiniumCitadelAct4();
    this.createRexMalphasBoss();
    this.createInvertedCathedralAct5();
    this.createAstarothBoss();

    // 6. Build 3D UI Overlay
    this.createUIOverlay();
    this.loadSavedSanctuaryState();

    // 7. Bind Inputs
    this.bindInputs();

    // 8. Start Atmospheric BGM
    this.audio.playBgm('bgm_oakhaven_night');

    this.isRunning = true;
    this.animate();
  }

  // =========================================================================
  // LIGHTING & ATMOSPHERE
  // =========================================================================
  private createLighting(): void {
    // Dim ambient moon/abyss light
    const ambient = new THREE.AmbientLight(0x231a38, 1.2);
    this.scene.add(ambient);

    // Moon Directional Light casting long shadows
    const moonLight = new THREE.DirectionalLight(0x738cb8, 1.8);
    moonLight.position.set(-15, 22, -10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 50;
    moonLight.shadow.camera.left = -18;
    moonLight.shadow.camera.right = 18;
    moonLight.shadow.camera.top = 18;
    moonLight.shadow.camera.bottom = -18;
    moonLight.shadow.bias = -0.0005;
    this.scene.add(moonLight);

    // Great Pyre at the end of the street (Z = -22)
    const pyreLight = new THREE.PointLight(0xff5511, 4.5, 28);
    pyreLight.position.set(0, 3, -22);
    this.scene.add(pyreLight);

    // Pyre mesh (glowing fire pit)
    const pyreGeo = new THREE.CylinderGeometry(2, 2.6, 1.5, 8);
    const pyreMat = new THREE.MeshStandardMaterial({ color: 0x1a0d0a, roughness: 0.9 });
    const pyreMesh = new THREE.Mesh(pyreGeo, pyreMat);
    pyreMesh.position.set(0, 0.75, -22);
    pyreMesh.castShadow = true;
    pyreMesh.receiveShadow = true;
    this.scene.add(pyreMesh);

    const flameCore = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.2),
      new THREE.MeshBasicMaterial({ color: 0xff8811 })
    );
    flameCore.position.set(0, 2.2, -22);
    this.scene.add(flameCore);
  }

  // =========================================================================
  // STREET ENVIRONMENT (OAKHAVEN COBBLESTONES & COTTAGES)
  // =========================================================================
  private createStreetEnvironment(): void {
    // 1. Cobblestone Ground with procedural texture canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#141219';
    ctx.fillRect(0, 0, 512, 512);

    // Stone tiles pattern
    ctx.strokeStyle = '#272233';
    ctx.lineWidth = 3;
    const tileSize = 64;
    for (let y = 0; y < 512; y += tileSize) {
      const offsetX = (y / tileSize) % 2 === 0 ? 0 : 32;
      for (let x = -32; x < 544; x += tileSize) {
        ctx.fillStyle = (x + y) % 128 === 0 ? '#1a1722' : '#110f17';
        ctx.fillRect(x + offsetX + 2, y + 2, tileSize - 4, tileSize - 4);
        ctx.strokeRect(x + offsetX, y, tileSize, tileSize);
      }
    }

    const groundTex = new THREE.CanvasTexture(canvas);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(6, 18);

    const groundGeo = new THREE.PlaneGeometry(16, 50);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.85,
      metalness: 0.15
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -2);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Gothic Wooden & Stone Houses along the street
    const houseMat = new THREE.MeshStandardMaterial({ color: 0x191424, roughness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f0b17, roughness: 0.7 });
    const woodTrimMat = new THREE.MeshStandardMaterial({ color: 0x3d2919, roughness: 0.8 });
    const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xff9933 });

    for (let z = 12; z >= -24; z -= 7) {
      [-7.5, 7.5].forEach(sideX => {
        const houseGroup = new THREE.Group();
        houseGroup.position.set(sideX, 0, z);

        // Main body
        const hBody = new THREE.Mesh(new THREE.BoxGeometry(4.5, 5, 5.5), houseMat);
        hBody.position.y = 2.5;
        hBody.castShadow = true;
        hBody.receiveShadow = true;
        houseGroup.add(hBody);

        // Gabled Roof
        const hRoof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 2.5, 4), roofMat);
        hRoof.position.y = 6.2;
        hRoof.rotation.y = Math.PI / 4;
        hRoof.castShadow = true;
        houseGroup.add(hRoof);

        // Wooden beams
        const beam = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.3, 0.3), woodTrimMat);
        beam.position.set(0, 2.5, sideX < 0 ? 2.8 : -2.8);
        houseGroup.add(beam);

        // Glowing small window facing the street
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.1), windowGlowMat);
        win.position.set(sideX < 0 ? 2.3 : -2.3, 3.2, 0);
        win.rotation.y = sideX < 0 ? Math.PI / 2 : -Math.PI / 2;
        houseGroup.add(win);

        this.scene.add(houseGroup);
      });
    }

    // 3. Street Oil Lanterns with flickering point lights
    [-4.5, 4.5].forEach(lampX => {
      [6, -4, -14].forEach(lampZ => {
        this.createStreetLamp(lampX, lampZ);
      });
    });
  }

  private createStreetLamp(x: number, z: number): void {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, 0, z);

    // Iron post
    const postMat = new THREE.MeshStandardMaterial({ color: 0x22222b, metalness: 0.7, roughness: 0.4 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 3.5, 8), postMat);
    post.position.y = 1.75;
    post.castShadow = true;
    lampGroup.add(post);

    // Lantern cage
    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.4), new THREE.MeshBasicMaterial({ color: 0xffaa33 }));
    cage.position.y = 3.5;
    lampGroup.add(cage);

    // Warm flickering light
    const lampLight = new THREE.PointLight(0xff9922, 2.2, 10);
    lampLight.position.set(0, 3.5, 0);
    lampLight.castShadow = true;
    lampLight.shadow.bias = -0.001;
    lampGroup.add(lampLight);

    this.streetLamps.push({ light: lampLight, mesh: cage, baseIntensity: 2.2 });
    this.scene.add(lampGroup);
  }

  // =========================================================================
  // SCENERY PROPS (VILLAGE SHRINE, BARRELS, WELL ROOF)
  // =========================================================================
  private createSceneryProps(): void {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.85 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x24202e, roughness: 0.9 });
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xe8dfc8, roughness: 0.5 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8822 });

    // 1. Village Shrine & Wooden Cross by Father Cedric (x: -4.2, z: 5.5)
    const shrineGroup = new THREE.Group();
    shrineGroup.position.set(-4.2, 0, 5.5);

    const shrineBase = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.4, 8), stoneMat);
    shrineBase.position.y = 0.2;
    shrineBase.castShadow = true;
    shrineBase.receiveShadow = true;
    shrineGroup.add(shrineBase);

    // Tall Cross
    const crossVert = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.18), woodMat);
    crossVert.position.y = 1.4;
    crossVert.castShadow = true;
    shrineGroup.add(crossVert);

    const crossHoriz = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.18), woodMat);
    crossHoriz.position.y = 2.0;
    crossHoriz.castShadow = true;
    shrineGroup.add(crossHoriz);

    // Votive Candles with glowing point light
    [-0.35, 0, 0.35].forEach((cx, idx) => {
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16 + idx * 0.04, 6), candleMat);
      candle.position.set(cx, 0.48, 0.2);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.035, 4, 4), flameMat);
      flame.position.set(cx, 0.58 + idx * 0.04, 0.2);
      shrineGroup.add(candle, flame);
    });

    const shrineLight = new THREE.PointLight(0xff9922, 1.2, 4);
    shrineLight.position.set(0, 1.0, 0.3);
    shrineGroup.add(shrineLight);

    // Leaning ancient stone crosses in foggy ground
    const grave1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.1), stoneMat);
    grave1.position.set(-0.9, 0.4, -0.6);
    grave1.rotation.z = 0.18;
    grave1.castShadow = true;
    shrineGroup.add(grave1);

    this.scene.add(shrineGroup);

    // 2. Village Barrels & Crates beside cottages (Interactive Destructible Props)
    const barrelGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.9, 8);
    const crateGeo = new THREE.BoxGeometry(0.75, 0.75, 0.75);

    this.destructibles = [];

    // Left cluster (by Elowen's side)
    const b1 = new THREE.Mesh(barrelGeo, woodMat);
    b1.position.set(-4.8, 0.45, 1.8);
    b1.castShadow = true;
    b1.receiveShadow = true;
    this.scene.add(b1);
    this.destructibles.push({
      id: 'barrel-1',
      mesh: b1,
      position: b1.position,
      radius: 0.75,
      isDestroyed: false,
      name: 'Barril de Especias'
    });

    const c1 = new THREE.Mesh(crateGeo, woodMat);
    c1.position.set(-4.8, 0.38, 2.6);
    c1.castShadow = true;
    c1.receiveShadow = true;
    this.scene.add(c1);
    this.destructibles.push({
      id: 'crate-1',
      mesh: c1,
      position: c1.position,
      radius: 0.8,
      isDestroyed: false,
      name: 'Caja de Suministros'
    });

    // Right cluster (by well)
    const b2 = new THREE.Mesh(barrelGeo, woodMat);
    b2.position.set(4.8, 0.45, -0.5);
    b2.castShadow = true;
    b2.receiveShadow = true;
    this.scene.add(b2);
    this.destructibles.push({
      id: 'barrel-2',
      mesh: b2,
      position: b2.position,
      radius: 0.75,
      isDestroyed: false,
      name: 'Barril de Agua Bendita'
    });

    const b3 = new THREE.Mesh(barrelGeo, woodMat);
    b3.position.set(4.8, 0.45, 0.3);
    b3.castShadow = true;
    b3.receiveShadow = true;
    this.scene.add(b3);
    this.destructibles.push({
      id: 'barrel-3',
      mesh: b3,
      position: b3.position,
      radius: 0.75,
      isDestroyed: false,
      name: 'Barril de Papiro Antiguo'
    });

    const c2 = new THREE.Mesh(crateGeo, woodMat);
    c2.position.set(4.7, 0.38, -1.3);
    c2.castShadow = true;
    c2.receiveShadow = true;
    this.scene.add(c2);
    this.destructibles.push({
      id: 'crate-2',
      mesh: c2,
      position: c2.position,
      radius: 0.8,
      isDestroyed: false,
      name: 'Caja Parroquial'
    });

    // Mid-street clusters near Pyre plaza
    const b4 = new THREE.Mesh(barrelGeo, woodMat);
    b4.position.set(-4.2, 0.45, -11.5);
    b4.castShadow = true;
    this.scene.add(b4);
    this.destructibles.push({
      id: 'barrel-4',
      mesh: b4,
      position: b4.position,
      radius: 0.75,
      isDestroyed: false,
      name: 'Barril de Aceite de Lámpara'
    });

    const c3 = new THREE.Mesh(crateGeo, woodMat);
    c3.position.set(4.2, 0.38, -9.5);
    c3.castShadow = true;
    this.scene.add(c3);
    this.destructibles.push({
      id: 'crate-3',
      mesh: c3,
      position: c3.position,
      radius: 0.8,
      isDestroyed: false,
      name: 'Cofre de la Vigilia'
    });

    // 3. Shelter Roof over the Stone Well (where Shalem rests)
    const wellRoofGroup = new THREE.Group();
    wellRoofGroup.position.set(3.2, 0, 2);

    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 6), woodMat);
    post1.position.set(-0.6, 1.15, 0);
    const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 6), woodMat);
    post2.position.set(0.6, 1.15, 0);

    const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.55, 4), woodMat);
    wellRoof.position.y = 2.55;
    wellRoof.rotation.y = Math.PI / 4;
    wellRoof.castShadow = true;

    wellRoofGroup.add(post1, post2, wellRoof);
    this.scene.add(wellRoofGroup);
  }

  private createEmbers(): void {
    const count = 180;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = Math.random() * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 36 - 6;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xff6622,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.embersParticles = new THREE.Points(geo, mat);
    this.scene.add(this.embersParticles);
  }

  // =========================================================================
  // PLAYER 3D (DUAL HERO SYSTEM: THOMAS & KHATERINE)
  // =========================================================================
  private createPlayer(): void {
    this.playerGroup = new THREE.Group();
    this.playerGroup.position.set(0, 0, 4);

    // -----------------------------------------------------------------------
    // A. THOMAS THE ACOLYTE MODEL GROUP
    // -----------------------------------------------------------------------
    this.thomasModelGroup = new THREE.Group();

    const tunicMat = new THREE.MeshStandardMaterial({ color: 0x221a29, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9b38c, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.9 });
    const ashMarkMat = new THREE.MeshBasicMaterial({ color: 0x73299e });

    // Torso & Tunic
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.1, 8), tunicMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    this.thomasModelGroup.add(torso);
    this.playerBody = torso;

    // Ash Seal on Chest (Glowing purple/black rune)
    const ashSeal = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.25), ashMarkMat);
    ashSeal.position.set(0, 1.15, 0.36);
    this.thomasModelGroup.add(ashSeal);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), skinMat);
    head.position.y = 1.8;
    head.castShadow = true;
    this.thomasModelGroup.add(head);

    // Hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), hairMat);
    hair.position.set(0, 1.88, -0.04);
    this.thomasModelGroup.add(hair);

    // Scarf / Capelet
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0x3f1f47, roughness: 0.7 });
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.09, 6, 8), scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 1.6;
    this.thomasModelGroup.add(scarf);

    // Equipped Weapon: Short Sword with Dark Fire Runes
    this.playerSwordMesh = new THREE.Group();
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xdcd6eb,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x331044
    });
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0x4a3219, roughness: 0.6 });

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 0.02), bladeMat);
    blade.position.y = 0.55;
    blade.castShadow = true;
    this.playerSwordMesh.add(blade);

    const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.06), hiltMat);
    crossguard.position.y = 0.08;
    this.playerSwordMesh.add(crossguard);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6), hiltMat);
    handle.position.y = -0.05;
    this.playerSwordMesh.add(handle);

    this.playerSwordMesh.position.set(0.45, 0.9, 0.1);
    this.playerSwordMesh.rotation.set(0.3, 0, -0.2);
    this.thomasModelGroup.add(this.playerSwordMesh);

    // Unarmed Fists Group (Visible when disarmed)
    this.playerFistsGroup = new THREE.Group();
    const fistGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const fistMat = new THREE.MeshBasicMaterial({ color: 0xaa55ff });
    const leftFist = new THREE.Mesh(fistGeo, fistMat);
    leftFist.position.set(-0.35, 1.0, 0.3);
    const rightFist = new THREE.Mesh(fistGeo, fistMat);
    rightFist.position.set(0.35, 1.0, 0.3);
    this.playerFistsGroup.add(leftFist, rightFist);
    this.playerFistsGroup.visible = false;
    this.thomasModelGroup.add(this.playerFistsGroup);

    // Standard local forward convention: -Z. Primitives constructed facing +Z are rotated by PI.
    this.thomasModelGroup.rotation.y = Math.PI;
    this.playerGroup.add(this.thomasModelGroup);

    // -----------------------------------------------------------------------
    // B. KHATERINE THE OUTCAST MODEL GROUP (PLAYABLE HERO)
    // -----------------------------------------------------------------------
    this.khaterineModelGroup = new THREE.Group();

    const kRobeMat = new THREE.MeshStandardMaterial({ color: 0x1a0f26, roughness: 0.8 });
    const kVeilMat = new THREE.MeshStandardMaterial({ color: 0x11071c, roughness: 0.5 });
    const kSkinMat = new THREE.MeshStandardMaterial({ color: 0xe5ccbe, roughness: 0.5 });
    const kHairMat = new THREE.MeshStandardMaterial({ color: 0x14101a, roughness: 0.9 });
    const kBowWoodMat = new THREE.MeshStandardMaterial({ color: 0x2b1338, roughness: 0.4, metalness: 0.3 });
    const kGlowMat = new THREE.MeshBasicMaterial({ color: 0xcc66ff });

    // Khaterine Robe
    const kRobe = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.48, 1.3, 8), kRobeMat);
    kRobe.position.y = 0.65;
    kRobe.castShadow = true;
    this.khaterineModelGroup.add(kRobe);

    // Head & Dark Hair
    const kHead = new THREE.Mesh(new THREE.SphereGeometry(0.23, 8, 8), kSkinMat);
    kHead.position.y = 1.5;
    kHead.castShadow = true;
    this.khaterineModelGroup.add(kHead);

    const kHair = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), kHairMat);
    kHair.position.set(0, 1.54, -0.04);
    this.khaterineModelGroup.add(kHair);

    // Flowing Veil
    const kVeil = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.75, 8), kVeilMat);
    kVeil.position.set(0, 1.35, -0.05);
    this.khaterineModelGroup.add(kVeil);

    // Abyssal Bow held in hands
    this.khaterineBowMesh = new THREE.Group();
    const bowCurve = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 6, 16, Math.PI * 0.9), kBowWoodMat);
    bowCurve.rotation.z = Math.PI * 0.55;
    this.khaterineBowMesh.add(bowCurve);

    // Glowing Bow String
    const bowString = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.82, 4), kGlowMat);
    bowString.position.x = 0.04;
    this.khaterineBowMesh.add(bowString);

    this.khaterineBowMesh.position.set(0.35, 1.05, 0.25);
    this.khaterineBowMesh.rotation.set(0.2, -0.3, 0.2);
    this.khaterineModelGroup.add(this.khaterineBowMesh);

    // Standard local forward convention: -Z. Primitives constructed facing +Z are rotated by PI.
    this.khaterineModelGroup.rotation.y = Math.PI;
    this.khaterineModelGroup.visible = false;
    this.playerGroup.add(this.khaterineModelGroup);

    // -----------------------------------------------------------------------
    // C. ABYSSAL WARD BARRIER (VISIBLE DURING [L] GUARD WITH KHATERINE)
    // -----------------------------------------------------------------------
    const wardGeo = new THREE.SphereGeometry(1.25, 16, 16);
    const wardMat = new THREE.MeshStandardMaterial({
      color: 0xaa33ff,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      emissive: 0x6611aa
    });
    this.wardBarrierMesh = new THREE.Mesh(wardGeo, wardMat);
    this.wardBarrierMesh.position.y = 1.1;
    this.wardBarrierMesh.visible = false;
    this.playerGroup.add(this.wardBarrierMesh);

    // Soul Aura around active hero
    this.playerLight = new THREE.PointLight(0xaa44ff, 1.4, 4);
    this.playerLight.position.set(0, 1.4, 0);
    this.playerGroup.add(this.playerLight);

    this.scene.add(this.playerGroup);
  }

  // =========================================================================
  // THOMAS 3D NPC (VISIBLE WHEN PLAYING AS KHATERINE)
  // =========================================================================
  private createThomasNPC(): void {
    this.thomasNpcGroup = new THREE.Group();
    this.thomasNpcGroup.position.set(1.8, 0, 5.5);

    const tunicMat = new THREE.MeshStandardMaterial({ color: 0x221a29, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9b38c, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3219, roughness: 0.6 });

    // Torso & Tunic
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.1, 8), tunicMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    this.thomasNpcGroup.add(torso);

    // Head & Hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), skinMat);
    head.position.y = 1.8;
    this.thomasNpcGroup.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), hairMat);
    hair.position.set(0, 1.88, -0.04);
    this.thomasNpcGroup.add(hair);

    // Prayer scroll in hands
    const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), woodMat);
    scroll.position.set(0, 1.1, 0.3);
    scroll.rotation.z = Math.PI / 2;
    this.thomasNpcGroup.add(scroll);

    const tLight = new THREE.PointLight(0xffd700, 1.0, 3);
    tLight.position.set(0, 1.4, 0.2);
    this.thomasNpcGroup.add(tLight);

    // Turn toward road
    this.thomasNpcGroup.rotation.y = -Math.PI / 2;
    this.thomasNpcGroup.visible = false;
    this.scene.add(this.thomasNpcGroup);
  }

  // =========================================================================
  // ENEMY 1: ASH PROWLER 3D (SABUESO DE CENIZA CON PATRULLA)
  // =========================================================================
  private createEnemy(): void {
    this.enemyGroup = new THREE.Group();
    this.enemyGroup.position.copy(this.enemyWaypoints[0]);

    const houndMat = new THREE.MeshStandardMaterial({ color: 0x140d0d, roughness: 0.9 });
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

    // Quadruped Torso
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.65, 1.4), houndMat);
    body.position.y = 0.65;
    body.castShadow = true;
    this.enemyGroup.add(body);

    // Head with snout
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.6), houndMat);
    head.position.set(0, 0.85, 0.9);
    head.castShadow = true;
    this.enemyGroup.add(head);

    // Glowing Ember Eyes
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const eyeLeft = new THREE.Mesh(eyeGeo, emberMat);
    eyeLeft.position.set(-0.16, 0.95, 1.18);
    const eyeRight = new THREE.Mesh(eyeGeo, emberMat);
    eyeRight.position.set(0.16, 0.95, 1.18);
    this.enemyGroup.add(eyeLeft, eyeRight);

    // Glowing Spikes on Back
    const spikeGeo = new THREE.ConeGeometry(0.1, 0.35, 4);
    for (let i = -0.4; i <= 0.4; i += 0.28) {
      const spike = new THREE.Mesh(spikeGeo, emberMat);
      spike.position.set(0, 1.05, i);
      this.enemyGroup.add(spike);
    }

    // Telegraphed Warning Indicator (Floating Red ⚠️ Diamond above head)
    const warnGeo = new THREE.OctahedronGeometry(0.22);
    const warnMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    this.enemyWarningMesh = new THREE.Mesh(warnGeo, warnMat);
    this.enemyWarningMesh.position.set(0, 1.7, 0.5);
    this.enemyWarningMesh.visible = false;
    this.enemyGroup.add(this.enemyWarningMesh);

    this.scene.add(this.enemyGroup);
  }

  // =========================================================================
  // ENEMY 2: CENSER BEARER CULTIST 3D (CULTISTA DEL INCENSARIO CON PATRULLA)
  // =========================================================================
  private createCultistEnemy(): void {
    this.cultistGroup = new THREE.Group();
    this.cultistGroup.position.copy(this.cultistWaypoints[0]);

    const robeMat = new THREE.MeshStandardMaterial({ color: 0x1f142b, roughness: 0.85 });
    const cowlMat = new THREE.MeshStandardMaterial({ color: 0x160c22, roughness: 0.75 });
    const maskMat = new THREE.MeshStandardMaterial({ color: 0xd6c7ba, roughness: 0.6 });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x9c6536, metalness: 0.8, roughness: 0.3 });
    const censerFlameMat = new THREE.MeshBasicMaterial({ color: 0xff6611 });

    // Cultist Body / Robe
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.54, 1.45, 8), robeMat);
    robe.position.y = 0.72;
    robe.castShadow = true;
    this.cultistGroup.add(robe);

    // Pointed Hood Cowl
    const cowl = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.65, 4), cowlMat);
    cowl.position.set(0, 1.72, -0.05);
    cowl.rotation.y = Math.PI / 4;
    this.cultistGroup.add(cowl);

    // Ash Mask
    const mask = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), maskMat);
    mask.position.set(0, 1.48, 0.16);
    this.cultistGroup.add(mask);

    // Swinging Censer (Incensario con Cadena)
    this.cultistCenserMesh = new THREE.Group();
    this.cultistCenserMesh.position.set(0.48, 1.15, 0.25);

    // Chain links
    const chainMat = new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.8, roughness: 0.3 });
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.55, 4), chainMat);
    chain.position.y = -0.28;
    this.cultistCenserMesh.add(chain);

    // Bronze Censer Basin
    const censerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.28, 6), bronzeMat);
    censerBody.position.y = -0.58;
    censerBody.castShadow = true;
    this.cultistCenserMesh.add(censerBody);

    // Glowing Inner Flame & Smoke Core
    const flameCore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09), censerFlameMat);
    flameCore.position.y = -0.56;
    this.cultistCenserMesh.add(flameCore);

    this.cultistCenserLight = new THREE.PointLight(0xff6622, 2.0, 5);
    this.cultistCenserLight.position.y = -0.56;
    this.cultistCenserMesh.add(this.cultistCenserLight);

    this.cultistGroup.add(this.cultistCenserMesh);

    // Telegraphed Warning Octahedron above Cultist
    const warnGeo = new THREE.OctahedronGeometry(0.24);
    const warnMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    this.cultistWarningMesh = new THREE.Mesh(warnGeo, warnMat);
    this.cultistWarningMesh.position.set(0, 2.25, 0);
    this.cultistWarningMesh.visible = false;
    this.cultistGroup.add(this.cultistWarningMesh);

    this.scene.add(this.cultistGroup);
  }

  // =========================================================================
  // ENEMY 3: CHAIN ZEALOT FLAGELLANT 3D (FLAGELANTE CON CADENA Y MANGUAL)
  // =========================================================================
  private createZealotEnemy(): void {
    this.zealotGroup = new THREE.Group();
    this.zealotGroup.position.copy(this.zealotWaypoints[0]);

    const crimsonRobeMat = new THREE.MeshStandardMaterial({ color: 0x3d1015, roughness: 0.85 });
    const darkLeatherMat = new THREE.MeshStandardMaterial({ color: 0x1f1412, roughness: 0.9 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x666677, metalness: 0.85, roughness: 0.25 });
    const bandageMat = new THREE.MeshStandardMaterial({ color: 0xd8c8b8, roughness: 0.95 });

    // Lower Robe / Skirt
    const robeLower = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.25, 7), crimsonRobeMat);
    robeLower.position.y = 0.62;
    robeLower.castShadow = true;
    this.zealotGroup.add(robeLower);

    // Torso with iron straps
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.6, 0.3), darkLeatherMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    this.zealotGroup.add(torso);

    // Hood & Head
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.26, 7, 7), crimsonRobeMat);
    hood.position.set(0, 1.82, 0);
    this.zealotGroup.add(hood);

    // White Penitential Eye Bandages
    const bandage = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.18), bandageMat);
    bandage.position.set(0, 1.84, 0.18);
    this.zealotGroup.add(bandage);

    // Chain & Spiked Flail Ball Group
    this.zealotChainGroup = new THREE.Group();
    this.zealotChainGroup.position.set(0.5, 1.35, 0.2);

    // Chain links shaft
    const chainShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 5), ironMat);
    chainShaft.position.y = -0.55;
    this.zealotChainGroup.add(chainShaft);

    // Spiked Flail Ball
    this.zealotFlailBallMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18), ironMat);
    this.zealotFlailBallMesh.position.y = -1.15;
    this.zealotFlailBallMesh.castShadow = true;

    // Add 6 iron spikes to ball
    for (let i = 0; i < 6; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 4), ironMat);
      const angle = (i / 6) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 0.18, -1.15, Math.sin(angle) * 0.18);
      spike.rotation.z = Math.PI / 2;
      spike.rotation.y = angle;
      this.zealotChainGroup.add(spike);
    }
    this.zealotChainGroup.add(this.zealotFlailBallMesh);
    this.zealotGroup.add(this.zealotChainGroup);

    // Telegraphed Warning Octahedron above Zealot
    const warnGeo = new THREE.OctahedronGeometry(0.26);
    const warnMat = new THREE.MeshBasicMaterial({ color: 0xff1122 });
    this.zealotWarningMesh = new THREE.Mesh(warnGeo, warnMat);
    this.zealotWarningMesh.position.set(0, 2.35, 0);
    this.zealotWarningMesh.visible = false;
    this.zealotGroup.add(this.zealotWarningMesh);

    this.scene.add(this.zealotGroup);
  }

  // =========================================================================
  // SHALEM THE BLACK CAT 3D
  // =========================================================================
  private createShalem(): void {
    this.shalemGroup = new THREE.Group();
    // Sitting on a stone roadside well at (3.2, 0, 2)
    this.shalemGroup.position.set(3.2, 0, 2);

    // Stone Well Pedestal
    const wellMat = new THREE.MeshStandardMaterial({ color: 0x221c2e, roughness: 0.9 });
    const well = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 1.0, 8), wellMat);
    well.position.y = 0.5;
    well.castShadow = true;
    well.receiveShadow = true;
    this.shalemGroup.add(well);

    // Cat Body
    const catMat = new THREE.MeshStandardMaterial({ color: 0x08060b, roughness: 0.85 });
    const catEyesMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });

    const cBody = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), catMat);
    cBody.position.set(0, 1.25, 0);
    cBody.scale.set(0.9, 1.2, 0.9);
    cBody.castShadow = true;
    this.shalemGroup.add(cBody);

    const cHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), catMat);
    cHead.position.set(0, 1.55, 0.12);
    this.shalemGroup.add(cHead);

    // Cat Ears
    const earGeo = new THREE.ConeGeometry(0.08, 0.16, 4);
    const earL = new THREE.Mesh(earGeo, catMat);
    earL.position.set(-0.1, 1.74, 0.1);
    const earR = new THREE.Mesh(earGeo, catMat);
    earR.position.set(0.1, 1.74, 0.1);
    this.shalemGroup.add(earL, earR);

    // Gold Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, catEyesMat);
    eyeL.position.set(-0.07, 1.58, 0.28);
    const eyeR = new THREE.Mesh(eyeGeo, catEyesMat);
    eyeR.position.set(0.07, 1.58, 0.28);
    this.shalemGroup.add(eyeL, eyeR);

    // Curled Animated Tail
    const tailGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.45, 6);
    this.shalemTail = new THREE.Mesh(tailGeo, catMat);
    this.shalemTail.position.set(0, 1.15, -0.22);
    this.shalemTail.rotation.x = -Math.PI / 3;
    this.shalemGroup.add(this.shalemTail);

    this.scene.add(this.shalemGroup);
  }

  // =========================================================================
  // ELOWEN OF OAKHAVEN 3D (MAIDEN OF SILVER LIGHT)
  // =========================================================================
  private createElowen(): void {
    this.elowenGroup = new THREE.Group();
    this.elowenGroup.position.set(-3.2, 0, -1);

    const dressMat = new THREE.MeshStandardMaterial({ color: 0x3d4b6e, roughness: 0.75 });
    const apronMat = new THREE.MeshStandardMaterial({ color: 0xede8f5, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf2d6c4, roughness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 0.8 });

    // Flowing Dress
    const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.46, 1.25, 8), dressMat);
    dress.position.y = 0.62;
    dress.castShadow = true;
    this.elowenGroup.add(dress);

    // White Apron / Linen sash
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.75, 0.04), apronMat);
    apron.position.set(0, 0.65, 0.24);
    this.elowenGroup.add(apron);

    // Head & Hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), skinMat);
    head.position.y = 1.45;
    head.castShadow = true;
    this.elowenGroup.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), hairMat);
    hair.position.set(0, 1.5, -0.04);
    this.elowenGroup.add(hair);

    // Silver Headband / Diadem
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xddedff, metalness: 0.8, roughness: 0.2 });
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 6, 12), crownMat);
    crown.rotation.x = Math.PI / 2;
    crown.position.y = 1.55;
    this.elowenGroup.add(crown);

    // Wooden Bird in hands (pájaro de madera)
    const bird = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.15), woodMat);
    bird.position.set(0, 1.0, 0.3);
    bird.rotation.x = 0.2;
    this.elowenGroup.add(bird);

    // Divine Moonlight Silver Aura
    this.elowenLight = new THREE.PointLight(0xb5d4ff, 1.3, 4);
    this.elowenLight.position.set(0, 1.4, 0.2);
    this.elowenGroup.add(this.elowenLight);

    // Face toward street
    this.elowenGroup.rotation.y = Math.PI / 2;
    this.scene.add(this.elowenGroup);
  }

  // =========================================================================
  // ELOWEN'S ALCHEMY CAULDRON 3D (BOTICA & TRANSMUTACIÓN)
  // =========================================================================
  private createAlchemyCauldron(): void {
    this.cauldronGroup = new THREE.Group();
    this.cauldronGroup.position.set(-2.4, 0, -0.7);

    // Stone hearth base
    const stoneHearthMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.95 });
    const stoneHearth = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.12, 12), stoneHearthMat);
    stoneHearth.position.y = 0.06;
    stoneHearth.receiveShadow = true;
    this.cauldronGroup.add(stoneHearth);

    // Glowing ember coals
    const coalMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff4400,
      emissiveIntensity: 0.7,
      roughness: 0.8
    });
    const coals = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.08, 8), coalMat);
    coals.position.y = 0.12;
    this.cauldronGroup.add(coals);

    // Iron Tripod Legs
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f1f22, metalness: 0.85, roughness: 0.4 });
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.58, 6), ironMat);
      leg.position.set(Math.cos(angle) * 0.28, 0.28, Math.sin(angle) * 0.28);
      leg.rotation.z = Math.cos(angle) * 0.22;
      leg.rotation.x = -Math.sin(angle) * 0.22;
      leg.castShadow = true;
      this.cauldronGroup.add(leg);
    }

    // Bronze Cauldron Pot Body
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x5a4832,
      metalness: 0.65,
      roughness: 0.55
    });
    const potBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.26, 0.45, 12), bronzeMat);
    potBody.position.y = 0.42;
    potBody.castShadow = true;
    this.cauldronGroup.add(potBody);

    // Cauldron Rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 16), bronzeMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.64;
    this.cauldronGroup.add(rim);

    // Cauldron Handles
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x3d3224, metalness: 0.7, roughness: 0.5 });
    const handle1 = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 10), handleMat);
    handle1.position.set(0.44, 0.55, 0);
    this.cauldronGroup.add(handle1);
    const handle2 = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 10), handleMat);
    handle2.position.set(-0.44, 0.55, 0);
    this.cauldronGroup.add(handle2);

    // Simmering Emerald Liquid
    const liquidMat = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      emissive: 0x145a32,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.3
    });
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.02, 16), liquidMat);
    liquid.position.y = 0.58;
    this.cauldronGroup.add(liquid);

    // Pulsating Emerald Light
    this.cauldronLight = new THREE.PointLight(0x2ecc71, 1.8, 4.5);
    this.cauldronLight.position.set(0, 0.7, 0);
    this.cauldronGroup.add(this.cauldronLight);

    // Rising Vapor / Steam Meshes
    this.cauldronVapors = [];
    const vaporMat = new THREE.MeshBasicMaterial({
      color: 0x88ffcc,
      transparent: true,
      opacity: 0.35
    });
    for (let i = 0; i < 6; i++) {
      const vGeo = new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 6, 6);
      const vMesh = new THREE.Mesh(vGeo, vaporMat.clone());
      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * 0.35,
        0.65 + Math.random() * 0.4,
        (Math.random() - 0.5) * 0.35
      );
      vMesh.position.copy(basePos);
      this.cauldronGroup.add(vMesh);
      this.cauldronVapors.push({
        mesh: vMesh,
        basePos,
        speed: 0.4 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Apothecary Side Table with Phials
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x4a3219, roughness: 0.85 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.6, 0.4), tableMat);
    table.position.set(-0.65, 0.3, 0.1);
    table.castShadow = true;
    this.cauldronGroup.add(table);

    // Phials on table
    const glassColors = [0x2ecc71, 0x3498db, 0xe74c3c];
    for (let i = 0; i < 3; i++) {
      const phialMat = new THREE.MeshStandardMaterial({
        color: glassColors[i],
        emissive: glassColors[i],
        emissiveIntensity: 0.4,
        roughness: 0.2,
        transparent: true,
        opacity: 0.8
      });
      const phial = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.14, 6), phialMat);
      phial.position.set(-0.75 + i * 0.1, 0.67, 0.1);
      this.cauldronGroup.add(phial);
    }

    this.scene.add(this.cauldronGroup);
  }

  private updateCauldron(delta: number): void {
    if (!this.cauldronGroup) return;

    // Pulsate cauldron light
    const elapsed = this.clock.getElapsedTime();
    if (this.cauldronLight) {
      this.cauldronLight.intensity = 1.6 + Math.sin(elapsed * 5) * 0.4;
    }

    // Animate vapor puffs rising and resetting
    for (const v of this.cauldronVapors) {
      v.mesh.position.y += delta * v.speed;
      v.mesh.position.x = v.basePos.x + Math.sin(elapsed * 3 + v.phase) * 0.08;
      v.mesh.position.z = v.basePos.z + Math.cos(elapsed * 3 + v.phase) * 0.08;

      const scale = 1.0 + (v.mesh.position.y - v.basePos.y) * 1.5;
      v.mesh.scale.set(scale, scale, scale);

      const mat = v.mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, 0.4 - (v.mesh.position.y - v.basePos.y) * 0.5);
      }

      if (v.mesh.position.y > 1.4) {
        v.mesh.position.y = v.basePos.y;
        if (mat) mat.opacity = 0.35;
      }
    }
  }

  // =========================================================================
  // FATHER CEDRIC 3D (OLD DEVOUT PRIEST)
  // =========================================================================
  private createCedric(): void {
    this.cedricGroup = new THREE.Group();
    this.cedricGroup.position.set(-3.2, 0, 5.5);

    const habitMat = new THREE.MeshStandardMaterial({ color: 0x2c1f15, roughness: 0.9 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9b596, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xd2cbbf, roughness: 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.8 });
    const cordMat = new THREE.MeshStandardMaterial({ color: 0xe8dfd5, roughness: 0.6 });

    // Monk Robe
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.52, 1.35, 8), habitMat);
    robe.position.y = 0.68;
    robe.castShadow = true;
    this.cedricGroup.add(robe);

    // White Rope Belt (Cíngulo)
    const cord = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 6, 12), cordMat);
    cord.rotation.x = Math.PI / 2;
    cord.position.y = 0.8;
    this.cedricGroup.add(cord);

    // Head with Tonsure
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), skinMat);
    head.position.y = 1.55;
    head.castShadow = true;
    this.cedricGroup.add(head);

    const hairTonsure = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 6, 12), hairMat);
    hairTonsure.rotation.x = Math.PI / 2;
    hairTonsure.position.y = 1.6;
    this.cedricGroup.add(hairTonsure);

    // Long White Beard
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 6), hairMat);
    beard.rotation.x = -Math.PI;
    beard.position.set(0, 1.25, 0.16);
    this.cedricGroup.add(beard);

    // Wooden Staff with Hanging Oil Lantern
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.85, 6), woodMat);
    staff.position.set(0.42, 0.92, 0.2);
    this.cedricGroup.add(staff);

    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.16), new THREE.MeshBasicMaterial({ color: 0xffaa33 }));
    lantern.position.set(0.42, 1.55, 0.3);
    this.cedricGroup.add(lantern);

    this.cedricLanternLight = new THREE.PointLight(0xff9922, 1.8, 5);
    this.cedricLanternLight.position.set(0.42, 1.55, 0.3);
    this.cedricGroup.add(this.cedricLanternLight);

    // Stone Altar & Sanctuary Cross beacon beside Cedric
    const altarMat = new THREE.MeshStandardMaterial({ color: 0x241d2e, roughness: 0.85 });
    const altar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.5), altarMat);
    altar.position.set(0.95, 0.35, 0);
    this.cedricGroup.add(altar);

    const crossMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 });
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.04), crossMat);
    crossV.position.set(0.95, 0.96, 0);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.04), crossMat);
    crossH.position.set(0.95, 1.06, 0);
    this.cedricGroup.add(crossV, crossH);

    this.sanctuaryCrossLight = new THREE.PointLight(0xffd700, 2.2, 6);
    this.sanctuaryCrossLight.position.set(0.95, 1.15, 0);
    this.cedricGroup.add(this.sanctuaryCrossLight);

    // Face street
    this.cedricGroup.rotation.y = Math.PI / 2;
    this.scene.add(this.cedricGroup);
  }

  // =========================================================================
  // KHATERINE 3D (BLACK WILLOW OUTCAST)
  // =========================================================================
  private createKhaterine(): void {
    this.khaterineGroup = new THREE.Group();
    this.khaterineGroup.position.set(3.4, 0, 6.2);

    const robeMat = new THREE.MeshStandardMaterial({ color: 0x1f112e, roughness: 0.8 });
    const veilMat = new THREE.MeshStandardMaterial({ color: 0x140a1f, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0c4b2, roughness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1724, roughness: 0.9 });
    const bowMat = new THREE.MeshStandardMaterial({ color: 0x3d1c52, roughness: 0.4 });

    // Abyssal Robe
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.48, 1.3, 8), robeMat);
    robe.position.y = 0.65;
    robe.castShadow = true;
    this.khaterineGroup.add(robe);

    // Head & Dark Hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 8, 8), skinMat);
    head.position.y = 1.5;
    head.castShadow = true;
    this.khaterineGroup.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), hairMat);
    hair.position.set(0, 1.54, -0.04);
    this.khaterineGroup.add(hair);

    // Veil covering shoulders
    const veil = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.75, 8), veilMat);
    veil.position.set(0, 1.35, -0.05);
    this.khaterineGroup.add(veil);

    // Abyssal Bow strapped to back
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 6, 12, Math.PI * 0.85), bowMat);
    bow.position.set(-0.25, 1.05, -0.2);
    bow.rotation.set(0.4, 0.5, 0.8);
    this.khaterineGroup.add(bow);

    // Glowing Purple Rune Light
    const runeLight = new THREE.PointLight(0xa344ff, 1.2, 3.5);
    runeLight.position.set(0, 1.3, 0.2);
    this.khaterineGroup.add(runeLight);

    // Face street
    this.khaterineGroup.rotation.y = -Math.PI / 2;
    this.scene.add(this.khaterineGroup);
  }

  // =========================================================================
  // MOTHER MORWENNA 3D (VIGIL OF THE SACRED PYRE BOSS)
  // =========================================================================
  private createBossMorwenna(): void {
    this.morwennaGroup = new THREE.Group();
    this.morwennaGroup.position.set(0, 0, -18);

    const inquisitorRobeMat = new THREE.MeshStandardMaterial({ color: 0x3b0a12, roughness: 0.85 });
    const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x8c532b, metalness: 0.7, roughness: 0.4 });
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1122 });

    // Tall Imposing Robe
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.72, 1.65, 8), inquisitorRobeMat);
    robe.position.y = 0.82;
    robe.castShadow = true;
    this.morwennaGroup.add(robe);

    // Gold Trim Mantle
    const mantle = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.2, 0.55), goldTrimMat);
    mantle.position.y = 1.6;
    this.morwennaGroup.add(mantle);

    // High Ceremonial Cowl
    const cowl = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 4), inquisitorRobeMat);
    cowl.position.set(0, 2.15, -0.05);
    cowl.rotation.y = Math.PI / 4;
    cowl.castShadow = true;
    this.morwennaGroup.add(cowl);

    // Dark shrouded face with Glowing Ruby Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 4, 4), eyeMat);
    eyeL.position.set(-0.11, 1.72, 0.24);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 4, 4), eyeMat);
    eyeR.position.set(0.11, 1.72, 0.24);
    this.morwennaEyeL = eyeL;
    this.morwennaEyeR = eyeR;
    this.morwennaGroup.add(eyeL, eyeR);

    // Sacred Bronze Crucible (Crisol de Fuego Sagrado) held in hand
    const crucible = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.38, 8), bronzeMat);
    crucible.position.set(0.55, 1.05, 0.35);
    this.morwennaGroup.add(crucible);

    const flameCore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16), fireMat);
    flameCore.position.set(0.55, 1.25, 0.35);
    this.morwennaGroup.add(flameCore);

    this.morwennaCrucibleLight = new THREE.PointLight(0xff3300, 3.2, 9);
    this.morwennaCrucibleLight.position.set(0.55, 1.25, 0.35);
    this.morwennaGroup.add(this.morwennaCrucibleLight);

    // Phase 2: Blazing Wings of Ashes
    this.morwennaFlameWingsGroup = new THREE.Group();
    const wingMat = new THREE.MeshBasicMaterial({ color: 0xff3300, side: THREE.DoubleSide });
    const wingL = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 3), wingMat);
    wingL.position.set(-0.65, 1.3, -0.25);
    wingL.rotation.set(0.3, 0.4, 0.85);
    const wingR = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 3), wingMat);
    wingR.position.set(0.65, 1.3, -0.25);
    wingR.rotation.set(0.3, -0.4, -0.85);
    this.morwennaFlameWingsGroup.add(wingL, wingR);
    this.morwennaFlameWingsGroup.visible = false;
    this.morwennaGroup.add(this.morwennaFlameWingsGroup);

    // Phase 2: Blazing Executioner Greatsword
    const swordGroup = new THREE.Group();
    swordGroup.position.set(-0.6, 1.05, 0.35);
    swordGroup.rotation.set(0.2, 0, -0.3);
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.5, 0.05), bladeMat);
    blade.position.y = 0.65;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.08), goldTrimMat);
    guard.position.y = -0.05;
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 6), bronzeMat);
    hilt.position.y = -0.22;
    swordGroup.add(blade, guard, hilt);
    this.morwennaFlameSwordMesh = swordGroup as any;
    swordGroup.visible = false;
    this.morwennaGroup.add(swordGroup);

    // Phase 2: Halo of Fiery Thorns
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 2.65, -0.05);
    const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 6, 16), fireMat);
    haloRing.rotation.x = Math.PI / 2;
    haloGroup.add(haloRing);
    for (let i = 0; i < 6; i++) {
      const thorn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 4), goldTrimMat);
      const ang = (i / 6) * Math.PI * 2;
      thorn.position.set(Math.cos(ang) * 0.42, 0, Math.sin(ang) * 0.42);
      thorn.rotation.y = ang;
      haloGroup.add(thorn);
    }
    this.morwennaThornHaloMesh = haloGroup as any;
    haloGroup.visible = false;
    this.morwennaGroup.add(haloGroup);

    // Telegraphed Warning Octahedron above Morwenna
    const warnGeo = new THREE.OctahedronGeometry(0.28);
    const warnMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    this.morwennaWarningMesh = new THREE.Mesh(warnGeo, warnMat);
    this.morwennaWarningMesh.position.set(0, 2.8, 0);
    this.morwennaWarningMesh.visible = false;
    this.morwennaGroup.add(this.morwennaWarningMesh);

    this.scene.add(this.morwennaGroup);
  }

  // =========================================================================
  // CEMETERY & CRYPTS EXPANSION (NORTH OF OAKHAVEN PYRE)
  // =========================================================================
  private createCemeteryAndCrypts(): void {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1f1d26, roughness: 0.95 });
    const darkIronMat = new THREE.MeshStandardMaterial({ color: 0x111116, metalness: 0.85, roughness: 0.35 });
    const soulFlameMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

    // 1. Cemetery Ground (Extending from z: -23.5 to z: -48)
    const cemeteryGeo = new THREE.PlaneGeometry(16, 26);
    const cemeteryMat = new THREE.MeshStandardMaterial({ color: 0x0c0b11, roughness: 0.9 });
    const cemeteryGround = new THREE.Mesh(cemeteryGeo, cemeteryMat);
    cemeteryGround.rotation.x = -Math.PI / 2;
    cemeteryGround.position.set(0, 0.01, -36);
    cemeteryGround.receiveShadow = true;
    this.scene.add(cemeteryGround);

    // 2. Iron Cemetery Gate at z: -23.5
    // Left Stone Pillar
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.8, 0.8), stoneMat);
    pillarL.position.set(-2.8, 1.9, -23.5);
    pillarL.castShadow = true;
    this.scene.add(pillarL);

    // Right Stone Pillar
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.8, 0.8), stoneMat);
    pillarR.position.set(2.8, 1.9, -23.5);
    pillarR.castShadow = true;
    this.scene.add(pillarR);

    // Stone Crosses on top of pillars
    [-2.8, 2.8].forEach(px => {
      const cross = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), stoneMat);
      cross.position.set(px, 4.25, -23.5);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.16), stoneMat);
      crossH.position.set(px, 4.45, -23.5);
      this.scene.add(cross, crossH);
    });

    // Side Fences connecting to village borders
    const sideFenceL = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.4, 0.15), darkIronMat);
    sideFenceL.position.set(-5.4, 1.2, -23.5);
    const sideFenceR = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.4, 0.15), darkIronMat);
    sideFenceR.position.set(5.4, 1.2, -23.5);
    this.scene.add(sideFenceL, sideFenceR);

    // Swinging Gate Wings
    this.cemeteryGateLeft = new THREE.Group();
    this.cemeteryGateLeft.position.set(-2.4, 0, -23.5);
    const leftBars = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.8, 0.1), darkIronMat);
    leftBars.position.set(1.15, 1.4, 0);
    this.cemeteryGateLeft.add(leftBars);
    this.scene.add(this.cemeteryGateLeft);

    this.cemeteryGateRight = new THREE.Group();
    this.cemeteryGateRight.position.set(2.4, 0, -23.5);
    const rightBars = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.8, 0.1), darkIronMat);
    rightBars.position.set(-1.15, 1.4, 0);
    this.cemeteryGateRight.add(rightBars);
    this.scene.add(this.cemeteryGateRight);

    // 3. Destructible Gravestones in the Cemetery
    const graveGeo = new THREE.BoxGeometry(0.55, 0.95, 0.2);
    const gravePositions = [
      { id: 'grave-1', x: -3.2, z: -27.5, name: 'Lápida de Penitente de Oakhaven' },
      { id: 'grave-2', x: 3.5, z: -29.0, name: 'Lápida Devota de San Jude' },
      { id: 'grave-3', x: -2.8, z: -35.0, name: 'Lápida Antigua de los Proscritos' },
      { id: 'grave-4', x: 3.2, z: -37.5, name: 'Lápida Consagrada' }
    ];

    gravePositions.forEach(gp => {
      const grave = new THREE.Mesh(graveGeo, stoneMat);
      grave.position.set(gp.x, 0.48, gp.z);
      grave.rotation.y = (Math.random() - 0.5) * 0.4;
      grave.castShadow = true;
      this.scene.add(grave);
      this.destructibles.push({
        id: gp.id,
        mesh: grave,
        position: grave.position,
        radius: 0.75,
        isDestroyed: false,
        name: gp.name
      });
    });

    // Destructible Ancient Sarcophagus
    const sarcGeo = new THREE.BoxGeometry(1.2, 0.75, 2.2);
    const sarcMesh = new THREE.Mesh(sarcGeo, stoneMat);
    sarcMesh.position.set(0, 0.38, -33.5);
    sarcMesh.castShadow = true;
    this.scene.add(sarcMesh);
    this.destructibles.push({
      id: 'sarcophagus-1',
      mesh: sarcMesh,
      position: sarcMesh.position,
      radius: 1.2,
      isDestroyed: false,
      name: 'Sarcófago de Piedra de San Jude'
    });

    // 4. Spectral Soul Torches
    [-2.5, 2.5].forEach(tx => {
      const torchBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.2, 6), stoneMat);
      torchBase.position.set(tx, 0.6, -31);
      const flame = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14), soulFlameMat);
      flame.position.set(tx, 1.3, -31);
      const light = new THREE.PointLight(0x00e5ff, 2.2, 7);
      light.position.set(tx, 1.4, -31);
      this.scene.add(torchBase, flame, light);
    });

    // 5. Crypt Mausoleum Entrance at z: -45
    const cryptGroup = new THREE.Group();
    cryptGroup.position.set(0, 0, -45);

    const cryptArch = new THREE.Mesh(new THREE.BoxGeometry(7.5, 5.0, 2.5), stoneMat);
    cryptArch.position.y = 2.5;
    cryptArch.castShadow = true;
    cryptGroup.add(cryptArch);

    // Dark descending portal
    const portalMat = new THREE.MeshBasicMaterial({ color: 0x020408 });
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.4), portalMat);
    portal.position.set(0, 1.7, 1.26);
    cryptGroup.add(portal);

    // Crypt Soul Light from inside
    const cryptLight = new THREE.PointLight(0x00e5ff, 3.0, 9);
    cryptLight.position.set(0, 2.0, 0.5);
    cryptGroup.add(cryptLight);

    this.scene.add(cryptGroup);
  }

  // =========================================================================
  // ENEMY 4: CRYPT PENITENT (SKELETON GUARDIAN)
  // =========================================================================
  private createSkeletonEnemy(): void {
    this.skeletonGroup = new THREE.Group();
    this.skeletonGroup.position.set(0, 0, -32);

    const boneMat = new THREE.MeshStandardMaterial({ color: 0xd8ceb8, roughness: 0.7 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x222228, metalness: 0.85, roughness: 0.4 });
    const cyanEyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const tatteredMat = new THREE.MeshStandardMaterial({ color: 0x1f2228, roughness: 0.95 });

    // Spine and Ribs
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.1, 6), boneMat);
    spine.position.y = 1.0;
    spine.castShadow = true;
    this.skeletonGroup.add(spine);

    // Ribcage
    for (let r = 0; r < 3; r++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 4, 8, Math.PI), boneMat);
      rib.position.set(0, 0.85 + r * 0.16, 0.05);
      rib.rotation.x = Math.PI;
      this.skeletonGroup.add(rib);
    }

    // Tattered Shroud / Cloak
    const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.44, 1.4, 6), tatteredMat);
    cloak.position.y = 0.75;
    this.skeletonGroup.add(cloak);

    // Skull
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.32), boneMat);
    skull.position.set(0, 1.75, 0);
    skull.castShadow = true;
    this.skeletonGroup.add(skull);

    // Glowing Cyan Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), cyanEyeMat);
    eyeL.position.set(-0.07, 1.76, 0.16);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), cyanEyeMat);
    eyeR.position.set(0.07, 1.76, 0.16);
    this.skeletonGroup.add(eyeL, eyeR);

    // Greatsword (Rusted Claymore)
    const swordGroup = new THREE.Group();
    swordGroup.position.set(0.48, 1.1, 0.25);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 0.04), darkMetalMat);
    blade.position.y = 0.6;
    blade.castShadow = true;
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), darkMetalMat);
    hilt.position.y = -0.2;
    swordGroup.add(blade, hilt);
    this.skeletonSwordMesh = swordGroup as any;
    this.skeletonGroup.add(swordGroup);

    // Warning Octahedron
    const warnMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    this.skeletonWarningMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), warnMat);
    this.skeletonWarningMesh.position.set(0, 2.3, 0);
    this.skeletonWarningMesh.visible = false;
    this.skeletonGroup.add(this.skeletonWarningMesh);

    // Waypoints in Cemetery
    this.skeletonWaypoints = [
      new THREE.Vector3(-2.0, 0, -28),
      new THREE.Vector3(2.5, 0, -34),
      new THREE.Vector3(-1.5, 0, -40)
    ];

    this.scene.add(this.skeletonGroup);
  }

  // =========================================================================
  // SUBTERRANEAN CRYPTS (DUNGEON CRAWLER EXPANSION)
  // =========================================================================
  private createCryptInterior(): void {
    this.cryptInteriorGroup = new THREE.Group();
    // Crypt spans from z: -68 to z: -114 (46 meters long), x: -6.5 to +6.5 (13 meters wide)
    const cryptStoneMat = new THREE.MeshStandardMaterial({ color: 0x14121a, roughness: 0.95 });
    const wallStoneMat = new THREE.MeshStandardMaterial({ color: 0x1a1822, roughness: 0.9 });
    const archMat = new THREE.MeshStandardMaterial({ color: 0x22202a, roughness: 0.85 });
    const darkIronMat = new THREE.MeshStandardMaterial({ color: 0x181820, metalness: 0.85, roughness: 0.35 });
    const bronzeGrateMat = new THREE.MeshStandardMaterial({ color: 0x3d2812, metalness: 0.7, roughness: 0.5 });
    const ironSpikeMat = new THREE.MeshStandardMaterial({ color: 0x2b2b33, metalness: 0.9, roughness: 0.25 });
    const torchWoodMat = new THREE.MeshStandardMaterial({ color: 0x201408, roughness: 0.9 });
    const torchFlameMat = new THREE.MeshBasicMaterial({ color: 0xff8822 });
    const cyanFlameMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

    // 1. Crypt Flagstone Floor
    const floorGeo = new THREE.PlaneGeometry(13, 46);
    const cryptFloor = new THREE.Mesh(floorGeo, cryptStoneMat);
    cryptFloor.rotation.x = -Math.PI / 2;
    cryptFloor.position.set(0, 0.01, -91);
    cryptFloor.receiveShadow = true;
    this.cryptInteriorGroup.add(cryptFloor);

    // 2. Vaulted Ceiling (y = 5.2)
    const ceilingGeo = new THREE.PlaneGeometry(13, 46);
    const cryptCeiling = new THREE.Mesh(ceilingGeo, wallStoneMat);
    cryptCeiling.rotation.x = Math.PI / 2;
    cryptCeiling.position.set(0, 5.2, -91);
    this.cryptInteriorGroup.add(cryptCeiling);

    // 3. Side Walls (Left x = -6.5, Right x = 6.5)
    const wallGeo = new THREE.BoxGeometry(0.8, 5.2, 46);
    const wallL = new THREE.Mesh(wallGeo, wallStoneMat);
    wallL.position.set(-6.5, 2.6, -91);
    wallL.receiveShadow = true;
    const wallR = new THREE.Mesh(wallGeo, wallStoneMat);
    wallR.position.set(6.5, 2.6, -91);
    wallR.receiveShadow = true;
    this.cryptInteriorGroup.add(wallL, wallR);

    // 4. Entrance End Wall (z = -68) and Deep Altar Wall (z = -114)
    const endWallGeo = new THREE.BoxGeometry(13, 5.2, 0.8);
    const wallEntrance = new THREE.Mesh(endWallGeo, wallStoneMat);
    wallEntrance.position.set(0, 2.6, -68);
    const wallDeep = new THREE.Mesh(endWallGeo, wallStoneMat);
    wallDeep.position.set(0, 2.6, -114);
    this.cryptInteriorGroup.add(wallEntrance, wallDeep);

    // 5. Entrance Staircase & Exit Portal at z = -70
    for (let s = 0; s < 5; s++) {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.25, 0.6), archMat);
      stepMesh.position.set(0, 0.125 + s * 0.22, -68.8 - s * 0.5);
      this.cryptInteriorGroup.add(stepMesh);
    }
    const exitArch = new THREE.Mesh(new THREE.BoxGeometry(3.8, 4.0, 0.6), archMat);
    exitArch.position.set(0, 2.0, -69.2);
    const exitPortalMat = new THREE.MeshBasicMaterial({ color: 0x050d1a });
    const exitPortal = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), exitPortalMat);
    exitPortal.position.set(0, 1.6, -68.8);
    const exitLight = new THREE.PointLight(0x4488ff, 1.8, 7);
    exitLight.position.set(0, 1.8, -70.0);
    this.cryptInteriorGroup.add(exitArch, exitPortal, exitLight);

    // 6. Transverse Gothic Rib Arches & Heavy Pillars every 6m
    const archZPositions = [-74, -80, -86, -92, -98, -104, -110];
    archZPositions.forEach(az => {
      // Left Pillar
      const pilL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 5.2, 8), archMat);
      pilL.position.set(-4.5, 2.6, az);
      pilL.castShadow = true;
      // Right Pillar
      const pilR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 5.2, 8), archMat);
      pilR.position.set(4.5, 2.6, az);
      pilR.castShadow = true;
      // Gothic Rib Beam across ceiling
      const archBeam = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.4, 0.6), archMat);
      archBeam.position.set(0, 5.0, az);

      this.cryptInteriorGroup.add(pilL, pilR, archBeam);

      // Iron Torch Sconces on Pillars
      [-4.1, 4.1].forEach((tx) => {
        const torchSconce = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.25), torchWoodMat);
        torchSconce.position.set(tx, 2.4, az);
        const flame = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), torchFlameMat);
        flame.position.set(tx, 2.65, az);
        const light = new THREE.PointLight(0xff7722, 1.6, 8);
        light.position.set(tx, 2.7, az);
        this.cryptInteriorGroup.add(torchSconce, flame, light);
      });
    });

    // 7. Spike Traps (Trap 1: x: -1.2, z: -80 | Trap 2: x: 1.5, z: -91)
    const trapConfigs = [
      { x: -1.2, z: -80 },
      { x: 1.5, z: -91 }
    ];
    this.spikeTraps = [];
    trapConfigs.forEach(tc => {
      const trapDomain = new SpikeTrap({ x: tc.x, z: tc.z, triggerRadius: 1.2, damage: 25, resetCooldown: 2.2 });
      const trapMeshGroup = new THREE.Group();
      trapMeshGroup.position.set(tc.x, 0.02, tc.z);

      // Iron frame grate
      const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 1.8), bronzeGrateMat);
      trapMeshGroup.add(frameMesh);

      // Spikes (8 spikes inside slots)
      const spikes: THREE.Mesh[] = [];
      const spikeGeo = new THREE.ConeGeometry(0.06, 0.75, 6);
      for (let ix = -0.6; ix <= 0.6; ix += 0.4) {
        for (let iz = -0.4; iz <= 0.4; iz += 0.8) {
          const spike = new THREE.Mesh(spikeGeo, ironSpikeMat);
          spike.position.set(ix, -0.35, iz);
          trapMeshGroup.add(spike);
          spikes.push(spike);
        }
      }

      this.cryptInteriorGroup.add(trapMeshGroup);
      this.spikeTraps.push({
        trap: trapDomain,
        meshGroup: trapMeshGroup,
        spikeMeshes: spikes
      });
    });

    // 8. Sarcophagi
    // Sarcophagus 1 (Loot): Profaned sarcophagus at (-3.8, 0, -85)
    this.cryptSarcophagusLootGroup = new THREE.Group();
    this.cryptSarcophagusLootGroup.position.set(-3.8, 0, -85);
    const sarcBase1 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 2.4), archMat);
    sarcBase1.position.y = 0.4;
    sarcBase1.castShadow = true;
    const sarcLid1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 2.5), archMat);
    sarcLid1.position.set(0, 0.9, 0);
    sarcLid1.name = 'sarcLid1';
    this.cryptSarcophagusLootGroup.add(sarcBase1, sarcLid1);
    this.cryptInteriorGroup.add(this.cryptSarcophagusLootGroup);

    // Sarcophagus 2 (Ambush): Sealed tomb at (3.8, 0, -97)
    this.cryptSarcophagusAmbushGroup = new THREE.Group();
    this.cryptSarcophagusAmbushGroup.position.set(3.8, 0, -97);
    const sarcBase2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 2.4), archMat);
    sarcBase2.position.y = 0.4;
    sarcBase2.castShadow = true;
    const sarcLid2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 2.5), archMat);
    sarcLid2.position.set(0, 0.9, 0);
    sarcLid2.name = 'sarcLid2';
    this.cryptSarcophagusAmbushGroup.add(sarcBase2, sarcLid2);
    this.cryptInteriorGroup.add(this.cryptSarcophagusAmbushGroup);

    // 9. Great Inquisitor Altar at z = -108
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0, -108);
    const altarBase = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.1, 2.4), archMat);
    altarBase.position.y = 0.55;
    altarBase.castShadow = true;
    const altarCross = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, 0.15), archMat);
    altarCross.position.set(0, 2.2, 0);
    const altarCrossH = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.15), archMat);
    altarCrossH.position.set(0, 2.6, 0);
    altarGroup.add(altarBase, altarCross, altarCrossH);

    // 2 Cyan Spectral Pebeteros flanking the altar
    [-2.8, 2.8].forEach(px => {
      const brazer = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 1.2, 8), darkIronMat);
      brazer.position.set(px, 0.6, -106);
      const brazerFlame = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18), cyanFlameMat);
      brazerFlame.position.set(px, 1.35, -106);
      const brazerLight = new THREE.PointLight(0x00e5ff, 2.5, 9);
      brazerLight.position.set(px, 1.5, -106);
      altarGroup.add(brazer, brazerFlame, brazerLight);
    });
    this.cryptInteriorGroup.add(altarGroup);

    // 10. Gateway Archway to El Bosque del Sauce Negro at z = -110.8
    const forestPortalArch = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.6, 0.7), archMat);
    forestPortalArch.position.set(0, 2.3, -110.8);

    const forestPortalMat = new THREE.MeshBasicMaterial({
      color: 0x8822cc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const forestPortalPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.8), forestPortalMat);
    forestPortalPlane.position.set(0, 1.9, -110.5);

    const forestPortalLight = new THREE.PointLight(0xbb44ff, 2.2, 9);
    forestPortalLight.position.set(0, 2.0, -110.0);

    const rootMat = new THREE.MeshStandardMaterial({ color: 0x181014, roughness: 0.95 });
    [-1.6, 1.6].forEach(rx => {
      const rootTendril = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 4.8, 6), rootMat);
      rootTendril.position.set(rx, 2.4, -110.4);
      rootTendril.rotation.z = rx > 0 ? -0.15 : 0.15;
      this.cryptInteriorGroup.add(rootTendril);
    });

    this.cryptInteriorGroup.add(forestPortalArch, forestPortalPlane, forestPortalLight);

    this.scene.add(this.cryptInteriorGroup);
  }

  // =========================================================================
  // SUB-BOSS: EL INQUISIDOR CAÍDO DE LAS CATACUMBAS
  // =========================================================================
  private createInquisitorBoss(): void {
    this.inquisitorGroup = new THREE.Group();
    this.inquisitorGroup.position.set(0, 0, -105);

    const darkIronMat = new THREE.MeshStandardMaterial({ color: 0x14141c, metalness: 0.88, roughness: 0.3 });
    const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0x8a6d2b, metalness: 0.8, roughness: 0.4 });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0x220c18, roughness: 0.95 });
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xd2c7b2, roughness: 0.7 });
    const violetGlowMat = new THREE.MeshBasicMaterial({ color: 0x9b59b6 });
    const redGlowMat = new THREE.MeshBasicMaterial({ color: 0xff1144 });

    // Armored Torso / Breastplate
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.9, 0.42), darkIronMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    this.inquisitorGroup.add(torso);

    // Gold Inquisitorial Cross on breastplate
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.05), goldTrimMat);
    crossV.position.set(0, 1.35, 0.22);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.05), goldTrimMat);
    crossH.position.set(0, 1.5, 0.22);
    this.inquisitorGroup.add(crossV, crossH);

    // Pauldrons (Spiked Shoulder Guards)
    [-0.52, 0.52].forEach(px => {
      const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.4), darkIronMat);
      pauldron.position.set(px, 1.8, 0);
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), darkIronMat);
      spike.position.set(px, 2.05, 0);
      this.inquisitorGroup.add(pauldron, spike);
    });

    // Skull Head
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.34), boneMat);
    skull.position.set(0, 2.0, 0);
    this.inquisitorGroup.add(skull);

    // Glowing Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), redGlowMat);
    eyeL.position.set(-0.08, 2.02, 0.18);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), redGlowMat);
    eyeR.position.set(0.08, 2.02, 0.18);
    const eyeLight = new THREE.PointLight(0xff1144, 2.0, 5);
    eyeLight.position.set(0, 2.05, 0.3);
    this.inquisitorGroup.add(eyeL, eyeR, eyeLight);

    // Inquisitor Wide-Brimmed Hat
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.06, 16), clothMat);
    hatBrim.position.set(0, 2.22, 0);
    const hatCrown = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.75, 8), clothMat);
    hatCrown.position.set(0, 2.62, 0);
    this.inquisitorGroup.add(hatBrim, hatCrown);

    // Ragged Cloak & Tabard
    const tabard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.06), clothMat);
    tabard.position.set(0, 0.85, 0.15);
    const cloak = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.4, 0.08), clothMat);
    cloak.position.set(0, 1.05, -0.22);
    this.inquisitorGroup.add(tabard, cloak);

    // Armored Legs
    [-0.22, 0.22].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.24), darkIronMat);
      leg.position.set(lx, 0.45, 0);
      leg.castShadow = true;
      this.inquisitorGroup.add(leg);
    });

    // Weapon: Spiked Morningstar / Mace (Right Hand)
    const maceGroup = new THREE.Group();
    maceGroup.position.set(0.62, 1.1, 0.2);
    const maceHaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 6), darkIronMat);
    maceHaft.rotation.x = Math.PI / 4;
    const maceHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), darkIronMat);
    maceHead.position.set(0, 0.45, 0.45);
    maceGroup.add(maceHaft, maceHead);

    for (let i = 0; i < 6; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), darkIronMat);
      const angle = (i / 6) * Math.PI * 2;
      sp.position.set(Math.cos(angle) * 0.2, 0.45 + Math.sin(angle) * 0.2, 0.45);
      maceGroup.add(sp);
    }
    this.inquisitorGroup.add(maceGroup);

    // Offhand: Corrupted Shield of Dark Fire (Left Hand)
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(-0.62, 1.25, 0.3);
    const shieldPlate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.0, 0.08), darkIronMat);
    shieldPlate.castShadow = true;
    const shieldCross = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.1), violetGlowMat);
    shieldCross.position.z = 0.02;
    const shieldLight = new THREE.PointLight(0x9b59b6, 1.5, 4);
    shieldLight.position.set(0, 0, 0.25);
    shieldGroup.add(shieldPlate, shieldCross, shieldLight);
    this.inquisitorGroup.add(shieldGroup);

    // Warning mesh above head for windup
    const warnGeo = new THREE.ConeGeometry(0.18, 0.4, 4);
    this.inquisitorWarningMesh = new THREE.Mesh(warnGeo, redGlowMat);
    this.inquisitorWarningMesh.position.set(0, 3.2, 0);
    this.inquisitorWarningMesh.visible = false;
    this.inquisitorGroup.add(this.inquisitorWarningMesh);

    // Ground Slam AoE Telegraph Mesh
    const telegraphGeo = new THREE.RingGeometry(0.3, CatacombInquisitor.SLAM_RADIUS, 32);
    const telegraphMat = new THREE.MeshBasicMaterial({ color: 0x9b59b6, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    this.inquisitorSlamTelegraphMesh = new THREE.Mesh(telegraphGeo, telegraphMat);
    this.inquisitorSlamTelegraphMesh.rotation.x = -Math.PI / 2;
    this.inquisitorSlamTelegraphMesh.position.set(0, 0.05, 0);
    this.inquisitorSlamTelegraphMesh.visible = false;
    this.scene.add(this.inquisitorSlamTelegraphMesh);

    this.scene.add(this.inquisitorGroup);
  }

  // =========================================================================
  // AMBUSH SKELETON IN SARCOPHAGUS 2
  // =========================================================================
  private createCryptAmbushSkeleton(): void {
    this.cryptAmbushSkeletonGroup = new THREE.Group();
    this.cryptAmbushSkeletonGroup.position.set(3.8, -1.0, -97);
    this.cryptAmbushSkeletonGroup.visible = false;

    const boneMat = new THREE.MeshStandardMaterial({ color: 0xc8baa0, roughness: 0.75 });
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.0, 6), boneMat);
    spine.position.y = 0.9;
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.28), boneMat);
    skull.position.set(0, 1.6, 0);
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    eyeL.position.set(-0.06, 1.62, 0.14);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    eyeR.position.set(0.06, 1.62, 0.14);

    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.04), new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.8 }));
    sword.position.set(0.45, 1.1, 0.2);

    this.cryptAmbushSkeletonGroup.add(spine, skull, eyeL, eyeR, sword);
    this.scene.add(this.cryptAmbushSkeletonGroup);
  }

  // =========================================================================
  // ZONE 3: EL BOSQUE DEL SAUCE NEGRO (BLACK WILLOW FOREST)
  // =========================================================================
  private createBlackWillowForest(): void {
    this.blackWillowForestGroup = new THREE.Group();

    // 1. Dark Mossy Soil Ground (z: -125 to -172, x: -7.5 to 7.5)
    const forestGroundGeo = new THREE.PlaneGeometry(16, 52, 16, 16);
    const forestGroundMat = new THREE.MeshStandardMaterial({
      color: 0x131a14, // dark mossy earthy green/black
      roughness: 0.92,
      metalness: 0.05
    });
    const forestGround = new THREE.Mesh(forestGroundGeo, forestGroundMat);
    forestGround.rotation.x = -Math.PI / 2;
    forestGround.position.set(0, 0, -148.5);
    forestGround.receiveShadow = true;
    this.blackWillowForestGroup.add(forestGround);

    // 2. Gateway Arch returning to Crypts at z = -125.8
    const stoneArchMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.9 });
    const cryptReturnArch = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.6, 0.7), stoneArchMat);
    cryptReturnArch.position.set(0, 2.3, -125.8);

    const cryptReturnMat = new THREE.MeshBasicMaterial({
      color: 0x00c8ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const cryptReturnPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.8), cryptReturnMat);
    cryptReturnPlane.position.set(0, 1.9, -126.1);

    const cryptReturnLight = new THREE.PointLight(0x00e5ff, 2.0, 8);
    cryptReturnLight.position.set(0, 2.0, -126.5);
    this.blackWillowForestGroup.add(cryptReturnArch, cryptReturnPlane, cryptReturnLight);

    // 3. Ancient Gnarled Black Willows (14 trees scattered along the trail)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.96 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x22132a, roughness: 0.85 }); // dark violet-tinged foliage

    const willowConfigs = [
      { x: -5.2, z: -129, scale: 1.1, rot: 0.2 },
      { x: 4.8, z: -131, scale: 1.2, rot: -0.3 },
      { x: -4.5, z: -136, scale: 1.0, rot: 0.5 },
      { x: 5.5, z: -138, scale: 1.3, rot: -0.4 },
      { x: -6.0, z: -143, scale: 1.25, rot: 0.1 },
      { x: 6.2, z: -145, scale: 1.15, rot: -0.2 },
      { x: -4.8, z: -152, scale: 1.35, rot: 0.4 },
      { x: 5.2, z: -153, scale: 1.2, rot: -0.5 },
      { x: -5.8, z: -160, scale: 1.1, rot: 0.3 },
      { x: 5.6, z: -162, scale: 1.3, rot: -0.1 },
      { x: -4.2, z: -167, scale: 1.15, rot: 0.2 },
      { x: 4.5, z: -168, scale: 1.2, rot: -0.3 },
      { x: -2.8, z: -171, scale: 1.0, rot: 0.1 },
      { x: 2.8, z: -171, scale: 1.0, rot: -0.2 }
    ];

    willowConfigs.forEach(tc => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tc.x, 0, tc.z);
      treeGroup.rotation.y = tc.rot;
      treeGroup.scale.set(tc.scale, tc.scale, tc.scale);

      // Twisted Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.65, 5.2, 7), trunkMat);
      trunk.position.y = 2.6;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Hanging weeping foliage canopy (cascade of 3 drooping layers)
      [
        { y: 4.8, r: 1.6, h: 2.2 },
        { y: 3.8, r: 2.1, h: 2.0 },
        { y: 2.9, r: 1.7, h: 1.6 }
      ].forEach(layer => {
        const foliage = new THREE.Mesh(new THREE.ConeGeometry(layer.r, layer.h, 7), leafMat);
        foliage.position.y = layer.y;
        foliage.castShadow = true;
        treeGroup.add(foliage);
      });

      this.blackWillowForestGroup.add(treeGroup);
    });

    // 4. Monumental Central Black Willow (El Gran Sauce Negro) at (0, 0, -150)
    const greatWillowGroup = new THREE.Group();
    greatWillowGroup.position.set(0, 0, -150);

    const greatTrunkMat = new THREE.MeshStandardMaterial({ color: 0x11090c, roughness: 0.98 });
    const greatTrunk = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.4, 9.5, 9), greatTrunkMat);
    greatTrunk.position.y = 4.75;
    greatTrunk.castShadow = true;
    greatWillowGroup.add(greatTrunk);

    // 4 Massive Arching Root Buttresses
    [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach(ang => {
      const rootArch = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.8, 4.5, 6), greatTrunkMat);
      rootArch.position.set(Math.cos(ang) * 2.2, 1.8, Math.sin(ang) * 2.2);
      rootArch.rotation.z = Math.sin(ang) * 0.45;
      rootArch.rotation.x = Math.cos(ang) * 0.45;
      greatWillowGroup.add(rootArch);
    });

    // Weeping Great Canopy
    const greatLeafMat = new THREE.MeshStandardMaterial({
      color: 0x2e183a, // deep royal midnight violet
      roughness: 0.88,
      emissive: 0x160820,
      emissiveIntensity: 0.35
    });

    [
      { y: 8.8, r: 3.8, h: 3.5 },
      { y: 7.2, r: 4.9, h: 3.2 },
      { y: 5.6, r: 4.2, h: 2.8 }
    ].forEach(glayer => {
      const gFoliage = new THREE.Mesh(new THREE.ConeGeometry(glayer.r, glayer.h, 8), greatLeafMat);
      gFoliage.position.y = glayer.y;
      gFoliage.castShadow = true;
      greatWillowGroup.add(gFoliage);
    });

    // Ambient Ethereal Core Glow of the Great Willow
    const greatWillowLight = new THREE.PointLight(0xaa33ff, 3.2, 22);
    greatWillowLight.position.set(0, 4.0, 0);
    greatWillowGroup.add(greatWillowLight);

    this.blackWillowForestGroup.add(greatWillowGroup);

    // 5. Altar del Aquelarre (Altar de las Nueve Hermanas) at (0, 0, -155)
    this.sisterAltarGroup = new THREE.Group();
    this.sisterAltarGroup.position.set(0, 0, -155);

    const altarSlateMat = new THREE.MeshStandardMaterial({ color: 0x1e1e24, roughness: 0.85 });
    // Circular dais
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 0.45, 18), altarSlateMat);
    dais.position.y = 0.22;
    dais.receiveShadow = true;
    this.sisterAltarGroup.add(dais);

    // Glowing Runic Circle on Dais
    const runicMat = new THREE.MeshBasicMaterial({
      color: 0xcc66ff,
      side: THREE.DoubleSide
    });
    const runicRing = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.55, 32), runicMat);
    runicRing.rotation.x = -Math.PI / 2;
    runicRing.position.y = 0.46;
    this.sisterAltarGroup.add(runicRing);

    // 9 Standing Megalith Stones (Las Nueve Hermanas)
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const menhir = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.6, 0.32), altarSlateMat);
      menhir.position.set(Math.cos(angle) * 2.3, 0.8, Math.sin(angle) * 2.3);
      menhir.rotation.y = angle;
      menhir.castShadow = true;
      this.sisterAltarGroup.add(menhir);
    }

    // Central Offering Pedestal
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.1, 8), altarSlateMat);
    pedestal.position.y = 0.95;
    pedestal.castShadow = true;
    this.sisterAltarGroup.add(pedestal);

    // Floating Relic Mesh: Colmillo del Sauce Negro (Twin ritual daggers)
    this.willowRelicMeshGroup = new THREE.Group();
    this.willowRelicMeshGroup.position.set(0, 1.7, 0);

    const daggerBladeMat = new THREE.MeshStandardMaterial({
      color: 0x221133,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x9933ee,
      emissiveIntensity: 0.6
    });
    const daggerHiltMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.3 });

    // Dagger 1
    const d1 = new THREE.Group();
    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.02), daggerBladeMat);
    const guard1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.04), daggerHiltMat);
    guard1.position.y = -0.32;
    const grip1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 6), daggerHiltMat);
    grip1.position.y = -0.45;
    d1.add(blade1, guard1, grip1);
    d1.rotation.z = 0.4;
    d1.position.x = -0.15;

    // Dagger 2
    const d2 = new THREE.Group();
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.02), daggerBladeMat);
    const guard2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.04), daggerHiltMat);
    guard2.position.y = -0.32;
    const grip2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 6), daggerHiltMat);
    grip2.position.y = -0.45;
    d2.add(blade2, guard2, grip2);
    d2.rotation.z = -0.4;
    d2.position.x = 0.15;

    this.willowRelicMeshGroup.add(d1, d2);

    const relicGlow = new THREE.PointLight(0xcc55ff, 2.5, 6);
    this.willowRelicMeshGroup.add(relicGlow);

    this.sisterAltarGroup.add(this.willowRelicMeshGroup);
    this.blackWillowForestGroup.add(this.sisterAltarGroup);

    // 6. Bioluminescent Spores Particles (120 drifting motes)
    const sporeCount = 120;
    const sporeGeo = new THREE.BufferGeometry();
    const sporePositions = new Float32Array(sporeCount * 3);
    for (let i = 0; i < sporeCount; i++) {
      sporePositions[i * 3] = (Math.random() - 0.5) * 14;     // x: -7 to 7
      sporePositions[i * 3 + 1] = 0.4 + Math.random() * 4.5; // y: 0.4 to 4.9
      sporePositions[i * 3 + 2] = -126 - Math.random() * 44; // z: -126 to -170
    }
    sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));
    const sporeMat = new THREE.PointsMaterial({
      color: 0xbb55ff,
      size: 0.18,
      transparent: true,
      opacity: 0.8
    });
    this.willowSporesPoints = new THREE.Points(sporeGeo, sporeMat);
    this.blackWillowForestGroup.add(this.willowSporesPoints);

    this.scene.add(this.blackWillowForestGroup);
  }

  // =========================================================================
  // ENEMY: ACECHADOR DE RAÍCES DEL SAUCE NEGRO (ROOT PROWLER)
  // =========================================================================
  private createRootProwlerBeast(): void {
    this.rootProwlerGroup = new THREE.Group();
    this.rootProwlerGroup.position.set(0, 0, -140);

    const rootWoodMat = new THREE.MeshStandardMaterial({
      color: 0x1f140e,
      roughness: 0.95,
      metalness: 0.05
    });
    const spineThornMat = new THREE.MeshStandardMaterial({
      color: 0x331c12,
      roughness: 0.8
    });
    const beastEyesMat = new THREE.MeshBasicMaterial({ color: 0xbb44ff });

    // 1. Quadruped Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 1.7), rootWoodMat);
    torso.position.y = 0.8;
    torso.castShadow = true;
    this.rootProwlerGroup.add(torso);

    // 2. Thorny Spine Ridge (4 thorny cones along the back)
    for (let i = 0; i < 4; i++) {
      const thorn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 5), spineThornMat);
      thorn.position.set(0, 1.25, -0.6 + i * 0.4);
      thorn.rotation.x = -0.2;
      this.rootProwlerGroup.add(thorn);
    }

    // 3. Predatory Lupine/Feline Root Skull
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.95, 0.95);

    const cranium = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.65), rootWoodMat);
    cranium.castShadow = true;
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.5), rootWoodMat);
    snout.position.set(0, -0.08, 0.45);

    // Glowing Violet Eyes
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, beastEyesMat);
    eyeL.position.set(-0.16, 0.08, 0.32);
    const eyeR = new THREE.Mesh(eyeGeo, beastEyesMat);
    eyeR.position.set(0.16, 0.08, 0.32);

    this.rootProwlerEyesLight = new THREE.PointLight(0xbb44ff, 1.8, 5.0);
    this.rootProwlerEyesLight.position.set(0, 0.1, 0.4);

    headGroup.add(cranium, snout, eyeL, eyeR, this.rootProwlerEyesLight);
    this.rootProwlerGroup.add(headGroup);

    // 4. Quadruped Limbs (4 clawed root legs)
    const legGeo = new THREE.CylinderGeometry(0.1, 0.07, 0.85, 6);
    const legOffsets = [
      { x: -0.42, z: 0.6 },
      { x: 0.42, z: 0.6 },
      { x: -0.42, z: -0.6 },
      { x: 0.42, z: -0.6 }
    ];
    legOffsets.forEach(lo => {
      const leg = new THREE.Mesh(legGeo, rootWoodMat);
      leg.position.set(lo.x, 0.42, lo.z);
      leg.castShadow = true;
      this.rootProwlerGroup.add(leg);
    });

    // 5. Warning Telegraph Ring (for lunging pounce attack)
    const warnMat = new THREE.MeshBasicMaterial({
      color: 0xff2266,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    this.rootProwlerWarningMesh = new THREE.Mesh(new THREE.RingGeometry(0.8, 2.2, 24), warnMat);
    this.rootProwlerWarningMesh.rotation.x = -Math.PI / 2;
    this.rootProwlerWarningMesh.position.set(0, 0.04, 0);
    this.rootProwlerWarningMesh.visible = false;
    this.rootProwlerGroup.add(this.rootProwlerWarningMesh);

    this.scene.add(this.rootProwlerGroup);
  }

  // =========================================================================
  // KHATERINE SPECIAL: ECO DEL AQUELARRE SPECTRAL DAGGER VORTEX
  // =========================================================================
  private createDaggerVortexMesh(): void {
    this.daggerVortexMeshGroup = new THREE.Group();

    const spectralMat = new THREE.MeshBasicMaterial({
      color: 0xcc66ff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    // 2 Spectral Daggers orbiting at 180 degrees
    [-1.6, 1.6].forEach(dx => {
      const dMesh = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.95, 4), spectralMat);
      dMesh.rotation.z = Math.PI / 2;
      dMesh.position.set(dx, 0.9, 0);
      this.daggerVortexMeshGroup.add(dMesh);
    });

    // Swirling trail ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xbb33ff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const vortexRing = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.8, 32), ringMat);
    vortexRing.rotation.x = -Math.PI / 2;
    vortexRing.position.y = 0.9;
    this.daggerVortexMeshGroup.add(vortexRing);

    this.daggerVortexMeshGroup.visible = false;
    this.scene.add(this.daggerVortexMeshGroup);
  }

  // =========================================================================
  // ACT II: CAMPANARIO DEL SUR, CELDA DE SAL & GRAN CRISOL (CAPS VII - IX)
  // =========================================================================
  private createBelltowerAct2(): void {
    this.belltowerGroup = new THREE.Group();
    this.belltowerGroup.position.set(0, 0, -202);

    const stoneFloorMat = new THREE.MeshStandardMaterial({ color: 0x221e28, roughness: 0.9 });
    const woodBeamMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.85 });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x8b6508, metalness: 0.85, roughness: 0.35 });
    const ironBarMat = new THREE.MeshStandardMaterial({ color: 0x1a1a20, metalness: 0.9, roughness: 0.3 });
    const saltMat = new THREE.MeshStandardMaterial({ color: 0xf5f5fa, roughness: 0.4, emissive: 0x222233 });

    // 1. Circular Stone Platform
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(14, 15, 0.8, 24), stoneFloorMat);
    platform.position.y = -0.4;
    platform.receiveShadow = true;
    this.belltowerGroup.add(platform);

    // 2. Timber Scaffolding (4 upright posts & crossbeams)
    const postPositions = [
      { x: -3.5, z: -3.5 },
      { x: 3.5, z: -3.5 },
      { x: -3.5, z: 3.5 },
      { x: 3.5, z: 3.5 }
    ];
    postPositions.forEach(p => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 9.0, 0.45), woodBeamMat);
      post.position.set(p.x, 4.5, p.z);
      post.castShadow = true;
      this.belltowerGroup.add(post);
    });

    // Crossbeams connecting posts at top
    const beam1 = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.4, 0.4), woodBeamMat);
    beam1.position.set(0, 8.8, -3.5);
    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.4, 0.4), woodBeamMat);
    beam2.position.set(0, 8.8, 3.5);
    const beam3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 7.5), woodBeamMat);
    beam3.position.set(-3.5, 8.8, 0);
    const beam4 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 7.5), woodBeamMat);
    beam4.position.set(3.5, 8.8, 0);
    this.belltowerGroup.add(beam1, beam2, beam3, beam4);

    // 3. Giant Bronze Bell of the Inquisitorial Holy Office
    const bellGroup = new THREE.Group();
    bellGroup.position.set(0, 6.2, 0);
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 2.0, 2.5, 16), bronzeMat);
    bell.castShadow = true;
    const clapper = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 1.8, 8), ironBarMat);
    clapper.position.y = -0.6;
    bellGroup.add(bell, clapper);
    this.belltowerGroup.add(bellGroup);

    // 4. Celda de Sal de Elowen (Octagonal Iron Cage at x: -5.5, z: 0)
    const cellGroup = new THREE.Group();
    cellGroup.position.set(-5.5, 0, 0);

    // Cage base & Salt Floor
    const cellBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.25, 8), stoneFloorMat);
    cellBase.position.y = 0.12;
    cellGroup.add(cellBase);

    const saltBed = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.1, 8), saltMat);
    saltBed.position.y = 0.26;
    cellGroup.add(saltBed);

    // Cage Bars (8 vertical iron bars)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), ironBarMat);
      bar.position.set(Math.cos(angle) * 1.6, 1.3, Math.sin(angle) * 1.6);
      cellGroup.add(bar);
    }

    // Carved Willow Bird (Pájaro de Madera de Sauce) on a small wooden pedestal
    this.willowBirdMesh = new THREE.Group();
    this.willowBirdMesh.position.set(0, 0.65, 0);
    const birdMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });
    const birdBody = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 6), birdMat);
    birdBody.rotation.x = Math.PI / 2;
    const birdWings = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.03, 0.16), birdMat);
    birdWings.position.y = 0.05;
    this.willowBirdMesh.add(birdBody, birdWings);

    const birdLight = new THREE.PointLight(0xffd700, 1.8, 4);
    birdLight.position.y = 0.3;
    this.willowBirdMesh.add(birdLight);
    cellGroup.add(this.willowBirdMesh);

    this.belltowerGroup.add(cellGroup);

    // 5. The Great Bronze Crucible Furnace (Gran Horno del Crisol at x: 0, z: -12)
    const crucibleFurnaceGroup = new THREE.Group();
    crucibleFurnaceGroup.position.set(0, 0, -12);

    const crucibleCauldron = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.8, 2.6, 16), ironBarMat);
    crucibleCauldron.position.y = 1.3;
    crucibleCauldron.castShadow = true;
    crucibleFurnaceGroup.add(crucibleCauldron);

    // Glowing Molten Slag Pool
    const slagMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    const slagPool = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.15, 16), slagMat);
    slagPool.position.y = 2.45;
    crucibleFurnaceGroup.add(slagPool);

    this.crucibleSlagLight = new THREE.PointLight(0xff5511, 4.0, 18);
    this.crucibleSlagLight.position.set(0, 3.2, 0);
    crucibleFurnaceGroup.add(this.crucibleSlagLight);

    this.belltowerGroup.add(crucibleFurnaceGroup);

    // Ambient Warm Light for Belltower
    const belltowerLight = new THREE.PointLight(0xff7722, 2.2, 25);
    belltowerLight.position.set(0, 5.0, 0);
    this.belltowerGroup.add(belltowerLight);

    this.scene.add(this.belltowerGroup);
  }

  // =========================================================================
  // ACT II BOSS: EL GUARDIÁN DEL CRISOL (CRUCIBLE GUARDIAN)
  // =========================================================================
  private createCrucibleGuardianBoss(): void {
    this.crucibleGuardianGroup = new THREE.Group();
    this.crucibleGuardianGroup.position.set(0, 0, -204);

    const ironArmorMat = new THREE.MeshStandardMaterial({ color: 0x221a18, metalness: 0.8, roughness: 0.4 });
    const slagCoreMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

    // 1. Heavy Torso & Iron Apron
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.75), ironArmorMat);
    torso.position.y = 1.3;
    torso.castShadow = true;
    this.crucibleGuardianGroup.add(torso);

    // 2. Welder Helmet with Glowing Red Visor
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.52), ironArmorMat);
    helmet.position.set(0, 2.2, 0);
    helmet.castShadow = true;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.03), slagCoreMat);
    visor.position.set(0, 0.05, 0.27);
    helmet.add(visor);
    this.crucibleGuardianGroup.add(helmet);

    // 3. Massive Foundry Sledgehammer
    const hammerGroup = new THREE.Group();
    hammerGroup.position.set(0.7, 1.1, 0.2);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.3, 8), ironArmorMat);
    handle.rotation.x = Math.PI / 4;
    const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.55), ironArmorMat);
    hammerHead.position.set(0, 1.0, 0.7);
    const slagCore = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.57), slagCoreMat);
    slagCore.position.set(0, 1.0, 0.7);
    hammerGroup.add(handle, hammerHead, slagCore);
    this.crucibleGuardianGroup.add(hammerGroup);

    // 4. Glowing Red Slag Core Light
    const coreLight = new THREE.PointLight(0xff4400, 2.2, 7);
    coreLight.position.set(0, 1.4, 0.4);
    this.crucibleGuardianGroup.add(coreLight);

    // 5. Warning Telegraph Ring
    const warnMat = new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
    this.crucibleWarningMesh = new THREE.Mesh(new THREE.RingGeometry(1.0, 2.8, 24), warnMat);
    this.crucibleWarningMesh.rotation.x = -Math.PI / 2;
    this.crucibleWarningMesh.position.set(0, 0.04, 0);
    this.crucibleWarningMesh.visible = false;
    this.crucibleGuardianGroup.add(this.crucibleWarningMesh);

    this.scene.add(this.crucibleGuardianGroup);
  }

  // =========================================================================
  // ACT III: EL GRAN PUENTE DE PIEDRA — EL CAMINO DE LOS HEREJES (CAPS X - XIII)
  // =========================================================================
  private createGreatStoneBridgeAct3(): void {
    this.greatStoneBridgeGroup = new THREE.Group();
    this.greatStoneBridgeGroup.position.set(0, 0, -255);

    const graniteMat = new THREE.MeshStandardMaterial({ color: 0x38353d, roughness: 0.9 });
    const woodCrossMat = new THREE.MeshStandardMaterial({ color: 0x2b1c11, roughness: 0.95 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f1f24, metalness: 0.8, roughness: 0.35 });

    // 1. Massive Stone Bridge Roadway (48m long, 10.6m wide to match DungeonAreaManager bounds)
    const roadway = new THREE.Mesh(new THREE.BoxGeometry(10.6, 1.2, 48), graniteMat);
    roadway.position.y = -0.6;
    roadway.receiveShadow = true;
    this.greatStoneBridgeGroup.add(roadway);

    // 2. Heavy Stone Balustrades along left and right
    const leftBalustrade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 48), graniteMat);
    leftBalustrade.position.set(-5.05, 0.55, 0);
    leftBalustrade.castShadow = true;
    const rightBalustrade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 48), graniteMat);
    rightBalustrade.position.set(5.05, 0.55, 0);
    rightBalustrade.castShadow = true;
    this.greatStoneBridgeGroup.add(leftBalustrade, rightBalustrade);

    // 3. Heretic Crosses along the balustrades (6 crosses with braziers)
    [-15, 0, 15].forEach(zPos => {
      [-5.0, 5.0].forEach(xPos => {
        const crossVert = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.5, 0.18), woodCrossMat);
        crossVert.position.set(xPos, 1.8, zPos);
        crossVert.castShadow = true;
        const crossHoriz = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.18), woodCrossMat);
        crossHoriz.position.set(xPos, 2.4, zPos);
        this.greatStoneBridgeGroup.add(crossVert, crossHoriz);

        // Small iron brazier with flame
        const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.25, 6), ironMat);
        brazier.position.set(xPos, 1.1, zPos);
        const bLight = new THREE.PointLight(0xff6622, 1.2, 5);
        bLight.position.set(xPos, 1.3, zPos);
        this.greatStoneBridgeGroup.add(brazier, bLight);
      });
    });

    // 4. Prisoner Transport Wagon of Martín and Tobías (at x: -2.6, z: 6)
    const cartGroup = new THREE.Group();
    cartGroup.position.set(-2.6, 0, 6);

    const wagonWood = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 3.4), woodCrossMat);
    wagonWood.position.y = 0.5;
    wagonWood.castShadow = true;
    cartGroup.add(wagonWood);

    // Iron Barred Cage on Wagon
    for (let i = 0; i < 6; i++) {
      const zb = -1.4 + i * 0.55;
      const bL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 4), ironMat);
      bL.position.set(-0.95, 1.4, zb);
      const bR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 4), ironMat);
      bR.position.set(0.95, 1.4, zb);
      cartGroup.add(bL, bR);
    }
    const cageRoof = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 3.5), woodCrossMat);
    cageRoof.position.y = 2.2;
    cartGroup.add(cageRoof);

    // Wagon Lantern
    const cartLantern = new THREE.PointLight(0xffaa44, 1.8, 6);
    cartLantern.position.set(0, 1.8, 1.6);
    cartGroup.add(cartLantern);

    this.greatStoneBridgeGroup.add(cartGroup);

    // River Mist Ambient Light beneath the bridge
    const riverLight = new THREE.PointLight(0x446688, 2.5, 30);
    riverLight.position.set(0, -3.0, 0);
    this.greatStoneBridgeGroup.add(riverLight);

    this.scene.add(this.greatStoneBridgeGroup);
  }

  // =========================================================================
  // ACT III BOSS: CAPITÁN ÁUREO VANE — EL ESCUDO DE TORRE (CAPTAIN VANE)
  // =========================================================================
  private createCaptainVaneBoss(): void {
    this.captainVaneGroup = new THREE.Group();
    this.captainVaneGroup.position.set(0, 0, -260);

    const goldPlateMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });
    const whiteTabardMat = new THREE.MeshStandardMaterial({ color: 0xf5f5ff, roughness: 0.6 });
    const steelBladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.15, emissive: 0xffaa00, emissiveIntensity: 0.3 });

    // 1. Armored Torso & White Sun Tabard
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.6), goldPlateMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    const tabard = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.22, 0.64), whiteTabardMat);
    tabard.position.y = 1.25;
    this.captainVaneGroup.add(torso, tabard);

    // 2. Gilded Greathelm with Sun Crest
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.5, 8), goldPlateMat);
    helm.position.y = 2.1;
    helm.castShadow = true;
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.35), goldPlateMat);
    crest.position.set(0, 2.45, 0);
    this.captainVaneGroup.add(helm, crest);

    // 3. Massive Tower Shield (Left hand, blocks frontal damage)
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(-0.65, 1.15, 0.45);
    this.vaneShieldMesh = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.0, 0.16), goldPlateMat);
    this.vaneShieldMesh.castShadow = true;
    const sunMedallion = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 12), new THREE.MeshBasicMaterial({ color: 0xffea77 }));
    sunMedallion.rotation.x = Math.PI / 2;
    sunMedallion.position.z = 0.09;
    this.vaneShieldMesh.add(sunMedallion);
    shieldGroup.add(this.vaneShieldMesh);
    this.captainVaneGroup.add(shieldGroup);

    // 4. Solar Greatsword (Right hand)
    const swordGroup = new THREE.Group();
    swordGroup.position.set(0.65, 1.15, 0.2);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.04), steelBladeMat);
    blade.position.y = 0.65;
    blade.castShadow = true;
    const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.08), goldPlateMat);
    crossguard.position.y = -0.1;
    swordGroup.add(blade, crossguard);
    this.captainVaneGroup.add(swordGroup);

    // 5. Radiant Solar Aura Light
    const solarLight = new THREE.PointLight(0xffdd55, 2.2, 7);
    solarLight.position.set(0, 1.8, 0.3);
    this.captainVaneGroup.add(solarLight);

    // 6. Warning Ring
    const warnMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
    this.vaneWarningMesh = new THREE.Mesh(new THREE.RingGeometry(0.9, 2.6, 24), warnMat);
    this.vaneWarningMesh.rotation.x = -Math.PI / 2;
    this.vaneWarningMesh.position.set(0, 0.04, 0);
    this.vaneWarningMesh.visible = false;
    this.captainVaneGroup.add(this.vaneWarningMesh);

    this.scene.add(this.captainVaneGroup);
  }

  // =========================================================================
  // ACT IV: LONDINIUM — LA CIUDADELA DORADA (CAPS XIV - XVII)
  // =========================================================================
  private createLondiniumCitadelAct4(): void {
    this.londiniumCitadelGroup = new THREE.Group();
    this.londiniumCitadelGroup.position.set(0, 0, -320);

    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf5f5ff, roughness: 0.15, metalness: 0.1 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });
    const velvetMat = new THREE.MeshStandardMaterial({ color: 0x6b091e, roughness: 0.7 });
    const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xd8e8f8, metalness: 0.95, roughness: 0.05 });

    // 1. Polished White Marble Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 48), marbleMat);
    floor.position.y = -0.4;
    floor.receiveShadow = true;
    this.londiniumCitadelGroup.add(floor);

    // 2. Colonnade of 10 Classical Columns
    [-6.8, 6.8].forEach(xPos => {
      [-18, -9, 0, 9, 18].forEach(zPos => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 6.5, 16), marbleMat);
        col.position.set(xPos, 2.85, zPos);
        col.castShadow = true;
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.45, 0.4, 16), goldMat);
        cap.position.set(xPos, 6.2, zPos);
        this.londiniumCitadelGroup.add(col, cap);
      });
    });

    // 3. Hall of Mirrors (Salón de los Espejos on left wall)
    [-10, 0, 10].forEach(zPos => {
      const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.8, 2.2), goldMat);
      mirrorFrame.position.set(-7.5, 2.4, zPos);
      const mirrorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 3.4, 1.8), mirrorMat);
      mirrorGlass.position.set(-7.45, 2.4, zPos);
      this.londiniumCitadelGroup.add(mirrorFrame, mirrorGlass);
    });

    // 4. Astral Throne of Rex Malphas (Salón del Trono Astral at z: -16)
    const throneGroup = new THREE.Group();
    throneGroup.position.set(0, 0, -16);

    // Three-tiered Marble Dais
    [
      { r: 3.2, h: 0.3, y: 0.15 },
      { r: 2.4, h: 0.3, y: 0.45 },
      { r: 1.6, h: 0.3, y: 0.75 }
    ].forEach(t => {
      const step = new THREE.Mesh(new THREE.CylinderGeometry(t.r, t.r + 0.2, t.h, 16), marbleMat);
      step.position.y = t.y;
      throneGroup.add(step);
    });

    // Golden Throne with Crimson Velvet
    const throneBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.0), goldMat);
    throneBase.position.y = 1.3;
    const seatVelvet = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.8), velvetMat);
    seatVelvet.position.set(0, 1.75, 0);
    const throneBack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 0.15), goldMat);
    throneBack.position.set(0, 2.3, -0.45);
    throneGroup.add(throneBase, seatVelvet, throneBack);

    this.londiniumCitadelGroup.add(throneGroup);

    // Cosmic Astral Nebula Illumination
    const astralLight = new THREE.PointLight(0x9944ff, 3.5, 30);
    astralLight.position.set(0, 5.5, -6);
    this.londiniumCitadelGroup.add(astralLight);

    this.scene.add(this.londiniumCitadelGroup);
  }

  // =========================================================================
  // ACT IV BOSS: REX MALPHAS / ALARIC — LA LEY DEL DESEO (ASTRAL DESPOT)
  // =========================================================================
  private createRexMalphasBoss(): void {
    this.rexMalphasGroup = new THREE.Group();
    this.rexMalphasGroup.position.set(0, 0, -325);

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });
    const velvetMat = new THREE.MeshStandardMaterial({ color: 0x800010, roughness: 0.6 });
    const swordBladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1, emissive: 0xcc66ff, emissiveIntensity: 0.4 });

    // 1. Royal Gilded Armor & Flowing Velvet Cape
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.2, 0.55), goldMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.08), velvetMat);
    cape.position.set(0, 1.2, -0.32);
    this.rexMalphasGroup.add(torso, cape);

    // 2. Crown of Gold (Jagged 5 points)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd9b38c }));
    head.position.y = 2.05;
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.25, 5), goldMat);
    crown.position.y = 2.25;
    this.rexMalphasGroup.add(head, crown);

    // 3. Mandoble Áureo (Colossal two-handed golden greatsword)
    const swordGroup = new THREE.Group();
    swordGroup.position.set(0.65, 1.2, 0.2);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.8, 0.05), swordBladeMat);
    blade.position.y = 0.75;
    blade.castShadow = true;
    const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), goldMat);
    crossguard.position.y = -0.15;
    swordGroup.add(blade, crossguard);
    this.rexMalphasGroup.add(swordGroup);

    // 4. Phase 2 Astral Warp Ring (Ley del Deseo halo)
    const warpRingMat = new THREE.MeshBasicMaterial({ color: 0xaa22ff, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    this.malphasWarpRingMesh = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.08, 12, 32), warpRingMat);
    this.malphasWarpRingMesh.position.set(0, 1.6, -0.4);
    this.malphasWarpRingMesh.visible = false;
    this.rexMalphasGroup.add(this.malphasWarpRingMesh);

    // 5. Astral Light
    const astralLight = new THREE.PointLight(0xaa22ff, 2.5, 9);
    astralLight.position.set(0, 1.8, 0.2);
    this.rexMalphasGroup.add(astralLight);

    // 6. Warning Ring
    const warnMat = new THREE.MeshBasicMaterial({ color: 0xcc44ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
    this.malphasWarningMesh = new THREE.Mesh(new THREE.RingGeometry(1.1, 3.0, 24), warnMat);
    this.malphasWarningMesh.rotation.x = -Math.PI / 2;
    this.malphasWarningMesh.position.set(0, 0.04, 0);
    this.malphasWarningMesh.visible = false;
    this.rexMalphasGroup.add(this.malphasWarningMesh);

    this.scene.add(this.rexMalphasGroup);
  }

  // =========================================================================
  // ACT V: LA CATEDRAL INVERTIDA — EL SOL DEL ABISMO (CAPS XVIII - XX)
  // =========================================================================
  private createInvertedCathedralAct5(): void {
    this.invertedCathedralGroup = new THREE.Group();
    this.invertedCathedralGroup.position.set(0, 0, -385);

    const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x120c18, roughness: 0.85, metalness: 0.2 });
    const whiteAlabasterMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, emissive: 0x334455, emissiveIntensity: 0.3 });

    // 1. Floating Obsidian Platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(18, 1.0, 50), obsidianMat);
    platform.position.y = -0.5;
    platform.receiveShadow = true;
    this.invertedCathedralGroup.add(platform);

    // 2. Inverted Ribbed Gothic Arches pointing into the abyss
    [-8.0, 8.0].forEach(xPos => {
      [-16, -8, 0, 8, 16].forEach(zPos => {
        const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 7.0, 8), obsidianMat);
        rib.position.set(xPos, -3.5, zPos);
        rib.rotation.z = xPos < 0 ? 0.2 : -0.2;
        this.invertedCathedralGroup.add(rib);
      });
    });

    // 3. Stained Glass Windows of the Nine Witches (Hovering around perimeter)
    const glassColors = [0x00e5ff, 0xff007f, 0xffaa00, 0x00ff88, 0x9933ff, 0xff3344, 0x33ccff, 0xffdd44, 0xe056fd];
    glassColors.forEach((colorHex, idx) => {
      const angle = (idx / 9) * Math.PI * 2;
      const glassMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
      const glass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 0.08), glassMat);
      glass.position.set(Math.cos(angle) * 8.5, 2.5, Math.sin(angle) * 16.0);
      glass.rotation.y = angle;
      this.invertedCathedralGroup.add(glass);
    });

    // 4. White Communion Altar (Altar de la Comunión Inmaculada at z: 7.0)
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0, 7.0);

    const altarDais = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 0.5, 16), whiteAlabasterMat);
    altarDais.position.y = 0.25;
    altarGroup.add(altarDais);

    // Floating Tear of Divine Light (Gota de Luz Divina)
    this.dawnGreyTearMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    this.dawnGreyTearMesh.position.set(0, 1.4, 0);
    altarGroup.add(this.dawnGreyTearMesh);

    const tearLight = new THREE.PointLight(0x88eeff, 3.5, 10);
    tearLight.position.set(0, 1.4, 0);
    altarGroup.add(tearLight);

    this.invertedCathedralGroup.add(altarGroup);

    // Ambient Cosmic Abyss Illumination
    const abyssLight = new THREE.PointLight(0x7700cc, 4.0, 35);
    abyssLight.position.set(0, 6.0, 0);
    this.invertedCathedralGroup.add(abyssLight);

    this.scene.add(this.invertedCathedralGroup);
  }

  // =========================================================================
  // ACT V FINAL TITAN: ASTAROTH — EL SOL DEL ABISMO (SOLAR TITAN)
  // =========================================================================
  private createAstarothBoss(): void {
    this.astarothGroup = new THREE.Group();
    this.astarothGroup.position.set(0, 0, -395);

    // 1. Black Sun Primordial Core
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x080210,
      roughness: 0.9,
      emissive: 0x330055,
      emissiveIntensity: 1.8
    });
    const sunCore = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 24), coreMat);
    sunCore.position.y = 3.5;
    this.astarothGroup.add(sunCore);

    // 2. Coronal Flare Ring
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0x8811cc,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide
    });
    this.astarothCoronaMesh = new THREE.Mesh(new THREE.RingGeometry(2.6, 4.2, 36), coronaMat);
    this.astarothCoronaMesh.position.y = 3.5;
    this.astarothGroup.add(this.astarothCoronaMesh);

    // 3. Primordial Titan Horns
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x331144, roughness: 0.8 });
    const hornL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.45, 2.4, 8), hornMat);
    hornL.position.set(-1.8, 5.2, 0);
    hornL.rotation.z = -0.55;
    const hornR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.45, 2.4, 8), hornMat);
    hornR.position.set(1.8, 5.2, 0);
    hornR.rotation.z = 0.55;
    this.astarothGroup.add(hornL, hornR);

    // 4. Central Eye of the Void
    const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), new THREE.MeshBasicMaterial({ color: 0xff33bb }));
    eyeMesh.position.set(0, 3.5, 2.3);
    this.astarothGroup.add(eyeMesh);

    // 5. Abyssal Radiant Light
    this.astarothCoreLight = new THREE.PointLight(0x8800cc, 4.5, 22);
    this.astarothCoreLight.position.set(0, 3.5, 0);
    this.astarothGroup.add(this.astarothCoreLight);

    // 6. Warning Ring
    const warnMat = new THREE.MeshBasicMaterial({ color: 0xff2288, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
    this.astarothWarningMesh = new THREE.Mesh(new THREE.RingGeometry(1.6, 4.6, 32), warnMat);
    this.astarothWarningMesh.rotation.x = -Math.PI / 2;
    this.astarothWarningMesh.position.set(0, 0.04, 0);
    this.astarothWarningMesh.visible = false;
    this.astarothGroup.add(this.astarothWarningMesh);

    this.scene.add(this.astarothGroup);
  }

  // =========================================================================
  // CANONICAL FORGE: ALBA GRIS (ESPADA DE LA ELECCIÓN DEFINITIVA)
  // =========================================================================
  private applyAlbaGrisSwordVisual(): void {
    // Visually transform player sword into Alba Gris (dual-tone bisection blade)
    if (this.playerSwordMesh && !this.albaGrisBladeMesh) {
      while (this.playerSwordMesh.children.length > 0) {
        this.playerSwordMesh.remove(this.playerSwordMesh.children[0]);
      }

      this.albaGrisBladeMesh = new THREE.Group();

      const celestialWhiteMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x88eeff,
        emissiveIntensity: 1.4
      });
      const abyssalBlackMat = new THREE.MeshStandardMaterial({
        color: 0x110022,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x550077,
        emissiveIntensity: 1.4
      });
      const hiltGoldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });

      // Left half: Celestial Light
      const whiteHalf = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.25, 0.025), celestialWhiteMat);
      whiteHalf.position.set(-0.02, 0.65, 0);
      whiteHalf.castShadow = true;

      // Right half: Abyssal Fire
      const blackHalf = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.25, 0.025), abyssalBlackMat);
      blackHalf.position.set(0.02, 0.65, 0);
      blackHalf.castShadow = true;

      // Golden Crossguard & Star Gem
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.07), hiltGoldMat);
      guard.position.y = 0.05;

      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 6), hiltGoldMat);
      grip.position.y = -0.08;

      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), new THREE.MeshBasicMaterial({ color: 0x88ffff }));
      gem.position.set(0, 0.05, 0.04);

      const auraLight = new THREE.PointLight(0x88ffff, 2.2, 5);
      auraLight.position.set(0, 0.7, 0);

      this.albaGrisBladeMesh.add(whiteHalf, blackHalf, guard, grip, gem, auraLight);
      this.playerSwordMesh.add(this.albaGrisBladeMesh);
    }

    if (this.dawnGreyTearMesh) {
      this.dawnGreyTearMesh.visible = false;
    }
  }

  public forgeAlbaGrisSword(): void {
    if (this.hasForgedAlbaGris) return;

    this.hasForgedAlbaGris = true;
    this.audio.playCosmicChime?.();
    this.triggerHolyFlash(1.2);
    this.applyAlbaGrisSwordVisual();

    // Award Relic in Inventory & Unlock Canon Chapter 19
    this.inventory.addItem({
      id: 'weapon_dawn_grey',
      name: 'Alba Gris (Espada Biseccionada)',
      description: 'Espada sagrada biseccionada forjada por Elowen y Thomas. Funde la Gota de Luz y el Fuego Negro en perfecta armonía. Inflige +100% daño crítico contra Astaroth.',
      category: 'relic',
      icon: '✨',
      quantity: 1,
      maxQuantity: 1,
      effectType: 'buff_attack',
      effectValue: 70,
      isEquipped: true
    });

    this.canonChapterManager.unlockChapter(19);
    this.spawnFloatingText(this.playerGroup.position, '✨ ¡ALBA GRIS FORJADA! (+100% DAÑO CRÍTICO CONTRA EL TITÁN)', '#88eeff');

    this.showDialogueModal(
      '✦ FORJA DE ALBA GRIS — LA ESPADA DE LA ELECCIÓN DEFINITIVA ✦',
      '«Elowen deposita en tus manos la Gota de Luz Divina, su pureza cristalizada en lágrima celestial. Thomas canaliza a través del pomo el Fuego Negro primordial de su linaje. Ambas energías convergen sin destruirse, fundiéndose en una hoja biseccionada: un filo de blanco estelar puro y un contrafilo de obsidiana abisal. ¡Alba Gris ha nacido para quebrar el Sol de las Tinieblas!»',
      '✦ RECOMPENSA: ESPADA SAGRADA ALBA GRIS FORJADA & EQUIPADA ✦'
    );

    this.updateHUD();
  }

  // =========================================================================
  // SUBTERRANEAN ZONE TRANSITION & SARCOPHAGI INTERACTION
  // =========================================================================
  public transitionToArea(targetArea: DungeonArea): void {
    if (this.isZoneTransitioning) return;
    this.isZoneTransitioning = true;
    this.audio.playCryptDoor?.();

    if (this.zoneTitleEl && this.zoneSubtitleEl && this.zoneTransitionOverlay) {
      if (targetArea === 'inverted_cathedral') {
        this.zoneTitleEl.innerText = '🌌 LA CATEDRAL INVERTIDA — EL SOL DEL ABISMO 🌌';
        this.zoneSubtitleEl.innerText = '«Bajo un cielo de estrellas muertas, la comunión de luz y sombra desafía al Padre de las Cenizas»';
      } else if (targetArea === 'londinium_citadel') {
        this.zoneTitleEl.innerText = '🏛 LONDINIUM — LA CIUDADELA DORADA 🏛';
        this.zoneSubtitleEl.innerText = '«Mármol blanco, falsos ídolos solares y la Ley del Deseo del Rey Malphas»';
      } else if (targetArea === 'great_stone_bridge') {
        this.zoneTitleEl.innerText = '🌉 EL GRAN PUENTE DE PIEDRA — EL CAMINO DE LOS HEREJES 🌉';
        this.zoneSubtitleEl.innerText = '«Sobre las aguas heladas del abismo fluvial, la égida del Capitán Vane bloquea el paso»';
      } else if (targetArea === 'belltower_summit') {
        this.zoneTitleEl.innerText = '🔔 EL CAMPANARIO DEL SUR & EL GRAN CRISOL 🔔';
        this.zoneSubtitleEl.innerText = '«El tañido de hierro ensordecedor y el calor del horno donde Elowen permanece encadenada»';
      } else if (targetArea === 'black_willow_forest') {
        this.zoneTitleEl.innerText = '🌿 EL BOSQUE DEL SAUCE NEGRO 🌿';
        this.zoneSubtitleEl.innerText = '«Entre raíces retorcidas y esporas luminiscentes, el eco del aquelarre ancestral aún palpita»';
      } else if (targetArea === 'crypts_interior') {
        this.zoneTitleEl.innerText = '⚔ CRIPTAS SUBTERRÁNEAS DE SAN JUDE ⚔';
        this.zoneSubtitleEl.innerText = '«Bajo las losas de piedra, la penumbra custodia los secretos del Santo Oficio»';
      } else {
        this.zoneTitleEl.innerText = '🌲 SUPERFICIE DE OAKHAVEN — CEMENTERIO 🌲';
        this.zoneSubtitleEl.innerText = '«El viento helado de la noche susurra entre las tumbas y las cruces»';
      }
      this.zoneTransitionOverlay.style.opacity = '1';
    }

    setTimeout(() => {
      // Hide all boss HUDs upon area transition
      [
        this.inquisitorHpBarContainer,
        this.rootProwlerHpBarContainer,
        this.crucibleHpBarContainer,
        this.vaneHpBarContainer,
        this.malphasHpBarContainer,
        this.astarothHpBarContainer
      ].forEach(hud => {
        if (hud) hud.style.display = 'none';
      });

      if (targetArea === 'inverted_cathedral') {
        this.dungeonAreaManager.enterInvertedCathedral();
        this.setPlayerPosition(0, 0, -370);
        this.cameraYaw = 0;
        this.targetCameraYaw = 0;
        this.audio.playCosmicChime?.();
        this.setDialogueToast(
          'La Catedral Invertida',
          '«La gravedad se invierte ante el vacío cósmico. El Altar de la Comunión aguarda la Gota de Luz de Elowen.»',
          '/assets/icons/icon_crypt_key.png',
          '#ff33aa'
        );
      } else if (targetArea === 'londinium_citadel') {
        this.dungeonAreaManager.enterLondiniumCitadel();
        this.setPlayerPosition(0, 0, -305);
        this.cameraYaw = 0;
        this.targetCameraYaw = 0;
        this.audio.playAstralDistortion?.();
        this.setDialogueToast(
          'Londinium — Ciudadela Dorada',
          '«El Salón de los Espejos y el Trono Astral resplandecen con oro falso. La presencia de Malphas es abrumadora.»',
          '/assets/icons/icon_oakhaven_cross.png',
          '#cc44ff'
        );
      } else if (targetArea === 'great_stone_bridge') {
        this.dungeonAreaManager.enterGreatStoneBridge();
        this.setPlayerPosition(0, 0, -242);
        this.cameraYaw = 0;
        this.targetCameraYaw = 0;
        this.audio.playShieldCrush?.();
        this.setDialogueToast(
          'Gran Puente de Piedra',
          '«La calzada fluvial se alza sobre la niebla. El convoy de prisioneros y el Capitán Vane aguardan más adelante.»',
          '/assets/icons/icon_oakhaven_cross.png',
          '#ffd700'
        );
      } else if (targetArea === 'belltower_summit') {
        this.dungeonAreaManager.enterBelltower();
        this.setPlayerPosition(0, 0, -188);
        this.cameraYaw = 0;
        this.targetCameraYaw = 0;
        this.audio.playBellToll?.();
        this.setDialogueToast(
          'Campanario del Sur',
          '«El calor del Gran Crisol hace temblar las vigas. La celda de sal de Elowen se encuentra en esta cúspide.»',
          '/assets/icons/icon_black_willow_feather.png',
          '#ff7722'
        );
      } else if (targetArea === 'black_willow_forest') {
        this.dungeonAreaManager.enterBlackWillowForest();
        this.setPlayerPosition(0, 0, -128);
        this.cameraYaw = 0;
        this.targetCameraYaw = 0;
        this.audio.playWillowWhisper?.();
        this.setDialogueToast(
          'Bosque del Sauce Negro',
          '«La savia ancestral empapa la tierra. El Gran Sauce Negro vigila desde el centro del aquelarre.»',
          '/assets/icons/icon_black_willow_feather.png',
          '#bb44ff'
        );
      } else if (targetArea === 'crypts_interior') {
        const wasInForest = this.dungeonAreaManager.currentArea === 'black_willow_forest';
        if (wasInForest) {
          this.dungeonAreaManager.exitForestToCrypts();
          this.setPlayerPosition(0, 0, -107);
        } else {
          this.dungeonAreaManager.enterCrypts();
          this.setPlayerPosition(0, 0, -73);
        }
        this.cameraYaw = 0;
        this.targetCameraYaw = 0;
        this.setDialogueToast(
          'Criptas de San Jude',
          '«El aire es frío y huele a polvo consagrado. Cuidado con las baldosas de hierro y las sombras que vigilan el altar.»',
          '/assets/icons/icon_crypt_key.png',
          '#00e5ff'
        );
      } else {
        this.dungeonAreaManager.exitToSurface();
        this.setPlayerPosition(0, 0, -42);
        this.cameraYaw = 0;
        this.targetCameraYaw = 0;
        this.setDialogueToast(
          'Cementerio de Oakhaven',
          '«Has regresado a la superficie. La niebla de Oakhaven te envuelve una vez más.»',
          '/assets/icons/icon_crypt_key.png',
          '#ffd700'
        );
      }

      setTimeout(() => {
        if (this.zoneTransitionOverlay) {
          this.zoneTransitionOverlay.style.opacity = '0';
        }
        setTimeout(() => {
          this.isZoneTransitioning = false;
        }, 350);
      }, 400);
    }, 380);
  }

  public interactWithLootSarcophagus(): void {
    const sarc = this.dungeonAreaManager.getSarcophagus('sarcophagus_loot');
    if (!sarc || sarc.isOpened) {
      this.spawnFloatingText(new THREE.Vector3(-3.8, 1.2, -85), 'El sarcófago ya está vacío.', '#aaaaaa');
      return;
    }

    this.dungeonAreaManager.openSarcophagus('sarcophagus_loot');
    this.audio.playCryptDoor?.();

    // Slide lid open
    const lid = this.cryptSarcophagusLootGroup.getObjectByName('sarcLid1');
    if (lid) {
      lid.position.z += 0.9;
    }

    this.progression.addExp(40);
    this.inventory.addItem(CANONICAL_MATERIALS.herb_silverleaf, 2);
    this.inventory.addItem(CANONICAL_MATERIALS.water_blessed, 1);
    this.spawnFloatingText(new THREE.Vector3(-3.8, 1.5, -85), '✦ +40 EXP • 2 HOJA DE PLATA • 1 AGUA BENDITA ✦', '#ffd700');
    this.updateHUD();

    this.setDialogueToast(
      'Sarcófago Profanado',
      '«Dentro del ataúd de piedra reposaban frascos de agua bendita y hierbas de plata usadas en los antiguos ritos funerarios.»',
      '/assets/icons/icon_holy_water.png',
      '#a3ffc7'
    );
  }

  public interactWithAmbushSarcophagus(): void {
    if (this.cryptAmbushAwakened) {
      this.spawnFloatingText(new THREE.Vector3(3.8, 1.2, -97), 'El sarcófago ha sido forzado.', '#aaaaaa');
      return;
    }

    this.cryptAmbushAwakened = true;
    this.dungeonAreaManager.openSarcophagus('sarcophagus_ambush');

    // Slide lid
    const lid = this.cryptSarcophagusAmbushGroup.getObjectByName('sarcLid2');
    if (lid) {
      lid.position.x += 1.0;
    }

    this.cryptAmbushSkeletonGroup.visible = true;
    this.cryptAmbushSkeletonGroup.position.set(3.8, 0, -97);
    this.audio.playGlassShatter?.();
    this.audio.playSfx('warning');
    this.spawnFloatingText(this.cryptAmbushSkeletonGroup.position, '⚠️ ¡EMBOSCADA DE PENITENTE!', '#ff4444');

    this.setDialogueToast(
      'Penitente de las Catacumbas',
      '«¡Malditos seáis los profanadores del santuario! ¡Vuestra sangre sellará esta cripta!»',
      '/assets/icons/icon_crypt_key.png',
      '#ff4444'
    );
  }

  public handleInquisitorDefeat(): void {
    this.audio.playFinisherSound(true);
    this.triggerHolyFlash(1.0);
    this.spawnFloatingText(this.inquisitorGroup.position, '👑 ¡INQUISIDOR PURIFICADO! (+250 EXP)', '#ffd700');
    this.inquisitorGroup.position.y = -0.4;

    const rewards = this.inquisitorEncounter.claimRewards(this.inventory, this.progression);
    if (rewards.claimed) {
      this.awardEnemyKillRewards('inquisitor', true);
      // Restore player health to max
      this.playerStats.health = this.playerStats.maxHealth;
      this.spawnFloatingText(this.playerGroup.position, '✝ SALUD RESTAURADA AL MÁXIMO ✝', '#88ffaa');
      this.updateHUD();

      this.setDialogueToast(
        'El Inquisidor Caído',
        '«Las cadenas del fanatismo se rompen... El Sello de la Inquisición es tuyo. Llévalo ante la luz.»',
        '/assets/icons/icon_oakhaven_cross.png',
        '#ffd700'
      );
    }

    if (this.inquisitorHpBarContainer) {
      setTimeout(() => {
        if (this.inquisitorHpBarContainer) {
          this.inquisitorHpBarContainer.style.display = 'none';
        }
      }, 2500);
    }
  }

  // =========================================================================
  // ZONE 3: SISTER ALTAR, ROOT PROWLER BEAST & ECO DEL AQUELARRE
  // =========================================================================
  public interactWithSisterAltar(): void {
    if (this.inventory.hasWillowFang()) {
      this.showDialogueModal(
        '✦ ALTAR DEL AQUELARRE — LAS NUEVE HERMANAS ✦',
        '«El altar de piedra descansa en serena comunión con las raíces del Gran Sauce Negro. El Colmillo del Sauce reposa a tu cinto: pulsa [U] para liberar el Eco del Aquelarre siempre que las sombras te rodeen.»',
        '✦ ALTAR SAGRADO CONSAGRADO — ECO DEL AQUELARRE [U] DISPONIBLE ✦'
      );
      return;
    }

    this.inventory.addItem(CANONICAL_WILLOW_RELIC);
    this.audio.playWillowWhisper?.();
    this.triggerHolyFlash(0.5);

    if (this.willowRelicMeshGroup) {
      this.willowRelicMeshGroup.visible = false;
    }

    this.spawnFloatingText(
      this.playerGroup.position,
      '✨ ¡COLMILLO DEL SAUCE NEGRO RECLAMADO! [U] DESBLOQUEADO',
      '#cc66ff'
    );

    this.showDialogueModal(
      '✦ ALTAR DEL AQUELARRE — EL COLMILLO DEL SAUCE NEGRO ✦',
      '«Khaterine... Sientes la sangre antigua hervir en tus venas ante los monolitos de tus hermanas caídas. De las raíces pétreas emerge el Colmillo del Sauce Negro: dagas gemelas de obsidiana consagradas con la memoria del aquelarre. Ahora puedes pulsar [U] para liberar el Eco del Aquelarre, un vórtice espectral lacerante que desgarra a todos los enemigos a tu alrededor y te confiere invulnerabilidad momentánea.»',
      '✦ RECOMPENSA: RELIQUIA COLMILLO DEL SAUCE NEGRO & HABILIDAD [U] DESBLOQUEADA ✦'
    );
    this.updateHUD();
  }

  public handleRootProwlerDefeat(): void {
    this.rootProwlerEncounter.setState('DEAD');
    this.rootProwlerGroup.position.y = -0.4;
    this.rootProwlerEyesLight.intensity = 0;
    this.audio.playFinisherSound(true);

    const reward = this.rootProwlerEncounter.claimRewards(this.inventory, this.progression);
    if (reward.claimed) {
      this.spawnFloatingText(
        this.rootProwlerGroup.position,
        `🌿 ¡ACECHADOR PURIFICADO! (+${reward.expAwarded} EXP & ESENCIA DEL SAUCE)`,
        '#bb44ff'
      );
      this.setDialogueToast(
        'Acechador de Raíces Purificado',
        '«La savia corrupta del Sauce Negro se evapora. Las raíces retroceden abriendo el paso hacia el Altar de las Hermanas.»',
        '/assets/icons/icon_black_willow_feather.png',
        '#bb44ff'
      );
    }
    if (this.rootProwlerHpBarContainer) {
      setTimeout(() => {
        if (this.rootProwlerHpBarContainer) {
          this.rootProwlerHpBarContainer.style.display = 'none';
        }
      }, 2500);
    }
    this.updateHUD();
  }

  public executeKhaterineEchoVortex(): void {
    if (this.activeHero !== 'khaterine') {
      this.spawnFloatingText(this.playerGroup.position, '¡Solo Khaterine puede desatar el Eco del Aquelarre!', '#bb44ff');
      return;
    }

    if (!this.inventory.hasWillowFang()) {
      this.audio.playSfx('warning');
      this.spawnFloatingText(this.playerGroup.position, '🔒 Requiere el Colmillo del Sauce Negro (Altar de las Hermanas)', '#bb44ff');
      return;
    }

    if (this.daggerVortexCooldown > 0) {
      this.audio.playSfx('warning');
      this.spawnFloatingText(this.playerGroup.position, `⌛ En recarga (${this.daggerVortexCooldown.toFixed(1)}s)`, '#ffd700');
      return;
    }

    this.daggerVortexCooldown = 6.0;
    this.isDaggerVortexActive = true;
    this.daggerVortexTimer = 0.8;
    this.playerStats.isDodging = true;
    setTimeout(() => { this.playerStats.isDodging = false; }, 600);

    this.audio.playDaggerVortex?.();
    this.triggerScreenShake(0.5);
    this.spawnFloatingText(this.playerGroup.position, '🗡️ ¡ECO DEL AQUELARRE!', '#cc66ff');

    const vortexRadius = 3.6;
    const pPos = this.playerGroup.position;

    // 1. Check Root Prowler in Forest
    if (this.dungeonAreaManager.currentArea === 'black_willow_forest' && !this.rootProwlerEncounter.isDefeated) {
      if (pPos.distanceTo(this.rootProwlerGroup.position) <= vortexRadius) {
        const hitRes = this.rootProwlerEncounter.takeDamage(60, false);
        this.spawnFloatingText(this.rootProwlerGroup.position, `🗡️ -${hitRes.actualDamage} (VÓRTICE)`, '#cc66ff');
        this.rootProwlerEncounter.setState('STUNNED');
        this.rootProwlerTimer = 1.3;
        if (this.rootProwlerHpBarFill) {
          this.rootProwlerHpBarFill.style.width = `${Math.max(0, (this.rootProwlerEncounter.health / this.rootProwlerEncounter.maxHealth) * 100)}%`;
        }
        if (hitRes.defeated) {
          this.handleRootProwlerDefeat();
        }
      }
    }

    // 2. Check Catacomb Inquisitor
    if (this.dungeonAreaManager.currentArea === 'crypts_interior' && !this.inquisitorEncounter.isDefeated) {
      if (pPos.distanceTo(this.inquisitorGroup.position) <= vortexRadius) {
        const hitRes = this.inquisitorEncounter.takeDamage(60, false);
        this.spawnFloatingText(this.inquisitorGroup.position, `🗡️ -${hitRes.actualDamage} (VÓRTICE)`, '#cc66ff');
        if (this.inquisitorHpBarFill) {
          this.inquisitorHpBarFill.style.width = `${Math.max(0, (this.inquisitorEncounter.health / this.inquisitorEncounter.maxHealth) * 100)}%`;
        }
        if (hitRes.defeated) {
          this.handleInquisitorDefeat();
        }
      }
    }

    // 3. Check Standard Enemies
    [
      { grp: this.enemyGroup, alive: this.enemyState !== 'DEAD', applyDmg: (dmg: number) => { this.enemyHealth = Math.max(0, this.enemyHealth - dmg); if (this.enemyHealth <= 0) { this.enemyState = 'DEAD'; this.enemyGroup.position.y = -0.3; this.awardEnemyKillRewards('hound', false); } } },
      { grp: this.cultistGroup, alive: this.cultistState !== 'DEAD', applyDmg: (dmg: number) => { this.cultistHealth = Math.max(0, this.cultistHealth - dmg); if (this.cultistHealth <= 0) { this.cultistState = 'DEAD'; this.cultistGroup.position.y = -0.3; this.awardEnemyKillRewards('cultist', false); } } },
      { grp: this.zealotGroup, alive: this.zealotState !== 'DEAD', applyDmg: (dmg: number) => { this.zealotHealth = Math.max(0, this.zealotHealth - dmg); if (this.zealotHealth <= 0) { this.zealotState = 'DEAD'; this.zealotGroup.position.y = -0.3; this.awardEnemyKillRewards('zealot', false); } } },
      { grp: this.skeletonGroup, alive: this.skeletonState !== 'DEAD', applyDmg: (dmg: number) => { this.skeletonHealth = Math.max(0, this.skeletonHealth - dmg); if (this.skeletonHealth <= 0) { this.skeletonState = 'DEAD'; this.skeletonGroup.position.y = -0.3; this.awardEnemyKillRewards('skeleton', false); } } },
      { grp: this.cryptAmbushSkeletonGroup, alive: this.cryptAmbushAwakened && !this.cryptAmbushDead, applyDmg: (dmg: number) => { this.cryptAmbushHp = Math.max(0, this.cryptAmbushHp - dmg); if (this.cryptAmbushHp <= 0) { this.cryptAmbushDead = true; this.cryptAmbushSkeletonGroup.position.y = -0.3; this.awardEnemyKillRewards('crypt_ambush', false); } } }
    ].forEach(e => {
      if (e.alive && pPos.distanceTo(e.grp.position) <= vortexRadius) {
        e.applyDmg(60);
        this.spawnFloatingText(e.grp.position, '🗡️ -60 (VÓRTICE)', '#cc66ff');
      }
    });

    // 4. Check Morwenna
    if (this.morwennaState !== 'DORMANT' && this.morwennaState !== 'DEAD' && pPos.distanceTo(this.morwennaGroup.position) <= vortexRadius) {
      const mResult = this.morwennaEncounter.takeDamage(60);
      this.morwennaHealth = mResult.currentHealth;
      this.spawnFloatingText(this.morwennaGroup.position, '🗡️ -60 (VÓRTICE)', '#cc66ff');
      if (mResult.transitionedToPhase2) {
        this.triggerMorwennaPhase2();
      } else if (mResult.defeated) {
        this.handleMorwennaDefeat();
      }
    }

    // 5. Check Act II - V Canonical Bosses
    if (this.dungeonAreaManager.currentArea === 'belltower_summit' && !this.crucibleGuardianEncounter.isDefeated) {
      if (pPos.distanceTo(this.crucibleGuardianGroup.position) <= vortexRadius) {
        const hitRes = this.crucibleGuardianEncounter.takeDamage(65, this.crucibleGuardianEncounter.state === 'STUNNED');
        this.spawnFloatingText(this.crucibleGuardianGroup.position, `🗡️ -${hitRes.actualDamage} (VÓRTICE)`, '#cc66ff');
        this.crucibleGuardianEncounter.setState('STUNNED');
        this.crucibleTimer = 1.4;
        if (hitRes.defeated) this.handleCrucibleGuardianDefeat();
      }
    }

    if (this.dungeonAreaManager.currentArea === 'great_stone_bridge' && !this.captainVaneEncounter.isDefeated) {
      if (pPos.distanceTo(this.captainVaneGroup.position) <= vortexRadius) {
        if (this.captainVaneEncounter.shieldRaised) {
          this.captainVaneEncounter.breakShield();
          this.vaneTimer = 1.8;
          this.audio.playSfx('shield_break');
          if (this.vaneShieldMesh) this.vaneShieldMesh.rotation.x = 1.1;
          this.spawnFloatingText(this.captainVaneGroup.position, '💥 ¡ESCUDO DE TORRE QUEBRADO!', '#ffd700');
        }
        const hitRes = this.captainVaneEncounter.takeDamage(65, false, true);
        this.spawnFloatingText(this.captainVaneGroup.position, `🗡️ -${hitRes.actualDamage} (VÓRTICE)`, '#cc66ff');
        if (hitRes.defeated) this.handleCaptainVaneDefeat();
      }
    }

    if (this.dungeonAreaManager.currentArea === 'londinium_citadel' && !this.rexMalphasEncounter.isDefeated) {
      if (pPos.distanceTo(this.rexMalphasGroup.position) <= vortexRadius) {
        const hitRes = this.rexMalphasEncounter.takeDamage(65);
        this.spawnFloatingText(this.rexMalphasGroup.position, `🗡️ -${hitRes.actualDamage} (VÓRTICE)`, '#cc66ff');
        if (hitRes.transitionedToPhase2) this.triggerRexMalphasPhase2();
        if (hitRes.defeated) this.handleRexMalphasDefeat();
      }
    }

    if (this.dungeonAreaManager.currentArea === 'inverted_cathedral' && !this.astarothEncounter.isDefeated) {
      const distHoriz = new THREE.Vector2(pPos.x - this.astarothGroup.position.x, pPos.z - this.astarothGroup.position.z).length();
      if (distHoriz <= vortexRadius + 1.4) {
        const hitRes = this.astarothEncounter.takeDamage(65, this.hasForgedAlbaGris);
        this.spawnFloatingText(this.astarothGroup.position, `🗡️ -${hitRes.actualDamage} (VÓRTICE)`, '#cc66ff');
        if (hitRes.defeated) this.handleAstarothDefeat();
      }
    }

    this.updateHUD();
  }

  private updateRootProwler(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'black_willow_forest') {
      if (this.rootProwlerHpBarContainer) {
        this.rootProwlerHpBarContainer.style.display = 'none';
      }
      return;
    }

    if (this.rootProwlerEncounter.isDefeated) {
      this.rootProwlerEyesLight.intensity = 0;
      this.rootProwlerGroup.position.y = -0.4;
      return;
    }

    if (!this.isGameplayActive()) return;

    const pPos = this.playerGroup.position;
    const prowlerPos = this.rootProwlerGroup.position;
    const distToPlayer = prowlerPos.distanceTo(pPos);

    if (this.rootProwlerHpBarContainer) {
      this.rootProwlerHpBarContainer.style.display = distToPlayer <= 14 ? 'block' : 'none';
    }

    if (this.rootProwlerEncounter.state === 'PATROL') {
      prowlerPos.x += this.rootProwlerPatrolDir * delta * 1.6;
      if (prowlerPos.x > 3.5) {
        prowlerPos.x = 3.5;
        this.rootProwlerPatrolDir = -1;
      } else if (prowlerPos.x < -3.5) {
        prowlerPos.x = -3.5;
        this.rootProwlerPatrolDir = 1;
      }
      this.rootProwlerGroup.rotation.y = this.rootProwlerPatrolDir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;

      if (distToPlayer <= 7.5) {
        this.rootProwlerEncounter.setState('ALERT');
        this.rootProwlerTimer = 0.6;
        this.audio.playBeastRoar?.();
        this.spawnFloatingText(prowlerPos, '🐾 ¡ACECHADOR DE RAÍCES ALERTA!', '#bb44ff');
      }
    } else if (this.rootProwlerEncounter.state === 'ALERT') {
      this.rootProwlerTimer -= delta;
      this.rootProwlerGroup.lookAt(pPos.x, prowlerPos.y, pPos.z);
      if (this.rootProwlerTimer <= 0) {
        this.rootProwlerEncounter.setState('CHASE');
      }
    } else if (this.rootProwlerEncounter.state === 'CHASE') {
      this.rootProwlerGroup.lookAt(pPos.x, prowlerPos.y, pPos.z);
      const dir = pPos.clone().sub(prowlerPos).normalize();
      prowlerPos.addScaledVector(dir, delta * 3.4);

      if (distToPlayer <= 2.2) {
        this.rootProwlerEncounter.setState('WINDUP');
        this.rootProwlerTimer = 0.45;
        this.rootProwlerWarningMesh.visible = false;
      } else if (distToPlayer <= 4.2 && distToPlayer > 2.8) {
        this.rootProwlerEncounter.setState('WINDUP');
        this.rootProwlerTimer = 0.65;
        this.rootProwlerWarningMesh.visible = true;
      }
    } else if (this.rootProwlerEncounter.state === 'WINDUP') {
      this.rootProwlerTimer -= delta;
      this.rootProwlerGroup.lookAt(pPos.x, prowlerPos.y, pPos.z);
      if (this.rootProwlerTimer <= 0) {
        const isPounce = this.rootProwlerWarningMesh.visible;
        this.rootProwlerWarningMesh.visible = false;
        this.rootProwlerEncounter.setState('ATTACK');

        const atkRes = this.rootProwlerEncounter.evaluateAttack(distToPlayer, this.playerStats.isDodging, isPounce);
        if (atkRes.hit) {
          if (this.playerStats.isGuarding) {
            this.playerStats.posture = Math.max(0, this.playerStats.posture - (isPounce ? 35 : 20));
            this.audio.playSfx('parry');
            this.spawnFloatingText(pPos, '🛡️ ¡ZARPA BLOQUEADA!', '#ffd700');
          } else {
            const dmg = this.calculateIncomingDamage(atkRes.damage, 6);
            this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
            this.triggerScreenShake(isPounce ? 0.4 : 0.2);
            this.triggerDamageVignette(0.6);
            this.audio.playCombatHit(true);
            this.spawnFloatingText(pPos, `-${dmg} (ZARPAS DE RAÍZ)`, '#ff3344');

            if (this.playerStats.health <= 0) {
              this.handlePlayerDefeatAndRespawn();
            }
          }
        } else if (this.playerStats.isDodging) {
          this.audio.playSfx('dodge');
          this.spawnFloatingText(pPos, '⚡ ¡ESQUIVADO PERFECTO!', '#00e5ff');
        }

        this.rootProwlerEncounter.setState('RECOVERY');
        this.rootProwlerTimer = 1.0;
        this.updateHUD();
      }
    } else if (this.rootProwlerEncounter.state === 'RECOVERY') {
      this.rootProwlerTimer -= delta;
      if (this.rootProwlerTimer <= 0) {
        this.rootProwlerEncounter.setState('CHASE');
      }
    } else if (this.rootProwlerEncounter.state === 'STUNNED') {
      this.rootProwlerTimer -= delta;
      this.rootProwlerGroup.position.y = -0.15;
      if (this.rootProwlerTimer <= 0) {
        this.rootProwlerGroup.position.y = 0;
        this.rootProwlerEncounter.setState('CHASE');
      }
    }
  }

  // =========================================================================
  // ACT II BOSS: EL GUARDIÁN DEL CRISOL (CRUCIBLE GUARDIAN UPDATE LOOP)
  // =========================================================================
  private updateCrucibleGuardian(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'belltower_summit') {
      if (this.crucibleHpBarContainer) this.crucibleHpBarContainer.style.display = 'none';
      return;
    }

    if (this.crucibleGuardianEncounter.isDefeated) {
      this.crucibleGuardianGroup.position.y = -0.4;
      if (this.crucibleSlagLight) this.crucibleSlagLight.intensity = Math.max(0, this.crucibleSlagLight.intensity - delta * 2);
      return;
    }

    if (!this.isGameplayActive()) return;

    const pPos = this.playerGroup.position;
    const gPos = this.crucibleGuardianGroup.position;
    const toPlayer = pPos.clone().sub(gPos);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    if (this.crucibleHpBarContainer) {
      this.crucibleHpBarContainer.style.display = distToPlayer <= 16 ? 'block' : 'none';
    }

    // Orient towards player
    if (distToPlayer > 0.1) {
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      this.crucibleGuardianGroup.rotation.y = THREE.MathUtils.lerp(this.crucibleGuardianGroup.rotation.y, targetAngle, 0.08);
    }

    if (this.crucibleGuardianEncounter.state === 'DORMANT') {
      if (pPos.z <= -191) {
        this.crucibleGuardianEncounter.setState('CHASE');
        this.audio.playBellToll?.();
        this.audio.playSfx('warning');
        this.spawnFloatingText(gPos, '🔨 ¡EL GUARDIÁN DEL CRISOL DESPIERTA!', '#ff7722');
        this.setDialogueToast(
          'El Guardián del Crisol',
          '«¡Nadie profanará la torre sagrada! ¡El crisol de bronce devorará la carne de los herejes!»',
          '/assets/concepts/concept_morwenna.png',
          '#ff7722'
        );
      }
      return;
    }

    if (this.crucibleGuardianEncounter.state === 'CHASE') {
      if (this.crucibleWarningMesh) this.crucibleWarningMesh.visible = false;
      if (distToPlayer > 2.8) {
        toPlayer.normalize();
        gPos.add(toPlayer.multiplyScalar(2.2 * delta));
        gPos.x = THREE.MathUtils.clamp(gPos.x, -5.5, 5.5);
        gPos.z = THREE.MathUtils.clamp(gPos.z, -218, -186);
      } else {
        const isBurst = Math.random() < 0.35;
        this.crucibleGuardianEncounter.setState(isBurst ? 'SLAG_BURST' : 'HAMMER_SLAM');
        this.crucibleTimer = isBurst ? 0.8 : 0.65;
        if (this.crucibleWarningMesh) this.crucibleWarningMesh.visible = true;
        this.audio.playSfx('warning');
      }
    } else if (this.crucibleGuardianEncounter.state === 'HAMMER_SLAM' || this.crucibleGuardianEncounter.state === 'SLAG_BURST') {
      this.crucibleTimer -= delta;
      if (this.crucibleWarningMesh) {
        this.crucibleWarningMesh.rotation.y += delta * 8;
        this.crucibleWarningMesh.visible = Math.floor(this.clock.elapsedTime * 20) % 2 === 0;
      }

      if (this.crucibleTimer <= 0) {
        if (this.crucibleWarningMesh) this.crucibleWarningMesh.visible = false;
        const isBurst = this.crucibleGuardianEncounter.state === 'SLAG_BURST';
        const attackRes = this.crucibleGuardianEncounter.evaluateAttack(distToPlayer, this.playerStats.isDodging, isBurst);
        if (attackRes.hit) {
          const parryWindow = 280 + this.inventory.getParryBonusMs();
          const isParry = this.playerStats.isGuarding && (performance.now() - this.lastGuardTime) <= parryWindow;
          if (isParry) {
            this.audio.playSfx('parry');
            this.triggerHolyFlash(0.85);
            this.crucibleGuardianEncounter.setState('STUNNED');
            this.crucibleTimer = 2.0 * this.getStaggerMultiplier();
            this.spawnFloatingText(pPos, '⚡ ¡PARRY DE MARTILLO!', '#66ccff');
            this.spawnFloatingText(gPos, '⚡ ¡VULNERABLE! [E] ¡REMATAR!', '#ffd700');
            this.updateHUD();
            return;
          } else if (this.playerStats.isGuarding) {
            const blockedDmg = Math.round(attackRes.damage * 0.4);
            this.playerStats.health = Math.max(0, this.playerStats.health - blockedDmg);
            this.playerStats.posture = Math.max(0, this.playerStats.posture - 25);
            this.audio.playShieldCrush();
            this.spawnFloatingText(pPos, `-${blockedDmg} (¡BLOQUEO!)`, '#ffd700');
          } else {
            const dmg = this.calculateIncomingDamage(attackRes.damage, 6);
            this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
            this.triggerDamageVignette(0.65);
            this.audio.playCombatHit(true);
            this.spawnFloatingText(pPos, `-${dmg} (${isBurst ? 'ESTALLIDO DE ESCORIA' : 'MARTILLAZO DE CRISOL'})`, '#ff3344');

            if (this.playerStats.health <= 0) {
              this.handlePlayerDefeatAndRespawn();
              return;
            }
          }
        } else if (this.playerStats.isDodging) {
          this.audio.playSfx('dodge');
          this.spawnFloatingText(pPos, '⚡ ¡ESQUIVADO PERFECTO!', '#00e5ff');
        }

        this.crucibleGuardianEncounter.setState('CHASE');
        this.updateHUD();
      }
    } else if (this.crucibleGuardianEncounter.state === 'STUNNED') {
      this.crucibleTimer -= delta;
      this.crucibleGuardianGroup.position.y = -0.15;
      if (this.crucibleTimer <= 0) {
        this.crucibleGuardianGroup.position.y = 0;
        this.crucibleGuardianEncounter.setState('CHASE');
      }
    }
  }

  public handleCrucibleGuardianDefeat(): void {
    this.crucibleGuardianEncounter.setState('DEAD');
    this.crucibleGuardianGroup.position.y = -0.4;
    if (this.crucibleWarningMesh) this.crucibleWarningMesh.visible = false;
    this.audio.playFinisherSound(true);
    this.triggerHolyFlash(1.0);

    const reward = this.crucibleGuardianEncounter.claimRewards(this.inventory, this.progression);
    if (reward.claimed) {
      this.spawnFloatingText(
        this.crucibleGuardianGroup.position,
        `👑 ¡GUARDIÁN DEL CRISOL PURIFICADO! (+${reward.expAwarded} EXP & LAMENTO DE OAKHAVEN)`,
        '#ffaa44'
      );
      this.canonChapterManager.unlockChapter(9);
      this.setDialogueToast(
        'El Guardián del Crisol Derrotado',
        '«El coloso de bronce colapsa despidiendo ascuas. La celda de sal de Elowen ha quedado abierta y la reliquia del Lamento de Oakhaven es tuya. Avanza hacia el Gran Crisol para marchar al Gran Puente.»',
        '/assets/concepts/concept_morwenna.png',
        '#ffd700'
      );
    }
    if (this.crucibleHpBarContainer) {
      setTimeout(() => {
        if (this.crucibleHpBarContainer) this.crucibleHpBarContainer.style.display = 'none';
      }, 2500);
    }
    this.updateHUD();
  }

  // =========================================================================
  // ACT III BOSS: CAPITÁN ÁUREO VANE (CAPTAIN VANE UPDATE LOOP)
  // =========================================================================
  private updateCaptainVane(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'great_stone_bridge') {
      if (this.vaneHpBarContainer) this.vaneHpBarContainer.style.display = 'none';
      return;
    }

    if (this.captainVaneEncounter.isDefeated) {
      this.captainVaneGroup.position.y = -0.4;
      return;
    }

    if (!this.isGameplayActive()) return;

    const pPos = this.playerGroup.position;
    const vPos = this.captainVaneGroup.position;
    const toPlayer = pPos.clone().sub(vPos);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    if (this.vaneHpBarContainer) {
      this.vaneHpBarContainer.style.display = distToPlayer <= 16 ? 'block' : 'none';
    }

    // Orient towards player
    if (distToPlayer > 0.1) {
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      this.captainVaneGroup.rotation.y = THREE.MathUtils.lerp(this.captainVaneGroup.rotation.y, targetAngle, 0.08);
    }

    if (this.captainVaneEncounter.state === 'GUARDING') {
      if (pPos.z <= -248) {
        this.captainVaneEncounter.setState('CHASE');
        this.audio.playShieldCrush?.();
        this.audio.playSfx('warning');
        this.spawnFloatingText(vPos, '🛡️ ¡EL CAPITÁN ÁUREO VANE ALZA SU ESCUDO!', '#ffd700');
        this.setDialogueToast(
          'Capitán Áureo Vane',
          '«¡Por el Rey Alaric y el Cáliz Solar! ¡Nadie cruzará el Gran Puente de Piedra con vida!»',
          '/assets/icons/icon_oakhaven_cross.png',
          '#ffd700'
        );
      }
      return;
    }

    if (this.captainVaneEncounter.state === 'CHASE') {
      if (this.vaneWarningMesh) this.vaneWarningMesh.visible = false;
      if (distToPlayer > 2.6) {
        toPlayer.normalize();
        vPos.add(toPlayer.multiplyScalar(2.4 * delta));
        vPos.x = THREE.MathUtils.clamp(vPos.x, -4.0, 4.0);
        vPos.z = THREE.MathUtils.clamp(vPos.z, -276, -244);
      } else {
        const isSlash = !this.captainVaneEncounter.shieldRaised || Math.random() < 0.5;
        this.captainVaneEncounter.setState(isSlash ? 'GREAT_SLASH' : 'BASH');
        this.vaneTimer = isSlash ? 0.65 : 0.55;
        if (this.vaneWarningMesh) this.vaneWarningMesh.visible = true;
        this.audio.playSfx('warning');
      }
    } else if (this.captainVaneEncounter.state === 'BASH' || this.captainVaneEncounter.state === 'GREAT_SLASH') {
      this.vaneTimer -= delta;
      if (this.vaneWarningMesh) {
        this.vaneWarningMesh.rotation.y += delta * 8;
        this.vaneWarningMesh.visible = Math.floor(this.clock.elapsedTime * 20) % 2 === 0;
      }

      if (this.vaneTimer <= 0) {
        if (this.vaneWarningMesh) this.vaneWarningMesh.visible = false;
        const isSlash = this.captainVaneEncounter.state === 'GREAT_SLASH';
        const attackRes = this.captainVaneEncounter.evaluateAttack(distToPlayer, this.playerStats.isDodging, isSlash);
        if (attackRes.hit) {
          const parryWindow = 280 + this.inventory.getParryBonusMs();
          const isParry = this.playerStats.isGuarding && (performance.now() - this.lastGuardTime) <= parryWindow;
          if (isParry) {
            this.audio.playSfx('parry');
            this.audio.playSfx('shield_break');
            this.triggerHolyFlash(0.85);
            this.captainVaneEncounter.breakShield();
            if (this.vaneShieldMesh) this.vaneShieldMesh.rotation.x = 1.1;
            this.vaneTimer = 2.0 * this.getStaggerMultiplier();
            this.spawnFloatingText(pPos, '⚡ ¡PARRY PERFECTO! ¡ESCUDO QUEBRADO!', '#66ccff');
            this.spawnFloatingText(vPos, '⚡ ¡ATURDIDO! [E] ¡REMATAR!', '#ffd700');
            this.updateHUD();
            return;
          } else if (this.playerStats.isGuarding) {
            const blockedDmg = Math.round(attackRes.damage * 0.4);
            this.playerStats.health = Math.max(0, this.playerStats.health - blockedDmg);
            this.playerStats.posture = Math.max(0, this.playerStats.posture - 25);
            this.audio.playShieldCrush();
            this.spawnFloatingText(pPos, `-${blockedDmg} (¡BLOQUEO!)`, '#ffd700');
          } else {
            const dmg = this.calculateIncomingDamage(attackRes.damage, 7);
            this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
            this.triggerDamageVignette(0.65);
            this.audio.playCombatHit(true);
            this.spawnFloatingText(pPos, `-${dmg} (${isSlash ? 'TAJO DE FALSO VEREDICTO' : 'GOLPE DE ESCUDO ÁUREO'})`, '#ffd700');

            if (this.playerStats.health <= 0) {
              this.handlePlayerDefeatAndRespawn();
              return;
            }
          }
        } else if (this.playerStats.isDodging) {
          this.audio.playSfx('dodge');
          this.spawnFloatingText(pPos, '⚡ ¡ESQUIVADO PERFECTO!', '#00e5ff');
        }

        this.captainVaneEncounter.setState('CHASE');
        this.updateHUD();
      }
    } else if (this.captainVaneEncounter.state === 'STUNNED') {
      this.vaneTimer -= delta;
      this.captainVaneGroup.position.y = -0.15;
      if (this.vaneTimer <= 0) {
        this.captainVaneGroup.position.y = 0;
        this.captainVaneEncounter.setState('CHASE');
      }
    }
  }

  public handleCaptainVaneDefeat(): void {
    this.captainVaneEncounter.setState('DEAD');
    this.captainVaneGroup.position.y = -0.4;
    if (this.vaneWarningMesh) this.vaneWarningMesh.visible = false;
    this.audio.playFinisherSound(true);
    this.triggerHolyFlash(1.0);

    const reward = this.captainVaneEncounter.claimRewards(this.inventory, this.progression);
    if (reward.claimed) {
      this.spawnFloatingText(
        this.captainVaneGroup.position,
        `👑 ¡CAPITÁN ÁUREO VANE DERROTADO! (+${reward.expAwarded} EXP & FALSO VEREDICTO)`,
        '#ffd700'
      );
      this.canonChapterManager.unlockChapter(13);
      this.setDialogueToast(
        'Capitán Áureo Vane Derrotado',
        '«El monumental escudo de torre cae con estruendo sobre las losas del puente. Has desarmado el Falso Veredicto y el acceso hacia Londinium al norte está libre.»',
        '/assets/icons/icon_oakhaven_cross.png',
        '#ffd700'
      );
    }
    if (this.vaneHpBarContainer) {
      setTimeout(() => {
        if (this.vaneHpBarContainer) this.vaneHpBarContainer.style.display = 'none';
      }, 2500);
    }
    this.updateHUD();
  }

  // =========================================================================
  // ACT IV BOSS: REX MALPHAS / ALARIC (THE ASTRAL DESPOT UPDATE LOOP)
  // =========================================================================
  private triggerRexMalphasPhase2(): void {
    this.audio.playBossPhaseChangeSound();
    this.audio.playAstralDistortion?.();
    this.triggerScreenShake(0.7);
    if (this.malphasWarpRingMesh) {
      this.malphasWarpRingMesh.visible = true;
    }
    this.malphasTimer = 0.85;
    this.spawnFloatingText(this.rexMalphasGroup.position, '🌌 ¡FASE 2: LA LEY DEL DESEO! 🌌', '#cc44ff');
    this.setDialogueToast(
      'Rex Malphas (Alaric)',
      '«¡La realidad misma se dobla ante mi voluntad! ¡Contempla la Ley del Deseo, hijo de las cenizas!»',
      '/assets/concepts/concept_thomas.png',
      '#cc44ff'
    );
    if (this.malphasHpBarContainer) {
      this.malphasHpBarContainer.style.borderColor = '#ff33cc';
      const titleEl = this.malphasHpBarContainer.querySelector('div') as HTMLDivElement | null;
      if (titleEl) {
        titleEl.innerText = '🌌 REX MALPHAS — FASE 2: LEY DEL DESEO 🌌';
        titleEl.style.color = '#ffaaee';
      }
    }
  }

  private updateRexMalphas(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'londinium_citadel') {
      if (this.malphasHpBarContainer) this.malphasHpBarContainer.style.display = 'none';
      return;
    }

    if (this.rexMalphasEncounter.isDefeated) {
      this.rexMalphasGroup.position.y = -0.4;
      if (this.malphasWarpRingMesh) this.malphasWarpRingMesh.visible = false;
      return;
    }

    if (!this.isGameplayActive()) return;

    const pPos = this.playerGroup.position;
    const mPos = this.rexMalphasGroup.position;
    const toPlayer = pPos.clone().sub(mPos);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    if (this.malphasHpBarContainer) {
      this.malphasHpBarContainer.style.display = distToPlayer <= 18 ? 'block' : 'none';
    }

    // Orient towards player
    if (distToPlayer > 0.1) {
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      this.rexMalphasGroup.rotation.y = THREE.MathUtils.lerp(this.rexMalphasGroup.rotation.y, targetAngle, 0.08);
    }

    // Phase 2 continuous warp halo rotation
    if (this.rexMalphasEncounter.phase === 2 && this.malphasWarpRingMesh) {
      this.malphasWarpRingMesh.visible = true;
      this.malphasWarpRingMesh.rotation.z += delta * 3.5;
    }

    if (this.rexMalphasEncounter.state === 'ASTRAL_IDLE') {
      if (pPos.z <= -310) {
        this.rexMalphasEncounter.setState('CHASE');
        this.audio.playAstralDistortion?.();
        this.audio.playSfx('warning');
        this.spawnFloatingText(mPos, '👑 ¡REX MALPHAS DESCIENDE DEL TRONO!', '#cc44ff');
        this.setDialogueToast(
          'Rex Malphas (Alaric)',
          '«¿Reconoces a tu propio padre, Thomas? Yo fundé el Aquelarre del Sauce... y yo mismo lo sacrifiqué para ceñirme la corona de Londinium.»',
          '/assets/concepts/concept_thomas.png',
          '#cc44ff'
        );
      }
      return;
    }

    if (this.rexMalphasEncounter.state === 'CHASE') {
      if (this.malphasWarningMesh) this.malphasWarningMesh.visible = false;
      const speed = this.rexMalphasEncounter.phase === 2 ? 3.4 : 2.5;

      if (distToPlayer > 2.7) {
        toPlayer.normalize();
        mPos.add(toPlayer.multiplyScalar(speed * delta));
        mPos.x = THREE.MathUtils.clamp(mPos.x, -6.5, 6.5);
        mPos.z = THREE.MathUtils.clamp(mPos.z, -342, -308);
      } else {
        const isPhase2 = this.rexMalphasEncounter.phase === 2;
        this.rexMalphasEncounter.setState(isPhase2 ? 'LEY_DEL_DESEO' : 'SOLAR_COMBO');
        this.malphasTimer = isPhase2 ? 0.55 : 0.65;
        if (this.malphasWarningMesh) this.malphasWarningMesh.visible = true;
        this.audio.playSfx('warning');
      }
    } else if (this.rexMalphasEncounter.state === 'SOLAR_COMBO' || this.rexMalphasEncounter.state === 'LEY_DEL_DESEO') {
      this.malphasTimer -= delta;
      if (this.malphasWarningMesh) {
        this.malphasWarningMesh.rotation.y += delta * 8;
        this.malphasWarningMesh.visible = Math.floor(this.clock.elapsedTime * 20) % 2 === 0;
      }

      if (this.malphasTimer <= 0) {
        if (this.malphasWarningMesh) this.malphasWarningMesh.visible = false;
        const isTimeWarp = this.rexMalphasEncounter.state === 'LEY_DEL_DESEO';
        const attackRes = this.rexMalphasEncounter.evaluateAttack(distToPlayer, this.playerStats.isDodging, isTimeWarp);

        if (attackRes.hit) {
          const parryWindow = 280 + this.inventory.getParryBonusMs();
          const isParry = this.playerStats.isGuarding && (performance.now() - this.lastGuardTime) <= parryWindow;
          if (isParry) {
            this.audio.playSfx('parry');
            this.triggerHolyFlash(0.85);
            this.rexMalphasEncounter.setState('STUNNED');
            this.malphasTimer = 2.0 * this.getStaggerMultiplier();
            this.spawnFloatingText(pPos, '⚡ ¡PARRY ASTRAL PERFECTO!', '#66ccff');
            this.spawnFloatingText(mPos, '⚡ ¡ATURDIDO! [E] ¡REMATAR!', '#ffd700');
            this.updateHUD();
            return;
          } else if (this.playerStats.isGuarding) {
            const blockedDmg = Math.round(attackRes.damage * 0.45);
            this.playerStats.health = Math.max(0, this.playerStats.health - blockedDmg);
            this.playerStats.posture = Math.max(0, this.playerStats.posture - 30);
            this.audio.playShieldCrush();
            this.spawnFloatingText(pPos, `-${blockedDmg} (¡BLOQUEO ASTRAL!)`, '#ffd700');
          } else {
            const dmg = this.calculateIncomingDamage(attackRes.damage, 8);
            this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
            this.triggerDamageVignette(0.7);
            this.audio.playCombatHit(true);
            this.spawnFloatingText(pPos, `-${dmg} (${isTimeWarp ? 'LEY DEL DESEO' : 'MANDOBLE ÁUREO'})`, '#cc44ff');

            if (this.playerStats.health <= 0) {
              this.handlePlayerDefeatAndRespawn();
              return;
            }
          }
        } else if (this.playerStats.isDodging) {
          this.audio.playSfx('dodge');
          this.spawnFloatingText(pPos, '⚡ ¡ESQUIVADO PERFECTO!', '#00e5ff');
        }

        this.rexMalphasEncounter.setState('CHASE');
        this.updateHUD();
      }
    } else if (this.rexMalphasEncounter.state === 'STUNNED') {
      this.malphasTimer -= delta;
      this.rexMalphasGroup.position.y = -0.15;
      if (this.malphasTimer <= 0) {
        this.rexMalphasGroup.position.y = 0;
        this.rexMalphasEncounter.setState('CHASE');
      }
    }
  }

  public handleRexMalphasDefeat(): void {
    this.rexMalphasEncounter.setState('DEAD');
    this.rexMalphasGroup.position.y = -0.4;
    if (this.malphasWarningMesh) this.malphasWarningMesh.visible = false;
    if (this.malphasWarpRingMesh) this.malphasWarpRingMesh.visible = false;
    this.audio.playFinisherSound(true);
    this.triggerHolyFlash(1.0);

    const reward = this.rexMalphasEncounter.claimRewards(this.inventory, this.progression);
    if (reward.claimed) {
      this.spawnFloatingText(
        this.rexMalphasGroup.position,
        `👑 ¡REX MALPHAS DERROCADO! (+${reward.expAwarded} EXP & ESPEJISMO DE ORO Y HUMO)`,
        '#cc44ff'
      );
      this.canonChapterManager.unlockChapter(17);
      this.setDialogueToast(
        'Rex Malphas Derrocado',
        '«Alaric cae sobre la escalinata del trono. La corona partida rueda por el mármol. Acércate al Trono Astral [E] para descender a la Catedral Invertida.»',
        '/assets/concepts/concept_thomas.png',
        '#cc44ff'
      );
    }
    if (this.malphasHpBarContainer) {
      setTimeout(() => {
        if (this.malphasHpBarContainer) this.malphasHpBarContainer.style.display = 'none';
      }, 2500);
    }
    this.updateHUD();
  }

  // =========================================================================
  // ACT V FINAL TITAN: ASTAROTH — EL SOL DEL ABISMO (TITAN UPDATE LOOP)
  // =========================================================================
  private updateAstarothTitan(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'inverted_cathedral') {
      if (this.astarothHpBarContainer) this.astarothHpBarContainer.style.display = 'none';
      return;
    }

    if (this.astarothEncounter.isDefeated) {
      if (this.astarothCoreLight) this.astarothCoreLight.intensity = Math.max(0, this.astarothCoreLight.intensity - delta * 2);
      return;
    }

    if (!this.isGameplayActive()) return;

    const pPos = this.playerGroup.position;
    const aPos = this.astarothGroup.position;
    const toPlayer = pPos.clone().sub(aPos);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    if (this.astarothHpBarContainer) {
      this.astarothHpBarContainer.style.display = distToPlayer <= 25 ? 'block' : 'none';
    }

    // Floating Cosmic Bobbing
    this.astarothGroup.position.y = Math.sin(this.clock.elapsedTime * 2.2) * 0.25;

    if (this.astarothEncounter.state === 'COSMIC_DAWN') {
      if (pPos.z <= -382) {
        this.astarothEncounter.setState('CHASE');
        this.audio.playAstralDistortion?.();
        this.audio.playSfx('warning');
        this.spawnFloatingText(aPos, '🌌 ¡ASTAROTH: EL SOL DEL ABISMO HA DESPERTADO!', '#ff2288');
        this.setDialogueToast(
          'Astaroth: Padre de las Cenizas',
          '«Soy el Padre de las Cenizas, la noche eterna antes del primer alba. Vuestra carne arderá en el Sol del Abismo.»',
          '/assets/icons/icon_crypt_key.png',
          '#ff2288'
        );
      }
      return;
    }

    if (this.astarothEncounter.state === 'CHASE') {
      if (this.astarothWarningMesh) this.astarothWarningMesh.visible = false;

      if (distToPlayer > 3.8) {
        toPlayer.normalize();
        aPos.add(toPlayer.multiplyScalar(2.0 * delta));
        aPos.x = THREE.MathUtils.clamp(aPos.x, -7.5, 7.5);
        aPos.z = THREE.MathUtils.clamp(aPos.z, -412, -372);
      } else {
        const roll = Math.random();
        this.astarothEncounter.setState(roll < 0.5 ? 'METEOR_STORM' : 'BLACK_SUN_BURST');
        this.astarothTimer = 0.75;
        if (this.astarothWarningMesh) this.astarothWarningMesh.visible = true;
        this.audio.playSfx('warning');
      }
    } else if (this.astarothEncounter.state === 'METEOR_STORM' || this.astarothEncounter.state === 'BLACK_SUN_BURST') {
      this.astarothTimer -= delta;
      if (this.astarothWarningMesh) {
        this.astarothWarningMesh.rotation.y += delta * 6;
        this.astarothWarningMesh.visible = Math.floor(this.clock.elapsedTime * 20) % 2 === 0;
      }

      if (this.astarothTimer <= 0) {
        if (this.astarothWarningMesh) this.astarothWarningMesh.visible = false;
        const isBlackSun = this.astarothEncounter.state === 'BLACK_SUN_BURST';
        const attackRes = this.astarothEncounter.evaluateAttack(distToPlayer, this.playerStats.isDodging, isBlackSun);

        if (attackRes.hit) {
          const parryWindow = 280 + this.inventory.getParryBonusMs();
          const isParry = this.playerStats.isGuarding && (performance.now() - this.lastGuardTime) <= parryWindow;
          if (isParry) {
            this.audio.playSfx('parry');
            this.triggerHolyFlash(1.0);
            this.astarothEncounter.setState('STUNNED');
            this.astarothTimer = 2.0 * this.getStaggerMultiplier();
            this.spawnFloatingText(pPos, '⚡ ¡PARRY CÓSMICO PERFECTO!', '#88ffff');
            this.spawnFloatingText(aPos, '⚡ ¡SOL DEL ABISMO QUEBRADO! [E] ¡REMATAR!', '#ffd700');
            this.updateHUD();
            return;
          } else if (this.playerStats.isGuarding) {
            const blockedDmg = Math.round(attackRes.damage * 0.5);
            this.playerStats.health = Math.max(0, this.playerStats.health - blockedDmg);
            this.playerStats.posture = Math.max(0, this.playerStats.posture - 35);
            this.audio.playShieldCrush();
            this.spawnFloatingText(pPos, `-${blockedDmg} (¡BLOQUEO CÓSMICO!)`, '#ffd700');
          } else {
            const dmg = this.calculateIncomingDamage(attackRes.damage, 10);
            this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
            this.triggerDamageVignette(0.75);
            this.audio.playCombatHit(true);
            this.spawnFloatingText(pPos, `-${dmg} (${isBlackSun ? 'COLAPSO DEL SOL NEGRO' : 'TORMENTA DE METEOROS'})`, '#ff2288');

            if (this.playerStats.health <= 0) {
              this.handlePlayerDefeatAndRespawn();
              return;
            }
          }
        } else if (this.playerStats.isDodging) {
          this.audio.playSfx('dodge');
          this.spawnFloatingText(pPos, '⚡ ¡ESQUIVADO PERFECTO!', '#00e5ff');
        }

        this.astarothEncounter.setState('CHASE');
        this.updateHUD();
      }
    } else if (this.astarothEncounter.state === 'STUNNED') {
      this.astarothTimer -= delta;
      if (this.astarothTimer <= 0) {
        this.astarothEncounter.setState('CHASE');
      }
    }
  }

  public handleAstarothDefeat(): void {
    this.astarothEncounter.setState('DEAD');
    if (this.astarothWarningMesh) this.astarothWarningMesh.visible = false;
    this.audio.playCosmicChime?.();
    this.triggerHolyFlash(1.8);

    const reward = this.astarothEncounter.claimRewards(this.inventory, this.progression);
    if (reward.claimed) {
      this.hasForgedAlbaGris = true;
      this.applyAlbaGrisSwordVisual();
      this.spawnFloatingText(
        this.astarothGroup.position,
        `👑 ¡ASTAROTH HA SIDO DESTRUIDO! (+${reward.expAwarded} EXP & EL PRIMER AMANECER)`,
        '#ffd700'
      );
      this.canonChapterManager.unlockChapter(20);

      this.showDialogueModal(
        '👑 ¡EL PRIMER AMANECER DE ALBION! — CANON COMPLETO 👑',
        '«El Sol del Abismo se quiebra en un cataclismo de luz celestial. La gravedad invertida se disuelve, regresando la tierra a su orden primordial. Los primeros rayos de un sol cálido y dorado bañan el horizonte de Albion después de dieciocho años de sombras. Elowen, Khaterine, Shalem y Thomas contemplan el nuevo mundo libre de la inquisición. ¡HAS COMPLETADO LOS 20 CAPÍTULOS DEL CANON SAGRADO!»',
        '✦ RECOMPENSA FINAL: EL PRIMER AMANECER DE ALBION (VICTORIA TOTAL) ✦'
      );
    }
    if (this.astarothHpBarContainer) {
      setTimeout(() => {
        if (this.astarothHpBarContainer) this.astarothHpBarContainer.style.display = 'none';
      }, 2500);
    }
    this.updateHUD();
  }

  // =========================================================================
  // HTML / HUD OVERLAY FOR 3D EXPERIENCE
  // =========================================================================
  private createUIOverlay(): void {
    this.uiOverlay = document.createElement('div');
    this.uiOverlay.style.position = 'absolute';
    this.uiOverlay.style.top = '0';
    this.uiOverlay.style.left = '0';
    this.uiOverlay.style.width = '100%';
    this.uiOverlay.style.height = '100%';
    this.uiOverlay.style.pointerEvents = 'none';
    this.uiOverlay.style.fontFamily = "'Cinzel', Georgia, serif";
    this.uiOverlay.style.color = '#ffd700';
    this.uiOverlay.style.padding = '8px 10px';

    this.uiOverlay.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <!-- Left: Active Hero 3D Combat HUD -->
        <div style="display: flex; gap: 8px; background: rgba(14, 9, 23, 0.94); border: 1.2px solid #d4af37; border-radius: 4px; padding: 5px 8px; min-width: 215px; box-shadow: 0 4px 15px rgba(0,0,0,0.85); align-items: center;">
          <img id="p3d-hero-portrait" src="/assets/concepts/concept_thomas.png" alt="Retrato Héroe" style="width: 36px; height: 36px; border: 1.2px solid #d4af37; border-radius: 4px; object-fit: cover; object-position: top center; background: #000; flex-shrink: 0;" />
          <div style="flex: 1;">
            <div id="p3d-hero-title" style="font-size: 8px; font-weight: bold; letter-spacing: 0.6px; margin-bottom: 3px; color: #ffd700;">
              ✦ THOMAS — OAKHAVEN 3D ✦
            </div>
            <!-- Health Bar -->
            <div style="display: flex; align-items: center; gap: 5px; font-size: 7.5px; font-family: monospace; color: #ffaaaa; margin-bottom: 3px;">
              <span>SALUD</span>
              <div style="flex: 1; height: 6px; background: #2b0c0c; border: 1px solid #7a2222; border-radius: 2px; overflow: hidden;">
                <div id="p3d-hp" style="width: 100%; height: 100%; background: #22cc44; transition: width 0.15s ease;"></div>
              </div>
              <span id="p3d-hp-text">100/100</span>
            </div>
            <!-- Posture / Guard Bar -->
            <div style="display: flex; align-items: center; gap: 5px; font-size: 7.5px; font-family: monospace; color: #aaaaff; margin-bottom: 3px;">
              <span>POSTURA</span>
              <div style="flex: 1; height: 4px; background: #0c142b; border: 1px solid #22447a; border-radius: 2px; overflow: hidden;">
                <div id="p3d-posture" style="width: 100%; height: 100%; background: #4488ff; transition: width 0.15s ease;"></div>
              </div>
            </div>
            <!-- Weapon Status Badge -->
            <div id="p3d-weapon-badge" style="font-size: 7px; font-family: monospace; color: #e2d4f0; background: rgba(35, 20, 50, 0.7); padding: 1px 4px; border-radius: 3px; border: 1px solid #5a3d78; pointer-events: auto; cursor: pointer;">
              ⚔ ARMA: Espada Corta del Monaguillo
            </div>
          </div>
        </div>

        <!-- Right: Actions & Return Button -->
        <div style="pointer-events: auto; display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
          <button id="btn-return-2d" style="background: #2a1440; color: #ffd700; border: 1.2px solid #d4af37; padding: 4px 9px; border-radius: 4px; font-family: 'Cinzel', serif; font-size: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.6); transition: all 0.2s;">
            ⮌ VOLVER AL MODO 2D
          </button>
          <div style="display: flex; gap: 4px;">
            <button id="btn-toggle-inventory" style="background: #3b2812; color: #ffd7aa; border: 1px solid #d49a37; padding: 3px 7px; border-radius: 4px; font-family: monospace; font-size: 7.5px; cursor: pointer;">
              🎒 [I] INVENTARIO
            </button>
            <button id="btn-quick-balm" style="background: #14331e; color: #a3ffc7; border: 1px solid #2ecc71; padding: 3px 7px; border-radius: 4px; font-family: monospace; font-size: 7.5px; cursor: pointer;">
              🌿 [Q] BÁLSAMO
            </button>
          </div>
          <div style="display: flex; gap: 4px;">
            <button id="btn-toggle-alchemy" style="background: #0f2c1f; color: #7dffb3; border: 1px solid #2ecc71; padding: 3px 7px; border-radius: 4px; font-family: monospace; font-size: 7.5px; cursor: pointer; font-weight: bold;">
              ⚗️ [B] BOTICA
            </button>
            <button id="btn-toggle-skills" style="background: #28183c; color: #ffd700; border: 1px solid #b8860b; padding: 3px 7px; border-radius: 4px; font-family: monospace; font-size: 7.5px; cursor: pointer; font-weight: bold;">
              🌟 [H] HABILIDADES
            </button>
            <button id="btn-toggle-compendium" style="background: #2b1d3d; color: #ffd700; border: 1px solid #d4af37; padding: 3px 7px; border-radius: 4px; font-family: monospace; font-size: 7.5px; cursor: pointer; font-weight: bold;">
              📜 [N] COMPENDIO
            </button>
            <button id="btn-save-sanctuary" style="background: #1c2538; color: #99ddff; border: 1px solid #3b6b99; padding: 3px 7px; border-radius: 4px; font-family: monospace; font-size: 7.5px; cursor: pointer; font-weight: bold;">
              💾 [G] SANTUARIO
            </button>
          </div>
          <div style="display: flex; gap: 4px;">
            <button id="btn-export-save" style="background: #152238; color: #88ccff; border: 1px solid #2f5485; padding: 2.5px 6px; border-radius: 3px; font-family: monospace; font-size: 7px; cursor: pointer; font-weight: bold;">
              💾 EXPORTAR JSON
            </button>
            <button id="btn-import-save" style="background: #231633; color: #d4b8ff; border: 1px solid #6b4394; padding: 2.5px 6px; border-radius: 3px; font-family: monospace; font-size: 7px; cursor: pointer; font-weight: bold;">
              📂 IMPORTAR JSON
            </button>
            <input type="file" id="p3d-save-file-input" accept=".json" style="display: none;" />
          </div>
          <div style="display: flex; gap: 4px;">
            <button id="btn-toggle-hero" style="background: #2b143d; color: #e6b8ff; border: 1px solid #8e44ad; padding: 3px 7px; border-radius: 4px; font-family: monospace; font-size: 7.5px; cursor: pointer;">
              🔄 [TAB] HÉROE: THOMAS
            </button>
            <button id="btn-toggle-audio" style="background: #142a1f; color: #a3ffc7; border: 1px solid #27ae60; padding: 3px 7px; border-radius: 4px; font-family: monospace; font-size: 7.5px; cursor: pointer;">
              🎵 [M] AUDIO: ACTIVO
            </button>
          </div>
          <button id="btn-toggle-cam" style="background: #141f2a; color: #99ddff; border: 1px solid #336699; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 7.5px; cursor: pointer;">
            🎥 [C] CÁMARA: OBLICUA 3/4
          </button>
          <!-- Fast Travel Act Inspection Shortcuts -->
          <div style="display: flex; gap: 3px; margin-top: 2px;">
            <button id="btn-dbg-portal" style="background: #1a162b; color: #a3ffc7; border: 1px solid #2ecc71; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 7px; cursor: pointer;">[1] PORTAL</button>
            <button id="btn-dbg-criptas" style="background: #1a162b; color: #a3ffc7; border: 1px solid #2ecc71; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 7px; cursor: pointer;">[2] CRIPTAS</button>
            <button id="btn-dbg-sarcofago" style="background: #1a162b; color: #a3ffc7; border: 1px solid #2ecc71; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 7px; cursor: pointer;">[3] BOTÍN</button>
            <button id="btn-dbg-inquisidor" style="background: #1a162b; color: #a3ffc7; border: 1px solid #2ecc71; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 7px; cursor: pointer;">[4] JEFE</button>
            <button id="btn-dbg-derrota" style="background: #1a162b; color: #a3ffc7; border: 1px solid #2ecc71; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 7px; cursor: pointer;">[5] VICTORIA</button>
          </div>
          <div style="display: flex; gap: 3px; margin-top: 2px;">
            <button id="btn-dbg-campanario" style="background: #2b1d0c; color: #ffaa55; border: 1px solid #e67e22; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 7px; cursor: pointer;">[9] ACT II</button>
            <button id="btn-dbg-puente" style="background: #2b260c; color: #ffd755; border: 1px solid #d4af37; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 7px; cursor: pointer;">[0] ACT III</button>
            <button id="btn-dbg-londinium" style="background: #1d0c2b; color: #d488ff; border: 1px solid #9b59b6; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 7px; cursor: pointer;">[P] ACT IV</button>
            <button id="btn-dbg-catedral" style="background: #2b0c1d; color: #ff88b8; border: 1px solid #e84393; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 7px; cursor: pointer;">[O] ACT V</button>
          </div>
        </div>
      </div>

      <!-- Center: Enemy 1 Target HUD (Sabueso de Ceniza) -->
      <div id="p3d-enemy-hud" style="position: absolute; top: 8px; left: 50%; transform: translateX(-50%); background: rgba(20, 8, 8, 0.94); border: 1.2px solid #aa2222; border-radius: 4px; padding: 4px 10px; width: 170px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.85);">
        <div style="font-size: 7.5px; font-weight: bold; color: #ffaaaa; margin-bottom: 2px;">
          ⚠ SABUESO DE CENIZA (PATRULLA) ⚠
        </div>
        <div style="width: 100%; height: 5px; background: #330b0b; border: 1px solid #881a1a; border-radius: 2px; overflow: hidden;">
          <div id="p3d-enemy-hp-fill" style="width: 100%; height: 100%; background: #dd2222; transition: width 0.1s ease;"></div>
        </div>
      </div>

      <!-- Center: Enemy 2 Target HUD (Cultista del Incensario) -->
      <div id="p3d-cultist-hud" style="position: absolute; top: 32px; left: 50%; transform: translateX(-50%); background: rgba(25, 12, 10, 0.94); border: 1.2px solid #e67e22; border-radius: 4px; padding: 4px 10px; width: 185px; text-align: center; box-shadow: 0 4px 15px rgba(230, 126, 34, 0.4); display: none;">
        <div style="font-size: 7.5px; font-weight: bold; color: #ffd2aa; margin-bottom: 2px;">
          ⚠ CULTISTA DEL INCENSARIO (PATRULLA) ⚠
        </div>
        <div style="width: 100%; height: 5px; background: #331508; border: 1px solid #a04000; border-radius: 2px; overflow: hidden;">
          <div id="p3d-cultist-hp-fill" style="width: 100%; height: 100%; background: #e67e22; transition: width 0.1s ease;"></div>
        </div>
      </div>

      <!-- Center: Enemy 3 Target HUD (Flagelante con Cadena) -->
      <div id="p3d-zealot-hud" style="position: absolute; top: 52px; left: 50%; transform: translateX(-50%); background: rgba(30, 10, 14, 0.94); border: 1.2px solid #c0392b; border-radius: 4px; padding: 4px 10px; width: 195px; text-align: center; box-shadow: 0 4px 15px rgba(192, 57, 43, 0.5); display: none;">
        <div style="font-size: 7.5px; font-weight: bold; color: #ff9999; margin-bottom: 2px;">
          ⚠ FLAGELANTE CON CADENA (PATRULLA) ⚠
        </div>
        <div style="width: 100%; height: 5px; background: #330b10; border: 1px solid #8b1824; border-radius: 2px; overflow: hidden;">
          <div id="p3d-zealot-hp-fill" style="width: 100%; height: 100%; background: #c0392b; transition: width 0.1s ease;"></div>
        </div>
      </div>

      <!-- Center: Enemy 4 Target HUD (Penitente de la Cripta) -->
      <div id="p3d-skeleton-hud" style="position: absolute; top: 74px; left: 50%; transform: translateX(-50%); background: rgba(10, 24, 28, 0.94); border: 1.2px solid #00e5ff; border-radius: 4px; padding: 4px 10px; width: 200px; text-align: center; box-shadow: 0 4px 15px rgba(0, 229, 255, 0.45); display: none;">
        <div style="font-size: 7.5px; font-weight: bold; color: #a3f7ff; margin-bottom: 2px;">
          ⚠ PENITENTE DE LA CRIPTA (GUARDIÁN) ⚠
        </div>
        <div style="width: 100%; height: 5px; background: #081d22; border: 1px solid #008899; border-radius: 2px; overflow: hidden;">
          <div id="p3d-skeleton-hp-fill" style="width: 100%; height: 100%; background: #00e5ff; transition: width 0.1s ease;"></div>
        </div>
      </div>

      <!-- Boss Morwenna 3D Target HUD (Top Center) -->
      <div id="p3d-boss-hud" style="position: absolute; top: 98px; left: 50%; transform: translateX(-50%); background: rgba(30, 8, 12, 0.95); border: 1.2px solid #ff3344; border-radius: 4px; padding: 4px 12px; width: 220px; text-align: center; box-shadow: 0 4px 20px rgba(255, 0, 0, 0.45); display: none;">
        <div style="font-size: 7.5px; font-weight: bold; color: #ffbbbb; margin-bottom: 2px; letter-spacing: 0.5px;">
          👑 MADRE MORWENNA — VIGÍA DE LA PIRA 👑
        </div>
        <div style="width: 100%; height: 6px; background: #3b0d14; border: 1px solid #8b1824; border-radius: 2px; overflow: hidden;">
          <div id="p3d-boss-hp-fill" style="width: 100%; height: 100%; background: #ff2233; transition: width 0.15s ease;"></div>
        </div>
      </div>

      <!-- Sub-boss: Inquisidor de las Catacumbas 3D Target HUD -->
      <div id="p3d-inquisitor-hud" style="position: absolute; top: 122px; left: 50%; transform: translateX(-50%); background: rgba(22, 8, 22, 0.95); border: 1.2px solid #9b59b6; border-radius: 4px; padding: 4px 12px; width: 225px; text-align: center; box-shadow: 0 4px 20px rgba(155, 89, 182, 0.45); display: none;">
        <div style="font-size: 7.5px; font-weight: bold; color: #eeddff; margin-bottom: 2px; letter-spacing: 0.5px;">
          ⚔ EL INQUISIDOR CAÍDO DE SAN JUDE ⚔
        </div>
        <div style="width: 100%; height: 6px; background: #260c2b; border: 1px solid #6c2d7a; border-radius: 2px; overflow: hidden;">
          <div id="p3d-inquisitor-hp-fill" style="width: 100%; height: 100%; background: #9b59b6; transition: width 0.15s ease;"></div>
        </div>
      </div>

      <!-- Beast: Acechador de Raíces 3D Target HUD -->
      <div id="p3d-root-prowler-hud" style="position: absolute; top: 122px; left: 50%; transform: translateX(-50%); background: rgba(18, 12, 28, 0.95); border: 1.2px solid #bb44ff; border-radius: 4px; padding: 4px 12px; width: 235px; text-align: center; box-shadow: 0 4px 20px rgba(187, 68, 255, 0.45); display: none;">
        <div style="font-size: 7.5px; font-weight: bold; color: #eeddff; margin-bottom: 2px; letter-spacing: 0.5px;">
          🌿 ACECHADOR DE RAÍCES DEL SAUCE NEGRO 🌿
        </div>
        <div style="width: 100%; height: 6px; background: #231233; border: 1px solid #7722aa; border-radius: 2px; overflow: hidden;">
          <div id="p3d-root-prowler-hp-fill" style="width: 100%; height: 100%; background: #bb44ff; transition: width 0.15s ease;"></div>
        </div>
      </div>

      <!-- Boss Act II: Guardián del Crisol 3D Target HUD -->
      <div id="p3d-crucible-guardian-hud" style="position: absolute; top: 122px; left: 50%; transform: translateX(-50%); background: rgba(28, 14, 8, 0.95); border: 1.2px solid #ff7722; border-radius: 4px; padding: 4px 12px; width: 235px; text-align: center; box-shadow: 0 4px 20px rgba(255, 119, 34, 0.45); display: none;">
        <div style="font-size: 7.5px; font-weight: bold; color: #ffd2aa; margin-bottom: 2px; letter-spacing: 0.5px;">
          🔨 EL GUARDIÁN DEL CRISOL DE BRONCE 🔨
        </div>
        <div style="width: 100%; height: 6px; background: #331508; border: 1px solid #a04000; border-radius: 2px; overflow: hidden;">
          <div id="p3d-crucible-guardian-hp-fill" style="width: 100%; height: 100%; background: #ff7722; transition: width 0.15s ease;"></div>
        </div>
      </div>

      <!-- Boss Act III: Capitán Áureo Vane 3D Target HUD -->
      <div id="p3d-captain-vane-hud" style="position: absolute; top: 122px; left: 50%; transform: translateX(-50%); background: rgba(30, 24, 8, 0.95); border: 1.2px solid #ffd700; border-radius: 4px; padding: 4px 12px; width: 235px; text-align: center; box-shadow: 0 4px 20px rgba(255, 215, 0, 0.45); display: none;">
        <div style="font-size: 7.5px; font-weight: bold; color: #fff3aa; margin-bottom: 2px; letter-spacing: 0.5px;">
          🛡️ CAPITÁN ÁUREO VANE — ESCUDO DE TORRE 🛡️
        </div>
        <div style="width: 100%; height: 6px; background: #382c0a; border: 1px solid #b8860b; border-radius: 2px; overflow: hidden;">
          <div id="p3d-captain-vane-hp-fill" style="width: 100%; height: 100%; background: #ffd700; transition: width 0.15s ease;"></div>
        </div>
      </div>

      <!-- Boss Act IV: Rex Malphas 3D Target HUD -->
      <div id="p3d-rex-malphas-hud" style="position: absolute; top: 122px; left: 50%; transform: translateX(-50%); background: rgba(28, 8, 28, 0.95); border: 1.2px solid #cc44ff; border-radius: 4px; padding: 4px 12px; width: 235px; text-align: center; box-shadow: 0 4px 20px rgba(204, 68, 255, 0.45); display: none;">
        <div style="font-size: 7.5px; font-weight: bold; color: #eeddff; margin-bottom: 2px; letter-spacing: 0.5px;">
          👑 REX MALPHAS — EL DESPOTA ASTRAL (ALARIC) 👑
        </div>
        <div style="width: 100%; height: 6px; background: #260a2b; border: 1px solid #7c1d8c; border-radius: 2px; overflow: hidden;">
          <div id="p3d-rex-malphas-hp-fill" style="width: 100%; height: 100%; background: #cc44ff; transition: width 0.15s ease;"></div>
        </div>
      </div>

      <!-- Boss Act V: Astaroth Titan 3D Target HUD -->
      <div id="p3d-astaroth-hud" style="position: absolute; top: 122px; left: 50%; transform: translateX(-50%); background: rgba(16, 5, 26, 0.98); border: 1.5px solid #ff2288; border-radius: 4px; padding: 4px 14px; width: 250px; text-align: center; box-shadow: 0 4px 25px rgba(255, 34, 136, 0.55); display: none;">
        <div style="font-size: 7.5px; font-weight: bold; color: #ffaacc; margin-bottom: 2px; letter-spacing: 0.8px;">
          🌌 ASTAROTH: EL PADRE DE LAS CENIZAS — SOL DEL ABISMO 🌌
        </div>
        <div style="width: 100%; height: 7px; background: #2b0c1e; border: 1px solid #8c1d55; border-radius: 2px; overflow: hidden;">
          <div id="p3d-astaroth-hp-fill" style="width: 100%; height: 100%; background: #ff2288; transition: width 0.15s ease;"></div>
        </div>
      </div>

      <!-- Floating Proximity Action Pill (Interactive [E]) -->
      <div id="p3d-proximity-badge" style="position: absolute; bottom: 58px; left: 50%; transform: translateX(-50%); background: rgba(18, 9, 32, 0.96); border: 1.5px solid #ffd700; border-radius: 4px; padding: 4px 14px; font-family: monospace; font-size: 8.5px; font-weight: bold; color: #ffd700; display: none; box-shadow: 0 4px 20px rgba(0,0,0,0.85); z-index: 50; cursor: pointer; pointer-events: auto; text-align: center; letter-spacing: 0.5px;">
        [E] INTERACTUAR
      </div>

      <!-- Gothic 3D Dialogue Modal -->
      <div id="p3d-dialogue-modal" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(14, 8, 24, 0.98); border: 2px solid #d4af37; border-radius: 6px; padding: 14px 18px; max-width: 480px; width: 88%; box-shadow: 0 10px 40px rgba(0,0,0,0.95); display: none; z-index: 100; pointer-events: auto; text-align: center;">
        <div id="p3d-modal-header" style="font-size: 9.5px; font-weight: bold; color: #ffd700; letter-spacing: 0.8px; margin-bottom: 6px; border-bottom: 1px solid #482f5e; padding-bottom: 5px;"></div>
        <div id="p3d-modal-text" style="font-family: serif; font-size: 10px; color: #ede6f5; font-style: italic; line-height: 1.48; margin-bottom: 10px;"></div>
        <div id="p3d-modal-reward" style="font-family: monospace; font-size: 8px; color: #88ffaa; margin-bottom: 10px; font-weight: bold;"></div>
        <button id="p3d-modal-close" style="background: #2a1440; color: #ffd700; border: 1px solid #d4af37; padding: 4px 14px; border-radius: 3px; font-family: monospace; font-size: 8px; cursor: pointer; font-weight: bold;">[E / ESPACIO / CLIC] CONTINUAR</button>
      </div>

      <!-- Gothic 3D Inventory Modal -->
      <div id="p3d-inventory-modal" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(16, 9, 26, 0.98); border: 2px solid #ffd700; border-radius: 6px; padding: 12px 16px; max-width: 520px; width: 90%; box-shadow: 0 12px 45px rgba(0,0,0,0.98); display: none; z-index: 120; pointer-events: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #482f5e; padding-bottom: 6px; margin-bottom: 8px;">
          <div style="font-size: 9.5px; font-weight: bold; color: #ffd700; letter-spacing: 0.8px;">
            🎒 BOLSA DEL ACÓLITO & RELIQUIAS 🎒
          </div>
          <button id="p3d-inv-close" style="background: #2a1440; color: #ffaaaa; border: 1px solid #7a2222; border-radius: 3px; padding: 2px 7px; font-size: 8px; cursor: pointer; font-weight: bold;">[X] CERRAR</button>
        </div>
        <div id="p3d-inv-status" style="font-family: monospace; font-size: 7.5px; color: #dcd0ea; margin-bottom: 8px; background: rgba(30, 16, 45, 0.6); padding: 4px 8px; border-radius: 3px; border: 1px solid #5a3d78;">
          ✦ Ranuras de Reliquia: 1/2 Equipadas | Bono de Parry: +70ms | Reducción Fatiga: 0%
        </div>
        <div id="p3d-inv-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 240px; overflow-y: auto;">
          <!-- Dynamically filled by renderInventoryItems() -->
        </div>
      </div>

      <!-- Gothic 3D Skills & Progression Modal -->
      <div id="p3d-skills-modal" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(14, 8, 26, 0.98); border: 2px solid #ffd700; border-radius: 6px; padding: 12px 16px; max-width: 580px; width: 92%; box-shadow: 0 12px 50px rgba(0,0,0,0.98); display: none; z-index: 120; pointer-events: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #482f5e; padding-bottom: 6px; margin-bottom: 8px;">
          <div style="font-size: 9.5px; font-weight: bold; color: #ffd700; letter-spacing: 0.8px;">
            🌟 CÓDICE DEL ALMA: ÁRBOL DE HABILIDADES & EXP 🌟
          </div>
          <button id="p3d-skills-close" style="background: #2a1440; color: #ffaaaa; border: 1px solid #7a2222; border-radius: 3px; padding: 2px 7px; font-size: 8px; cursor: pointer; font-weight: bold;">[X] CERRAR</button>
        </div>
        <div id="p3d-skills-status" style="font-family: monospace; font-size: 7.5px; color: #dcd0ea; margin-bottom: 8px; background: rgba(30, 16, 45, 0.6); padding: 4px 8px; border-radius: 3px; border: 1px solid #5a3d78;">
          ✦ EXP Disponible: 0 EXP
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 250px; overflow-y: auto;">
          <div>
            <div style="font-size: 8px; font-weight: bold; color: #ffd700; border-bottom: 1px solid #d4af37; padding-bottom: 2px; margin-bottom: 6px;">
              ⚔ THOMAS (DEFENSA & FILO SANTO)
            </div>
            <div id="p3d-skills-thomas-grid" style="display: flex; flex-direction: column; gap: 6px;"></div>
          </div>
          <div>
            <div style="font-size: 8px; font-weight: bold; color: #e6b8ff; border-bottom: 1px solid #8e44ad; padding-bottom: 2px; margin-bottom: 6px;">
              🏹 KHATERINE (ARCO ABISAL & SOMBRAS)
            </div>
            <div id="p3d-skills-khaterine-grid" style="display: flex; flex-direction: column; gap: 6px;"></div>
          </div>
        </div>
      </div>

      <!-- Gothic 3D Alchemy & Apothecary Modal -->
      <div id="p3d-alchemy-modal" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(10, 20, 15, 0.98); border: 2px solid #2ecc71; border-radius: 6px; padding: 12px 16px; max-width: 580px; width: 92%; box-shadow: 0 12px 50px rgba(0,40,20,0.95); display: none; z-index: 120; pointer-events: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e4d30; padding-bottom: 6px; margin-bottom: 8px;">
          <div style="font-size: 9.5px; font-weight: bold; color: #7dffb3; letter-spacing: 0.8px;">
            ⚗️ BOTICA DE ELOWEN: CALDERO DE ALQUIMIA & ELIXIRES ⚗️
          </div>
          <button id="p3d-alchemy-close" style="background: #14331e; color: #a3ffc7; border: 1px solid #2ecc71; border-radius: 3px; padding: 2px 7px; font-size: 8px; cursor: pointer; font-weight: bold;">[X] CERRAR</button>
        </div>
        <div id="p3d-alchemy-status" style="font-family: monospace; font-size: 7.5px; color: #d0e6d6; margin-bottom: 8px; background: rgba(16, 36, 25, 0.6); padding: 4px 8px; border-radius: 3px; border: 1px solid #2e6642;">
          ✦ EXP Disponible: 0 EXP | ⚗️ Fuego del Caldero: VIVO
        </div>
        <div id="p3d-alchemy-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 200px; overflow-y: auto; margin-bottom: 8px;">
          <!-- Dynamically filled by renderAlchemyModal() -->
        </div>
        <div style="border-top: 1px solid #1e4d30; padding-top: 6px;">
          <div style="font-size: 7.5px; font-weight: bold; color: #a3ffc7; margin-bottom: 4px;">
            🎒 MATERIALES EN TU BOLSA:
          </div>
          <div id="p3d-alchemy-materials" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 55px; overflow-y: auto;">
            <!-- Dynamically filled with current materials -->
          </div>
        </div>
      </div>

      <!-- Canonical 20-Chapter Compendium Modal -->
      <div id="p3d-compendium-modal" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(12, 7, 22, 0.98); border: 2px solid #ffd700; border-radius: 6px; padding: 14px 18px; max-width: 680px; width: 94%; box-shadow: 0 14px 55px rgba(0,0,0,0.98); display: none; z-index: 130; pointer-events: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #d4af37; padding-bottom: 6px; margin-bottom: 8px;">
          <div>
            <div style="font-size: 10.5px; font-weight: bold; color: #ffd700; letter-spacing: 0.8px;">
              📜 COMPENDIO CANÓNICO DE ALBION — 20 CAPÍTULOS 📜
            </div>
            <div id="p3d-compendium-progress" style="font-family: monospace; font-size: 7.5px; color: #a3ffc7; margin-top: 2px;">
              Progreso Canónico: 1 / 20 Capítulos (5%)
            </div>
          </div>
          <button id="p3d-compendium-close" style="background: #2a1440; color: #ffaaaa; border: 1px solid #7a2222; border-radius: 3px; padding: 2px 8px; font-size: 8px; cursor: pointer; font-weight: bold;">[X] CERRAR</button>
        </div>
        <!-- Act Tabs -->
        <div id="p3d-compendium-tabs" style="display: flex; gap: 4px; margin-bottom: 8px; overflow-x: auto; padding-bottom: 4px;">
          <button class="p3d-act-tab" data-act="1" style="background: #3b2812; color: #ffd7aa; border: 1px solid #d49a37; padding: 2.5px 6px; border-radius: 3px; font-size: 7px; cursor: pointer;">ACTO I: OAKHAVEN</button>
          <button class="p3d-act-tab" data-act="2" style="background: #1a162b; color: #dcd0ea; border: 1px solid #5a3d78; padding: 2.5px 6px; border-radius: 3px; font-size: 7px; cursor: pointer;">ACTO II: CAMPANARIO</button>
          <button class="p3d-act-tab" data-act="3" style="background: #1a162b; color: #dcd0ea; border: 1px solid #5a3d78; padding: 2.5px 6px; border-radius: 3px; font-size: 7px; cursor: pointer;">ACTO III: GRAN PUENTE</button>
          <button class="p3d-act-tab" data-act="4" style="background: #1a162b; color: #dcd0ea; border: 1px solid #5a3d78; padding: 2.5px 6px; border-radius: 3px; font-size: 7px; cursor: pointer;">ACTO IV: LONDINIUM</button>
          <button class="p3d-act-tab" data-act="5" style="background: #1a162b; color: #dcd0ea; border: 1px solid #5a3d78; padding: 2.5px 6px; border-radius: 3px; font-size: 7px; cursor: pointer;">ACTO V: CATEDRAL</button>
        </div>
        <!-- Chapter Cards List -->
        <div id="p3d-compendium-list" style="display: flex; flex-direction: column; gap: 7px; max-height: 250px; overflow-y: auto; padding-right: 4px;">
          <!-- Dynamically filled by renderCompendiumModal() -->
        </div>
      </div>

      <!-- Dialogue Toast (Bottom Center) -->
      <div id="p3d-dialogue-toast-container" style="position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 9px; background: rgba(14, 9, 23, 0.96); border: 1.2px solid #d4af37; border-radius: 4px; padding: 4px 12px; max-width: 560px; width: 85%; box-shadow: 0 6px 25px rgba(0,0,0,0.9);">
        <img id="p3d-dialogue-portrait" src="/assets/concepts/concept_shalem.png" alt="Retrato Hablante" style="width: 32px; height: 32px; border: 1.2px solid #d4af37; border-radius: 4px; object-fit: cover; object-position: top center; flex-shrink: 0;" />
        <div id="p3d-dialogue-toast" style="font-size: 8px; color: #e6dcfa; line-height: 1.35; flex: 1;">
          <span style="color: #ffd700; font-weight: bold;">Shalem:</span> «¡Bienvenido a Oakhaven! Pulsa <span style="color:#ffd7aa;">[I]</span> para abrir el inventario o <span style="color:#a3ffc7;">[Q]</span> para usar un bálsamo curativo rápido.»
        </div>
      </div>

      <!-- Dynamic Screen Post-FX Overlays -->
      <div id="p3d-damage-vignette" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; box-shadow: inset 0 0 85px 35px rgba(220, 20, 20, 0.85); opacity: 0; transition: opacity 0.08s ease; z-index: 210;"></div>
      <div id="p3d-holy-flash" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; background: radial-gradient(circle, rgba(255, 235, 130, 0.75) 0%, rgba(200, 240, 255, 0.4) 60%, transparent 100%); opacity: 0; transition: opacity 0.1s ease; z-index: 220;"></div>

      <!-- Subterranean Zone Transition Overlay -->
      <div id="p3d-zone-transition" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #05040a; opacity: 0; pointer-events: none; transition: opacity 0.35s ease; z-index: 250; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
        <div id="p3d-zone-title" style="font-family: 'Cinzel', Georgia, serif; font-size: 18px; font-weight: bold; color: #ffd700; letter-spacing: 2px; margin-bottom: 8px; text-shadow: 0 0 15px rgba(255,215,0,0.6);"></div>
        <div id="p3d-zone-subtitle" style="font-family: Georgia, serif; font-size: 11px; font-style: italic; color: #c5b4db; letter-spacing: 1px;"></div>
      </div>

      <!-- Bottom Controls Bar -->
      <div style="position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); background: rgba(8, 4, 14, 0.95); border: 1px solid #3d2852; border-radius: 3px; padding: 2px 10px; font-family: monospace; font-size: 7px; color: #c5b4db; white-space: nowrap;">
        WASD: Moverse 3D | TAB: Héroe | N: Compendio (20 Caps) | I: Inventario | B: Botica | H: Habilidades | Q: Curar | G: Guardar | J/K: Ataque | L: Guardia | Espacio: Esquivar | T: Lanzar | U: Eco Aquelarre | E: Interactuar | M: Audio | C: Cámara
      </div>
    `;

    this.container.appendChild(this.uiOverlay);

    // Button interactions
    const btnReturn = this.uiOverlay.querySelector('#btn-return-2d') as HTMLButtonElement;
    btnReturn.addEventListener('click', () => this.exit());

    const btnHero = this.uiOverlay.querySelector('#btn-toggle-hero') as HTMLButtonElement;
    if (btnHero) {
      btnHero.addEventListener('click', () => this.toggleHero());
    }

    const btnAudio = this.uiOverlay.querySelector('#btn-toggle-audio') as HTMLButtonElement;
    if (btnAudio) {
      btnAudio.addEventListener('click', () => this.toggleAudio());
    }

    const btnInv = this.uiOverlay.querySelector('#btn-toggle-inventory') as HTMLButtonElement;
    if (btnInv) {
      btnInv.addEventListener('click', () => this.toggleInventoryModal());
    }

    const btnQuickBalm = this.uiOverlay.querySelector('#btn-quick-balm') as HTMLButtonElement;
    if (btnQuickBalm) {
      btnQuickBalm.addEventListener('click', () => this.useQuickConsumable());
    }

    const btnAlchemy = this.uiOverlay.querySelector('#btn-toggle-alchemy') as HTMLButtonElement;
    if (btnAlchemy) {
      btnAlchemy.addEventListener('click', () => this.toggleAlchemyModal());
    }

    const btnSkills = this.uiOverlay.querySelector('#btn-toggle-skills') as HTMLButtonElement;
    if (btnSkills) {
      btnSkills.addEventListener('click', () => this.toggleSkillTreeModal());
    }

    const btnSanctuary = this.uiOverlay.querySelector('#btn-save-sanctuary') as HTMLButtonElement;
    if (btnSanctuary) {
      btnSanctuary.addEventListener('click', () => this.executeSanctuarySave());
    }

    const btnCam = this.uiOverlay.querySelector('#btn-toggle-cam') as HTMLButtonElement;
    btnCam.addEventListener('click', () => {
      this.toggleCameraMode();
      btnCam.innerText = `🎥 [C] CÁMARA: ${this.cameraMode === 'isometric' ? 'OBLICUA 3/4' : 'TERCERA PERSONA'}`;
    });

    // Crypts Inspection Debug Buttons
    const btnDbgPortal = this.uiOverlay.querySelector('#btn-dbg-portal') as HTMLButtonElement | null;
    if (btnDbgPortal) {
      btnDbgPortal.addEventListener('click', () => {
        this.openCemeteryGate();
        this.setPlayerPosition(0, 0, -44);
        this.updateProximityInteractions();
      });
    }

    const btnDbgCriptas = this.uiOverlay.querySelector('#btn-dbg-criptas') as HTMLButtonElement | null;
    if (btnDbgCriptas) {
      btnDbgCriptas.addEventListener('click', () => {
        this.transitionToArea('crypts_interior');
        setTimeout(() => {
          this.setPlayerPosition(-1.2, 0, -79);
          this.updateProximityInteractions();
        }, 450);
      });
    }

    const btnDbgSarcofago = this.uiOverlay.querySelector('#btn-dbg-sarcofago') as HTMLButtonElement | null;
    if (btnDbgSarcofago) {
      btnDbgSarcofago.addEventListener('click', () => {
        this.dungeonAreaManager.enterCrypts();
        this.setPlayerPosition(-3.8, 0, -84.2);
        this.interactWithLootSarcophagus();
        this.updateProximityInteractions();
      });
    }

    const btnDbgInquisidor = this.uiOverlay.querySelector('#btn-dbg-inquisidor') as HTMLButtonElement | null;
    if (btnDbgInquisidor) {
      btnDbgInquisidor.addEventListener('click', () => {
        this.dungeonAreaManager.enterCrypts();
        this.setPlayerPosition(0, 0, -99);
        this.updateProximityInteractions();
      });
    }

    const btnDbgDerrota = this.uiOverlay.querySelector('#btn-dbg-derrota') as HTMLButtonElement | null;
    if (btnDbgDerrota) {
      btnDbgDerrota.addEventListener('click', () => {
        this.handleInquisitorDefeat();
      });
    }

    // Act Fast Travel Shortcuts
    const btnDbgCampanario = this.uiOverlay.querySelector('#btn-dbg-campanario') as HTMLButtonElement | null;
    if (btnDbgCampanario) {
      btnDbgCampanario.addEventListener('click', () => {
        this.transitionToArea('belltower_summit');
      });
    }

    const btnDbgPuente = this.uiOverlay.querySelector('#btn-dbg-puente') as HTMLButtonElement | null;
    if (btnDbgPuente) {
      btnDbgPuente.addEventListener('click', () => {
        this.transitionToArea('great_stone_bridge');
      });
    }

    const btnDbgLondinium = this.uiOverlay.querySelector('#btn-dbg-londinium') as HTMLButtonElement | null;
    if (btnDbgLondinium) {
      btnDbgLondinium.addEventListener('click', () => {
        this.transitionToArea('londinium_citadel');
      });
    }

    const btnDbgCatedral = this.uiOverlay.querySelector('#btn-dbg-catedral') as HTMLButtonElement | null;
    if (btnDbgCatedral) {
      btnDbgCatedral.addEventListener('click', () => {
        this.transitionToArea('inverted_cathedral');
      });
    }

    this.enemyHpBarContainer = this.uiOverlay.querySelector('#p3d-enemy-hud') as HTMLDivElement;
    this.enemyHpBarFill = this.uiOverlay.querySelector('#p3d-enemy-hp-fill') as HTMLDivElement;

    this.cultistHpBarContainer = this.uiOverlay.querySelector('#p3d-cultist-hud') as HTMLDivElement;
    this.cultistHpBarFill = this.uiOverlay.querySelector('#p3d-cultist-hp-fill') as HTMLDivElement;

    this.zealotHpBarContainer = this.uiOverlay.querySelector('#p3d-zealot-hud') as HTMLDivElement;
    this.zealotHpBarFill = this.uiOverlay.querySelector('#p3d-zealot-hp-fill') as HTMLDivElement;

    this.skeletonHpBarContainer = this.uiOverlay.querySelector('#p3d-skeleton-hud') as HTMLDivElement;
    this.skeletonHpBarFill = this.uiOverlay.querySelector('#p3d-skeleton-hp-fill') as HTMLDivElement;

    this.inquisitorHpBarContainer = this.uiOverlay.querySelector('#p3d-inquisitor-hud') as HTMLDivElement;
    this.inquisitorHpBarFill = this.uiOverlay.querySelector('#p3d-inquisitor-hp-fill') as HTMLDivElement;
    this.rootProwlerHpBarContainer = this.uiOverlay.querySelector('#p3d-root-prowler-hud') as HTMLDivElement;
    this.rootProwlerHpBarFill = this.uiOverlay.querySelector('#p3d-root-prowler-hp-fill') as HTMLDivElement;

    this.crucibleHpBarContainer = this.uiOverlay.querySelector('#p3d-crucible-guardian-hud') as HTMLDivElement;
    this.crucibleHpBarFill = this.uiOverlay.querySelector('#p3d-crucible-guardian-hp-fill') as HTMLDivElement;
    this.vaneHpBarContainer = this.uiOverlay.querySelector('#p3d-captain-vane-hud') as HTMLDivElement;
    this.vaneHpBarFill = this.uiOverlay.querySelector('#p3d-captain-vane-hp-fill') as HTMLDivElement;
    this.malphasHpBarContainer = this.uiOverlay.querySelector('#p3d-rex-malphas-hud') as HTMLDivElement;
    this.malphasHpBarFill = this.uiOverlay.querySelector('#p3d-rex-malphas-hp-fill') as HTMLDivElement;
    this.astarothHpBarContainer = this.uiOverlay.querySelector('#p3d-astaroth-hud') as HTMLDivElement;
    this.astarothHpBarFill = this.uiOverlay.querySelector('#p3d-astaroth-hp-fill') as HTMLDivElement;

    this.zoneTransitionOverlay = this.uiOverlay.querySelector('#p3d-zone-transition') as HTMLDivElement;
    this.zoneTitleEl = this.uiOverlay.querySelector('#p3d-zone-title') as HTMLDivElement;
    this.zoneSubtitleEl = this.uiOverlay.querySelector('#p3d-zone-subtitle') as HTMLDivElement;

    this.proximityBadgeEl = this.uiOverlay.querySelector('#p3d-proximity-badge') as HTMLDivElement;
    if (this.proximityBadgeEl) {
      this.proximityBadgeEl.addEventListener('click', () => this.handleContextInteraction());
    }

    this.dialogueModalEl = this.uiOverlay.querySelector('#p3d-dialogue-modal') as HTMLDivElement;
    const btnModalClose = this.uiOverlay.querySelector('#p3d-modal-close') as HTMLButtonElement;
    if (btnModalClose) {
      btnModalClose.addEventListener('click', () => this.closeDialogueModal());
    }

    this.inventoryModalEl = this.uiOverlay.querySelector('#p3d-inventory-modal') as HTMLDivElement;
    const btnInvClose = this.uiOverlay.querySelector('#p3d-inv-close') as HTMLButtonElement;
    if (btnInvClose) {
      btnInvClose.addEventListener('click', () => this.toggleInventoryModal());
    }

    this.skillTreeModalEl = this.uiOverlay.querySelector('#p3d-skills-modal') as HTMLDivElement;
    const btnSkillsClose = this.uiOverlay.querySelector('#p3d-skills-close') as HTMLButtonElement;
    if (btnSkillsClose) {
      btnSkillsClose.addEventListener('click', () => this.toggleSkillTreeModal());
    }

    this.alchemyModalEl = this.uiOverlay.querySelector('#p3d-alchemy-modal') as HTMLDivElement;
    const btnAlchemyClose = this.uiOverlay.querySelector('#p3d-alchemy-close') as HTMLButtonElement;
    if (btnAlchemyClose) {
      btnAlchemyClose.addEventListener('click', () => this.toggleAlchemyModal());
    }

    this.compendiumModalEl = this.uiOverlay.querySelector('#p3d-compendium-modal') as HTMLDivElement;
    const btnCompendium = this.uiOverlay.querySelector('#btn-toggle-compendium') as HTMLButtonElement;
    if (btnCompendium) {
      btnCompendium.addEventListener('click', () => this.toggleCompendiumModal());
    }
    const btnCompClose = this.uiOverlay.querySelector('#p3d-compendium-close') as HTMLButtonElement;
    if (btnCompClose) {
      btnCompClose.addEventListener('click', () => this.toggleCompendiumModal());
    }

    // Act tabs in Compendium Modal
    if (this.compendiumModalEl) {
      const tabs = this.compendiumModalEl.querySelectorAll('.p3d-act-tab') as NodeListOf<HTMLButtonElement>;
      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          const actNum = parseInt((e.currentTarget as HTMLButtonElement).getAttribute('data-act') || '1', 10);
          tabs.forEach(t => {
            t.style.background = '#1a162b';
            t.style.color = '#dcd0ea';
            t.style.borderColor = '#5a3d78';
          });
          tab.style.background = '#3b2812';
          tab.style.color = '#ffd7aa';
          tab.style.borderColor = '#d49a37';
          this.renderCompendiumModal(actNum);
        });
      });
    }

    this.morwennaHpBarContainer = this.uiOverlay.querySelector('#p3d-boss-hud') as HTMLDivElement;
    this.morwennaHpBarFill = this.uiOverlay.querySelector('#p3d-boss-hp-fill') as HTMLDivElement;

    this.damageVignetteEl = this.uiOverlay.querySelector('#p3d-damage-vignette') as HTMLDivElement;
    this.holyFlashEl = this.uiOverlay.querySelector('#p3d-holy-flash') as HTMLDivElement;

    const weaponBadge = this.uiOverlay.querySelector('#p3d-weapon-badge') as HTMLDivElement;
    if (weaponBadge) {
      weaponBadge.addEventListener('click', () => {
        if (this.activeHero === 'khaterine') {
          this.cycleKhaterineArrow();
        }
      });
    }

    const btnExportSave = this.uiOverlay.querySelector('#btn-export-save') as HTMLButtonElement;
    if (btnExportSave) {
      btnExportSave.addEventListener('click', () => this.exportSaveFile());
    }

    const btnImportSave = this.uiOverlay.querySelector('#btn-import-save') as HTMLButtonElement;
    const inputSaveFile = this.uiOverlay.querySelector('#p3d-save-file-input') as HTMLInputElement;
    if (btnImportSave && inputSaveFile) {
      btnImportSave.addEventListener('click', () => inputSaveFile.click());
      inputSaveFile.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          this.importSaveFile(target.files[0]);
          target.value = '';
        }
      });
    }
  }

  // =========================================================================
  // INPUT CONTEXT & HANDLERS (VICE CITY & OPENLARA ARCHITECTURE)
  // =========================================================================
  public getInputContext(): InputContext {
    if (this.isPlayerDefeated) return 'defeated';
    if (this.isCompendiumOpen) return 'compendium';
    if (this.isDialogueOpen) return 'dialogue';
    if (this.isInventoryOpen) return 'inventory';
    if (this.isSkillTreeOpen) return 'skillTree';
    if (this.isAlchemyOpen) return 'alchemy';
    return 'gameplay';
  }

  public isGameplayActive(): boolean {
    return this.isRunning && this.getInputContext() === 'gameplay';
  }

  public releaseAllInputs(): void {
    this.keys = {};
    if (this.playerStats) {
      this.playerStats.isGuarding = false;
    }
    if (this.wardBarrierMesh) {
      this.wardBarrierMesh.visible = false;
    }
    if (this.proximityBadgeEl) {
      this.proximityBadgeEl.style.display = 'none';
    }
    this.isPointerDragging = false;
  }

  private bindInputs(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
      window.addEventListener('pointermove', this.handlePointerMove);
      window.addEventListener('pointerup', this.handlePointerUp);
      this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  private handleBlur = (): void => {
    this.releaseAllInputs();
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.releaseAllInputs();
    }
  };

  private handlePointerDown = (e: PointerEvent): void => {
    if (e.target !== this.renderer?.domElement) return;
    this.isPointerDragging = true;
    this.pointerDragStartX = e.clientX;
    this.lastManualOrbitTime = performance.now();
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.isPointerDragging || this.cameraMode !== 'third_person') return;
    const deltaX = e.clientX - this.pointerDragStartX;
    this.pointerDragStartX = e.clientX;
    this.cameraYaw -= deltaX * 0.005;
    this.targetCameraYaw = this.cameraYaw;
    this.lastManualOrbitTime = performance.now();
  };

  private handlePointerUp = (): void => {
    this.isPointerDragging = false;
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    const context = this.getInputContext();

    // Universal: Audio toggle with [M] (single-pulse)
    if (key === 'm') {
      if (!e.repeat) this.toggleAudio();
      return;
    }

    // --- CONTEXT: DIALOGUE MODAL ---
    if (context === 'dialogue') {
      if (!e.repeat && (e.key === 'Escape' || e.code === 'Space' || key === 'e' || e.key === 'Enter')) {
        this.closeDialogueModal();
      }
      return;
    }

    // --- CONTEXT: INVENTORY MODAL ---
    if (context === 'inventory') {
      if (!e.repeat && (e.key === 'Escape' || key === 'i')) {
        this.toggleInventoryModal();
      }
      return;
    }

    // --- CONTEXT: SKILL TREE MODAL ---
    if (context === 'skillTree') {
      if (!e.repeat && (e.key === 'Escape' || key === 'h')) {
        this.toggleSkillTreeModal();
      }
      return;
    }

    // --- CONTEXT: ALCHEMY MODAL ---
    if (context === 'alchemy') {
      if (!e.repeat && (e.key === 'Escape' || key === 'b')) {
        this.toggleAlchemyModal();
      }
      return;
    }

    // --- CONTEXT: COMPENDIUM MODAL ---
    if (context === 'compendium') {
      if (!e.repeat && (e.key === 'Escape' || key === 'n')) {
        this.toggleCompendiumModal();
      }
      return;
    }

    // --- CONTEXT: DEFEATED ---
    if (context === 'defeated') {
      return;
    }

    // --- CONTEXT: GAMEPLAY ---
    // Toggle Hero with [TAB] (single-pulse only, ignores e.repeat)
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!e.repeat) this.toggleHero();
      return;
    }

    // Khaterine: Arrow Cycling [1, 2, 3] | Thomas: Crypts Inspection Hotkeys (1, 2, 3, 4, 5)
    if (key === '1' && !e.repeat) {
      if (this.activeHero === 'khaterine') {
        this.selectKhaterineArrow('abyssal');
        return;
      }
      this.openCemeteryGate();
      this.setPlayerPosition(0, 0, -44);
      this.updateProximityInteractions();
      return;
    }
    if (key === '2' && !e.repeat) {
      if (this.activeHero === 'khaterine') {
        this.selectKhaterineArrow('fire');
        return;
      }
      this.transitionToArea('crypts_interior');
      setTimeout(() => {
        this.setPlayerPosition(-1.2, 0, -79);
        this.updateProximityInteractions();
      }, 450);
      return;
    }
    if (key === '3' && !e.repeat) {
      if (this.activeHero === 'khaterine') {
        this.selectKhaterineArrow('silver');
        return;
      }
      this.dungeonAreaManager.enterCrypts();
      this.setPlayerPosition(-3.8, 0, -84.2);
      this.interactWithLootSarcophagus();
      this.updateProximityInteractions();
      return;
    }
    if (key === '4' && !e.repeat) {
      this.dungeonAreaManager.enterCrypts();
      this.setPlayerPosition(0, 0, -99);
      this.updateProximityInteractions();
      return;
    }
    if (key === '5' && !e.repeat) {
      this.handleInquisitorDefeat();
      return;
    }
    if (key === '6' && !e.repeat) {
      this.transitionToArea('black_willow_forest');
      setTimeout(() => {
        this.setPlayerPosition(0, 0, -135);
        this.updateProximityInteractions();
      }, 450);
      return;
    }
    if (key === '7' && !e.repeat) {
      this.dungeonAreaManager.enterBlackWillowForest();
      this.setPlayerPosition(0, 0, -153);
      this.updateProximityInteractions();
      return;
    }
    if (key === '8' && !e.repeat) {
      this.handleRootProwlerDefeat();
      return;
    }
    if (key === '9' && !e.repeat) {
      this.transitionToArea('belltower_summit');
      return;
    }
    if (key === '0' && !e.repeat) {
      this.transitionToArea('great_stone_bridge');
      return;
    }
    if (key === 'p' && !e.repeat) {
      this.transitionToArea('londinium_citadel');
      return;
    }
    if (key === 'o' && !e.repeat) {
      this.transitionToArea('inverted_cathedral');
      return;
    }
    if (key === 'n' && !e.repeat) {
      this.toggleCompendiumModal();
      return;
    }

    // Toggle Camera with [C] (single-pulse only)
    if (key === 'c') {
      if (!e.repeat) {
        this.toggleCameraMode();
        const btnCam = this.uiOverlay?.querySelector('#btn-toggle-cam') as HTMLButtonElement | null;
        if (btnCam) {
          btnCam.innerText = `🎥 [C] CÁMARA: ${this.cameraMode === 'isometric' ? 'OBLICUA 3/4' : 'TERCERA PERSONA'}`;
        }
      }
      return;
    }

    // Toggle Inventory Modal with [I] (single-pulse)
    if (key === 'i') {
      if (!e.repeat) this.toggleInventoryModal();
      return;
    }

    // Toggle Skill Tree Modal with [H] (single-pulse)
    if (key === 'h') {
      if (!e.repeat) this.toggleSkillTreeModal();
      return;
    }

    // Toggle Alchemy / Apothecary Modal with [B] (single-pulse)
    if (key === 'b') {
      if (!e.repeat) this.toggleAlchemyModal();
      return;
    }

    // Save Game at Sanctuary with [G] (single-pulse)
    if (key === 'g') {
      if (!e.repeat) this.executeSanctuarySave();
      return;
    }

    // Quick Balm / Consumable with [Q] (single-pulse)
    if (key === 'q') {
      if (!e.repeat) this.useQuickConsumable();
      return;
    }

    // Context Interaction / Pick up / Talk / Finisher with [E] (single-pulse)
    if (key === 'e') {
      if (!e.repeat) this.handleContextInteraction();
      return;
    }

    // Light Attack with [J] (single-pulse)
    if (key === 'j') {
      if (!e.repeat) this.executeAttack(false);
      return;
    }

    // Heavy Attack with [K] (single-pulse)
    if (key === 'k') {
      if (!e.repeat) this.executeAttack(true);
      return;
    }

    // Dodge with [SPACE] (single-pulse)
    if (e.code === 'Space') {
      if (!e.repeat) this.executeDodge();
      return;
    }

    // Guard / Abyssal Ward with [L] (continuous hold)
    if (key === 'l') {
      if (!this.playerStats.isGuarding) {
        this.playerStats.isGuarding = true;
        this.lastGuardTime = performance.now();
        if (this.activeHero === 'khaterine' && this.wardBarrierMesh) {
          this.wardBarrierMesh.visible = true;
        }
        this.audio.playSfx('dodge');
      }
      return;
    }

    // Throw Weapon with [T] (single-pulse, Thomas only)
    if (key === 't') {
      if (!e.repeat) {
        if (this.activeHero === 'thomas') {
          this.executeThrowWeapon();
        } else {
          this.spawnFloatingText(this.playerGroup.position, '¡El arco abisal está imbuido a tu alma!', '#d999ff');
        }
      }
      return;
    }

    // Eco del Aquelarre with [U] (single-pulse, Khaterine only with Colmillo del Sauce Negro)
    if (key === 'u') {
      if (!e.repeat) {
        this.executeKhaterineEchoVortex();
      }
      return;
    }

    // Continuous movement keys (WASD / Arrows)
    this.keys[key] = true;
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    this.keys[key] = false;

    if (key === 'l') {
      this.playerStats.isGuarding = false;
      if (this.wardBarrierMesh) {
        this.wardBarrierMesh.visible = false;
      }
    }
  };

  private handleResize = (): void => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // =========================================================================
  // DUAL HERO SWITCHING (THOMAS <-> KHATERINE) - H01 RESOLVED
  // =========================================================================
  public updateHeroVisuals(): void {
    const isKhaterine = this.activeHero === 'khaterine';

    if (this.thomasModelGroup) this.thomasModelGroup.visible = !isKhaterine;
    if (this.khaterineModelGroup) this.khaterineModelGroup.visible = isKhaterine;
    if (this.khaterineGroup) this.khaterineGroup.visible = !isKhaterine;
    if (this.thomasNpcGroup) this.thomasNpcGroup.visible = isKhaterine;

    if (this.droppedSwordGroup) {
      if (isKhaterine) {
        this.droppedSwordGroup.visible = false;
      } else {
        // H01: Retain Thomas's actual armed state
        this.droppedSwordGroup.visible = !this.party.getHero('thomas').isArmed;
      }
    }

    const btnHero = this.uiOverlay?.querySelector('#btn-toggle-hero') as HTMLButtonElement | null;
    if (btnHero) {
      btnHero.innerText = `🔄 [TAB] HÉROE: ${isKhaterine ? 'KHATERINE' : 'THOMAS'}`;
      btnHero.style.color = isKhaterine ? '#e6b8ff' : '#ffd700';
    }

    const heroPortrait = this.uiOverlay?.querySelector('#p3d-hero-portrait') as HTMLImageElement | null;
    if (heroPortrait) {
      heroPortrait.src = isKhaterine ? '/assets/concepts/concept_khaterine.png' : '/assets/concepts/concept_thomas.png';
      heroPortrait.style.borderColor = isKhaterine ? '#8e44ad' : '#d4af37';
    }

    this.updateHUD();
  }

  public setDialogueToast(speaker: string, text: string, portrait: string, borderColor = '#d4af37'): void {
    const toast = this.uiOverlay?.querySelector('#p3d-dialogue-toast') as HTMLDivElement | null;
    const container = this.uiOverlay?.querySelector('#p3d-dialogue-toast-container') as HTMLDivElement | null;
    const img = this.uiOverlay?.querySelector('#p3d-dialogue-portrait') as HTMLImageElement | null;
    if (toast) {
      toast.innerHTML = `<span style="color: ${borderColor}; font-weight: bold;">${speaker}:</span> ${text}`;
    }
    if (container) {
      container.style.borderColor = borderColor;
    }
    if (img) {
      img.src = portrait;
      img.style.borderColor = borderColor;
    }
  }

  public toggleHero(): void {
    const targetHero: HeroId = this.activeHero === 'thomas' ? 'khaterine' : 'thomas';
    const switched = this.party.switchHero(targetHero);
    if (!switched) {
      return;
    }

    this.updateHeroVisuals();

    if (this.activeHero === 'khaterine') {
      this.spawnFloatingText(this.playerGroup.position, '🏹 KHATERINE ACTIVADA (ARCO ABISAL)', '#d999ff');
    } else {
      this.spawnFloatingText(this.playerGroup.position, '⚔ THOMAS ACTIVADO (ESPADA CORTA)', '#ffd700');
    }
    this.audio.playSfx('menu_select');
  }

  public toggleAudio(): void {
    const isMuted = this.audio.toggleMute();
    const btnAudio = this.uiOverlay.querySelector('#btn-toggle-audio') as HTMLButtonElement;
    if (btnAudio) {
      btnAudio.innerText = isMuted ? '🔇 [M] AUDIO: MUDO' : '🎵 [M] AUDIO: ACTIVO';
      btnAudio.style.background = isMuted ? '#2b1010' : '#142a1f';
      btnAudio.style.color = isMuted ? '#ff9999' : '#a3ffc7';
      btnAudio.style.borderColor = isMuted ? '#c0392b' : '#27ae60';
    }
    this.spawnFloatingText(
      this.playerGroup.position,
      isMuted ? '🔇 AUDIO SILENCIADO' : '🎵 BGM CATEDRAL ACTIVA',
      isMuted ? '#ff8888' : '#88ffaa'
    );
  }

  // =========================================================================
  // COMBAT CALCULATIONS & EFFECTIVE MODIFIERS (H15 RESOLVED)
  // =========================================================================
  private calculateIncomingDamage(baseDmg: number, baseGuardDmg: number): number {
    let dmg = baseDmg;
    if (this.playerStats.isGuarding) {
      dmg = baseGuardDmg;
      if (this.activeHero === 'khaterine') {
        const wardMitigation = this.progression.getWardMitigationBonusPct();
        if (wardMitigation > 0) {
          dmg = Math.max(1, Math.round(dmg * (1 - wardMitigation / 100)));
        }
      }
    }
    if (dmg > 0) {
      this.triggerDamageVignette(dmg >= 25 ? 0.85 : 0.6);
    }
    return dmg;
  }

  private getStaggerMultiplier(): number {
    const bonus = this.progression.getStaggerBonusPct('thomas');
    return 1 + (bonus / 100);
  }

  // =========================================================================
  // COMBAT ACTIONS (ATTACK, DODGE, THROW, PARRY)
  // =========================================================================
  private executeAttack(isHeavy: boolean): void {
    if (this.isPlayerAttacking || this.playerStats.isDodging) return;

    // If Khaterine is active, fire Abyssal Arrow projectiles!
    if (this.activeHero === 'khaterine') {
      this.shootAbyssalArrow(isHeavy);
      return;
    }

    // Thomas Melee Attack
    this.isPlayerAttacking = true;
    this.attackCooldown = isHeavy ? 0.45 : 0.28;
    this.audio.playCombatHit(isHeavy);

    // Visual Slash Animation on weapon
    if (this.playerStats.isArmed) {
      this.playerSwordMesh.rotation.set(isHeavy ? -1.2 : -0.8, isHeavy ? 0.8 : -0.6, 0);
      setTimeout(() => {
        if (this.playerSwordMesh) this.playerSwordMesh.rotation.set(0.3, 0, -0.2);
        this.isPlayerAttacking = false;
      }, isHeavy ? 280 : 180);
    } else {
      // Unarmed punch animation
      this.playerFistsGroup.position.z += 0.35;
      setTimeout(() => {
        if (this.playerFistsGroup) this.playerFistsGroup.position.z -= 0.35;
        this.isPlayerAttacking = false;
      }, 160);
    }

    const reach = this.playerStats.isArmed ? 2.4 : 1.6;

    // Destructible Props Hit Check with Sword Slash
    this.destructibles.forEach(prop => {
      if (!prop.isDestroyed) {
        const d = this.playerGroup.position.distanceTo(prop.position);
        if (d <= reach + prop.radius) {
          this.destroyProp(prop);
        }
      }
    });

    // Hit Detection against Hound Enemy
    const distToEnemy = this.playerGroup.position.distanceTo(this.enemyGroup.position);

    if (distToEnemy <= reach && this.enemyState !== 'DEAD') {
      const baseDmg = this.playerStats.isArmed ? (isHeavy ? 42 : 26) : (isHeavy ? 22 : 14);
      const dmg = Math.round(baseDmg * this.attackBuffMultiplier);
      this.enemyHealth = Math.max(0, this.enemyHealth - dmg);
      this.spawnFloatingText(this.enemyGroup.position, `-${dmg}`, isHeavy ? '#ffd700' : '#e699ff');

      // Stagger enemy on heavy hit
      if (isHeavy) {
        this.enemyState = 'STUNNED';
        this.enemyTimer = 0.8;
      }

      this.updateHUD();

      if (this.enemyHealth <= 0) {
        this.enemyState = 'DEAD';
        this.spawnFloatingText(this.enemyGroup.position, '¡PURIFICADO! (+40 EXP)', '#ffd700');
        this.audio.playFinisherSound(true);
        this.enemyGroup.position.y = -0.3;
        this.awardEnemyKillRewards('hound', false);
      }
    }

    // Hit Detection against Cultist Enemy
    const distToCultist = this.playerGroup.position.distanceTo(this.cultistGroup.position);

    if (distToCultist <= reach && this.cultistState !== 'DEAD') {
      const baseDmg = this.playerStats.isArmed ? (isHeavy ? 36 : 24) : (isHeavy ? 18 : 12);
      const skillBonus = 1.0 + (this.progression.getDamageBonusPct(this.activeHero) / 100);
      const dmg = Math.round(baseDmg * this.attackBuffMultiplier * skillBonus);
      this.cultistHealth = Math.max(0, this.cultistHealth - dmg);
      this.spawnFloatingText(this.cultistGroup.position, `-${dmg}`, isHeavy ? '#ffd700' : '#a3ffc7');

      if (isHeavy) {
        this.cultistState = 'STUNNED';
        this.cultistTimer = 0.9;
        this.spawnFloatingText(this.cultistGroup.position, '¡ATURDIDO! [E] ¡REMATAR!', '#ffaa44');
      }

      this.updateHUD();

      if (this.cultistHealth <= 0) {
        this.cultistState = 'DEAD';
        this.spawnFloatingText(this.cultistGroup.position, '¡PORTADOR DE CENIZA PURIFICADO! (+60 EXP)', '#ffd700');
        this.audio.playFinisherSound(true);
        this.cultistGroup.position.y = -0.3;
        this.cultistCenserLight.intensity = 0;
        this.awardEnemyKillRewards('cultist', false);
        this.updateHUD();
      }
    }

    // Hit Detection against Chain Zealot Enemy
    const distToZealot = this.playerGroup.position.distanceTo(this.zealotGroup.position);

    if (distToZealot <= reach && this.zealotState !== 'DEAD') {
      const baseDmg = this.playerStats.isArmed ? (isHeavy ? 44 : 28) : (isHeavy ? 24 : 14);
      const skillBonus = 1.0 + (this.progression.getDamageBonusPct(this.activeHero) / 100);
      const dmg = Math.round(baseDmg * this.attackBuffMultiplier * skillBonus);
      this.zealotHealth = Math.max(0, this.zealotHealth - dmg);
      this.spawnFloatingText(this.zealotGroup.position, `-${dmg}`, isHeavy ? '#ffd700' : '#ff7788');

      if (isHeavy) {
        this.zealotState = 'STUNNED';
        this.zealotTimer = 1.0;
        this.spawnFloatingText(this.zealotGroup.position, '¡ATURDIDO! [E] ¡REMATAR!', '#ffaa44');
      }

      this.updateHUD();

      if (this.zealotHealth <= 0) {
        this.zealotState = 'DEAD';
        this.spawnFloatingText(this.zealotGroup.position, '¡FLAGELANTE PURIFICADO! (+80 EXP)', '#ffd700');
        this.audio.playFinisherSound(true);
        this.zealotGroup.position.y = -0.3;
        this.awardEnemyKillRewards('zealot', false);
        this.updateHUD();
      }
    }

    // Hit Detection against Crypt Skeleton Enemy
    const distToSkeleton = this.playerGroup.position.distanceTo(this.skeletonGroup.position);
    if (distToSkeleton <= reach && this.skeletonState !== 'DEAD') {
      const baseDmg = this.playerStats.isArmed ? (isHeavy ? 42 : 26) : (isHeavy ? 22 : 12);
      const skillBonus = 1.0 + (this.progression.getDamageBonusPct(this.activeHero) / 100);
      const dmg = Math.round(baseDmg * this.attackBuffMultiplier * skillBonus);
      this.skeletonHealth = Math.max(0, this.skeletonHealth - dmg);
      this.spawnFloatingText(this.skeletonGroup.position, `-${dmg}`, isHeavy ? '#ffd700' : '#00e5ff');

      if (isHeavy) {
        this.skeletonState = 'STUNNED';
        this.skeletonTimer = 1.1;
        this.spawnFloatingText(this.skeletonGroup.position, '¡ATURDIDO! [E] ¡REMATAR!', '#ffaa44');
      }

      this.updateHUD();

      if (this.skeletonHealth <= 0) {
        this.skeletonState = 'DEAD';
        this.spawnFloatingText(this.skeletonGroup.position, '¡PENITENTE PURIFICADO! (+100 EXP)', '#00e5ff');
        this.audio.playFinisherSound(true);
        this.skeletonGroup.position.y = -0.3;
        this.awardEnemyKillRewards('skeleton', false);
        this.updateHUD();
      }
    }

    // Hit Detection against Boss Morwenna
    const distToMorwenna = this.playerGroup.position.distanceTo(this.morwennaGroup.position);
    if (distToMorwenna <= reach && this.morwennaState !== 'DORMANT' && this.morwennaState !== 'DEAD' && this.morwennaState !== 'PHASE2_TRANSITION') {
      const baseDmg = this.playerStats.isArmed ? (isHeavy ? 38 : 22) : (isHeavy ? 18 : 12);
      const skillBonus = 1.0 + (this.progression.getDamageBonusPct(this.activeHero) / 100);
      const dmg = Math.round(baseDmg * this.attackBuffMultiplier * skillBonus);
      const mResult = this.morwennaEncounter.takeDamage(dmg);
      this.morwennaHealth = mResult.currentHealth;
      this.spawnFloatingText(this.morwennaGroup.position, `-${dmg}`, isHeavy ? '#ffd700' : '#ff88aa');

      if (isHeavy && this.morwennaState !== 'STUNNED') {
        this.morwennaState = 'STUNNED';
        this.morwennaTimer = 1.2 * this.getStaggerMultiplier();
        this.spawnFloatingText(this.morwennaGroup.position, '¡ATURDIDA! [E] ¡REMATAR!', '#ffaa44');
      }

      this.updateHUD();

      if (mResult.transitionedToPhase2) {
        this.triggerMorwennaPhase2();
      } else if (mResult.defeated) {
        this.handleMorwennaDefeat();
      }
    }

    // Hit Detection against Catacomb Inquisitor
    if (this.dungeonAreaManager.currentArea === 'crypts_interior' && !this.inquisitorEncounter.isDefeated) {
      const distToInq = this.playerGroup.position.distanceTo(this.inquisitorGroup.position);
      if (distToInq <= reach + 0.6) {
        const baseDmg = this.playerStats.isArmed ? (isHeavy ? 45 : 28) : (isHeavy ? 24 : 14);
        const skillBonus = 1.0 + (this.progression.getDamageBonusPct(this.activeHero) / 100);
        const dmg = Math.round(baseDmg * this.attackBuffMultiplier * skillBonus);

        const toInq = this.inquisitorGroup.position.clone().sub(this.playerGroup.position).normalize();
        const inqFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(this.inquisitorGroup.quaternion);
        const isFrontal = toInq.dot(inqFwd) < -0.2;

        const hitRes = this.inquisitorEncounter.takeDamage(dmg, isFrontal);
        if (hitRes.blocked) {
          this.spawnFloatingText(this.inquisitorGroup.position, `-${hitRes.actualDamage} (¡ESCUDO BLOQUEA 60%!)`, '#9b59b6');
          this.audio.playMaceImpact?.();
        } else {
          this.spawnFloatingText(this.inquisitorGroup.position, `-${hitRes.actualDamage}`, isHeavy ? '#ffd700' : '#ff4466');
          this.audio.playCombatHit(isHeavy);
        }

        if (this.inquisitorHpBarFill) {
          this.inquisitorHpBarFill.style.width = `${Math.max(0, (this.inquisitorEncounter.health / this.inquisitorEncounter.maxHealth) * 100)}%`;
        }

        if (hitRes.defeated) {
          this.handleInquisitorDefeat();
        }
      }
    }

    // Hit Detection against Crypt Ambush Skeleton
    if (this.dungeonAreaManager.currentArea === 'crypts_interior' && this.cryptAmbushAwakened && !this.cryptAmbushDead) {
      const distToAmbush = this.playerGroup.position.distanceTo(this.cryptAmbushSkeletonGroup.position);
      if (distToAmbush <= reach) {
        const baseDmg = this.playerStats.isArmed ? (isHeavy ? 40 : 25) : (isHeavy ? 20 : 12);
        const skillBonus = 1.0 + (this.progression.getDamageBonusPct(this.activeHero) / 100);
        const dmg = Math.round(baseDmg * this.attackBuffMultiplier * skillBonus);
        this.cryptAmbushHp = Math.max(0, this.cryptAmbushHp - dmg);
        this.spawnFloatingText(this.cryptAmbushSkeletonGroup.position, `-${dmg}`, isHeavy ? '#ffd700' : '#00e5ff');
        this.audio.playCombatHit(isHeavy);

        if (this.cryptAmbushHp <= 0) {
          this.cryptAmbushDead = true;
          this.cryptAmbushSkeletonGroup.position.y = -0.3;
          this.spawnFloatingText(this.cryptAmbushSkeletonGroup.position, '¡PENITENTE PURIFICADO! (+80 EXP)', '#00e5ff');
          this.awardEnemyKillRewards('crypt_ambush', false);
        }
      }
    }

    // Hit Detection against Root Prowler in Black Willow Forest
    if (this.dungeonAreaManager.currentArea === 'black_willow_forest' && !this.rootProwlerEncounter.isDefeated) {
      const distToProwler = this.playerGroup.position.distanceTo(this.rootProwlerGroup.position);
      if (distToProwler <= reach + 0.6) {
        const baseDmg = this.playerStats.isArmed ? (isHeavy ? 42 : 26) : (isHeavy ? 22 : 14);
        const skillBonus = 1.0 + (this.progression.getDamageBonusPct(this.activeHero) / 100);
        const dmg = Math.round(baseDmg * this.attackBuffMultiplier * skillBonus);

        const hitRes = this.rootProwlerEncounter.takeDamage(dmg, false);
        this.spawnFloatingText(this.rootProwlerGroup.position, `-${hitRes.actualDamage}`, isHeavy ? '#ffd700' : '#bb44ff');
        this.audio.playCombatHit(isHeavy);

        if (isHeavy) {
          this.rootProwlerEncounter.setState('STUNNED');
          this.rootProwlerTimer = 1.3;
          this.spawnFloatingText(this.rootProwlerGroup.position, '⚡ ¡ATURDIDO! [E] ¡REMATAR!', '#ffaa44');
        }

        if (this.rootProwlerHpBarFill) {
          this.rootProwlerHpBarFill.style.width = `${Math.max(0, (this.rootProwlerEncounter.health / this.rootProwlerEncounter.maxHealth) * 100)}%`;
        }

        if (hitRes.defeated) {
          this.handleRootProwlerDefeat();
        }
      }
    }

    // Hit Detection against Act II Boss: Crucible Guardian
    if (this.dungeonAreaManager.currentArea === 'belltower_summit' && !this.crucibleGuardianEncounter.isDefeated) {
      const distToGuardian = this.playerGroup.position.distanceTo(this.crucibleGuardianGroup.position);
      if (distToGuardian <= reach + 0.8) {
        const baseDmg = this.playerStats.isArmed ? (this.hasForgedAlbaGris ? (isHeavy ? 58 : 38) : (isHeavy ? 44 : 28)) : (isHeavy ? 22 : 14);
        const skillBonus = 1.0 + (this.progression.getDamageBonusPct(this.activeHero) / 100);
        const dmg = Math.round(baseDmg * this.attackBuffMultiplier * skillBonus);
        const isVulnerable = this.crucibleGuardianEncounter.state === 'STUNNED';

        const hitRes = this.crucibleGuardianEncounter.takeDamage(dmg, isVulnerable);
        this.spawnFloatingText(
          this.crucibleGuardianGroup.position,
          isVulnerable ? `-${hitRes.actualDamage} (¡CRÍTICO +40%!)` : `-${hitRes.actualDamage}`,
          isVulnerable || isHeavy ? '#ffd700' : '#ff7722'
        );
        this.audio.playCombatHit(isHeavy || isVulnerable);

        if (isHeavy && this.crucibleGuardianEncounter.state !== 'STUNNED') {
          this.crucibleGuardianEncounter.setState('STUNNED');
          this.crucibleTimer = 1.3 * this.getStaggerMultiplier();
          this.spawnFloatingText(this.crucibleGuardianGroup.position, '⚡ ¡ATURDIDO! [E] ¡REMATAR!', '#ffaa44');
        }

        this.updateHUD();
        if (hitRes.defeated) {
          this.handleCrucibleGuardianDefeat();
        }
      }
    }

    // Hit Detection against Act III Boss: Captain Áureo Vane
    if (this.dungeonAreaManager.currentArea === 'great_stone_bridge' && !this.captainVaneEncounter.isDefeated) {
      const distToVane = this.playerGroup.position.distanceTo(this.captainVaneGroup.position);
      if (distToVane <= reach + 0.8) {
        const baseDmg = this.playerStats.isArmed ? (this.hasForgedAlbaGris ? (isHeavy ? 58 : 38) : (isHeavy ? 44 : 28)) : (isHeavy ? 22 : 14);
        const skillBonus = 1.0 + (this.progression.getDamageBonusPct(this.activeHero) / 100);
        const dmg = Math.round(baseDmg * this.attackBuffMultiplier * skillBonus);

        const toVane = this.captainVaneGroup.position.clone().sub(this.playerGroup.position).normalize();
        const vaneFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(this.captainVaneGroup.quaternion);
        const isFrontal = toVane.dot(vaneFwd) < -0.2;
        const bypassShield = isHeavy || this.hasForgedAlbaGris || this.inventory.hasItem('relic_false_verdict');

        if (isHeavy && this.captainVaneEncounter.shieldRaised) {
          this.captainVaneEncounter.breakShield();
          this.vaneTimer = 1.6 * this.getStaggerMultiplier();
          this.audio.playSfx('shield_break');
          if (this.vaneShieldMesh) this.vaneShieldMesh.rotation.x = 1.1;
          this.spawnFloatingText(this.captainVaneGroup.position, '💥 ¡ESCUDO DE TORRE QUEBRADO! [E] ¡REMATAR!', '#ffd700');
        }

        const hitRes = this.captainVaneEncounter.takeDamage(dmg, isFrontal, bypassShield);
        if (hitRes.blocked) {
          this.spawnFloatingText(this.captainVaneGroup.position, `-${hitRes.actualDamage} (¡ESCUDO BLOQUEA 80%! USA [K] O FLANQUEA)`, '#ffd700');
          this.audio.playShieldCrush();
        } else {
          this.spawnFloatingText(this.captainVaneGroup.position, `-${hitRes.actualDamage}`, isHeavy ? '#ffd700' : '#ffee88');
          this.audio.playCombatHit(isHeavy);
        }

        this.updateHUD();
        if (hitRes.defeated) {
          this.handleCaptainVaneDefeat();
        }
      }
    }

    // Hit Detection against Act IV Boss: Rex Malphas (Alaric)
    if (this.dungeonAreaManager.currentArea === 'londinium_citadel' && !this.rexMalphasEncounter.isDefeated) {
      const distToMalphas = this.playerGroup.position.distanceTo(this.rexMalphasGroup.position);
      if (distToMalphas <= reach + 0.8) {
        const baseDmg = this.playerStats.isArmed ? (this.hasForgedAlbaGris ? (isHeavy ? 60 : 40) : (isHeavy ? 46 : 30)) : (isHeavy ? 24 : 15);
        const skillBonus = 1.0 + (this.progression.getDamageBonusPct(this.activeHero) / 100);
        const dmg = Math.round(baseDmg * this.attackBuffMultiplier * skillBonus);

        const hitRes = this.rexMalphasEncounter.takeDamage(dmg);
        this.spawnFloatingText(this.rexMalphasGroup.position, `-${hitRes.actualDamage}`, isHeavy ? '#ffd700' : '#cc44ff');
        this.audio.playCombatHit(isHeavy);

        if (isHeavy && !hitRes.transitionedToPhase2 && this.rexMalphasEncounter.state !== 'STUNNED') {
          this.rexMalphasEncounter.setState('STUNNED');
          this.malphasTimer = 1.2 * this.getStaggerMultiplier();
          this.spawnFloatingText(this.rexMalphasGroup.position, '⚡ ¡ATURDIDO! [E] ¡REMATAR!', '#ffaa44');
        }

        this.updateHUD();
        if (hitRes.transitionedToPhase2) {
          this.triggerRexMalphasPhase2();
        } else if (hitRes.defeated) {
          this.handleRexMalphasDefeat();
        }
      }
    }

    // Hit Detection against Act V Final Titan: Astaroth (Sol del Abismo)
    if (this.dungeonAreaManager.currentArea === 'inverted_cathedral' && !this.astarothEncounter.isDefeated) {
      const distHoriz = new THREE.Vector2(
        this.playerGroup.position.x - this.astarothGroup.position.x,
        this.playerGroup.position.z - this.astarothGroup.position.z
      ).length();
      if (distHoriz <= reach + 2.2) {
        const baseDmg = this.playerStats.isArmed ? (this.hasForgedAlbaGris ? (isHeavy ? 60 : 40) : (isHeavy ? 46 : 30)) : (isHeavy ? 24 : 15);
        const skillBonus = 1.0 + (this.progression.getDamageBonusPct(this.activeHero) / 100);
        const dmg = Math.round(baseDmg * this.attackBuffMultiplier * skillBonus);

        const hitRes = this.astarothEncounter.takeDamage(dmg, this.hasForgedAlbaGris);
        this.spawnFloatingText(
          this.astarothGroup.position,
          this.hasForgedAlbaGris ? `✨ -${hitRes.actualDamage} (¡CRÍTICO ALBA GRIS x2!)` : `-${hitRes.actualDamage}`,
          this.hasForgedAlbaGris ? '#88eeff' : '#ff2288'
        );
        this.audio.playCombatHit(isHeavy || this.hasForgedAlbaGris);

        if (isHeavy && this.astarothEncounter.state !== 'STUNNED') {
          this.astarothEncounter.setState('STUNNED');
          this.astarothTimer = 1.2 * this.getStaggerMultiplier();
          this.spawnFloatingText(this.astarothGroup.position, '⚡ ¡NÚCLEO EXPUESTO! [E] ¡REMATAR!', '#ffd700');
        }

        this.updateHUD();
        if (hitRes.defeated) {
          this.handleAstarothDefeat();
        }
      }
    }
  }

  // =========================================================================
  // ABYSSAL RANGED PROJECTILES & PROPS
  // =========================================================================
  private shootAbyssalArrow(isHeavy: boolean): void {
    const shot = this.arsenalManager.prepareArrowShot(this.inventory, isHeavy);
    this.isPlayerAttacking = true;
    this.attackCooldown = isHeavy ? 0.48 : 0.26;
    this.audio.playBowShot();

    // Bow recoil animation
    if (this.khaterineBowMesh) {
      this.khaterineBowMesh.position.z -= 0.15;
      setTimeout(() => {
        if (this.khaterineBowMesh) this.khaterineBowMesh.position.z += 0.15;
        this.isPlayerAttacking = false;
      }, isHeavy ? 260 : 160);
    }

    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.playerGroup.rotation).normalize();
    const spawnPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, 1.25, 0)).add(forward.clone().multiplyScalar(0.7));

    // Arrow Group Mesh
    const arrowGroup = new THREE.Group();
    arrowGroup.position.copy(spawnPos);

    const arrowShaftMat = new THREE.MeshBasicMaterial({ color: shot.colorHex });
    const arrowHeadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, isHeavy ? 0.95 : 0.7, 6), arrowShaftMat);
    shaft.rotation.x = Math.PI / 2;
    arrowGroup.add(shaft);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), arrowHeadMat);
    tip.position.z = -0.4;
    tip.rotation.x = -Math.PI / 2;
    arrowGroup.add(tip);

    const light = new THREE.PointLight(shot.colorHex, isHeavy ? 3.8 : 2.2, 5);
    arrowGroup.add(light);

    // Look in flying direction
    arrowGroup.lookAt(spawnPos.clone().add(forward));
    this.scene.add(arrowGroup);

    const speed = isHeavy ? 22 : 18;
    const arrowBonus = 1.0 + (this.progression.getArrowDamageBonusPct() / 100);
    this.projectiles.push({
      mesh: arrowGroup,
      light,
      velocity: forward.multiplyScalar(speed),
      life: 1.8,
      maxLife: 1.8,
      damage: Math.round(shot.baseDamage * this.attackBuffMultiplier * arrowBonus),
      isHeavy,
      arrowType: shot.arrowType
    });
    this.updateHUD();
  }

  private updateProjectiles(delta: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= delta;

      if (p.isThrownFlask) {
        p.velocity.y -= 14.0 * delta;
        p.mesh.rotation.x += 8.0 * delta;
        p.mesh.rotation.z += 6.0 * delta;
      }

      p.mesh.position.addScaledVector(p.velocity, delta);

      // Thrown flask floor impact
      if (p.isThrownFlask && p.mesh.position.y <= 0.2) {
        this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      let collided = false;

      // 1. Check hound enemy collision
      if (this.enemyState !== 'DEAD') {
        const dEnemy = p.mesh.position.distanceTo(this.enemyGroup.position.clone().add(new THREE.Vector3(0, 0.6, 0)));
        if (dEnemy <= 1.4) {
          collided = true;
          if (p.isThrownFlask) {
            this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
          } else {
            this.enemyHealth = Math.max(0, this.enemyHealth - p.damage);
            const label = p.arrowType === 'fire' ? 'FLECHA DE FUEGO' : p.arrowType === 'silver' ? 'FLECHA DE PLATA' : 'FLECHA ABISAL';
            this.spawnFloatingText(this.enemyGroup.position, `-${p.damage} (${label})`, p.isHeavy ? '#ffd700' : '#d999ff');
            this.audio.playCombatHit(p.isHeavy);

            if (p.arrowType === 'fire') {
              this.activeBurnEffects.push({ targetId: 'hound', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
              this.spawnFloatingText(this.enemyGroup.position, '🔥 ¡QUEMADURA DE FUEGO FATUO!', '#ff7722');
            }

            if (p.isHeavy || p.arrowType === 'silver') {
              this.enemyState = 'STUNNED';
              this.enemyTimer = p.arrowType === 'silver' ? 1.5 : 1.0;
            }

            if (this.enemyHealth <= 0) {
              this.enemyState = 'DEAD';
              this.spawnFloatingText(this.enemyGroup.position, '¡PURIFICADO! (+40 EXP)', '#ffd700');
              this.audio.playFinisherSound(true);
              this.enemyGroup.position.y = -0.3;
              this.awardEnemyKillRewards('hound', false);
            }
            this.updateHUD();
          }
        }
      }

      // 2. Check cultist enemy collision
      if (!collided && this.cultistState !== 'DEAD') {
        const dCultist = p.mesh.position.distanceTo(this.cultistGroup.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
        if (dCultist <= 1.5) {
          collided = true;
          if (p.isThrownFlask) {
            this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
          } else {
            this.cultistHealth = Math.max(0, this.cultistHealth - p.damage);
            const label = p.arrowType === 'fire' ? 'FLECHA DE FUEGO' : p.arrowType === 'silver' ? 'FLECHA DE PLATA' : 'FLECHA ABISAL';
            this.spawnFloatingText(this.cultistGroup.position, `-${p.damage} (${label})`, p.isHeavy ? '#ffd700' : '#a3ffc7');
            this.audio.playCombatHit(p.isHeavy);

            if (p.arrowType === 'fire') {
              this.activeBurnEffects.push({ targetId: 'cultist', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
              this.spawnFloatingText(this.cultistGroup.position, '🔥 ¡QUEMADURA DE FUEGO FATUO!', '#ff7722');
            }

            if (p.isHeavy || p.arrowType === 'silver') {
              this.cultistState = 'STUNNED';
              this.cultistTimer = p.arrowType === 'silver' ? 1.6 : 1.0;
              this.spawnFloatingText(this.cultistGroup.position, '¡ATURDIDO! [E] ¡REMATAR!', '#ffaa44');
            }

            if (this.cultistHealth <= 0) {
              this.cultistState = 'DEAD';
              this.spawnFloatingText(this.cultistGroup.position, '¡PORTADOR DE CENIZA PURIFICADO! (+60 EXP)', '#ffd700');
              this.audio.playFinisherSound(true);
              this.cultistGroup.position.y = -0.3;
              this.cultistCenserLight.intensity = 0;
              this.awardEnemyKillRewards('cultist', false);
            }
            this.updateHUD();
          }
        }
      }

      // 3. Check chain zealot enemy collision
      if (!collided && this.zealotState !== 'DEAD') {
        const dZealot = p.mesh.position.distanceTo(this.zealotGroup.position.clone().add(new THREE.Vector3(0, 0.9, 0)));
        if (dZealot <= 1.6) {
          collided = true;
          if (p.isThrownFlask) {
            this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
          } else {
            this.zealotHealth = Math.max(0, this.zealotHealth - p.damage);
            const label = p.arrowType === 'fire' ? 'FLECHA DE FUEGO' : p.arrowType === 'silver' ? 'FLECHA DE PLATA' : 'FLECHA ABISAL';
            this.spawnFloatingText(this.zealotGroup.position, `-${p.damage} (${label})`, p.isHeavy ? '#ffd700' : '#ff7788');
            this.audio.playCombatHit(p.isHeavy);

            if (p.arrowType === 'fire') {
              this.activeBurnEffects.push({ targetId: 'zealot', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
              this.spawnFloatingText(this.zealotGroup.position, '🔥 ¡QUEMADURA DE FUEGO FATUO!', '#ff7722');
            }

            if (p.isHeavy || p.arrowType === 'silver') {
              this.zealotState = 'STUNNED';
              this.zealotTimer = p.arrowType === 'silver' ? 1.8 : 1.1;
              this.spawnFloatingText(this.zealotGroup.position, '¡ATURDIDO! [E] ¡REMATAR!', '#ffaa44');
            }

            if (this.zealotHealth <= 0) {
              this.zealotState = 'DEAD';
              this.spawnFloatingText(this.zealotGroup.position, '¡FLAGELANTE PURIFICADO! (+80 EXP)', '#ffd700');
              this.audio.playFinisherSound(true);
              this.zealotGroup.position.y = -0.3;
              this.awardEnemyKillRewards('zealot', false);
            }
            this.updateHUD();
          }
        }
      }

      // 4. Check Crypt Skeleton collision
      if (!collided && this.skeletonState !== 'DEAD') {
        const dSkel = p.mesh.position.distanceTo(this.skeletonGroup.position.clone().add(new THREE.Vector3(0, 1.0, 0)));
        if (dSkel <= 1.5) {
          collided = true;
          if (p.isThrownFlask) {
            this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
          } else {
            const finalDmg = p.arrowType === 'silver' ? Math.round(p.damage * 1.5) : p.damage;
            this.skeletonHealth = Math.max(0, this.skeletonHealth - finalDmg);
            const label = p.arrowType === 'silver' ? '¡CRÍTICO DE PLATA!' : p.arrowType === 'fire' ? 'FLECHA DE FUEGO' : 'FLECHA ABISAL';
            this.spawnFloatingText(this.skeletonGroup.position, `-${finalDmg} (${label})`, p.isHeavy || p.arrowType === 'silver' ? '#ffd700' : '#00e5ff');
            this.audio.playCombatHit(p.isHeavy);

            if (p.arrowType === 'fire') {
              this.activeBurnEffects.push({ targetId: 'skeleton', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
              this.spawnFloatingText(this.skeletonGroup.position, '🔥 ¡QUEMADURA DE FUEGO FATUO!', '#ff7722');
            }

            if (p.isHeavy || p.arrowType === 'silver') {
              this.skeletonState = 'STUNNED';
              this.skeletonTimer = p.arrowType === 'silver' ? 2.0 : 1.3;
              this.spawnFloatingText(this.skeletonGroup.position, '¡ATURDIDO! [E] ¡REMATAR!', '#ffaa44');
            }

            if (this.skeletonHealth <= 0) {
              this.skeletonState = 'DEAD';
              this.spawnFloatingText(this.skeletonGroup.position, '¡PENITENTE PURIFICADO! (+100 EXP)', '#00e5ff');
              this.audio.playFinisherSound(true);
              this.skeletonGroup.position.y = -0.3;
              this.awardEnemyKillRewards('skeleton', false);
            }
            this.updateHUD();
          }
        }
      }

      // 5. Check Morwenna collision
      if (!collided && this.morwennaState !== 'DORMANT' && this.morwennaState !== 'DEAD' && this.morwennaState !== 'PHASE2_TRANSITION') {
        const dMorw = p.mesh.position.distanceTo(this.morwennaGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
        if (dMorw <= 1.8) {
          collided = true;
          if (p.isThrownFlask) {
            this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
          } else {
            const mResult = this.morwennaEncounter.takeDamage(p.damage);
            this.morwennaHealth = mResult.currentHealth;
            const label = p.arrowType === 'fire' ? 'FUEGO FATUO' : p.arrowType === 'silver' ? 'PLATA SAGRADA' : 'DISPARO ABISAL';
            this.spawnFloatingText(this.morwennaGroup.position, `-${p.damage} (${label})`, p.isHeavy ? '#ffd700' : '#ff88ee');
            this.audio.playCombatHit(p.isHeavy);

            if (p.arrowType === 'fire') {
              this.activeBurnEffects.push({ targetId: 'morwenna', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
              this.spawnFloatingText(this.morwennaGroup.position, '🔥 ¡CRISOL EN LLAMAS!', '#ff7722');
            }

            if (p.isHeavy && this.morwennaState !== 'STUNNED') {
              this.morwennaState = 'STUNNED';
              this.morwennaTimer = 1.4 * this.getStaggerMultiplier();
              this.spawnFloatingText(this.morwennaGroup.position, '¡ATURDIDA! [E] ¡REMATAR!', '#ffaa44');
            }

            if (mResult.transitionedToPhase2) {
              this.triggerMorwennaPhase2();
            } else if (mResult.defeated) {
              this.handleMorwennaDefeat();
            }
            this.updateHUD();
          }
        }
      }

      // 6. Check Catacomb Inquisitor collision
      if (!collided && this.dungeonAreaManager.currentArea === 'crypts_interior' && !this.inquisitorEncounter.isDefeated) {
        const dInq = p.mesh.position.distanceTo(this.inquisitorGroup.position.clone().add(new THREE.Vector3(0, 1.3, 0)));
        if (dInq <= 1.8) {
          collided = true;
          if (p.isThrownFlask) {
            this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
          } else {
            // Silver arrows ignore frontal shield block
            const bypassShield = p.arrowType === 'silver';
            const hitRes = this.inquisitorEncounter.takeDamage(p.damage, bypassShield ? false : true);
            const label = bypassShield ? '¡PERFORA-ESCUDO (PLATA)!' : p.arrowType === 'fire' ? 'FUEGO FATUO' : 'DISPARO ABISAL';
            this.spawnFloatingText(this.inquisitorGroup.position, `-${hitRes.actualDamage} (${label})`, p.isHeavy || bypassShield ? '#ffd700' : '#ff4466');
            this.audio.playCombatHit(p.isHeavy);

            if (p.arrowType === 'fire') {
              this.activeBurnEffects.push({ targetId: 'inquisitor', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
              this.spawnFloatingText(this.inquisitorGroup.position, '🔥 ¡INQUISIDOR EN LLAMAS!', '#ff7722');
            }

            if (this.inquisitorHpBarFill) {
              this.inquisitorHpBarFill.style.width = `${Math.max(0, (this.inquisitorEncounter.health / this.inquisitorEncounter.maxHealth) * 100)}%`;
            }
            if (hitRes.defeated) {
              this.handleInquisitorDefeat();
            }
            this.updateHUD();
          }
        }
      }

      // 7. Check Crypt Ambush Skeleton collision
      if (!collided && this.dungeonAreaManager.currentArea === 'crypts_interior' && this.cryptAmbushAwakened && !this.cryptAmbushDead) {
        const dAmbush = p.mesh.position.distanceTo(this.cryptAmbushSkeletonGroup.position.clone().add(new THREE.Vector3(0, 1.0, 0)));
        if (dAmbush <= 1.5) {
          collided = true;
          if (p.isThrownFlask) {
            this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
          } else {
            const finalDmg = p.arrowType === 'silver' ? Math.round(p.damage * 1.5) : p.damage;
            this.cryptAmbushHp = Math.max(0, this.cryptAmbushHp - finalDmg);
            const label = p.arrowType === 'silver' ? '¡CRÍTICO DE PLATA!' : 'FLECHA ABISAL';
            this.spawnFloatingText(this.cryptAmbushSkeletonGroup.position, `-${finalDmg} (${label})`, p.isHeavy || p.arrowType === 'silver' ? '#ffd700' : '#00e5ff');
            this.audio.playCombatHit(p.isHeavy);

            if (p.arrowType === 'fire') {
              this.activeBurnEffects.push({ targetId: 'crypt_ambush', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
            }

            if (this.cryptAmbushHp <= 0) {
              this.cryptAmbushDead = true;
              this.cryptAmbushSkeletonGroup.position.y = -0.3;
              this.spawnFloatingText(this.cryptAmbushSkeletonGroup.position, '¡PENITENTE PURIFICADO! (+80 EXP)', '#00e5ff');
              this.awardEnemyKillRewards('crypt_ambush', false);
            }
            this.updateHUD();
          }
        }
      }

      // 8. Check Root Prowler (Acechador de Raíces) collision in Black Willow Forest
      if (!collided && this.dungeonAreaManager.currentArea === 'black_willow_forest' && !this.rootProwlerEncounter.isDefeated) {
        const dProwler = p.mesh.position.distanceTo(this.rootProwlerGroup.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
        if (dProwler <= 1.8) {
          collided = true;
          if (p.isThrownFlask) {
            this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
          } else {
            const isFire = p.arrowType === 'fire';
            const hitRes = this.rootProwlerEncounter.takeDamage(p.damage, isFire);
            const label = isFire ? '¡VULNERABILIDAD FUEGO (+50%)!' : p.arrowType === 'silver' ? 'FLECHA DE PLATA' : 'FLECHA ABISAL';
            this.spawnFloatingText(this.rootProwlerGroup.position, `-${hitRes.actualDamage} (${label})`, isFire ? '#ff7722' : p.isHeavy ? '#ffd700' : '#bb44ff');
            this.audio.playCombatHit(p.isHeavy || isFire);

            if (isFire) {
              this.activeBurnEffects.push({ targetId: 'root_prowler', ticksLeft: 6, dmgPerTick: 6, timer: 0.5 });
              this.spawnFloatingText(this.rootProwlerGroup.position, '🔥 ¡RAÍCES EN LLAMAS!', '#ff7722');
            }

            if (p.isHeavy || isFire) {
              this.rootProwlerEncounter.setState('STUNNED');
              this.rootProwlerTimer = 1.4;
              this.spawnFloatingText(this.rootProwlerGroup.position, '⚡ ¡ATURDIDO! [E] ¡REMATAR!', '#ffaa44');
            }

            if (this.rootProwlerHpBarFill) {
              this.rootProwlerHpBarFill.style.width = `${Math.max(0, (this.rootProwlerEncounter.health / this.rootProwlerEncounter.maxHealth) * 100)}%`;
            }

            if (hitRes.defeated) {
              this.handleRootProwlerDefeat();
            }
            this.updateHUD();
          }
        }
      }

      // 8b. Check Act II Boss: Crucible Guardian collision
      if (!collided && this.dungeonAreaManager.currentArea === 'belltower_summit' && !this.crucibleGuardianEncounter.isDefeated) {
        const dGuard = p.mesh.position.distanceTo(this.crucibleGuardianGroup.position.clone().add(new THREE.Vector3(0, 1.3, 0)));
        if (dGuard <= 1.9) {
          collided = true;
          if (p.isThrownFlask) {
            this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
          } else {
            const isVulnerable = this.crucibleGuardianEncounter.state === 'STUNNED';
            const hitRes = this.crucibleGuardianEncounter.takeDamage(p.damage, isVulnerable);
            const label = p.arrowType === 'silver' ? 'FLECHA DE PLATA' : p.arrowType === 'fire' ? 'FLECHA DE FUEGO' : 'FLECHA ABISAL';
            this.spawnFloatingText(this.crucibleGuardianGroup.position, `-${hitRes.actualDamage} (${label})`, p.isHeavy ? '#ffd700' : '#ff7722');
            this.audio.playCombatHit(p.isHeavy);
            if (p.arrowType === 'fire') {
              this.activeBurnEffects.push({ targetId: 'crucible_guardian', ticksLeft: 6, dmgPerTick: 5, timer: 0.5 });
            }
            if (p.isHeavy || p.arrowType === 'silver') {
              this.crucibleGuardianEncounter.setState('STUNNED');
              this.crucibleTimer = 1.4;
              this.spawnFloatingText(this.crucibleGuardianGroup.position, '⚡ ¡ATURDIDO! [E] ¡REMATAR!', '#ffaa44');
            }
            if (hitRes.defeated) this.handleCrucibleGuardianDefeat();
            this.updateHUD();
          }
        }
      }

      // 8c. Check Act III Boss: Captain Áureo Vane collision
      if (!collided && this.dungeonAreaManager.currentArea === 'great_stone_bridge' && !this.captainVaneEncounter.isDefeated) {
        const dVane = p.mesh.position.distanceTo(this.captainVaneGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
        if (dVane <= 1.9) {
          collided = true;
          if (p.isThrownFlask) {
            this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
          } else {
            const isSilver = p.arrowType === 'silver';
            const toVane = this.captainVaneGroup.position.clone().sub(p.mesh.position).normalize();
            const vaneFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(this.captainVaneGroup.quaternion);
            const isFrontal = toVane.dot(vaneFwd) < -0.2;

            if (isSilver && this.captainVaneEncounter.shieldRaised) {
              this.captainVaneEncounter.breakShield();
              this.vaneTimer = 1.8;
              this.audio.playSfx('shield_break');
              if (this.vaneShieldMesh) this.vaneShieldMesh.rotation.x = 1.1;
              this.spawnFloatingText(this.captainVaneGroup.position, '💥 ¡PLATA QUIEBRA EL ESCUDO DE TORRE!', '#66ccff');
            }

            const hitRes = this.captainVaneEncounter.takeDamage(p.damage, isFrontal, isSilver || p.isHeavy);
            if (hitRes.blocked) {
              this.spawnFloatingText(this.captainVaneGroup.position, `-${hitRes.actualDamage} (¡BLOQUEADO! USA FLECHA DE PLATA)`, '#ffd700');
              this.audio.playShieldCrush();
            } else {
              const label = isSilver ? '¡ANTI-ESCUDO PLATA!' : p.arrowType === 'fire' ? 'FLECHA DE FUEGO' : 'FLECHA ABISAL';
              this.spawnFloatingText(this.captainVaneGroup.position, `-${hitRes.actualDamage} (${label})`, isSilver ? '#66ccff' : '#ffd700');
              this.audio.playCombatHit(p.isHeavy || isSilver);
              if (p.arrowType === 'fire') {
                this.activeBurnEffects.push({ targetId: 'captain_vane', ticksLeft: 6, dmgPerTick: 5, timer: 0.5 });
              }
            }
            if (hitRes.defeated) this.handleCaptainVaneDefeat();
            this.updateHUD();
          }
        }
      }

      // 8d. Check Act IV Boss: Rex Malphas collision
      if (!collided && this.dungeonAreaManager.currentArea === 'londinium_citadel' && !this.rexMalphasEncounter.isDefeated) {
        const dMalphas = p.mesh.position.distanceTo(this.rexMalphasGroup.position.clone().add(new THREE.Vector3(0, 1.3, 0)));
        if (dMalphas <= 1.9) {
          collided = true;
          if (p.isThrownFlask) {
            this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
          } else {
            const hitRes = this.rexMalphasEncounter.takeDamage(p.damage);
            const label = p.arrowType === 'silver' ? 'FLECHA DE PLATA' : p.arrowType === 'fire' ? 'FLECHA DE FUEGO' : 'FLECHA ABISAL';
            this.spawnFloatingText(this.rexMalphasGroup.position, `-${hitRes.actualDamage} (${label})`, '#cc44ff');
            this.audio.playCombatHit(p.isHeavy);
            if (p.arrowType === 'fire') {
              this.activeBurnEffects.push({ targetId: 'rex_malphas', ticksLeft: 6, dmgPerTick: 6, timer: 0.5 });
            }
            if (hitRes.transitionedToPhase2) {
              this.triggerRexMalphasPhase2();
            } else if (hitRes.defeated) {
              this.handleRexMalphasDefeat();
            }
            this.updateHUD();
          }
        }
      }

      // 8e. Check Act V Final Titan: Astaroth collision (horizontal cylinder hitbox under floating Black Sun)
      if (!collided && this.dungeonAreaManager.currentArea === 'inverted_cathedral' && !this.astarothEncounter.isDefeated) {
        const dAstarothHoriz = new THREE.Vector2(
          p.mesh.position.x - this.astarothGroup.position.x,
          p.mesh.position.z - this.astarothGroup.position.z
        ).length();
        if (dAstarothHoriz <= 3.0) {
          collided = true;
          if (p.isThrownFlask) {
            this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
          } else {
            const empower = this.hasForgedAlbaGris || p.arrowType === 'silver';
            const hitRes = this.astarothEncounter.takeDamage(p.damage, empower);
            const label = empower ? '¡CRÍTICO LUZ/PLATA x2!' : p.arrowType === 'fire' ? 'FLECHA DE FUEGO' : 'FLECHA ABISAL';
            this.spawnFloatingText(this.astarothGroup.position, `-${hitRes.actualDamage} (${label})`, empower ? '#88eeff' : '#ff2288');
            this.audio.playCombatHit(p.isHeavy || empower);
            if (p.arrowType === 'fire') {
              this.activeBurnEffects.push({ targetId: 'astaroth', ticksLeft: 6, dmgPerTick: 8, timer: 0.5 });
            }
            if (hitRes.defeated) this.handleAstarothDefeat();
            this.updateHUD();
          }
        }
      }

      // 9. Check Destructibles collision
      if (!collided) {
        for (const prop of this.destructibles) {
          if (!prop.isDestroyed) {
            const dProp = p.mesh.position.distanceTo(prop.position);
            if (dProp <= prop.radius + 0.3) {
              collided = true;
              if (p.isThrownFlask) {
                this.explodeHolyFireFlask(p.mesh.position.clone(), p.damage);
              } else {
                this.destroyProp(prop);
              }
              break;
            }
          }
        }
      }

      // Cleanup
      if (collided || p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private awardEnemyKillRewards(enemyType: 'hound' | 'cultist' | 'zealot' | 'skeleton' | 'inquisitor' | 'crypt_ambush', isFinisher: boolean = false): void {
    if (enemyType === 'hound') {
      const exp = isFinisher ? 75 : 40;
      this.progression.addExp(exp);
      this.inventory.addItem(CANONICAL_MATERIALS.blood_hound, 1);
      this.spawnFloatingText(this.playerGroup.position, '🔥 +1 Esencia de Fuego Fatuo obtenida', '#ffaa44');
    } else if (enemyType === 'cultist') {
      const exp = isFinisher ? 100 : 60;
      this.progression.addExp(exp);
      this.inventory.addItem(CANONICAL_MATERIALS.herb_silverleaf, 2);
      this.inventory.addItem(CANONICAL_MATERIALS.ash_purified, 1);
      this.spawnFloatingText(this.playerGroup.position, '🍃 +2 Hoja de Plata | ✨ +1 Ceniza Purificada', '#2ecc71');
    } else if (enemyType === 'zealot') {
      const exp = isFinisher ? 150 : 80;
      this.progression.addExp(exp);
      this.inventory.addItem(CANONICAL_MATERIALS.salve_base, 1);
      this.inventory.addItem(CANONICAL_MATERIALS.ash_purified, 2);
      this.spawnFloatingText(this.playerGroup.position, '🍯 +1 Ungüento Base | ✨ +2 Ceniza Purificada', '#ffd7aa');
    } else if (enemyType === 'skeleton') {
      const exp = isFinisher ? 180 : 100;
      this.progression.addExp(exp);
      this.inventory.addItem(CANONICAL_MATERIALS.water_blessed, 1);
      this.inventory.addItem(CANONICAL_MATERIALS.ash_purified, 1);
      this.spawnFloatingText(this.playerGroup.position, '💧 +1 Agua Bendita | ✨ +1 Ceniza Purificada', '#66ccff');
    } else if (enemyType === 'crypt_ambush') {
      const exp = isFinisher ? 140 : 80;
      this.progression.addExp(exp);
      this.inventory.addItem(CANONICAL_MATERIALS.water_blessed, 1);
      this.spawnFloatingText(this.playerGroup.position, '💧 +1 Agua Bendita obtenida', '#66ccff');
    } else if (enemyType === 'inquisitor') {
      this.spawnFloatingText(this.playerGroup.position, '👑 +2 Agua Bendita | +2 Ceniza Purificada | +Sello de Inquisición', '#ffd700');
    }
  }

  private destroyProp(prop: DestructibleProp3D): void {
    prop.isDestroyed = true;
    this.scene.remove(prop.mesh);
    this.audio.playWoodBreak();
    this.createDebrisExplosion(prop.position);
    this.progression.addExp(15);
    this.spawnFloatingText(prop.position, `+15 EXP (${prop.name})`, '#ffd700');

    // 45% chance to drop crafting herb or salve base
    const roll = Math.random();
    if (roll < 0.45) {
      const mat = roll < 0.25 ? CANONICAL_MATERIALS.herb_silverleaf : CANONICAL_MATERIALS.salve_base;
      this.inventory.addItem(mat, 1);
      this.spawnFloatingText(prop.position.clone().add(new THREE.Vector3(0, 0.5, 0)), `🎒 +1 ${mat.name}`, '#2ecc71');
    }

    this.updateHUD();
  }

  private createDebrisExplosion(pos: THREE.Vector3): void {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3219, roughness: 0.9 });
    const count = 7;

    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.12 + Math.random() * 0.08, 0.12 + Math.random() * 0.08, 0.12 + Math.random() * 0.08);
      const mesh = new THREE.Mesh(geo, woodMat);
      mesh.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.3 + Math.random() * 0.3, (Math.random() - 0.5) * 0.4));
      mesh.castShadow = true;
      this.scene.add(mesh);

      this.debrisParticles.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 3.5, 3.2 + Math.random() * 2.5, (Math.random() - 0.5) * 3.5),
        rotSpeed: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
        life: 1.2,
        maxLife: 1.2
      });
    }
  }

  private updateDebris(delta: number): void {
    for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
      const d = this.debrisParticles[i];
      d.life -= delta;
      d.velocity.y -= 13.0 * delta; // Gravity
      d.mesh.position.addScaledVector(d.velocity, delta);

      d.mesh.rotation.x += d.rotSpeed.x * delta;
      d.mesh.rotation.y += d.rotSpeed.y * delta;

      // Floor bounce
      if (d.mesh.position.y < 0.08) {
        d.mesh.position.y = 0.08;
        d.velocity.y *= -0.4;
        d.velocity.x *= 0.7;
        d.velocity.z *= 0.7;
      }

      if (d.life <= 0) {
        this.scene.remove(d.mesh);
        this.debrisParticles.splice(i, 1);
      }
    }
  }

  private executeDodge(): void {
    if (this.playerStats.isDodging || this.dodgeTimer > 0) return;

    this.playerStats.isDodging = true;
    this.dodgeTimer = 0.55;
    this.audio.playSfx('dodge');

    // Propel player in forward direction (with Shadow Step boost if unlocked for Khaterine)
    const isShadowStep = this.activeHero === 'khaterine' && this.progression.isSkillUnlocked('khaterine_shadow_step');
    const speed = isShadowStep ? 9.5 * 1.3 : 9.5;

    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.playerGroup.rotation);
    this.playerVelocity.copy(forward.multiplyScalar(speed));

    this.spawnFloatingText(this.playerGroup.position, isShadowStep ? '¡PASO ESPECTRAL (+30%)!' : '¡ESQUIVADO!', '#88ffaa');

    setTimeout(() => {
      this.playerStats.isDodging = false;
    }, 280);
  }

  private executeThrowWeapon(): void {
    if (this.activeHero === 'thomas') {
      const flaskRes = this.arsenalManager.throwHolyFireFlask(this.inventory);
      if (flaskRes.success) {
        this.throwHolyFireFlaskProjectile(flaskRes.damage);
        this.updateHUD();
        return;
      }
    }

    if (!this.playerStats.isArmed) return;

    this.playerStats.isArmed = false;
    this.playerSwordMesh.visible = false;
    this.playerFistsGroup.visible = true;
    this.audio.playSfx('dodge');

    // Create Dropped Sword in World (clamped to current zone bounds)
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.playerGroup.rotation);
    const dropPos = this.playerGroup.position.clone().add(forward.multiplyScalar(4.5));
    const bounds = this.dungeonAreaManager.getBounds();
    dropPos.x = THREE.MathUtils.clamp(dropPos.x, bounds.minX + 0.4, bounds.maxX - 0.4);
    dropPos.z = THREE.MathUtils.clamp(dropPos.z, bounds.minZ + 0.5, bounds.maxZ - 0.5);
    dropPos.y = 0.45;

    this.droppedSwordGroup = new THREE.Group();
    this.droppedSwordGroup.position.copy(dropPos);

    // Stuck Sword geometry
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe6e0f8, metalness: 0.9, roughness: 0.2 });
    const swordModel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 0.04), bladeMat);
    swordModel.rotation.set(-0.35, 0.2, 0);
    this.droppedSwordGroup.add(swordModel);

    // Glowing beacon column
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.15, 3.5, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.45 })
    );
    beacon.position.y = 1.75;
    this.droppedSwordGroup.add(beacon);

    this.droppedSwordLight = new THREE.PointLight(0xffd700, 2.0, 5);
    this.droppedSwordLight.position.set(0, 1.2, 0);
    this.droppedSwordGroup.add(this.droppedSwordLight);

    this.scene.add(this.droppedSwordGroup);

    this.spawnFloatingText(this.playerGroup.position, '¡DESARMADO! [E] para recuperar', '#ffaa44');
    this.updateHUD();
  }

  private executeWeaponPickup(): void {
    if (this.playerStats.isArmed || !this.droppedSwordGroup) return;

    const dist = this.playerGroup.position.distanceTo(this.droppedSwordGroup.position);
    if (dist <= 2.8) {
      this.scene.remove(this.droppedSwordGroup);
      this.droppedSwordGroup = undefined;
      this.droppedSwordLight = undefined;

      this.playerStats.isArmed = true;
      this.playerSwordMesh.visible = true;
      this.playerFistsGroup.visible = false;
      this.audio.playSfx('menu_select');

      this.spawnFloatingText(this.playerGroup.position, '¡ESPADA RECUPERADA!', '#ffd700');
      this.updateHUD();
    }
  }

  public cycleKhaterineArrow(): void {
    if (this.activeHero !== 'khaterine') return;
    const newType = this.arsenalManager.cycleNextArrow();
    this.audio.playArrowSwitch?.();
    const nameMap: Record<ArrowType, string> = {
      abyssal: 'Flechas Abisales (Estándar)',
      fire: 'Flechas de Fuego Fatuo (Quemadura DoT)',
      silver: 'Flechas de Plata Consagrada (Aturdimiento & Anti-Escudo)'
    };
    this.spawnFloatingText(this.playerGroup.position, `🏹 ${nameMap[newType]}`, '#ffd700');
    this.updateHUD();
  }

  public selectKhaterineArrow(type: ArrowType): void {
    if (this.activeHero !== 'khaterine') return;
    this.arsenalManager.setSelectedArrowType(type);
    this.audio.playArrowSwitch?.();
    const nameMap: Record<ArrowType, string> = {
      abyssal: 'Flechas Abisales (Estándar)',
      fire: 'Flechas de Fuego Fatuo (Quemadura DoT)',
      silver: 'Flechas de Plata Consagrada (Aturdimiento & Anti-Escudo)'
    };
    this.spawnFloatingText(this.playerGroup.position, `🏹 ${nameMap[type]}`, '#ffd700');
    this.updateHUD();
  }

  private throwHolyFireFlaskProjectile(damage: number): void {
    this.audio.playSfx('dodge');
    this.spawnFloatingText(this.playerGroup.position, '🏺 ¡FRASCO DE FUEGO FATUO!', '#ff7722');

    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.playerGroup.rotation).normalize();
    const spawnPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, 1.3, 0)).add(forward.clone().multiplyScalar(0.5));

    const flaskGroup = new THREE.Group();
    flaskGroup.position.copy(spawnPos);

    // Flask bottle geometry
    const bottleGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.35, 8);
    const bottleMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const bottleMesh = new THREE.Mesh(bottleGeo, bottleMat);
    flaskGroup.add(bottleMesh);

    // Flask neck
    const neckGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.14, 8);
    const neckMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const neckMesh = new THREE.Mesh(neckGeo, neckMat);
    neckMesh.position.y = 0.22;
    flaskGroup.add(neckMesh);

    const flaskLight = new THREE.PointLight(0xff6600, 3.0, 6);
    flaskGroup.add(flaskLight);

    this.scene.add(flaskGroup);

    this.projectiles.push({
      mesh: flaskGroup,
      light: flaskLight,
      velocity: forward.clone().multiplyScalar(12.5).add(new THREE.Vector3(0, 5.0, 0)),
      life: 2.5,
      maxLife: 2.5,
      damage,
      isHeavy: true,
      isThrownFlask: true
    });
  }

  private explodeHolyFireFlask(pos: THREE.Vector3, dmg: number): void {
    // 1. Audio and Camera Post-FX
    this.audio.playFlaskExplosion?.();
    this.triggerScreenShake(0.65);
    this.triggerHolyFlash(0.45);

    // 2. Visual explosion mesh
    const explosionGeo = new THREE.SphereGeometry(1.4, 12, 12);
    const explosionMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.85
    });
    const explosionMesh = new THREE.Mesh(explosionGeo, explosionMat);
    explosionMesh.position.copy(pos);
    this.scene.add(explosionMesh);

    const shockLight = new THREE.PointLight(0xff7700, 6.0, 10);
    shockLight.position.copy(pos);
    this.scene.add(shockLight);

    // Expanding explosion animation
    let expTimer = 0;
    const animateExp = () => {
      expTimer += 0.04;
      const s = 1.0 + expTimer * 4.5;
      explosionMesh.scale.set(s, s, s);
      explosionMat.opacity = Math.max(0, 0.85 - expTimer * 2.2);
      shockLight.intensity = Math.max(0, 6.0 - expTimer * 14);

      if (expTimer < 0.4) {
        requestAnimationFrame(animateExp);
      } else {
        this.scene.remove(explosionMesh);
        this.scene.remove(shockLight);
      }
    };
    requestAnimationFrame(animateExp);

    this.spawnFloatingText(pos, '💥 ¡ESTALLIDO SAGRADO!', '#ffcc00');

    // 3. Radial Blast AoE (3.8m radius)
    const radius = 3.8;

    // Check hound
    if (this.enemyState !== 'DEAD' && pos.distanceTo(this.enemyGroup.position) <= radius) {
      this.enemyHealth = Math.max(0, this.enemyHealth - dmg);
      this.spawnFloatingText(this.enemyGroup.position, `-${dmg} (FRASCO FATUO)`, '#ff5500');
      this.activeBurnEffects.push({ targetId: 'hound', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
      this.enemyState = 'STUNNED';
      this.enemyTimer = 1.2;
      if (this.enemyHealth <= 0) {
        this.enemyState = 'DEAD';
        this.spawnFloatingText(this.enemyGroup.position, '¡PURIFICADO POR FUEGO! (+40 EXP)', '#ffd700');
        this.audio.playFinisherSound(true);
        this.enemyGroup.position.y = -0.3;
        this.awardEnemyKillRewards('hound', false);
      }
    }

    // Check cultist
    if (this.cultistState !== 'DEAD' && pos.distanceTo(this.cultistGroup.position) <= radius) {
      this.cultistHealth = Math.max(0, this.cultistHealth - dmg);
      this.spawnFloatingText(this.cultistGroup.position, `-${dmg} (FRASCO FATUO)`, '#ff5500');
      this.activeBurnEffects.push({ targetId: 'cultist', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
      this.cultistState = 'STUNNED';
      this.cultistTimer = 1.2;
      if (this.cultistHealth <= 0) {
        this.cultistState = 'DEAD';
        this.spawnFloatingText(this.cultistGroup.position, '¡CULTISTA PURIFICADO! (+60 EXP)', '#ffd700');
        this.audio.playFinisherSound(true);
        this.cultistGroup.position.y = -0.3;
        this.cultistCenserLight.intensity = 0;
        this.awardEnemyKillRewards('cultist', false);
      }
    }

    // Check zealot
    if (this.zealotState !== 'DEAD' && pos.distanceTo(this.zealotGroup.position) <= radius) {
      this.zealotHealth = Math.max(0, this.zealotHealth - dmg);
      this.spawnFloatingText(this.zealotGroup.position, `-${dmg} (FRASCO FATUO)`, '#ff5500');
      this.activeBurnEffects.push({ targetId: 'zealot', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
      this.zealotState = 'STUNNED';
      this.zealotTimer = 1.2;
      if (this.zealotHealth <= 0) {
        this.zealotState = 'DEAD';
        this.spawnFloatingText(this.zealotGroup.position, '¡FLAGELANTE PURIFICADO! (+80 EXP)', '#ffd700');
        this.audio.playFinisherSound(true);
        this.zealotGroup.position.y = -0.3;
        this.awardEnemyKillRewards('zealot', false);
      }
    }

    // Check skeleton
    if (this.skeletonState !== 'DEAD' && pos.distanceTo(this.skeletonGroup.position) <= radius) {
      this.skeletonHealth = Math.max(0, this.skeletonHealth - dmg);
      this.spawnFloatingText(this.skeletonGroup.position, `-${dmg} (FRASCO FATUO)`, '#ff5500');
      this.activeBurnEffects.push({ targetId: 'skeleton', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
      this.skeletonState = 'STUNNED';
      this.skeletonTimer = 1.4;
      if (this.skeletonHealth <= 0) {
        this.skeletonState = 'DEAD';
        this.spawnFloatingText(this.skeletonGroup.position, '¡PENITENTE CALCINADO! (+100 EXP)', '#00e5ff');
        this.audio.playFinisherSound(true);
        this.skeletonGroup.position.y = -0.3;
        this.awardEnemyKillRewards('skeleton', false);
      }
    }

    // Check Morwenna
    if (this.morwennaState !== 'DORMANT' && this.morwennaState !== 'DEAD' && pos.distanceTo(this.morwennaGroup.position) <= radius) {
      const mResult = this.morwennaEncounter.takeDamage(dmg);
      this.morwennaHealth = mResult.currentHealth;
      this.spawnFloatingText(this.morwennaGroup.position, `-${dmg} (FRASCO FATUO)`, '#ff5500');
      this.activeBurnEffects.push({ targetId: 'morwenna', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
      if (mResult.transitionedToPhase2) {
        this.triggerMorwennaPhase2();
      } else if (mResult.defeated) {
        this.handleMorwennaDefeat();
      }
    }

    // Check Inquisitor
    if (this.dungeonAreaManager.currentArea === 'crypts_interior' && !this.inquisitorEncounter.isDefeated && pos.distanceTo(this.inquisitorGroup.position) <= radius) {
      const hitRes = this.inquisitorEncounter.takeDamage(dmg, false);
      this.spawnFloatingText(this.inquisitorGroup.position, `-${hitRes.actualDamage} (FRASCO FATUO)`, '#ff5500');
      this.activeBurnEffects.push({ targetId: 'inquisitor', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
      if (this.inquisitorHpBarFill) {
        this.inquisitorHpBarFill.style.width = `${Math.max(0, (this.inquisitorEncounter.health / this.inquisitorEncounter.maxHealth) * 100)}%`;
      }
      if (hitRes.defeated) {
        this.handleInquisitorDefeat();
      }
    }

    // Check Crypt Ambush Skeleton
    if (this.dungeonAreaManager.currentArea === 'crypts_interior' && this.cryptAmbushAwakened && !this.cryptAmbushDead && pos.distanceTo(this.cryptAmbushSkeletonGroup.position) <= radius) {
      this.cryptAmbushHp = Math.max(0, this.cryptAmbushHp - dmg);
      this.spawnFloatingText(this.cryptAmbushSkeletonGroup.position, `-${dmg} (FRASCO FATUO)`, '#ff5500');
      this.activeBurnEffects.push({ targetId: 'crypt_ambush', ticksLeft: 6, dmgPerTick: 4, timer: 0.5 });
      if (this.cryptAmbushHp <= 0) {
        this.cryptAmbushDead = true;
        this.cryptAmbushSkeletonGroup.position.y = -0.3;
        this.spawnFloatingText(this.cryptAmbushSkeletonGroup.position, '¡PENITENTE PURIFICADO! (+80 EXP)', '#00e5ff');
        this.awardEnemyKillRewards('crypt_ambush', false);
      }
    }

    // Check Root Prowler (Acechador de Raíces) in Black Willow Forest
    if (this.dungeonAreaManager.currentArea === 'black_willow_forest' && !this.rootProwlerEncounter.isDefeated && pos.distanceTo(this.rootProwlerGroup.position) <= radius) {
      const hitRes = this.rootProwlerEncounter.takeDamage(dmg, true); // Fire triggers 1.5x vulnerability
      this.spawnFloatingText(this.rootProwlerGroup.position, `-${hitRes.actualDamage} 🔥 ¡VULNERABLE AL FUEGO!`, '#ff5500');
      this.activeBurnEffects.push({ targetId: 'root_prowler', ticksLeft: 6, dmgPerTick: 6, timer: 0.5 });
      this.rootProwlerEncounter.setState('STUNNED');
      this.rootProwlerTimer = 1.5;
      if (this.rootProwlerHpBarFill) {
        this.rootProwlerHpBarFill.style.width = `${Math.max(0, (this.rootProwlerEncounter.health / this.rootProwlerEncounter.maxHealth) * 100)}%`;
      }
      if (hitRes.defeated) {
        this.handleRootProwlerDefeat();
      }
    }

    // Check Act II - V Canonical Bosses for Holy Fire Flask splash
    if (this.dungeonAreaManager.currentArea === 'belltower_summit' && !this.crucibleGuardianEncounter.isDefeated && pos.distanceTo(this.crucibleGuardianGroup.position) <= radius + 0.5) {
      const hitRes = this.crucibleGuardianEncounter.takeDamage(dmg, this.crucibleGuardianEncounter.state === 'STUNNED');
      this.spawnFloatingText(this.crucibleGuardianGroup.position, `-${hitRes.actualDamage} (FRASCO FATUO)`, '#ff5500');
      this.activeBurnEffects.push({ targetId: 'crucible_guardian', ticksLeft: 6, dmgPerTick: 5, timer: 0.5 });
      if (hitRes.defeated) this.handleCrucibleGuardianDefeat();
    }

    if (this.dungeonAreaManager.currentArea === 'great_stone_bridge' && !this.captainVaneEncounter.isDefeated && pos.distanceTo(this.captainVaneGroup.position) <= radius + 0.5) {
      const hitRes = this.captainVaneEncounter.takeDamage(dmg, false, true);
      this.spawnFloatingText(this.captainVaneGroup.position, `-${hitRes.actualDamage} (FRASCO FATUO)`, '#ff5500');
      this.activeBurnEffects.push({ targetId: 'captain_vane', ticksLeft: 6, dmgPerTick: 5, timer: 0.5 });
      if (hitRes.defeated) this.handleCaptainVaneDefeat();
    }

    if (this.dungeonAreaManager.currentArea === 'londinium_citadel' && !this.rexMalphasEncounter.isDefeated && pos.distanceTo(this.rexMalphasGroup.position) <= radius + 0.5) {
      const hitRes = this.rexMalphasEncounter.takeDamage(dmg);
      this.spawnFloatingText(this.rexMalphasGroup.position, `-${hitRes.actualDamage} (FRASCO FATUO)`, '#ff5500');
      this.activeBurnEffects.push({ targetId: 'rex_malphas', ticksLeft: 6, dmgPerTick: 6, timer: 0.5 });
      if (hitRes.transitionedToPhase2) this.triggerRexMalphasPhase2();
      else if (hitRes.defeated) this.handleRexMalphasDefeat();
    }

    if (this.dungeonAreaManager.currentArea === 'inverted_cathedral' && !this.astarothEncounter.isDefeated) {
      const dHoriz = new THREE.Vector2(pos.x - this.astarothGroup.position.x, pos.z - this.astarothGroup.position.z).length();
      if (dHoriz <= radius + 1.8) {
        const hitRes = this.astarothEncounter.takeDamage(dmg, this.hasForgedAlbaGris);
        this.spawnFloatingText(this.astarothGroup.position, `-${hitRes.actualDamage} (FRASCO FATUO)`, '#ff5500');
        this.activeBurnEffects.push({ targetId: 'astaroth', ticksLeft: 6, dmgPerTick: 8, timer: 0.5 });
        if (hitRes.defeated) this.handleAstarothDefeat();
      }
    }

    // Check Destructibles
    for (const prop of this.destructibles) {
      if (!prop.isDestroyed && pos.distanceTo(prop.position) <= radius + 0.5) {
        this.destroyProp(prop);
      }
    }

    this.updateHUD();
  }

  // =========================================================================
  // 3D PROXIMITY INTERACTIONS & DIALOGUE SYSTEM
  // =========================================================================
  public handleContextInteraction(): void {
    if (this.isCompendiumOpen) return;
    if (this.isDialogueOpen) {
      this.closeDialogueModal();
      return;
    }

    if (!this.activeInteractTarget) return;

    switch (this.activeInteractTarget) {
      case 'finisher':
        this.executeFinisher3D();
        break;
      case 'sword':
        this.executeWeaponPickup();
        break;
      case 'cauldron':
        this.toggleAlchemyModal();
        break;
      case 'elowen':
        this.interactWithElowen();
        break;
      case 'cedric':
        this.interactWithCedric();
        break;
      case 'shalem':
        this.interactWithShalem();
        break;
      case 'khaterine':
        this.interactWithKhaterine();
        break;
      case 'thomas':
        this.interactWithThomas();
        break;
      case 'cemetery_gate':
        this.interactWithCemeteryGate();
        break;
      case 'crypt_entrance':
        this.transitionToArea('crypts_interior');
        break;
      case 'crypt_exit':
        this.transitionToArea('surface');
        break;
      case 'crypt_sarcophagus_loot':
        this.interactWithLootSarcophagus();
        break;
      case 'crypt_sarcophagus_ambush':
        this.interactWithAmbushSarcophagus();
        break;
      case 'crypt_to_forest':
        this.transitionToArea('black_willow_forest');
        break;
      case 'forest_to_crypt':
        this.transitionToArea('crypts_interior');
        break;
      case 'sister_altar':
        this.interactWithSisterAltar();
        break;
      case 'forest_to_belltower':
        this.transitionToArea('belltower_summit');
        break;
      case 'belltower_to_forest':
        this.transitionToArea('black_willow_forest');
        break;
      case 'elowen_cell':
        this.interactWithElowenCell();
        break;
      case 'crucible_furnace':
        this.interactWithCrucibleFurnace();
        break;
      case 'belltower_to_bridge':
        this.transitionToArea('great_stone_bridge');
        break;
      case 'refugees_cart':
        this.interactWithRefugeesCart();
        break;
      case 'vane_gate':
        this.interactWithVaneGate();
        break;
      case 'mirror_gallery':
        this.interactWithMirrorGallery();
        break;
      case 'astral_throne':
        this.interactWithAstralThrone();
        break;
      case 'dawn_grey_altar':
        this.interactWithDawnGreyAltar();
        break;
      case 'black_sun_core':
        this.interactWithBlackSunCore();
        break;
    }
  }

  public interactWithElowenCell(): void {
    this.audio.playBellToll?.();
    if (!this.hasCollectedWillowBird) {
      this.hasCollectedWillowBird = true;
      if (this.willowBirdMesh) this.willowBirdMesh.visible = false;
      this.progression.addExp(50);
      this.canonChapterManager.unlockChapter(7);
      this.inventory.addItem({
        id: 'item_willow_bird',
        name: 'Pájaro de Madera de Sauce',
        description: 'Talla de madera de sauce dejada por Elowen con un mensaje en lino desde su celda de sal en el Campanario del Sur.',
        category: 'relic',
        icon: '🕊️',
        quantity: 1,
        maxQuantity: 1,
        effectType: 'relic_parry_window',
        effectValue: 30,
        isEquipped: false
      });
      this.spawnFloatingText(this.playerGroup.position, '🕊️ ¡PÁJARO DE SAUCE RECOGIDO! (+50 EXP)', '#ffd700');
      this.showDialogueModal(
        '🔔 CELDA DE SAL DE ELOWEN — CAPÍTULO VII 🔔',
        '«El suelo de la jaula circular está cubierto de sal gruesa y cristales de azufre que abrasaron los pies descalzos de Elowen. Entre los barrotes de hierro descubres su pájaro tallado en madera de sauce con una tira de lino atada a las alas: "Thomas, buscan extinguir la última gota de luz en el Gran Crisol. No temas a la oscuridad de tu sangre."»',
        '✦ RECOMPENSA: PÁJARO DE MADERA DE SAUCE & +50 EXP (CAPÍTULO VII DESBLOQUEADO) ✦'
      );
      this.updateHUD();
    } else {
      this.showDialogueModal(
        '🔔 CELDA DE SAL DEL CAMPANARIO 🔔',
        '«La celda de sal yace vacía bajo las vigas quemadas. El mensaje de Elowen sigue vivo en tu memoria.»',
        '✦ CAPÍTULO VII REGISTRADO EN EL COMPENDIO [N] ✦'
      );
    }
  }

  public interactWithCrucibleFurnace(): void {
    if (!this.crucibleGuardianEncounter.isDefeated) {
      this.audio.playSfx('warning');
      this.showDialogueModal(
        '🔥 EL GRAN CRISOL DE BRONCE 🔥',
        '«El horno de fundición ruge con escoria incandescente. El Guardián del Crisol vigila cada paso; derrótalo primero para abrir la marcha hacia el Gran Puente de Piedra.»',
        '⚠ DERROTA AL GUARDIÁN DEL CRISOL PARA ABRIR EL ACTO III ⚠'
      );
      return;
    }
    this.showDialogueModal(
      '🔥 EL GRAN CRISOL PURIFICADO 🔥',
      '«Las llamas profanas del crisol se extinguen tras la caída del Guardián. El camino desciende desde el Campanario del Sur hacia la calzada fluvial del Gran Puente de Piedra.»',
      '✦ ACTO III DESBLOQUEADO — AVANZA AL SUR DEL CRISOL O USA EL COMPENDIO [N] ✦'
    );
    this.canonChapterManager.unlockChapter(10);
  }

  public interactWithRefugeesCart(): void {
    this.audio.playCryptDoor?.();
    if (!this.hasFreedRefugees) {
      this.hasFreedRefugees = true;
      this.progression.addExp(75);
      this.inventory.addItem(CANONICAL_MATERIALS.ash_purified, 2);
      this.inventory.addItem(CANONICAL_MATERIALS.water_blessed, 2);
      this.canonChapterManager.unlockChapter(11);
      this.spawnFloatingText(this.playerGroup.position, '🗝️ ¡MARTÍN Y TOBÍAS LIBERADOS! (+75 EXP)', '#ffd700');
      this.showDialogueModal(
        '🗝️ CONVOY DE PRISIONEROS — MARTÍN Y TOBÍAS (CAPÍTULO XI) 🗝️',
        '«Rompes los cerrojos de hierro de la carreta enrejada. Martín el armero y Tobías el leñador emergen agradecidos de entre las cadenas: "¡Bendito seas, Thomas! El Capitán Áureo Vane lleva el edicto del rey Alaric y un escudo de torre impenetrable por el frente. Usa ataques pesados [K] o flechas de plata para quebrar su guardia!"»',
        '✦ RECOMPENSA: +75 EXP • +2 AGUA BENDITA • +2 CENIZA PURIFICADA ✦'
      );
      this.updateHUD();
    } else {
      this.showDialogueModal(
        '🗝️ CARRETA DE PRISIONEROS LIBERADA 🗝️',
        '«Martín y Tobías ya han partido a resguardo hacia Oakhaven. Solo queda derrotar al Capitán Áureo Vane para abrir el camino a Londinium.»',
        '✦ CAPÍTULO XI COMPLETADO ✦'
      );
    }
  }

  public interactWithVaneGate(): void {
    if (!this.captainVaneEncounter.isDefeated) {
      this.audio.playShieldCrush();
      this.spawnFloatingText(this.playerGroup.position, '🛡️ ¡El Capitán Vane bloquea el acceso a Londinium!', '#ffd700');
      return;
    }
    this.canonChapterManager.unlockChapter(14);
    this.transitionToArea('londinium_citadel');
  }

  public interactWithMirrorGallery(): void {
    this.audio.playGlassShatter?.();
    if (!this.hasClearedMirrorGallery) {
      this.hasClearedMirrorGallery = true;
      this.progression.addExp(90);
      this.canonChapterManager.unlockChapter(15);
      this.spawnFloatingText(this.playerGroup.position, '🪞 ¡ESPEJO MAESTRO QUEBRADO! (+90 EXP)', '#cc44ff');
      this.showDialogueModal(
        '🪞 EL SALÓN DE LOS ESPEJOS — CAPÍTULO XV 🪞',
        '«Los espejos venecianos proyectan ecos de culpa y humo dorado para quebrar tu voluntad. Al estrellar tu filo contra el cristal maestro, las ilusiones se deshacen en mil esquirlas luminosas revelando el engaño de Alaric.»',
        '✦ RECOMPENSA: +90 EXP & CAPÍTULO XV DESBLOQUEADO ✦'
      );
      this.updateHUD();
    } else {
      this.showDialogueModal(
        '🪞 EL SALÓN DE LOS ESPEJOS 🪞',
        '«Los cristales hechos añicos ya no pueden ocultarte la verdad del linaje del Sauce Negro.»',
        '✦ CAPÍTULO XV COMPLETADO ✦'
      );
    }
  }

  public interactWithAstralThrone(): void {
    if (!this.rexMalphasEncounter.isDefeated) {
      this.audio.playAstralDistortion?.();
      this.showDialogueModal(
        '👑 TRONO ASTRAL DE LONDINIUM 👑',
        '«La sombra del rey Alaric domina esta sala bajo una bóveda de astros falsos. Derrótalo para desgarrar el velo que conduce a la Catedral Invertida.»',
        '⚠ DERROTA A REX MALPHAS PARA ABRIR EL ACTO V ⚠'
      );
      return;
    }
    this.canonChapterManager.unlockChapter(18);
    this.transitionToArea('inverted_cathedral');
  }

  public interactWithDawnGreyAltar(): void {
    if (!this.hasForgedAlbaGris) {
      this.forgeAlbaGrisSword();
    } else {
      this.audio.playCosmicChime?.();
      this.showDialogueModal(
        '✨ ALTAR DE LA COMUNIÓN INMACULADA — ALBA GRIS ✨',
        '«La Gota de Luz Divina de Elowen y el Fuego Negro de Thomas laten en perfecta armonía dentro de Alba Gris. Empúñala contra Astaroth: cada golpe inflige el doble de daño crítico al Sol del Abismo.»',
        '✦ ALBA GRIS EQUIPADA (+100% DAÑO CRÍTICO CONTRA ASTAROTH) ✦'
      );
    }
  }

  public interactWithBlackSunCore(): void {
    this.audio.playCosmicChime?.();
    if (this.astarothEncounter.isDefeated) {
      this.showDialogueModal(
        '🌅 EL PRIMER AMANECER DE ALBION — EPÍLOGO CANÓNICO 🌅',
        '«Donde antes ardía el Sol Negro de Astaroth ahora solo resplandece la claridad del alba. Has recorrido los 20 capítulos del canon de The Light in the Darkness. Puedes abrir el Compendio Canónico [N] en cualquier momento para revivir cualquier acto.»',
        '👑 CANON COMPLETO — 20/20 CAPÍTULOS 👑'
      );
    } else {
      this.showDialogueModal(
        '🌌 EL SOL DEL ABISMO 🌌',
        '«Astaroth, el Padre de las Cenizas, palpita sobre el vacío. Forja Alba Gris en el Altar Blanco antes de asestar el golpe definitivo.»',
        '⚠ DERROTA A ASTAROTH CON ALBA GRIS ⚠'
      );
    }
  }

  public interactWithCemeteryGate(): void {
    if (this.cemeteryGateOpen) {
      this.spawnFloatingText(this.playerGroup.position, 'La verja ya está abierta hacia las criptas.', '#00e5ff');
      return;
    }

    const key = this.inventory.getItem('oakhaven_crypt_key');
    if (key && key.quantity > 0) {
      this.openCemeteryGate();
    } else {
      this.audio.playSfx('warning');
      this.spawnFloatingText(this.playerGroup.position, '🔒 Requiere la Llave de las Criptas (Madre Morwenna)', '#ff6666');
      this.setDialogueToast(
        'Verja Sellada',
        '«El hierro negro está encadenado con los sellos del Crisol. Derrota a Madre Morwenna en la Gran Pira para obtener la Llave de las Criptas.»',
        '/assets/icons/icon_crypt_key.png',
        '#ff6666'
      );
    }
  }

  public openCemeteryGate(): void {
    if (this.cemeteryGateOpen) return;
    this.cemeteryGateOpen = true;
    this.dungeonAreaManager.setCemeteryGateOpen(true);
    this.audio.playSfx('parry');
    this.spawnFloatingText(new THREE.Vector3(0, 2.5, -23.5), '🚪 ¡VERJA DEL CEMENTERIO ABIERTA!', '#00e5ff');
  }

  public interactWithThomas(): void {
    this.hasTalkedToThomas3D = true;
    this.audio.playSfx('menu_select');
    this.playerStats.posture = this.playerStats.maxPosture;
    this.spawnFloatingText(this.playerGroup.position, '+25 POSTURA • BENDICIÓN FRATERNAL', '#ffd700');
    this.updateHUD();

    this.showDialogueModal(
      '✦ HERMANO THOMAS — ACÓLITO DE LA ORDEN DE SAN JUDE ✦',
      '«Khaterine... Tu arco abisal y tus flechas nos cubren desde la penumbra. Con cada disparo de [J] y [K], la niebla retrocede ante la voluntad del Sauce Negro. No permitas que el fuego del Crisol te alcance: recuerda que tu barrera [L] puede dispersar las llamas de Morwenna si la despliegas a tiempo. Caminamos juntos en esta noche.»',
      '✦ VÍNCULO DE COMPAÑEROS: POSTURA AL MÁXIMO & BENDICIÓN CONTRA EL FUEGO ✦'
    );
  }

  public interactWithElowen(): void {
    this.hasTalkedToElowen3D = true;
    this.audio.playSfx('menu_select');
    this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + 35);
    this.playerStats.posture = this.playerStats.maxPosture;
    this.spawnFloatingText(this.playerGroup.position, '+35 SALUD RESTAURADA', '#88ffaa');
    this.updateHUD();

    this.showDialogueModal(
      '✦ ELOWEN DE OAKHAVEN — DONCELLA DE LA LUZ ARGÉNTEA & BOTICARIA ✦',
      '«Thomas... Las hojas de plata aún brotan en los jardines de Oakhaven a pesar de la ceniza abisal. He bendecido mi caldero de botica junto a mí: acércate a él [E] o presiona [B] para transmutar elixires, bálsamos de cura y rosarios consagrados con los materiales que recolectes de las sombras. Que la luz del Alba guíe tu espada.»',
      '✦ RECOMPENSA: +35 SALUD RESTAURADA & ACCESO AL CALDERO DE BOTICA [B] ✦'
    );
  }

  public interactWithCedric(): void {
    this.hasTalkedToCedric3D = true;
    this.audio.playSfx('menu_select');
    this.playerStats.posture = this.playerStats.maxPosture;
    this.spawnFloatingText(this.playerGroup.position, '+30 EXP • BENDICIÓN SAGRADA', '#ffd700');
    this.updateHUD();

    this.showDialogueModal(
      '✞ PADRE CEDRIC — PÁRROCO DE LA PARROQUIA DE OAKHAVEN ✞',
      '«Hijo mío... Que la gracia de la Llama Sagrada preserve tu andar en esta noche aciaga. Morwenna se ha adueñado de la Gran Pira al final de la vía; su devoción se torció en rencor y ahora empuña el Crisol de Fuego Abisal. No la ataques a ciegas: cuando veas el destello rojo sobre ella, prepárate para rodar con [ESPACIO] o rechazar su fuego con [L]. Toma este rosario de madera bendito.»',
      '✞ BENDICIÓN PARROQUIAL: +30 EXPERIENCIA & CONOCIMIENTO TÁCTICO DE MORWENNA ✞'
    );
  }

  public interactWithShalem(): void {
    this.audio.playSfx('menu_select');
    this.playerStats.posture = this.playerStats.maxPosture;
    this.spawnFloatingText(this.playerGroup.position, 'POSTURA AL MÁXIMO • RONRONEO FELINO', '#aaaaff');
    this.updateHUD();

    this.showDialogueModal(
      '🐾 SHALEM — GUÍA FELINO DE LAS SOMBRAS 🐾',
      '«¡Miau! Vaya, veo que sigues entero, acólito. Este pozo de piedra es el único rincón donde la niebla no huele a azufre. Recuerda: si arrojas tu espada con [T], no entres en pánico; tus puños son rápidos y siempre puedes correr a recogerla con [E]. Ahora ve a por esa inquisidora... antes de que me venza la siesta.»',
      '🐾 CONSEJO FELINO: POSTURA COMPLETA RESTAURADA & CALMA TÁCTICA 🐾'
    );
  }

  public interactWithKhaterine(): void {
    this.hasTalkedToKhaterine3D = true;
    this.audio.playSfx('menu_select');
    this.spawnFloatingText(this.playerGroup.position, '+15% AGILIDAD • PACTO OSCURO', '#d999ff');

    this.showDialogueModal(
      '🏹 KHATERINE — LA CAZADORA DEL SAUCE NEGRO 🏹',
      '«Acólito... No todos los que vestimos ropajes oscuros servimos al Abismo. Observé cómo esquivaste los colmillos del sabueso: eres veloz, pero Morwenna no perdona un solo error de distancia. Guarda tu aliento para el contraataque justo tras su llamarada. Si logras desestabilizarla con un parry oportuno, pulsa [E] para asestar un remate devastador.»',
      '🏹 PACTO DEL SAUCE: BONIFICACIÓN DE AGILIDAD & REMATE CINEMÁTICO 3D 🏹'
    );
  }

  public executeFinisher3D(): void {
    // Check if enemy is stunned
    const distToEnemy = this.playerGroup.position.distanceTo(this.enemyGroup.position);
    if (this.enemyState === 'STUNNED' && distToEnemy <= 3.2) {
      this.enemyHealth = 0;
      this.enemyState = 'DEAD';
      this.audio.playFinisherSound(true);
      this.spawnFloatingText(this.enemyGroup.position, '⚡ ¡REMATADO! (+120 DAÑO & 75 EXP)', '#ffd700');
      this.enemyGroup.position.y = -0.3;
      this.awardEnemyKillRewards('hound', true);
      this.playerLight.intensity = 4.0;
      setTimeout(() => { if (this.playerLight) this.playerLight.intensity = 1.4; }, 300);
      this.updateHUD();
      return;
    }

    // Check if Cultist is stunned
    const distToCultist = this.playerGroup.position.distanceTo(this.cultistGroup.position);
    if (this.cultistState === 'STUNNED' && distToCultist <= 3.2) {
      this.cultistHealth = 0;
      this.cultistState = 'DEAD';
      this.cultistCenserLight.intensity = 0;
      this.cultistGroup.position.y = -0.3;
      this.audio.playFinisherSound(true);
      this.spawnFloatingText(this.cultistGroup.position, '⚡ ¡CULTISTA REMATADO! (+110 DAÑO & 100 EXP)', '#ffd700');
      this.awardEnemyKillRewards('cultist', true);
      this.playerLight.intensity = 4.0;
      setTimeout(() => { if (this.playerLight) this.playerLight.intensity = 1.4; }, 300);
      this.updateHUD();
      return;
    }

    // Check if Chain Zealot is stunned
    const distToZealot = this.playerGroup.position.distanceTo(this.zealotGroup.position);
    if (this.zealotState === 'STUNNED' && distToZealot <= 3.4) {
      this.zealotHealth = 0;
      this.zealotState = 'DEAD';
      this.zealotGroup.position.y = -0.3;
      this.audio.playFinisherSound(true);
      this.spawnFloatingText(this.zealotGroup.position, '⚡ ¡FLAGELANTE REMATADO! (+140 DAÑO & 150 EXP)', '#ffd700');
      this.awardEnemyKillRewards('zealot', true);
      this.playerLight.intensity = 4.0;
      setTimeout(() => { if (this.playerLight) this.playerLight.intensity = 1.4; }, 300);
      this.updateHUD();
      return;
    }

    // Check if Crypt Skeleton is stunned
    const distToSkeleton = this.playerGroup.position.distanceTo(this.skeletonGroup.position);
    if (this.skeletonState === 'STUNNED' && distToSkeleton <= 3.4) {
      this.skeletonHealth = 0;
      this.skeletonState = 'DEAD';
      this.audio.playFinisherSound(true);
      this.spawnFloatingText(this.skeletonGroup.position, '⚡ ¡PENITENTE REMATADO! (+180 EXP)', '#00e5ff');
      this.skeletonGroup.position.y = -0.3;
      this.awardEnemyKillRewards('skeleton', true);
      this.playerLight.intensity = 4.0;
      setTimeout(() => { if (this.playerLight) this.playerLight.intensity = 1.4; }, 300);
      this.updateHUD();
      return;
    }

    // Check if Morwenna is stunned
    const distToMorwenna = this.playerGroup.position.distanceTo(this.morwennaGroup.position);
    if (this.morwennaState === 'STUNNED' && distToMorwenna <= 3.6) {
      const finisherDmg = 90;
      const mResult = this.morwennaEncounter.takeDamage(finisherDmg);
      this.morwennaHealth = mResult.currentHealth;
      this.audio.playFinisherSound(true);
      this.spawnFloatingText(this.morwennaGroup.position, `⚡ ¡REMATADA! -${finisherDmg} DAÑO SAGRADO`, '#ffd700');
      this.progression.addExp(80);
      this.playerLight.intensity = 4.0;
      setTimeout(() => { if (this.playerLight) this.playerLight.intensity = 1.4; }, 300);

      if (mResult.transitionedToPhase2) {
        this.triggerMorwennaPhase2();
      } else if (mResult.defeated) {
        this.handleMorwennaDefeat();
      } else {
        this.morwennaState = 'RECOVERY';
        this.morwennaTimer = 0.8;
      }
      this.updateHUD();
      return;
    }

    // Check if Inquisitor is in recovery / vulnerable
    if (this.dungeonAreaManager.currentArea === 'crypts_interior' && !this.inquisitorEncounter.isDefeated) {
      const distToInq = this.playerGroup.position.distanceTo(this.inquisitorGroup.position);
      if ((this.inquisitorEncounter.state === 'RECOVERY' || !this.inquisitorEncounter.isBlocking) && distToInq <= 3.6) {
        const finisherDmg = 65;
        const inqResult = this.inquisitorEncounter.takeDamage(finisherDmg, false);
        this.audio.playFinisherSound(true);
        this.spawnFloatingText(this.inquisitorGroup.position, `⚡ ¡REMATADO! -${finisherDmg} DAÑO`, '#ffd700');
        this.progression.addExp(60);
        this.playerLight.intensity = 4.0;
        setTimeout(() => { if (this.playerLight) this.playerLight.intensity = 1.4; }, 300);

        if (this.inquisitorHpBarFill) {
          this.inquisitorHpBarFill.style.width = `${Math.max(0, (this.inquisitorEncounter.health / this.inquisitorEncounter.maxHealth) * 100)}%`;
        }

        if (inqResult.defeated) {
          this.handleInquisitorDefeat();
        }
        this.updateHUD();
        return;
      }
    }

    // Check if Root Prowler is stunned
    if (this.dungeonAreaManager.currentArea === 'black_willow_forest' && this.rootProwlerEncounter.state === 'STUNNED') {
      const distToProwler = this.playerGroup.position.distanceTo(this.rootProwlerGroup.position);
      if (distToProwler <= 3.5) {
        this.handleRootProwlerDefeat();
        this.playerLight.intensity = 4.0;
        setTimeout(() => { if (this.playerLight) this.playerLight.intensity = 1.4; }, 300);
        return;
      }
    }

    // Check if Crucible Guardian is stunned
    if (this.dungeonAreaManager.currentArea === 'belltower_summit' && this.crucibleGuardianEncounter.state === 'STUNNED') {
      if (this.playerGroup.position.distanceTo(this.crucibleGuardianGroup.position) <= 3.8) {
        const res = this.crucibleGuardianEncounter.takeDamage(85, true);
        this.audio.playFinisherSound(true);
        this.spawnFloatingText(this.crucibleGuardianGroup.position, `⚡ ¡REMATE DE CRISOL! -${res.actualDamage}`, '#ffd700');
        this.crucibleGuardianGroup.position.y = 0;
        if (res.defeated) this.handleCrucibleGuardianDefeat();
        else this.crucibleGuardianEncounter.setState('CHASE');
        this.updateHUD();
        return;
      }
    }

    // Check if Captain Vane is stunned
    if (this.dungeonAreaManager.currentArea === 'great_stone_bridge' && this.captainVaneEncounter.state === 'STUNNED') {
      if (this.playerGroup.position.distanceTo(this.captainVaneGroup.position) <= 3.8) {
        const res = this.captainVaneEncounter.takeDamage(95, false, true);
        this.audio.playFinisherSound(true);
        this.spawnFloatingText(this.captainVaneGroup.position, `⚡ ¡VEREDICTO QUEBRADO! -${res.actualDamage}`, '#ffd700');
        this.captainVaneGroup.position.y = 0;
        if (res.defeated) this.handleCaptainVaneDefeat();
        else this.captainVaneEncounter.setState('CHASE');
        this.updateHUD();
        return;
      }
    }

    // Check if Rex Malphas is stunned
    if (this.dungeonAreaManager.currentArea === 'londinium_citadel' && this.rexMalphasEncounter.state === 'STUNNED') {
      if (this.playerGroup.position.distanceTo(this.rexMalphasGroup.position) <= 3.8) {
        const res = this.rexMalphasEncounter.takeDamage(105);
        this.audio.playFinisherSound(true);
        this.spawnFloatingText(this.rexMalphasGroup.position, `⚡ ¡CORTE REGICIDA! -${res.actualDamage}`, '#cc44ff');
        this.rexMalphasGroup.position.y = 0;
        if (res.transitionedToPhase2) this.triggerRexMalphasPhase2();
        else if (res.defeated) this.handleRexMalphasDefeat();
        else this.rexMalphasEncounter.setState('CHASE');
        this.updateHUD();
        return;
      }
    }

    // Check if Astaroth Titan is stunned
    if (this.dungeonAreaManager.currentArea === 'inverted_cathedral' && this.astarothEncounter.state === 'STUNNED') {
      const distHoriz = new THREE.Vector2(
        this.playerGroup.position.x - this.astarothGroup.position.x,
        this.playerGroup.position.z - this.astarothGroup.position.z
      ).length();
      if (distHoriz <= 4.8) {
        const res = this.astarothEncounter.takeDamage(110, this.hasForgedAlbaGris);
        this.audio.playFinisherSound(true);
        this.spawnFloatingText(
          this.astarothGroup.position,
          this.hasForgedAlbaGris ? `✨ ¡ESTALLIDO ALBA GRIS! -${res.actualDamage}` : `⚡ ¡REMATE CÓSMICO! -${res.actualDamage}`,
          '#88eeff'
        );
        if (res.defeated) this.handleAstarothDefeat();
        else this.astarothEncounter.setState('CHASE');
        this.updateHUD();
        return;
      }
    }
  }

  public showDialogueModal(header: string, text: string, rewardText?: string): void {
    this.releaseAllInputs();
    this.isDialogueOpen = true;
    if (this.proximityBadgeEl) {
      this.proximityBadgeEl.style.display = 'none';
    }
    if (this.dialogueModalEl) {
      const headerEl = this.dialogueModalEl.querySelector('#p3d-modal-header') as HTMLDivElement;
      const textEl = this.dialogueModalEl.querySelector('#p3d-modal-text') as HTMLDivElement;
      const rewardEl = this.dialogueModalEl.querySelector('#p3d-modal-reward') as HTMLDivElement;

      if (headerEl) headerEl.innerText = header;
      if (textEl) textEl.innerText = text;
      if (rewardEl) {
        rewardEl.innerText = rewardText || '';
        rewardEl.style.display = rewardText ? 'block' : 'none';
      }
      this.dialogueModalEl.style.display = 'block';
    }
  }

  public closeDialogueModal(): void {
    this.isDialogueOpen = false;
    if (this.dialogueModalEl) {
      this.dialogueModalEl.style.display = 'none';
    }
  }

  public setPlayerPosition(x: number, y: number, z: number): void {
    if (this.playerGroup) {
      const prevPos = this.playerGroup.position.clone();
      this.playerGroup.position.set(x, y, z);
      this.currentCameraLook.set(x, y + 1.35, z);
      this.targetCameraLook.set(x, y + 1.35, z);

      // Snap camera immediately on long-distance zone teleports so it does not fly across empty void
      if (this.camera && prevPos.distanceTo(this.playerGroup.position) > 20) {
        if (this.cameraMode === 'isometric') {
          this.targetCameraPos.set(x * 0.5, y + 7.2, z + 8.8);
        } else {
          this.targetCameraPos.set(x, y + 2.4, z + 4.0);
        }
        this.camera.position.copy(this.targetCameraPos);
        this.camera.lookAt(this.currentCameraLook);
      }
    }
  }

  private updateProximityInteractions(): void {
    if (!this.isGameplayActive()) return;

    const pPos = this.playerGroup.position;
    let targetFound: typeof this.activeInteractTarget;
    let badgeText = '';
    let badgeColor = '#ffd700';

    // 1. Finisher priority
    const distToEnemy = pPos.distanceTo(this.enemyGroup.position);
    const distToCultist = pPos.distanceTo(this.cultistGroup.position);
    const distToZealot = pPos.distanceTo(this.zealotGroup.position);
    if (this.enemyState === 'STUNNED' && distToEnemy <= 3.0) {
      targetFound = 'finisher';
      badgeText = '⚡ [E] ¡REMATAR SABUESO ATURDIDO!';
      badgeColor = '#ffd700';
    } else if (this.cultistState === 'STUNNED' && distToCultist <= 3.0) {
      targetFound = 'finisher';
      badgeText = '⚡ [E] ¡REMATAR CULTISTA ATURDIDO!';
      badgeColor = '#ffd700';
    } else if (this.zealotState === 'STUNNED' && distToZealot <= 3.2) {
      targetFound = 'finisher';
      badgeText = '⚡ [E] ¡REMATAR FLAGELANTE ATURDIDO!';
      badgeColor = '#ff4444';
    } else if (this.skeletonState === 'STUNNED' && pPos.distanceTo(this.skeletonGroup.position) <= 3.2) {
      targetFound = 'finisher';
      badgeText = '⚡ [E] ¡REMATAR PENITENTE DE LA CRIPTA!';
      badgeColor = '#00e5ff';
    } else {
      const distToMorwenna = pPos.distanceTo(this.morwennaGroup.position);
      if (this.morwennaState === 'STUNNED' && distToMorwenna <= 3.5) {
        targetFound = 'finisher';
        badgeText = '⚡ [E] ¡REMATAR A MORWENNA ATURDIDA!';
        badgeColor = '#ff4455';
      }
    }

    // 2. Dropped Sword
    if (!targetFound && !this.playerStats.isArmed && this.droppedSwordGroup) {
      const dist = pPos.distanceTo(this.droppedSwordGroup.position);
      if (dist <= 2.8) {
        targetFound = 'sword';
        badgeText = '⚔ [E] RECOGER ESPADA CORTA';
        badgeColor = '#ffd700';
      }
    }

    // 3. Elowen's Cauldron (Alchemy & Apothecary)
    if (!targetFound) {
      const distCauldron = pPos.distanceTo(new THREE.Vector3(-2.4, 0, -0.7));
      if (distCauldron <= 2.6) {
        targetFound = 'cauldron';
        badgeText = '⚗️ [E] CALDERO DE ELOWEN: BOTICA & ALQUIMIA';
        badgeColor = '#2ecc71';
      }
    }

    // 4. Elowen
    if (!targetFound) {
      const dist = pPos.distanceTo(this.elowenGroup.position);
      if (dist <= 3.8) {
        targetFound = 'elowen';
        badgeText = this.hasTalkedToElowen3D ? '✦ [E] CONSULTAR A ELOWEN' : '✦ [E] HABLAR CON ELOWEN (DONCELLA)';
        badgeColor = '#b5d4ff';
      }
    }

    // 4. Cedric
    if (!targetFound) {
      const dist = pPos.distanceTo(this.cedricGroup.position);
      if (dist <= 3.8) {
        targetFound = 'cedric';
        badgeText = this.hasTalkedToCedric3D ? '✞ [E] BENDECIRSE CON PADRE CEDRIC' : '✞ [E] HABLAR CON PADRE CEDRIC';
        badgeColor = '#ffd700';
      }
    }

    // 5. Shalem
    if (!targetFound) {
      const dist = pPos.distanceTo(this.shalemGroup.position);
      if (dist <= 3.8) {
        targetFound = 'shalem';
        badgeText = '🐾 [E] ACARICIAR A SHALEM (GATO GUÍA)';
        badgeColor = '#ffdd44';
      }
    }

    // 6. Khaterine (NPC when Thomas is active)
    if (!targetFound && this.activeHero === 'thomas') {
      const dist = pPos.distanceTo(this.khaterineGroup.position);
      if (dist <= 3.8) {
        targetFound = 'khaterine';
        badgeText = this.hasTalkedToKhaterine3D ? '🏹 [E] CONVERSAR CON KHATERINE' : '🏹 [E] HABLAR CON KHATERINE (CAZADORA)';
        badgeColor = '#d999ff';
      }
    }

    // 7. Thomas (NPC when Khaterine is active)
    if (!targetFound && this.activeHero === 'khaterine') {
      const dist = pPos.distanceTo(this.thomasNpcGroup.position);
      if (dist <= 3.8) {
        targetFound = 'thomas';
        badgeText = this.hasTalkedToThomas3D ? '✦ [E] CONSULTAR A THOMAS' : '✦ [E] HABLAR CON THOMAS (ACÓLITO)';
        badgeColor = '#ffd700';
      }
    }

    // 8. Cemetery Gate Interaction
    if (!targetFound && Math.abs(pPos.z - (-23.5)) < 2.5 && Math.abs(pPos.x) < 3.2) {
      targetFound = 'cemetery_gate';
      if (this.cemeteryGateOpen) {
        badgeText = '🚪 CEMENTERIO DE SAN JUDE (ACCESO ABIERTO)';
        badgeColor = '#00e5ff';
      } else {
        const hasKey = this.inventory.getItem('oakhaven_crypt_key');
        if (hasKey && hasKey.quantity > 0) {
          badgeText = '🗝️ [E] ABRIR VERJA DEL CEMENTERIO (LLAVE EN POSESIÓN)';
          badgeColor = '#ffd700';
        } else {
          badgeText = '🔒 [E] VERJA SELLADA (REQUIERE LLAVE DE MORWENNA)';
          badgeColor = '#ff6666';
        }
      }
    }

    // 9. Surface Crypt Mausoleum Entrance (when on surface)
    if (!targetFound && this.dungeonAreaManager.currentArea === 'surface') {
      if (this.cemeteryGateOpen && pPos.z <= -43.0 && pPos.z >= -46.5 && Math.abs(pPos.x) <= 2.6) {
        targetFound = 'crypt_entrance';
        badgeText = '🚪 [E] DESCENDER A LAS CRIPTAS DE SAN JUDE';
        badgeColor = '#00e5ff';
      }
    }

    // 10. Subterranean Crypt Interactions (when inside crypts)
    if (!targetFound && this.dungeonAreaManager.currentArea === 'crypts_interior') {
      // Exit staircase
      if (pPos.z >= -73.5 && pPos.z <= -69.5 && Math.abs(pPos.x) <= 2.8) {
        targetFound = 'crypt_exit';
        badgeText = '🚪 [E] SUBIR A LA SUPERFICIE DE OAKHAVEN';
        badgeColor = '#00e5ff';
      }
      // Sarcophagus 1 (Loot) at (-3.8, 0, -85)
      else if (pPos.distanceTo(new THREE.Vector3(-3.8, 0, -85)) <= 2.6) {
        targetFound = 'crypt_sarcophagus_loot';
        const isOpened = this.dungeonAreaManager.getSarcophagus('sarcophagus_loot')?.isOpened;
        badgeText = isOpened ? '🪦 SARCÓFAGO PROFANADO (VACÍO)' : '🪦 [E] ABRIR SARCÓFAGO PROFANADO';
        badgeColor = isOpened ? '#aaaaaa' : '#ffd700';
      }
      // Sarcophagus 2 (Ambush) at (3.8, 0, -97)
      else if (pPos.distanceTo(new THREE.Vector3(3.8, 0, -97)) <= 2.6) {
        targetFound = 'crypt_sarcophagus_ambush';
        badgeText = this.cryptAmbushAwakened ? '🪦 SARCÓFAGO ABIERTO' : '🪦 [E] REGISTRAR SARCÓFAGO SELLADO';
        badgeColor = this.cryptAmbushAwakened ? '#aaaaaa' : '#ff6666';
      }
      // Portal to Black Willow Forest at z = -110
      else if (pPos.z <= -108.0 && pPos.z >= -112.0 && Math.abs(pPos.x) <= 2.8) {
        if (!this.inquisitorEncounter.isDefeated) {
          targetFound = undefined;
          badgeText = '🔒 LAS CADENAS DEL INQUISIDOR SELLAN EL PORTAL AL SAUCE NEGRO';
          badgeColor = '#ff6666';
        } else {
          targetFound = 'crypt_to_forest';
          badgeText = '🌿 [E] ADENTRARSE EN EL BOSQUE DEL SAUCE NEGRO';
          badgeColor = '#cc66ff';
        }
      }
    }

    // 11. Black Willow Forest Interactions (when inside forest)
    if (!targetFound && this.dungeonAreaManager.currentArea === 'black_willow_forest') {
      // Exit gate back to crypts
      if (pPos.z >= -127.5 && pPos.z <= -124.5 && Math.abs(pPos.x) <= 3.0) {
        targetFound = 'forest_to_crypt';
        badgeText = '🚪 [E] REGRESAR A LAS CRIPTAS DE SAN JUDE';
        badgeColor = '#00e5ff';
      }
      // Altar of the Nine Sisters at (0, 0, -155)
      else if (pPos.distanceTo(new THREE.Vector3(0, 0, -155)) <= 3.2) {
        targetFound = 'sister_altar';
        if (this.inventory.hasWillowFang()) {
          badgeText = '🔮 ALTAR DE LAS NUEVE HERMANAS (CONSAGRADO)';
          badgeColor = '#aaaaaa';
        } else {
          badgeText = '🔮 [E] RECLAMAR EL COLMILLO DEL SAUCE NEGRO';
          badgeColor = '#cc66ff';
        }
      }
      // Stunned Root Prowler Finisher
      else if (this.rootProwlerEncounter.state === 'STUNNED' && pPos.distanceTo(this.rootProwlerGroup.position) <= 3.0) {
        targetFound = 'finisher';
        badgeText = '⚡ [E] ¡REMATAR AL ACECHADOR DE RAÍCES!';
        badgeColor = '#ffd700';
      }
      // North path from Black Willow Forest to Belltower Summit (Act II)
      else if (pPos.z <= -167.0 && Math.abs(pPos.x) <= 3.5) {
        targetFound = 'forest_to_belltower';
        badgeText = '🔔 [E] ASCENDER AL CAMPANARIO DEL SUR (ACTO II)';
        badgeColor = '#ffaa44';
      }
    }

    // 12. Act II: Belltower Summit Interactions
    if (!targetFound && this.dungeonAreaManager.currentArea === 'belltower_summit') {
      if (this.crucibleGuardianEncounter.state === 'STUNNED' && pPos.distanceTo(this.crucibleGuardianGroup.position) <= 3.8) {
        targetFound = 'finisher';
        badgeText = '⚡ [E] ¡REMATAR AL GUARDIÁN DEL CRISOL!';
        badgeColor = '#ffd700';
      } else if (pPos.z >= -187.5 && Math.abs(pPos.x) <= 3.0) {
        targetFound = 'belltower_to_forest';
        badgeText = '🌿 [E] DESCENDER AL BOSQUE DEL SAUCE NEGRO';
        badgeColor = '#bb44ff';
      } else if (pPos.distanceTo(new THREE.Vector3(-5.5, 0, -202)) <= 3.4) {
        targetFound = 'elowen_cell';
        badgeText = this.hasCollectedWillowBird ? '🔔 [E] INSPECCIONAR CELDA DE SAL' : '🕊️ [E] RECOGER PÁJARO DE SAUCE (CELDA DE ELOWEN)';
        badgeColor = '#ffd700';
      } else if (pPos.distanceTo(new THREE.Vector3(0, 0, -214)) <= 3.6) {
        if (this.crucibleGuardianEncounter.isDefeated && pPos.z <= -215.5) {
          targetFound = 'belltower_to_bridge';
          badgeText = '🌉 [E] MARCHAR AL GRAN PUENTE DE PIEDRA (ACTO III)';
          badgeColor = '#ffd700';
        } else {
          targetFound = 'crucible_furnace';
          badgeText = this.crucibleGuardianEncounter.isDefeated
            ? '🔥 [E] EXAMINAR EL GRAN CRISOL PURIFICADO (AVANZA AL NORTE PARA ACTO III)'
            : '🔥 [E] EXAMINAR EL GRAN CRISOL DE BRONCE';
          badgeColor = '#ff7722';
        }
      } else if (this.crucibleGuardianEncounter.isDefeated && pPos.z <= -216.0) {
        targetFound = 'belltower_to_bridge';
        badgeText = '🌉 [E] MARCHAR AL GRAN PUENTE DE PIEDRA (ACTO III)';
        badgeColor = '#ffd700';
      }
    }

    // 13. Act III: Great Stone Bridge Interactions
    if (!targetFound && this.dungeonAreaManager.currentArea === 'great_stone_bridge') {
      if (this.captainVaneEncounter.state === 'STUNNED' && pPos.distanceTo(this.captainVaneGroup.position) <= 3.8) {
        targetFound = 'finisher';
        badgeText = '⚡ [E] ¡REMATAR AL CAPITÁN ÁUREO VANE!';
        badgeColor = '#ffd700';
      } else if (pPos.distanceTo(new THREE.Vector3(-2.6, 0, -249)) <= 3.5) {
        targetFound = 'refugees_cart';
        badgeText = this.hasFreedRefugees ? '🗝️ [E] CARRETA DE MARTÍN Y TOBÍAS (LIBERADOS)' : '🗝️ [E] LIBERAR A MARTÍN Y TOBÍAS DEL CONVOY';
        badgeColor = '#ffd700';
      } else if (pPos.z <= -274.5 && Math.abs(pPos.x) <= 3.8) {
        targetFound = 'vane_gate';
        badgeText = this.captainVaneEncounter.isDefeated
          ? '🏛 [E] ENTRAR A LONDINIUM — LA CIUDADELA DORADA (ACTO IV)'
          : '🛡️ [E] PUERTA DE LONDINIUM (DERROTA AL CAPITÁN VANE)';
        badgeColor = this.captainVaneEncounter.isDefeated ? '#cc44ff' : '#ffd700';
      }
    }

    // 14. Act IV: Londinium Citadel Interactions
    if (!targetFound && this.dungeonAreaManager.currentArea === 'londinium_citadel') {
      if (this.rexMalphasEncounter.state === 'STUNNED' && pPos.distanceTo(this.rexMalphasGroup.position) <= 3.8) {
        targetFound = 'finisher';
        badgeText = '⚡ [E] ¡ASESTAR GOLPE REGICIDA A REX MALPHAS!';
        badgeColor = '#cc44ff';
      } else if (pPos.distanceTo(new THREE.Vector3(-7.0, 0, -320)) <= 3.8) {
        targetFound = 'mirror_gallery';
        badgeText = this.hasClearedMirrorGallery ? '🪞 [E] SALÓN DE LOS ESPEJOS (QUEBRADO)' : '🪞 [E] QUEBRAR EL ESPEJO MAESTRO (SALÓN DE ESPEJOS)';
        badgeColor = '#cc44ff';
      } else if (pPos.distanceTo(new THREE.Vector3(0, 0, -336)) <= 4.0) {
        targetFound = 'astral_throne';
        badgeText = this.rexMalphasEncounter.isDefeated
          ? '🌌 [E] DESCENDER A LA CATEDRAL INVERTIDA (ACTO V)'
          : '👑 [E] TRONO ASTRAL DE REX MALPHAS';
        badgeColor = this.rexMalphasEncounter.isDefeated ? '#ff2288' : '#cc44ff';
      }
    }

    // 15. Act V: Inverted Cathedral Interactions
    if (!targetFound && this.dungeonAreaManager.currentArea === 'inverted_cathedral') {
      const distAstarothHoriz = new THREE.Vector2(pPos.x - this.astarothGroup.position.x, pPos.z - this.astarothGroup.position.z).length();
      if (this.astarothEncounter.state === 'STUNNED' && distAstarothHoriz <= 4.8) {
        targetFound = 'finisher';
        badgeText = '✨ [E] ¡ASESTAR GOLPE FINAL DE ALBA GRIS A ASTAROTH!';
        badgeColor = '#88eeff';
      } else if (pPos.distanceTo(new THREE.Vector3(0, 0, -378)) <= 3.6) {
        targetFound = 'dawn_grey_altar';
        badgeText = this.hasForgedAlbaGris
          ? '✨ [E] ALTAR DE LA COMUNIÓN (ALBA GRIS FORJADA)'
          : '✨ [E] RECIBIR LA GOTA DE LUZ & FORJAR ALBA GRIS';
        badgeColor = '#88eeff';
      } else if (distAstarothHoriz <= 5.0 && this.astarothEncounter.isDefeated) {
        targetFound = 'black_sun_core';
        badgeText = '🌅 [E] CONTEMPLAR EL PRIMER AMANECER DE ALBION';
        badgeColor = '#ffd700';
      }
    }

    this.activeInteractTarget = targetFound;
    if (this.proximityBadgeEl) {
      if (targetFound) {
        this.proximityBadgeEl.innerText = badgeText;
        this.proximityBadgeEl.style.color = badgeColor;
        this.proximityBadgeEl.style.borderColor = badgeColor;
        this.proximityBadgeEl.style.display = 'block';
      } else {
        this.proximityBadgeEl.style.display = 'none';
      }
    }
  }

  // =========================================================================
  // BOSS 3D: MOTHER MORWENNA LOGIC & COMBAT (PHASE 1 & PHASE 2 DESATADA)
  // =========================================================================
  private updateBossMorwenna(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'surface') {
      if (this.morwennaHpBarContainer) this.morwennaHpBarContainer.style.display = 'none';
      return;
    }
    if (!this.isGameplayActive()) return;
    if (this.morwennaState === 'DORMANT') {
      // Trigger awakening when player crosses z <= -8
      if (this.playerGroup.position.z <= -8) {
        this.morwennaState = 'CHASE';
        if (this.morwennaHpBarContainer) {
          this.morwennaHpBarContainer.style.display = 'block';
        }
        this.setDialogueToast(
          'Madre Morwenna',
          '«¡Nadie desafiará el Crisol de la Sagrada Vigilia! ¡Arded en la llama de Oakhaven!»',
          '/assets/concepts/concept_morwenna.png',
          '#ff3344'
        );
        this.audio.playSfx('warning');
        this.spawnFloatingText(this.morwennaGroup.position, '👑 ¡MADRE MORWENNA HA DESPERTADO!', '#ff3344');
      }
      return;
    }

    if (this.morwennaState === 'DEAD') {
      this.morwennaCrucibleLight.intensity = Math.max(0, this.morwennaCrucibleLight.intensity - delta * 3);
      this.morwennaGroup.position.y = -0.5;
      return;
    }

    // Phase 2 Cinematic Transition handling
    if (this.morwennaState === 'PHASE2_TRANSITION') {
      this.morwennaTimer -= delta;
      this.morwennaGroup.position.y = 1.35 + Math.sin(this.clock.elapsedTime * 12) * 0.15;
      this.morwennaCrucibleLight.intensity = 6.0 + Math.sin(this.clock.elapsedTime * 30) * 2.5;

      if (this.morwennaFlameWingsGroup) {
        this.morwennaFlameWingsGroup.rotation.y = Math.sin(this.clock.elapsedTime * 10) * 0.45;
      }
      if (this.morwennaThornHaloMesh) {
        this.morwennaThornHaloMesh.rotation.z += delta * 6;
      }

      if (this.morwennaTimer <= 0) {
        this.morwennaState = 'CHASE';
        this.spawnFloatingText(this.morwennaGroup.position, '⚔ ¡COMIENZA EL FRENESÍ!', '#ff4400');
      }
      return;
    }

    // Phase 2 continuous cosmetic animations (Wings & Thorn Halo)
    if (this.morwennaPhase === 2) {
      if (this.morwennaFlameWingsGroup) {
        this.morwennaFlameWingsGroup.rotation.y = Math.sin(this.clock.elapsedTime * 6) * 0.28;
      }
      if (this.morwennaThornHaloMesh) {
        this.morwennaThornHaloMesh.rotation.z += delta * 2.5;
      }
    }

    // Orient toward player
    const toPlayer = this.playerGroup.position.clone().sub(this.morwennaGroup.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    if (dist > 0.1) {
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      this.morwennaGroup.rotation.y = THREE.MathUtils.lerp(this.morwennaGroup.rotation.y, targetAngle, 0.08);
    }

    // Floating levitation bobbing
    this.morwennaGroup.position.y = Math.sin(this.clock.elapsedTime * 3) * 0.12;

    if (this.morwennaState === 'CHASE') {
      this.morwennaWarningMesh.visible = false;
      this.morwennaCrucibleLight.intensity = this.morwennaPhase === 2 ? 5.5 : 3.2;

      const chaseSpeed = this.morwennaPhase === 2 ? 3.4 : 2.2;

      // In Phase 2: chance to cast Flame Geysers at range!
      if (this.morwennaPhase === 2 && dist > 4.5 && Math.random() < 0.015) {
        this.morwennaAttackPattern = 'FLAME_GEYSERS';
        this.morwennaState = 'WINDUP';
        this.morwennaTimer = 0.6;
        this.morwennaWarningMesh.visible = true;
        this.audio.playSfx('warning');
        return;
      }

      if (dist > 3.0) {
        toPlayer.normalize();
        this.morwennaGroup.position.add(toPlayer.multiplyScalar(chaseSpeed * delta));
        this.morwennaGroup.position.x = THREE.MathUtils.clamp(this.morwennaGroup.position.x, -5, 5);
        this.morwennaGroup.position.z = THREE.MathUtils.clamp(this.morwennaGroup.position.z, -23, -3);
      } else {
        // Choose attack pattern based on phase
        if (this.morwennaPhase === 1) {
          this.morwennaAttackPattern = 'CRUCIBLE_STRIKE';
        } else {
          const roll = Math.random();
          if (roll < 0.45) {
            this.morwennaAttackPattern = 'WHIRLWIND';
          } else if (roll < 0.75) {
            this.morwennaAttackPattern = 'LUNGE';
          } else {
            this.morwennaAttackPattern = 'CRUCIBLE_STRIKE';
          }
        }

        this.morwennaState = 'WINDUP';
        this.morwennaTimer = this.morwennaAttackPattern === 'WHIRLWIND' ? 0.75 : 0.6;
        this.morwennaWarningMesh.visible = true;
        this.audio.playSfx('warning');
      }
    } else if (this.morwennaState === 'WINDUP') {
      this.morwennaTimer -= delta;
      this.morwennaWarningMesh.rotation.y += delta * 10;
      this.morwennaWarningMesh.visible = Math.floor(this.clock.elapsedTime * 20) % 2 === 0;
      this.morwennaCrucibleLight.intensity = 5.0 + Math.sin(this.clock.elapsedTime * 25) * 2.5;

      if (this.morwennaTimer <= 0) {
        this.morwennaState = 'ATTACK';
        this.morwennaWarningMesh.visible = false;
        this.executeMorwennaAttack();
      }
    } else if (this.morwennaState === 'RECOVERY') {
      this.morwennaTimer -= delta;
      this.morwennaCrucibleLight.intensity = 2.4;
      if (this.morwennaTimer <= 0) {
        this.morwennaState = 'CHASE';
      }
    } else if (this.morwennaState === 'STUNNED') {
      this.morwennaTimer -= delta;
      this.morwennaWarningMesh.visible = false;
      this.morwennaGroup.rotation.z = Math.sin(this.clock.elapsedTime * 25) * 0.15;
      this.morwennaCrucibleLight.intensity = 1.0;
      if (this.morwennaTimer <= 0) {
        this.morwennaGroup.rotation.z = 0;
        this.morwennaState = 'RECOVERY';
        this.morwennaTimer = 0.5;
      }
    }
  }

  private triggerMorwennaPhase2(): void {
    if (this.morwennaPhase === 2) return;
    this.morwennaPhase = 2;
    this.morwennaState = 'PHASE2_TRANSITION';
    this.morwennaTimer = 2.4;

    // Visual transformations
    if (this.morwennaFlameWingsGroup) this.morwennaFlameWingsGroup.visible = true;
    if (this.morwennaFlameSwordMesh) this.morwennaFlameSwordMesh.visible = true;
    if (this.morwennaThornHaloMesh) this.morwennaThornHaloMesh.visible = true;

    if (this.morwennaEyeL && this.morwennaEyeR) {
      (this.morwennaEyeL.material as THREE.MeshBasicMaterial).color.setHex(0xffffee);
      (this.morwennaEyeR.material as THREE.MeshBasicMaterial).color.setHex(0xffffee);
    }

    this.morwennaCrucibleLight.color.setHex(0xff2200);
    this.morwennaCrucibleLight.intensity = 7.0;
    this.morwennaCrucibleLight.distance = 18;

    // Repel player with flame burst shockwave
    const pushDir = this.playerGroup.position.clone().sub(this.morwennaGroup.position).normalize();
    pushDir.y = 0;
    this.playerVelocity.copy(pushDir.multiplyScalar(12));

    this.audio.playFinisherSound(true);
    this.audio.playSfx('warning');

    this.spawnFloatingText(this.morwennaGroup.position, '🔥 ¡FASE 2: PIRA DEL ABISMO DESATADA! 🔥', '#ff3300');
    this.spawnFloatingText(this.playerGroup.position, '⚠ ¡ONDA EXPANSIVA DE FUEGO!', '#ffaa44');

    this.setDialogueToast(
      'Madre Morwenna',
      '«¡Insolente! ¡El Crisol juzgará tu alma con el fuego sagrado de la Pira! ¡NO QUEDARÁ NI CENIZA DE TI!»',
      '/assets/concepts/concept_morwenna_phase2.png',
      '#ff3300'
    );

    if (this.morwennaHpBarContainer) {
      this.morwennaHpBarContainer.style.borderColor = '#ff3300';
      this.morwennaHpBarContainer.style.boxShadow = '0 0 25px rgba(255, 51, 0, 0.85)';
      const title = this.morwennaHpBarContainer.querySelector('div') as HTMLDivElement;
      if (title) {
        title.innerHTML = '🔥 MADRE MORWENNA — FASE 2: FRENESÍ DE LA PIRA 🔥';
        title.style.color = '#ffaa44';
      }
    }
  }

  private handleMorwennaDefeat(): void {
    if (this.morwennaState === 'DEAD') return;
    this.morwennaState = 'DEAD';
    this.triggerHolyFlash(1.0);
    this.spawnFloatingText(this.morwennaGroup.position, '👑 ¡MADRE MORWENNA PURIFICADA! (+350 EXP) 👑', '#ffd700');
    this.spawnFloatingText(this.playerGroup.position, '🗝️ ¡LLAVE DE LAS CRIPTAS OBTENIDA!', '#00e5ff');
    this.audio.playFinisherSound(true);

    // H04: Claim rewards through MorwennaEncounter idempotently
    this.morwennaEncounter.claimRewards(this.inventory, this.progression);

    // Automatically open the cemetery gate
    this.openCemeteryGate();

    if (this.morwennaHpBarContainer) {
      this.morwennaHpBarContainer.style.borderColor = '#ffd700';
      const title = this.morwennaHpBarContainer.querySelector('div') as HTMLDivElement;
      if (title) title.innerText = '👑 MADRE MORWENNA — ¡PURIFICADA! 👑';
    }

    this.setDialogueToast(
      'Padre Cedric',
      '«¡La luz ha vencido sobre el fuego de la Pira! La verja de hierro del cementerio antiguo al norte se ha abierto. Ten cuidado con los penitentes de las criptas.»',
      '/assets/concepts/concept_cedric.png',
      '#ffd700'
    );

    this.updateHUD();
  }

  private executeMorwennaAttack(): void {
    const dist = this.playerGroup.position.distanceTo(this.morwennaGroup.position);

    if (this.morwennaAttackPattern === 'WHIRLWIND') {
      // 360-degree Whirlwind Attack
      this.spawnFloatingText(this.morwennaGroup.position, '🌪️ ¡TORBELLINO DE LA PIRA!', '#ff3300');
      this.audio.playSfx('dodge');

      if (dist <= 4.4) {
        if (this.playerStats.isDodging) {
          this.spawnFloatingText(this.playerGroup.position, '¡ESQUIVA DE TORBELLINO!', '#88ffaa');
        } else {
          const dmg = this.calculateIncomingDamage(34, 14);
          this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
          this.audio.playCombatHit(true);
          this.spawnFloatingText(this.playerGroup.position, `-${dmg} (TORBELLINO ÍGNEO)`, '#ff3344');
          // Knockback player away from Morwenna
          const push = this.playerGroup.position.clone().sub(this.morwennaGroup.position).normalize();
          this.playerVelocity.copy(push.multiplyScalar(8));
          this.updateHUD();
        }
      }

      this.morwennaState = 'RECOVERY';
      this.morwennaTimer = 0.95;
      return;
    }

    if (this.morwennaAttackPattern === 'FLAME_GEYSERS') {
      // Spawn 3 Flame Geysers at Player's area
      this.spawnFloatingText(this.morwennaGroup.position, '🌋 ¡COLUMNAS DEL CRISOL!', '#ff5500');
      this.audio.playSfx('warning');

      const pPos = this.playerGroup.position;
      this.spawnFlameGeyser(pPos.clone());
      this.spawnFlameGeyser(pPos.clone().add(new THREE.Vector3(1.8, 0, 1.2)));
      this.spawnFlameGeyser(pPos.clone().add(new THREE.Vector3(-1.8, 0, -1.2)));

      this.morwennaState = 'RECOVERY';
      this.morwennaTimer = 1.0;
      return;
    }

    if (this.morwennaAttackPattern === 'LUNGE') {
      // Fiery Lunge Forward
      this.spawnFloatingText(this.morwennaGroup.position, '⚡ ¡EMBESTIDA INFERNAL!', '#ffaa22');
      const lungeDir = this.playerGroup.position.clone().sub(this.morwennaGroup.position).normalize();
      this.morwennaGroup.position.add(lungeDir.multiplyScalar(4.5));

      const newDist = this.playerGroup.position.distanceTo(this.morwennaGroup.position);
      if (newDist <= 3.2) {
        const parryWindow = 280 + this.inventory.getParryBonusMs();
        const isParry = this.playerStats.isGuarding && (performance.now() - this.lastGuardTime) <= parryWindow;
        if (isParry) {
          this.audio.playSfx('parry');
          this.triggerHolyFlash(0.85);
          this.morwennaState = 'STUNNED';
          this.morwennaTimer = 2.6 * this.getStaggerMultiplier();
          this.spawnFloatingText(this.playerGroup.position, '¡PARRY DE EMBESTIDA!', '#66ccff');
          this.spawnFloatingText(this.morwennaGroup.position, '⚡ ¡ATURDIDA! [E] ¡REMATAR!', '#ffd700');
          return;
        }

        if (this.playerStats.isDodging) {
          this.spawnFloatingText(this.playerGroup.position, '¡ESQUIVA PERFECTA!', '#88ffaa');
        } else {
          const dmg = this.calculateIncomingDamage(32, 10);
          this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
          this.audio.playCombatHit(true);
          this.spawnFloatingText(this.playerGroup.position, `-${dmg} (EMBESTIDA)`, '#ff3344');
          this.updateHUD();
        }
      }

      this.morwennaState = 'RECOVERY';
      this.morwennaTimer = 0.85;
      return;
    }

    // Default: CRUCIBLE_STRIKE
    if (dist <= 3.8) {
      // Check for Parry
      const parryWindow = 280 + this.inventory.getParryBonusMs();
      const isParry = this.playerStats.isGuarding && (performance.now() - this.lastGuardTime) <= parryWindow;
      if (isParry) {
        this.audio.playSfx('parry');
        this.triggerHolyFlash(0.85);
        this.morwennaState = 'STUNNED';
        this.morwennaTimer = 2.4 * this.getStaggerMultiplier(); // Stunned window for Finisher
        const msg = this.inventory.getParryBonusMs() > 0 ? '¡PARRY DE CRISOL SAGRADO (+70ms)!' : '¡PARRY DE CRISOL!';
        this.spawnFloatingText(this.playerGroup.position, msg, '#66ccff');
        this.spawnFloatingText(this.morwennaGroup.position, '⚡ ¡ATURDIDA! [E] ¡REMATAR!', '#ffd700');
        return;
      }

      // Check for Dodge
      if (this.playerStats.isDodging) {
        this.spawnFloatingText(this.playerGroup.position, '¡ESQUIVA PERFECTA!', '#88ffaa');
        this.morwennaState = 'RECOVERY';
        this.morwennaTimer = 0.8;
        return;
      }

      // Impact damage
      const dmg = this.calculateIncomingDamage(28, 8);
      this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
      this.audio.playCombatHit(true);
      this.spawnFloatingText(this.playerGroup.position, `-${dmg} (FUEGO SAGRADO)`, '#ff3344');
      this.updateHUD();
    }

    this.morwennaState = 'RECOVERY';
    this.morwennaTimer = 0.8;
  }

  // =========================================================================
  // FLAME GEYSER HAZARDS (MORWENNA PHASE 2)
  // =========================================================================
  private updateFlameGeysers(delta: number): void {
    for (let i = this.flameGeysers.length - 1; i >= 0; i--) {
      const g = this.flameGeysers[i];
      g.timer -= delta;

      if (!g.hasErupted) {
        // Pulse warning marker on floor
        const pulse = 1.0 + Math.sin(this.clock.elapsedTime * 20) * 0.2;
        g.markerMesh.scale.set(pulse, pulse, 1);

        if (g.timer <= 0) {
          g.hasErupted = true;
          (g.pillarMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
          this.audio.playCombatHit(true);

          // Check player collision
          const dPlayer = this.playerGroup.position.distanceTo(g.pos);
          if (dPlayer <= 1.4) {
            const dmg = this.calculateIncomingDamage(26, 8);
            this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
            this.audio.playCombatHit(true);
            this.spawnFloatingText(this.playerGroup.position, `-${dmg} (COLUMNA DE FUEGO)`, '#ff4400');
            this.updateHUD();
          }
        }
      } else {
        // Fade out erupted flame pillar
        const mat = g.pillarMesh.material as THREE.MeshBasicMaterial;
        mat.opacity -= delta * 2.5;
        g.pillarMesh.scale.y += delta * 2;
        if (mat.opacity <= 0) {
          this.scene.remove(g.markerMesh);
          this.scene.remove(g.pillarMesh);
          this.flameGeysers.splice(i, 1);
        }
      }
    }
  }

  private spawnFlameGeyser(pos: THREE.Vector3): void {
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xff3300, side: THREE.DoubleSide });
    const markerGeo = new THREE.RingGeometry(0.3, 1.2, 16);
    const markerMesh = new THREE.Mesh(markerGeo, markerMat);
    markerMesh.rotation.x = -Math.PI / 2;
    markerMesh.position.set(pos.x, 0.03, pos.z);
    this.scene.add(markerMesh);

    const pillarMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0 });
    const pillarGeo = new THREE.CylinderGeometry(0.7, 0.9, 4.0, 8);
    const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
    pillarMesh.position.set(pos.x, 2.0, pos.z);
    this.scene.add(pillarMesh);

    this.flameGeysers.push({
      markerMesh,
      pillarMesh,
      pos: pos.clone(),
      timer: 0.85,
      hasErupted: false
    });
  }

  // =========================================================================
  // ENEMY 4: CRYPT PENITENT SKELETON PATROL & COMBAT
  // =========================================================================
  private updateSkeleton(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'surface') return;
    if (this.skeletonState === 'DEAD') {
      this.skeletonGroup.position.y = -0.3;
      return;
    }
    if (!this.isGameplayActive()) return;

    const toPlayer = this.playerGroup.position.clone().sub(this.skeletonGroup.position);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    // Orient towards movement or player
    if (this.skeletonState === 'CHASE' || this.skeletonState === 'WINDUP' || this.skeletonState === 'ATTACK') {
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      this.skeletonGroup.rotation.y = THREE.MathUtils.lerp(this.skeletonGroup.rotation.y, targetAngle, 0.1);
    }

    // Floating idle breathing
    this.skeletonGroup.position.y = Math.sin(this.clock.elapsedTime * 2.8) * 0.06;

    if (this.skeletonState === 'PATROL') {
      this.skeletonWarningMesh.visible = false;
      const targetWp = this.skeletonWaypoints[this.skeletonCurrentWaypointIndex];
      const toWp = targetWp.clone().sub(this.skeletonGroup.position);
      toWp.y = 0;
      const distWp = toWp.length();

      if (distWp < 0.6) {
        this.skeletonCurrentWaypointIndex = (this.skeletonCurrentWaypointIndex + 1) % this.skeletonWaypoints.length;
      } else {
        toWp.normalize();
        this.skeletonGroup.position.add(toWp.multiplyScalar(1.4 * delta));
        const moveAngle = Math.atan2(toWp.x, toWp.z);
        this.skeletonGroup.rotation.y = THREE.MathUtils.lerp(this.skeletonGroup.rotation.y, moveAngle, 0.08);
      }

      // Detection: player must be past z <= -23 (in the cemetery) and within 8.5m
      if (this.playerGroup.position.z <= -23 && distToPlayer < 8.5) {
        this.skeletonState = 'ALERT';
        this.skeletonTimer = 0.55;
        this.audio.playSfx('warning');
        this.spawnFloatingText(this.skeletonGroup.position, '⚠️ ¡PENITENTE ALERTA!', '#00e5ff');
      }
    } else if (this.skeletonState === 'ALERT') {
      this.skeletonTimer -= delta;
      this.skeletonWarningMesh.visible = true;
      if (this.skeletonTimer <= 0) {
        this.skeletonState = 'CHASE';
        this.skeletonWarningMesh.visible = false;
      }
    } else if (this.skeletonState === 'CHASE') {
      this.skeletonWarningMesh.visible = false;

      // If player flees past z > -22, skeleton returns to patrol
      if (this.playerGroup.position.z > -22 || distToPlayer > 12.0) {
        this.skeletonState = 'PATROL';
        return;
      }

      if (distToPlayer > 2.5) {
        toPlayer.normalize();
        this.skeletonGroup.position.add(toPlayer.multiplyScalar(2.6 * delta));
      } else {
        // Start attack windup
        this.skeletonState = 'WINDUP';
        this.skeletonTimer = 0.6;
        this.skeletonWarningMesh.visible = true;
        this.audio.playSfx('warning');
      }
    } else if (this.skeletonState === 'WINDUP') {
      this.skeletonTimer -= delta;
      this.skeletonWarningMesh.rotation.y += delta * 8;
      this.skeletonWarningMesh.visible = Math.floor(this.clock.elapsedTime * 20) % 2 === 0;

      // Raise rusted claymore
      if (this.skeletonSwordMesh) {
        this.skeletonSwordMesh.rotation.x = -1.2;
      }

      if (this.skeletonTimer <= 0) {
        this.skeletonState = 'ATTACK';
        this.skeletonWarningMesh.visible = false;
        this.executeSkeletonAttack();
      }
    } else if (this.skeletonState === 'RECOVERY') {
      this.skeletonTimer -= delta;
      if (this.skeletonSwordMesh) {
        this.skeletonSwordMesh.rotation.x = THREE.MathUtils.lerp(this.skeletonSwordMesh.rotation.x, 0, 0.1);
      }
      if (this.skeletonTimer <= 0) {
        this.skeletonState = 'CHASE';
      }
    } else if (this.skeletonState === 'STUNNED') {
      this.skeletonTimer -= delta;
      this.skeletonWarningMesh.visible = false;
      this.skeletonGroup.rotation.z = Math.sin(this.clock.elapsedTime * 25) * 0.15;
      if (this.skeletonTimer <= 0) {
        this.skeletonGroup.rotation.z = 0;
        this.skeletonState = 'RECOVERY';
        this.skeletonTimer = 0.5;
      }
    }
  }

  private executeSkeletonAttack(): void {
    const dist = this.playerGroup.position.distanceTo(this.skeletonGroup.position);
    if (this.skeletonSwordMesh) {
      this.skeletonSwordMesh.rotation.x = 0.8;
    }

    if (dist <= 3.2) {
      const parryWindow = 280 + this.inventory.getParryBonusMs();
      const isParry = this.playerStats.isGuarding && (performance.now() - this.lastGuardTime) <= parryWindow;
      if (isParry) {
        this.audio.playSfx('parry');
        this.triggerHolyFlash(0.85);
        this.skeletonState = 'STUNNED';
        this.skeletonTimer = 2.4 * this.getStaggerMultiplier();
        this.spawnFloatingText(this.playerGroup.position, '¡PARRY DE ESPADÓN (+70ms)!', '#66ccff');
        this.spawnFloatingText(this.skeletonGroup.position, '⚡ ¡ATURDIDO! [E] ¡REMATAR!', '#ffd700');
        return;
      }

      if (this.playerStats.isDodging) {
        this.spawnFloatingText(this.playerGroup.position, '¡ESQUIVA PERFECTA!', '#88ffaa');
        this.skeletonState = 'RECOVERY';
        this.skeletonTimer = 0.8;
        return;
      }

      const dmg = this.calculateIncomingDamage(24, 7);
      this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
      this.audio.playCombatHit(true);
      this.spawnFloatingText(this.playerGroup.position, `-${dmg} (CORTE OXIDADO)`, '#ff6666');
      this.updateHUD();

      // Revive if fallen (H16 central policy)
      if (this.playerStats.health <= 0) {
        this.handlePlayerDefeatAndRespawn();
      }
    }

    this.skeletonState = 'RECOVERY';
    this.skeletonTimer = 0.75;
  }

  // =========================================================================
  // SUBTERRANEAN CRYPTS LOGIC (SPIKE TRAPS, INQUISITOR & AMBUSH)
  // =========================================================================
  private updateSpikeTraps(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'crypts_interior') return;

    const pPos = this.playerGroup.position;
    for (const st of this.spikeTraps) {
      st.trap.update(delta);

      // Step on detection
      const res = st.trap.stepOn(pPos.x, pPos.z);
      if (res.triggered) {
        const dmg = this.calculateIncomingDamage(res.damage, 10);
        this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
        this.audio.playSpikeTrap?.();
        this.spawnFloatingText(this.playerGroup.position, `-${dmg} (¡TRAMPA DE ESPINAS!)`, '#ff2255');
        this.updateHUD();

        if (this.playerStats.health <= 0) {
          this.handlePlayerDefeatAndRespawn();
          return;
        }
      }

      // Animate spikes
      const isUp = st.trap.state === 'TRIGGERED' || (st.trap.state === 'RESETTING' && st.trap.cooldownRemaining > 1.2);
      const targetY = isUp ? 0.45 : -0.35;
      for (const sm of st.spikeMeshes) {
        sm.position.y = THREE.MathUtils.lerp(sm.position.y, targetY, delta * 14.0);
      }
    }
  }

  private updateInquisitor(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'crypts_interior') return;
    if (this.inquisitorEncounter.isDefeated) {
      this.inquisitorGroup.position.y = -0.4;
      return;
    }
    if (!this.isGameplayActive()) return;

    if (this.inquisitorSpecialCooldown > 0) {
      this.inquisitorSpecialCooldown -= delta;
    }

    const toPlayer = this.playerGroup.position.clone().sub(this.inquisitorGroup.position);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    // Idle / Awake trigger
    if (this.inquisitorEncounter.state === 'DORMANT') {
      if (this.playerGroup.position.z <= -93) {
        this.inquisitorEncounter.awaken();
        this.inquisitorTimer = 0.65;
        this.inquisitorWarningMesh.visible = true;
        if (this.inquisitorHpBarContainer) {
          this.inquisitorHpBarContainer.style.display = 'block';
        }
        this.audio.playHolyCurse?.();
        this.spawnFloatingText(this.inquisitorGroup.position, '👑 ¡EL INQUISIDOR CAÍDO SE ALZA!', '#9b59b6');
        this.setDialogueToast(
          'El Inquisidor Caído',
          '«¿Quién osa profanar el reposo de los mártires? ¡Arrepentíos en la ceniza de San Jude!»',
          '/assets/icons/icon_crypt_key.png',
          '#9b59b6'
        );
      }
      return;
    }

    // Orient towards player
    if (this.inquisitorEncounter.state !== 'RECOVERY') {
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      this.inquisitorGroup.rotation.y = THREE.MathUtils.lerp(this.inquisitorGroup.rotation.y, targetAngle, 0.1);
    }

    if (this.inquisitorEncounter.state === 'ALERT') {
      this.inquisitorTimer -= delta;
      this.inquisitorWarningMesh.visible = Math.floor(this.clock.elapsedTime * 20) % 2 === 0;
      if (this.inquisitorTimer <= 0) {
        this.inquisitorEncounter.setState('CHASE');
        this.inquisitorWarningMesh.visible = false;
      }
    } else if (this.inquisitorEncounter.state === 'CHASE') {
      this.inquisitorWarningMesh.visible = false;
      this.inquisitorGroup.position.y = Math.sin(this.clock.elapsedTime * 2.5) * 0.05;

      if (distToPlayer > 2.6) {
        toPlayer.normalize();
        this.inquisitorGroup.position.add(toPlayer.multiplyScalar(2.3 * delta));
      } else {
        // Choose attack
        if (this.inquisitorSpecialCooldown <= 0 || Math.random() < 0.4) {
          // Telegraph ground slam AoE
          this.inquisitorEncounter.setState('SLAM_TELEGRAPH');
          this.inquisitorTimer = 0.85;
          this.inquisitorSpecialCooldown = 5.5;
          this.inquisitorWarningMesh.visible = true;
          this.inquisitorSlamTelegraphMesh.position.set(this.inquisitorGroup.position.x, 0.05, this.inquisitorGroup.position.z);
          this.inquisitorSlamTelegraphMesh.visible = true;
          this.audio.playHolyCurse?.();
          this.spawnFloatingText(this.inquisitorGroup.position, '⚠️ ¡GOLPE DEVASTADOR DE INQUISICIÓN!', '#ff1144');
        } else {
          // Melee swing
          this.inquisitorEncounter.setState('MELEE_ATTACK');
          this.inquisitorTimer = 0.55;
          this.inquisitorWarningMesh.visible = true;
          this.audio.playSfx('warning');
        }
      }
    } else if (this.inquisitorEncounter.state === 'SLAM_TELEGRAPH') {
      this.inquisitorTimer -= delta;
      this.inquisitorWarningMesh.rotation.y += delta * 8;
      const mat = this.inquisitorSlamTelegraphMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(this.clock.elapsedTime * 15) * 0.2;

      if (this.inquisitorTimer <= 0) {
        this.inquisitorEncounter.setState('SLAM_IMPACT');
        this.inquisitorWarningMesh.visible = false;
        this.inquisitorSlamTelegraphMesh.visible = false;
        this.audio.playMaceImpact?.();
        this.audio.playHolyCurse?.();

        this.camera.position.y += 0.25;

        // Evaluate hit
        const slamRes = this.inquisitorEncounter.evaluateSlam(distToPlayer, this.playerStats.isDodging);
        if (slamRes.hit) {
          const dmg = this.calculateIncomingDamage(slamRes.damage, 14);
          this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
          this.spawnFloatingText(this.playerGroup.position, `-${dmg} (¡SLAM DE INQUISICIÓN!)`, '#ff2255');
          const push = this.playerGroup.position.clone().sub(this.inquisitorGroup.position).normalize();
          this.playerVelocity.copy(push.multiplyScalar(8.5));
          this.updateHUD();

          if (this.playerStats.health <= 0) {
            this.handlePlayerDefeatAndRespawn();
            return;
          }
        } else if (this.playerStats.isDodging && distToPlayer <= CatacombInquisitor.SLAM_RADIUS) {
          this.spawnFloatingText(this.playerGroup.position, '¡ESQUIVA PERFECTA!', '#88ffaa');
        }

        this.inquisitorEncounter.setState('RECOVERY');
        this.inquisitorTimer = 1.3;
        this.inquisitorEncounter.isBlocking = false;
        this.spawnFloatingText(this.inquisitorGroup.position, '⚡ ¡DESPROTEGIDO! (+VULNERABLE)', '#ffd700');
      }
    } else if (this.inquisitorEncounter.state === 'MELEE_ATTACK') {
      this.inquisitorTimer -= delta;
      if (this.inquisitorTimer <= 0) {
        this.inquisitorWarningMesh.visible = false;
        if (distToPlayer <= 2.8) {
          if (this.playerStats.isDodging) {
            this.spawnFloatingText(this.playerGroup.position, '¡ESQUIVA PERFECTA!', '#88ffaa');
          } else {
            const parryWindow = 280 + this.inventory.getParryBonusMs();
            const isParry = this.playerStats.isGuarding && (performance.now() - this.lastGuardTime) <= parryWindow;
            if (isParry) {
              this.audio.playSfx('parry');
              this.triggerHolyFlash(0.85);
              this.inquisitorEncounter.setState('RECOVERY');
              this.inquisitorTimer = 2.0;
              this.inquisitorEncounter.isBlocking = false;
              this.spawnFloatingText(this.playerGroup.position, '¡PARRY DE MAZO (+70ms)!', '#66ccff');
              this.spawnFloatingText(this.inquisitorGroup.position, '⚡ ¡ATURDIDO! [E] ¡REMATAR!', '#ffd700');
              return;
            }

            const dmg = this.calculateIncomingDamage(CatacombInquisitor.MELEE_DAMAGE, 7);
            this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
            this.audio.playMaceImpact?.();
            this.spawnFloatingText(this.playerGroup.position, `-${dmg} (MAZO ESPINADO)`, '#ff4444');
            this.updateHUD();

            if (this.playerStats.health <= 0) {
              this.handlePlayerDefeatAndRespawn();
              return;
            }
          }
        }

        this.inquisitorEncounter.setState('RECOVERY');
        this.inquisitorTimer = 0.8;
      }
    } else if (this.inquisitorEncounter.state === 'RECOVERY') {
      this.inquisitorTimer -= delta;
      if (this.inquisitorTimer <= 0) {
        this.inquisitorEncounter.isBlocking = true;
        this.inquisitorEncounter.setState('CHASE');
      }
    }
  }

  private updateCryptAmbush(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'crypts_interior') return;
    if (!this.cryptAmbushAwakened || this.cryptAmbushDead) return;
    if (!this.isGameplayActive()) return;

    const toPlayer = this.playerGroup.position.clone().sub(this.cryptAmbushSkeletonGroup.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
    this.cryptAmbushSkeletonGroup.rotation.y = THREE.MathUtils.lerp(this.cryptAmbushSkeletonGroup.rotation.y, targetAngle, 0.1);
    this.cryptAmbushSkeletonGroup.position.y = Math.sin(this.clock.elapsedTime * 2.8) * 0.05;

    if (dist > 2.2) {
      toPlayer.normalize();
      this.cryptAmbushSkeletonGroup.position.add(toPlayer.multiplyScalar(2.5 * delta));
    } else {
      if (this.cryptAmbushTimer > 0) {
        this.cryptAmbushTimer -= delta;
      } else {
        this.cryptAmbushTimer = 1.2;
        if (this.playerStats.isDodging) {
          this.spawnFloatingText(this.playerGroup.position, '¡ESQUIVA PERFECTA!', '#88ffaa');
        } else {
          const dmg = this.calculateIncomingDamage(18, 5);
          this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
          this.audio.playCombatHit(false);
          this.spawnFloatingText(this.playerGroup.position, `-${dmg} (CORTE DE SOMBRA)`, '#ff6666');
          this.updateHUD();

          if (this.playerStats.health <= 0) {
            this.handlePlayerDefeatAndRespawn();
          }
        }
      }
    }
  }

  private toggleCameraMode(): void {
    this.cameraMode = this.cameraMode === 'isometric' ? 'third_person' : 'isometric';
    if (this.cameraMode === 'third_person') {
      this.cameraYaw = this.playerGroup.rotation.y;
      this.targetCameraYaw = this.playerGroup.rotation.y;
      this.currentCameraLook.copy(this.targetCameraLook);
    }
  }

  // =========================================================================
  // MAIN LOOP & LOGIC
  // =========================================================================
  private animate = (): void => {
    if (!this.isRunning) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updatePlayer(delta);
    this.updateEnemy(delta);
    this.updateCultist(delta);
    this.updateZealot(delta);
    this.updateSkeleton(delta);
    this.updateBossMorwenna(delta);
    this.updateFlameGeysers(delta);
    this.updateProjectiles(delta);
    this.updateDebris(delta);
    this.updateCauldron(delta);
    this.updateSpikeTraps(delta);
    this.updateInquisitor(delta);
    this.updateCryptAmbush(delta);
    this.updateRootProwler(delta);
    this.updateCrucibleGuardian(delta);
    this.updateCaptainVane(delta);
    this.updateRexMalphas(delta);
    this.updateAstarothTitan(delta);
    this.updateProximityInteractions();
    this.updateCamera(delta);
    this.updateFlickeringLights(delta);
    this.updateEmbers(delta);
    this.updateFloatingTexts(delta);
    this.checkShalemProximity();
    this.updateBurnEffects(delta);
    this.updateScreenPostFx(delta);

    // Swing open cemetery gates smoothly if unlocked
    if (this.cemeteryGateOpen && this.cemeteryGateLeft && this.cemeteryGateRight) {
      this.cemeteryGateLeft.rotation.y = THREE.MathUtils.lerp(this.cemeteryGateLeft.rotation.y, -Math.PI * 0.45, 0.05);
      this.cemeteryGateRight.rotation.y = THREE.MathUtils.lerp(this.cemeteryGateRight.rotation.y, Math.PI * 0.45, 0.05);
    }

    if (this.wardBarrierMesh && this.wardBarrierMesh.visible) {
      this.wardBarrierMesh.rotation.y += delta * 2.5;
      this.wardBarrierMesh.rotation.x += delta * 1.5;
    }

    // Oscillate willow spores in Black Willow Forest
    if (this.willowSporesPoints && this.dungeonAreaManager.currentArea === 'black_willow_forest') {
      const posAttr = this.willowSporesPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const t = this.clock.elapsedTime;
      for (let i = 0; i < posAttr.count; i++) {
        const yOrig = posAttr.getY(i);
        posAttr.setY(i, yOrig + Math.sin(t * 1.5 + i) * 0.005);
      }
      posAttr.needsUpdate = true;
    }

    // Float & rotate willow relic over altar if still present
    if (this.willowRelicMeshGroup && this.willowRelicMeshGroup.visible) {
      this.willowRelicMeshGroup.rotation.y += delta * 1.2;
      this.willowRelicMeshGroup.position.y = 1.7 + Math.sin(this.clock.elapsedTime * 2.5) * 0.08;
    }

    // Acts II - V Atmospheric Props Animations
    if (this.willowBirdMesh && this.willowBirdMesh.visible && this.dungeonAreaManager.currentArea === 'belltower_summit') {
      this.willowBirdMesh.rotation.y += delta * 1.1;
      this.willowBirdMesh.position.y = 0.65 + Math.sin(this.clock.elapsedTime * 2.4) * 0.06;
    }
    if (this.crucibleSlagLight && !this.crucibleGuardianEncounter.isDefeated && this.dungeonAreaManager.currentArea === 'belltower_summit') {
      this.crucibleSlagLight.intensity = 3.8 + Math.sin(this.clock.elapsedTime * 7.5) * 0.6;
    }
    if (this.dawnGreyTearMesh && this.dawnGreyTearMesh.visible && this.dungeonAreaManager.currentArea === 'inverted_cathedral') {
      this.dawnGreyTearMesh.position.y = 1.4 + Math.sin(this.clock.elapsedTime * 3.0) * 0.12;
    }
    if (this.astarothCoronaMesh && this.dungeonAreaManager.currentArea === 'inverted_cathedral') {
      this.astarothCoronaMesh.rotation.z += delta * (this.astarothEncounter.isDefeated ? 0.2 : 1.4);
    }

    // Update Dagger Vortex if active
    if (this.isDaggerVortexActive && this.daggerVortexMeshGroup) {
      this.daggerVortexTimer -= delta;
      this.daggerVortexMeshGroup.visible = true;
      this.daggerVortexMeshGroup.position.copy(this.playerGroup.position);
      this.daggerVortexMeshGroup.rotation.y += delta * 18.0;

      if (this.daggerVortexTimer <= 0) {
        this.isDaggerVortexActive = false;
        this.daggerVortexMeshGroup.visible = false;
      }
    }

    // Dagger vortex cooldown tick
    if (this.daggerVortexCooldown > 0) {
      this.daggerVortexCooldown = Math.max(0, this.daggerVortexCooldown - delta);
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private updateBurnEffects(delta: number): void {
    if (this.activeBurnEffects.length === 0) return;

    for (let i = this.activeBurnEffects.length - 1; i >= 0; i--) {
      const burn = this.activeBurnEffects[i];
      burn.timer -= delta;
      if (burn.timer <= 0) {
        burn.timer = 0.5;
        burn.ticksLeft--;

        this.applyBurnTick(burn.targetId, burn.dmgPerTick);

        if (burn.ticksLeft <= 0) {
          this.activeBurnEffects.splice(i, 1);
        }
      }
    }
  }

  private applyBurnTick(targetId: string, dmg: number): void {
    if (targetId === 'hound' && this.enemyState !== 'DEAD') {
      this.enemyHealth = Math.max(0, this.enemyHealth - dmg);
      this.spawnFloatingText(this.enemyGroup.position, `🔥 -${dmg}`, '#ff7722');
      if (this.enemyHealth <= 0) {
        this.enemyState = 'DEAD';
        this.spawnFloatingText(this.enemyGroup.position, '¡PURIFICADO POR FUEGO! (+40 EXP)', '#ffd700');
        this.audio.playFinisherSound(true);
        this.enemyGroup.position.y = -0.3;
        this.awardEnemyKillRewards('hound', false);
      }
      this.updateHUD();
    } else if (targetId === 'cultist' && this.cultistState !== 'DEAD') {
      this.cultistHealth = Math.max(0, this.cultistHealth - dmg);
      this.spawnFloatingText(this.cultistGroup.position, `🔥 -${dmg}`, '#ff7722');
      if (this.cultistHealth <= 0) {
        this.cultistState = 'DEAD';
        this.spawnFloatingText(this.cultistGroup.position, '¡CULTISTA CONSUMIDO! (+60 EXP)', '#ffd700');
        this.audio.playFinisherSound(true);
        this.cultistGroup.position.y = -0.3;
        this.cultistCenserLight.intensity = 0;
        this.awardEnemyKillRewards('cultist', false);
      }
      this.updateHUD();
    } else if (targetId === 'zealot' && this.zealotState !== 'DEAD') {
      this.zealotHealth = Math.max(0, this.zealotHealth - dmg);
      this.spawnFloatingText(this.zealotGroup.position, `🔥 -${dmg}`, '#ff7722');
      if (this.zealotHealth <= 0) {
        this.zealotState = 'DEAD';
        this.spawnFloatingText(this.zealotGroup.position, '¡FLAGELANTE CONSUMIDO! (+80 EXP)', '#ffd700');
        this.audio.playFinisherSound(true);
        this.zealotGroup.position.y = -0.3;
        this.awardEnemyKillRewards('zealot', false);
      }
      this.updateHUD();
    } else if (targetId === 'skeleton' && this.skeletonState !== 'DEAD') {
      this.skeletonHealth = Math.max(0, this.skeletonHealth - dmg);
      this.spawnFloatingText(this.skeletonGroup.position, `🔥 -${dmg}`, '#ff7722');
      if (this.skeletonHealth <= 0) {
        this.skeletonState = 'DEAD';
        this.spawnFloatingText(this.skeletonGroup.position, '¡PENITENTE CALCINADO! (+100 EXP)', '#00e5ff');
        this.audio.playFinisherSound(true);
        this.skeletonGroup.position.y = -0.3;
        this.awardEnemyKillRewards('skeleton', false);
      }
      this.updateHUD();
    } else if (targetId === 'morwenna' && this.morwennaState !== 'DEAD' && this.morwennaState !== 'DORMANT') {
      const res = this.morwennaEncounter.takeDamage(dmg);
      this.morwennaHealth = res.currentHealth;
      this.spawnFloatingText(this.morwennaGroup.position, `🔥 -${dmg}`, '#ff7722');
      if (res.transitionedToPhase2) {
        this.triggerMorwennaPhase2();
      } else if (res.defeated) {
        this.handleMorwennaDefeat();
      }
      this.updateHUD();
    } else if (targetId === 'inquisitor' && !this.inquisitorEncounter.isDefeated) {
      const hitRes = this.inquisitorEncounter.takeDamage(dmg, false);
      this.spawnFloatingText(this.inquisitorGroup.position, `🔥 -${hitRes.actualDamage}`, '#ff7722');
      if (this.inquisitorHpBarFill) {
        this.inquisitorHpBarFill.style.width = `${Math.max(0, (this.inquisitorEncounter.health / this.inquisitorEncounter.maxHealth) * 100)}%`;
      }
      if (hitRes.defeated) {
        this.handleInquisitorDefeat();
      }
      this.updateHUD();
    } else if (targetId === 'crypt_ambush' && this.cryptAmbushAwakened && !this.cryptAmbushDead) {
      this.cryptAmbushHp = Math.max(0, this.cryptAmbushHp - dmg);
      this.spawnFloatingText(this.cryptAmbushSkeletonGroup.position, `🔥 -${dmg}`, '#ff7722');
      if (this.cryptAmbushHp <= 0) {
        this.cryptAmbushDead = true;
        this.cryptAmbushSkeletonGroup.position.y = -0.3;
        this.spawnFloatingText(this.cryptAmbushSkeletonGroup.position, '¡PENITENTE PURIFICADO! (+80 EXP)', '#00e5ff');
        this.awardEnemyKillRewards('crypt_ambush', false);
      }
      this.updateHUD();
    } else if (targetId === 'root_prowler' && !this.rootProwlerEncounter.isDefeated) {
      const hitRes = this.rootProwlerEncounter.takeDamage(dmg, true);
      this.spawnFloatingText(this.rootProwlerGroup.position, `🔥 -${hitRes.actualDamage} (FUEGO)`, '#ff7722');
      if (this.rootProwlerHpBarFill) {
        this.rootProwlerHpBarFill.style.width = `${Math.max(0, (this.rootProwlerEncounter.health / this.rootProwlerEncounter.maxHealth) * 100)}%`;
      }
      if (hitRes.defeated) {
        this.handleRootProwlerDefeat();
      }
      this.updateHUD();
    } else if (targetId === 'crucible_guardian' && !this.crucibleGuardianEncounter.isDefeated) {
      const hitRes = this.crucibleGuardianEncounter.takeDamage(dmg, false);
      this.spawnFloatingText(this.crucibleGuardianGroup.position, `🔥 -${hitRes.actualDamage}`, '#ff7722');
      if (hitRes.defeated) this.handleCrucibleGuardianDefeat();
      this.updateHUD();
    } else if (targetId === 'captain_vane' && !this.captainVaneEncounter.isDefeated) {
      const hitRes = this.captainVaneEncounter.takeDamage(dmg, false, true);
      this.spawnFloatingText(this.captainVaneGroup.position, `🔥 -${hitRes.actualDamage}`, '#ff7722');
      if (hitRes.defeated) this.handleCaptainVaneDefeat();
      this.updateHUD();
    } else if (targetId === 'rex_malphas' && !this.rexMalphasEncounter.isDefeated) {
      const hitRes = this.rexMalphasEncounter.takeDamage(dmg);
      this.spawnFloatingText(this.rexMalphasGroup.position, `🔥 -${hitRes.actualDamage}`, '#ff7722');
      if (hitRes.transitionedToPhase2) this.triggerRexMalphasPhase2();
      else if (hitRes.defeated) this.handleRexMalphasDefeat();
      this.updateHUD();
    } else if (targetId === 'astaroth' && !this.astarothEncounter.isDefeated) {
      const hitRes = this.astarothEncounter.takeDamage(dmg, false);
      this.spawnFloatingText(this.astarothGroup.position, `🔥 -${hitRes.actualDamage}`, '#ff7722');
      if (hitRes.defeated) this.handleAstarothDefeat();
      this.updateHUD();
    }
  }

  private updateScreenPostFx(delta: number): void {
    // 1. Damage vignette decay
    if (this.damageVignetteEl) {
      this.damageVignetteOpacity = Math.max(0, this.damageVignetteOpacity - delta * 1.8);
      this.damageVignetteEl.style.opacity = this.damageVignetteOpacity.toFixed(2);
    }

    // 2. Holy flash decay
    if (this.holyFlashEl) {
      this.holyFlashOpacity = Math.max(0, this.holyFlashOpacity - delta * 2.2);
      this.holyFlashEl.style.opacity = this.holyFlashOpacity.toFixed(2);
    }

    // 3. Low HP Agony Heartbeat (HP < 30%)
    if (this.playerStats.health > 0 && this.playerStats.health < this.playerStats.maxHealth * 0.3) {
      const now = performance.now() / 1000;
      if (now - this.lastHeartbeatTime > 1.1) {
        this.lastHeartbeatTime = now;
        this.audio.playHeartbeat?.();
        this.damageVignetteOpacity = Math.max(this.damageVignetteOpacity, 0.42);
      }
    }

    // 4. Camera Screen Trauma / Shake
    if (this.screenTrauma > 0) {
      this.screenTrauma = Math.max(0, this.screenTrauma - delta * 2.0);
      const shakeAmount = this.screenTrauma * this.screenTrauma * 0.16;
      this.camera.position.x += (Math.random() - 0.5) * shakeAmount;
      this.camera.position.y += (Math.random() - 0.5) * shakeAmount;
      this.camera.position.z += (Math.random() - 0.5) * shakeAmount;
    }
  }

  public triggerDamageVignette(severity = 0.8): void {
    this.damageVignetteOpacity = Math.max(this.damageVignetteOpacity, severity);
    this.triggerScreenShake(0.4);
  }

  public triggerHolyFlash(intensity = 0.9): void {
    this.holyFlashOpacity = Math.max(this.holyFlashOpacity, intensity);
    this.audio.playHolyFlash?.();
  }

  public triggerScreenShake(trauma = 0.5): void {
    this.screenTrauma = Math.min(1.0, this.screenTrauma + trauma);
  }

  private updatePlayer(delta: number): void {
    if (!this.isGameplayActive()) {
      this.playerVelocity.set(0, 0, 0);
      return;
    }

    // 1. Movement Inputs (WASD / Arrows)
    let moveX = 0;
    let moveZ = 0;

    if (this.keys['w'] || this.keys['arrowup']) moveZ -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveZ += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    const inputDir = new THREE.Vector3(0, 0, 0);

    if (this.cameraMode === 'isometric') {
      inputDir.set(moveX, 0, moveZ);
    } else {
      // Third-person: movement is relative to horizontal camera orientation
      const camFwd = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
      const camRight = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));
      if (moveZ < 0) inputDir.add(camFwd);
      if (moveZ > 0) inputDir.sub(camFwd);
      if (moveX > 0) inputDir.add(camRight);
      if (moveX < 0) inputDir.sub(camRight);
    }

    if (inputDir.lengthSq() > 0 && !this.playerStats.isDodging) {
      inputDir.normalize();
      const speed = this.playerStats.isArmed ? 4.8 : 5.6; // Slightly faster when disarmed
      this.playerVelocity.x = inputDir.x * speed;
      this.playerVelocity.z = inputDir.z * speed;

      // Target yaw with local forward = (0, 0, -1)
      const targetAngle = Math.atan2(-inputDir.x, -inputDir.z);
      const currentAngle = this.playerGroup.rotation.y;
      // Shortest angular arc difference
      const angleDiff = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
      const turnAlpha = 1 - Math.exp(-14.0 * delta);
      this.playerGroup.rotation.y = currentAngle + angleDiff * turnAlpha;

      if (this.cameraMode === 'third_person') {
        this.targetCameraYaw = targetAngle;
      }

      // Running subtle body wobble
      this.playerBody.rotation.z = Math.sin(this.clock.elapsedTime * 12) * 0.08;
    } else if (!this.playerStats.isDodging) {
      // Frame-rate-independent deceleration
      const friction = Math.exp(-12.0 * delta);
      this.playerVelocity.x *= friction;
      this.playerVelocity.z *= friction;
      this.playerBody.rotation.z = 0;
    }

    // Apply movement & boundaries along the street
    this.playerGroup.position.x += this.playerVelocity.x * delta;
    this.playerGroup.position.z += this.playerVelocity.z * delta;

    const bounds = this.dungeonAreaManager.getBounds();
    this.playerGroup.position.x = THREE.MathUtils.clamp(this.playerGroup.position.x, bounds.minX, bounds.maxX);
    this.playerGroup.position.z = THREE.MathUtils.clamp(this.playerGroup.position.z, bounds.minZ, bounds.maxZ);

    // Timers
    if (this.dodgeTimer > 0) this.dodgeTimer -= delta;
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.attackBuffTimer > 0) {
      this.attackBuffTimer -= delta;
      if (this.attackBuffTimer <= 0) {
        this.attackBuffMultiplier = 1.0;
        this.spawnFloatingText(this.playerGroup.position, '⚔ Óleo Consagrado disipado', '#c5b4db');
      }
    }
  }

  // =========================================================================
  // ENEMY 1: ASH PROWLER AI (PATROL, ALERT, CHASE, COMBAT)
  // =========================================================================
  private updateEnemy(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'surface') return;
    if (this.enemyState === 'DEAD') return;
    if (!this.isGameplayActive()) return;

    const toPlayer = this.playerGroup.position.clone().sub(this.enemyGroup.position);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    // 1. PATROL STATE
    if (this.enemyState === 'PATROL') {
      this.enemyWarningMesh.visible = false;
      const targetWaypoint = this.enemyWaypoints[this.enemyCurrentWaypointIndex];
      const toWaypoint = targetWaypoint.clone().sub(this.enemyGroup.position);
      toWaypoint.y = 0;
      const distToWaypoint = toWaypoint.length();

      // Check player detection (Sight cone & proximity)
      // Sanctuary safe zone: player position z >= 2.0 is the peaceful shrine area
      if (distToPlayer <= 5.8 && this.playerGroup.position.z < 2.0) {
        this.enemyState = 'ALERT';
        this.enemyTimer = 0.55;
        this.enemyWarningMesh.visible = true;
        this.audio.playSfx('warning');
        this.spawnFloatingText(this.enemyGroup.position, '⚠️ ¡SABUESO EN ALERTA!', '#ff9933');
        return;
      }

      if (distToWaypoint <= 0.4) {
        this.enemyCurrentWaypointIndex = (this.enemyCurrentWaypointIndex + 1) % this.enemyWaypoints.length;
      } else {
        toWaypoint.normalize();
        this.enemyGroup.position.add(toWaypoint.multiplyScalar(1.5 * delta));
        const targetAngle = Math.atan2(toWaypoint.x, toWaypoint.z);
        this.enemyGroup.rotation.y = THREE.MathUtils.lerp(this.enemyGroup.rotation.y, targetAngle, 0.1);
      }
    } else if (this.enemyState === 'ALERT') {
      this.enemyTimer -= delta;
      this.enemyWarningMesh.rotation.y += delta * 6;
      if (distToPlayer > 0.1) {
        const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
        this.enemyGroup.rotation.y = THREE.MathUtils.lerp(this.enemyGroup.rotation.y, targetAngle, 0.15);
      }

      if (distToPlayer > 9.0) {
        this.enemyState = 'RETURNING';
        this.enemyWarningMesh.visible = false;
        return;
      }

      if (this.enemyTimer <= 0) {
        this.enemyState = 'CHASE';
        this.enemyWarningMesh.visible = false;
      }
    } else if (this.enemyState === 'CHASE') {
      this.enemyWarningMesh.visible = false;

      // Orient toward player
      if (distToPlayer > 0.1) {
        const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
        this.enemyGroup.rotation.y = THREE.MathUtils.lerp(this.enemyGroup.rotation.y, targetAngle, 0.12);
      }

      if (distToPlayer > 10.5 || this.playerGroup.position.z >= 2.0) {
        this.enemyState = 'RETURNING';
        return;
      }

      if (distToPlayer > 2.0) {
        toPlayer.normalize();
        this.enemyGroup.position.add(toPlayer.multiplyScalar(2.7 * delta));
        this.enemyGroup.position.z = THREE.MathUtils.clamp(this.enemyGroup.position.z, -12, 1.2);
      } else {
        // Start telegraphed wind-up before attacking!
        this.enemyState = 'WINDUP';
        this.enemyTimer = 0.48; // 480ms wind-up window
        this.enemyWarningMesh.visible = true;
        this.audio.playSfx('warning');
      }
    } else if (this.enemyState === 'RETURNING') {
      this.enemyWarningMesh.visible = false;
      const targetWaypoint = this.enemyWaypoints[this.enemyCurrentWaypointIndex];
      const toWaypoint = targetWaypoint.clone().sub(this.enemyGroup.position);
      toWaypoint.y = 0;
      const distToWaypoint = toWaypoint.length();

      if (distToPlayer <= 5.0) {
        this.enemyState = 'ALERT';
        this.enemyTimer = 0.4;
        this.enemyWarningMesh.visible = true;
        return;
      }

      if (distToWaypoint <= 0.6) {
        this.enemyState = 'PATROL';
      } else {
        toWaypoint.normalize();
        this.enemyGroup.position.add(toWaypoint.multiplyScalar(1.8 * delta));
        const targetAngle = Math.atan2(toWaypoint.x, toWaypoint.z);
        this.enemyGroup.rotation.y = THREE.MathUtils.lerp(this.enemyGroup.rotation.y, targetAngle, 0.1);
      }
    } else if (this.enemyState === 'WINDUP') {
      this.enemyTimer -= delta;
      this.enemyWarningMesh.rotation.y += delta * 6;
      this.enemyWarningMesh.visible = Math.floor(this.clock.elapsedTime * 16) % 2 === 0;

      if (this.enemyTimer <= 0) {
        this.enemyState = 'ATTACK';
        this.enemyWarningMesh.visible = false;
        this.executeEnemyHit();
      }
    } else if (this.enemyState === 'RECOVERY') {
      this.enemyTimer -= delta;
      if (this.enemyTimer <= 0) {
        this.enemyState = 'CHASE';
      }
    } else if (this.enemyState === 'STUNNED') {
      this.enemyTimer -= delta;
      this.enemyGroup.rotation.z = Math.sin(this.clock.elapsedTime * 20) * 0.15;
      if (this.enemyTimer <= 0) {
        this.enemyGroup.rotation.z = 0;
        this.enemyState = 'RECOVERY';
        this.enemyTimer = 0.4;
      }
    }
  }

  private executeEnemyHit(): void {
    const dist = this.playerGroup.position.distanceTo(this.enemyGroup.position);

    if (dist <= 2.6) {
      // Check for Perfect Parry with relic window bonus!
      const parryWindow = 280 + this.inventory.getParryBonusMs();
      const isParry = this.playerStats.isGuarding && (performance.now() - this.lastGuardTime) <= parryWindow;
      if (isParry) {
        this.audio.playSfx('parry');
        this.triggerHolyFlash(0.85);
        this.enemyState = 'STUNNED';
        this.enemyTimer = 1.6;
        const msg = this.inventory.getParryBonusMs() > 0 ? '¡PARRY SAGRADO (+70ms)!' : '¡PARRY PERFECTO!';
        this.spawnFloatingText(this.playerGroup.position, msg, '#77aaff');
        return;
      }

      // Check for Player Dodge
      if (this.playerStats.isDodging) {
        this.spawnFloatingText(this.playerGroup.position, '¡ESQUIVADO!', '#88ffaa');
        this.enemyState = 'RECOVERY';
        this.enemyTimer = 0.5;
        return;
      }

      // Damage Player with ward mitigation
      const dmg = this.calculateIncomingDamage(18, 4);
      this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
      this.audio.playCombatHit(false);
      this.spawnFloatingText(this.playerGroup.position, `-${dmg}`, '#ff4444');
      this.updateHUD();

      // Revive if fallen (H16 central policy)
      if (this.playerStats.health <= 0) {
        this.handlePlayerDefeatAndRespawn();
      }
    }

    this.enemyState = 'RECOVERY';
    this.enemyTimer = 0.45;
  }

  // =========================================================================
  // ENEMY 2: CENSER BEARER CULTIST AI (PATROL, ALERT, CHASE, COMBAT)
  // =========================================================================
  private updateCultist(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'surface') return;
    if (this.cultistState === 'DEAD') return;
    if (!this.isGameplayActive()) return;

    // Swing censer animation and bobbing
    if (this.cultistCenserMesh) {
      this.cultistCenserMesh.rotation.z = Math.sin(this.clock.elapsedTime * 4.0) * 0.4;
      this.cultistCenserMesh.rotation.x = Math.cos(this.clock.elapsedTime * 3.2) * 0.2;
    }
    if (this.cultistCenserLight) {
      this.cultistCenserLight.intensity = 2.2 + Math.sin(this.clock.elapsedTime * 10) * 0.8;
    }

    const toPlayer = this.playerGroup.position.clone().sub(this.cultistGroup.position);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    if (this.cultistState === 'PATROL') {
      this.cultistWarningMesh.visible = false;
      const targetWaypoint = this.cultistWaypoints[this.cultistCurrentWaypointIndex];
      const toWaypoint = targetWaypoint.clone().sub(this.cultistGroup.position);
      toWaypoint.y = 0;
      const distToWaypoint = toWaypoint.length();

      // Check player detection
      if (distToPlayer <= 6.2) {
        this.cultistState = 'ALERT';
        this.cultistTimer = 0.6;
        this.cultistWarningMesh.visible = true;
        this.audio.playSfx('warning');
        this.spawnFloatingText(this.cultistGroup.position, '⚠️ ¡CULTISTA DEL INCENSARIO ALERTA!', '#ffd700');
        return;
      }

      if (distToWaypoint <= 0.4) {
        this.cultistCurrentWaypointIndex = (this.cultistCurrentWaypointIndex + 1) % this.cultistWaypoints.length;
      } else {
        toWaypoint.normalize();
        this.cultistGroup.position.add(toWaypoint.multiplyScalar(1.2 * delta));
        const targetAngle = Math.atan2(toWaypoint.x, toWaypoint.z);
        this.cultistGroup.rotation.y = THREE.MathUtils.lerp(this.cultistGroup.rotation.y, targetAngle, 0.08);
      }
    } else if (this.cultistState === 'ALERT') {
      this.cultistTimer -= delta;
      this.cultistWarningMesh.rotation.y += delta * 7;
      if (distToPlayer > 0.1) {
        const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
        this.cultistGroup.rotation.y = THREE.MathUtils.lerp(this.cultistGroup.rotation.y, targetAngle, 0.12);
      }

      if (distToPlayer > 10.0) {
        this.cultistState = 'RETURNING';
        this.cultistWarningMesh.visible = false;
        return;
      }

      if (this.cultistTimer <= 0) {
        this.cultistState = 'CHASE';
        this.cultistWarningMesh.visible = false;
      }
    } else if (this.cultistState === 'CHASE') {
      this.cultistWarningMesh.visible = false;

      if (distToPlayer > 0.1) {
        const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
        this.cultistGroup.rotation.y = THREE.MathUtils.lerp(this.cultistGroup.rotation.y, targetAngle, 0.1);
      }

      if (distToPlayer > 11.5) {
        this.cultistState = 'RETURNING';
        return;
      }

      if (distToPlayer > 2.4) {
        toPlayer.normalize();
        this.cultistGroup.position.add(toPlayer.multiplyScalar(2.2 * delta));
        this.cultistGroup.position.z = THREE.MathUtils.clamp(this.cultistGroup.position.z, -19, -4);
      } else {
        // Telegraph Censer swing strike!
        this.cultistState = 'WINDUP';
        this.cultistTimer = 0.52;
        this.cultistWarningMesh.visible = true;
        this.audio.playSfx('warning');
      }
    } else if (this.cultistState === 'RETURNING') {
      this.cultistWarningMesh.visible = false;
      const targetWaypoint = this.cultistWaypoints[this.cultistCurrentWaypointIndex];
      const toWaypoint = targetWaypoint.clone().sub(this.cultistGroup.position);
      toWaypoint.y = 0;
      const distToWaypoint = toWaypoint.length();

      if (distToPlayer <= 5.5) {
        this.cultistState = 'ALERT';
        this.cultistTimer = 0.45;
        this.cultistWarningMesh.visible = true;
        return;
      }

      if (distToWaypoint <= 0.6) {
        this.cultistState = 'PATROL';
      } else {
        toWaypoint.normalize();
        this.cultistGroup.position.add(toWaypoint.multiplyScalar(1.5 * delta));
        const targetAngle = Math.atan2(toWaypoint.x, toWaypoint.z);
        this.cultistGroup.rotation.y = THREE.MathUtils.lerp(this.cultistGroup.rotation.y, targetAngle, 0.08);
      }
    } else if (this.cultistState === 'WINDUP') {
      this.cultistTimer -= delta;
      this.cultistWarningMesh.rotation.y += delta * 8;
      this.cultistWarningMesh.visible = Math.floor(this.clock.elapsedTime * 18) % 2 === 0;

      if (this.cultistTimer <= 0) {
        this.cultistState = 'ATTACK';
        this.cultistWarningMesh.visible = false;
        this.executeCultistAttack();
      }
    } else if (this.cultistState === 'RECOVERY') {
      this.cultistTimer -= delta;
      if (this.cultistTimer <= 0) {
        this.cultistState = 'CHASE';
      }
    } else if (this.cultistState === 'STUNNED') {
      this.cultistTimer -= delta;
      this.cultistGroup.rotation.z = Math.sin(this.clock.elapsedTime * 22) * 0.12;
      if (this.cultistTimer <= 0) {
        this.cultistGroup.rotation.z = 0;
        this.cultistState = 'RECOVERY';
        this.cultistTimer = 0.4;
      }
    }
  }

  private executeCultistAttack(): void {
    const dist = this.playerGroup.position.distanceTo(this.cultistGroup.position);

    if (dist <= 2.8) {
      // Check Parry with relic window bonus!
      const parryWindow = 280 + this.inventory.getParryBonusMs();
      const isParry = this.playerStats.isGuarding && (performance.now() - this.lastGuardTime) <= parryWindow;
      if (isParry) {
        this.audio.playSfx('parry');
        this.triggerHolyFlash(0.85);
        this.cultistState = 'STUNNED';
        this.cultistTimer = 1.8 * this.getStaggerMultiplier();
        const msg = this.inventory.getParryBonusMs() > 0 ? '¡PARRY SAGRADO (+70ms)!' : '¡PARRY PERFECTO!';
        this.spawnFloatingText(this.playerGroup.position, msg, '#77aaff');
        this.spawnFloatingText(this.cultistGroup.position, '⚡ ¡ATURDIDO! [E] ¡REMATAR!', '#ffd700');
        return;
      }

      // Check Dodge
      if (this.playerStats.isDodging) {
        this.spawnFloatingText(this.playerGroup.position, '¡ESQUIVADO!', '#88ffaa');
        this.cultistState = 'RECOVERY';
        this.cultistTimer = 0.5;
        return;
      }

      // Impact damage (Censer blunt hit + smoke)
      const dmg = this.calculateIncomingDamage(16, 4);
      this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
      this.audio.playCombatHit(false);
      this.spawnFloatingText(this.playerGroup.position, `-${dmg} (GOLPE DE INCENSARIO)`, '#ff9944');
      this.updateHUD();

      // Revive if fallen (H16 central policy)
      if (this.playerStats.health <= 0) {
        this.handlePlayerDefeatAndRespawn();
      }
    }

    this.cultistState = 'RECOVERY';
    this.cultistTimer = 0.55;
  }

  // =========================================================================
  // ENEMY 3: CHAIN ZEALOT FLAGELLANT AI (PATROL, ALERT, CHASE, FLAGELLUM COMBAT)
  // =========================================================================
  private updateZealot(delta: number): void {
    if (this.dungeonAreaManager.currentArea !== 'surface') return;
    if (this.zealotState === 'DEAD') return;
    if (!this.isGameplayActive()) return;

    // Chain & Flail ball swinging physics
    if (this.zealotChainGroup) {
      this.zealotChainGroup.rotation.z = Math.sin(this.clock.elapsedTime * 5.0) * 0.45;
      this.zealotChainGroup.rotation.x = Math.cos(this.clock.elapsedTime * 4.2) * 0.25;
    }

    const toPlayer = this.playerGroup.position.clone().sub(this.zealotGroup.position);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    if (this.zealotState === 'PATROL') {
      this.zealotWarningMesh.visible = false;
      const targetWaypoint = this.zealotWaypoints[this.zealotCurrentWaypointIndex];
      const toWaypoint = targetWaypoint.clone().sub(this.zealotGroup.position);
      toWaypoint.y = 0;
      const distToWaypoint = toWaypoint.length();

      // Check player detection within 6.5m
      if (distToPlayer <= 6.5) {
        this.zealotState = 'ALERT';
        this.zealotTimer = 0.55;
        this.zealotWarningMesh.visible = true;
        this.audio.playSfx('warning');
        this.spawnFloatingText(this.zealotGroup.position, '⚠️ ¡FLAGELANTE ALERTA! (LATIGAZO)', '#ff3344');
        return;
      }

      if (distToWaypoint <= 0.45) {
        this.zealotCurrentWaypointIndex = (this.zealotCurrentWaypointIndex + 1) % this.zealotWaypoints.length;
      } else {
        toWaypoint.normalize();
        this.zealotGroup.position.add(toWaypoint.multiplyScalar(1.3 * delta));
        const targetAngle = Math.atan2(toWaypoint.x, toWaypoint.z);
        this.zealotGroup.rotation.y = THREE.MathUtils.lerp(this.zealotGroup.rotation.y, targetAngle, 0.08);
      }
    } else if (this.zealotState === 'ALERT') {
      this.zealotTimer -= delta;
      this.zealotWarningMesh.rotation.y += delta * 8;
      if (distToPlayer > 0.1) {
        const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
        this.zealotGroup.rotation.y = THREE.MathUtils.lerp(this.zealotGroup.rotation.y, targetAngle, 0.14);
      }

      if (distToPlayer > 11.0) {
        this.zealotState = 'RETURNING';
        this.zealotWarningMesh.visible = false;
        return;
      }

      if (this.zealotTimer <= 0) {
        this.zealotState = 'CHASE';
        this.zealotWarningMesh.visible = false;
      }
    } else if (this.zealotState === 'CHASE') {
      this.zealotWarningMesh.visible = false;

      if (distToPlayer > 0.1) {
        const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
        this.zealotGroup.rotation.y = THREE.MathUtils.lerp(this.zealotGroup.rotation.y, targetAngle, 0.12);
      }

      if (distToPlayer > 12.0) {
        this.zealotState = 'RETURNING';
        return;
      }

      // Chain whip range is 3.8m!
      if (distToPlayer > 3.8) {
        toPlayer.normalize();
        this.zealotGroup.position.add(toPlayer.multiplyScalar(2.4 * delta));
        this.zealotGroup.position.z = THREE.MathUtils.clamp(this.zealotGroup.position.z, -22, -10);
      } else {
        // Prepare telegraphed chain sweep
        this.zealotState = 'WINDUP';
        this.zealotTimer = 0.58;
        this.zealotWarningMesh.visible = true;
        this.audio.playSfx('warning');
      }
    } else if (this.zealotState === 'RETURNING') {
      this.zealotWarningMesh.visible = false;
      const targetWaypoint = this.zealotWaypoints[this.zealotCurrentWaypointIndex];
      const toWaypoint = targetWaypoint.clone().sub(this.zealotGroup.position);
      toWaypoint.y = 0;
      const distToWaypoint = toWaypoint.length();

      if (distToPlayer <= 5.8) {
        this.zealotState = 'ALERT';
        this.zealotTimer = 0.45;
        this.zealotWarningMesh.visible = true;
        return;
      }

      if (distToWaypoint <= 0.6) {
        this.zealotState = 'PATROL';
      } else {
        toWaypoint.normalize();
        this.zealotGroup.position.add(toWaypoint.multiplyScalar(1.6 * delta));
        const targetAngle = Math.atan2(toWaypoint.x, toWaypoint.z);
        this.zealotGroup.rotation.y = THREE.MathUtils.lerp(this.zealotGroup.rotation.y, targetAngle, 0.08);
      }
    } else if (this.zealotState === 'WINDUP') {
      this.zealotTimer -= delta;
      this.zealotWarningMesh.rotation.y += delta * 9;
      this.zealotWarningMesh.visible = Math.floor(this.clock.elapsedTime * 20) % 2 === 0;

      // Spin chain above head
      if (this.zealotChainGroup) {
        this.zealotChainGroup.rotation.y += delta * 15;
      }

      if (this.zealotTimer <= 0) {
        this.zealotState = 'ATTACK';
        this.zealotWarningMesh.visible = false;
        this.executeZealotAttack();
      }
    } else if (this.zealotState === 'RECOVERY') {
      this.zealotTimer -= delta;
      if (this.zealotTimer <= 0) {
        this.zealotState = 'CHASE';
      }
    } else if (this.zealotState === 'STUNNED') {
      this.zealotTimer -= delta;
      this.zealotGroup.rotation.z = Math.sin(this.clock.elapsedTime * 24) * 0.15;
      if (this.zealotTimer <= 0) {
        this.zealotGroup.rotation.z = 0;
        this.zealotState = 'RECOVERY';
        this.zealotTimer = 0.45;
      }
    }
  }

  private executeZealotAttack(): void {
    const dist = this.playerGroup.position.distanceTo(this.zealotGroup.position);

    // Wide sweeping range: 4.2m!
    if (dist <= 4.2) {
      // Check Parry with relic bonus
      const parryWindow = 280 + this.inventory.getParryBonusMs();
      const isParry = this.playerStats.isGuarding && (performance.now() - this.lastGuardTime) <= parryWindow;
      if (isParry) {
        this.audio.playSfx('parry');
        this.triggerHolyFlash(0.85);
        this.zealotState = 'STUNNED';
        this.zealotTimer = 2.0 * this.getStaggerMultiplier(); // Stunned window for Finisher
        const msg = this.inventory.getParryBonusMs() > 0 ? '¡PARRY DE CADENA SAGRADO (+70ms)!' : '¡PARRY DE CADENA!';
        this.spawnFloatingText(this.playerGroup.position, msg, '#77aaff');
        this.spawnFloatingText(this.zealotGroup.position, '⚡ ¡ATURDIDO! [E] ¡REMATAR!', '#ffd700');
        return;
      }

      // Check Dodge
      if (this.playerStats.isDodging) {
        this.spawnFloatingText(this.playerGroup.position, '¡LATIGAZO ESQUIVADO!', '#88ffaa');
        this.zealotState = 'RECOVERY';
        this.zealotTimer = 0.6;
        return;
      }

      // Impact damage (Heavy chain swipe)
      const dmg = this.calculateIncomingDamage(20, 6);
      this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
      this.audio.playCombatHit(true);
      this.spawnFloatingText(this.playerGroup.position, `-${dmg} (BARRIDO DE CADENA)`, '#ff3344');
      this.updateHUD();

      // Revive if fallen (H16 central policy)
      if (this.playerStats.health <= 0) {
        this.handlePlayerDefeatAndRespawn();
      }
    }

    this.zealotState = 'RECOVERY';
    this.zealotTimer = 0.65;
  }

  // =========================================================================
  // INVENTORY & RELICS MANAGEMENT
  // =========================================================================
  public toggleInventoryModal(): void {
    this.isInventoryOpen = !this.isInventoryOpen;
    if (!this.inventoryModalEl) return;

    if (this.isInventoryOpen) {
      this.releaseAllInputs();
      this.inventoryModalEl.style.display = 'block';
      this.renderInventoryItems();
      this.audio.playSfx('menu_select');
    } else {
      this.inventoryModalEl.style.display = 'none';
      this.audio.playSfx('menu_select');
    }
  }

  public useQuickConsumable(): void {
    const balm = this.inventory.getItem('maiden_balm') || this.inventory.getItem('balm_health');
    if (balm && balm.quantity > 0) {
      this.useInventoryItem(balm.id);
      return;
    }

    const rosary = this.inventory.getItem('saint_jude_rosary') || this.inventory.getItem('holy_water_posture');
    if (rosary && rosary.quantity > 0) {
      this.useInventoryItem(rosary.id);
      return;
    }

    const ash = this.inventory.getItem('consecrated_ash') || this.inventory.getItem('consecrated_oil_damage');
    if (ash && ash.quantity > 0) {
      this.useInventoryItem(ash.id);
      return;
    }

    this.spawnFloatingText(this.playerGroup.position, '¡No te quedan consumibles en la bolsa!', '#ff8888');
    this.audio.playSfx('warning');
  }

  public useInventoryItem(itemId: string): void {
    const item = this.inventory.getItem(itemId);
    if (!item || item.quantity <= 0) return;

    const result = this.inventory.useItem(itemId);
    if (result.success) {
      this.audio.playSfx('menu_select');
      if (result.effectType === 'heal_health') {
        const heal = result.effectValue || 35;
        this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + heal);
        this.spawnFloatingText(this.playerGroup.position, `🌿 +${heal} SALUD RESTAURADA`, '#88ffaa');
      } else if (result.effectType === 'restore_posture') {
        this.playerStats.posture = this.playerStats.maxPosture;
        this.spawnFloatingText(this.playerGroup.position, `💧 POSTURA RESTAURADA AL 100%`, '#66ccff');
      } else if (result.effectType === 'buff_attack') {
        this.attackBuffMultiplier = 1.35;
        this.attackBuffTimer = result.durationSeconds || 15;
        this.spawnFloatingText(this.playerGroup.position, `⚔ DAÑO +35% (${this.attackBuffTimer}s) ⚔`, '#ffd700');
      }
      this.updateHUD();
      this.renderInventoryItems();
    } else {
      this.spawnFloatingText(this.playerGroup.position, result.message, '#ffaa66');
    }
  }

  public toggleRelic(relicId: string): void {
    const item = this.inventory.getItem(relicId);
    const result = this.inventory.toggleEquipRelic(relicId);
    this.audio.playSfx('menu_select');
    const relicName = item?.name || 'Reliquia';
    if (result.isEquipped) {
      this.spawnFloatingText(this.playerGroup.position, `✦ RELIQUIA EQUIPADA: ${relicName} ✦`, '#ffd700');
    } else {
      this.spawnFloatingText(this.playerGroup.position, `✦ Reliquia desequipada: ${relicName} ✦`, '#c5b4db');
    }
    this.renderInventoryItems();
  }

  private renderInventoryItems(): void {
    if (!this.inventoryModalEl) return;

    const statusEl = this.inventoryModalEl.querySelector('#p3d-inv-status') as HTMLDivElement;
    const gridEl = this.inventoryModalEl.querySelector('#p3d-inv-grid') as HTMLDivElement;

    if (statusEl) {
      const equippedCount = this.inventory.getEquippedRelicsCount();
      const maxSlots = this.inventory.getMaxRelicSlots();
      const parryMs = this.inventory.getParryBonusMs();
      const dodgeRedPct = Math.round(this.inventory.getDodgeCostReduction() * 100);
      statusEl.innerHTML = `✦ Ranuras de Reliquia: <span style="color:#ffd700; font-weight:bold;">${equippedCount}/${maxSlots}</span> | Bono de Parry: <span style="color:#66ccff; font-weight:bold;">+${parryMs}ms</span> | Reducción de Fatiga: <span style="color:#a3ffc7; font-weight:bold;">${dodgeRedPct}%</span>`;
    }

    if (gridEl) {
      gridEl.innerHTML = '';
      const items = this.inventory.getAllItems();

      items.forEach(item => {
        const card = document.createElement('div');
        const isRelic = item.category === 'relic';
        card.style.background = isRelic ? 'rgba(32, 22, 54, 0.85)' : 'rgba(20, 28, 24, 0.85)';
        card.style.border = `1px solid ${isRelic ? (item.isEquipped ? '#ffd700' : '#6a4c8a') : '#3d785a'}`;
        card.style.borderRadius = '4px';
        card.style.padding = '6px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.justifyContent = 'space-between';

        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.alignItems = 'center';
        topRow.style.gap = '6px';
        topRow.style.marginBottom = '4px';

        const iconEl = document.createElement('span');
        const iconMap: Record<string, string> = {
          maiden_balm: '/assets/icons/icon_maiden_balm.png',
          saint_jude_rosary: '/assets/icons/icon_jude_rosary.png',
          consecrated_ash: '/assets/icons/icon_consecrated_ash.png',
          dusk_balm: '/assets/icons/icon_dusk_balm.png',
          holy_water: '/assets/icons/icon_holy_water.png',
          oakhaven_crypt_key: '/assets/icons/icon_crypt_key.png',
          relic_oakhaven_cross: '/assets/icons/icon_oakhaven_cross.png',
          relic_willow_feather: '/assets/icons/icon_black_willow_feather.png'
        };

        if (iconMap[item.id]) {
          iconEl.innerHTML = `<img src="${iconMap[item.id]}" style="width: 20px; height: 20px; image-rendering: pixelated; vertical-align: middle; border-radius: 2px;" alt="${item.name}" />`;
        } else {
          iconEl.innerText = item.icon;
          iconEl.style.fontSize = '14px';
        }

        const nameEl = document.createElement('div');
        nameEl.style.fontSize = '8px';
        nameEl.style.fontWeight = 'bold';
        nameEl.style.color = isRelic ? '#ffd700' : '#a3ffc7';
        nameEl.innerText = isRelic ? item.name : `${item.name} (x${item.quantity})`;

        topRow.appendChild(iconEl);
        topRow.appendChild(nameEl);

        const descEl = document.createElement('div');
        descEl.style.fontSize = '7px';
        descEl.style.color = '#dcd0ea';
        descEl.style.lineHeight = '1.25';
        descEl.style.marginBottom = '6px';
        descEl.innerText = item.description;

        const actionBtn = document.createElement('button');
        actionBtn.style.width = '100%';
        actionBtn.style.padding = '3px 0';
        actionBtn.style.borderRadius = '3px';
        actionBtn.style.fontSize = '7.5px';
        actionBtn.style.fontWeight = 'bold';
        actionBtn.style.cursor = 'pointer';

        if (isRelic) {
          if (item.isEquipped) {
            actionBtn.innerText = '✦ EQUIPADA [DESEQUIPAR]';
            actionBtn.style.background = '#3d2e0a';
            actionBtn.style.color = '#ffd700';
            actionBtn.style.border = '1px solid #ffd700';
          } else {
            actionBtn.innerText = 'EQUIPAR RELIQUIA';
            actionBtn.style.background = '#281a38';
            actionBtn.style.color = '#d8c4eb';
            actionBtn.style.border = '1px solid #5a3d78';
          }
          actionBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            this.toggleRelic(item.id);
          });
        } else if (item.category === 'material') {
          actionBtn.innerText = '⚗️ IR AL CALDERO [B]';
          actionBtn.style.background = '#152b1e';
          actionBtn.style.color = '#7dffb3';
          actionBtn.style.border = '1px solid #2ecc71';
          actionBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            this.toggleInventoryModal();
            this.toggleAlchemyModal();
          });
        } else {
          actionBtn.innerText = item.quantity > 0 ? 'USAR CONSUMIBLE' : 'AGOTADO';
          actionBtn.style.background = item.quantity > 0 ? '#1b3b28' : '#2b1a1a';
          actionBtn.style.color = item.quantity > 0 ? '#a3ffc7' : '#888';
          actionBtn.style.border = `1px solid ${item.quantity > 0 ? '#27ae60' : '#444'}`;
          actionBtn.disabled = item.quantity <= 0;
          actionBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            this.useInventoryItem(item.id);
          });
        }

        card.appendChild(topRow);
        card.appendChild(descEl);
        card.appendChild(actionBtn);
        gridEl.appendChild(card);
      });
    }
  }

  // =========================================================================
  // PROGRESSION & SKILL TREE MANAGEMENT
  // =========================================================================
  public toggleSkillTreeModal(): void {
    this.isSkillTreeOpen = !this.isSkillTreeOpen;
    if (!this.skillTreeModalEl) return;

    if (this.isSkillTreeOpen) {
      this.releaseAllInputs();
      this.skillTreeModalEl.style.display = 'block';
      this.renderSkillTreeItems();
      this.audio.playSfx('menu_select');
    } else {
      this.skillTreeModalEl.style.display = 'none';
      this.audio.playSfx('menu_select');
    }
  }

  public unlockSkillFromTree(skillId: string): void {
    const result = this.progression.unlockSkill(skillId);
    if (result.success) {
      this.audio.playSfx('parry');
      this.spawnFloatingText(this.playerGroup.position, `🌟 ¡${result.skill?.name.toUpperCase()} CONSAGRADA!`, '#ffd700');

      // If Thomas unlocked Iron Will, increase Max Health
      if (skillId === 'thomas_iron_will') {
        const bonus = this.progression.getMaxHealthBonus('thomas');
        this.playerStats.maxHealth = 100 + bonus;
        this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + bonus);
      }

      this.updateHUD();
      this.renderSkillTreeItems();
    } else {
      this.audio.playSfx('warning');
      this.spawnFloatingText(this.playerGroup.position, result.message, '#ff6666');
    }
  }

  private renderSkillTreeItems(): void {
    if (!this.skillTreeModalEl) return;

    const statusEl = this.skillTreeModalEl.querySelector('#p3d-skills-status') as HTMLDivElement;
    const thomasGrid = this.skillTreeModalEl.querySelector('#p3d-skills-thomas-grid') as HTMLDivElement;
    const khaterineGrid = this.skillTreeModalEl.querySelector('#p3d-skills-khaterine-grid') as HTMLDivElement;

    const allSkills = this.progression.getSkills();
    const unlockedCount = allSkills.filter(s => s.isUnlocked).length;
    const exp = this.progression.getExp();

    if (statusEl) {
      statusEl.innerHTML = `✦ EXP Disponible: <span style="color:#ffd700; font-weight:bold;">${exp} EXP</span> | Bendiciones Consagradas: <span style="color:#a3ffc7; font-weight:bold;">${unlockedCount}/${allSkills.length}</span> | EXP Total: <span style="color:#66ccff;">${this.progression.getTotalExpEarned()} EXP</span>`;
    }

    const renderCard = (skill: typeof allSkills[0]) => {
      const card = document.createElement('div');
      card.style.background = skill.isUnlocked ? 'rgba(32, 48, 30, 0.9)' : 'rgba(25, 18, 38, 0.85)';
      card.style.border = `1px solid ${skill.isUnlocked ? '#ffd700' : '#5a3d78'}`;
      card.style.borderRadius = '4px';
      card.style.padding = '6px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '3px';

      const topRow = document.createElement('div');
      topRow.style.display = 'flex';
      topRow.style.justifyContent = 'space-between';
      topRow.style.alignItems = 'center';

      const title = document.createElement('div');
      title.style.fontSize = '8px';
      title.style.fontWeight = 'bold';
      title.style.color = skill.isUnlocked ? '#ffd700' : '#dcd0ea';
      title.style.display = 'flex';
      title.style.alignItems = 'center';
      title.style.gap = '5px';

      const skillIconMap: Record<string, string> = {
        thomas_shield_strike: '/assets/icons/icon_skill_shield_slam.png',
        thomas_blade_mastery: '/assets/icons/icon_skill_holy_edge.png',
        thomas_iron_will: '/assets/icons/icon_skill_unyielding.png',
        khaterine_piercing_arrow: '/assets/icons/icon_skill_piercing_arrow.png',
        khaterine_shadow_step: '/assets/icons/icon_skill_spectral_step.png',
        khaterine_abyssal_ward: '/assets/icons/icon_skill_willow_sanctuary.png'
      };

      if (skillIconMap[skill.id]) {
        title.innerHTML = `<img src="${skillIconMap[skill.id]}" style="width: 16px; height: 16px; image-rendering: pixelated; border-radius: 2px;" alt="${skill.name}" /> <span>${skill.name}</span>`;
      } else {
        title.innerText = `${skill.icon} ${skill.name}`;
      }

      const costBadge = document.createElement('span');
      costBadge.style.fontSize = '7px';
      costBadge.style.fontFamily = 'monospace';
      costBadge.style.fontWeight = 'bold';
      costBadge.style.color = skill.isUnlocked ? '#88ffaa' : (exp >= skill.cost ? '#ffd700' : '#ff8888');
      costBadge.innerText = skill.isUnlocked ? '✦ CONSAGRADA' : `${skill.cost} EXP`;

      topRow.appendChild(title);
      topRow.appendChild(costBadge);

      const desc = document.createElement('div');
      desc.style.fontSize = '7px';
      desc.style.color = '#c5b4db';
      desc.style.lineHeight = '1.25';
      desc.innerText = skill.description;

      const btn = document.createElement('button');
      btn.style.width = '100%';
      btn.style.padding = '3px 0';
      btn.style.borderRadius = '3px';
      btn.style.fontSize = '7.5px';
      btn.style.fontWeight = 'bold';
      btn.style.marginTop = '2px';
      btn.style.cursor = skill.isUnlocked ? 'default' : 'pointer';

      if (skill.isUnlocked) {
        btn.innerText = '✓ ACTIVA';
        btn.style.background = '#27ae60';
        btn.style.color = '#fff';
        btn.style.border = '1px solid #2ecc71';
        btn.disabled = true;
      } else {
        const canAfford = exp >= skill.cost;
        const parentOk = !skill.requiredSkillId || this.progression.isSkillUnlocked(skill.requiredSkillId);
        if (!parentOk) {
          btn.innerText = '🔒 BLOQUEADA (Requiere previa)';
          btn.style.background = '#2a1a1a';
          btn.style.color = '#888';
          btn.style.border = '1px solid #444';
          btn.disabled = true;
        } else if (!canAfford) {
          btn.innerText = `EXP INSUFICIENTE (${skill.cost} EXP)`;
          btn.style.background = '#2a1420';
          btn.style.color = '#ff9999';
          btn.style.border = '1px solid #662233';
          btn.disabled = true;
        } else {
          btn.innerText = `⚡ CONSAGRAR (${skill.cost} EXP)`;
          btn.style.background = '#4a2d75';
          btn.style.color = '#ffd700';
          btn.style.border = '1px solid #ffd700';
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            this.unlockSkillFromTree(skill.id);
          });
        }
      }

      card.appendChild(topRow);
      card.appendChild(desc);
      card.appendChild(btn);
      return card;
    };

    if (thomasGrid) {
      thomasGrid.innerHTML = '';
      const thomasSkills = this.progression.getSkillsForHero('thomas');
      thomasSkills.forEach(s => thomasGrid.appendChild(renderCard(s)));
    }

    if (khaterineGrid) {
      khaterineGrid.innerHTML = '';
      const khaterineSkills = this.progression.getSkillsForHero('khaterine');
      khaterineSkills.forEach(s => khaterineGrid.appendChild(renderCard(s)));
    }
  }

  // =========================================================================
  // ALCHEMY & APOTHECARY MODAL & CRAFTING
  // =========================================================================
  public toggleAlchemyModal(): void {
    this.isAlchemyOpen = !this.isAlchemyOpen;
    if (!this.alchemyModalEl) return;

    if (this.isAlchemyOpen) {
      this.releaseAllInputs();
      this.alchemyModalEl.style.display = 'block';
      this.renderAlchemyModal();
      this.audio.playSfx('menu_select');
    } else {
      this.alchemyModalEl.style.display = 'none';
      this.audio.playSfx('menu_select');
    }
  }

  public renderAlchemyModal(): void {
    if (!this.alchemyModalEl) return;

    const statusEl = this.alchemyModalEl.querySelector('#p3d-alchemy-status') as HTMLDivElement;
    const gridEl = this.alchemyModalEl.querySelector('#p3d-alchemy-grid') as HTMLDivElement;
    const materialsEl = this.alchemyModalEl.querySelector('#p3d-alchemy-materials') as HTMLDivElement;

    if (statusEl) {
      const exp = this.progression.getExp();
      statusEl.innerHTML = `✦ EXP Disponible: <span style="color:#ffd700; font-weight:bold;">${exp} EXP</span> | ⚗️ Fuego del Caldero: <span style="color:#2ecc71; font-weight:bold;">VIVO</span> | Héroe: <span style="color:#e6b8ff; font-weight:bold;">${this.activeHero.toUpperCase()}</span>`;
    }

    // Render Recipes
    if (gridEl) {
      gridEl.innerHTML = '';
      const recipes = this.alchemyPot.getRecipes();

      recipes.forEach((recipe) => {
        const canCraftInfo = this.alchemyPot.canCraft(recipe.id, this.inventory);
        const card = document.createElement('div');
        card.style.cssText = `
          background: rgba(20, 32, 25, 0.85);
          border: 1px solid ${canCraftInfo.canCraft ? '#2ecc71' : '#3d4d42'};
          border-radius: 5px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 6px;
        `;

        // Ingredients summary HTML
        const ingredientsHtml = recipe.ingredients.map(ing => {
          const item = this.inventory.getItem(ing.itemId);
          const currentQty = item ? item.quantity : 0;
          const hasEnough = currentQty >= ing.quantity;
          const color = hasEnough ? '#2ecc71' : '#ff7777';
          const icon = hasEnough ? '✓' : '✗';
          return `<span style="color: ${color}; margin-right: 6px;">${ing.icon} ${ing.name}: ${currentQty}/${ing.quantity} ${icon}</span>`;
        }).join('');

        card.innerHTML = `
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span style="font-size: 8.5px; font-weight: bold; color: #a3ffc7;">${recipe.outputItem.icon || '⚗️'} ${recipe.name}</span>
              <span style="font-family: monospace; font-size: 7px; color: #ffd700; font-weight: bold;">+${recipe.expReward} EXP</span>
            </div>
            <div style="font-size: 7.5px; color: #b8c9be; line-height: 1.35; margin-bottom: 4px;">
              ${recipe.description}
            </div>
            <div style="font-family: monospace; font-size: 7px; line-height: 1.3;">
              ${ingredientsHtml}
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
            <button class="btn-synthesize" data-recipe-id="${recipe.id}" ${canCraftInfo.canCraft ? '' : 'disabled'} style="
              background: ${canCraftInfo.canCraft ? '#1b4d2e' : '#1a241d'};
              color: ${canCraftInfo.canCraft ? '#7dffb3' : '#66776c'};
              border: 1px solid ${canCraftInfo.canCraft ? '#2ecc71' : '#334438'};
              border-radius: 3px;
              padding: 3px 9px;
              font-family: monospace;
              font-size: 7.5px;
              font-weight: bold;
              cursor: ${canCraftInfo.canCraft ? 'pointer' : 'not-allowed'};
              transition: all 0.15s ease;
            ">
              ⚗️ SINTETIZAR
            </button>
          </div>
        `;

        gridEl.appendChild(card);
      });

      // Bind synthesize buttons
      const buttons = gridEl.querySelectorAll('.btn-synthesize');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const recipeId = (e.currentTarget as HTMLElement).getAttribute('data-recipe-id');
          if (recipeId) {
            this.synthesizeAlchemyRecipe(recipeId);
          }
        });
      });
    }

    // Render Materials Drawer
    if (materialsEl) {
      const materials = this.inventory.getMaterials();
      if (materials.length === 0) {
        materialsEl.innerHTML = '<span style="color: #889988; font-style: italic;">No tienes materiales en la bolsa. Derrota enemigos o destruye barriles para recolectar ingredientes.</span>';
      } else {
        materialsEl.innerHTML = materials.map(m => `
          <div style="background: rgba(14, 24, 18, 0.7); border: 1px solid #2a4734; border-radius: 3px; padding: 2px 6px; display: inline-flex; align-items: center; gap: 4px;">
            <span style="font-size: 8px;">${m.icon}</span>
            <span style="font-size: 7px; color: #d0e6d6;">${m.name}</span>
            <span style="font-size: 7px; font-weight: bold; color: #ffd700;">x${m.quantity}</span>
          </div>
        `).join('');
      }
    }
  }

  public synthesizeAlchemyRecipe(recipeId: string): void {
    const result = this.alchemyPot.craft(recipeId, this.inventory);
    if (result.success && result.craftedItem) {
      this.audio.playSfx('menu_select');
      const exp = result.expGained || 15;
      this.progression.addExp(exp);

      this.spawnFloatingText(
        this.playerGroup.position,
        `⚗️ ¡${result.craftedItem.name.toUpperCase()} SINTETIZADO! (+${exp} EXP)`,
        '#2ecc71'
      );

      // Light flash on cauldron
      if (this.cauldronLight) {
        this.cauldronLight.intensity = 4.5;
        setTimeout(() => { if (this.cauldronLight) this.cauldronLight.intensity = 1.8; }, 350);
      }

      this.updateHUD();
      this.renderAlchemyModal();
      if (this.isInventoryOpen) {
        this.renderInventoryItems();
      }
    } else {
      this.audio.playSfx('warning');
      this.spawnFloatingText(this.playerGroup.position, result.message, '#ff6666');
    }
  }

  // =========================================================================
  // CANONICAL 20-CHAPTER COMPENDIUM & SCENARIO FAST TRAVEL
  // =========================================================================
  public toggleCompendiumModal(): void {
    this.isCompendiumOpen = !this.isCompendiumOpen;
    if (!this.compendiumModalEl) return;

    if (this.isCompendiumOpen) {
      this.releaseAllInputs();
      this.compendiumModalEl.style.display = 'block';
      const activeChapter = this.canonChapterManager.getChapter(this.currentCanonChapterId);
      const actToShow = activeChapter ? activeChapter.act : 1;

      const tabs = this.compendiumModalEl.querySelectorAll('.p3d-act-tab') as NodeListOf<HTMLButtonElement>;
      tabs.forEach(t => {
        const tAct = parseInt(t.getAttribute('data-act') || '1', 10);
        if (tAct === actToShow) {
          t.style.background = '#3b2812';
          t.style.color = '#ffd7aa';
          t.style.borderColor = '#d49a37';
        } else {
          t.style.background = '#1a162b';
          t.style.color = '#dcd0ea';
          t.style.borderColor = '#5a3d78';
        }
      });

      this.renderCompendiumModal(actToShow);
      this.audio.playSfx('menu_select');
    } else {
      this.compendiumModalEl.style.display = 'none';
      this.audio.playSfx('menu_select');
    }
  }

  public renderCompendiumModal(selectedAct: number = 1): void {
    if (!this.compendiumModalEl) return;

    const progressEl = this.compendiumModalEl.querySelector('#p3d-compendium-progress') as HTMLDivElement;
    const listEl = this.compendiumModalEl.querySelector('#p3d-compendium-list') as HTMLDivElement;

    if (progressEl) {
      const unlockedCount = this.canonChapterManager.getUnlockedCount();
      const pct = this.canonChapterManager.getProgressPercentage();
      const currentCap = this.canonChapterManager.getChapter(this.currentCanonChapterId);
      const currentLabel = currentCap ? `Cap. ${currentCap.romanNumber}` : 'Cap. I';
      progressEl.innerHTML = `✦ Progreso Canónico: <span style="color:#ffd700; font-weight:bold;">${unlockedCount} / 20 Capítulos (${pct}%)</span> | Capítulo Activo: <span style="color:#88eeff; font-weight:bold;">${currentLabel}</span> | Vista: <span style="color:#e6b8ff; font-weight:bold;">Acto ${selectedAct}</span>`;
    }

    if (listEl) {
      listEl.innerHTML = '';
      const chapters = this.canonChapterManager.getChaptersForAct(selectedAct);

      chapters.forEach(chapter => {
        const isUnlocked = this.canonChapterManager.isChapterUnlocked(chapter.id);
        const isCurrent = chapter.id === this.currentCanonChapterId;
        const card = document.createElement('div');
        card.style.cssText = `
          background: ${isCurrent ? 'rgba(34, 22, 54, 0.96)' : 'rgba(22, 14, 34, 0.92)'};
          border: 1.5px solid ${isCurrent ? '#88eeff' : isUnlocked ? '#d4af37' : '#4a3d5e'};
          border-radius: 5px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        `;

        const topRow = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 8.5px; font-weight: bold; color: ${isCurrent ? '#88eeff' : isUnlocked ? '#ffd700' : '#888'};">
              ${isCurrent ? '★' : '✦'} CAPÍTULO ${chapter.romanNumber}: ${chapter.title.toUpperCase()}
            </span>
            <span style="font-family: monospace; font-size: 7px; color: ${isCurrent ? '#88eeff' : isUnlocked ? '#a3ffc7' : '#ff8888'}; font-weight: bold;">
              ${isCurrent ? '★ ESCENARIO ACTUAL' : isUnlocked ? '✓ DESBLOQUEADO' : '🔒 POR DESCUBRIR'}
            </span>
          </div>
        `;

        const locationRow = `
          <div style="font-size: 7px; color: #ffaa55; font-family: monospace;">
            📍 ${chapter.location}
          </div>
        `;

        const summaryRow = `
          <div style="font-size: 7.5px; color: #dcd0ea; font-style: italic; line-height: 1.35;">
            «${chapter.summary}»
          </div>
        `;

        const charactersRow = `
          <div style="font-size: 7px; color: #b8a6cc; font-family: monospace;">
            👥 Personajes: ${chapter.keyCharacters.join(', ')}
            ${chapter.bossOrEncounter ? ` | ⚔️ Encuentro: <span style="color:#ff8888;">${chapter.bossOrEncounter}</span>` : ''}
            ${chapter.relicReward ? ` | 🎁 Recompensa: <span style="color:#ffd700;">${chapter.relicReward}</span>` : ''}
          </div>
        `;

        const travelBtn = `
          <div style="display: flex; justify-content: flex-end; margin-top: 3px;">
            <button class="btn-travel-canon" data-chapter-id="${chapter.id}" style="
              background: #2b1d3d;
              color: #ffd700;
              border: 1px solid #d4af37;
              border-radius: 3px;
              padding: 3px 9px;
              font-family: monospace;
              font-size: 7.5px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.15s ease;
            ">
              🚀 VIAJAR A ESTE ESCENARIO 3D
            </button>
          </div>
        `;

        card.innerHTML = topRow + locationRow + summaryRow + charactersRow + travelBtn;
        listEl.appendChild(card);
      });

      // Bind Fast Travel Buttons
      const travelBtns = listEl.querySelectorAll('.btn-travel-canon') as NodeListOf<HTMLButtonElement>;
      travelBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const capId = parseInt((e.currentTarget as HTMLButtonElement).getAttribute('data-chapter-id') || '1', 10);
          this.fastTravelToChapter(capId);
        });
      });
    }
  }

  public fastTravelToChapter(chapterId: number): void {
    const chapter = this.canonChapterManager.getChapter(chapterId);
    if (!chapter) return;

    this.canonChapterManager.unlockChapter(chapterId);
    this.currentCanonChapterId = chapterId;
    if (this.isCompendiumOpen) {
      this.toggleCompendiumModal();
    }

    if (chapter.targetAreaKey === 'inverted_cathedral') {
      this.transitionToArea('inverted_cathedral');
    } else if (chapter.targetAreaKey === 'londinium_citadel') {
      this.transitionToArea('londinium_citadel');
    } else if (chapter.targetAreaKey === 'great_stone_bridge') {
      this.transitionToArea('great_stone_bridge');
    } else if (chapter.targetAreaKey === 'belltower_summit') {
      this.transitionToArea('belltower_summit');
    } else if (chapter.targetAreaKey === 'black_willow_forest') {
      this.transitionToArea('black_willow_forest');
    } else if (chapter.targetAreaKey === 'crypts_interior') {
      this.transitionToArea('crypts_interior');
    } else {
      this.transitionToArea('surface');
      setTimeout(() => {
        this.setPlayerPosition(0, 0, chapterId === 5 ? -7 : 4);
      }, 420);
    }

    setTimeout(() => {
      this.setDialogueToast(
        `Capítulo ${chapter.romanNumber}: ${chapter.title}`,
        `«${chapter.summary}»`,
        '/assets/icons/icon_black_willow_feather.png',
        '#ffd700'
      );
    }, 440);
  }

  // =========================================================================
  // PLAYER DEFEAT & RESPAWN (H16 CENTRALIZED POLICY)
  // =========================================================================
  private handlePlayerDefeatAndRespawn(): void {
    this.isPlayerDefeated = false;
    this.dungeonAreaManager.exitToSurface();
    [
      this.inquisitorHpBarContainer,
      this.rootProwlerHpBarContainer,
      this.crucibleHpBarContainer,
      this.vaneHpBarContainer,
      this.malphasHpBarContainer,
      this.astarothHpBarContainer
    ].forEach(hud => {
      if (hud) hud.style.display = 'none';
    });
    const activeId = this.party.getActiveHeroId();
    const bonusHp = this.progression && (activeId === 'thomas' || activeId === 'khaterine')
      ? this.progression.getMaxHealthBonus(activeId as HeroType)
      : 0;
    this.party.reviveHeroAtCheckpoint(activeId, bonusHp);
    this.playerGroup.position.set(0, 0, 4);
    this.playerVelocity.set(0, 0, 0);
    this.playerGroup.rotation.y = 0;
    this.cameraYaw = 0;
    this.targetCameraYaw = 0;
    this.currentCameraLook.set(0, 1.35, 4);
    if (this.cameraMode === 'isometric') {
      this.targetCameraPos.set(0, 7.2, 12.8);
    } else {
      this.targetCameraPos.set(0, 2.4, 8.0);
    }
    this.camera.position.copy(this.targetCameraPos);
    this.camera.lookAt(this.currentCameraLook);
    this.releaseAllInputs();
    this.spawnFloatingText(this.playerGroup.position, '✝ BENDICIÓN: RESUCITADO EN EL SANTUARIO ✝', '#ffd700');
    this.audio.playSfx('menu_select');
    this.updateHUD();
  }

  // =========================================================================
  // SANCTUARY SAVE & RESTORATION (H02 & H03 RESOLVED)
  // =========================================================================
  public executeSanctuarySave(): void {
    const distToCedric = this.playerGroup.position.distanceTo(this.cedricGroup.position);
    const isAtSanctuary = distToCedric < 6.5;

    if (isAtSanctuary) {
      // Full shrine restoration for the party
      this.party.restoreFullSanctuary((id) =>
        this.progression && (id === 'thomas' || id === 'khaterine')
          ? this.progression.getMaxHealthBonus(id as HeroType)
          : 0
      );

      // Pulse sanctuary cross light
      if (this.sanctuaryCrossLight) {
        this.sanctuaryCrossLight.intensity = 5.0;
        setTimeout(() => {
          if (this.sanctuaryCrossLight) this.sanctuaryCrossLight.intensity = 1.8;
        }, 1200);
      }

      this.audio.playSfx('parry');
      this.spawnFloatingText(this.playerGroup.position, '💾 ¡SANTUARIO CONSAGRADO! Partida Guardada & Salud Restaurada', '#ffd700');

      this.setDialogueToast(
        'Padre Cedric',
        '«Que la gracia de San Jude guarde tu alma, hijo mío. Tu devoción ha quedado consagrada en este altar sagrado.»',
        '/assets/concepts/concept_cedric.png',
        '#ffd700'
      );
    } else {
      this.audio.playSfx('menu_select');
      this.spawnFloatingText(this.playerGroup.position, '💾 Partida Guardada en Punto de Control', '#a3ffc7');
    }

    const activeId = (this.party.getActiveHeroId() === 'khaterine' ? 'khaterine' : 'thomas') as 'thomas' | 'khaterine';
    const heroesState = {
      thomas: {
        health: this.party.getHero('thomas').health,
        posture: this.party.getHero('thomas').posture,
        isArmed: this.party.getHero('thomas').isArmed,
        available: true
      },
      khaterine: {
        health: this.party.getHero('khaterine').health,
        posture: this.party.getHero('khaterine').posture,
        isArmed: this.party.getHero('khaterine').isArmed,
        available: true
      }
    };

    GameSaveManager.saveGame({
      activeHero: activeId,
      heroes: heroesState,
      health: this.playerStats.health,
      maxHealth: this.playerStats.maxHealth,
      posture: this.playerStats.posture,
      maxPosture: this.playerStats.maxPosture,
      inventory: this.inventory.toJSON(),
      progression: this.progression.toJSON(),
      sanctuaryVisited: isAtSanctuary,
      world: {
        morwennaDefeated: this.morwennaState === 'DEAD',
        morwennaPhase2: this.morwennaPhase === 2,
        cemeteryGateOpen: this.cemeteryGateOpen,
        checkpoint: { x: this.playerGroup.position.x, y: this.playerGroup.position.y, z: this.playerGroup.position.z },
        destroyedPropIds: this.destructibles.filter((p: DestructibleProp3D) => p.isDestroyed).map((p: DestructibleProp3D) => p.id)
      }
    });

    this.updateHUD();
  }

  private loadSavedSanctuaryState(): void {
    const save = GameSaveManager.loadGame();
    if (!save) return;

    try {
      if (save.progression) {
        this.progression = Progression.fromJSON(save.progression);
      }
      if (save.inventory) {
        this.inventory = Inventory.fromJSON(save.inventory);
        // Ensure starter alchemy materials are present if legacy save had none
        if (this.inventory.getMaterials().length === 0) {
          this.inventory.addItem({ ...CANONICAL_MATERIALS.herb_silverleaf, quantity: 2 });
          this.inventory.addItem({ ...CANONICAL_MATERIALS.salve_base, quantity: 1 });
          this.inventory.addItem({ ...CANONICAL_MATERIALS.ash_purified, quantity: 1 });
        }
      }

      // Restore party state
      if (save.heroes) {
        this.party.deserialize({
          activeHeroId: save.activeHero,
          heroes: save.heroes as any
        });
      }

      this.updateHeroVisuals();

      // H03 FIX: Strict finite number validation accepting 0
      if (typeof save.health === 'number' && Number.isFinite(save.health)) {
        this.playerStats.health = save.health;
      }
      if (typeof save.posture === 'number' && Number.isFinite(save.posture)) {
        this.playerStats.posture = save.posture;
      }

      // H02 FIX: Restore world state
      if (save.world) {
        if (save.world.morwennaDefeated) {
          this.morwennaState = 'DEAD';
          this.morwennaEncounter.isDefeated = true;
          this.morwennaHealth = 0;
          this.morwennaGroup.visible = false;
          if (this.morwennaCrucibleLight) this.morwennaCrucibleLight.visible = false;
        }
        if (save.world.morwennaPhase2 && this.morwennaPhase === 1) {
          this.triggerMorwennaPhase2();
        }
        if (save.world.cemeteryGateOpen && !this.cemeteryGateOpen) {
          this.openCemeteryGate();
        }
        if (save.world.checkpoint) {
          const cz = save.world.checkpoint.z;
          if (cz <= -360) this.dungeonAreaManager.enterInvertedCathedral();
          else if (cz <= -295) this.dungeonAreaManager.enterLondiniumCitadel();
          else if (cz <= -235) this.dungeonAreaManager.enterGreatStoneBridge();
          else if (cz <= -180) this.dungeonAreaManager.enterBelltower();
          else if (cz <= -120) this.dungeonAreaManager.enterBlackWillowForest();
          else if (cz <= -65) this.dungeonAreaManager.enterCrypts();
          else this.dungeonAreaManager.exitToSurface();
          this.setPlayerPosition(save.world.checkpoint.x, save.world.checkpoint.y, save.world.checkpoint.z);
        }
        if (this.inventory.hasItem('weapon_dawn_grey') && !this.hasForgedAlbaGris) {
          this.hasForgedAlbaGris = true;
          this.applyAlbaGrisSwordVisual();
        }
        if (save.world.destroyedPropIds && Array.isArray(save.world.destroyedPropIds)) {
          for (const propId of save.world.destroyedPropIds) {
            const prop = this.destructibles.find((p: DestructibleProp3D) => p.id === propId);
            if (prop && !prop.isDestroyed) {
              prop.isDestroyed = true;
              prop.mesh.visible = false;
            }
          }
        }
      }

      console.log('Sanctuary save loaded from:', save.dateStr);
    } catch (err) {
      console.warn('Error restoring sanctuary save data:', err);
    }
  }

  public exportSaveFile(): void {
    this.executeSanctuarySave();
    const jsonStr = GameSaveManager.exportSaveToJson();
    if (!jsonStr) {
      this.spawnFloatingText(this.playerGroup.position, 'No hay datos guardados para exportar', '#ff6666');
      return;
    }
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `the_light_in_the_darkness_save_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.audio.playSfx('menu_select');
    this.spawnFloatingText(this.playerGroup.position, '💾 Archivo JSON de Guardado Exportado', '#ffd700');
  }

  public async importSaveFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      const success = GameSaveManager.importSaveFromJson(text);
      if (success) {
        this.loadSavedSanctuaryState();
        this.audio.playHolyFlash?.();
        this.triggerHolyFlash(0.85);
        this.spawnFloatingText(this.playerGroup.position, '📂 Partida Restaurada Exitosamente desde JSON', '#a3ffc7');
        this.updateHUD();
      } else {
        this.spawnFloatingText(this.playerGroup.position, 'Error: Formato de guardado inválido', '#ff4444');
      }
    } catch (_err) {
      this.spawnFloatingText(this.playerGroup.position, 'Error al leer el archivo JSON', '#ff4444');
    }
  }

  private updateCamera(delta: number): void {
    const safeDelta = Math.min(delta, 0.1);

    if (this.cameraMode === 'isometric') {
      this.targetCameraPos.set(
        this.playerGroup.position.x * 0.5,
        this.playerGroup.position.y + 7.2,
        this.playerGroup.position.z + 8.8
      );
      this.targetCameraLook.set(
        this.playerGroup.position.x,
        this.playerGroup.position.y + 1.2,
        this.playerGroup.position.z
      );
    } else {
      // Third Person Follow Camera
      // Smooth recentering towards targetCameraYaw if not actively orbiting with pointer
      const isOrbiting = this.isPointerDragging || (performance.now() - this.lastManualOrbitTime < 900);
      if (!isOrbiting) {
        const yawDiff = Math.atan2(
          Math.sin(this.targetCameraYaw - this.cameraYaw),
          Math.cos(this.targetCameraYaw - this.cameraYaw)
        );
        const recenterAlpha = 1 - Math.exp(-3.5 * safeDelta);
        this.cameraYaw += yawDiff * recenterAlpha;
      }

      // Look target with forward anticipation (look-ahead)
      const lookAheadDist = 0.5;
      const lookAheadX = THREE.MathUtils.clamp(this.playerVelocity.x * 0.12, -lookAheadDist, lookAheadDist);
      const lookAheadZ = THREE.MathUtils.clamp(this.playerVelocity.z * 0.12, -lookAheadDist, lookAheadDist);
      this.targetCameraLook.set(
        this.playerGroup.position.x + lookAheadX,
        this.playerGroup.position.y + 1.35,
        this.playerGroup.position.z + lookAheadZ
      );

      // Desired camera position behind player at cameraYaw
      const cameraDist = 4.0;
      const cameraHeight = 2.4;
      let camX = this.playerGroup.position.x + Math.sin(this.cameraYaw) * cameraDist;
      let camY = this.playerGroup.position.y + cameraHeight;
      let camZ = this.playerGroup.position.z + Math.cos(this.cameraYaw) * cameraDist;

      // Obstacle & Street/Crypt boundary resolution (traceClip pullback)
      const bounds = this.dungeonAreaManager.getBounds();
      const maxStreetX = bounds.camMaxX;
      if (Math.abs(camX) > maxStreetX) {
        const boundX = Math.sign(camX) * maxStreetX;
        if (Math.abs(this.targetCameraLook.x) < maxStreetX) {
          const t = THREE.MathUtils.clamp((boundX - this.targetCameraLook.x) / (camX - this.targetCameraLook.x), 0.15, 0.95);
          camX = THREE.MathUtils.lerp(this.targetCameraLook.x, camX, t);
          camZ = THREE.MathUtils.lerp(this.targetCameraLook.z, camZ, t);
          camY = THREE.MathUtils.lerp(this.targetCameraLook.y + 0.5, camY, t);
        } else {
          camX = boundX;
        }
      }

      // Z boundary pullback
      const minZLimit = bounds.camMinZ;
      const maxZLimit = bounds.camMaxZ;
      if (camZ > maxZLimit || camZ < minZLimit) {
        const boundZ = camZ > maxZLimit ? maxZLimit : minZLimit;
        if (this.targetCameraLook.z > minZLimit && this.targetCameraLook.z < maxZLimit) {
          const t = THREE.MathUtils.clamp((boundZ - this.targetCameraLook.z) / (camZ - this.targetCameraLook.z), 0.15, 0.95);
          camX = THREE.MathUtils.lerp(this.targetCameraLook.x, camX, t);
          camZ = THREE.MathUtils.lerp(this.targetCameraLook.z, camZ, t);
          camY = THREE.MathUtils.lerp(this.targetCameraLook.y + 0.5, camY, t);
        } else {
          camZ = boundZ;
        }
      }

      this.targetCameraPos.set(camX, camY, camZ);
    }

    // Frame-rate-independent exponential smoothing
    const posAlpha = 1 - Math.exp(-6.5 * safeDelta);
    this.camera.position.lerp(this.targetCameraPos, posAlpha);

    const lookAlpha = 1 - Math.exp(-9.0 * safeDelta);
    this.currentCameraLook.lerp(this.targetCameraLook, lookAlpha);
    this.camera.lookAt(this.currentCameraLook);
  }

  private updateFlickeringLights(_delta: number): void {
    const time = this.clock.elapsedTime;
    this.streetLamps.forEach((lamp, idx) => {
      const flicker = Math.sin(time * 8 + idx * 2.3) * 0.35 + Math.cos(time * 14 + idx) * 0.15;
      lamp.light.intensity = lamp.baseIntensity + flicker;
    });

    if (this.droppedSwordLight) {
      this.droppedSwordLight.intensity = 2.0 + Math.sin(time * 6) * 0.6;
    }

    // Shalem tail animation
    if (this.shalemTail) {
      this.shalemTail.rotation.z = Math.sin(time * 3.5) * 0.25;
    }
  }

  private updateEmbers(delta: number): void {
    const pos = this.embersParticles.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += delta * 0.8;
      arr[i] += Math.sin(this.clock.elapsedTime + i) * delta * 0.2;
      if (arr[i + 1] > 6) {
        arr[i + 1] = 0.2;
      }
    }
    pos.needsUpdate = true;
  }

  private updateFloatingTexts(delta: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const item = this.floatingTexts[i];
      item.life -= delta;
      item.pos.y += delta * 1.2;

      // Project 3D coordinate to 2D screen coordinate
      const screenPos = item.pos.clone().project(this.camera);
      const x = (screenPos.x * 0.5 + 0.5) * this.container.clientWidth;
      const y = (-(screenPos.y * 0.5) + 0.5) * this.container.clientHeight;

      item.el.style.left = `${x}px`;
      item.el.style.top = `${y}px`;
      item.el.style.opacity = `${item.life / item.maxLife}`;

      if (item.life <= 0) {
        item.el.remove();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private spawnFloatingText(pos: THREE.Vector3, text: string, color: string): void {
    const el = document.createElement('div');
    el.innerText = text;
    el.style.position = 'absolute';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.color = color;
    el.style.fontSize = '12px';
    el.style.fontWeight = 'bold';
    el.style.fontFamily = "'Cinzel', monospace";
    el.style.textShadow = '0 0 4px #000, 0 0 8px #000';
    el.style.pointerEvents = 'none';
    this.uiOverlay.appendChild(el);

    this.floatingTexts.push({
      el,
      pos: pos.clone().add(new THREE.Vector3(0, 1.8, 0)),
      life: 0.85,
      maxLife: 0.85
    });
  }

  private checkShalemProximity(): void {
    const dist = this.playerGroup.position.distanceTo(this.shalemGroup.position);
    if (dist < 3.2 && !this.shalemSpoke) {
      this.shalemSpoke = true;
      this.setDialogueToast(
        'Shalem',
        '«Aquí en 3D la espada se clava donde la arrojes y las sombras son reales. ¡Esquiva los colmillos del sabueso con <span style="color:#ffd700;">ESPACIO</span>!»',
        '/assets/concepts/concept_shalem.png',
        '#ffd700'
      );
    }
  }

  private updateHUD(): void {
    const heroTitle = this.uiOverlay.querySelector('#p3d-hero-title') as HTMLDivElement;
    const hpBar = this.uiOverlay.querySelector('#p3d-hp') as HTMLDivElement;
    const hpText = this.uiOverlay.querySelector('#p3d-hp-text') as HTMLSpanElement;
    const postureBar = this.uiOverlay.querySelector('#p3d-posture') as HTMLDivElement;
    const weaponBadge = this.uiOverlay.querySelector('#p3d-weapon-badge') as HTMLDivElement;

    if (heroTitle) {
      if (this.activeHero === 'thomas') {
        heroTitle.innerText = '✦ THOMAS — OAKHAVEN 3D ✦';
        heroTitle.style.color = '#ffd700';
      } else {
        heroTitle.innerText = '🏹 KHATERINE — CAZADORA DEL SAUCE 3D 🏹';
        heroTitle.style.color = '#e6b8ff';
      }
    }

    if (hpBar) {
      const pct = Math.max(0, (this.playerStats.health / this.playerStats.maxHealth) * 100);
      hpBar.style.width = `${pct}%`;
    }
    if (hpText) {
      hpText.innerText = `${this.playerStats.health}/${this.playerStats.maxHealth}`;
    }
    if (postureBar) {
      const pPct = Math.max(0, (this.playerStats.posture / this.playerStats.maxPosture) * 100);
      postureBar.style.width = `${pPct}%`;
    }
    if (weaponBadge) {
      if (this.activeHero === 'khaterine') {
        const fireStock = this.arsenalManager.getArrowStock(this.inventory, 'fire');
        const silverStock = this.arsenalManager.getArrowStock(this.inventory, 'silver');
        const selected = this.arsenalManager.getSelectedArrowType();
        const typeLabel = selected === 'abyssal' ? 'Abisal (∞)' : selected === 'fire' ? `Fuego Fatuo (${fireStock})` : `Plata (${silverStock})`;
        weaponBadge.innerHTML = `🏹 MUNICIÓN: <span style="color:#ffd700;font-weight:bold;">${typeLabel}</span> <span style="font-size:6.5px;color:#a3f7ff;">[1/2/3 o Clic]</span>`;
        weaponBadge.style.cursor = 'pointer';
        weaponBadge.style.color = '#e6b8ff';
      } else {
        const flaskStock = this.arsenalManager.getFlaskStock(this.inventory);
        const flaskLabel = flaskStock > 0 ? ` | 🏺 Frasco Sagrado (${flaskStock}) [T]` : ' | [T] Lanzar Arma';
        const swordLabel = this.hasForgedAlbaGris ? '✨ ARMA: Alba Gris (Biseccionada)' : '⚔ ARMA: Espada Corta';
        weaponBadge.innerText = (this.playerStats.isArmed
          ? swordLabel
          : '👊 DESARMADO: Pelea a puños') + flaskLabel;
        weaponBadge.style.cursor = 'default';
        weaponBadge.style.color = this.playerStats.isArmed ? (this.hasForgedAlbaGris ? '#88eeff' : '#e2d4f0') : '#ffaa55';
      }
    }

    if (this.enemyHpBarFill) {
      const ePct = Math.max(0, (this.enemyHealth / this.enemyMaxHealth) * 100);
      this.enemyHpBarFill.style.width = `${ePct}%`;
      const dist = this.playerGroup.position.distanceTo(this.enemyGroup.position);
      if (this.enemyHealth > 0 && dist < 12) {
        if (this.enemyHpBarContainer) this.enemyHpBarContainer.style.display = 'block';
      } else {
        if (this.enemyHpBarContainer) this.enemyHpBarContainer.style.display = 'none';
      }
    }

    if (this.cultistHpBarFill) {
      const cPct = Math.max(0, (this.cultistHealth / this.cultistMaxHealth) * 100);
      this.cultistHpBarFill.style.width = `${cPct}%`;
      const dist = this.playerGroup.position.distanceTo(this.cultistGroup.position);
      if (this.cultistHealth > 0 && dist < 12) {
        if (this.cultistHpBarContainer) this.cultistHpBarContainer.style.display = 'block';
      } else {
        if (this.cultistHpBarContainer) this.cultistHpBarContainer.style.display = 'none';
      }
    }

    if (this.zealotHpBarFill) {
      const zPct = Math.max(0, (this.zealotHealth / this.zealotMaxHealth) * 100);
      this.zealotHpBarFill.style.width = `${zPct}%`;
      const dist = this.playerGroup.position.distanceTo(this.zealotGroup.position);
      if (this.zealotHealth > 0 && dist < 13) {
        if (this.zealotHpBarContainer) this.zealotHpBarContainer.style.display = 'block';
      } else {
        if (this.zealotHpBarContainer) this.zealotHpBarContainer.style.display = 'none';
      }
    }

    if (this.skeletonHpBarFill) {
      const sPct = Math.max(0, (this.skeletonHealth / this.skeletonMaxHealth) * 100);
      this.skeletonHpBarFill.style.width = `${sPct}%`;
      const dist = this.playerGroup.position.distanceTo(this.skeletonGroup.position);
      if (this.skeletonHealth > 0 && dist < 13) {
        if (this.skeletonHpBarContainer) this.skeletonHpBarContainer.style.display = 'block';
      } else {
        if (this.skeletonHpBarContainer) this.skeletonHpBarContainer.style.display = 'none';
      }
    }

    if (this.morwennaHpBarFill) {
      const mPct = Math.max(0, (this.morwennaHealth / this.morwennaMaxHealth) * 100);
      this.morwennaHpBarFill.style.width = `${mPct}%`;
      if (this.morwennaHealth <= 0) {
        this.morwennaHpBarFill.style.background = '#ffd700';
      }
    }

    if (this.crucibleHpBarFill) {
      const pct = Math.max(0, (this.crucibleGuardianEncounter.health / this.crucibleGuardianEncounter.maxHealth) * 100);
      this.crucibleHpBarFill.style.width = `${pct}%`;
      if (this.crucibleGuardianEncounter.isDefeated) this.crucibleHpBarFill.style.background = '#ffd700';
    }

    if (this.vaneHpBarFill) {
      const pct = Math.max(0, (this.captainVaneEncounter.health / this.captainVaneEncounter.maxHealth) * 100);
      this.vaneHpBarFill.style.width = `${pct}%`;
      if (this.captainVaneEncounter.isDefeated) this.vaneHpBarFill.style.background = '#ffd700';
    }

    if (this.malphasHpBarFill) {
      const pct = Math.max(0, (this.rexMalphasEncounter.health / this.rexMalphasEncounter.maxHealth) * 100);
      this.malphasHpBarFill.style.width = `${pct}%`;
      if (this.rexMalphasEncounter.isDefeated) this.malphasHpBarFill.style.background = '#ffd700';
    }

    if (this.astarothHpBarFill) {
      const pct = Math.max(0, (this.astarothEncounter.health / this.astarothEncounter.maxHealth) * 100);
      this.astarothHpBarFill.style.width = `${pct}%`;
      if (this.astarothEncounter.isDefeated) this.astarothHpBarFill.style.background = '#ffd700';
    }

    const btnQuickBalm = this.uiOverlay.querySelector('#btn-quick-balm') as HTMLButtonElement;
    if (btnQuickBalm) {
      const balm = this.inventory.getItem('maiden_balm') || this.inventory.getItem('balm_health');
      const count = balm ? balm.quantity : 0;
      btnQuickBalm.innerText = `🌿 [Q] BÁLSAMO (${count})`;
    }

    const btnSkills = this.uiOverlay.querySelector('#btn-toggle-skills') as HTMLButtonElement;
    if (btnSkills) {
      btnSkills.innerText = `🌟 [H] HABILIDADES (${this.progression.getExp()} EXP)`;
    }

    if (this.attackBuffTimer > 0 && weaponBadge) {
      weaponBadge.innerText += ` | ⚔ ÓLEO (+35%): ${Math.ceil(this.attackBuffTimer)}s`;
    }
  }

  public exit(): void {
    this.destroy();
    if (this.onExitCallback) {
      this.onExitCallback();
    }
  }

  public destroy(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.releaseAllInputs();

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
      window.removeEventListener('pointermove', this.handlePointerMove);
      window.removeEventListener('pointerup', this.handlePointerUp);
    }

    this.floatingTexts.forEach(t => t.el.remove());
    this.floatingTexts = [];

    if (this.uiOverlay) {
      this.uiOverlay.remove();
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }
}
