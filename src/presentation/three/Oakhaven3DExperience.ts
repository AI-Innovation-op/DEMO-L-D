import * as THREE from 'three';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';

export interface CombatStats3D {
  health: number;
  maxHealth: number;
  posture: number;
  maxPosture: number;
  isGuarding: boolean;
  isDodging: boolean;
  isArmed: boolean;
}

export class Oakhaven3DExperience {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock!: THREE.Clock;
  private audio: WebAudioSoundAdapter;

  // Camera settings
  private cameraMode: 'isometric' | 'third_person' = 'isometric';
  private targetCameraPos = new THREE.Vector3();
  private targetCameraLook = new THREE.Vector3();

  // Player 3D
  private playerGroup!: THREE.Group;
  private playerBody!: THREE.Mesh;
  private playerSwordMesh!: THREE.Group;
  private playerFistsGroup!: THREE.Group;
  private playerLight!: THREE.PointLight;
  private playerStats: CombatStats3D = {
    health: 100,
    maxHealth: 100,
    posture: 50,
    maxPosture: 50,
    isGuarding: false,
    isDodging: false,
    isArmed: true
  };
  private playerVelocity = new THREE.Vector3();
  private isPlayerAttacking: boolean = false;
  private attackCooldown: number = 0;
  private dodgeTimer: number = 0;
  private lastGuardTime: number = 0;

  // Dropped Sword in 3D
  private droppedSwordGroup?: THREE.Group;
  private droppedSwordLight?: THREE.PointLight;

  // Enemy 3D (Sabueso de Ceniza / Cultista)
  private enemyGroup!: THREE.Group;
  private enemyHealth: number = 120;
  private enemyMaxHealth: number = 120;
  private enemyState: 'IDLE' | 'CHASE' | 'WINDUP' | 'ATTACK' | 'RECOVERY' | 'STUNNED' | 'DEAD' = 'CHASE';
  private enemyTimer: number = 0;
  private enemyWarningMesh!: THREE.Mesh;
  private enemyHpBarContainer!: HTMLDivElement;
  private enemyHpBarFill!: HTMLDivElement;

  // Shalem 3D (Gato Guía)
  private shalemGroup!: THREE.Group;
  private shalemTail!: THREE.Mesh;
  private shalemSpoke: boolean = false;

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
    this.createEmbers();

    // 5. Build Characters
    this.createPlayer();
    this.createEnemy();
    this.createShalem();

    // 6. Build 3D UI Overlay
    this.createUIOverlay();

    // 7. Bind Inputs
    this.bindInputs();

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
  // PLAYER 3D (THOMAS THE ACOLYTE)
  // =========================================================================
  private createPlayer(): void {
    this.playerGroup = new THREE.Group();
    this.playerGroup.position.set(0, 0, 4);

    // Thomas Body (Stylized dark tunic)
    const tunicMat = new THREE.MeshStandardMaterial({ color: 0x221a29, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9b38c, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.9 });
    const ashMarkMat = new THREE.MeshBasicMaterial({ color: 0x73299e });

    // Torso & Tunic
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.1, 8), tunicMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    this.playerGroup.add(torso);
    this.playerBody = torso;

