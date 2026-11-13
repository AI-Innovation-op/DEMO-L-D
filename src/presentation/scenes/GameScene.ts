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
  private player!: Character;
  private shalem!: ShalemCompanion;
  private audio!: WebAudioSoundAdapter;
  private dialogues!: DialogueRepository;
  public storyProgress: StoryProgress = new StoryProgress();

  // Visual Sprites & Layers
  private bgImage!: Phaser.GameObjects.Image;
  private playerSprite!: Phaser.GameObjects.Image;
  private shalemSprite!: Phaser.GameObjects.Image;
  private allySprite?: Phaser.GameObjects.Image;

  // Particle Systems
  private emberParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Active Entities
  private enemies: Enemy[] = [];
  private enemySprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private droppedWeaponSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private currentBoss?: Boss;
  private bossSprite?: Phaser.GameObjects.Image;
  private bossMarker?: Phaser.GameObjects.Text;
  private bossMarkerTween?: Phaser.Tweens.Tween;

  // Environment & Scenarios
  private currentScenario: number = 1;

  // Floating text / Shalem dialogue balloon
  private shalemBalloonText!: Phaser.GameObjects.Text;
  private shalemBalloonBg!: Phaser.GameObjects.Rectangle;
  private shalemBalloonTimer: number = 0;

  // Keys
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key; // Attack
  private keyK!: Phaser.Input.Keyboard.Key; // Block
  private keyL!: Phaser.Input.Keyboard.Key; // Dodge
  private keyT!: Phaser.Input.Keyboard.Key; // Throw Weapon (Option B)
  private keyE!: Phaser.Input.Keyboard.Key; // Pick up Weapon (Option A & B)
  private keyM!: Phaser.Input.Keyboard.Key; // Shalem Minigame
  private keyP!: Phaser.Input.Keyboard.Key; // Inventory & Lore
  private keyC!: Phaser.Input.Keyboard.Key; // Character Dialogue
  private keyN!: Phaser.Input.Keyboard.Key; // Mute Audio
  private key1!: Phaser.Input.Keyboard.Key;
  private key2!: Phaser.Input.Keyboard.Key;
  private key3!: Phaser.Input.Keyboard.Key;

  // Combat Timers
  private attackCooldown: number = 0;
  private enemyAttackTimer: number = 0;
  private bossAttackTimer: number = 0;

  constructor() {
    super('GameScene');
  }

  public init(data: { characterId?: CharacterId }): void {
    const charId = data.characterId || 'thomas';
    this.player = charId === 'thomas' ? Character.createThomas() : Character.createKhaterine();
    this.shalem = new ShalemCompanion();
    this.audio = new WebAudioSoundAdapter();
    this.dialogues = new DialogueRepository();
  }

  public create(): void {
    // 1. Background image (640x360)
    this.bgImage = this.add.image(320, 180, 'bg_oakhaven').setDisplaySize(640, 360);

    // 2. Atmospheric Fog Particles
    this.add.particles(320, 270, 'particle_fog', {
      speedX: { min: -15, max: 15 },
      speedY: { min: -5, max: 5 },
      scale: { start: 1, end: 1.8 },
      alpha: { start: 0.35, end: 0 },
      lifespan: 4000,
      frequency: 600
    });

    // 3. Floating Ember Particles from Bonfires
    this.emberParticles = this.add.particles(280, 255, 'particle_ember', {
      speedX: { min: -25, max: 35 },
      speedY: { min: -40, max: -90 },
      scale: { start: 1.2, end: 0.2 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 1600,
      frequency: 180
    });

    // 4. Setup audio BGM
    this.audio.playBgm('bgm_oakhaven_night');

    // 4.1 Atmospheric Vignette
    this.add.image(320, 180, 'fx_vignette').setDisplaySize(640, 360).setDepth(15).setAlpha(0.6);

    // 4.2 Ground Shadows
    this.add.image(this.player.position.x, 260, 'shadow_ground').setDepth(0).setAlpha(0.65);

    // 5. Player Sprite
    const playerTex = this.player.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';
    this.playerSprite = this.add.image(this.player.position.x, this.player.position.y, playerTex).setOrigin(0.5, 1);

    // 6. Ally NPC Sprite (If Thomas, Khaterine is ally; if Khaterine, Thomas is ally)
    const allyTex = this.player.id === 'thomas' ? 'khaterine_idle' : 'thomas_idle';
    this.allySprite = this.add.image(this.player.position.x - 55, this.player.position.y, allyTex).setOrigin(0.5, 1).setAlpha(0.85);

    // 7. Shalem Sprite (Cat)
    this.shalemSprite = this.add.image(this.player.position.x - 25, this.player.position.y - 10, 'shalem_cat').setOrigin(0.5, 1);

    // 8. Shalem Dialogue Balloon with Portrait
    this.shalemBalloonBg = this.add.rectangle(320, 332, 540, 26, 0x140f21, 0.92)
      .setStrokeStyle(1, 0xd4af37)
      .setDepth(25);

    this.shalemBalloonText = this.add.text(320, 332, 'Shalem: «¡Usa [A/D] para moverte, [J] atacar, [T] lanzar arma y [P] inventario!»', {
      fontFamily: 'sans-serif',
      fontSize: '9.5px',
      color: '#ffd700'
    }).setOrigin(0.5).setDepth(26);

    // 9. Setup Inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
      this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
      this.keyL = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
      this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
      this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keyC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
      this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
      this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
      this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
      this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    }

    // Load Initial Scenario 1 (Oakhaven)
    this.loadScenario(1);
  }

  public update(_time: number, delta: number): void {
    if (this.player.state === CharacterState.DEAD) {
      return;
    }

    this.handleInput(delta);
    this.updateShalemCompanion(delta);
    this.updateEnemies(delta);
    this.updateBoss(delta);
    this.updateDroppedWeapons();

    // Sync HUD
    const hud = this.scene.get('HUDScene') as HUDScene;
    if (hud) {
      hud.updateHUD(this.player, this.currentBoss, this.storyProgress);
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

    // Open Inventory & Menu with [P]
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

    // Dodge [L] with ghost afterimage trail
    if (Phaser.Input.Keyboard.JustDown(this.keyL)) {
      if (this.player.startDodge()) {
        this.audio.playSfx('dodge');
        const dashDir = this.player.facingDirection;

        // Spawn afterimage ghost
        const ghost = this.add.image(this.playerSprite.x, this.playerSprite.y, this.playerSprite.texture.key)
          .setOrigin(0.5, 1)
          .setAlpha(0.6)
          .setTint(0x9933ff);
        this.tweens.add({
          targets: ghost,
          alpha: 0,
          scaleX: 1.2,
          duration: 250,
          onComplete: () => ghost.destroy()
        });

        this.tweens.add({
          targets: this.playerSprite,
          x: this.playerSprite.x + dashDir * 55,
          alpha: 0.4,
          duration: 180,
          yoyo: true,
          onComplete: () => {
            this.player.position = new Vector2(this.playerSprite.x, this.player.position.y);
            this.player.finishDodge();
          }
        });
      }
    }

    // Block [K]
    if (this.keyK.isDown) {
      this.player.startBlock();
      this.playerSprite.setTint(0x77aaff);
    } else if (this.player.state === CharacterState.BLOCKING) {
      this.player.stopBlock();
      this.playerSprite.clearTint();
    }

    // Attack [J]
    if (Phaser.Input.Keyboard.JustDown(this.keyJ) && this.attackCooldown <= 0) {
      this.executeAttack();
      this.attackCooldown = 260;
    }

    // Voluntary Weapon Throw (Option B) [T]
    if (Phaser.Input.Keyboard.JustDown(this.keyT)) {
      this.executeWeaponThrow();
    }

    // Pick Up Weapon (Option A & B) [E]
    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      this.executeWeaponPickup();
    }

    // Movement (A / D)
    let moveX = 0;
    if (this.keyA.isDown || this.cursors.left.isDown) {
      moveX = -1;
    } else if (this.keyD.isDown || this.cursors.right.isDown) {
      moveX = 1;
    }

    if (moveX !== 0 && this.player.state !== CharacterState.BLOCKING && this.player.state !== CharacterState.ATTACKING) {
      const speed = this.player.stats.speed * (delta / 1000);
      const newX = Phaser.Math.Clamp(this.playerSprite.x + moveX * speed, 30, 610);
      this.playerSprite.x = newX;
      this.player.position = new Vector2(newX, this.player.position.y);
      this.player.move(moveX);
      this.playerSprite.setFlipX(moveX < 0);
    } else {
      this.player.move(0);
    }

    // Jump (W / SPACE)
    if ((Phaser.Input.Keyboard.JustDown(this.keyW) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) && this.playerSprite.y >= 260) {
      if (this.player.jump()) {
        this.audio.playSfx('jump');
        this.tweens.add({
          targets: this.playerSprite,
          y: 200,
          duration: 220,
          yoyo: true,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.player.land();
            this.playerSprite.y = 260;
          }
        });
      }
    }
  }

  private executeAttack(): void {
    const isDisarmed = this.player.disarmManager.isPlayerDisarmed();
    const attackTex = isDisarmed
      ? 'thomas_disarmed'
      : (this.player.id === 'thomas' ? 'thomas_attack' : 'khaterine_idle');

    this.playerSprite.setTexture(attackTex);
    this.audio.playCombatHit(false);

    const playerX = this.playerSprite.x;
    const playerY = this.playerSprite.y;
    const facing = this.player.facingDirection;
    const attackRange = this.player.disarmManager.getCurrentWeapon().range;

    // Visual Slash Arc Effect
    if (!isDisarmed) {
      const slash = this.add.image(playerX + facing * 25, playerY - 25, 'particle_slash_arc')
        .setScale(facing > 0 ? 1 : -1, 1)
        .setAlpha(0.85);

      this.tweens.add({
        targets: slash,
        alpha: 0,
        scaleX: facing > 0 ? 1.4 : -1.4,
        scaleY: 1.4,
        duration: 180,
        onComplete: () => slash.destroy()
      });
    }

    // Check hit against active enemies
    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;
      const dist = Math.abs(enemy.position.x - playerX);
      const isAhead = (enemy.position.x - playerX) * facing > 0;

      if (dist <= attackRange + 25 && isAhead) {
        const res = CombatUseCases.executeAttackOnEnemy(this.player, enemy);

        // Hit-stop micro freeze
        this.cameras.main.shake(120, 0.008);
        this.spawnDamageNumber(enemy.position.x, enemy.position.y - 35, res.damageDealt, false);

        // Enemy flinch & flash
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
              onComplete: () => sprite.destroy()
            });

            // Check if all regular minions are defeated
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

    // Check hit against Boss
    if (this.currentBoss && this.bossSprite && this.currentBoss.health > 0) {
      const bossDist = Math.abs(this.currentBoss.position.x - playerX);
      const isAhead = (this.currentBoss.position.x - playerX) * facing > 0;
      const effectiveReach = attackRange + 65;

      if (bossDist <= effectiveReach && isAhead) {
        const res = CombatUseCases.executeAttackOnBoss(this.player, this.currentBoss);

        this.cameras.main.shake(180, 0.012);
        this.spawnDamageNumber(this.currentBoss.position.x, this.currentBoss.position.y - 50, res.damageDealt, true);

        this.bossSprite.setTint(0xff5555);
        this.time.delayedCall(120, () => this.bossSprite?.clearTint());

        if (res.targetKilled) {
          this.handleBossDefeated();
        }
      } else if (isAhead && bossDist > effectiveReach && this.enemies.filter(e => e.isAlive()).length === 0) {
        // Player is swinging in the air far from the boss — Shalem guides them!
        this.triggerShalemBalloon("Shalem: «¡Estás demasiado lejos! ¡Acércate más a la Madre Morwenna en la derecha para alcanzarla con tu arma!»", 2800);
      }
    }

    // Reset texture after attack frame
    this.time.delayedCall(180, () => {
      const idleTex = isDisarmed
        ? 'thomas_disarmed'
        : (this.player.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle');
      this.playerSprite.setTexture(idleTex);
      this.player.finishAttack();
    });
  }

  private spawnDamageNumber(x: number, y: number, amount: number, isCritical: boolean): void {
    const color = isCritical ? '#ffd700' : '#e699ff';
    const text = this.add.text(x, y, `-${amount}`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: isCritical ? '16px' : '12px',
      color: color,
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

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
        .setDepth(60);

      const bannerTitle = this.add.text(320, 145, '★ ¡ACTO I COMPLETADO AL 100%! ★', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(61);

      const bannerPrompt = this.add.text(320, 172, 'PULSA [2] O HAZ CLIC AQUÍ PARA VIAJAR A LONDINIUM ▶', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        backgroundColor: '#3d1f5e',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setDepth(61).setInteractive({ useHandCursor: true });

      bannerPrompt.on('pointerdown', () => {
        bannerBg.destroy();
        bannerTitle.destroy();
        bannerPrompt.destroy();
        this.loadScenario(2);
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
        .setDepth(60);

      const bannerTitle = this.add.text(320, 145, '★ ¡ACTO II COMPLETADO AL 100%! ★', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(61);

      const bannerPrompt = this.add.text(320, 172, 'PULSA [3] O HAZ CLIC AQUÍ PARA LA CATEDRAL INVERTIDA ▶', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        backgroundColor: '#3d1f5e',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setDepth(61).setInteractive({ useHandCursor: true });

      bannerPrompt.on('pointerdown', () => {
        bannerBg.destroy();
        bannerTitle.destroy();
        bannerPrompt.destroy();
        this.loadScenario(3);
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
        .setDepth(60);

      this.add.text(320, 140, '👑 ¡THE LIGHT IN THE DARKNESS: VICTORIA TOTAL! 👑', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(61);

      this.add.text(320, 165, 'Albion ha sido liberada del dogma. ¡Gracias por jugar la Demo!', {
        fontFamily: 'Cinzel, serif',
        fontSize: '9.5px',
        color: '#e699ff'
      }).setOrigin(0.5).setDepth(61);

      const replayBtn = this.add.text(320, 188, 'REINICIAR VIAJE DESDE EL ACTO I [1]', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        backgroundColor: '#3d1f5e',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setDepth(61).setInteractive({ useHandCursor: true });

      replayBtn.on('pointerdown', () => {
        this.loadScenario(1);
      });
    }
  }

  private executeWeaponThrow(): void {
    const success = CombatUseCases.throwEquippedWeapon(this.player);
    if (!success) {
      this.triggerShalemBalloon("Shalem suspira: «¡No puedes lanzar tus propios puños, genio!»");
      return;
    }

    this.audio.playWeaponThrowSound();
    this.audio.playDisarmSound();

    // Switch Thomas sprite to disarmed brawler stance
    this.playerSprite.setTexture('thomas_disarmed');

    // Thrown sword projectile with trail
    const thrownX = this.playerSprite.x;
    const dir = this.player.facingDirection;
    const proj = this.add.image(thrownX, 240, 'icon_thrown_sword').setScale(1.3);
    proj.setFlipX(dir < 0);

    this.tweens.add({
      targets: proj,
      x: thrownX + dir * 190,
      rotation: dir * Math.PI * 3,
      duration: 280,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        proj.destroy();

        // Stun enemies in impact area
        for (const enemy of this.enemies) {
          if (Math.abs(enemy.position.x - (thrownX + dir * 190)) < 50) {
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
      // Reset back to idle with equipped weapon
      const idleTex = this.player.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';
      this.playerSprite.setTexture(idleTex);
      this.triggerShalemBalloon("Shalem asiente: «¡Espada recuperada! Ahora demuestra lo que puedes hacer.»");
    } else {
      this.triggerShalemBalloon("Shalem mira alrededor: «No hay armas en el suelo cerca de ti. Acércate más a una.»");
    }
  }

  private updateShalemCompanion(delta: number): void {
    // Smoothly follow player
    const targetX = this.playerSprite.x - 30 * this.player.facingDirection;
    const targetY = this.playerSprite.y - 4;
    this.shalemSprite.x = Phaser.Math.Linear(this.shalemSprite.x, targetX, 0.08);
    this.shalemSprite.y = Phaser.Math.Linear(this.shalemSprite.y, targetY, 0.1);
    this.shalemSprite.setFlipX(this.player.facingDirection < 0);

    // Follow ally
    if (this.allySprite) {
      const allyTargetX = this.playerSprite.x - 60 * this.player.facingDirection;
      this.allySprite.x = Phaser.Math.Linear(this.allySprite.x, allyTargetX, 0.05);
      this.allySprite.setFlipX(this.player.facingDirection < 0);
    }

    // Balloon timer
    if (this.shalemBalloonTimer > 0) {
      this.shalemBalloonTimer -= delta;
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
      if (!sprite) continue;

      // Move toward player
      const dx = this.playerSprite.x - enemy.position.x;
      const dist = Math.abs(dx);
      const dir = dx > 0 ? 1 : -1;
      sprite.setFlipX(dir > 0);

      if (dist > 35 && enemy.state !== 'STUNNED') {
        const speed = enemy.speed * (delta / 1000);
        enemy.position = new Vector2(enemy.position.x + dir * speed, enemy.position.y);
        sprite.x = enemy.position.x;
      } else if (dist <= 35 && this.enemyAttackTimer >= 1400) {
        // Enemy attacks player!
        CombatUseCases.executeEnemyAttack(enemy, this.player, false);
        this.audio.playCombatHit(false);

        // Flash player & damage text
        this.playerSprite.setTint(0xff5555);
        this.time.delayedCall(120, () => this.playerSprite.clearTint());

        this.enemyAttackTimer = 0;
      }
    }
  }

  private updateBoss(delta: number): void {
    if (!this.currentBoss || !this.bossSprite || this.currentBoss.health <= 0) return;

    // Boss Marker follows the boss position
    if (this.bossMarker) {
      this.bossMarker.x = this.bossSprite.x;
    }

    const dist = Math.abs(this.bossSprite.x - this.playerSprite.x);
    const aliveEnemies = this.enemies.filter(e => e.isAlive()).length;

    // When minions are defeated, the boss actively advances toward the player!
    if (aliveEnemies === 0 && dist > 70) {
      const dir = this.playerSprite.x > this.bossSprite.x ? 1 : -1;
      const speed = 40 * (delta / 1000);
      this.bossSprite.x += dir * speed;
      this.currentBoss.position = new Vector2(this.bossSprite.x, this.bossSprite.y);
      this.bossSprite.setFlipX(dir > 0);
    }

    this.bossAttackTimer += delta;

    // Boss telegraphed attacks
    if (this.bossAttackTimer >= 2200) {
      this.bossAttackTimer = 0;
      if (dist < 95) {
        // Heavy hit from boss!
        this.audio.playCombatHit(true);
        CombatUseCases.executeEnemyAttack(
          { attackPower: this.currentBoss.attackPower, isAlive: () => true } as unknown as Enemy,
          this.player,
          true // Heavy attack: can trigger tactical crisis disarm!
        );

        this.playerSprite.setTint(0xff4444);
        this.time.delayedCall(140, () => this.playerSprite.clearTint());
        this.cameras.main.shake(250, 0.015);
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
    }).setOrigin(0.5).setDepth(35);

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
        const c = this.add.container(item.position.x, 255);
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

    // Clear existing enemies & boss
    this.enemies.forEach(e => this.enemySprites.get(e.id)?.destroy());
    this.enemies = [];
    this.enemySprites.clear();
    this.bossSprite?.destroy();
    this.bossSprite = undefined;

    if (this.bossMarker) {
      this.bossMarker.destroy();
      this.bossMarker = undefined;
    }
    if (this.bossMarkerTween) {
      this.bossMarkerTween.stop();
      this.bossMarkerTween = undefined;
    }

    const introLines = this.dialogues.getScenarioIntro(this.currentScenario);

    if (scenarioIndex === 1) {
      // Oakhaven
      this.bgImage.setTexture('bg_oakhaven');
      this.audio.playBgm('bgm_oakhaven_night');
      this.emberParticles.setPosition(280, 255);
      this.emberParticles.start();

      // Spawn Ash Prowlers & Fanatic Monk
      const e1 = Enemy.createAshProwler('ash_1', new Vector2(380, 260));
      const e2 = Enemy.createFanaticMonk('monk_1', new Vector2(480, 260));
      this.enemies.push(e1, e2);

      this.enemySprites.set(e1.id, this.add.image(e1.position.x, e1.position.y, 'ash_prowler').setOrigin(0.5, 1));
      this.enemySprites.set(e2.id, this.add.image(e2.position.x, e2.position.y, 'fanatic_monk').setOrigin(0.5, 1));

      // Boss Madre Morwenna
      this.currentBoss = Boss.createMadreMorwenna();
      this.bossSprite = this.add.image(530, 260, 'boss_morwenna').setOrigin(0.5, 1);
      this.createBossMarker('Madre Morwenna', 530, 260);

      const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Escenario 1: Oakhaven»";
      this.triggerShalemBalloon(introText, 4500);
    } else if (scenarioIndex === 2) {
      // Londinium
      this.bgImage.setTexture('bg_londinium');
      this.audio.playBgm('bgm_londinium_city');
      this.emberParticles.stop(); // Stop bonfire embers in city

      // Spawn Golden Guards
      const g1 = Enemy.createGoldenGuard('guard_1', new Vector2(400, 260));
      this.enemies.push(g1);
      this.enemySprites.set(g1.id, this.add.image(g1.position.x, g1.position.y, 'golden_guard').setOrigin(0.5, 1));

      // Boss Rex Malphas (Alaric)
      this.currentBoss = Boss.createRexMalphas();
      this.bossSprite = this.add.image(520, 260, 'boss_malphas').setOrigin(0.5, 1);
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
      this.bossSprite = this.add.image(520, 260, 'boss_malphas').setOrigin(0.5, 1).setTint(0x220033).setScale(1.4);
      this.createBossMarker('Astaroth', 520, 260);

      const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Escenario 3: La Catedral Invertida»";
      this.triggerShalemBalloon(introText, 4500);
    }
  }
}
