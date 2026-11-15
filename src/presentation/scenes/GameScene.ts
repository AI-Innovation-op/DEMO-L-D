import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { CharacterId, CharacterState } from '../../domain/character/CharacterEnums';
import { Enemy } from '../../domain/enemy/Enemy';
import { Boss } from '../../domain/boss/Boss';
import { ShalemCompanion } from '../../domain/companion/ShalemCompanion';
import { Vector2 } from '../../domain/shared/Vector2';
import { CombatUseCases } from '../../application/usecases/CombatUseCases';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';
import { DialogueRepository } from '../../infrastructure/dialogue/DialogueRepository';
import { HUDScene } from './HUDScene';
import { StoryProgress } from '../../domain/story/StoryProgress';

export class GameScene extends Phaser.Scene {
  // Dual Characters (Thomas & Khaterine)
  public player!: Character;
  public allyChar!: Character;
  private shalem!: ShalemCompanion;
  private audio!: WebAudioSoundAdapter;
  private dialogues!: DialogueRepository;
  public storyProgress: StoryProgress = new StoryProgress();

  // Visual Sprites & Ground Shadows
  private bgImage!: Phaser.GameObjects.Image;
  private playerSprite!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private allySprite!: Phaser.GameObjects.Image;
  private allyShadow!: Phaser.GameObjects.Ellipse;
  private shalemSprite!: Phaser.GameObjects.Image;
  private shalemShadow!: Phaser.GameObjects.Ellipse;

  // Particle Systems
  private emberParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Active Entities
  private enemies: Enemy[] = [];
  private enemySprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private enemyShadows: Map<string, Phaser.GameObjects.Ellipse> = new Map();
  private droppedWeaponSprites: Map<string, Phaser.GameObjects.Container> = new Map();

  // Boss
  private currentBoss?: Boss;
  private bossSprite?: Phaser.GameObjects.Image;
  private bossShadow?: Phaser.GameObjects.Ellipse;
  private bossMarker?: Phaser.GameObjects.Text;
  private bossMarkerTween?: Phaser.Tweens.Tween;

  // NPC: Elowen de Oakhaven
  private elowenSprite?: Phaser.GameObjects.Image;
  private elowenShadow?: Phaser.GameObjects.Ellipse;
  private elowenBadge?: Phaser.GameObjects.Text;
  private hasTalkedToElowen: boolean = false;

  // Proximity Interaction
  private activeInteractionTarget?: string;
  private activeInteractionType?: 'elowen' | 'shalem' | 'ally' | 'weapon';
  private floatingPromptBadge?: Phaser.GameObjects.Text;

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
  private keyC!: Phaser.Input.Keyboard.Key; // Character Dialogue
  private keyN!: Phaser.Input.Keyboard.Key; // Mute Audio
  private key1!: Phaser.Input.Keyboard.Key;
  private key2!: Phaser.Input.Keyboard.Key;
  private key3!: Phaser.Input.Keyboard.Key;

  // Combat Timers
  private attackCooldown: number = 0;
  private enemyAttackTimer: number = 0;
  private bossAttackTimer: number = 0;
  private timeSinceLastHit: number = 0;

  constructor() {
    super('GameScene');
  }

  public init(data: { characterId?: CharacterId; scenarioIndex?: number }): void {
    const charId = data.characterId || 'thomas';
    this.initialScenario = data.scenarioIndex || 1;
    if (charId === 'thomas') {
      this.player = Character.createThomas();
      this.allyChar = Character.createKhaterine();
    } else {
      this.player = Character.createKhaterine();
      this.allyChar = Character.createThomas();
    }
    this.shalem = new ShalemCompanion();
    this.audio = new WebAudioSoundAdapter();
    this.dialogues = new DialogueRepository();
  }