    // Ash Seal on Chest (Glowing purple/black rune)
    const ashSeal = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.25), ashMarkMat);
    ashSeal.position.set(0, 1.15, 0.36);
    this.playerGroup.add(ashSeal);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), skinMat);
    head.position.y = 1.8;
    head.castShadow = true;
    this.playerGroup.add(head);

    // Hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), hairMat);
    hair.position.set(0, 1.88, -0.04);
    this.playerGroup.add(hair);

    // Scarf / Capelet
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0x3f1f47, roughness: 0.7 });
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.09, 6, 8), scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 1.6;
    this.playerGroup.add(scarf);

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
    this.playerGroup.add(this.playerSwordMesh);

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
    this.playerGroup.add(this.playerFistsGroup);

    // Subtle soul aura around Thomas
    this.playerLight = new THREE.PointLight(0xaa44ff, 1.4, 4);
    this.playerLight.position.set(0, 1.4, 0);
    this.playerGroup.add(this.playerLight);

    this.scene.add(this.playerGroup);
  }

  // =========================================================================
  // ENEMY 3D (ASH PROWLER / SABUESO DE CENIZA)
  // =========================================================================
  private createEnemy(): void {
    this.enemyGroup = new THREE.Group();
    this.enemyGroup.position.set(0, 0, -6);

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
    this.uiOverlay.style.padding = '14px';

    this.uiOverlay.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <!-- Left: Thomas 3D Combat HUD -->
        <div style="background: rgba(14, 9, 23, 0.92); border: 1.5px solid #d4af37; border-radius: 4px; padding: 10px 14px; min-width: 250px; box-shadow: 0 4px 20px rgba(0,0,0,0.8);">
          <div style="font-size: 11px; font-weight: bold; letter-spacing: 1px; margin-bottom: 6px; color: #ffd700;">
            ✦ THOMAS — PROTOTIPO 3D (OAKHAVEN) ✦
          </div>
          <!-- Health Bar -->
          <div style="display: flex; align-items: center; gap: 8px; font-size: 9px; font-family: monospace; color: #ffaaaa; margin-bottom: 4px;">
            <span>SALUD</span>
            <div style="flex: 1; height: 10px; background: #2b0c0c; border: 1px solid #7a2222; border-radius: 2px; overflow: hidden;">
              <div id="p3d-hp" style="width: 100%; height: 100%; background: #22cc44; transition: width 0.15s ease;"></div>
            </div>
            <span id="p3d-hp-text">100/100</span>
          </div>
          <!-- Posture / Guard Bar -->
          <div style="display: flex; align-items: center; gap: 8px; font-size: 9px; font-family: monospace; color: #aaaaff; margin-bottom: 6px;">
            <span>POSTURA</span>
            <div style="flex: 1; height: 6px; background: #0c142b; border: 1px solid #22447a; border-radius: 2px; overflow: hidden;">
              <div id="p3d-posture" style="width: 100%; height: 100%; background: #4488ff; transition: width 0.15s ease;"></div>
            </div>
          </div>
          <!-- Weapon Status Badge -->
          <div id="p3d-weapon-badge" style="font-size: 9.5px; font-family: monospace; color: #e2d4f0; background: rgba(35, 20, 50, 0.7); padding: 3px 6px; border-radius: 3px; border: 1px solid #5a3d78;">
            ⚔ ARMA: Espada Corta del Monaguillo
          </div>
        </div>

        <!-- Right: Actions & Return Button -->
        <div style="pointer-events: auto; display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
          <button id="btn-return-2d" style="background: #2a1440; color: #ffd700; border: 1.5px solid #d4af37; padding: 7px 14px; border-radius: 4px; font-family: 'Cinzel', serif; font-size: 9.5px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.6); transition: all 0.2s;">
            ⮌ VOLVER AL MODO 2D
          </button>
          <button id="btn-toggle-cam" style="background: #141f2a; color: #99ddff; border: 1px solid #336699; padding: 5px 10px; border-radius: 4px; font-family: monospace; font-size: 8.5px; cursor: pointer;">
            🎥 [C] CÁMARA: OBLICUA 3/4
          </button>
        </div>
      </div>

      <!-- Center: Enemy Target HUD (Top Center) -->
      <div id="p3d-enemy-hud" style="position: absolute; top: 14px; left: 50%; transform: translateX(-50%); background: rgba(20, 8, 8, 0.92); border: 1.5px solid #aa2222; border-radius: 4px; padding: 6px 16px; min-width: 220px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.8);">
        <div style="font-size: 9px; font-weight: bold; color: #ffaaaa; margin-bottom: 3px;">
          ⚠ SABUESO DE CENIZA (OAKHAVEN) ⚠
        </div>
        <div style="width: 100%; height: 8px; background: #330b0b; border: 1px solid #881a1a; border-radius: 2px; overflow: hidden;">
          <div id="p3d-enemy-hp-fill" style="width: 100%; height: 100%; background: #dd2222; transition: width 0.1s ease;"></div>
        </div>
      </div>

      <!-- Dialogue Toast (Bottom Center) -->
      <div id="p3d-dialogue-toast" style="position: absolute; bottom: 42px; left: 50%; transform: translateX(-50%); background: rgba(14, 9, 23, 0.96); border: 1.5px solid #d4af37; border-radius: 4px; padding: 8px 18px; max-width: 580px; text-align: center; box-shadow: 0 8px 30px rgba(0,0,0,0.9); font-size: 9.5px; color: #e6dcfa; line-height: 1.4;">
        <span style="color: #ffd700; font-weight: bold;">Shalem:</span> «¡Bienvenido al prototipo 3D, Thomas! Muévete con <span style="color:#ffd700;">WASD</span>, ataca con <span style="color:#ffd700;">J</span>, fuerte con <span style="color:#ffd700;">K</span>, esquiva con <span style="color:#ffd700;">ESPACIO</span> y lanza la espada con <span style="color:#ffd700;">T</span>.»
      </div>

      <!-- Bottom Controls Bar -->
      <div style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); background: rgba(8, 4, 14, 0.95); border: 1px solid #3d2852; border-radius: 3px; padding: 4px 14px; font-family: monospace; font-size: 8px; color: #c5b4db; white-space: nowrap;">
        WASD: Moverse 3D | J: Tajo Ligero | K: Golpe Fuerte | L: Guardia/Parry | Espacio: Esquivar | T: Lanzar Espada | E: Recoger | C: Cámara
      </div>
    `;

    this.container.appendChild(this.uiOverlay);

    // Button interactions
    const btnReturn = this.uiOverlay.querySelector('#btn-return-2d') as HTMLButtonElement;
    btnReturn.addEventListener('click', () => this.exit());

    const btnCam = this.uiOverlay.querySelector('#btn-toggle-cam') as HTMLButtonElement;
    btnCam.addEventListener('click', () => {
      this.toggleCameraMode();
      btnCam.innerText = `🎥 [C] CÁMARA: ${this.cameraMode === 'isometric' ? 'OBLICUA 3/4' : 'TERCERA PERSONA'}`;
    });

    this.enemyHpBarContainer = this.uiOverlay.querySelector('#p3d-enemy-hud') as HTMLDivElement;
    this.enemyHpBarFill = this.uiOverlay.querySelector('#p3d-enemy-hp-fill') as HTMLDivElement;
  }

  // =========================================================================
  // INPUT HANDLERS
  // =========================================================================
  private bindInputs(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.keys[e.key.toLowerCase()] = true;

    // Toggle Camera with [C]
    if (e.key.toLowerCase() === 'c') {
      this.toggleCameraMode();
      const btnCam = this.uiOverlay.querySelector('#btn-toggle-cam') as HTMLButtonElement;
      if (btnCam) {
        btnCam.innerText = `🎥 [C] CÁMARA: ${this.cameraMode === 'isometric' ? 'OBLICUA 3/4' : 'TERCERA PERSONA'}`;
      }
    }

    // Light Attack with [J]
    if (e.key.toLowerCase() === 'j') {
      this.executeAttack(false);
    }

    // Heavy Attack with [K]
    if (e.key.toLowerCase() === 'k') {
      this.executeAttack(true);
    }

    // Dodge with [SPACE]
    if (e.code === 'Space') {
      this.executeDodge();
    }

    // Guard with [L]
    if (e.key.toLowerCase() === 'l') {
      this.playerStats.isGuarding = true;
      this.lastGuardTime = performance.now();
      this.audio.playSfx('dodge');
    }

    // Throw Weapon with [T]
    if (e.key.toLowerCase() === 't') {
      this.executeThrowWeapon();
    }

    // Retrieve Weapon with [E]
    if (e.key.toLowerCase() === 'e') {
      this.executeWeaponPickup();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.key.toLowerCase()] = false;

    if (e.key.toLowerCase() === 'l') {
      this.playerStats.isGuarding = false;
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
  // COMBAT ACTIONS (ATTACK, DODGE, THROW, PARRY)
  // =========================================================================
  private executeAttack(isHeavy: boolean): void {
    if (this.isPlayerAttacking || this.playerStats.isDodging) return;

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

    // Hit Detection against Enemy
    const distToEnemy = this.playerGroup.position.distanceTo(this.enemyGroup.position);
    const reach = this.playerStats.isArmed ? 2.4 : 1.6;

    if (distToEnemy <= reach && this.enemyState !== 'DEAD') {
      const dmg = this.playerStats.isArmed ? (isHeavy ? 42 : 26) : (isHeavy ? 22 : 14);
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
        this.spawnFloatingText(this.enemyGroup.position, '¡PURIFICADO!', '#ffd700');
        this.audio.playFinisherSound(true);
        this.enemyGroup.position.y = -0.3;
      }
    }
  }

  private executeDodge(): void {
    if (this.playerStats.isDodging || this.dodgeTimer > 0) return;

    this.playerStats.isDodging = true;
    this.dodgeTimer = 0.55;
    this.audio.playSfx('dodge');

    // Propel player in forward direction
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.playerGroup.rotation);
    this.playerVelocity.copy(forward.multiplyScalar(9.5));

    this.spawnFloatingText(this.playerGroup.position, '¡ESQUIVADO!', '#88ffaa');

    setTimeout(() => {
      this.playerStats.isDodging = false;
    }, 280);
  }

  private executeThrowWeapon(): void {
    if (!this.playerStats.isArmed) return;

    this.playerStats.isArmed = false;
    this.playerSwordMesh.visible = false;
    this.playerFistsGroup.visible = true;
    this.audio.playSfx('dodge');

    // Create Dropped Sword in World
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.playerGroup.rotation);
    const dropPos = this.playerGroup.position.clone().add(forward.multiplyScalar(4.5));
    dropPos.x = THREE.MathUtils.clamp(dropPos.x, -5.5, 5.5);
    dropPos.z = THREE.MathUtils.clamp(dropPos.z, -22, 10);
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

  private toggleCameraMode(): void {
    this.cameraMode = this.cameraMode === 'isometric' ? 'third_person' : 'isometric';
  }

  // =========================================================================
  // MAIN LOOP & LOGIC
  // =========================================================================
  private animate = (): void => {
    if (!this.isRunning) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updatePlayer(delta);
    this.updateEnemy(delta);
    this.updateCamera(delta);
    this.updateFlickeringLights(delta);
    this.updateEmbers(delta);
    this.updateFloatingTexts(delta);
    this.checkShalemProximity();

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private updatePlayer(delta: number): void {
    // 1. Movement Inputs (WASD)
    let moveX = 0;
    let moveZ = 0;

    if (this.keys['w'] || this.keys['arrowup']) moveZ -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveZ += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    const inputDir = new THREE.Vector3(moveX, 0, moveZ);
    if (inputDir.lengthSq() > 0 && !this.playerStats.isDodging) {
      inputDir.normalize();
      const speed = this.playerStats.isArmed ? 4.8 : 5.6; // Slightly faster when disarmed
      this.playerVelocity.x = inputDir.x * speed;
      this.playerVelocity.z = inputDir.z * speed;

      // Rotate player smoothly toward movement vector
      const targetAngle = Math.atan2(inputDir.x, inputDir.z);
      this.playerGroup.rotation.y = THREE.MathUtils.lerp(this.playerGroup.rotation.y, targetAngle, 0.2);

      // Running subtle body wobble
      this.playerBody.rotation.z = Math.sin(this.clock.elapsedTime * 12) * 0.08;
    } else if (!this.playerStats.isDodging) {
      this.playerVelocity.x *= 0.7;
      this.playerVelocity.z *= 0.7;
      this.playerBody.rotation.z = 0;
    }

    // Apply movement & boundaries along the street
    this.playerGroup.position.x += this.playerVelocity.x * delta;
    this.playerGroup.position.z += this.playerVelocity.z * delta;

    this.playerGroup.position.x = THREE.MathUtils.clamp(this.playerGroup.position.x, -5.2, 5.2);
    this.playerGroup.position.z = THREE.MathUtils.clamp(this.playerGroup.position.z, -23, 11);

    // Timers
    if (this.dodgeTimer > 0) this.dodgeTimer -= delta;
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
  }

  private updateEnemy(delta: number): void {
    if (this.enemyState === 'DEAD') return;

    const toPlayer = this.playerGroup.position.clone().sub(this.enemyGroup.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    // Rotate toward player
    if (dist > 0.1) {
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      this.enemyGroup.rotation.y = THREE.MathUtils.lerp(this.enemyGroup.rotation.y, targetAngle, 0.1);
    }

    // State Machine
    if (this.enemyState === 'CHASE') {
      this.enemyWarningMesh.visible = false;
      if (dist > 2.0) {
        toPlayer.normalize();
        this.enemyGroup.position.add(toPlayer.multiplyScalar(2.6 * delta));
      } else {
        // Start telegraphed wind-up before attacking!
        this.enemyState = 'WINDUP';
        this.enemyTimer = 0.48; // 480ms wind-up window
        this.enemyWarningMesh.visible = true;
        this.audio.playSfx('warning');
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
      // Check for Perfect Parry!
      const isParry = this.playerStats.isGuarding && (performance.now() - this.lastGuardTime) <= 280;
      if (isParry) {
        this.audio.playSfx('parry');
        this.enemyState = 'STUNNED';
        this.enemyTimer = 1.6;
        this.spawnFloatingText(this.playerGroup.position, '¡PARRY PERFECTO!', '#77aaff');
        return;
      }

      // Check for Player Dodge
      if (this.playerStats.isDodging) {
        this.spawnFloatingText(this.playerGroup.position, '¡ESQUIVADO!', '#88ffaa');
        this.enemyState = 'RECOVERY';
        this.enemyTimer = 0.5;
        return;
      }

      // Damage Player
      const dmg = this.playerStats.isGuarding ? 4 : 18;
      this.playerStats.health = Math.max(0, this.playerStats.health - dmg);
      this.audio.playCombatHit(false);
      this.spawnFloatingText(this.playerGroup.position, `-${dmg}`, '#ff4444');
      this.updateHUD();
    }

    this.enemyState = 'RECOVERY';
    this.enemyTimer = 0.45;
  }

  private updateCamera(_delta: number): void {
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
      // Third Person Behind
      const behind = new THREE.Vector3(0, 2.8, 4.2).applyEuler(this.playerGroup.rotation);
      this.targetCameraPos.copy(this.playerGroup.position).add(behind);
      this.targetCameraLook.set(
        this.playerGroup.position.x,
        this.playerGroup.position.y + 1.4,
        this.playerGroup.position.z
      );
    }

    this.camera.position.lerp(this.targetCameraPos, 0.08);
    this.camera.lookAt(this.targetCameraLook);
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
    const toast = this.uiOverlay.querySelector('#p3d-dialogue-toast') as HTMLDivElement;
    if (dist < 3.2 && !this.shalemSpoke) {
      this.shalemSpoke = true;
      if (toast) {
        toast.innerHTML = `<span style="color: #ffd700; font-weight: bold;">Shalem:</span> «Aquí en 3D la espada se clava donde la arrojes y las sombras son reales. ¡Esquiva los colmillos del sabueso con <span style="color:#ffd700;">ESPACIO</span>!»`;
        toast.style.borderColor = '#ffd700';
      }
    }
  }

  private updateHUD(): void {
    const hpBar = this.uiOverlay.querySelector('#p3d-hp') as HTMLDivElement;
    const hpText = this.uiOverlay.querySelector('#p3d-hp-text') as HTMLSpanElement;
    const weaponBadge = this.uiOverlay.querySelector('#p3d-weapon-badge') as HTMLDivElement;

    if (hpBar) {
      const pct = Math.max(0, (this.playerStats.health / this.playerStats.maxHealth) * 100);
      hpBar.style.width = `${pct}%`;
    }
    if (hpText) {
      hpText.innerText = `${this.playerStats.health}/${this.playerStats.maxHealth}`;
    }
    if (weaponBadge) {
      weaponBadge.innerText = this.playerStats.isArmed
        ? '⚔ ARMA: Espada Corta del Monaguillo'
        : '👊 DESARMADO: Pelea a puños [Pulsa E cerca de la espada]';
      weaponBadge.style.color = this.playerStats.isArmed ? '#e2d4f0' : '#ffaa55';
    }

    if (this.enemyHpBarFill) {
      const ePct = Math.max(0, (this.enemyHealth / this.enemyMaxHealth) * 100);
      this.enemyHpBarFill.style.width = `${ePct}%`;
      if (this.enemyHealth <= 0 && this.enemyHpBarContainer) {
        this.enemyHpBarContainer.style.display = 'none';
      }
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

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);

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
