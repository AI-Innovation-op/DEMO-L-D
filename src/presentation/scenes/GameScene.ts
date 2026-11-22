import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { CharacterId, CharacterState } from '../../domain/character/CharacterEnums';
import { Enemy } from '../../domain/enemy/Enemy';
import { Boss, BossPhaseType } from '../../domain/boss/Boss';
import { ShalemCompanion } from '../../domain/companion/ShalemCompanion';
import { Vector2 } from '../../domain/shared/Vector2';
import { CombatUseCases } from '../../application/usecases/CombatUseCases';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';
import { DialogueRepository } from '../../infrastructure/dialogue/DialogueRepository';
import { HUDScene } from './HUDScene';
import { StoryProgress } from '../../domain/story/StoryProgress';
import { ProphecyRepository } from '../../domain/mission/Mission';
import { Weapon } from '../../domain/weapon/Weapon';
import { SessionStateStore } from '../../domain/save/SessionStateStore';
import { EventBus } from '../../domain/shared/DomainEvent';
import { FinisherStyle, FinisherTriggeredEvent } from '../../domain/combat/CombatTypes';
import { registerVisualPackAnimations } from '../assets/VisualPackCatalog';

export class GameScene extends Phaser.Scene {
  // Dual Characters (Thomas & Khaterine)
  public player!: Character;
  public allyChar!: Character;
  private shalem!: ShalemCompanion;
  private audio!: WebAudioSoundAdapter;
  private dialogues!: DialogueRepository;
  public storyProgress: StoryProgress = new StoryProgress();
  private isInvulnerable: boolean = false;

  // Visual Sprites & Ground Shadows
  private bgImage!: Phaser.GameObjects.Image;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private allySprite!: Phaser.GameObjects.Sprite;
  private allyShadow!: Phaser.GameObjects.Ellipse;
  private shalemSprite!: Phaser.GameObjects.Sprite;
  private shalemShadow!: Phaser.GameObjects.Ellipse;

  // Particle Systems
  private emberParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Active Entities
  private enemies: Enemy[] = [];
  private enemySprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private enemyShadows: Map<string, Phaser.GameObjects.Ellipse> = new Map();
  private droppedWeaponSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private scenarioProps: Phaser.GameObjects.GameObject[] = [];

  // Boss
  private currentBoss?: Boss;
  private bossSprite?: Phaser.GameObjects.Sprite;
  private bossShadow?: Phaser.GameObjects.Ellipse;
  private bossMarker?: Phaser.GameObjects.Text;
  private bossMarkerTween?: Phaser.Tweens.Tween;

  // NPC: Elowen de Oakhaven
  private elowenSprite?: Phaser.GameObjects.Sprite;
  private elowenShadow?: Phaser.GameObjects.Ellipse;
  private elowenBadge?: Phaser.GameObjects.Text;
  private hasTalkedToElowen: boolean = false;

  // NPC: Padre Cedric
  private cedricSprite?: Phaser.GameObjects.Sprite;
  private cedricShadow?: Phaser.GameObjects.Ellipse;
  private hasTalkedToCedric: boolean = false;
  private hasRosarioCedric: boolean = false;

  // Dropped Censer (Lamento de Oakhaven)
  private droppedCenserSprite?: Phaser.GameObjects.Image;
  private droppedCenserShadow?: Phaser.GameObjects.Ellipse;
  private droppedCenserMarker?: Phaser.GameObjects.Text;
  private droppedCenserTween?: Phaser.Tweens.Tween;

  // Inventory & Prophecy State
  public prophecy: ProphecyRepository = new ProphecyRepository();
  public unlockedWeaponIds: string[] = ['short_sword'];

  // Combat Mastery: Perfect Parry & Alba Gris
  private lastGuardPressTime: number = 0;
  private hasAlbaGrisAwakened: boolean = false;

  // Game Over Modal State
  private isGameOverModalOpen: boolean = false;
  private gameOverContainer?: Phaser.GameObjects.Container;
  private gameOverFocusIndex: number = 0;
  private gameOverButtons: { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; action: () => void }[] = [];

  // Proximity Interaction
  private activeInteractionTarget?: string;
  private activeInteractionType?: 'finisher' | 'elowen' | 'cedric' | 'censer' | 'shalem' | 'ally' | 'weapon';
  private floatingPromptBadge?: Phaser.GameObjects.Text;

  // Finisher & Hit-Stop Mechanics
  private isFinisherActive: boolean = false;
  private finisherTarget?: { isBoss: boolean; enemy?: Enemy; boss?: Boss; sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image };
  private isHitStopped: boolean = false;
  private hitStopTimer: number = 0;
  private hitStopTargetSprite?: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
  private hitStopOriginalX: number = 0;

  // Environment & Scenarios
  private currentScenario: number = 1;
  private initialScenario: number = 1;

  // Floating text / Shalem dialogue balloon
  private shalemBalloonText!: Phaser.GameObjects.Text;
  private shalemBalloonBg!: Phaser.GameObjects.Rectangle;
  private shalemBalloonTimer: number = 0;

  // Input Keys
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key; // Light Attack
  private keyK!: Phaser.Input.Keyboard.Key; // Heavy Attack
  private keyL!: Phaser.Input.Keyboard.Key; // Guard
  private keySpace!: Phaser.Input.Keyboard.Key; // Dodge
  private keyTab!: Phaser.Input.Keyboard.Key; // Swap Thomas/Khaterine
  private keyT!: Phaser.Input.Keyboard.Key; // Throw Weapon
  private keyQ!: Phaser.Input.Keyboard.Key; // Throw Weapon alias
  private keyE!: Phaser.Input.Keyboard.Key; // Interact / Talk / Pick up
  private keyM!: Phaser.Input.Keyboard.Key; // Shalem Minigame
  private keyP!: Phaser.Input.Keyboard.Key; // Menu Modal
  private keyI!: Phaser.Input.Keyboard.Key; // Inventory & Prophecy
  private keyC!: Phaser.Input.Keyboard.Key; // Character Dialogue
  private keyN!: Phaser.Input.Keyboard.Key; // Mute Audio
  private key1!: Phaser.Input.Keyboard.Key;
  private key2!: Phaser.Input.Keyboard.Key;
  private key3!: Phaser.Input.Keyboard.Key;
  private key4!: Phaser.Input.Keyboard.Key;
  private key5!: Phaser.Input.Keyboard.Key;
  private keyEnter!: Phaser.Input.Keyboard.Key;

  // Act Transition and Exit Portal state
  private isActCleared: boolean = false;
  private isTransitioningAct: boolean = false;
  private exitPortalMarker?: Phaser.GameObjects.Text;
  private exitPortalZone?: Phaser.GameObjects.Ellipse;
  private exitPortalTween?: Phaser.Tweens.Tween;
  private victoryBannerBg?: Phaser.GameObjects.Rectangle;
  private victoryBannerTitle?: Phaser.GameObjects.Text;
  private victoryBannerPrompt?: Phaser.GameObjects.Text;

  // Combat Timers
  private attackCooldown: number = 0;
  private bossAttackTimer: number = 0;
  private timeSinceLastHit: number = 0;

  // Combat Depth & Telegraph Indicators (Segunda Entrega)
  private targetFocusMarker?: Phaser.GameObjects.Text;
  private enemyWarningBadges: Map<string, Phaser.GameObjects.Text> = new Map();
  private bossWarningBadge?: Phaser.GameObjects.Text;
  private bossShieldAura?: Phaser.GameObjects.Arc;
  private activeFlamePillars: Array<{ warningCircle: Phaser.GameObjects.Arc; timer: number; x: number; y: number; hasExploded: boolean }> = [];
  private pillarSpawnTimer: number = 0;
  private kitingTimer: number = 0;
  private rangedHitsOnBoss: number = 0;

