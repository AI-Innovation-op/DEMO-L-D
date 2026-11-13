import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { Boss } from '../../domain/boss/Boss';
import { EventBus } from '../../domain/shared/DomainEvent';
import { BossUiShatteredEvent } from '../../domain/boss/Boss';
import { FinisherStyle, FinisherTriggeredEvent } from '../../domain/combat/CombatTypes';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';

export class HUDScene extends Phaser.Scene {
  private playerHealthBg!: Phaser.GameObjects.Rectangle;
  private playerHealthFill!: Phaser.GameObjects.Rectangle;
  private playerHealthText!: Phaser.GameObjects.Text;

  private playerPostureBg!: Phaser.GameObjects.Rectangle;
  private playerPostureFill!: Phaser.GameObjects.Rectangle;

  private levelUpBg!: Phaser.GameObjects.Rectangle;
  private levelUpFill!: Phaser.GameObjects.Rectangle;
  private levelUpReadyText!: Phaser.GameObjects.Text;

  private weaponBadgeText!: Phaser.GameObjects.Text;
  private disarmWarningText!: Phaser.GameObjects.Text;

  private comboText!: Phaser.GameObjects.Text;

  // Boss UI
  private bossContainer!: Phaser.GameObjects.Container;
  private bossHealthFill!: Phaser.GameObjects.Rectangle;
  private bossTitleText!: Phaser.GameObjects.Text;
  private isBossUiShattered: boolean = false;

  // Cinematic Finisher Flash
  private cinematicOverlay!: Phaser.GameObjects.Rectangle;
  private cinematicText!: Phaser.GameObjects.Text;

  constructor() {
    super('HUDScene');
  }

  public create(): void {
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
      fontSize: '9px',
      color: '#ffd700',
      backgroundColor: '#3b1d5c',
      padding: { x: 4, y: 2 }
    }).setVisible(false);

    // 4. Equipped Weapon Badge
    this.weaponBadgeText = this.add.text(12, 68, 'ARMA: Espada Corta del Monaguillo', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#e2d4f0',
      stroke: '#000000',
      strokeThickness: 2
    });

    this.disarmWarningText = this.add.text(12, 84, '⚠ ¡DESARMADO! Pulsa [E] cerca de tu arma o ataca a puños', {
      fontFamily: 'sans-serif',
      fontSize: '9px',
      color: '#ff4444',
      backgroundColor: 'rgba(50,0,0,0.85)',
      padding: { x: 4, y: 2 }
    }).setVisible(false);

    // 5. Combo Text
    this.comboText = this.add.text(440, 25, '', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '16px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 5.1 Top-Right Control Buttons (Audio Mute, Dialogue, Menu)
    const audioAdapter = WebAudioSoundAdapter.getInstance();

    // Sound Mute Toggle Button
    const audioBtnBg = this.add.rectangle(440, 18, 75, 20, 0x1d142b).setStrokeStyle(1, 0x6e4b8a);
    audioBtnBg.setInteractive({ useHandCursor: true });

    const audioBtnText = this.add.text(440, 18, audioAdapter.getIsMuted() ? '🔇 MUTE' : '🔊 AUDIO', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: audioAdapter.getIsMuted() ? '#ff7777' : '#aaffaa',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    audioBtnBg.on('pointerdown', () => {
      const isMuted = audioAdapter.toggleMute();
      audioBtnText.setText(isMuted ? '🔇 MUTE' : '🔊 AUDIO');
      audioBtnText.setColor(isMuted ? '#ff7777' : '#aaffaa');
    });

    // Character Dialogue Button [C]
    const dialogBtnBg = this.add.rectangle(520, 18, 70, 20, 0x1d142b).setStrokeStyle(1, 0xd4af37);
    dialogBtnBg.setInteractive({ useHandCursor: true });

    this.add.text(520, 18, '💬 CHARLA [C]', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8.5px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

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
    const menuBtnBg = this.add.rectangle(595, 18, 65, 20, 0x1d142b).setStrokeStyle(1, 0xd4af37);
    menuBtnBg.setInteractive({ useHandCursor: true });

    const menuBtnText = this.add.text(595, 18, '⚙ MENÚ [P]', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8.5px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

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

    // 6. Boss UI Bar Container
    this.bossContainer = this.add.container(320, 25);
    const bossBg = this.add.rectangle(0, 0, 240, 12, 0x220505).setStrokeStyle(1, 0x661111);
    this.bossHealthFill = this.add.rectangle(-120, 0, 240, 12, 0xdd2222).setOrigin(0, 0.5);
    this.bossTitleText = this.add.text(0, -12, 'MADRE MORWENNA — VIGÍA DE LA PIRA', {
      fontFamily: 'Cinzel, serif',
      fontSize: '10px',
      color: '#ffddaa',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.bossContainer.add([bossBg, this.bossHealthFill, this.bossTitleText]);

    // 7. Cinematic Finisher Flash Overlay
    this.cinematicOverlay = this.add.rectangle(320, 180, 640, 360, 0xffffff, 0).setDepth(100);
    this.cinematicText = this.add.text(320, 180, '', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '28px',
      color: '#ff0044',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(101).setVisible(false);

    // Listen to Domain Events
    EventBus.getInstance().subscribe<BossUiShatteredEvent>('BossUiShattered', event => {
      this.shatterBossUi(event.decreeTitle);
    });

    EventBus.getInstance().subscribe<FinisherTriggeredEvent>('FinisherTriggered', event => {
      if (event.style === FinisherStyle.CINEMATIC_COMBO) {
        this.triggerCinematicFinisherEffect();
      }
    });
  }

  public updateHUD(player: Character, currentBoss?: Boss): void {
    // Health
    const hpRatio = Math.max(0, player.stats.health / player.stats.maxHealth);
    this.playerHealthFill.width = 110 * hpRatio;
    this.playerHealthText.setText(`${player.stats.health}/${player.stats.maxHealth}`);

    // Posture
    const postureRatio = Math.max(0, player.stats.posture / player.stats.maxPosture);
    this.playerPostureFill.width = 110 * postureRatio;

    // Level Up / Shalem Ready
    const lvlExpRatio = Math.max(0, player.levelUp.currentExp / player.levelUp.maxExp);
    this.levelUpFill.width = 110 * lvlExpRatio;
    this.levelUpReadyText.setVisible(player.levelUp.isMinigameReady);

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
      this.comboText.setText(`${combo} GOLPES! x${mult}`);
      this.comboText.setAlpha(1);
    } else {
      this.comboText.setText('');
    }

    // Boss
    if (currentBoss && currentBoss.health > 0) {
      this.bossContainer.setVisible(true);
      if (!this.isBossUiShattered) {
        const bossRatio = Math.max(0, currentBoss.health / currentBoss.maxHealth);
        this.bossHealthFill.width = 240 * bossRatio;
        this.bossTitleText.setText(`${currentBoss.name.toUpperCase()} — ${currentBoss.title}`);
      }
    } else if (!this.isBossUiShattered) {
      this.bossContainer.setVisible(false);
    }
  }

  private shatterBossUi(decreeTitle: string): void {
    this.isBossUiShattered = true;
    this.cameras.main.shake(600, 0.025);

    // Shatter into golden infinite bar
    this.bossHealthFill.setFillStyle(0xffd700);
    this.bossHealthFill.width = 240;
    this.bossTitleText.setText(`⚠ ${decreeTitle} ⚠`);
    this.bossTitleText.setColor('#ffe066');

    // Flashing infinite glow
    this.tweens.add({
      targets: this.bossHealthFill,
      alpha: 0.6,
      duration: 300,
      yoyo: true,
      repeat: -1
    });
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