  public create(): void {
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

    // 5. Player & Shadows (2.5D Depth Arena)
    const initX = 110;
    const initY = 260;
    this.player.position = new Vector2(initX, initY);

    this.playerShadow = this.add.ellipse(initX, initY, 26, 8, 0x000000, 0.45).setDepth(initY - 1);
    const playerTex = this.player.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';
    this.playerSprite = this.add.image(initX, initY, playerTex).setOrigin(0.5, 1).setDepth(initY);

    // 6. Ally Companion (Walking alongside in 2.5D)
    const allyInitX = 65;
    const allyInitY = 250;
    this.allyChar.position = new Vector2(allyInitX, allyInitY);
    this.allyShadow = this.add.ellipse(allyInitX, allyInitY, 24, 7, 0x000000, 0.4).setDepth(allyInitY - 1);
    const allyTex = this.allyChar.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';
    this.allySprite = this.add.image(allyInitX, allyInitY, allyTex).setOrigin(0.5, 1).setAlpha(0.92).setDepth(allyInitY);

    // 7. Shalem Sprite (Cat Companion in 2.5D)
    const catInitX = 85;
    const catInitY = 268;
    this.shalemShadow = this.add.ellipse(catInitX, catInitY, 20, 6, 0x000000, 0.45).setDepth(catInitY - 1);
    this.shalemSprite = this.add.image(catInitX, catInitY, 'shalem_cat').setOrigin(0.5, 1).setDepth(catInitY);

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
      this.keyC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
      this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
      this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
      this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
      this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    }

    // 11. Launch HUDScene if not already running
    if (!this.scene.isActive('HUDScene')) {
      this.scene.launch('HUDScene');
    }

