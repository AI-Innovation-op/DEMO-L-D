import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { Boss, BossPhaseType, BossPhaseChangedEvent } from '../../domain/boss/Boss';
import { EventBus } from '../../domain/shared/DomainEvent';
import { FinisherStyle, FinisherTriggeredEvent } from '../../domain/combat/CombatTypes';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';
import { StoryProgress } from '../../domain/story/StoryProgress';

export class HUDScene extends Phaser.Scene {
  private playerHealthBg!: Phaser.GameObjects.Rectangle;
  private playerHealthFill!: Phaser.GameObjects.Rectangle;
  private playerHealthText!: Phaser.GameObjects.Text;

  private playerPostureBg!: Phaser.GameObjects.Rectangle;
  private playerPostureFill!: Phaser.GameObjects.Rectangle;

  private levelUpBg!: Phaser.GameObjects.Rectangle;
  private levelUpFill!: Phaser.GameObjects.Rectangle;
  private levelUpReadyText!: Phaser.GameObjects.Text;

  // Story Progress UI
  private storyProgressFill!: Phaser.GameObjects.Rectangle;
  private storyTitleText!: Phaser.GameObjects.Text;
  private storyObjectiveText!: Phaser.GameObjects.Text;

  private weaponBadgeText!: Phaser.GameObjects.Text;
  private disarmWarningText!: Phaser.GameObjects.Text;

  private comboText!: Phaser.GameObjects.Text;

  // Boss UI
  private bossContainer!: Phaser.GameObjects.Container;
  private bossHealthFill!: Phaser.GameObjects.Rectangle;
  private bossTitleText!: Phaser.GameObjects.Text;
  private bossHealthText!: Phaser.GameObjects.Text;

  // Dual Character & Interaction UI
  private characterSwapText!: Phaser.GameObjects.Text;
  private interactionPromptText!: Phaser.GameObjects.Text;

  // Cinematic Finisher Flash
  private cinematicOverlay!: Phaser.GameObjects.Rectangle;
  private cinematicText!: Phaser.GameObjects.Text;

  constructor() {
    super('HUDScene');
  }

  public create(): void {
    // 0. Active Character & Dual Switch Indicator
    this.characterSwapText = this.add.text(12, 1, '> THOMAS   [TAB: KHATERINE]', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setDepth(45);

    // 1. Health Bar
    this.add.text(12, 10, 'SALUD', { fontFamily: 'monospace', fontSize: '9px', color: '#ffaaaa' });
    this.playerHealthBg = this.add.rectangle(70, 14, 110, 10, 0x331111).setOrigin(0, 0.5);
    this.playerHealthBg.setStrokeStyle(1, 0x883333);
    this.playerHealthFill = this.add.rectangle(70, 14, 110, 10, 0x22cc44).setOrigin(0, 0.5);
    this.playerHealthText = this.add.text(185, 10, '100/100', { fontFamily: 'monospace', fontSize: '9px', color: '#ffffff' });

    // 2. Posture Bar
    this.add.text(12, 24, 'GUARDIA', { fontFamily: 'monospace', fontSize: '9px', color: '#aaaaff' });
    this.playerPostureBg = this.add.rectangle(70, 28, 110, 6, 0x111133).setOrigin(0, 0.5);
    this.playerPostureBg.setStrokeStyle(1, 0x333388);
    this.playerPostureFill = this.add.rectangle(70, 28, 110, 6, 0x4488ff).setOrigin(0, 0.5);

    // 3. Level Up Bar (Shalem Minigame Indicator)
    this.add.text(12, 36, 'LVL UP', { fontFamily: 'monospace', fontSize: '9px', color: '#ddaaff' });
    this.levelUpBg = this.add.rectangle(70, 40, 110, 6, 0x221133).setOrigin(0, 0.5);
    this.levelUpBg.setStrokeStyle(1, 0x663399);
    this.levelUpFill = this.add.rectangle(70, 40, 0, 6, 0xaa44ff).setOrigin(0, 0.5);

    this.levelUpReadyText = this.add.text(70, 50, '★ [M] MINIJUEGO SHALEM LISTO ★', {
      fontFamily: 'sans-serif',
      fontSize: '8.5px',
      color: '#ffd700',
      backgroundColor: '#3b1d5c',
      padding: { x: 4, y: 2 }
    }).setVisible(false);

    // 4. Equipped Weapon Badge
    this.weaponBadgeText = this.add.text(12, 68, 'ARMA: Espada Corta del Monaguillo', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#e2d4f0',
      stroke: '#000000',
      strokeThickness: 2
    });

    // 4.1 Story & Scenario Progress Bar
    this.storyTitleText = this.add.text(12, 85, 'HISTORIA: ACTO I — OAKHAVEN (0%)', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8.5px',
      color: '#ffd700',
      fontStyle: 'bold'
    });