  // Training Trial (Safe Zone with Shalem)
  private isTutorialActive: boolean = false;
  private tutorialStep: number = 0;
  private tutorialDummy?: Phaser.GameObjects.Sprite;
  private tutorialDummyShadow?: Phaser.GameObjects.Ellipse;
  private tutorialTargetRing?: Phaser.GameObjects.Ellipse;
  private tutorialBannerBg?: Phaser.GameObjects.Rectangle;
  private tutorialBannerText?: Phaser.GameObjects.Text;
  private tutorialSkipPrompt?: Phaser.GameObjects.Text;
  private tutorialHits: number = 0;
  private shouldPlayOakhavenTraining: boolean = false;
  private keyEsc!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('GameScene');
  }

  public init(data: { characterId?: CharacterId; scenarioIndex?: number }): void {
    const session = SessionStateStore.getInstance();
    const charId = data.characterId || session.leaderId || 'thomas';
    this.initialScenario = data.scenarioIndex || session.currentAct || 1;

    if (charId === 'thomas') {
      this.player = Character.createThomas();
      this.allyChar = Character.createKhaterine();
    } else {
      this.player = Character.createKhaterine();
      this.allyChar = Character.createThomas();
    }

    // Hydrate characters from persistent session so level, EXP and weapons are preserved across acts!
    session.hydrateCharacter(this.player, true);
    session.hydrateCharacter(this.allyChar, true);

    this.shalem = new ShalemCompanion();
    this.audio = new WebAudioSoundAdapter();
    this.dialogues = new DialogueRepository();

    // Reset scene lifecycle and transition state flags so new acts are fully playable!
    this.isTransitioningAct = false;
    this.isActCleared = false;
    this.isInvulnerable = false;
    this.attackCooldown = 0;
    this.bossAttackTimer = 0;
    this.timeSinceLastHit = 0;
    this.enemies = [];
    this.enemySprites.clear();
    this.enemyShadows.clear();
    this.droppedWeaponSprites.clear();
    this.currentBoss = undefined;
    this.bossSprite = undefined;
    this.bossShadow = undefined;
    this.bossMarker = undefined;
    this.bossMarkerTween = undefined;
    this.exitPortalZone = undefined;
    this.exitPortalMarker = undefined;
    this.exitPortalTween = undefined;
    this.victoryBannerBg = undefined;
    this.victoryBannerTitle = undefined;
    this.victoryBannerPrompt = undefined;
    this.floatingPromptBadge = undefined;
    this.isGameOverModalOpen = false;
    this.gameOverContainer = undefined;
    this.lastGuardPressTime = 0;
    this.hasAlbaGrisAwakened = false;
    this.targetFocusMarker = undefined;
    this.enemyWarningBadges.clear();
    this.bossWarningBadge = undefined;
    this.bossShieldAura = undefined;
    this.activeFlamePillars = [];
    this.pillarSpawnTimer = 0;
    this.kitingTimer = 0;
    this.rangedHitsOnBoss = 0;
    this.isTutorialActive = false;
    this.tutorialStep = 0;
    this.tutorialDummy = undefined;
    this.tutorialDummyShadow = undefined;
    this.tutorialTargetRing = undefined;
    this.tutorialBannerBg = undefined;
    this.tutorialBannerText = undefined;
    this.tutorialSkipPrompt = undefined;
    this.tutorialHits = 0;
  }

  public create(): void {
    // 0. Reset camera and ensure act transition state is cleanly reset
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.isTransitioningAct = false;
    this.isActCleared = false;

    // 1. Background image (640x360)
    this.bgImage = this.add.image(320, 180, 'bg_oakhaven').setDisplaySize(640, 360).setDepth(0);

    // 2. Atmospheric Fog Particles
    this.add.particles(320, 270, 'particle_fog', {
      speedX: { min: -15, max: 15 },
      speedY: { min: -5, max: 5 },
      scale: { start: 1, end: 1.8 },
      alpha: { start: 0.35, end: 0 },
      lifespan: 4000,
      frequency: 600
    }).setDepth(5);

    // 3. Floating Ember Particles from Bonfires
    this.emberParticles = this.add.particles(280, 255, 'particle_ember', {
      speedX: { min: -25, max: 35 },
      speedY: { min: -40, max: -90 },
      scale: { start: 1.2, end: 0.2 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 1600,
      frequency: 180
    }).setDepth(6);

    // 4. Setup audio BGM
    this.audio.playBgm('bgm_oakhaven_night');

    // 4.1 Atmospheric Vignette
    this.add.image(320, 180, 'fx_vignette').setDisplaySize(640, 360).setDepth(350).setAlpha(0.6);

    // 4.2 Register All Multi-Frame Animations from the Visual Pack
    registerVisualPackAnimations(this);

    // 5. Player & Shadows (2.5D Depth Arena)
    const initX = 110;
    const initY = 260;
    this.player.position = new Vector2(initX, initY);

    this.playerShadow = this.add.ellipse(initX, initY, 26, 8, 0x000000, 0.45).setDepth(initY - 1);
    const playerTex = this.player.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';
    const playerOriginY = 0.9;
    this.playerSprite = this.normalizeSprite(
      this.add.sprite(initX, initY, playerTex, 0),
      64,
      64,
      0.5,
      playerOriginY
    ).setDepth(initY);
    this.playAnimSafe(this.playerSprite, playerTex);

    // 6. Ally Companion (Walking alongside in 2.5D)
    const allyInitX = 65;
    const allyInitY = 250;
    this.allyChar.position = new Vector2(allyInitX, allyInitY);
    this.allyShadow = this.add.ellipse(allyInitX, allyInitY, 24, 7, 0x000000, 0.4).setDepth(allyInitY - 1);
    const allyTex = this.allyChar.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';
    const allyOriginY = 0.9;
    this.allySprite = this.normalizeSprite(
      this.add.sprite(allyInitX, allyInitY, allyTex, 0),
      64,
      64,
      0.5,
      allyOriginY
    ).setAlpha(0.92).setDepth(allyInitY);
    this.playAnimSafe(this.allySprite, allyTex);

    // 7. Shalem Sprite (Animated Cat Companion in 2.5D)
    const catInitX = 85;
    const catInitY = 268;
    this.shalemShadow = this.add.ellipse(catInitX, catInitY, 20, 6, 0x000000, 0.45).setDepth(catInitY - 1);
    const shalemKey = this.textures.exists('shalem_sit_idle') ? 'shalem_sit_idle' : 'shalem_cat';
    this.shalemSprite = this.normalizeSprite(
      this.add.sprite(catInitX, catInitY, shalemKey, 0),
      36,
      36,
      0.5,
      0.92
    ).setDepth(catInitY);
    this.playAnimSafe(this.shalemSprite, 'shalem_sit_idle');

    // 8. Floating Interaction Badge (Follows nearest interactable target)
    this.floatingPromptBadge = this.add.text(0, 0, '[E] HABLAR', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffd700',
      backgroundColor: 'rgba(15, 8, 26, 0.9)',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(340).setVisible(false);

    // 9. Shalem Dialogue Balloon
    this.shalemBalloonBg = this.add.rectangle(320, 310, 540, 24, 0x140f21, 0.94)
      .setStrokeStyle(1, 0xd4af37)
      .setDepth(345)
      .setVisible(false);

    this.shalemBalloonText = this.add.text(320, 310, '', {
      fontFamily: 'Cinzel, sans-serif',
      fontSize: '9px',
      color: '#ffd700'
    }).setOrigin(0.5).setDepth(346).setVisible(false);

    // 10. Setup Inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
      this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
      this.keyL = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyTab = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
      this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
      this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
      this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
      this.keyC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
      this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
      this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
      this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
      this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
      this.key4 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
      this.key5 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);
      this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    // 10.1 Ground Target & Depth Alignment Focus Marker
    this.targetFocusMarker = this.add.text(0, 0, '▼ [EN LA MIRA] ▼', {
      fontFamily: 'monospace',
      fontSize: '7.5px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(350).setVisible(false);

    // 11. Launch HUDScene if not already running
    if (!this.scene.isActive('HUDScene')) {
      this.scene.launch('HUDScene');
    }

    // Load Initial Scenario (Oakhaven, Londinium or Catedral Invertida)
    this.loadScenario(this.initialScenario);
  }

  public update(_time: number, delta: number): void {
    // 1. Arcade Hit-Stop Processing (Crunchy physical impact pause)
    if (this.isHitStopped) {
      this.hitStopTimer -= delta;
      if (this.hitStopTargetSprite && this.hitStopTargetSprite.active) {
        this.hitStopTargetSprite.x = this.hitStopOriginalX + (Math.random() * 4 - 2);
      }
      if (this.hitStopTimer <= 0) {
        this.isHitStopped = false;
        this.clearHitStopJitter();
      }
      return;
    }

    // 2. Cinematic Finisher lock
    if (this.isFinisherActive) {
      return;
    }

    if (this.isTransitioningAct || this.player.state === CharacterState.DEAD) {
      if (this.player.state === CharacterState.DEAD) {
        if (!this.isGameOverModalOpen) {
          this.triggerGameOver();
        } else {
          this.handleGameOverInput();
        }
      }
      return;
    }

    this.timeSinceLastHit += delta;
    // Posture (Guardia / Escudo) regenerates smoothly if not hit for 2.2 seconds!
    if (this.timeSinceLastHit >= 2200 && this.player.stats.posture < this.player.stats.maxPosture) {
      this.player.stats.restorePosture(25 * (delta / 1000));
    }

    this.handleInput(delta);
    if (this.isTutorialActive) {
      this.updateTraining(delta);
    }
    this.updateShalemAndAlly(delta);
    this.updateEnemies(delta);
    this.updateBoss(delta);
    this.updateDroppedWeapons();
    this.updateProximityInteractions();

    // Proximity next-level auto-transition when walking to the right screen boundary of a cleared act!
    if (this.isActCleared && !this.isTransitioningAct && this.player.position.x >= 595) {
      const nextAct = this.currentScenario < 5 ? (this.currentScenario + 1) : 1;
      this.clearActExit();
      this.transitionToActWithLoading(nextAct);
      return;
    }

    // Sync HUD with active character & dynamic interaction target
    const hud = this.scene.get('HUDScene') as HUDScene;
    if (hud && this.scene.isActive('HUDScene')) {
      hud.updateHUD(
        this.player,
        this.currentBoss,
        this.storyProgress,
        this.activeInteractionTarget,
        this.allyChar.name
      );
    }
  }

  private handleInput(delta: number): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // Quick Next-Level actions when Act is cleared
    if (this.isActCleared && !this.isTransitioningAct) {
      if (
        (this.keyEnter && Phaser.Input.Keyboard.JustDown(this.keyEnter)) ||
        (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace))
      ) {
        const nextAct = this.currentScenario < 5 ? (this.currentScenario + 1) : 1;
        this.clearActExit();
        this.transitionToActWithLoading(nextAct);
        return;
      }
      if (this.keyE && Phaser.Input.Keyboard.JustDown(this.keyE) && this.player.position.x > 500) {
        const nextAct = this.currentScenario < 5 ? (this.currentScenario + 1) : 1;
        this.clearActExit();
        this.transitionToActWithLoading(nextAct);
        return;
      }
    }

    // Switch Scenario keys (now route cleanly through transitionToActWithLoading!)
    if (Phaser.Input.Keyboard.JustDown(this.key1)) {
      this.clearActExit();
      this.transitionToActWithLoading(1);
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.key2)) {
      this.clearActExit();
      this.transitionToActWithLoading(2);
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.key3)) {
      this.clearActExit();
      this.transitionToActWithLoading(3);
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.key4)) {
      this.clearActExit();
      this.transitionToActWithLoading(4);
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.key5)) {
      this.clearActExit();
      this.transitionToActWithLoading(5);
      return;
    }

    // Swap Character with [TAB]
    if (Phaser.Input.Keyboard.JustDown(this.keyTab)) {
      this.swapActiveCharacter();
      return;
    }

    // Open Menu Modal with [P]
    if (Phaser.Input.Keyboard.JustDown(this.keyP)) {
      this.scene.pause('GameScene');
      this.scene.launch('MenuModalScene', { player: this.player, audio: this.audio });
      return;
    }

    // Open Arsenal & Prophecy with [I]
    if (this.keyI && Phaser.Input.Keyboard.JustDown(this.keyI)) {
      this.openInventoryScene();
      return;
    }

    // Interactive Character Dialogue with [C]
    if (Phaser.Input.Keyboard.JustDown(this.keyC)) {
      this.scene.pause('GameScene');
      this.scene.launch('CharacterDialogueScene', {
        player: this.player,
        scenarioIndex: this.currentScenario,
        audio: this.audio
      });
      return;
    }

    // Toggle Audio Mute with [N]
    if (Phaser.Input.Keyboard.JustDown(this.keyN)) {
      this.audio.toggleMute();
    }

    // Shalem Minigame [M]
    if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
      if (this.player.levelUp.isMinigameReady) {
        this.scene.pause('GameScene');
        this.scene.launch('ShalemMinigameScene', {
          player: this.player,
          shalem: this.shalem,
          audio: this.audio
        });
        return;
      } else {
        this.triggerShalemBalloon("Shalem bosteza: «Aún no has llenado la barra de Level Up, monaguillo. ¡Sigue combatiendo!»");
      }
    }

    // Dodge [SPACE] with ghost afterimage trail
    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      if (this.player.startDodge()) {
        this.audio.playSfx('dodge');
        const dashDir = this.player.facingDirection;

        // Play Dodge animation from Visual Pack
        const dodgeAnim = this.player.id === 'thomas' ? 'thomas_dodge' : 'khaterine_dodge';
        this.playAnimSafe(this.playerSprite, dodgeAnim, true);

        // Spawn afterimage ghost
        const ghost = this.add.sprite(this.playerSprite.x, this.playerSprite.y, this.playerSprite.texture.key, this.playerSprite.frame?.name ?? 0)
          .setOrigin(0.5, this.playerSprite.originY)
          .setAlpha(0.6)
          .setScale(this.playerSprite.scaleX, this.playerSprite.scaleY)
          .setTint(0x9933ff)
          .setDepth(this.playerSprite.depth - 1);

        this.tweens.add({
          targets: ghost,
          alpha: 0,
          scaleX: ghost.scaleX * 1.25,
          duration: 250,
          onComplete: () => ghost.destroy()
        });

        const targetX = Phaser.Math.Clamp(this.playerSprite.x + dashDir * 60, 35, 605);
        this.tweens.add({
          targets: this.playerSprite,
          x: targetX,
          alpha: 0.5,
          duration: 180,
          yoyo: true,
          onComplete: () => {
            this.player.position = new Vector2(this.playerSprite.x, this.playerSprite.y);
            this.player.finishDodge();
            const isDisarmed = this.player.disarmManager.isPlayerDisarmed();
            const idleAnim = this.player.id === 'thomas' ? (isDisarmed ? 'thomas_unarmed_idle' : 'thomas_idle') : 'khaterine_idle';
            this.playAnimSafe(this.playerSprite, idleAnim);
            if (this.isTutorialActive && this.tutorialStep === 4) {
              this.time.delayedCall(300, () => this.finishTrainingAndSpawnRealEnemies());
            }
          }
        });
      }
    }

    // Block [L] (Held)
    if (this.keyL.isDown) {
      if (Phaser.Input.Keyboard.JustDown(this.keyL)) {
        this.lastGuardPressTime = this.time.now;
        const guardAnim = this.player.id === 'thomas' ? 'thomas_guard' : 'khaterine_ward';
        this.playAnimSafe(this.playerSprite, guardAnim, true);
      }
      this.player.startBlock();
      this.playerSprite.setTint(0x77aaff);
    } else if (this.player.state === CharacterState.BLOCKING) {
      this.player.stopBlock();
      this.playerSprite.clearTint();
      const isDisarmed = this.player.disarmManager.isPlayerDisarmed();
      const idleAnim = this.player.id === 'thomas' ? (isDisarmed ? 'thomas_unarmed_idle' : 'thomas_idle') : 'khaterine_idle';
      this.playAnimSafe(this.playerSprite, idleAnim);
    }

    // Light Attack [J]
    if (Phaser.Input.Keyboard.JustDown(this.keyJ) && this.attackCooldown <= 0) {
      this.executeAttack(false);
      this.attackCooldown = 240;
    }

    // Heavy Attack [K]
    if (Phaser.Input.Keyboard.JustDown(this.keyK) && this.attackCooldown <= 0) {
      this.executeAttack(true);
      this.attackCooldown = 420;
    }

    // Voluntary Weapon Throw (Option B) [T] or [Q]
    if (Phaser.Input.Keyboard.JustDown(this.keyT) || Phaser.Input.Keyboard.JustDown(this.keyQ)) {
      this.executeWeaponThrow();
      if (this.isTutorialActive && this.tutorialStep === 4) {
        this.time.delayedCall(300, () => this.finishTrainingAndSpawnRealEnemies());
      }
    }

    // Proximity Interaction / Pick Up [E]
    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      this.executeContextInteraction();
    }

    // 2.5D Movement (A / D / W / S or Arrows)
    let moveX = 0;
    let moveY = 0;

    if (this.keyA.isDown || this.cursors.left.isDown) moveX -= 1;
    if (this.keyD.isDown || this.cursors.right.isDown) moveX += 1;
    if (this.keyW.isDown || this.cursors.up.isDown) moveY -= 1;
    if (this.keyS.isDown || this.cursors.down.isDown) moveY += 1;

    if ((moveX !== 0 || moveY !== 0) &&
        this.player.state !== CharacterState.BLOCKING &&
        this.player.state !== CharacterState.ATTACKING &&
        this.player.state !== CharacterState.DODGING) {

      const mag = Math.hypot(moveX, moveY);
      const normX = moveX / mag;
      const normY = moveY / mag;

      const baseSpeed = this.player.stats.speed;
      const vx = normX * baseSpeed * 1.05 * (delta / 1000);
      const vy = normY * baseSpeed * 0.72 * (delta / 1000);

      const nextX = Phaser.Math.Clamp(this.playerSprite.x + vx, 35, 605);
      const nextY = Phaser.Math.Clamp(this.playerSprite.y + vy, 205, 315);

      this.playerSprite.setPosition(nextX, nextY);
      this.player.position = new Vector2(nextX, nextY);

      if (moveX !== 0) {
        this.player.facingDirection = moveX > 0 ? 1 : -1;
      }
      this.player.move(moveX, moveY);

      // Play run/walk animation for active hero
      const moveAnim = this.player.id === 'thomas' ? 'thomas_run' : 'khaterine_run';
      this.playAnimSafe(this.playerSprite, moveAnim);

      // 2.5D Perspective Scaling (scale smoothly between 0.90 and 1.12)
      const scale = 0.90 + ((nextY - 205) / 110) * 0.22;
      this.playerSprite.setScale(this.player.facingDirection > 0 ? scale : -scale, scale);

      // Depth sorting
      this.playerSprite.setDepth(nextY);
      this.playerShadow.setPosition(nextX, nextY).setDepth(nextY - 1).setScale(scale);
    } else {
      this.player.move(0, 0);
      if (this.player.state !== CharacterState.ATTACKING &&
          this.player.state !== CharacterState.DODGING &&
          this.player.state !== CharacterState.BLOCKING) {
        const isDisarmed = this.player.disarmManager.isPlayerDisarmed();
        const idleAnim = this.player.id === 'thomas'
          ? (isDisarmed ? 'thomas_unarmed_idle' : 'thomas_idle')
          : 'khaterine_idle';
        this.playAnimSafe(this.playerSprite, idleAnim);
      }
    }
  }

  private swapActiveCharacter(): void {
    this.audio.playSfx('dodge');
    this.cameras.main.flash(200, 160, 80, 240);

    if (this.playerSprite.anims.isPlaying) {
      this.playerSprite.stop();
    }
    if (this.allySprite.anims.isPlaying) {
      this.allySprite.stop();
    }

    // Swap characters
    const temp = this.player;
    this.player = this.allyChar;
    this.allyChar = temp;

    // Swap positions
    const oldPlayerX = this.playerSprite.x;
    const oldPlayerY = this.playerSprite.y;
    this.playerSprite.setPosition(this.allySprite.x, this.allySprite.y);
    this.allySprite.setPosition(oldPlayerX, oldPlayerY);

    this.player.position = new Vector2(this.playerSprite.x, this.playerSprite.y);
    this.allyChar.position = new Vector2(this.allySprite.x, this.allySprite.y);

    // Swap textures and play idle animations
    const isPlayerDisarmed = this.player.id === 'thomas' && this.player.disarmManager.isPlayerDisarmed();
    const isAllyDisarmed = this.allyChar.id === 'thomas' && this.allyChar.disarmManager.isPlayerDisarmed();
    const playerTex = this.player.id === 'thomas' ? (isPlayerDisarmed ? 'thomas_unarmed_idle' : 'thomas_idle') : 'khaterine_idle';
    const allyTex = this.allyChar.id === 'thomas' ? (isAllyDisarmed ? 'thomas_unarmed_idle' : 'thomas_idle') : 'khaterine_idle';

    this.playAnimSafe(this.playerSprite, playerTex, true);
    this.playAnimSafe(this.allySprite, allyTex, true);

    this.normalizeSprite(this.playerSprite, 64, 64, 0.5, 0.9);
    this.normalizeSprite(this.allySprite, 64, 64, 0.5, 0.9);

    this.triggerShalemBalloon(
      `Shalem: «¡Ahora juegas como ${this.player.name}! ${this.player.id === 'khaterine' ? '¡Purifica las sombras con tu arco abisal!' : '¡Avanza con tu espada y tus puños!' }»`,
      3500
    );
  }

  private openInventoryScene(): void {
    this.audio.playSfx('menu_select');
    this.scene.pause('GameScene');
    this.scene.launch('InventoryScene', {
      player: this.player,
      prophecy: this.prophecy,
      unlockedWeaponIds: this.unlockedWeaponIds,
      hasRosarioCedric: this.hasRosarioCedric
    });
  }

  private executeContextInteraction(): void {
    if (this.activeInteractionType === 'finisher') {
      this.executeFinisherSequence();
    } else if (this.activeInteractionType === 'elowen') {
      this.interactWithElowen();
    } else if (this.activeInteractionType === 'cedric') {
      this.interactWithCedric();
    } else if (this.activeInteractionType === 'censer') {
      this.pickupLamentoOakhaven();
    } else if (this.activeInteractionType === 'weapon') {
      this.executeWeaponPickup();
    } else if (this.activeInteractionType === 'shalem') {
      if (this.player.levelUp.isMinigameReady) {
        this.scene.pause('GameScene');
        this.scene.launch('ShalemMinigameScene', {
          player: this.player,
          shalem: this.shalem,
          audio: this.audio
        });
      } else {
        this.triggerShalemBalloon(`Shalem: «${this.dialogues.getShalemSarcasm()}»`, 4000);
      }
    } else if (this.activeInteractionType === 'ally') {
      this.scene.pause('GameScene');
      this.scene.launch('CharacterDialogueScene', {
        player: this.player,
        scenarioIndex: this.currentScenario,
        audio: this.audio
      });
    } else {
      // Fallback: check weapon pickup
      this.executeWeaponPickup();
    }
  }

  private interactWithElowen(): void {
    this.audio.playSfx('menu_select');

    if (!this.hasTalkedToElowen) {
      this.hasTalkedToElowen = true;
      this.player.heal(35);
      this.player.stats.restorePosture(this.player.stats.maxPosture);
      this.storyProgress.addProgress(15);
      this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, 35, false, '#88ff88');

      if (this.currentScenario === 1) {
        this.storyProgress.completeMilestone('act1_dialogue');
        // Pause GameScene and open canonical Elowen dialogue overlay
        this.scene.pause('GameScene');
        this.scene.launch('CharacterDialogueScene', {
          player: this.player,
          scenarioIndex: 1,
          audio: this.audio,
          dialogueType: 'elowen'
        });
      } else if (this.currentScenario === 2) {
        this.storyProgress.completeMilestone('act2_elowen');
        this.scene.pause('GameScene');
        this.scene.launch('CharacterDialogueScene', {
          player: this.player,
          scenarioIndex: 2,
          audio: this.audio,
          dialogueType: 'elowen_belltower'
        });
      } else if (this.currentScenario === 3) {
        this.storyProgress.completeMilestone('act3_refugees');
        this.scene.pause('GameScene');
        this.scene.launch('CharacterDialogueScene', {
          player: this.player,
          scenarioIndex: 3,
          audio: this.audio,
          dialogueType: 'elowen_bridge'
        });
      } else if (this.currentScenario === 4) {
        this.storyProgress.completeMilestone('act4_prophecy');
        this.scene.pause('GameScene');
        this.scene.launch('CharacterDialogueScene', {
          player: this.player,
          scenarioIndex: 4,
          audio: this.audio,
          dialogueType: 'elowen_londinium'
        });
      } else {
        this.storyProgress.completeMilestone('act5_weapon');
        this.awakenAlbaGris();
        this.scene.pause('GameScene');
        this.scene.launch('CharacterDialogueScene', {
          player: this.player,
          scenarioIndex: 5,
          audio: this.audio,
          dialogueType: 'elowen_cathedral'
        });
      }
    } else {
      // Repeat dialogue varies by scenario
      if (this.currentScenario === 1) {
        this.triggerShalemBalloon("Elowen: «Que la verdadera luz guarde tus pasos, Thomas...»", 5000);
      } else if (this.currentScenario === 2) {
        this.triggerShalemBalloon("Elowen: «Guarda el pájaro de madera... El lino y carbón revelarán la verdad en Londinium.»", 5000);
      } else if (this.currentScenario === 3) {
        this.triggerShalemBalloon("Elowen: «Los refugiados están a salvo... ¡Ahora crucemos las puertas de la capital!»", 5000);
      } else if (this.currentScenario === 4) {
        this.triggerShalemBalloon("Elowen: «No desperdicies tiempo conmigo... Derrota al rey y libera a Albion.»", 5000);
      } else {
        this.triggerShalemBalloon("Elowen: «Mi luz ya está en tu espada, Thomas. Termina lo que empezamos juntos...»", 5000);
      }
    }
  }

  private interactWithCedric(): void {
    this.audio.playSfx('menu_select');

    if (!this.hasTalkedToCedric) {
      this.hasTalkedToCedric = true;
      this.hasRosarioCedric = true;
      this.prophecy.unlockFragment(1);
      this.player.gainExperience(35);
      this.player.stats.restorePosture(this.player.stats.maxPosture);
      this.storyProgress.addProgress(15);
      this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, 20, false, '#ffd700');

      this.scene.pause('GameScene');
      this.scene.launch('CharacterDialogueScene', {
        player: this.player,
        scenarioIndex: 1,
        audio: this.audio,
        dialogueType: 'cedric'
      });
    } else {
      this.triggerShalemBalloon("Padre Cedric: «Que la verdadera bondad guarde tu espada, Thomas...»", 4500);
    }
  }

  private pickupLamentoOakhaven(): void {
    if (this.droppedCenserSprite) {
      this.audio.playCenserSwing();
      if (!this.unlockedWeaponIds.includes('lamento_oakhaven')) {
        this.unlockedWeaponIds.push('lamento_oakhaven');
      }
      this.player.disarmManager.setEquippedPrimary(Weapon.createLamentoOakhaven());

      this.droppedCenserSprite.destroy();
      this.droppedCenserSprite = undefined;
      this.droppedCenserShadow?.destroy();
      this.droppedCenserShadow = undefined;
      this.droppedCenserMarker?.destroy();
      this.droppedCenserMarker = undefined;
      this.droppedCenserTween?.stop();
      this.droppedCenserTween = undefined;

      this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, 50, true, '#88ff88');
      this.triggerShalemBalloon(
        "★ ¡HAS OBTENIDO EL LAMENTO DE OAKHAVEN! ★ (Incensario equipado · «Cosecha de Culpa» cura +5 HP en combos)",
        7000
      );
    }
  }

  private updateProximityInteractions(): void {
    const px = this.playerSprite.x;
    const py = this.playerSprite.y;

    let closestDist = Infinity;
    let targetType: 'finisher' | 'elowen' | 'cedric' | 'censer' | 'shalem' | 'ally' | 'weapon' | undefined = undefined;
    let targetLabel: string | undefined = undefined;
    let targetX = 0;
    let targetY = 0;

    // 0. PRIORITY 1: Stunned / Broken Posture Enemies or Boss for Finisher [E]
    this.finisherTarget = undefined;
    if (!this.isActCleared && !this.isTransitioningAct && !this.isFinisherActive) {
      // Check current Boss first
      if (this.currentBoss && this.bossSprite && this.currentBoss.health > 0) {
        const isVulnerable = this.currentBoss.posture <= 0 || this.currentBoss.state === 'STUNNED';
        if (isVulnerable) {
          const dist = Math.hypot(px - this.bossSprite.x, py - this.bossSprite.y);
          if (dist < 80 && dist < closestDist) {
            closestDist = dist;
            targetType = 'finisher';
            targetLabel = `¡REMATAR A ${this.currentBoss.name.toUpperCase()}!`;
            targetX = this.bossSprite.x;
            targetY = this.bossSprite.y - 55;
            this.finisherTarget = { isBoss: true, boss: this.currentBoss, sprite: this.bossSprite };
          }
        }
      }

      // Check standard enemies
      for (const enemy of this.enemies) {
        if (!enemy.isAlive()) continue;
        const sprite = this.enemySprites.get(enemy.id);
        if (!sprite) continue;
        const isVulnerable = enemy.posture <= 0 || enemy.state === 'STUNNED';
        if (isVulnerable) {
          const dist = Math.hypot(px - sprite.x, py - sprite.y);
          if (dist < 75 && dist < closestDist) {
            closestDist = dist;
            targetType = 'finisher';
            targetLabel = `¡REMATAR A ${enemy.name.toUpperCase()}!`;
            targetX = sprite.x;
            targetY = sprite.y - 45;
            this.finisherTarget = { isBoss: false, enemy: enemy, sprite: sprite };
          }
        }
      }
    }

    // 0. Check Dropped Censer (Lamento de Oakhaven)
    if (this.droppedCenserSprite) {
      const dist = Math.hypot(px - this.droppedCenserSprite.x, py - this.droppedCenserSprite.y);
      if (dist < 46 && dist < closestDist) {
        closestDist = dist;
        targetType = 'censer';
        targetLabel = 'Lamento de Oakhaven (Incensario)';
        targetX = this.droppedCenserSprite.x;
        targetY = this.droppedCenserSprite.y - 35;
      }
    }

    // 0.5. Check Padre Cedric (Scenario 1)
    if (this.currentScenario === 1 && this.cedricSprite) {
      const dist = Math.hypot(px - this.cedricSprite.x, py - this.cedricSprite.y);
      if (dist < 48 && dist < closestDist) {
        closestDist = dist;
        targetType = 'cedric';
        targetLabel = 'Padre Cedric (Anciano Devoto)';
        targetX = this.cedricSprite.x;
        targetY = this.cedricSprite.y - 55;
      }
    }

    // 1. Check Elowen (all scenarios)
    if (this.elowenSprite) {
      const dist = Math.hypot(px - this.elowenSprite.x, py - this.elowenSprite.y);
      if (dist < 48 && dist < closestDist) {
        closestDist = dist;
        targetType = 'elowen';
        targetLabel = 'Elowen de Oakhaven';
        targetX = this.elowenSprite.x;
        targetY = this.elowenSprite.y - 55;
      }
    }

    // 2. Check Dropped Weapons
    for (const [, container] of this.droppedWeaponSprites.entries()) {
      const dist = Math.hypot(px - container.x, py - container.y);
      if (dist < 42 && dist < closestDist) {
        closestDist = dist;
        targetType = 'weapon';
        targetLabel = 'Recoger Arma';
        targetX = container.x;
        targetY = container.y - 25;
      }
    }

    // 3. Check Shalem
    const distShalem = Math.hypot(px - this.shalemSprite.x, py - this.shalemSprite.y);
    if (distShalem < 42 && distShalem < closestDist) {
      closestDist = distShalem;
      targetType = 'shalem';
      targetLabel = 'Shalem el Gato';
      targetX = this.shalemSprite.x;
      targetY = this.shalemSprite.y - 30;
    }

    // 4. Check Ally
    const distAlly = Math.hypot(px - this.allySprite.x, py - this.allySprite.y);
    if (distAlly < 45 && distAlly < closestDist) {
      closestDist = distAlly;
      targetType = 'ally';
      targetLabel = `${this.allyChar.name} (Compañero/a)`;
      targetX = this.allySprite.x;
      targetY = this.allySprite.y - 55;
    }

    this.activeInteractionType = targetType;
    this.activeInteractionTarget = targetLabel;

    if (targetType && targetLabel && this.floatingPromptBadge) {
      if (targetType === 'finisher') {
        this.floatingPromptBadge
          .setPosition(targetX, targetY)
          .setText('⚡ [E] ¡REMATAR!')
          .setColor('#ffd700')
          .setBackgroundColor('rgba(65, 12, 38, 0.95)')
          .setFontSize('9.5px')
          .setStroke('#000000', 3)
          .setVisible(true);
      } else {
        const verb = (targetType === 'weapon' || targetType === 'censer') ? 'RECOGER' : 'HABLAR';
        this.floatingPromptBadge
          .setPosition(targetX, targetY)
          .setText(`[E] ${verb}`)
          .setColor('#ffd700')
          .setBackgroundColor('rgba(15, 8, 26, 0.9)')
          .setFontSize('8px')
          .setStroke('#000000', 0)
          .setVisible(true);
      }
    } else if (this.floatingPromptBadge) {
      this.floatingPromptBadge.setVisible(false);
    }
  }

  private executeAttack(isHeavy: boolean): void {
    const isDisarmed = this.player.disarmManager.isPlayerDisarmed();

    // Khaterine: Ranged Abyssal Spellcasting / Bow Shot
    if (this.player.id === 'khaterine' && !isDisarmed) {
      this.castKhaterineSpell(isHeavy);
      return;
    }

    const attackAnim = isDisarmed
      ? (isHeavy ? 'thomas_punch_heavy' : 'thomas_punch_light')
      : (isHeavy ? 'thomas_slash_heavy' : 'thomas_slash_light');

    this.playAnimSafe(this.playerSprite, attackAnim, true);
    this.audio.playCombatHit(isHeavy);

    if (isHeavy) {
      this.cameras.main.shake(180, 0.014);
    }

    const playerX = this.playerSprite.x;
    const playerY = this.playerSprite.y;
    const facing = this.player.facingDirection;
    const attackRange = this.player.disarmManager.getCurrentWeapon().range;

    // Fluid forward micro-step during attack
    const stepDist = isHeavy ? 10 : 6;
    const nextPlayerX = Phaser.Math.Clamp(playerX + facing * stepDist, 35, 605);
    this.tweens.add({
      targets: this.playerSprite,
      x: nextPlayerX,
      duration: 90,
      ease: 'Quad.easeOut'
    });
    this.player.position = new Vector2(nextPlayerX, this.player.position.y);

    // Visual Slash Arc Effect using Official VFX Sprite Sheets (fx_slash_gold / fx_slash_abyss)
    if (!isDisarmed) {
      const curWpn = this.player.disarmManager.getCurrentWeapon();
      const isAlbaGris = curWpn.id === 'alba_gris' || this.hasAlbaGrisAwakened;

      const vfxKey = (isAlbaGris || isHeavy) ? 'fx_slash_gold' : 'fx_slash_abyss';
      this.spawnAnimatedVfx(
        playerX + facing * (isHeavy ? 32 : 26),
        playerY - 26,
        vfxKey,
        isHeavy ? 1.25 : 1.0,
        facing < 0
      );

      if (isAlbaGris) {
        this.castAlbaGrisWave(playerX, playerY, facing, isHeavy);
      }
    }

    const reachX = attackRange + (isHeavy ? 65 : 45);
    const reachY = isHeavy ? 35 : 26;

    // Check hit against active enemies in 2.5D
    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;
      const dx = (enemy.position.x - playerX) * facing;
      const dy = Math.abs(enemy.position.y - playerY);

      if (dx > 0 && dx <= reachX && dy <= reachY) {
        const res = CombatUseCases.executeAttackOnEnemy(this.player, enemy, isHeavy);

        this.cameras.main.shake(isHeavy ? 160 : 100, isHeavy ? 0.012 : 0.006);
        this.spawnDamageNumber(enemy.position.x, enemy.position.y - 35, res.damageDealt, isHeavy);

        // Passive Effect: Cosecha de Culpa (Lamento de Oakhaven heals on strike)
        const curWpn = this.player.disarmManager.getCurrentWeapon();
        if (curWpn.specialEffect === 'COSECHA_CULPA') {
          this.player.heal(5);
          this.audio.playHealingEmber();
          this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, 5, false, '#88ffaa');
        }

        const sprite = this.enemySprites.get(enemy.id);
        if (sprite) {
          if (isHeavy) {
            this.triggerHitStop(70, sprite);
          }
          sprite.setTint(0xff3333);
          this.time.delayedCall(120, () => sprite.clearTint());

          if (res.targetKilled) {
            const deathAnim = this.getEnemyAnimKey(enemy.id, 'death');
            this.playAnimSafe(sprite, deathAnim, true);
            this.spawnAnimatedVfx(enemy.position.x, enemy.position.y - 24, 'fx_bone_shatter', 1.0, false);

            this.tweens.add({
              targets: sprite,
              alpha: 0,
              y: sprite.y - 10,
              delay: 260,
              duration: 280,
              onComplete: () => {
                sprite.destroy();
                this.enemyShadows.get(enemy.id)?.destroy();
                this.enemyShadows.delete(enemy.id);
              }
            });

            const remainingEnemies = this.enemies.filter(e => e.isAlive());
            if (remainingEnemies.length === 0) {
              this.storyProgress.completeMilestone('act1_monks');
              this.storyProgress.completeMilestone('act1_beast');
              this.storyProgress.addProgress(25);
              this.triggerShalemBalloon("Shalem: «¡Los acechadores han caído! ¡Ahora avanza hacia la derecha y destruye a la Madre Morwenna junto a la pira!»", 5000);
            } else {
              this.storyProgress.addProgress(25);
            }
          } else {
            // Play stagger animation & fluid knockback
            const staggerAnim = this.getEnemyAnimKey(enemy.id, 'stagger');
            this.playAnimSafe(sprite, staggerAnim, true);
            const knockDist = isHeavy ? 14 : 8;
            const knockX = Phaser.Math.Clamp(enemy.position.x + facing * knockDist, 35, 605);
            enemy.position = new Vector2(knockX, enemy.position.y);
            this.tweens.add({
              targets: sprite,
              x: knockX,
              duration: 110,
              ease: 'Cubic.easeOut'
            });
            const shadow = this.enemyShadows.get(enemy.id);
            if (shadow) {
              this.tweens.add({
                targets: shadow,
                x: knockX,
                duration: 110,
                ease: 'Cubic.easeOut'
              });
            }
          }
        }
        break;
      }
    }

    // Check hit against Training Dummy in Step 2 of Tutorial
    if (this.isTutorialActive && this.tutorialStep === 2 && this.tutorialDummy) {
      const tdx = (this.tutorialDummy.x - playerX) * facing;
      const tdy = Math.abs(this.tutorialDummy.y - playerY);
      if (tdx > 0 && tdx <= reachX + 15 && tdy <= reachY + 12) {
        this.tutorialHits++;
        this.cameras.main.shake(isHeavy ? 140 : 80, isHeavy ? 0.01 : 0.005);
        this.spawnDamageNumber(this.tutorialDummy.x, this.tutorialDummy.y - 45, isHeavy ? 56 : 35, isHeavy);
        this.tutorialDummy.setTint(0xffffff);
        this.time.delayedCall(100, () => this.tutorialDummy?.clearTint());
        if (this.tutorialHits >= 2) {
          this.advanceTrainingStep(3);
        }
      }
    }

    // Check hit against Boss in 2.5D
    if (this.currentBoss && this.bossSprite && this.currentBoss.health > 0) {
      const bdx = (this.currentBoss.position.x - playerX) * facing;
      const bdy = Math.abs(this.currentBoss.position.y - playerY);
      const effectiveReachX = reachX + 25;
      const effectiveReachY = reachY + 16;

      if (bdx > 0 && bdx <= effectiveReachX && bdy <= effectiveReachY) {
        // If boss has active flame shield and attack is heavy -> SHATTER!
        if (this.currentBoss.isFlameShieldActive && isHeavy) {
          this.destroyBossShieldAura();
          this.audio.playSfx('shield_break');
          this.triggerHitStop(110, this.bossSprite);
          this.cameras.main.shake(220, 0.02);
          this.spawnDamageNumber(this.currentBoss.position.x, this.currentBoss.position.y - 65, '¡ESCUDO ROTO!', true, '#ffd700');
          this.currentBoss.interruptAttack(1400);
          if (this.currentBoss.id === 'madre_morwenna') {
            this.playAnimSafe(this.bossSprite, 'morwenna_stunned', true);
          }
          this.triggerShalemBalloon("Shalem: «¡Eso es, muchacho! ¡El escudo se hizo añicos! ¡Remátala!»", 3200);
        }

        const prevPhase = this.currentBoss.phase;
        const res = CombatUseCases.executeAttackOnBoss(this.player, this.currentBoss, isHeavy, false);
        if (this.currentBoss.id === 'madre_morwenna' && prevPhase === BossPhaseType.PHASE_1 && this.currentBoss.phase === BossPhaseType.PHASE_2) {
          this.playAnimSafe(this.bossSprite, 'morwenna_phase2_shockwave', true);
          this.spawnAnimatedVfx(this.currentBoss.position.x, this.currentBoss.position.y - 35, 'fx_pyre_explosion', 1.1, false);
        }

        if (isHeavy) {
          this.triggerHitStop(75, this.bossSprite);
        }

        this.cameras.main.shake(isHeavy ? 200 : 140, isHeavy ? 0.016 : 0.01);
        this.spawnDamageNumber(this.currentBoss.position.x, this.currentBoss.position.y - 50, res.damageDealt, true);

        // Passive Effect: Cosecha de Culpa
        const curWpn = this.player.disarmManager.getCurrentWeapon();
        if (curWpn.specialEffect === 'COSECHA_CULPA') {
          this.player.heal(5);
          this.audio.playHealingEmber();
          this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, 5, false, '#88ffaa');
        }

        this.bossSprite.setTint(0xff5555);
        this.time.delayedCall(120, () => this.bossSprite?.clearTint());

        if (res.targetKilled) {
          this.handleBossDefeated();
        }
      } else if (bdx > effectiveReachX && this.enemies.filter(e => e.isAlive()).length === 0) {
        this.triggerShalemBalloon("Shalem: «¡Estás demasiado lejos! ¡Acércate más a la Madre Morwenna para alcanzarla con tu arma!»", 2800);
      }
    }

    // Reset to idle animation after attack completes
    this.time.delayedCall(isHeavy ? 340 : 230, () => {
      const idleAnim = isDisarmed
        ? 'thomas_unarmed_idle'
        : (this.player.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle');
      this.playAnimSafe(this.playerSprite, idleAnim);
      this.player.finishAttack();
    });
  }

  /** Khaterine shoots a ranged Abyssal Arrow / Energy Bolt using khaterine_shoot_light/heavy and fx_arrow_abyssal. */
  private castKhaterineSpell(isHeavy: boolean): void {
    const shootAnim = isHeavy ? 'khaterine_shoot_heavy' : 'khaterine_shoot_light';
    this.playAnimSafe(this.playerSprite, shootAnim, true);
    this.audio.playSfx('dodge');

    const px = this.playerSprite.x;
    const py = this.playerSprite.y;
    const facing = this.player.facingDirection;

    // Fluid forward micro-step during cast
    const stepDist = isHeavy ? 8 : 4;
    const nextPlayerX = Phaser.Math.Clamp(px + facing * stepDist, 35, 605);
    this.tweens.add({
      targets: this.playerSprite,
      x: nextPlayerX,
      duration: 90,
      ease: 'Quad.easeOut'
    });
    this.player.position = new Vector2(nextPlayerX, py);

    // Official Animated Abyssal Arrow Projectile (fx_arrow_abyssal)
    const projectile = this.add.sprite(px + facing * 22, py - 28, 'fx_arrow_abyssal', 0)
      .setFlipX(facing < 0)
      .setScale(isHeavy ? 1.2 : 0.95)
      .setDepth(py + 3);
    this.playAnimSafe(projectile, 'fx_arrow_abyssal');

    const travelDist = isHeavy ? 320 : 250;
    const targetX = Phaser.Math.Clamp(px + facing * travelDist, 25, 615);
    const speed = 440; // px/sec
    const duration = Math.abs(targetX - px) / speed * 1000;

    let hasHit = false;

    this.tweens.add({
      targets: [projectile],
      x: targetX,
      duration,
      ease: 'Linear',
      onUpdate: () => {
        if (hasHit) return;

        const currentX = projectile.x;
        const currentY = projectile.y;

        // Check collision with training dummy during tutorial
        if (this.isTutorialActive && this.tutorialStep === 2 && this.tutorialDummy) {
          const ddist = Math.hypot(this.tutorialDummy.x - currentX, this.tutorialDummy.y - currentY);
          if (ddist < 35) {
            hasHit = true;
            this.tutorialHits++;
            this.explodeAbyssalOrb(currentX, currentY, isHeavy);
            this.tutorialDummy.setTint(0xffffff);
            this.time.delayedCall(100, () => this.tutorialDummy?.clearTint());
            projectile.destroy();
            if (this.tutorialHits >= 2) {
              this.advanceTrainingStep(3);
            }
            return;
          }
        }

        // Check collision with alive enemies
        for (const enemy of this.enemies) {
          if (!enemy.isAlive()) continue;
          const edist = Math.hypot(enemy.position.x - currentX, enemy.position.y - currentY);
          if (edist < 35) {
            hasHit = true;
            this.explodeAbyssalOrb(currentX, currentY, isHeavy, enemy);
            projectile.destroy();
            return;
          }
        }

        // Check collision with boss
        if (this.currentBoss && this.currentBoss.health > 0 && this.bossSprite) {
          const bdist = Math.hypot(this.currentBoss.position.x - currentX, this.currentBoss.position.y - currentY);
          if (bdist < 45) {
            hasHit = true;
            this.rangedHitsOnBoss++;
            if (this.currentBoss.id === 'madre_morwenna' && !this.currentBoss.isFlameShieldActive && this.rangedHitsOnBoss >= 2) {
              this.currentBoss.activateFlameShield(80);
              this.createBossShieldAura();
              this.triggerShalemBalloon("Shalem: «¡Madre Morwenna levantó el Escudo Ígneo! ¡Cambia a Thomas con [TAB] y destrózalo con un golpe fuerte [K]!»", 4000);
            }
            this.explodeAbyssalOrb(currentX, currentY, isHeavy, undefined, true);
            projectile.destroy();
            return;
          }
        }
      },
      onComplete: () => {
        if (!hasHit) {
          projectile.destroy();
        }
      }
    });

    // Reset to khaterine_idle animation after casting
    this.time.delayedCall(isHeavy ? 320 : 220, () => {
      this.playAnimSafe(this.playerSprite, 'khaterine_idle');
      this.player.finishAttack();
    });
  }

  private explodeAbyssalOrb(x: number, y: number, isHeavy: boolean, targetEnemy?: Enemy, isBoss: boolean = false): void {
    this.audio.playCombatHit(isHeavy);
    this.cameras.main.shake(isHeavy ? 160 : 90, isHeavy ? 0.012 : 0.006);

    // Animated Abyssal Slash/Explosion VFX
    this.spawnAnimatedVfx(x, y, 'fx_slash_abyss', isHeavy ? 1.25 : 0.95, false);

    if (isBoss && this.currentBoss && this.bossSprite) {
      const prevPhase = this.currentBoss.phase;
      const res = CombatUseCases.executeAttackOnBoss(this.player, this.currentBoss, isHeavy, true);
      if (this.currentBoss.id === 'madre_morwenna' && prevPhase === BossPhaseType.PHASE_1 && this.currentBoss.phase === BossPhaseType.PHASE_2) {
        this.playAnimSafe(this.bossSprite, 'morwenna_phase2_shockwave', true);
        this.spawnAnimatedVfx(this.currentBoss.position.x, this.currentBoss.position.y - 35, 'fx_pyre_explosion', 1.1, false);
      }
      const damageCol = this.currentBoss.isFlameShieldActive ? '#ffaa44' : '#d477ff';
      const label = this.currentBoss.isFlameShieldActive ? `${res.damageDealt} [ESCUDO]` : res.damageDealt;
      this.spawnDamageNumber(this.currentBoss.position.x, this.currentBoss.position.y - 50, label, isHeavy, damageCol);
      this.bossSprite.setTint(0xba68c8);
      this.time.delayedCall(120, () => this.bossSprite?.clearTint());
      if (res.targetKilled || this.currentBoss.health <= 0) {
        this.handleBossDefeated();
      }
    } else if (targetEnemy) {
      const res = CombatUseCases.executeAttackOnEnemy(this.player, targetEnemy, isHeavy);
      this.spawnDamageNumber(targetEnemy.position.x, targetEnemy.position.y - 35, res.damageDealt, isHeavy, '#d477ff');
      const sprite = this.enemySprites.get(targetEnemy.id);
      if (sprite) {
        sprite.setTint(0xba68c8);
        this.time.delayedCall(120, () => sprite.clearTint());

        if (res.targetKilled || targetEnemy.health <= 0) {
          const deathAnim = this.getEnemyAnimKey(targetEnemy.id, 'death');
          this.playAnimSafe(sprite, deathAnim, true);
          this.tweens.add({
            targets: sprite,
            alpha: 0,
            y: sprite.y - 10,
            delay: 240,
            duration: 250,
            onComplete: () => {
              sprite.destroy();
              this.enemyShadows.get(targetEnemy.id)?.destroy();
              this.enemyShadows.delete(targetEnemy.id);
            }
          });
          const remainingEnemies = this.enemies.filter(e => e.isAlive());
          if (remainingEnemies.length === 0) {
            this.storyProgress.completeMilestone('act1_monks');
            this.storyProgress.completeMilestone('act1_beast');
            this.storyProgress.addProgress(25);
            this.triggerShalemBalloon("Shalem: «¡La flecha abisal de Khaterine los ha pulverizado! ¡Avanza hacia la derecha!»", 5000);
          }
        } else {
          const staggerAnim = this.getEnemyAnimKey(targetEnemy.id, 'stagger');
          this.playAnimSafe(sprite, staggerAnim, true);
          // Knockback
          const facing = this.player.facingDirection;
          const knockX = Phaser.Math.Clamp(targetEnemy.position.x + facing * (isHeavy ? 16 : 10), 35, 605);
          targetEnemy.position = new Vector2(knockX, targetEnemy.position.y);
          this.tweens.add({ targets: sprite, x: knockX, duration: 110, ease: 'Cubic.easeOut' });
        }
      }
    }
  }

  /** Thomas swings Alba Gris with a piercing wave of holy and dark light. */
  private castAlbaGrisWave(px: number, py: number, facing: number, isHeavy: boolean): void {
    this.audio.playHealingEmber();

    // Sacred Wave of Light and Shadow
    const wave = this.add.image(px + facing * 25, py - 25, 'particle_slash_heavy')
      .setScale(facing > 0 ? 1.4 : -1.4, 1.4)
      .setTint(0xfff8d6)
      .setAlpha(0.95)
      .setDepth(py + 3);

    const targetX = Phaser.Math.Clamp(px + facing * 260, 20, 620);
    this.tweens.add({
      targets: wave,
      x: targetX,
      alpha: 0,
      scaleY: 1.8,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => wave.destroy()
    });

    // Pierces all enemies in path
    const bonusHolyDmg = isHeavy ? 45 : 28;
    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;
      const dx = (enemy.position.x - px) * facing;
      const dy = Math.abs(enemy.position.y - py);
      if (dx > 0 && dx <= 260 && dy <= 45) {
        enemy.health = Math.max(0, enemy.health - bonusHolyDmg);
        this.spawnDamageNumber(enemy.position.x, enemy.position.y - 35, bonusHolyDmg, true, '#fff59d');
        const sprite = this.enemySprites.get(enemy.id);
        if (sprite) {
          sprite.setTint(0xfff0aa);
          this.time.delayedCall(120, () => sprite.clearTint());
        }
      }
    }

    if (this.currentBoss && this.currentBoss.health > 0 && this.bossSprite) {
      const bdx = (this.currentBoss.position.x - px) * facing;
      const bdy = Math.abs(this.currentBoss.position.y - py);
      if (bdx > 0 && bdx <= 270 && bdy <= 55) {
        const extraBossDmg = isHeavy ? 60 : 38;
        this.currentBoss.health = Math.max(0, this.currentBoss.health - extraBossDmg);
        this.spawnDamageNumber(this.currentBoss.position.x, this.currentBoss.position.y - 50, extraBossDmg, true, '#fff59d');
        this.bossSprite.setTint(0xfff0aa);
        this.time.delayedCall(120, () => this.bossSprite?.clearTint());
        if (this.currentBoss.health <= 0) {
          this.handleBossDefeated();
        }
      }
    }
  }

  /** Forges and equips Alba Gris in Act III after speaking with Elowen. */
  private awakenAlbaGris(): void {
    this.hasAlbaGrisAwakened = true;
    if (!this.unlockedWeaponIds.includes('alba_gris')) {
      this.unlockedWeaponIds.push('alba_gris');
    }
    const albaGris = Weapon.createAlbaGris();
    this.player.disarmManager.setEquippedPrimary(albaGris);
    this.audio.playHealingEmber();

    const banner = this.add.text(320, 95, '✦ ¡ESPADA SAGRADA ALBA GRIS FORJADA! ✦\n«Fuego Negro y Gota de Luz Divina Unidos»', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#ffd700',
      backgroundColor: '#1b0e2b',
      padding: { x: 8, y: 5 },
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(450);

    this.tweens.add({
      targets: banner,
      y: 75,
      alpha: 0,
      duration: 3500,
      ease: 'Sine.easeOut',
      onComplete: () => banner.destroy()
    });
  }

  /** Triggers a Perfect Parry when blocking within 280ms of an incoming attack. */
  private triggerPerfectParry(sourceX: number, sourceY: number, isBoss: boolean, enemy?: Enemy): void {
    this.audio.playSfx('block');
    this.audio.playFinisherSound(false);
    this.triggerHitStop(110);

    // Play Official Parry Animation & Spark VFX
    if (this.player.id === 'thomas') {
      this.playAnimSafe(this.playerSprite, 'thomas_parry', true);
    } else {
      this.playAnimSafe(this.playerSprite, 'khaterine_ward', true);
    }
    this.spawnAnimatedVfx(this.playerSprite.x + this.player.facingDirection * 18, this.playerSprite.y - 26, 'fx_parry_spark', 1.15, false);

    // Screen Flash & Camera Shake
    this.cameras.main.flash(200, 255, 240, 160);
    this.cameras.main.shake(140, 0.015);

    // Floating Golden Banner
    const parryBanner = this.add.text(this.playerSprite.x, this.playerSprite.y - 60, '★ ¡PARRY PERFECTO! ★', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(400);

    this.tweens.add({
      targets: parryBanner,
      y: parryBanner.y - 25,
      alpha: 0,
      duration: 750,
      ease: 'Cubic.easeOut',
      onComplete: () => parryBanner.destroy()
    });

    // Ripple shockwave
    const ripple = this.add.circle(this.playerSprite.x, this.playerSprite.y - 25, 10, 0xffd700, 0.8)
      .setDepth(this.playerSprite.y + 1);
    this.tweens.add({
      targets: ripple,
      radius: 50,
      alpha: 0,
      duration: 250,
      ease: 'Quad.easeOut',
      onComplete: () => ripple.destroy()
    });

    // Deal massive posture break and counter-damage
    const counterDamage = isBoss ? 55 : 45;
    const facing = this.player.facingDirection;

    if (isBoss && this.currentBoss && this.bossSprite) {
      this.currentBoss.posture = Math.max(0, this.currentBoss.posture - 45);
      if (this.currentBoss.posture === 0) {
        this.currentBoss.interruptAttack(2000);
        if (this.currentBoss.id === 'madre_morwenna') {
          this.playAnimSafe(this.bossSprite, 'morwenna_stunned', true);
        }
      }
      this.currentBoss.health = Math.max(0, this.currentBoss.health - counterDamage);
      this.spawnDamageNumber(sourceX, sourceY - 45, counterDamage, true, '#ffd700');
      this.bossSprite.setTint(0xffeedd);
      this.time.delayedCall(160, () => this.bossSprite?.clearTint());
      if (this.currentBoss.health <= 0) {
        this.handleBossDefeated();
      }
    } else if (enemy) {
      enemy.posture = Math.max(0, enemy.posture - 50);
      if (enemy.posture === 0) {
        enemy.interruptAttack(2000);
      }
      enemy.health = Math.max(0, enemy.health - counterDamage);
      this.spawnDamageNumber(sourceX, sourceY - 45, counterDamage, true, '#ffd700');
      const sprite = this.enemySprites.get(enemy.id);
      if (sprite) {
        const staggerAnim = this.getEnemyAnimKey(enemy.id, 'stagger');
        this.playAnimSafe(sprite, staggerAnim, true);
        sprite.setTint(0xffeedd);
        this.time.delayedCall(160, () => sprite.clearTint());
        const knockX = Phaser.Math.Clamp(enemy.position.x + facing * 25, 35, 605);
        enemy.position = new Vector2(knockX, enemy.position.y);
        this.tweens.add({ targets: sprite, x: knockX, duration: 120, ease: 'Cubic.easeOut' });
      }
    }
  }

  // ==========================================
  // FINISHER & HIT-STOP SYSTEM
  // ==========================================
  private triggerHitStop(durationMs: number, targetSprite?: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image): void {
    this.isHitStopped = true;
    this.hitStopTimer = durationMs;
    this.hitStopTargetSprite = targetSprite;
    if (targetSprite) {
      this.hitStopOriginalX = targetSprite.x;
    }
  }

  private clearHitStopJitter(): void {
    if (this.hitStopTargetSprite && this.hitStopTargetSprite.active) {
      this.hitStopTargetSprite.x = this.hitStopOriginalX;
    }
    this.hitStopTargetSprite = undefined;
  }

  private spawnFinisherSlash(x: number, y: number, _angleDeg: number, _tintColor: number, scaleMultiplier: number = 1.3): void {
    this.spawnAnimatedVfx(x, y, scaleMultiplier >= 1.5 ? 'fx_slash_gold' : 'fx_slash_abyss', scaleMultiplier, false);
  }

  private spawnAshExplosion(x: number, y: number): void {
    this.spawnAnimatedVfx(x, y, 'fx_pyre_explosion', 1.15, false);

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const speed = Phaser.Math.Between(45, 110);
      const isGold = Math.random() > 0.45;
      const col = isGold ? 0xffd700 : 0x241133;
      const r = Phaser.Math.Between(3, 5);

      const p = this.add.circle(x, y, r, col, 0.9).setDepth(y + 11);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed * 0.7,
        alpha: 0,
        scale: 0.3,
        duration: Phaser.Math.Between(260, 420),
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  private executeFinisherSequence(): void {
    if (!this.finisherTarget || this.isFinisherActive) return;
    this.isFinisherActive = true;
    this.isInvulnerable = true;

    const target = this.finisherTarget;
    const isBoss = target.isBoss;
    const targetSprite = target.sprite;
    const targetObj = isBoss ? target.boss! : target.enemy!;
    if (!targetObj || (isBoss ? target.boss!.health <= 0 : !target.enemy!.isAlive())) {
      this.isFinisherActive = false;
      this.isInvulnerable = false;
      return;
    }

    // 1. Lock player state and face target + play Finisher animation
    this.player.state = CharacterState.ATTACKING;
    this.player.move(0, 0);
    const facing = targetSprite.x >= this.playerSprite.x ? 1 : -1;
    this.player.facingDirection = facing;
    this.playerSprite.setScale(facing * Math.abs(this.playerSprite.scaleX), this.playerSprite.scaleY);
    this.playAnimSafe(this.playerSprite, this.player.id === 'thomas' ? 'thomas_finisher' : 'khaterine_shoot_heavy', true);

    // 2. Play Finisher Audio
    this.audio.playFinisherSound(true);

    // 3. Cinematic Camera Zoom & Dramatic Flash
    this.cameras.main.zoomTo(1.22, 140, 'Quad.easeOut');
    this.cameras.main.flash(180, 255, 230, 100);

    // 4. Notify HUD via Domain Event
    EventBus.getInstance().publish(
      new FinisherTriggeredEvent(
        isBoss ? target.boss!.id : target.enemy!.id,
        FinisherStyle.CINEMATIC_COMBO,
        isBoss ? 95 : target.enemy!.health
      )
    );

    // 5. Dash step right in front of target
    const strikeTargetX = Phaser.Math.Clamp(targetSprite.x - facing * 28, 35, 605);
    const strikeTargetY = targetSprite.y;
    this.tweens.add({
      targets: this.playerSprite,
      x: strikeTargetX,
      y: strikeTargetY,
      duration: 80,
      ease: 'Cubic.easeOut'
    });
    this.player.position = new Vector2(strikeTargetX, strikeTargetY);

    // Strike 1 (t = 90ms): Crimson Abyssal Slash
    this.time.delayedCall(90, () => {
      if (!this.scene.isActive()) return;
      this.audio.playCombatHit(true);
      this.cameras.main.shake(120, 0.012);
      this.spawnFinisherSlash(targetSprite.x, targetSprite.y - 20, 40, 0xff3355, 1.3);
      this.spawnDamageNumber(targetSprite.x, targetSprite.y - 45, '⚡ TINTA NEGRA', true, '#ff5577');
      targetSprite.setTint(0xff5555);
      this.time.delayedCall(70, () => targetSprite.clearTint());
    });

    // Strike 2 (t = 210ms): Rising Abyssal Purple Slash
    this.time.delayedCall(210, () => {
      if (!this.scene.isActive()) return;
      this.audio.playCombatHit(true);
      this.cameras.main.shake(160, 0.016);
      this.spawnFinisherSlash(targetSprite.x, targetSprite.y - 25, -45, 0xbb33ff, 1.4);
      this.spawnDamageNumber(targetSprite.x, targetSprite.y - 50, '⚡ FILO DEL ABISMO', true, '#ddaaff');
      targetSprite.setTint(0xdd55ff);
      this.time.delayedCall(70, () => targetSprite.clearTint());
    });

    // Strike 3 (t = 340ms): Climax Finisher Impact
    this.time.delayedCall(340, () => {
      if (!this.scene.isActive()) return;
      this.audio.playFinisherSound(false);
      this.cameras.main.shake(300, 0.025);
      this.cameras.main.flash(200, 255, 255, 255);
      this.spawnFinisherSlash(targetSprite.x, targetSprite.y - 20, 0, 0xffd700, 2.0);
      this.spawnAshExplosion(targetSprite.x, targetSprite.y - 25);

      if (isBoss && target.boss) {
        const bossDmg = 95;
        target.boss.health = Math.max(0, target.boss.health - bossDmg);
        target.boss.recoverPosture();
        this.spawnDamageNumber(targetSprite.x, targetSprite.y - 55, bossDmg, true, '#ffd700');

        const knockX = Phaser.Math.Clamp(targetSprite.x + facing * 40, 40, 600);
        target.boss.position = new Vector2(knockX, target.boss.position.y);
        this.tweens.add({ targets: targetSprite, x: knockX, duration: 200, ease: 'Quad.easeOut' });

        if (target.boss.health <= 0) {
          this.handleBossDefeated();
        }
      } else if (target.enemy) {
        target.enemy.health = 0;
        target.enemy.state = 'DEAD';
        this.spawnDamageNumber(targetSprite.x, targetSprite.y - 55, '💀 ¡REMATADO!', true, '#ff3344');

        this.tweens.add({
          targets: targetSprite,
          alpha: 0,
          scaleX: targetSprite.scaleX * 1.35,
          scaleY: targetSprite.scaleY * 0.65,
          duration: 320,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            targetSprite.destroy();
            this.clearEnemyWarning(target.enemy!.id);
          }
        });

        const remainingEnemies = this.enemies.filter(e => e.isAlive());
        if (remainingEnemies.length === 0) {
          this.storyProgress.completeMilestone('act1_monks');
          this.storyProgress.completeMilestone('act1_beast');
          this.storyProgress.addProgress(25);
          this.triggerShalemBalloon("Shalem: «¡Los acechadores han caído! ¡Ahora avanza hacia la derecha y destruye a la Madre Morwenna junto a la pira!»", 5000);
        }
      }

      // Rewards
      this.player.heal(20);
      this.player.stats.restorePosture(this.player.stats.maxPosture);
      this.player.gainExperience(30);
      this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, '+20 HP', false, '#77ff77');

      const banner = this.add.text(320, 110, '⚡ ¡EJECUCIÓN PERFECTA! ⚡', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 4,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(450);

      this.tweens.add({
        targets: banner,
        y: 85,
        alpha: 0,
        duration: 1800,
        ease: 'Cubic.easeOut',
        onComplete: () => banner.destroy()
      });

      this.triggerShalemBalloon("Shalem: «¡Brutal, monaguillo! ¡Ese es el verdadero filo de las sombras!»", 3200);

      // Return camera and player state
      this.cameras.main.zoomTo(1.0, 300, 'Quad.easeInOut');
      this.time.delayedCall(300, () => {
        this.player.state = CharacterState.IDLE;
        this.isInvulnerable = false;
        this.isFinisherActive = false;
        this.finisherTarget = undefined;
      });
    });
  }

  /**
   * Normalizes sprite dimensions to prevent oversized external textures
   * (e.g. 1254x1254 raw illustrations) from covering the screen or breaking depth.
   */
  private normalizeSprite<T extends Phaser.GameObjects.Sprite | Phaser.GameObjects.Image>(
    sprite: T,
    maxW: number,
    maxH: number,
    originX = 0.5,
    originY = 0.9
  ): T {
    sprite.setOrigin(originX, originY);
    const nativeW = sprite.width;
    const nativeH = sprite.height;
    if (nativeW > maxW || nativeH > maxH) {
      const scale = Math.min(maxW / nativeW, maxH / nativeH);
      sprite.setScale(scale);
    }
    return sprite;
  }

  private playAnimSafe(sprite: Phaser.GameObjects.Sprite | undefined, animKey: string, forceRestart: boolean = false): void {
    if (!sprite || !sprite.active) return;
    if (this.anims.exists(animKey)) {
      if (forceRestart || !sprite.anims.isPlaying || sprite.anims.currentAnim?.key !== animKey) {
        sprite.play(animKey, !forceRestart);
      }
    } else if (this.textures.exists(animKey)) {
      sprite.setTexture(animKey);
    }
  }

  private spawnAnimatedVfx(
    x: number,
    y: number,
    vfxKey: string,
    scale: number = 1.0,
    flipX: boolean = false
  ): void {
    if (!this.textures.exists(vfxKey)) return;
    const fx = this.add.sprite(x, y, vfxKey, 0)
      .setScale(scale)
      .setFlipX(flipX)
      .setDepth(y + 15);
    if (this.anims.exists(vfxKey)) {
      fx.play(vfxKey);
      fx.once('animationcomplete', () => fx.destroy());
      this.time.delayedCall(650, () => {
        if (fx.active) fx.destroy();
      });
    } else {
      this.tweens.add({
        targets: fx,
        alpha: 0,
        scale: scale * 1.3,
        duration: 240,
        onComplete: () => fx.destroy()
      });
    }
  }

  private getEnemyAnimKey(enemyId: string, action: 'patrol' | 'windup' | 'attack' | 'stagger' | 'death'): string {
    if (enemyId.startsWith('ash')) {
      const map = {
        patrol: 'hound_patrol',
        windup: 'hound_windup',
        attack: 'hound_bite',
        stagger: 'hound_stagger',
        death: 'hound_death'
      };
      return map[action];
    }
    if (enemyId.startsWith('monk') || enemyId.startsWith('corista')) {
      const map = {
        patrol: 'cultist_patrol',
        windup: 'cultist_alert',
        attack: 'cultist_swing',
        stagger: 'cultist_stagger',
        death: 'cultist_death'
      };
      return map[action];
    }
    if (enemyId.startsWith('zealot') || enemyId.startsWith('guard')) {
      const map = {
        patrol: 'zealot_patrol',
        windup: 'zealot_alert',
        attack: 'zealot_chain_whip',
        stagger: 'zealot_alert',
        death: 'zealot_death'
      };
      return map[action];
    }
    const map = {
      patrol: 'skeleton_patrol',
      windup: 'skeleton_alert',
      attack: 'skeleton_claymore_slash',
      stagger: 'skeleton_parried',
      death: 'skeleton_finisher_shatter'
    };
    return map[action];
  }

  private spawnDamageNumber(x: number, y: number, amount: number | string, isCritical: boolean, customColor?: string): void {
    const color = customColor || (isCritical ? '#ffd700' : '#e699ff');
    const displayText = typeof amount === 'number' ? `${customColor ? '+' : '-'}${amount}` : String(amount);
    const text = this.add.text(x, y, displayText, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: isCritical ? '16px' : '12px',
      color: color,
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(330);

    this.tweens.add({
      targets: text,
      y: y - 25,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private handleBossDefeated(): void {
    if (!this.currentBoss) return;

    this.audio.playFinisherSound(true);
    this.cameras.main.flash(600, 255, 215, 0);
    this.cameras.main.shake(400, 0.02);

    if (this.bossMarker) {
      this.bossMarker.destroy();
      this.bossMarker = undefined;
    }
    if (this.bossMarkerTween) {
      this.bossMarkerTween.stop();
      this.bossMarkerTween = undefined;
    }

    if (this.bossSprite) {
      if (this.currentBoss.id === 'madre_morwenna') {
        this.playAnimSafe(this.bossSprite, 'morwenna_purified', true);
      }
      this.spawnAnimatedVfx(this.bossSprite.x, this.bossSprite.y - 30, 'fx_pyre_explosion', 1.25, false);
      this.tweens.add({
        targets: this.bossSprite,
        alpha: 0,
        y: this.bossSprite.y + 15,
        delay: 350,
        duration: 750,
        onComplete: () => {
          this.bossSprite?.destroy();
          this.bossSprite = undefined;
          this.bossShadow?.destroy();
          this.bossShadow = undefined;
        }
      });
    }

    // Advance story progress to 100%, grant player invulnerability and enable Next-Level transition
    this.isActCleared = true;
    this.isInvulnerable = true;
    this.storyProgress.completeAllActMilestones(this.currentScenario);

    // Destroy and pacify all remaining minions so player cannot take damage during victory!
    for (const enemy of this.enemies) {
      enemy.health = 0;
      enemy.state = 'DEAD';
      const sprite = this.enemySprites.get(enemy.id);
      if (sprite) {
        this.tweens.add({
          targets: sprite,
          alpha: 0,
          y: sprite.y - 15,
          duration: 350,
          onComplete: () => sprite.destroy()
        });
      }
      this.enemyShadows.get(enemy.id)?.destroy();
    }
    this.enemies = [];
    this.enemySprites.clear();
    this.enemyShadows.clear();

    if (this.currentScenario === 1) {

      // Spawn dropped Lamento de Oakhaven item
      this.droppedCenserShadow = this.add.ellipse(520, 260, 24, 6, 0x000000, 0.5).setDepth(259);
      this.droppedCenserSprite = this.add.image(520, 260, 'lamento_oakhaven').setOrigin(0.5, 1).setDepth(260);

      this.droppedCenserMarker = this.add.text(520, 222, '▼ [E] RECOGER LAMENTO DE OAKHAVEN ▼', {
        fontFamily: 'monospace',
        fontSize: '8.5px',
        color: '#88ffaa',
        backgroundColor: '#0a2012',
        padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(261);

      this.droppedCenserTween = this.tweens.add({
        targets: [this.droppedCenserSprite, this.droppedCenserMarker],
        y: '-=5',
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.triggerShalemBalloon(
        "Shalem: «¡Madre Morwenna ha caído! ¡Recoge el Lamento de Oakhaven y viaja hacia el Campanario por el sendero derecho!»",
        7000
      );

      // Interactive Exit Portal / Road to Belltower on right screen edge
      this.exitPortalZone = this.add.ellipse(605, 250, 48, 16, 0xb8923b, 0.55).setDepth(220);
      this.exitPortalMarker = this.add.text(585, 205, '▶ AL CAMPANARIO ▶\n[E] o Avanza para partir', {
        fontFamily: 'Cinzel, monospace',
        fontSize: '8px',
        color: '#ffd700',
        backgroundColor: '#160b26',
        padding: { x: 6, y: 4 },
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(340);

      this.exitPortalTween = this.tweens.add({
        targets: [this.exitPortalMarker, this.exitPortalZone],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Grand Victory Banner in Center
      this.victoryBannerBg = this.add.rectangle(320, 160, 440, 78, 0x11081f, 0.95)
        .setStrokeStyle(2, 0xffd700)
        .setDepth(360);

      this.victoryBannerTitle = this.add.text(320, 142, '★ ¡ACTO I: OAKHAVEN COMPLETADO! ★', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361);

      this.victoryBannerPrompt = this.add.text(320, 172, 'PULSA [ENTER], [E] O CAMINA A LA DERECHA PARA EL CAMPANARIO ▶', {
        fontFamily: 'monospace',
        fontSize: '8.5px',
        color: '#ffffff',
        backgroundColor: '#3d1f5e',
        padding: { x: 8, y: 4 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361).setInteractive({ useHandCursor: true });

      this.victoryBannerPrompt.on('pointerdown', () => {
        this.clearActExit();
        this.transitionToActWithLoading(2);
      });
    } else if (this.currentScenario === 2) {
      this.storyProgress.completeMilestone('act2_boss');
      this.storyProgress.scenarioProgress = 100;

      this.triggerShalemBalloon(
        "Shalem: «¡El Inquisidor Mayor ha caído y el crisol se ha quebrado! ¡Avanza hacia el Gran Puente de Piedra!»",
        7000
      );

      this.exitPortalZone = this.add.ellipse(605, 250, 48, 16, 0x5a7ca8, 0.65).setDepth(220);
      this.exitPortalMarker = this.add.text(585, 205, '▶ AL GRAN PUENTE ▶\n[E] o Avanza para partir', {
        fontFamily: 'Cinzel, monospace',
        fontSize: '8px',
        color: '#b0d4ff',
        backgroundColor: '#101626',
        padding: { x: 6, y: 4 },
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(340);

      this.exitPortalTween = this.tweens.add({
        targets: [this.exitPortalMarker, this.exitPortalZone],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.victoryBannerBg = this.add.rectangle(320, 160, 440, 78, 0x11081f, 0.95)
        .setStrokeStyle(2, 0xffd700)
        .setDepth(360);

      this.victoryBannerTitle = this.add.text(320, 142, '★ ¡ACTO II: EL CAMPANARIO COMPLETADO! ★', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361);

      this.victoryBannerPrompt = this.add.text(320, 172, 'PULSA [ENTER], [E] O CAMINA A LA DERECHA PARA EL GRAN PUENTE ▶', {
        fontFamily: 'monospace',
        fontSize: '8.5px',
        color: '#ffffff',
        backgroundColor: '#203254',
        padding: { x: 8, y: 4 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361).setInteractive({ useHandCursor: true });

      this.victoryBannerPrompt.on('pointerdown', () => {
        this.clearActExit();
        this.transitionToActWithLoading(3);
      });
    } else if (this.currentScenario === 3) {
      this.storyProgress.completeMilestone('act3_boss');
      this.storyProgress.scenarioProgress = 100;

      this.triggerShalemBalloon(
        "Shalem: «¡El Capitán Vane ha caído! ¡Los carros de refugiados están a salvo! ¡Entremos a Londinium!»",
        7000
      );

      this.exitPortalZone = this.add.ellipse(605, 250, 48, 16, 0xd4af37, 0.65).setDepth(220);
      this.exitPortalMarker = this.add.text(585, 205, '▶ A LONDINIUM ▶\n[E] o Avanza para entrar', {
        fontFamily: 'Cinzel, monospace',
        fontSize: '8px',
        color: '#ffd700',
        backgroundColor: '#261b0c',
        padding: { x: 6, y: 4 },
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(340);

      this.exitPortalTween = this.tweens.add({
        targets: [this.exitPortalMarker, this.exitPortalZone],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.victoryBannerBg = this.add.rectangle(320, 160, 440, 78, 0x11081f, 0.95)
        .setStrokeStyle(2, 0xffd700)
        .setDepth(360);

      this.victoryBannerTitle = this.add.text(320, 142, '★ ¡ACTO III: EL GRAN PUENTE COMPLETADO! ★', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361);

      this.victoryBannerPrompt = this.add.text(320, 172, 'PULSA [ENTER], [E] O CAMINA A LA DERECHA PARA LONDINIUM ▶', {
        fontFamily: 'monospace',
        fontSize: '8.5px',
        color: '#ffffff',
        backgroundColor: '#4a3713',
        padding: { x: 8, y: 4 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361).setInteractive({ useHandCursor: true });

      this.victoryBannerPrompt.on('pointerdown', () => {
        this.clearActExit();
        this.transitionToActWithLoading(4);
      });
    } else if (this.currentScenario === 4) {
      this.storyProgress.completeMilestone('act4_boss');
      this.storyProgress.scenarioProgress = 100;

      this.triggerShalemBalloon(
        "Shalem: «¡El Rex Malphas ha sido quebrado! ¡Avanza a la sima derecha o pulsa [ENTER] para descender a la Catedral Invertida!»",
        7000
      );

      // Interactive Abyssal Descent Portal on right edge
      this.exitPortalZone = this.add.ellipse(605, 250, 48, 16, 0x8a2be2, 0.65).setDepth(220);
      this.exitPortalMarker = this.add.text(585, 205, '▼ CATEDRAL INVERTIDA ▼\n[E] o Avanza para descender', {
        fontFamily: 'Cinzel, monospace',
        fontSize: '8px',
        color: '#e699ff',
        backgroundColor: '#18082a',
        padding: { x: 6, y: 4 },
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(340);

      this.exitPortalTween = this.tweens.add({
        targets: [this.exitPortalMarker, this.exitPortalZone],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Victory Banner for Act IV
      this.victoryBannerBg = this.add.rectangle(320, 160, 440, 78, 0x11081f, 0.95)
        .setStrokeStyle(2, 0xffd700)
        .setDepth(360);

      this.victoryBannerTitle = this.add.text(320, 142, '★ ¡ACTO IV: LONDINIUM COMPLETADO! ★', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361);

      this.victoryBannerPrompt = this.add.text(320, 172, 'PULSA [ENTER], [E] O CAMINA A LA DERECHA PARA DESCENDER ▶', {
        fontFamily: 'monospace',
        fontSize: '8.5px',
        color: '#ffffff',
        backgroundColor: '#3d1f5e',
        padding: { x: 8, y: 4 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361).setInteractive({ useHandCursor: true });

      this.victoryBannerPrompt.on('pointerdown', () => {
        this.clearActExit();
        this.transitionToActWithLoading(5);
      });
    } else {
      this.storyProgress.completeMilestone('act5_astaroth');
      this.storyProgress.scenarioProgress = 100;

      this.triggerShalemBalloon(
        "Shalem: «¡Astaroth y la teocracia han caído! La luz y la oscuridad han alcanzado el equilibrio. ¡EL PRIMER AMANECER HA LLEGADO!»",
        10000
      );

      // Victory Banner for Finale
      this.victoryBannerBg = this.add.rectangle(320, 160, 460, 84, 0x11081f, 0.96)
        .setStrokeStyle(2, 0xffd700)
        .setDepth(360);

      this.victoryBannerTitle = this.add.text(320, 140, '★ ¡ALBION REDIMIDO: LA LUZ EN LAS TINIEBLAS! ★', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '12.5px',
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361);

      this.victoryBannerPrompt = this.add.text(320, 172, 'PULSA [ENTER] PARA VER EL EPÍLOGO Y LOS CRÉDITOS ▶', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        backgroundColor: '#3d1f5e',
        padding: { x: 10, y: 4 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361).setInteractive({ useHandCursor: true });

      this.victoryBannerPrompt.on('pointerdown', () => {
        this.clearActExit();
        if (this.scene.isActive('HUDScene')) {
          this.scene.stop('HUDScene');
        }
        this.scene.start('CinematicScene', {
          actTransition: 5,
          targetAct: 1,
          characterId: this.player.id
        });
      });
    }
  }

  private triggerGameOver(): void {
    if (this.isGameOverModalOpen) return;
    this.isGameOverModalOpen = true;

    this.audio.playSfx('glass_shatter');
    this.cameras.main.flash(450, 160, 20, 20);
    this.cameras.main.shake(300, 0.02);

    this.playerSprite.setTint(0x3a1a1a);
    if (this.playerSprite.anims.isPlaying) {
      this.playerSprite.stop();
    }

    this.gameOverContainer = this.add.container(320, 180).setDepth(450);

    const dimBg = this.add.rectangle(0, 0, 640, 360, 0x05020a, 0.88).setInteractive();
    dimBg.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());

    const frameW = 440;
    const frameH = 220;
    const winBg = this.add.rectangle(0, 0, frameW, frameH, 0x0e0614, 0.97)
      .setStrokeStyle(2, 0xd4af37);
    const winInner = this.add.rectangle(0, 0, frameW - 8, frameH - 8)
      .setStrokeStyle(1, 0x6e2222);

    const titleText = this.add.text(0, -68, '☠ HAS SUCUMBIDO A LA OSCURIDAD ☠', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '14px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, -38, `«La sangre de ${this.player.name} se apaga en las cenizas de Albion...\nPero la profecía de la Luna Roja aún aguarda tu regreso.»`, {
      fontFamily: 'serif',
      fontSize: '9.5px',
      color: '#d4c2e6',
      align: 'center',
      fontStyle: 'italic',
      lineSpacing: 3
    }).setOrigin(0.5);

    const sep = this.add.rectangle(0, -12, 340, 1, 0xd4af37, 0.6);

    this.gameOverButtons = [];
    this.gameOverFocusIndex = 0;

    const btnRetryBg = this.add.rectangle(0, 18, 260, 28, 0x3a1448, 0.98)
      .setStrokeStyle(1.5, 0xffd700)
      .setInteractive({ useHandCursor: true });
    const btnRetryText = this.add.text(0, 18, '⚔ REINTENTAR ESCENARIO ⚔', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const btnMenuBg = this.add.rectangle(0, 56, 260, 28, 0x140a1c, 0.92)
      .setStrokeStyle(1, 0x5a2d6b)
      .setInteractive({ useHandCursor: true });
    const btnMenuText = this.add.text(0, 56, '⮌ VOLVER AL MENÚ PRINCIPAL', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '10px',
      color: '#cbb6de'
    }).setOrigin(0.5);

    const retryAction = () => {
      this.closeGameOverModal();
      this.saveCheckpoint();
      this.transitionToActWithLoading(this.currentScenario, true);
    };

    const menuAction = () => {
      this.closeGameOverModal();
      this.saveCheckpoint();
      if (this.scene.isActive('HUDScene')) {
        this.scene.stop('HUDScene');
      }
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(320, () => {
        this.scene.start('TitleScene');
      });
    };

    btnRetryBg.on('pointerdown', retryAction);
    btnMenuBg.on('pointerdown', menuAction);

    btnRetryBg.on('pointerover', () => this.setGameOverFocus(0));
    btnMenuBg.on('pointerover', () => this.setGameOverFocus(1));

    this.gameOverButtons.push(
      { bg: btnRetryBg, text: btnRetryText, action: retryAction },
      { bg: btnMenuBg, text: btnMenuText, action: menuAction }
    );

    const helperText = this.add.text(0, 90, 'Usa [W] / [S] o Flechas para elegir · [ENTER] o [ESPACIO] para confirmar', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#8e79a8'
    }).setOrigin(0.5);

    this.gameOverContainer.add([dimBg, winBg, winInner, titleText, subtitle, sep, btnRetryBg, btnRetryText, btnMenuBg, btnMenuText, helperText]);
  }

  private handleGameOverInput(): void {
    if (
      (this.keyW && Phaser.Input.Keyboard.JustDown(this.keyW)) ||
      (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.up))
    ) {
      this.setGameOverFocus(0);
    }
    if (
      (this.keyS && Phaser.Input.Keyboard.JustDown(this.keyS)) ||
      (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.down))
    ) {
      this.setGameOverFocus(1);
    }
    if (
      (this.keyEnter && Phaser.Input.Keyboard.JustDown(this.keyEnter)) ||
      (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace))
    ) {
      if (this.gameOverButtons[this.gameOverFocusIndex]) {
        this.gameOverButtons[this.gameOverFocusIndex].action();
      }
    }
  }

  private setGameOverFocus(idx: number): void {
    this.gameOverFocusIndex = idx;
    this.audio.playSfx('menu_select');
    this.gameOverButtons.forEach((btn, i) => {
      if (i === idx) {
        btn.bg.setFillStyle(0x3a1448, 0.98);
        btn.bg.setStrokeStyle(1.5, 0xffd700);
        btn.text.setColor('#ffffff');
      } else {
        btn.bg.setFillStyle(0x140a1c, 0.92);
        btn.bg.setStrokeStyle(1, 0x5a2d6b);
        btn.text.setColor('#cbb6de');
      }
    });
  }

  private closeGameOverModal(): void {
    if (this.gameOverContainer) {
      this.gameOverContainer.destroy();
      this.gameOverContainer = undefined;
    }
    this.isGameOverModalOpen = false;
  }

  /** Persist full session (level, EXP, weapons, relics) and lightweight checkpoint to localStorage. */
  private saveCheckpoint(): void {
    try {
      SessionStateStore.getInstance().saveSession(this.player, this.allyChar, this.currentScenario, this.storyProgress);
      const checkpoint = {
        characterId: this.player.id,
        scenarioIndex: this.currentScenario,
        timestamp: Date.now()
      };
      localStorage.setItem('litd_checkpoint', JSON.stringify(checkpoint));
    } catch { /* quota / private browsing – silently ignore */ }
  }

  private clearActExit(): void {
    if (this.exitPortalTween) {
      this.exitPortalTween.stop();
      this.exitPortalTween = undefined;
    }
    if (this.exitPortalZone) {
      this.exitPortalZone.destroy();
      this.exitPortalZone = undefined;
    }
    if (this.exitPortalMarker) {
      this.exitPortalMarker.destroy();
      this.exitPortalMarker = undefined;
    }
    if (this.victoryBannerBg) {
      this.victoryBannerBg.destroy();
      this.victoryBannerBg = undefined;
    }
    if (this.victoryBannerTitle) {
      this.victoryBannerTitle.destroy();
      this.victoryBannerTitle = undefined;
    }
    if (this.victoryBannerPrompt) {
      this.victoryBannerPrompt.destroy();
      this.victoryBannerPrompt = undefined;
    }
    this.isActCleared = false;
  }

  private transitionToActWithLoading(targetAct: number, forceDirect: boolean = false): void {
    if (this.isTransitioningAct) return;
    this.isTransitioningAct = true;
    this.clearActExit();

    // Preserve level, EXP, improved stats and weapons into SessionStateStore before transitioning!
    SessionStateStore.getInstance().saveSession(this.player, this.allyChar, targetAct, this.storyProgress);
    this.saveCheckpoint();

    // If moving between acts naturally, trigger the illustrated CinematicScene!
    if (!forceDirect && this.currentScenario === 1 && targetAct === 2) {
      this.cameras.main.fade(320, 0, 0, 0);
      this.time.delayedCall(340, () => {
        if (this.scene.isActive('HUDScene')) {
          this.scene.stop('HUDScene');
        }
        this.scene.start('CinematicScene', {
          actTransition: 1,
          targetAct: 2,
          characterId: this.player.id
        });
      });
      return;
    }

    if (!forceDirect && this.currentScenario === 2 && targetAct === 3) {
      this.cameras.main.fade(320, 0, 0, 0);
      this.time.delayedCall(340, () => {
        if (this.scene.isActive('HUDScene')) {
          this.scene.stop('HUDScene');
        }
        this.scene.start('CinematicScene', {
          actTransition: 2,
          targetAct: 3,
          characterId: this.player.id
        });
      });
      return;
    }

    if (!forceDirect && this.currentScenario === 3 && targetAct === 4) {
      this.cameras.main.fade(320, 0, 0, 0);
      this.time.delayedCall(340, () => {
        if (this.scene.isActive('HUDScene')) {
          this.scene.stop('HUDScene');
        }
        this.scene.start('CinematicScene', {
          actTransition: 3,
          targetAct: 4,
          characterId: this.player.id
        });
      });
      return;
    }

    if (!forceDirect && this.currentScenario === 4 && targetAct === 5) {
      this.cameras.main.fade(320, 0, 0, 0);
      this.time.delayedCall(340, () => {
        if (this.scene.isActive('HUDScene')) {
          this.scene.stop('HUDScene');
        }
        this.scene.start('CinematicScene', {
          actTransition: 4,
          targetAct: 5,
          characterId: this.player.id
        });
      });
      return;
    }

    const configs: Record<number, { image: string; title: string; story: string; tip: string }> = {
      1: {
        image: 'loading_pyre_remains',
        title: 'ACTO I — OAKHAVEN: LAS HOGUERAS DE LA INQUISICIÓN',
        story: '«Al cumplir dieciocho años, la Inquisición marchó sobre la aldea de Oakhaven para arrebatar a Elowen creyéndola el fruto maldito. Thomas despertó el fuego negro en su espada para salvarla, amparado por el Padre Cedric y Khaterine frente a la Abadesa Morwenna.»',
        tip: '«Consejo de Shalem: El Padre Cedric te entregará el Rosario de Madera y la Tablilla I de la profecía si hablas con él con [E].»'
      },
      2: {
        image: 'loading_concept_art',
        title: 'ACTO II — EL CAMPANARIO Y EL GRANERO DEL SUR',
        story: '«Elowen resiste el tormento de la sal gruesa en lo alto del campanario. Khaterine recupera las hojas curvas del Colmillo del Sauce Negro bajo la losa del granero. Ha llegado el momento de quebrar el asedio de la torre.»',
        tip: '«Consejo de Shalem: Habla con Elowen en su celda con [E]. Su pájaro de madera contiene el mensaje de la rebelión.»'
      },
      3: {
        image: 'loading_bridge_journey',
        title: 'ACTO III — EL GRAN PUENTE: EL CAMINO DE LOS HEREJES',
        story: '«Huyendo de Oakhaven con el convoy de campesinos desterrados, el camino a Londinium cruza un monumental puente de piedra bajo la niebla fluvial, custodiado por la vanguardia de la Inquisición.»',
        tip: '«Táctica de Combate: El Capitán Vane bloquea con escudo de torre. ¡Usa el ataque pesado [K] o un Parry con [L] para quebrar su guardia!»'
      },
      4: {
        image: 'loading_londinium_gate',
        title: 'ACTO IV — LONDINIUM: LA CIUDADELA DORADA',
        story: '«Las puertas ciclópeas de Londinium se abren. En el salón de los espejos aguarda Rex Malphas, el soberano que vendió a su aquelarre por una corona marchita y el poder de distorsionar la realidad.»',
        tip: '«Consejo de Shalem: El Decreto Real de Malphas parece invencible... ¡Resiste sus embates hasta quebrar sus reflejos!»'
      },
      5: {
        image: 'loading_shalem_wall',
        title: 'ACTO V — LA CATEDRAL INVERTIDA: EL SOL DEL ABISMO',
        story: '«El Rex Malphas ha sido derribado y las leyes del mundo colapsan. Ante ellos se abre la sima cósmica hacia la Catedral Invertida: el templo sacrílego donde el demonio primordial Astaroth aguarda su manifestación definitiva.»',
        tip: '«Shalem: Elowen te otorgará su Gota de Luz Divina para forjar Alba Gris. ¡Usa su Onda Sagrada para purgar las sombras!»'
      }
    };

    const cfg = configs[targetAct] || configs[1];

    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(320, () => {
      if (this.scene.isActive('HUDScene')) {
        this.scene.stop('HUDScene');
      }
      this.scene.start('LoadingScene', {
        targetScene: 'GameScene',
        targetData: {
          characterId: this.player.id,
          scenarioIndex: targetAct
        },
        imageKey: cfg.image,
        chapterTitle: cfg.title,
        storyText: cfg.story,
        tipText: cfg.tip,
        minDurationMs: 2000
      });
    });
  }

  private executeWeaponThrow(): void {
    const success = CombatUseCases.throwEquippedWeapon(this.player);
    if (!success) {
      this.triggerShalemBalloon("Shalem suspira: «¡No puedes lanzar tus propios puños, genio!»");
      return;
    }

    this.audio.playWeaponThrowSound();
    this.audio.playDisarmSound();

    if (this.player.id === 'thomas') {
      this.playAnimSafe(this.playerSprite, 'thomas_throw_sword', true);
      this.time.delayedCall(320, () => {
        if (this.player.id === 'thomas' && this.player.disarmManager.isPlayerDisarmed()) {
          this.playAnimSafe(this.playerSprite, 'thomas_unarmed_idle');
        }
      });
    }

    const thrownX = this.playerSprite.x;
    const thrownY = this.playerSprite.y - 15;
    const dir = this.player.facingDirection;
    const proj = this.add.image(thrownX, thrownY, 'icon_thrown_sword').setScale(1.3).setDepth(thrownY);
    proj.setFlipX(dir < 0);

    this.tweens.add({
      targets: proj,
      x: thrownX + dir * 190,
      rotation: dir * Math.PI * 3,
      duration: 280,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        proj.destroy();

        // Stun enemies in impact area in 2.5D
        for (const enemy of this.enemies) {
          if (Math.abs(enemy.position.x - (thrownX + dir * 190)) < 55 && Math.abs(enemy.position.y - thrownY) < 30) {
            enemy.damagePosture(50);
            this.audio.playCombatHit(true);
            this.spawnDamageNumber(enemy.position.x, enemy.position.y - 35, 45, true);

            const sprite = this.enemySprites.get(enemy.id);
            if (sprite) {
              this.playAnimSafe(sprite, this.getEnemyAnimKey(enemy.id, 'stagger'), true);
              sprite.setTint(0xffff55);
              this.time.delayedCall(400, () => sprite.clearTint());
            }
          }
        }
      }
    });

    this.triggerShalemBalloon("Shalem grita: «¡Lanzaste tu arma! ¡Ahora estás a puños, corre a recogerla con [E]!»");
  }

  private executeWeaponPickup(): void {
    const pickedUp = CombatUseCases.pickupNearbyWeapon(this.player);
    if (pickedUp) {
      this.audio.playSfx('dodge');
      const idleAnim = this.player.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';
      this.playAnimSafe(this.playerSprite, idleAnim, true);
      this.triggerShalemBalloon("Shalem asiente: «¡Espada recuperada! Ahora demuestra lo que puedes hacer.»");
    } else {
      this.triggerShalemBalloon("Shalem mira alrededor: «No hay armas en el suelo cerca de ti. Acércate más a una.»");
    }
  }

  private updateShalemAndAlly(_delta: number): void {
    const px = this.playerSprite.x;
    const py = this.playerSprite.y;
    const facing = this.player.facingDirection;

    // Ally follows smoothly in 2.5D
    const allyTargetX = px - 45 * facing;
    const allyTargetY = py - 4;
    const allyDist = Math.hypot(allyTargetX - this.allySprite.x, allyTargetY - this.allySprite.y);
    this.allySprite.x = Phaser.Math.Linear(this.allySprite.x, allyTargetX, 0.08);
    this.allySprite.y = Phaser.Math.Linear(this.allySprite.y, allyTargetY, 0.08);
    this.allySprite.setFlipX(facing < 0);
    this.allySprite.setDepth(this.allySprite.y);
    this.allyShadow.setPosition(this.allySprite.x, this.allySprite.y).setDepth(this.allySprite.y - 1);

    const allyWalkAnim = this.allyChar.id === 'thomas' ? 'thomas_walk' : 'khaterine_walk';
    const allyIdleAnim = this.allyChar.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';
    if (allyDist > 3.0) {
      this.playAnimSafe(this.allySprite, allyWalkAnim);
    } else {
      this.playAnimSafe(this.allySprite, allyIdleAnim);
    }

    // Shalem Cat follows smoothly in 2.5D
    const catTargetX = px - 22 * facing;
    const catTargetY = py + 6;
    const catDist = Math.hypot(catTargetX - this.shalemSprite.x, catTargetY - this.shalemSprite.y);
    this.shalemSprite.x = Phaser.Math.Linear(this.shalemSprite.x, catTargetX, 0.1);
    this.shalemSprite.y = Phaser.Math.Linear(this.shalemSprite.y, catTargetY, 0.1);
    this.shalemSprite.setFlipX(facing < 0);
    this.shalemSprite.setDepth(this.shalemSprite.y);
    this.shalemShadow.setPosition(this.shalemSprite.x, this.shalemSprite.y).setDepth(this.shalemSprite.y - 1);
    if (catDist > 2.5) {
      this.playAnimSafe(this.shalemSprite, 'shalem_walk');
    } else {
      this.playAnimSafe(this.shalemSprite, 'shalem_sit_idle');
    }

    // Balloon timer
    if (this.shalemBalloonTimer > 0) {
      this.shalemBalloonTimer -= _delta;
      if (this.shalemBalloonTimer <= 0) {
        this.shalemBalloonBg.setVisible(false);
        this.shalemBalloonText.setVisible(false);
      }
    }
  }

  private triggerShalemBalloon(text: string, durationMs: number = 3200): void {
    this.shalemBalloonText.setText(text);
    this.shalemBalloonBg.setVisible(true);
    this.shalemBalloonText.setVisible(true);
    this.shalemBalloonTimer = durationMs;
  }

  private updateEnemies(delta: number): void {
    if (this.isActCleared || this.isInvulnerable || this.isTransitioningAct) return;

    let closestAlignedEnemy: Enemy | null = null;
    let closestAlignedDist = Infinity;
    const playerX = this.playerSprite.x;
    const playerY = this.playerSprite.y;
    const facing = this.player.facingDirection;
    const reachY = 26;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) {
        this.clearEnemyWarning(enemy.id);
        continue;
      }

      const sprite = this.enemySprites.get(enemy.id);
      const shadow = this.enemyShadows.get(enemy.id);
      if (!sprite) continue;

      // 2.5D Depth Alignment check (Pilar 2)
      const isDepthAligned = Math.abs(enemy.position.y - playerY) <= reachY;
      const dxToPlayer = (enemy.position.x - playerX) * facing;

      if (shadow) {
        if (isDepthAligned) {
          // Visual cue: Golden/Amber shadow ring when aligned on the same attack plane!
          shadow.setFillStyle(0xffaa22, 0.65);
        } else {
          // Neutral shadow when unaligned
          shadow.setFillStyle(0x000000, 0.45);
        }
      }

      // Track closest depth-aligned enemy in front of player for targeting reticle
      if (isDepthAligned && dxToPlayer > 0 && dxToPlayer < closestAlignedDist) {
        closestAlignedDist = dxToPlayer;
        closestAlignedEnemy = enemy;
      }

      // Update combat wind-up & recovery timers (Pilar 1)
      const { shouldStrike, recoveryEnded, stunEnded } = enemy.updateCombatTimers(delta);

      if (stunEnded) {
        sprite.clearTint();
      }

      if (recoveryEnded) {
        sprite.clearTint();
      }

      const dx = playerX - enemy.position.x;
      const dy = playerY - enemy.position.y;
      const dist = Math.hypot(dx, dy);
      const dirX = dx > 0 ? 1 : -1;
      sprite.setFlipX(dirX > 0);

      // Handle Telegraphed Strike completion
      if (shouldStrike) {
        this.clearEnemyWarning(enemy.id);
        this.playAnimSafe(sprite, this.getEnemyAnimKey(enemy.id, 'attack'), true);

        if (dist <= 48) {
          // Check for Perfect Parry!
          const isParry = this.player.state === CharacterState.BLOCKING && (this.time.now - this.lastGuardPressTime) <= 280;
          if (isParry) {
            this.triggerPerfectParry(enemy.position.x, enemy.position.y, false, enemy);
            enemy.interruptAttack(1200);
            sprite.setTint(0x77aaff);
            continue;
          }

          // Check for Player Invulnerable Dodge
          if (this.isInvulnerable || this.player.state === CharacterState.DODGING) {
            this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, '¡ESQUIVADO!', false, '#88ffaa');
            enemy.startRecovery(380);
            sprite.setTint(0x666666);
            continue;
          }

          const hitRes = CombatUseCases.executeEnemyAttack(enemy, this.player, false);
          this.timeSinceLastHit = 0;

          if (hitRes.damageToHealth > 0) {
            this.audio.playCombatHit(false);
            this.playAnimSafe(this.playerSprite, this.player.id === 'thomas' ? 'thomas_hurt' : 'khaterine_hurt', true);
            this.playerSprite.setTint(0xff5555);
            this.time.delayedCall(120, () => this.playerSprite.clearTint());
            this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, hitRes.damageToHealth, false, '#ff4444');
          } else if (hitRes.absorbedByGuard > 0) {
            this.audio.playSfx('block');
            this.playerSprite.setTint(0x55aaff);
            this.time.delayedCall(120, () => this.playerSprite.clearTint());
            this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, hitRes.absorbedByGuard, false, '#55aaff');
          }

          enemy.startRecovery(380);
          sprite.setTint(0x666666);
        } else {
          // Attack whiffed / player moved away
          enemy.startRecovery(250);
          sprite.setTint(0x666666);
        }
        continue;
      }

      // During Windup: enemy stays still, flashes warning and telegraph badge is kept overhead
      if (enemy.state === 'WINDUP') {
        const warn = this.enemyWarningBadges.get(enemy.id);
        if (warn) {
          warn.setPosition(sprite.x, sprite.y - 42);
        }
        continue;
      }

      // During Recovery or Stunned: enemy cannot move
      if (enemy.state === 'RECOVERY' || enemy.state === 'STUNNED') {
        continue;
      }

      // Normal movement toward player in 2.5D
      if (dist > 38) {
        const speedX = enemy.speed * (delta / 1000);
        const speedY = (enemy.speed * 0.65) * (delta / 1000);

        const newX = enemy.position.x + (dx / dist) * speedX;
        const newY = enemy.position.y + (dy / dist) * speedY;

        enemy.position = new Vector2(newX, newY);
        sprite.setPosition(newX, newY).setDepth(newY);
        this.playAnimSafe(sprite, this.getEnemyAnimKey(enemy.id, 'patrol'));
        if (shadow) shadow.setPosition(newX, newY).setDepth(newY - 1);
      } else if (dist <= 38 && enemy.attackCooldown <= 0 && (enemy.state === 'IDLE' || enemy.state === 'MOVING')) {
        // Start Telegraphed Attack Wind-up (Pilar 1: 450ms reaction window!)
        enemy.startWindup(450);
        sprite.setTint(0xff2222);
        this.audio.playSfx('warning');
        this.showEnemyWarning(enemy.id, sprite.x, sprite.y - 42);
        this.playAnimSafe(sprite, this.getEnemyAnimKey(enemy.id, 'windup'), true);
      }
    }

    // Update Target Focus Reticle
    if (this.targetFocusMarker) {
      if (closestAlignedEnemy) {
        this.targetFocusMarker.setPosition(closestAlignedEnemy.position.x, closestAlignedEnemy.position.y - 48).setVisible(true);
      } else if (this.currentBoss && this.bossSprite && this.currentBoss.health > 0) {
        const isBossAligned = Math.abs(this.bossSprite.y - playerY) <= 32;
        const bdxToPlayer = (this.currentBoss.position.x - playerX) * facing;
        if (isBossAligned && bdxToPlayer > 0 && bdxToPlayer <= 160) {
          this.targetFocusMarker.setPosition(this.bossSprite.x, this.bossSprite.y - 65).setVisible(true);
        } else {
          this.targetFocusMarker.setVisible(false);
        }
      } else {
        this.targetFocusMarker.setVisible(false);
      }
    }
  }

  private updateBoss(delta: number): void {
    if (this.isActCleared || this.isInvulnerable || !this.currentBoss || !this.bossSprite || this.currentBoss.health <= 0) {
      this.clearBossWarning();
      this.destroyBossShieldAura();
      return;
    }

    if (this.bossMarker) {
      this.bossMarker.x = this.bossSprite.x;
    }

    // 2.5D Depth Alignment on Boss Shadow (Pilar 2)
    const isBossAligned = Math.abs(this.bossSprite.y - this.playerSprite.y) <= 32;
    if (this.bossShadow) {
      this.bossShadow.setFillStyle(isBossAligned ? 0xff4444 : 0x000000, isBossAligned ? 0.65 : 0.5);
    }

    // Update Boss Combat Timers (Pilar 1 & 3)
    const { shouldStrike, recoveryEnded, stunEnded } = this.currentBoss.updateBossCombatTimers(delta);

    if (stunEnded) {
      this.bossSprite.clearTint();
    }

    if (recoveryEnded) {
      this.bossSprite.clearTint();
    }

    const dx = this.playerSprite.x - this.bossSprite.x;
    const dy = this.playerSprite.y - this.bossSprite.y;
    const dist = Math.hypot(dx, dy);
    const aliveEnemies = this.enemies.filter(e => e.isAlive()).length;

    // Boss Flame Shield Aura Sync (Pilar 3)
    if (this.currentBoss.isFlameShieldActive && this.bossShieldAura) {
      this.bossShieldAura.setPosition(this.bossSprite.x, this.bossSprite.y - 35).setDepth(this.bossSprite.y + 1);
    } else if (!this.currentBoss.isFlameShieldActive && this.bossShieldAura) {
      this.destroyBossShieldAura();
    }

    // Anti-Kiting / Flame Step (Pilar 3: Prevents sitting in the distance shooting Morwenna)
    if (this.currentBoss.id === 'madre_morwenna' && dist > 150 && this.currentBoss.state !== 'STUNNED') {
      this.kitingTimer += delta;
      if (this.kitingTimer >= 2200 && this.currentBoss.teleportCooldown <= 0) {
        this.executeBossFlameStep();
        this.kitingTimer = 0;
      }
    } else {
      this.kitingTimer = 0;
    }

    // Phase 2 Ground Flame Pillars (Pilar 3)
    this.updateFlamePillars(delta);

    // Handle Telegraphed Boss Strike completion
    if (shouldStrike) {
      this.clearBossWarning();
      if (this.currentBoss.id === 'madre_morwenna') {
        const strikeAnim = this.currentBoss.phase === BossPhaseType.PHASE_2 ? 'morwenna_phase2_whirlwind' : 'morwenna_swing_crucible';
        this.playAnimSafe(this.bossSprite, strikeAnim, true);
      } else if (this.currentBoss.id === 'guardian_crisol') {
        this.playAnimSafe(this.bossSprite, 'zealot_heavy_slam', true);
      } else if (this.currentBoss.id === 'capitan_aureo') {
        this.playAnimSafe(this.bossSprite, 'skeleton_claymore_slash', true);
      } else if (this.currentBoss.id === 'rex_malphas') {
        this.playAnimSafe(this.bossSprite, 'morwenna_phase2_lunge', true);
      } else if (this.currentBoss.id === 'astaroth') {
        this.playAnimSafe(this.bossSprite, 'morwenna_phase2_whirlwind', true);
      }

      if (dist < 85) {
        // Check for Perfect Parry against Boss!
        const isParry = this.player.state === CharacterState.BLOCKING && (this.time.now - this.lastGuardPressTime) <= 280;
        if (isParry) {
          this.triggerPerfectParry(this.bossSprite.x, this.bossSprite.y, true);
          this.currentBoss.interruptAttack(1400);
          this.bossSprite.setTint(0x77aaff);
          return;
        }

        // Check for Player Invulnerable Dodge
        if (this.isInvulnerable || this.player.state === CharacterState.DODGING) {
          this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 50, '¡ESQUIVADO!', true, '#88ffaa');
          this.currentBoss.startRecovery(500);
          this.bossSprite.setTint(0x666666);
          return;
        }

        const hitRes = CombatUseCases.executeEnemyAttack(
          { attackPower: this.currentBoss.attackPower, isAlive: () => true } as unknown as Enemy,
          this.player,
          true
        );
        this.timeSinceLastHit = 0;

        if (hitRes.damageToHealth > 0) {
          this.audio.playCombatHit(true);
          this.playAnimSafe(this.playerSprite, this.player.id === 'thomas' ? 'thomas_hurt' : 'khaterine_hurt', true);
          this.playerSprite.setTint(0xff4444);
          this.time.delayedCall(140, () => this.playerSprite.clearTint());
          this.cameras.main.shake(250, 0.015);
          this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 50, hitRes.damageToHealth, true, '#ff3333');
        } else if (hitRes.absorbedByGuard > 0) {
          this.audio.playSfx('block');
          this.playerSprite.setTint(0x55aaff);
          this.time.delayedCall(120, () => this.playerSprite.clearTint());
          this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 50, hitRes.absorbedByGuard, false, '#55aaff');
        }

        this.currentBoss.startRecovery(500);
        this.bossSprite.setTint(0x666666);
      } else {
        // Whiffed
        this.currentBoss.startRecovery(350);
        this.bossSprite.setTint(0x666666);
      }
      return;
    }

    // During Boss Windup: boss stays still and keeps warning badge positioned
    if (this.currentBoss.state === 'WINDUP') {
      if (this.bossWarningBadge) {
        this.bossWarningBadge.setPosition(this.bossSprite.x, this.bossSprite.y - 70);
      }
      return;
    }

    // During Recovery or Stunned: boss cannot move
    if (this.currentBoss.state === 'RECOVERY' || this.currentBoss.state === 'STUNNED') {
      return;
    }

    // Keep Morwenna idle animation active according to phase
    if (this.currentBoss.id === 'madre_morwenna') {
      const idleAnim = this.currentBoss.phase === BossPhaseType.PHASE_2 ? 'morwenna_phase2_idle' : 'morwenna_levitate_idle';
      this.playAnimSafe(this.bossSprite, idleAnim);
    }

    // When minions are defeated or boss engages: advance in 2.5D!
    if ((aliveEnemies === 0 || this.currentBoss.phase === BossPhaseType.PHASE_2) && dist > 65) {
      const speedX = (this.currentBoss.phase === BossPhaseType.PHASE_2 ? 55 : 40) * (delta / 1000);
      const speedY = (this.currentBoss.phase === BossPhaseType.PHASE_2 ? 35 : 26) * (delta / 1000);

      this.bossSprite.x += (dx / dist) * speedX;
      this.bossSprite.y += (dy / dist) * speedY;
      this.currentBoss.position = new Vector2(this.bossSprite.x, this.bossSprite.y);

      this.bossSprite.setFlipX(dx < 0);
      this.bossSprite.setDepth(this.bossSprite.y);
      if (this.bossShadow) {
        this.bossShadow.setPosition(this.bossSprite.x, this.bossSprite.y).setDepth(this.bossSprite.y - 1);
      }
    }

    // Start Telegraphed Boss Strike
    if (dist < 80 && (this.currentBoss.state === 'IDLE' || this.currentBoss.state === 'MOVING')) {
      this.bossAttackTimer += delta;
      const attackThreshold = this.currentBoss.phase === BossPhaseType.PHASE_2 ? 1400 : 1900;

      if (this.bossAttackTimer >= attackThreshold) {
        this.bossAttackTimer = 0;
        this.currentBoss.startWindup(580);
        this.bossSprite.setTint(0xff5500);
        if (this.currentBoss.id === 'madre_morwenna') {
          const castAnim = this.currentBoss.phase === BossPhaseType.PHASE_2 ? 'morwenna_phase2_lunge' : 'morwenna_cast_flame';
          this.playAnimSafe(this.bossSprite, castAnim, true);
        }
        this.audio.playSfx('warning');
        this.showBossWarning('⚠️ ¡GOLPE DE CRISOL! ⚠️', this.bossSprite.x, this.bossSprite.y - 70);
      }
    }
  }

  private showEnemyWarning(enemyId: string, x: number, y: number): void {
    if (this.enemyWarningBadges.has(enemyId)) {
      this.enemyWarningBadges.get(enemyId)!.setPosition(x, y);
      return;
    }
    const txt = this.add.text(x, y, '⚠️', {
      fontSize: '12px'
    }).setOrigin(0.5).setDepth(340);
    this.tweens.add({
      targets: txt,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 200,
      yoyo: true,
      repeat: -1
    });
    this.enemyWarningBadges.set(enemyId, txt);
  }

  private clearEnemyWarning(enemyId: string): void {
    const badge = this.enemyWarningBadges.get(enemyId);
    if (badge) {
      badge.destroy();
      this.enemyWarningBadges.delete(enemyId);
    }
  }

  private showBossWarning(text: string, x: number, y: number): void {
    if (!this.bossWarningBadge) {
      this.bossWarningBadge = this.add.text(x, y, text, {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '8.5px',
        color: '#ff4400',
        stroke: '#000000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(345);
      this.tweens.add({
        targets: this.bossWarningBadge,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 180,
        yoyo: true,
        repeat: -1
      });
    } else {
      this.bossWarningBadge.setText(text).setPosition(x, y).setVisible(true);
    }
  }

  private clearBossWarning(): void {
    if (this.bossWarningBadge) {
      this.bossWarningBadge.destroy();
      this.bossWarningBadge = undefined;
    }
  }

  private executeBossFlameStep(): void {
    if (!this.currentBoss || !this.bossSprite) return;
    this.currentBoss.teleportCooldown = 4500;
    const targetX = Phaser.Math.Clamp(this.playerSprite.x + (this.player.facingDirection > 0 ? 55 : -55), 60, 580);
    const targetY = Phaser.Math.Clamp(this.playerSprite.y, 225, 295);

    this.cameras.main.shake(120, 0.008);
    this.audio.playSfx('dodge');
    this.spawnDamageNumber(this.bossSprite.x, this.bossSprite.y - 65, '¡PASO PIROCLÁSTICO!', false, '#ff7733');

    this.bossSprite.setPosition(targetX, targetY).setDepth(targetY);
    if (this.bossShadow) this.bossShadow.setPosition(targetX, targetY).setDepth(targetY - 1);
    this.currentBoss.position = new Vector2(targetX, targetY);
  }

  private createBossShieldAura(): void {
    if (this.bossShieldAura) this.destroyBossShieldAura();
    if (!this.bossSprite) return;

    this.bossShieldAura = this.add.circle(this.bossSprite.x, this.bossSprite.y - 35, 36, 0xff5500, 0.35)
      .setStrokeStyle(2, 0xffaa00)
      .setDepth(330);

    this.tweens.add({
      targets: this.bossShieldAura,
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: 0.65,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.spawnDamageNumber(this.bossSprite.x, this.bossSprite.y - 60, '¡ESCUDO ÍGNEO!', true, '#ffaa00');
  }

  private destroyBossShieldAura(): void {
    if (this.bossShieldAura) {
      this.bossShieldAura.destroy();
      this.bossShieldAura = undefined;
    }
  }

  private triggerPhase2FirePillars(): void {
    if (!this.currentBoss || this.currentBoss.phase !== BossPhaseType.PHASE_2 || this.currentBoss.health <= 0) return;
    const px = Phaser.Math.Clamp(this.playerSprite.x + (Math.random() - 0.5) * 60, 60, 580);
    const py = Phaser.Math.Clamp(this.playerSprite.y + (Math.random() - 0.5) * 30, 225, 295);

    const warningCircle = this.add.circle(px, py, 24, 0xff0000, 0.4)
      .setStrokeStyle(1.5, 0xff5500)
      .setDepth(210);

    this.tweens.add({
      targets: warningCircle,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0.8,
      duration: 650,
      ease: 'Quad.easeIn'
    });

    this.activeFlamePillars.push({
      warningCircle,
      timer: 700,
      x: px,
      y: py,
      hasExploded: false
    });
  }

  private updateFlamePillars(delta: number): void {
    if (this.currentBoss && this.currentBoss.phase === BossPhaseType.PHASE_2 && this.currentBoss.health > 0) {
      this.pillarSpawnTimer += delta;
      if (this.pillarSpawnTimer >= 4200) {
        this.pillarSpawnTimer = 0;
        this.triggerPhase2FirePillars();
      }
    }

    for (let i = this.activeFlamePillars.length - 1; i >= 0; i--) {
      const p = this.activeFlamePillars[i];
      p.timer -= delta;
      if (p.timer <= 0 && !p.hasExploded) {
        p.hasExploded = true;
        p.warningCircle.destroy();

        this.spawnAnimatedVfx(p.x, p.y - 10, 'fx_flame_geyser_ground', 1.0, false);
        this.spawnAnimatedVfx(p.x, p.y - 45, 'fx_flame_pillar', 1.0, false);
        this.audio.playCombatHit(true);
        this.cameras.main.shake(140, 0.01);

        const distToPlayer = Math.hypot(this.playerSprite.x - p.x, this.playerSprite.y - p.y);
        if (distToPlayer < 32 && !this.isInvulnerable && this.player.state !== CharacterState.DODGING) {
          this.player.takeHit(18, true);
          this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, 18, true, '#ff2200');
          this.playerSprite.setTint(0xff2200);
          this.time.delayedCall(120, () => this.playerSprite.clearTint());
        }

        this.activeFlamePillars.splice(i, 1);
      }
    }
  }

  private startOakhavenTraining(): void {
    this.isTutorialActive = true;
    this.tutorialStep = 1;
    this.tutorialHits = 0;

    const dummyX = 350;
    const dummyY = 260;
    this.tutorialDummyShadow = this.add.ellipse(dummyX, dummyY, 26, 8, 0x000000, 0.45).setDepth(dummyY - 1);
    this.tutorialDummy = this.add.sprite(dummyX, dummyY, 'dummy_training').setOrigin(0.5, 1).setDepth(dummyY);

    this.tutorialTargetRing = this.add.ellipse(220, 260, 36, 14, 0xffd700, 0.4)
      .setStrokeStyle(1.5, 0xffea00)
      .setDepth(200);

    this.tweens.add({
      targets: this.tutorialTargetRing,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.75,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    this.tutorialBannerBg = this.add.rectangle(320, 22, 530, 24, 0x12081f, 0.92)
      .setStrokeStyle(1.5, 0xffd700)
      .setDepth(340);
    this.tutorialBannerText = this.add.text(320, 22, 'ENTRENAMIENTO (PASO 1/4): Usa [WASD] para moverte en profundidad hacia el círculo dorado', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(341);

    this.tutorialSkipPrompt = this.add.text(320, 40, '[ESC] o [ENTER]: Saltar Entrenamiento y combatir de inmediato', {
      fontFamily: 'monospace',
      fontSize: '7.5px',
      color: '#bbaacc'
    }).setOrigin(0.5).setDepth(341);

    this.triggerShalemBalloon("Shalem: «¡No tan rápido, muchacho! Antes de que Morwenna arrase Oakhaven, asegúrate de recordar cómo moverte en 2.5D.»", 5000);
  }

  private updateTraining(_delta: number): void {
    if (!this.isTutorialActive) return;

    if ((this.keyEsc && Phaser.Input.Keyboard.JustDown(this.keyEsc)) ||
        (this.keyEnter && Phaser.Input.Keyboard.JustDown(this.keyEnter))) {
      this.finishTrainingAndSpawnRealEnemies();
      return;
    }

    if (this.tutorialStep === 1) {
      const dist = Math.hypot(this.playerSprite.x - 220, this.playerSprite.y - 260);
      if (dist < 22) {
        this.advanceTrainingStep(2);
      }
    }
  }

  private advanceTrainingStep(step: number): void {
    this.tutorialStep = step;
    this.audio.playSfx('menu_select');

    if (step === 2) {
      if (this.tutorialTargetRing) this.tutorialTargetRing.setVisible(false);
      this.tutorialBannerText?.setText('ENTRENAMIENTO (PASO 2/4): Golpea el muñeco con Ataque Ligero [J] y Fuerte [K] (x1.6)');
      this.triggerShalemBalloon("Shalem: «¡Bien! Ahora dale un par de tajos al muñeco de paja con [J] y un remate pesado con [K].»", 4500);
    } else if (step === 3) {
      this.tutorialBannerText?.setText('ENTRENAMIENTO (PASO 3/4): Cuando el muñeco destelle en rojo ⚠️, pulsa [L] para hacer PARRY');
      this.triggerShalemBalloon("Shalem: «¡Atento! El muñeco cargará un golpe telegrafiado. Pulsa [L] justo al ver el destello ⚠️ para hacer Parry Perfecto.»", 5000);

      this.time.delayedCall(1200, () => {
        if (!this.isTutorialActive || this.tutorialStep !== 3 || !this.tutorialDummy) return;
        this.tutorialDummy.setTint(0xff2222);
        this.audio.playSfx('warning');
        const warn = this.add.text(this.tutorialDummy.x, this.tutorialDummy.y - 48, '⚠️', { fontSize: '14px' }).setOrigin(0.5).setDepth(340);
        this.time.delayedCall(450, () => {
          warn.destroy();
          if (!this.isTutorialActive || this.tutorialStep !== 3) return;
          this.tutorialDummy?.clearTint();
          if (this.player.state === CharacterState.BLOCKING) {
            this.triggerPerfectParry(this.tutorialDummy!.x, this.tutorialDummy!.y, false);
            this.advanceTrainingStep(4);
          } else {
            this.triggerShalemBalloon("Shalem: «¡Casi! Tienes que pulsar [L] justo al ver el aviso rojo. ¡Intentémoslo de nuevo!»", 3000);
            this.time.delayedCall(2000, () => this.advanceTrainingStep(3));
          }
        });
      });
    } else if (step === 4) {
      this.tutorialBannerText?.setText('ENTRENAMIENTO (PASO 4/4): Esquiva con [ESPACIO] o lanza tu arma con [T] y recógela con [E]');
      this.triggerShalemBalloon("Shalem: «¡Ese fue un Parry impecable! Ahora prueba tu esquiva con [ESPACIO] o lanza tu espada con [T].»", 4500);
      this.time.delayedCall(3000, () => {
        this.finishTrainingAndSpawnRealEnemies();
      });
    }
  }

  private finishTrainingAndSpawnRealEnemies(): void {
    this.isTutorialActive = false;
    this.shouldPlayOakhavenTraining = false;

    this.tutorialDummy?.destroy();
    this.tutorialDummy = undefined;
    this.tutorialDummyShadow?.destroy();
    this.tutorialDummyShadow = undefined;
    this.tutorialTargetRing?.destroy();
    this.tutorialTargetRing = undefined;
    this.tutorialBannerBg?.destroy();
    this.tutorialBannerBg = undefined;
    this.tutorialBannerText?.destroy();
    this.tutorialBannerText = undefined;
    this.tutorialSkipPrompt?.destroy();
    this.tutorialSkipPrompt = undefined;

    this.spawnAct1RealEnemies();
    this.triggerShalemBalloon("Shalem: «¡Suficiente práctica! ¡Las antorchas de Morwenna ya están aquí! ¡A la batalla!»", 5000);
  }

  private spawnAct1RealEnemies(): void {
    const e1 = Enemy.createAshProwler('ash_1', new Vector2(360, 248));
    const e2 = Enemy.createFanaticMonk('monk_1', new Vector2(440, 280));
    const e3 = Enemy.createFanaticMonk('zealot_1', new Vector2(485, 240));
    this.enemies.push(e1, e2, e3);

    const s1 = this.add.ellipse(360, 248, 26, 8, 0x000000, 0.45).setDepth(247);
    const s2 = this.add.ellipse(440, 280, 24, 7, 0x000000, 0.45).setDepth(279);
    const s3 = this.add.ellipse(485, 240, 24, 7, 0x000000, 0.45).setDepth(239);
    this.enemyShadows.set(e1.id, s1);
    this.enemyShadows.set(e2.id, s2);
    this.enemyShadows.set(e3.id, s3);

    const sp1 = this.normalizeSprite(this.add.sprite(e1.position.x, e1.position.y, 'hound_patrol', 0), 64, 48, 0.5, 0.9).setDepth(248);
    this.playAnimSafe(sp1, 'hound_patrol');
    this.enemySprites.set(e1.id, sp1);

    const sp2 = this.normalizeSprite(this.add.sprite(e2.position.x, e2.position.y, 'cultist_patrol', 0), 48, 48, 0.5, 0.9).setDepth(280);
    this.playAnimSafe(sp2, 'cultist_patrol');
    this.enemySprites.set(e2.id, sp2);

    const sp3 = this.normalizeSprite(this.add.sprite(e3.position.x, e3.position.y, 'zealot_patrol', 0), 64, 64, 0.5, 0.9).setDepth(240);
    this.playAnimSafe(sp3, 'zealot_patrol');
    this.enemySprites.set(e3.id, sp3);

    this.currentBoss = Boss.createMadreMorwenna();
    this.bossShadow = this.add.ellipse(540, 260, 34, 10, 0x000000, 0.55).setDepth(259);
    this.bossSprite = this.normalizeSprite(this.add.sprite(540, 260, 'morwenna_levitate_idle', 0), 96, 96, 0.5, 0.9).setDepth(260);
    this.playAnimSafe(this.bossSprite, 'morwenna_levitate_idle');
    this.createBossMarker('Madre Morwenna', 540, 260);
  }

  private spawnScenarioProps(scenarioIndex: number): void {
    this.scenarioProps.forEach(p => p.destroy());
    this.scenarioProps = [];

    const addProp = (key: string, x: number, y: number, maxW: number, maxH: number, animate: boolean = true) => {
      if (!this.textures.exists(key)) return;
      const spr = this.normalizeSprite(this.add.sprite(x, y, key, 0), maxW, maxH, 0.5, 0.95).setDepth(y - 2);
      if (animate && this.anims.exists(key)) {
        spr.play(key);
      }
      this.scenarioProps.push(spr);
    };

    if (scenarioIndex === 1) {
      // Act I: Oakhaven Village Props from Visual Pack
      addProp('prop_sanctuary_cross', 125, 222, 48, 80, true);
      addProp('prop_sanctuary_altar', 188, 224, 64, 48, true);
      addProp('prop_street_lamp', 85, 212, 32, 96, true);
      addProp('prop_street_lamp', 310, 212, 32, 96, true);
      addProp('prop_barrel', 235, 224, 32, 48, false);
      addProp('prop_parish_crate', 258, 225, 32, 32, false);
      addProp('prop_great_pyre', 555, 232, 96, 96, true);
      addProp('prop_cemetery_gate', 610, 222, 64, 96, false);
    } else if (scenarioIndex === 2) {
      // Act II: Belltower & Cemetery Crypt Entrance Props
      addProp('prop_mausoleum_facade', 565, 215, 96, 128, true);
      addProp('prop_celtic_gravestone', 140, 222, 32, 48, false);
      addProp('prop_celtic_gravestone', 320, 220, 32, 48, false);
      addProp('prop_monumental_sarcophagus', 280, 225, 64, 64, false);
      addProp('prop_soul_brazier', 195, 224, 32, 48, true);
      addProp('prop_soul_brazier', 485, 224, 32, 48, true);
      addProp('prop_barrel', 90, 232, 32, 48, false);
    } else if (scenarioIndex === 3) {
      // Act III: Great Stone Bridge Props
      addProp('prop_street_lamp', 110, 212, 32, 96, true);
      addProp('prop_street_lamp', 290, 212, 32, 96, true);
      addProp('prop_street_lamp', 470, 212, 32, 96, true);
      addProp('prop_cemetery_gate', 595, 222, 64, 96, false);
      addProp('prop_parish_crate', 145, 245, 32, 32, false);
      addProp('prop_barrel', 168, 246, 32, 48, false);
    } else if (scenarioIndex === 4) {
      // Act IV: Londinium Citadel Props
      addProp('prop_sanctuary_altar', 310, 222, 64, 48, true);
      addProp('prop_soul_brazier', 240, 224, 32, 48, true);
      addProp('prop_soul_brazier', 380, 224, 32, 48, true);
      addProp('prop_mausoleum_facade', 575, 215, 96, 128, true);
    } else {
      // Act V: Inverted Cathedral Props
      addProp('prop_sanctuary_cross', 150, 235, 48, 80, true);
      addProp('prop_sanctuary_altar', 200, 238, 64, 48, true);
      addProp('prop_soul_brazier', 270, 225, 32, 48, true);
      addProp('prop_soul_brazier', 450, 225, 32, 48, true);
      addProp('prop_great_pyre', 540, 235, 96, 96, true);
    }
  }

  private createBossMarker(bossName: string, x: number, y: number): void {
    if (this.bossMarker) {
      this.bossMarker.destroy();
      this.bossMarker = undefined;
    }
    if (this.bossMarkerTween) {
      this.bossMarkerTween.stop();
      this.bossMarkerTween = undefined;
    }

    this.bossMarker = this.add.text(x, y - 75, `▼ JEFE: ${bossName.toUpperCase()} ▼`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '8.5px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(340);

    this.bossMarkerTween = this.tweens.add({
      targets: this.bossMarker,
      y: y - 83,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private updateDroppedWeapons(): void {
    const dropped = this.player.disarmManager.getDroppedWeapons();

    // Clean up collected items
    for (const [id, container] of this.droppedWeaponSprites.entries()) {
      if (!dropped.some(d => d.id === id)) {
        container.destroy();
        this.droppedWeaponSprites.delete(id);
      }
    }

    // Add new dropped items
    for (const item of dropped) {
      if (!this.droppedWeaponSprites.has(item.id)) {
        const c = this.add.container(item.position.x, 265).setDepth(265);
        const icon = this.add.image(0, 0, 'icon_sword').setScale(1.2);
        const text = this.add.text(0, -18, '[E] RECOGER', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#ffd700',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: { x: 3, y: 1 }
        }).setOrigin(0.5);

        c.add([icon, text]);
        this.droppedWeaponSprites.set(item.id, c);
      }
    }
  }

  public loadScenario(scenarioIndex: number): void {
    this.clearActExit();
    this.currentScenario = scenarioIndex;
    this.storyProgress.setAct(scenarioIndex);
    this.hasTalkedToElowen = false; // Reset per-scenario Elowen interaction
    this.saveCheckpoint();

    // Clear existing enemies, shadows & boss
    this.enemies.forEach(e => {
      this.enemySprites.get(e.id)?.destroy();
      this.enemyShadows.get(e.id)?.destroy();
    });
    this.enemies = [];
    this.enemySprites.clear();
    this.enemyShadows.clear();

    this.bossSprite?.destroy();
    this.bossSprite = undefined;
    this.bossShadow?.destroy();
    this.bossShadow = undefined;

    if (this.bossMarker) {
      this.bossMarker.destroy();
      this.bossMarker = undefined;
    }
    if (this.bossMarkerTween) {
      this.bossMarkerTween.stop();
      this.bossMarkerTween = undefined;
    }

    // Clear Elowen if moving to another scenario
    if (this.elowenSprite) {
      this.elowenSprite.destroy();
      this.elowenSprite = undefined;
      this.elowenShadow?.destroy();
      this.elowenShadow = undefined;
      this.elowenBadge?.destroy();
      this.elowenBadge = undefined;
    }

    // Clear Padre Cedric
    if (this.cedricSprite) {
      this.cedricSprite.destroy();
      this.cedricSprite = undefined;
      this.cedricShadow?.destroy();
      this.cedricShadow = undefined;
    }

    // Clear Dropped Censer
    if (this.droppedCenserSprite) {
      this.droppedCenserSprite.destroy();
      this.droppedCenserSprite = undefined;
      this.droppedCenserShadow?.destroy();
      this.droppedCenserShadow = undefined;
      this.droppedCenserMarker?.destroy();
      this.droppedCenserMarker = undefined;
      this.droppedCenserTween?.stop();
      this.droppedCenserTween = undefined;
    }

    this.closeGameOverModal();
    this.isGameOverModalOpen = false;
    this.gameOverContainer = undefined;
    this.lastGuardPressTime = 0;
    this.hasAlbaGrisAwakened = false;

    // Populate official visual pack props for this scenario
    this.spawnScenarioProps(scenarioIndex);

    const introLines = this.dialogues.getScenarioIntro(this.currentScenario);

    if (scenarioIndex === 1) {
      // Oakhaven
      this.bgImage.setTexture('bg_oakhaven');
      this.audio.playBgm('bgm_oakhaven_night');
      this.emberParticles.setPosition(280, 255);
      this.emberParticles.start();

      // Spawn Elowen NPC near the garden fence (Animated 48x48 elowen_idle sprite sheet)
      this.elowenShadow = this.add.ellipse(270, 225, 24, 7, 0x000000, 0.45).setDepth(224);
      this.elowenSprite = this.normalizeSprite(this.add.sprite(270, 225, 'elowen_idle', 0), 54, 54, 0.5, 0.9).setDepth(225);
      this.playAnimSafe(this.elowenSprite, 'elowen_idle');

      // Spawn Padre Cedric NPC holding lantern (Animated 48x48 cedric_idle sprite sheet)
      this.cedricShadow = this.add.ellipse(160, 225, 24, 7, 0x000000, 0.45).setDepth(224);
      this.cedricSprite = this.normalizeSprite(this.add.sprite(160, 225, 'cedric_idle', 0), 54, 54, 0.5, 0.9).setDepth(225);
      this.playAnimSafe(this.cedricSprite, 'cedric_idle');

      if (this.shouldPlayOakhavenTraining) {
        this.startOakhavenTraining();
      } else {
        this.spawnAct1RealEnemies();
        const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Acto I: Oakhaven»";
        this.triggerShalemBalloon(introText, 4500);
      }
    } else if (scenarioIndex === 2) {
      // El Campanario y Granero del Sur (Caps VII-IX)
      this.bgImage.setTexture('bg_belltower');
      this.audio.playBgm('bgm_oakhaven_night');
      this.emberParticles.stop();

      // Spawn Elowen NPC in Belltower cell
      this.elowenShadow = this.add.ellipse(220, 225, 24, 7, 0x000000, 0.45).setDepth(224);
      this.elowenSprite = this.normalizeSprite(this.add.sprite(220, 225, 'elowen_idle', 0), 54, 54, 0.5, 0.9).setDepth(225);
      this.playAnimSafe(this.elowenSprite, 'elowen_pray');

      // Spawn Inquisitor Torre (Cultist) & Sulphur Prowler (Hound)
      const e1 = Enemy.createInquisitorTorre('corista_1', new Vector2(390, 255));
      const e2 = Enemy.createAshProwler('ash_2', new Vector2(460, 280));
      this.enemies.push(e1, e2);

      const s1 = this.add.ellipse(390, 255, 24, 7, 0x000000, 0.45).setDepth(254);
      const s2 = this.add.ellipse(460, 280, 26, 8, 0x000000, 0.45).setDepth(279);
      this.enemyShadows.set(e1.id, s1);
      this.enemyShadows.set(e2.id, s2);

      const sp1 = this.normalizeSprite(this.add.sprite(e1.position.x, e1.position.y, 'cultist_patrol', 0), 52, 52, 0.5, 0.9).setDepth(255);
      this.playAnimSafe(sp1, 'cultist_patrol');
      this.enemySprites.set(e1.id, sp1);

      const sp2 = this.normalizeSprite(this.add.sprite(e2.position.x, e2.position.y, 'hound_patrol', 0), 64, 48, 0.5, 0.9).setDepth(280);
      this.playAnimSafe(sp2, 'hound_patrol');
      this.enemySprites.set(e2.id, sp2);

      // Boss Guardián del Crisol (Animated Zealot Heavy Slam / Crucible Boss)
      this.currentBoss = Boss.createGuardianCrisol();
      this.bossShadow = this.add.ellipse(520, 260, 32, 9, 0x000000, 0.5).setDepth(259);
      this.bossSprite = this.normalizeSprite(this.add.sprite(520, 260, 'zealot_heavy_slam', 0), 82, 82, 0.5, 0.9).setDepth(260);
      this.playAnimSafe(this.bossSprite, 'zealot_heavy_slam');
      this.createBossMarker('Guardián del Crisol', 520, 260);

      const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Acto II: El Campanario y Granero»";
      this.triggerShalemBalloon(introText, 4500);
    } else if (scenarioIndex === 3) {
      // El Gran Puente de Piedra y Camino de los Herejes (Caps X-XIII)
      this.bgImage.setTexture('bg_bridge');
      this.audio.playBgm('bgm_londinium_city');
      this.emberParticles.stop();

      // Spawn Elowen NPC escorting refugees
      this.elowenShadow = this.add.ellipse(170, 255, 24, 7, 0x000000, 0.45).setDepth(254);
      this.elowenSprite = this.normalizeSprite(this.add.sprite(170, 255, 'elowen_idle', 0), 54, 54, 0.5, 0.9).setDepth(255);
      this.playAnimSafe(this.elowenSprite, 'elowen_idle');

      // Spawn Golden Guard (Zealot) & Shield Knight (Penitent Skeleton)
      const g1 = Enemy.createGoldenGuard('guard_bridge_1', new Vector2(380, 255));
      const k1 = Enemy.createShieldKnight('shield_knight_1', new Vector2(450, 280));
      this.enemies.push(g1, k1);

      const s1 = this.add.ellipse(380, 255, 24, 7, 0x000000, 0.45).setDepth(254);
      const s2 = this.add.ellipse(450, 280, 26, 8, 0x000000, 0.45).setDepth(279);
      this.enemyShadows.set(g1.id, s1);
      this.enemyShadows.set(k1.id, s2);

      const sp1 = this.normalizeSprite(this.add.sprite(g1.position.x, g1.position.y, 'zealot_patrol', 0), 64, 64, 0.5, 0.9).setDepth(255);
      this.playAnimSafe(sp1, 'zealot_patrol');
      this.enemySprites.set(g1.id, sp1);

      const sp2 = this.normalizeSprite(this.add.sprite(k1.position.x, k1.position.y, 'skeleton_patrol', 0), 64, 64, 0.5, 0.9).setDepth(280);
      this.playAnimSafe(sp2, 'skeleton_patrol');
      this.enemySprites.set(k1.id, sp2);

      // Boss Capitán Áureo Vane
      this.currentBoss = Boss.createCapitanAureo();
      this.bossShadow = this.add.ellipse(520, 260, 32, 9, 0x000000, 0.5).setDepth(259);
      this.bossSprite = this.normalizeSprite(this.add.sprite(520, 260, 'skeleton_patrol', 0), 84, 84, 0.5, 0.9).setDepth(260).setTint(0xffe066);
      this.playAnimSafe(this.bossSprite, 'skeleton_patrol');
      this.createBossMarker('Capitán Áureo Vane', 520, 260);

      const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Acto III: El Gran Puente de Piedra»";
      this.triggerShalemBalloon(introText, 4500);
    } else if (scenarioIndex === 4) {
      // Londinium — La Ciudadela Dorada (Caps XIV-XVII)
      this.bgImage.setTexture('bg_londinium');
      this.audio.playBgm('bgm_londinium_city');
      this.emberParticles.stop();

      // Spawn Golden Guards in 2.5D
      const g1 = Enemy.createGoldenGuard('guard_1', new Vector2(400, 255));
      this.enemies.push(g1);
      const s1 = this.add.ellipse(400, 255, 24, 7, 0x000000, 0.45).setDepth(254);
      this.enemyShadows.set(g1.id, s1);
      const sp1 = this.normalizeSprite(this.add.sprite(g1.position.x, g1.position.y, 'zealot_patrol', 0), 64, 64, 0.5, 0.9).setDepth(255);
      this.playAnimSafe(sp1, 'zealot_patrol');
      this.enemySprites.set(g1.id, sp1);

      // Boss Rex Malphas
      this.currentBoss = Boss.createRexMalphas();
      this.bossShadow = this.add.ellipse(520, 260, 32, 9, 0x000000, 0.5).setDepth(259);
      this.bossSprite = this.normalizeSprite(this.add.sprite(520, 260, 'morwenna_levitate_idle', 0), 96, 96, 0.5, 0.9).setDepth(260).setTint(0xdd99ff);
      this.playAnimSafe(this.bossSprite, 'morwenna_levitate_idle');
      this.createBossMarker('Rex Malphas', 520, 260);

      const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Acto IV: Londinium»";
      this.triggerShalemBalloon(introText, 4500);

      // Spawn Elowen NPC — imprisoned near the dungeon gate in Londinium
      this.elowenShadow = this.add.ellipse(185, 268, 22, 6, 0x000000, 0.4).setDepth(267);
      this.elowenSprite = this.normalizeSprite(this.add.sprite(185, 268, 'elowen_idle', 0), 54, 54, 0.5, 0.9).setDepth(268).setTint(0xc8b8e8);
      this.playAnimSafe(this.elowenSprite, 'elowen_pray');
    } else {
      // Catedral Invertida — El Sol del Abismo (Caps XVIII-XX)
      this.bgImage.setTexture('bg_cathedral');
      this.audio.playBgm('bgm_cathedral_abyss');
      this.emberParticles.setPosition(320, 180);
      this.emberParticles.start();

      // Spawn Abyssal Shadow / Penitent Guardian
      const sh1 = Enemy.createAbyssalShadow('shadow_1', new Vector2(390, 255));
      this.enemies.push(sh1);
      const s1 = this.add.ellipse(390, 255, 24, 7, 0x000000, 0.45).setDepth(254);
      this.enemyShadows.set(sh1.id, s1);
      const sp1 = this.normalizeSprite(this.add.sprite(sh1.position.x, sh1.position.y, 'skeleton_patrol', 0), 64, 64, 0.5, 0.9).setDepth(255);
      this.playAnimSafe(sp1, 'skeleton_patrol');
      this.enemySprites.set(sh1.id, sp1);

      // Boss Astaroth (Entidad Primordial del Abismo)
      this.currentBoss = Boss.createAstaroth();
      this.bossShadow = this.add.ellipse(520, 260, 48, 12, 0x000000, 0.6).setDepth(259);
      this.bossSprite = this.normalizeSprite(this.add.sprite(520, 260, 'morwenna_phase2_idle', 0), 120, 120, 0.5, 0.9).setDepth(260).setTint(0xff66bb);
      this.playAnimSafe(this.bossSprite, 'morwenna_phase2_idle');
      this.createBossMarker('Astaroth', 520, 260);

      this.tweens.add({
        targets: this.bossSprite,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Acto V: La Catedral Invertida»";
      this.triggerShalemBalloon(introText, 4500);

      // Spawn Elowen NPC — offering her Gota de Luz Divina to forge Alba Gris
      this.elowenShadow = this.add.ellipse(150, 265, 22, 6, 0x000000, 0.35).setDepth(264);
      this.elowenSprite = this.normalizeSprite(this.add.sprite(150, 265, 'elowen_idle', 0), 54, 54, 0.5, 0.9).setDepth(265).setAlpha(0.95);
      this.playAnimSafe(this.elowenSprite, 'elowen_speak');
    }
  }
}