    // Load Initial Scenario (Oakhaven, Londinium or Catedral Invertida)
    this.loadScenario(this.initialScenario);
  }

  public update(_time: number, delta: number): void {
    if (this.player.state === CharacterState.DEAD) {
      return;
    }

    this.timeSinceLastHit += delta;
    // Posture (Guardia / Escudo) regenerates smoothly if not hit for 2.2 seconds!
    if (this.timeSinceLastHit >= 2200 && this.player.stats.posture < this.player.stats.maxPosture) {
      this.player.stats.restorePosture(25 * (delta / 1000));
    }

    this.handleInput(delta);
    this.updateShalemAndAlly(delta);
    this.updateEnemies(delta);
    this.updateBoss(delta);
    this.updateDroppedWeapons();
    this.updateProximityInteractions();

    // Sync HUD with active character & dynamic interaction target
    const hud = this.scene.get('HUDScene') as HUDScene;
    if (hud) {
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

    // Switch Scenario keys
    if (Phaser.Input.Keyboard.JustDown(this.key1)) this.loadScenario(1);
    if (Phaser.Input.Keyboard.JustDown(this.key2)) this.loadScenario(2);
    if (Phaser.Input.Keyboard.JustDown(this.key3)) this.loadScenario(3);

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

        // Spawn afterimage ghost
        const ghost = this.add.image(this.playerSprite.x, this.playerSprite.y, this.playerSprite.texture.key)
          .setOrigin(0.5, 1)
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
          }
        });
      }
    }

    // Block [L] (Held)
    if (this.keyL.isDown) {
      this.player.startBlock();
      this.playerSprite.setTint(0x77aaff);
    } else if (this.player.state === CharacterState.BLOCKING) {
      this.player.stopBlock();
      this.playerSprite.clearTint();
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
        this.player.state !== CharacterState.ATTACKING) {

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

      // 2.5D Perspective Scaling (scale smoothly between 0.88 and 1.10)
      const scale = 0.88 + ((nextY - 205) / 110) * 0.22;
      this.playerSprite.setScale(this.player.facingDirection > 0 ? scale : -scale, scale);

      // Depth sorting
      this.playerSprite.setDepth(nextY);
      this.playerShadow.setPosition(nextX, nextY).setDepth(nextY - 1).setScale(scale);
    } else {
      this.player.move(0, 0);
    }
  }

  private swapActiveCharacter(): void {
    this.audio.playSfx('dodge');
    this.cameras.main.flash(200, 160, 80, 240);

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

    // Swap textures
    const playerTex = this.player.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';
    const allyTex = this.allyChar.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';

    this.playerSprite.setTexture(playerTex);
    this.allySprite.setTexture(allyTex);

    this.triggerShalemBalloon(
      `Shalem: «¡Ahora juegas como ${this.player.name}! ${this.player.id === 'khaterine' ? '¡Purifica las sombras con tus rezos!' : '¡Avanza con tu espada y tus puños!' }»`,
      3500
    );
  }

  private executeContextInteraction(): void {
    if (this.activeInteractionType === 'elowen') {
      this.interactWithElowen();
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
    const lines = this.dialogues.getElowenDialogue ? this.dialogues.getElowenDialogue() : [];
    const textToShow = lines[0] ? `${lines[0].speaker}: ${lines[0].text}` : 'Elowen: «¡Thomas, cuídate de la pira!»';

    if (!this.hasTalkedToElowen) {
      this.hasTalkedToElowen = true;
      this.player.heal(35);
      this.storyProgress.completeMilestone('act1_dialogue');
      this.storyProgress.addProgress(15);
      this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, 35, false, '#88ff88');
    }
    this.triggerShalemBalloon(textToShow, 7000);
  }

  private updateProximityInteractions(): void {
    const px = this.playerSprite.x;
    const py = this.playerSprite.y;

    let closestDist = Infinity;
    let targetType: 'elowen' | 'shalem' | 'ally' | 'weapon' | undefined = undefined;
    let targetLabel: string | undefined = undefined;
    let targetX = 0;
    let targetY = 0;

    // 1. Check Elowen (Scenario 1)
    if (this.currentScenario === 1 && this.elowenSprite) {
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
      this.floatingPromptBadge
        .setPosition(targetX, targetY)
        .setText(`[E] ${targetType === 'weapon' ? 'RECOGER' : 'HABLAR'}`)
        .setVisible(true);
    } else if (this.floatingPromptBadge) {
      this.floatingPromptBadge.setVisible(false);
    }
  }

  private executeAttack(isHeavy: boolean): void {
    const isDisarmed = this.player.disarmManager.isPlayerDisarmed();
    const attackTex = isDisarmed
      ? 'thomas_disarmed'
      : (this.player.id === 'thomas' ? 'thomas_attack' : 'khaterine_idle');

    this.playerSprite.setTexture(attackTex);
    this.audio.playCombatHit(isHeavy);

    if (isHeavy) {
      this.cameras.main.shake(180, 0.014);
    }

    const playerX = this.playerSprite.x;
    const playerY = this.playerSprite.y;
    const facing = this.player.facingDirection;
    const attackRange = this.player.disarmManager.getCurrentWeapon().range;

    // Visual Slash Arc Effect
    if (!isDisarmed) {
      const arcKey = isHeavy ? 'particle_slash_heavy' : 'particle_slash_arc';
      const slash = this.add.image(playerX + facing * (isHeavy ? 30 : 25), playerY - 25, arcKey)
        .setScale(facing > 0 ? (isHeavy ? 1.2 : 1) : (isHeavy ? -1.2 : -1), isHeavy ? 1.2 : 1)
        .setAlpha(0.9)
        .setDepth(playerY + 2);

      this.tweens.add({
        targets: slash,
        alpha: 0,
        scaleX: facing > 0 ? (isHeavy ? 1.6 : 1.35) : (isHeavy ? -1.6 : -1.35),
        scaleY: isHeavy ? 1.6 : 1.35,
        duration: isHeavy ? 240 : 180,
        onComplete: () => slash.destroy()
      });
    }

    const reachX = attackRange + (isHeavy ? 65 : 45);
    const reachY = isHeavy ? 35 : 26;

    // Check hit against active enemies in 2.5D
    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;
      const dx = (enemy.position.x - playerX) * facing;
      const dy = Math.abs(enemy.position.y - playerY);

      if (dx > 0 && dx <= reachX && dy <= reachY) {
        const res = CombatUseCases.executeAttackOnEnemy(this.player, enemy);

        this.cameras.main.shake(isHeavy ? 160 : 100, isHeavy ? 0.012 : 0.006);
        const finalDamage = isHeavy ? Math.round(res.damageDealt * 1.6) : res.damageDealt;
        this.spawnDamageNumber(enemy.position.x, enemy.position.y - 35, finalDamage, isHeavy);

        const sprite = this.enemySprites.get(enemy.id);
        if (sprite) {
          sprite.setTint(0xff3333);
          this.time.delayedCall(120, () => sprite.clearTint());

          if (res.targetKilled) {
            this.tweens.add({
              targets: sprite,
              alpha: 0,
              y: sprite.y - 15,
              duration: 250,
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
          }
        }
        break;
      }
    }

    // Check hit against Boss in 2.5D
    if (this.currentBoss && this.bossSprite && this.currentBoss.health > 0) {
      const bdx = (this.currentBoss.position.x - playerX) * facing;
      const bdy = Math.abs(this.currentBoss.position.y - playerY);
      const effectiveReachX = reachX + 25;
      const effectiveReachY = reachY + 16;

      if (bdx > 0 && bdx <= effectiveReachX && bdy <= effectiveReachY) {
        const res = CombatUseCases.executeAttackOnBoss(this.player, this.currentBoss);

        this.cameras.main.shake(isHeavy ? 200 : 140, isHeavy ? 0.016 : 0.01);
        const finalDamage = isHeavy ? Math.round(res.damageDealt * 1.6) : res.damageDealt;
        this.spawnDamageNumber(this.currentBoss.position.x, this.currentBoss.position.y - 50, finalDamage, true);

        this.bossSprite.setTint(0xff5555);
        this.time.delayedCall(120, () => this.bossSprite?.clearTint());

        if (res.targetKilled) {
          this.handleBossDefeated();
        }
      } else if (bdx > effectiveReachX && this.enemies.filter(e => e.isAlive()).length === 0) {
        this.triggerShalemBalloon("Shalem: «¡Estás demasiado lejos! ¡Acércate más a la Madre Morwenna para alcanzarla con tu arma!»", 2800);
      }
    }

    // Reset texture after attack frame
    this.time.delayedCall(isHeavy ? 260 : 170, () => {
      const idleTex = isDisarmed
        ? 'thomas_disarmed'
        : (this.player.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle');
      this.playerSprite.setTexture(idleTex);
      this.player.finishAttack();
    });
  }

  private spawnDamageNumber(x: number, y: number, amount: number, isCritical: boolean, customColor?: string): void {
    const color = customColor || (isCritical ? '#ffd700' : '#e699ff');
    const text = this.add.text(x, y, `${customColor ? '+' : '-'}${amount}`, {
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
      this.tweens.add({
        targets: this.bossSprite,
        alpha: 0,
        y: this.bossSprite.y + 25,
        duration: 900,
        onComplete: () => {
          this.bossSprite?.destroy();
          this.bossSprite = undefined;
          this.bossShadow?.destroy();
          this.bossShadow = undefined;
        }
      });
    }

    // Advance story progress to 100%
    if (this.currentScenario === 1) {
      this.storyProgress.completeMilestone('act1_boss');
      this.storyProgress.scenarioProgress = 100;

      this.triggerShalemBalloon(
        "Shalem: «¡La Madre Morwenna ha caído y su pira se extingue! ¡Oakhaven está libre! ¡Pulsa [2] para viajar a Londinium o habla con Khaterine con [C]!»",
        7000
      );

      // Grand Victory Banner in Center
      const bannerBg = this.add.rectangle(320, 160, 420, 75, 0x11081f, 0.94)
        .setStrokeStyle(2, 0xffd700)
        .setDepth(360);

      const bannerTitle = this.add.text(320, 145, '★ ¡ACTO I COMPLETADO AL 100%! ★', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361);

      const bannerPrompt = this.add.text(320, 172, 'PULSA [2] O HAZ CLIC AQUÍ PARA VIAJAR A LONDINIUM ▶', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        backgroundColor: '#3d1f5e',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setDepth(361).setInteractive({ useHandCursor: true });

      bannerPrompt.on('pointerdown', () => {
        bannerBg.destroy();
        bannerTitle.destroy();
        bannerPrompt.destroy();
        this.transitionToActWithLoading(2);
      });
    } else if (this.currentScenario === 2) {
      this.storyProgress.completeMilestone('act2_boss');
      this.storyProgress.scenarioProgress = 100;

      this.triggerShalemBalloon(
        "Shalem: «¡El Rex Malphas y su decreto han sido quebrantados! ¡Pulsa [3] para descender a la Catedral Invertida!»",
        7000
      );

      // Victory Banner for Act II
      const bannerBg = this.add.rectangle(320, 160, 420, 75, 0x11081f, 0.94)
        .setStrokeStyle(2, 0xffd700)
        .setDepth(360);

      const bannerTitle = this.add.text(320, 145, '★ ¡ACTO II COMPLETADO AL 100%! ★', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361);

      const bannerPrompt = this.add.text(320, 172, 'PULSA [3] O HAZ CLIC AQUÍ PARA LA CATEDRAL INVERTIDA ▶', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        backgroundColor: '#3d1f5e',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setDepth(361).setInteractive({ useHandCursor: true });

      bannerPrompt.on('pointerdown', () => {
        bannerBg.destroy();
        bannerTitle.destroy();
        bannerPrompt.destroy();
        this.transitionToActWithLoading(3);
      });
    } else {
      this.storyProgress.completeMilestone('act3_astaroth');
      this.storyProgress.scenarioProgress = 100;

      this.triggerShalemBalloon(
        "Shalem: «¡Astaroth y la teocracia han caído! La luz y la oscuridad han alcanzado el equilibrio. ¡HAS COMPLETADO LA DEMO!»",
        10000
      );

      // Grand Game Cleared Banner
      this.add.rectangle(320, 160, 440, 85, 0x11081f, 0.96)
        .setStrokeStyle(3, 0xffd700)
        .setDepth(360);

      this.add.text(320, 140, '👑 ¡THE LIGHT IN THE DARKNESS: VICTORIA TOTAL! 👑', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(361);

      this.add.text(320, 165, 'Albion ha sido liberada del dogma. ¡Gracias por jugar la Demo!', {
        fontFamily: 'Cinzel, serif',
        fontSize: '9.5px',
        color: '#e699ff'
      }).setOrigin(0.5).setDepth(361);

      const replayBtn = this.add.text(320, 188, 'REINICIAR VIAJE DESDE EL ACTO I [1]', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        backgroundColor: '#3d1f5e',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setDepth(361).setInteractive({ useHandCursor: true });

      replayBtn.on('pointerdown', () => {
        this.transitionToActWithLoading(1);
      });
    }
  }

  private transitionToActWithLoading(targetAct: number): void {
    if (this.scene.isActive('HUDScene')) {
      this.scene.stop('HUDScene');
    }

    const configs: Record<number, { image: string; title: string; tip: string }> = {
      1: {
        image: 'loading_pyre_remains',
        title: 'ACTO I — OAKHAVEN: LAS HOGUERAS DE LA INQUISICIÓN',
        tip: '«Códice de Albion: En las afueras de Oakhaven, la niebla oculta inquisidores y secretos olvidados.»'
      },
      2: {
        image: 'loading_londinium_gate',
        title: 'ACTO II — LONDINIUM: LA CIUDADELA DORADA',
        tip: '«Códice de Albion: El Rex Malphas domina Londinium con mano de hierro y decretos solares tiránicos.»'
      },
      3: {
        image: 'loading_shalem_wall',
        title: 'ACTO III — LA CATEDRAL INVERTIDA: EL ABISMO',
        tip: '«Shalem: La gravedad se quiebra en este lugar sacrílego. ¡Prepárate para enfrentar al demonio Astaroth!»'
      }
    };

    const cfg = configs[targetAct] || configs[1];

    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(320, () => {
      this.scene.start('LoadingScene', {
        targetScene: 'GameScene',
        targetData: {
          characterId: this.player.id,
          scenarioIndex: targetAct
        },
        imageKey: cfg.image,
        chapterTitle: cfg.title,
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

    this.playerSprite.setTexture('thomas_disarmed');

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
      const idleTex = this.player.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';
      this.playerSprite.setTexture(idleTex);
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
    this.allySprite.x = Phaser.Math.Linear(this.allySprite.x, allyTargetX, 0.08);
    this.allySprite.y = Phaser.Math.Linear(this.allySprite.y, allyTargetY, 0.08);
    this.allySprite.setFlipX(facing < 0);
    this.allySprite.setDepth(this.allySprite.y);
    this.allyShadow.setPosition(this.allySprite.x, this.allySprite.y).setDepth(this.allySprite.y - 1);

    // Shalem Cat follows smoothly in 2.5D
    const catTargetX = px - 22 * facing;
    const catTargetY = py + 6;
    this.shalemSprite.x = Phaser.Math.Linear(this.shalemSprite.x, catTargetX, 0.1);
    this.shalemSprite.y = Phaser.Math.Linear(this.shalemSprite.y, catTargetY, 0.1);
    this.shalemSprite.setFlipX(facing < 0);
    this.shalemSprite.setDepth(this.shalemSprite.y);
    this.shalemShadow.setPosition(this.shalemSprite.x, this.shalemSprite.y).setDepth(this.shalemSprite.y - 1);

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
    this.enemyAttackTimer += delta;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;

      const sprite = this.enemySprites.get(enemy.id);
      const shadow = this.enemyShadows.get(enemy.id);
      if (!sprite) continue;

      // Move toward player across both X and Y in 2.5D
      const dx = this.playerSprite.x - enemy.position.x;
      const dy = this.playerSprite.y - enemy.position.y;
      const dist = Math.hypot(dx, dy);
      const dirX = dx > 0 ? 1 : -1;
      sprite.setFlipX(dirX > 0);

      if (dist > 38 && enemy.state !== 'STUNNED') {
        const speedX = enemy.speed * (delta / 1000);
        const speedY = (enemy.speed * 0.65) * (delta / 1000);

        const newX = enemy.position.x + (dx / dist) * speedX;
        const newY = enemy.position.y + (dy / dist) * speedY;

        enemy.position = new Vector2(newX, newY);
        sprite.setPosition(newX, newY).setDepth(newY);
        if (shadow) shadow.setPosition(newX, newY).setDepth(newY - 1);
      } else if (dist <= 38 && this.enemyAttackTimer >= 1400) {
        // Enemy attacks player: guardia/shield absorbs first!
        if (enemy.id.startsWith('ash')) {
          sprite.setTexture('ash_prowler_attack');
          this.time.delayedCall(320, () => {
            if (enemy.isAlive()) sprite.setTexture('ash_prowler');
          });
        }

        const hitRes = CombatUseCases.executeEnemyAttack(enemy, this.player, false);
        this.timeSinceLastHit = 0;

        if (hitRes.damageToHealth > 0) {
          this.audio.playCombatHit(false);
          this.playerSprite.setTint(0xff5555);
          this.time.delayedCall(120, () => this.playerSprite.clearTint());
          this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, hitRes.damageToHealth, false, '#ff4444');
        } else if (hitRes.absorbedByGuard > 0) {
          this.audio.playSfx('block');
          this.playerSprite.setTint(0x55aaff);
          this.time.delayedCall(120, () => this.playerSprite.clearTint());
          this.spawnDamageNumber(this.playerSprite.x, this.playerSprite.y - 45, hitRes.absorbedByGuard, false, '#55aaff');
        }
        this.enemyAttackTimer = 0;
      }
    }
  }

  private updateBoss(delta: number): void {
    if (!this.currentBoss || !this.bossSprite || this.currentBoss.health <= 0) return;

    if (this.bossMarker) {
      this.bossMarker.x = this.bossSprite.x;
    }

    const dx = this.playerSprite.x - this.bossSprite.x;
    const dy = this.playerSprite.y - this.bossSprite.y;
    const dist = Math.hypot(dx, dy);
    const aliveEnemies = this.enemies.filter(e => e.isAlive()).length;

    // When minions are defeated, boss actively advances toward player in 2.5D!
    if (aliveEnemies === 0 && dist > 65) {
      const speedX = 40 * (delta / 1000);
      const speedY = 26 * (delta / 1000);

      this.bossSprite.x += (dx / dist) * speedX;
      this.bossSprite.y += (dy / dist) * speedY;
      this.currentBoss.position = new Vector2(this.bossSprite.x, this.bossSprite.y);

      this.bossSprite.setFlipX(dx > 0);
      this.bossSprite.setDepth(this.bossSprite.y);
      if (this.bossShadow) {
        this.bossShadow.setPosition(this.bossSprite.x, this.bossSprite.y).setDepth(this.bossSprite.y - 1);
      }
    }

    this.bossAttackTimer += delta;

    if (this.bossAttackTimer >= 2200) {
      this.bossAttackTimer = 0;
      if (dist < 80) {
        const hitRes = CombatUseCases.executeEnemyAttack(
          { attackPower: this.currentBoss.attackPower, isAlive: () => true } as unknown as Enemy,
          this.player,
          true
        );
        this.timeSinceLastHit = 0;

        if (hitRes.damageToHealth > 0) {
          this.audio.playCombatHit(true);
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
      }
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
    this.currentScenario = scenarioIndex;
    this.storyProgress.setAct(scenarioIndex);

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

    const introLines = this.dialogues.getScenarioIntro(this.currentScenario);

    if (scenarioIndex === 1) {
      // Oakhaven
      this.bgImage.setTexture('bg_oakhaven');
      this.audio.playBgm('bgm_oakhaven_night');
      this.emberParticles.setPosition(280, 255);
      this.emberParticles.start();

      // Spawn Elowen NPC near the garden fence (as in reference video!)
      this.elowenShadow = this.add.ellipse(270, 225, 24, 7, 0x000000, 0.45).setDepth(224);
      this.elowenSprite = this.add.image(270, 225, 'elowen_npc').setOrigin(0.5, 1).setDepth(225);

      this.tweens.add({
        targets: this.elowenSprite,
        scaleY: 1.025,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Spawn Ash Prowlers & Fanatic Monk in 2.5D space
      const e1 = Enemy.createAshProwler('ash_1', new Vector2(380, 245));
      const e2 = Enemy.createFanaticMonk('monk_1', new Vector2(460, 280));
      this.enemies.push(e1, e2);

      const s1 = this.add.ellipse(380, 245, 26, 8, 0x000000, 0.45).setDepth(244);
      const s2 = this.add.ellipse(460, 280, 24, 7, 0x000000, 0.45).setDepth(279);
      this.enemyShadows.set(e1.id, s1);
      this.enemyShadows.set(e2.id, s2);

      this.enemySprites.set(e1.id, this.add.image(e1.position.x, e1.position.y, 'ash_prowler').setOrigin(0.5, 1).setDepth(245));
      this.enemySprites.set(e2.id, this.add.image(e2.position.x, e2.position.y, 'fanatic_monk').setOrigin(0.5, 1).setDepth(280));

      // Boss Madre Morwenna
      this.currentBoss = Boss.createMadreMorwenna();
      this.bossShadow = this.add.ellipse(530, 260, 32, 9, 0x000000, 0.5).setDepth(259);
      this.bossSprite = this.add.image(530, 260, 'boss_morwenna').setOrigin(0.5, 1).setDepth(260);
      this.createBossMarker('Madre Morwenna', 530, 260);

      const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Escenario 1: Oakhaven»";
      this.triggerShalemBalloon(introText, 4500);
    } else if (scenarioIndex === 2) {
      // Londinium
      this.bgImage.setTexture('bg_londinium');
      this.audio.playBgm('bgm_londinium_city');
      this.emberParticles.stop();

      // Spawn Golden Guards in 2.5D
      const g1 = Enemy.createGoldenGuard('guard_1', new Vector2(400, 255));
      this.enemies.push(g1);
      const s1 = this.add.ellipse(400, 255, 24, 7, 0x000000, 0.45).setDepth(254);
      this.enemyShadows.set(g1.id, s1);
      this.enemySprites.set(g1.id, this.add.image(g1.position.x, g1.position.y, 'golden_guard').setOrigin(0.5, 1).setDepth(255));

      // Boss Rex Malphas
      this.currentBoss = Boss.createRexMalphas();
      this.bossShadow = this.add.ellipse(520, 260, 32, 9, 0x000000, 0.5).setDepth(259);
      this.bossSprite = this.add.image(520, 260, 'boss_malphas').setOrigin(0.5, 1).setDepth(260);
      this.createBossMarker('Rex Malphas', 520, 260);

      const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Escenario 2: Londinium»";
      this.triggerShalemBalloon(introText, 4500);
    } else {
      // Catedral Invertida
      this.bgImage.setTexture('bg_cathedral');
      this.audio.playBgm('bgm_cathedral_abyss');
      this.emberParticles.setPosition(320, 180);
      this.emberParticles.start();

      // Boss Astaroth
      this.currentBoss = Boss.createAstaroth();
      this.bossShadow = this.add.ellipse(520, 260, 40, 10, 0x000000, 0.6).setDepth(259);
      this.bossSprite = this.add.image(520, 260, 'boss_malphas').setOrigin(0.5, 1).setTint(0x220033).setScale(1.4).setDepth(260);
      this.createBossMarker('Astaroth', 520, 260);

      const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Escenario 3: La Catedral Invertida»";
      this.triggerShalemBalloon(introText, 4500);
    }
  }
}