    this.add.rectangle(12, 98, 168, 6, 0x140c24).setOrigin(0, 0.5).setStrokeStyle(1, 0x6e4b8a);
    this.storyProgressFill = this.add.rectangle(12, 98, 0, 6, 0xffd700).setOrigin(0, 0.5);

    this.storyObjectiveText = this.add.text(12, 106, 'OBJETIVO: Purga la guardia de la pira', {
      fontFamily: 'sans-serif',
      fontSize: '8px',
      color: '#bbaacc'
    });

    this.disarmWarningText = this.add.text(12, 122, '⚠ ¡DESARMADO! Pulsa [E] cerca de tu arma o ataca a puños', {
      fontFamily: 'sans-serif',
      fontSize: '9px',
      color: '#ff4444',
      backgroundColor: 'rgba(50,0,0,0.85)',
      padding: { x: 4, y: 2 }
    }).setVisible(false);

    // 5. Combo Text — Dedicated Arcade Position (Center-Top, below Boss Bar)
    this.comboText = this.add.text(305, 46, '', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '13px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(40);

    // 5.1 Top-Right Control Buttons with 100% Opaque Solid Background (Prevents any text overlap)
    this.add.rectangle(521, 18, 222, 26, 0x0b0614, 1.0)
      .setStrokeStyle(1, 0xd4af37)
      .setDepth(45);

    const audioAdapter = WebAudioSoundAdapter.getInstance();

    // Sound Mute Toggle Button
    const audioBtnBg = this.add.rectangle(445, 18, 62, 18, 0x1d142b)
      .setStrokeStyle(1, 0x6e4b8a)
      .setDepth(46)
      .setInteractive({ useHandCursor: true });

    const audioBtnText = this.add.text(445, 18, audioAdapter.getIsMuted() ? '🔇 MUTE' : '🔊 AUDIO', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: audioAdapter.getIsMuted() ? '#ff7777' : '#aaffaa',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(47);

    audioBtnBg.on('pointerdown', () => {
      const isMuted = audioAdapter.toggleMute();
      audioBtnText.setText(isMuted ? '🔇 MUTE' : '🔊 AUDIO');
      audioBtnText.setColor(isMuted ? '#ff7777' : '#aaffaa');
    });

    audioBtnBg.on('pointerover', () => audioBtnBg.setFillStyle(0x3e245c));
    audioBtnBg.on('pointerout', () => audioBtnBg.setFillStyle(0x1d142b));

    // Character Dialogue Button [C]
    const dialogBtnBg = this.add.rectangle(517, 18, 70, 18, 0x1d142b)
      .setStrokeStyle(1, 0xd4af37)
      .setDepth(46)
      .setInteractive({ useHandCursor: true });

    const dialogBtnText = this.add.text(517, 18, '💬 CHARLA [C]', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(47);

    dialogBtnBg.on('pointerover', () => {
      dialogBtnBg.setFillStyle(0x3e245c);
      dialogBtnText.setColor('#ffffff');
    });
    dialogBtnBg.on('pointerout', () => {
      dialogBtnBg.setFillStyle(0x1d142b);
      dialogBtnText.setColor('#ffd700');
    });

    dialogBtnBg.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as unknown as { player: Character; currentScenario?: number };
      if (gameScene) {
        this.scene.pause('GameScene');
        this.scene.launch('CharacterDialogueScene', {
          player: gameScene.player,
          scenarioIndex: gameScene.currentScenario || 1
        });
      }
    });

    // Elegant Menu Button [P]
    const menuBtnBg = this.add.rectangle(590, 18, 64, 18, 0x1d142b)
      .setStrokeStyle(1, 0xd4af37)
      .setDepth(46)
      .setInteractive({ useHandCursor: true });

    const menuBtnText = this.add.text(590, 18, '⚙ MENÚ [P]', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(47);

    menuBtnBg.on('pointerover', () => {
      menuBtnBg.setFillStyle(0x3e245c);
      menuBtnText.setColor('#ffffff');
    });

    menuBtnBg.on('pointerout', () => {
      menuBtnBg.setFillStyle(0x1d142b);
      menuBtnText.setColor('#ffd700');
    });

    menuBtnBg.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      if (gameScene && gameScene.scene.isActive()) {
        gameScene.scene.pause();
        this.scene.launch('MenuModalScene', {
          player: (gameScene as unknown as { player: Character }).player
        });
      }
    });

    // 6. Boss UI Bar Container — Prominent Center Top (Depth 40, width 160, completely isolated from health and controls)
    this.bossContainer = this.add.container(305, 22).setDepth(40);
    const bossBg = this.add.rectangle(0, 0, 160, 12, 0x220505).setStrokeStyle(1, 0x992222);
    this.bossHealthFill = this.add.rectangle(-80, 0, 160, 12, 0xdd2222).setOrigin(0, 0.5);

    this.bossTitleText = this.add.text(0, -12, 'MADRE MORWENNA', {
      fontFamily: 'Cinzel, serif',
      fontSize: '8px',
      color: '#ffddaa',
      stroke: '#000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.bossHealthText = this.add.text(0, 0, '350 / 350 HP', {
      fontFamily: 'monospace',
      fontSize: '7.5px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.bossContainer.add([bossBg, this.bossHealthFill, this.bossTitleText, this.bossHealthText]);

    // 7. Cinematic Finisher Flash Overlay
    this.cinematicOverlay = this.add.rectangle(320, 180, 640, 360, 0xffffff, 0).setDepth(100);
    this.cinematicText = this.add.text(320, 180, '', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '28px',
      color: '#ff0044',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(101).setVisible(false);

    // 8. Bottom Proximity Interaction Prompt
    this.interactionPromptText = this.add.text(320, 328, '', {
      fontFamily: 'monospace',
      fontSize: '9.5px',
      color: '#ffd700',
      backgroundColor: 'rgba(11, 7, 18, 0.92)',
      padding: { x: 10, y: 3 }
    }).setOrigin(0.5).setDepth(50).setVisible(false);

    // 9. Bottom Arcade Controls Legend Bar (Fluid 2.5D Belt-Scroll Legend)
    this.add.rectangle(320, 351, 640, 18, 0x07040d, 0.96)
      .setDepth(48)
      .setStrokeStyle(1, 0x3d2852);
    this.add.text(320, 351, 'WASD: 2.5D | J: Ataque/Magia | K: Fuerte | L: Guardia/Parry | Espacio: Esquivar | Tab: Cambiar | E: Hablar/Recoger | P: Códice & Menú', {
      fontFamily: 'monospace',
      fontSize: '7.5px',
      color: '#d6c5eb'
    }).setOrigin(0.5).setDepth(49);

    // Listen to Domain Events
    EventBus.getInstance().subscribe<BossPhaseChangedEvent>('BossPhaseChanged', event => {
      this.cameras.main.flash(300, 200, 100, 255);
      this.bossTitleText.setText(`⚠ ${event.uiMessage.toUpperCase()} ⚠`);
      this.bossTitleText.setColor('#ff77ff');
    });

    EventBus.getInstance().subscribe<FinisherTriggeredEvent>('FinisherTriggered', event => {
      if (event.style === FinisherStyle.CINEMATIC_COMBO) {
        this.triggerCinematicFinisherEffect();
      }
    });
  }

  public updateHUD(
    player: Character,
    currentBoss?: Boss,
    storyProgress?: StoryProgress,
    interactionPrompt?: string,
    allyName?: string
  ): void {
    if (!this.scene.isActive() || !this.playerHealthFill || !this.playerHealthFill.geom) return;

    // Active Dual Character
    if (this.characterSwapText) {
      const activeName = player.name.toUpperCase();
      const otherName = (allyName || (player.id === 'thomas' ? 'Khaterine' : 'Thomas')).toUpperCase();
      this.characterSwapText.setText(`> ${activeName}   [TAB: ${otherName}]`);
    }

    // Dynamic Proximity Interaction Prompt
    if (this.interactionPromptText) {
      if (interactionPrompt) {
        this.interactionPromptText.setText(`[E] · ${interactionPrompt}`).setVisible(true);
      } else {
        this.interactionPromptText.setVisible(false);
      }
    }

    // Health
    const hpRatio = Math.max(0, player.stats.health / player.stats.maxHealth);
    this.playerHealthFill.setSize(Math.max(1, 110 * hpRatio), 10);
    this.playerHealthText.setText(`${player.stats.health}/${player.stats.maxHealth}`);

    // Posture
    const postureRatio = Math.max(0, player.stats.posture / player.stats.maxPosture);
    this.playerPostureFill.setSize(Math.max(1, 110 * postureRatio), 6);

    // Level Up / Shalem Ready
    const lvlExpRatio = Math.max(0, player.levelUp.currentExp / player.levelUp.maxExp);
    this.levelUpFill.setSize(Math.max(1, 110 * lvlExpRatio), 6);
    this.levelUpReadyText.setVisible(player.levelUp.isMinigameReady);

    // Story / Scenario Progress
    if (storyProgress) {
      const pct = Math.max(0, Math.min(100, storyProgress.scenarioProgress));
      this.storyProgressFill.setSize(Math.max(1, 168 * (pct / 100)), 6);
      this.storyTitleText.setText(`${storyProgress.getScenarioName()} (${pct}%)`);
      this.storyObjectiveText.setText(`OBJETIVO: ${storyProgress.getCurrentObjective()}`);
    }

    // Weapon & Disarm
    const currentWeapon = player.disarmManager.getCurrentWeapon();
    let weaponStr = `ARMA: ${currentWeapon.name}`;
    if (currentWeapon.durability !== Infinity) {
      weaponStr += ` [${currentWeapon.durability} usos]`;
    }
    this.weaponBadgeText.setText(weaponStr);

    this.disarmWarningText.setVisible(player.disarmManager.isPlayerDisarmed());

    // Combo
    const combo = player.comboSystem.getComboCount();
    if (combo > 1) {
      const mult = player.comboSystem.getDamageMultiplier().toFixed(2);
      this.comboText.setText(`★ ${combo} GOLPES! x${mult} ★`);
      this.comboText.setAlpha(1);
    } else {
      this.comboText.setText('');
    }

    // Boss Bar
    if (currentBoss && currentBoss.health > 0) {
      this.bossContainer.setVisible(true);
      const bossRatio = Math.max(0, currentBoss.health / currentBoss.maxHealth);
      this.bossHealthFill.setSize(Math.max(1, 160 * bossRatio), 12);
      if (currentBoss.phase === BossPhaseType.PHASE_2) {
        this.bossHealthFill.setFillStyle(0x9933ff);
        this.bossTitleText.setText(`${currentBoss.name.toUpperCase()} (FASE 2)`);
      } else {
        this.bossHealthFill.setFillStyle(0xd4af37);
        this.bossTitleText.setText(currentBoss.name.toUpperCase());
      }
      this.bossHealthText.setText(`${currentBoss.health} / ${currentBoss.maxHealth} HP`);
    } else {
      this.bossContainer.setVisible(false);
    }
  }

  private triggerCinematicFinisherEffect(): void {
    this.cinematicText.setText('¡REMATE CINEMÁTICO!');
    this.cinematicText.setVisible(true);
    this.cinematicOverlay.setAlpha(0.65);
    this.cameras.main.shake(350, 0.02);

    this.time.delayedCall(450, () => {
      this.cinematicOverlay.setAlpha(0);
      this.cinematicText.setVisible(false);
    });
  }
}
