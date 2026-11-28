import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { Boss, BossPhaseType, BossPhaseChangedEvent } from '../../domain/boss/Boss';
import { EventBus } from '../../domain/shared/DomainEvent';
import { FinisherStyle, FinisherTriggeredEvent } from '../../domain/combat/CombatTypes';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';
import { StoryProgress } from '../../domain/story/StoryProgress';
import { ARROW_SPECS_2D, ArrowType2D } from '../../domain/combat/Combat2DFluidity';
import {
  configureHDSceneCamera,
  drawGothicOrnamentFrame,
  sanitizeGothicText
} from '../ui/CrispTextPipeline';

export class HUDScene extends Phaser.Scene {
  private heroPortraitImg!: Phaser.GameObjects.Image;
  private lastHeroPortraitKey: string = '';

  private playerHealthTrailFill!: Phaser.GameObjects.Rectangle;
  private playerHealthFill!: Phaser.GameObjects.Rectangle;
  private playerHealthText!: Phaser.GameObjects.Text;
  private lastPlayerHpRatio: number = 1;

  private playerPostureFill!: Phaser.GameObjects.Rectangle;
  private levelUpFill!: Phaser.GameObjects.Rectangle;
  private levelUpReadyText!: Phaser.GameObjects.Text;

  // Story Progress UI
  private storyProgressFill!: Phaser.GameObjects.Rectangle;
  private storyTitleText!: Phaser.GameObjects.Text;
  private storyObjectiveText!: Phaser.GameObjects.Text;

  // Official Pixel-Art Weapon & Balm Icons
  private weaponIconImg?: Phaser.GameObjects.Image;
  private weaponBadgeText!: Phaser.GameObjects.Text;
  private balmIconImg?: Phaser.GameObjects.Image;
  private balmBadgeText!: Phaser.GameObjects.Text;
  private disarmWarningText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;

  // Boss UI + Delayed Damage Trail
  private bossContainer!: Phaser.GameObjects.Container;
  private bossHealthTrailFill!: Phaser.GameObjects.Rectangle;
  private bossHealthFill!: Phaser.GameObjects.Rectangle;
  private bossTitleText!: Phaser.GameObjects.Text;
  private bossHealthText!: Phaser.GameObjects.Text;
  private lastBossHpRatio: number = 1;
  private lastBossId: string = '';

  // Dual Character, Interaction & Bottom Sector Compass UI
  private characterSwapText!: Phaser.GameObjects.Text;
  private interactionPromptBg!: Phaser.GameObjects.Rectangle;
  private interactionPromptInner!: Phaser.GameObjects.Rectangle;
  private interactionPromptText!: Phaser.GameObjects.Text;
  private sectorCompassText!: Phaser.GameObjects.Text;

  // Cinematic Finisher Flash
  private cinematicOverlay!: Phaser.GameObjects.Rectangle;
  private cinematicText!: Phaser.GameObjects.Text;

  constructor() {
    super('HUDScene');
  }

  public create(): void {
    configureHDSceneCamera(this);

    // ---------------------------------------------------------
    // 1. TOP-LEFT ORNATE GOTHIC HERO & OBJECTIVE PANEL (x: 8..244, y: 6..108)
    // ---------------------------------------------------------
    drawGothicOrnamentFrame(this, 8, 6, 236, 102, 42, {
      bgColor: 0x0b0714,
      bgAlpha: 0.93,
      outerStroke: 0xd4af37,
      innerStroke: 0x5c3e7a
    });

    // Hero Portrait Medallion (left side of top-left HUD)
    this.add.rectangle(27, 32, 28, 28, 0x07040d, 0.98)
      .setStrokeStyle(1.2, 0xc9a24b)
      .setDepth(44);
    const initPortrait = this.textures.exists('portrait_thomas') ? 'portrait_thomas' : 'icon_oakhaven_cross';
    this.heroPortraitImg = this.add.image(27, 32, initPortrait)
      .setDisplaySize(25, 25)
      .setDepth(45);
    this.lastHeroPortraitKey = initPortrait;

    this.characterSwapText = this.add.text(46, 10, 'THOMAS  [TAB · KHATERINE]', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '8.5px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setDepth(45);

    // Health Bar with Delayed Golden-White Trail Bar
    this.add.text(46, 23, 'VIDA', {
      fontFamily: 'monospace',
      fontSize: '7.5px',
      color: '#ff9e9e',
      fontStyle: 'bold'
    }).setDepth(45);
    this.add.rectangle(74, 28, 114, 7.5, 0x260b10)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x803038)
      .setDepth(44);
    this.playerHealthTrailFill = this.add.rectangle(74, 28, 114, 7.5, 0xffe4a0)
      .setOrigin(0, 0.5)
      .setDepth(44.5);
    this.playerHealthFill = this.add.rectangle(74, 28, 114, 7.5, 0x27c754)
      .setOrigin(0, 0.5)
      .setDepth(45);
    this.playerHealthText = this.add.text(192, 23, '125/125', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#f5eefc',
      fontStyle: 'bold'
    }).setDepth(45);

    // Posture / Guard Bar
    this.add.text(46, 35, 'GRD', {
      fontFamily: 'monospace',
      fontSize: '7.5px',
      color: '#9ec0ff',
      fontStyle: 'bold'
    }).setDepth(45);
    this.add.rectangle(74, 39.5, 114, 4.5, 0x10132e)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x354a8a)
      .setDepth(44);
    this.playerPostureFill = this.add.rectangle(74, 39.5, 114, 4.5, 0x4b8cff)
      .setOrigin(0, 0.5)
      .setDepth(45);

    // Level / Shalem EXP Bar
    this.add.text(46, 45, 'EXP', {
      fontFamily: 'monospace',
      fontSize: '7.5px',
      color: '#d9a8ff',
      fontStyle: 'bold'
    }).setDepth(45);
    this.add.rectangle(74, 49.5, 114, 4.5, 0x1e1030)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x673999)
      .setDepth(44);
    this.levelUpFill = this.add.rectangle(74, 49.5, 1, 4.5, 0xb25cff)
      .setOrigin(0, 0.5)
      .setDepth(45);

    this.levelUpReadyText = this.add.text(192, 44, '★ [M]', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffd700',
      backgroundColor: '#3b1d5c',
      padding: { x: 3, y: 1 },
      fontStyle: 'bold'
    }).setDepth(46).setVisible(false);

    // Official Pixel-Art Weapon / Arrow Icon + Balm Flask Icon Row (y = 58..69)
    if (this.textures.exists('icon_skill_holy_edge')) {
      this.weaponIconImg = this.add.image(19, 63.5, 'icon_skill_holy_edge')
        .setDisplaySize(11, 11)
        .setDepth(46);
    }
    this.weaponBadgeText = this.add.text(28, 58, 'Espada Corta', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '8.5px',
      color: '#e5daf5',
      fontStyle: 'bold'
    }).setDepth(45);

    if (this.textures.exists('icon_maiden_balm')) {
      this.balmIconImg = this.add.image(198, 63.5, 'icon_maiden_balm')
        .setDisplaySize(11, 11)
        .setDepth(46);
    }
    this.balmBadgeText = this.add.text(238, 58, '[H]×3', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#7ef5a6',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(46);

    // Thin divider
    this.add.rectangle(14, 72, 224, 1, 0x523770, 0.85).setOrigin(0, 0.5).setDepth(44);

    // Act Title + Progress Bar + Objective
    if (this.textures.exists('icon_oakhaven_cross')) {
      this.add.image(19, 80, 'icon_oakhaven_cross')
        .setDisplaySize(10, 10)
        .setDepth(46);
    }
    this.storyTitleText = this.add.text(27, 75, 'ACTO I · OAKHAVEN (0%)', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '8px',
      color: '#ffe299',
      fontStyle: 'bold'
    }).setDepth(45);

    this.add.rectangle(14, 88, 224, 4, 0x160d24)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x5c3e7a)
      .setDepth(44);
    this.storyProgressFill = this.add.rectangle(14, 88, 1, 4, 0xffd700)
      .setOrigin(0, 0.5)
      .setDepth(45);

    this.storyObjectiveText = this.add.text(14, 93, '▸ Purga la guardia de la pira', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '8.5px',
      color: '#f0e3ff'
    }).setDepth(45);

    // Disarm warning pill directly below the hero panel
    this.disarmWarningText = this.add.text(8, 112, 'DESARMADO · Pulsa [E] sobre tu arma', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ff7777',
      backgroundColor: '#2a090d',
      padding: { x: 6, y: 2 },
      fontStyle: 'bold'
    }).setDepth(46).setVisible(false);

    // ---------------------------------------------------------
    // 2. TOP-CENTER BOSS BAR (With Delayed Trail Bar) & COMBO COUNTER
    // ---------------------------------------------------------
    this.bossContainer = this.add.container(334, 22).setDepth(44).setVisible(false);
    const bossFrame = this.add.rectangle(0, 0, 168, 30, 0x0d0614, 0.94).setStrokeStyle(1.5, 0xc9a24b);
    const bossInner = this.add.rectangle(0, 0, 163, 25, 0x000000, 0).setStrokeStyle(1, 0x7a2433);
    const bossBg = this.add.rectangle(0, 5.5, 152, 9.5, 0x240608).setStrokeStyle(1, 0x9e2a2a);
    this.bossHealthTrailFill = this.add.rectangle(-76, 5.5, 152, 9.5, 0xfff0b8).setOrigin(0, 0.5);
    this.bossHealthFill = this.add.rectangle(-76, 5.5, 152, 9.5, 0xd4af37).setOrigin(0, 0.5);

    this.bossTitleText = this.add.text(0, -7.5, 'MADRE MORWENNA', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '8.5px',
      color: '#ffe0b2',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.bossHealthText = this.add.text(0, 5.5, '560 / 560 HP', {
      fontFamily: 'monospace',
      fontSize: '7.5px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.bossContainer.add([
      bossFrame,
      bossInner,
      bossBg,
      this.bossHealthTrailFill,
      this.bossHealthFill,
      this.bossTitleText,
      this.bossHealthText
    ]);

    this.comboText = this.add.text(334, 48, '', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '10.5px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(44);

    // ---------------------------------------------------------
    // 3. TOP-RIGHT ORNATE GOTHIC ACTION DOCK (x: 424..632, y: 6..30)
    // ---------------------------------------------------------
    drawGothicOrnamentFrame(this, 424, 6, 208, 24, 45, {
      bgColor: 0x0b0714,
      bgAlpha: 0.93,
      outerStroke: 0xc9a24b,
      innerStroke: 0x523770
    });

    const audioAdapter = WebAudioSoundAdapter.getInstance();

    const makeTopBtn = (
      x: number,
      w: number,
      label: string,
      color: string,
      bg: number,
      border: number,
      onClick: () => void
    ): Phaser.GameObjects.Text => {
      const rect = this.add.rectangle(x, 18, w, 16, bg)
        .setStrokeStyle(1, border)
        .setDepth(46)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, 18, label, {
        fontFamily: 'Cinzel, monospace',
        fontSize: '8px',
        color,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(47);

      rect.on('pointerover', () => {
        rect.setFillStyle(0x3f2361);
        txt.setColor('#ffffff');
      });
      rect.on('pointerout', () => {
        rect.setFillStyle(bg);
        txt.setColor(color);
      });
      rect.on('pointerdown', onClick);
      return txt;
    };

    makeTopBtn(448, 38, '❖ 3D', '#ffd700', 0x26143b, 0xd4af37, () => {
      audioAdapter.playSfx('menu_select');
      (window as unknown as { launch3DPrototype?: () => void }).launch3DPrototype?.();
    });

    const audioBtnText = makeTopBtn(
      494,
      46,
      audioAdapter.getIsMuted() ? 'MUTE' : 'SONIDO',
      audioAdapter.getIsMuted() ? '#ff8888' : '#9effa8',
      0x1a1329,
      0x6e4b8a,
      () => {
        const isMuted = audioAdapter.toggleMute();
        audioBtnText.setText(isMuted ? 'MUTE' : 'SONIDO');
        audioBtnText.setColor(isMuted ? '#ff8888' : '#9effa8');
      }
    );

    makeTopBtn(547, 50, 'VOZ [C]', '#ffd700', 0x1a1329, 0xd4af37, () => {
      const gameScene = this.scene.get('GameScene') as unknown as { player: Character; currentScenario?: number };
      if (gameScene) {
        this.scene.pause('GameScene');
        this.scene.launch('CharacterDialogueScene', {
          player: gameScene.player,
          scenarioIndex: gameScene.currentScenario || 1
        });
      }
    });

    makeTopBtn(601, 48, 'MENÚ [P]', '#ffd700', 0x1a1329, 0xd4af37, () => {
      const gameScene = this.scene.get('GameScene');
      if (gameScene && gameScene.scene.isActive()) {
        gameScene.scene.pause();
        this.scene.launch('MenuModalScene', {
          player: (gameScene as unknown as { player: Character }).player
        });
      }
    });

    // ---------------------------------------------------------
    // 4. SINGLE CLEAN PROXIMITY INTERACTION PILL (y = 323)
    // ---------------------------------------------------------
    this.interactionPromptBg = this.add.rectangle(320, 323, 220, 19, 0x0c0717, 0.95)
      .setStrokeStyle(1.3, 0xd4af37)
      .setDepth(49)
      .setVisible(false);
    this.interactionPromptInner = this.add.rectangle(320, 323, 214, 15, 0x000000, 0)
      .setStrokeStyle(1, 0x5c3e7a)
      .setDepth(49.5)
      .setVisible(false);

    this.interactionPromptText = this.add.text(320, 323, '', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8.5px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(50).setVisible(false);

    // ---------------------------------------------------------
    // 5. BOTTOM GOTHIC SECTOR & SHALEM COMPASS STRIP (y = 349)
    // ---------------------------------------------------------
    this.add.rectangle(320, 349, 640, 22, 0x07040e, 0.96)
      .setStrokeStyle(1, 0x5c3e7a)
      .setDepth(48);
    this.add.rectangle(320, 338.5, 640, 1, 0xc9a24b, 0.55).setDepth(48.5);

    if (this.textures.exists('icon_black_willow_feather')) {
      this.add.image(20, 349, 'icon_black_willow_feather')
        .setDisplaySize(12, 12)
        .setDepth(50);
    }

    this.sectorCompassText = this.add.text(328, 349, 'ATRIO DE SAN JUDE (CAP. I) · Habla con Padre Cedric [E] o sube al Roble', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '9px',
      color: '#efe4ff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(49);

    // ---------------------------------------------------------
    // 6. CINEMATIC FINISHER OVERLAY
    // ---------------------------------------------------------
    this.cinematicOverlay = this.add.rectangle(320, 180, 640, 360, 0xffffff, 0).setDepth(100);
    this.cinematicText = this.add.text(320, 180, '', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '24px',
      color: '#ff1744',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101).setVisible(false);

    // Domain Events
    EventBus.getInstance().subscribe<BossPhaseChangedEvent>('BossPhaseChanged', event => {
      if (!this.scene || !this.scene.isActive() || !this.bossTitleText?.active) return;
      this.cameras.main.flash(300, 200, 100, 255);
      this.bossTitleText.setText(`✦ ${sanitizeGothicText(event.uiMessage).toUpperCase()} ✦`);
      this.bossTitleText.setColor('#ff9eff');
    });

    EventBus.getInstance().subscribe<FinisherTriggeredEvent>('FinisherTriggered', event => {
      if (!this.scene || !this.scene.isActive()) return;
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
    allyName?: string,
    sectorCompassLabel?: string,
    balmsCount?: number,
    activeArrowType?: ArrowType2D,
    isCounterReady?: boolean,
    meleeComboStep?: number
  ): void {
    if (!this.scene.isActive() || !this.playerHealthFill || !this.playerHealthFill.geom) return;

    // Active Hero & Portrait Medallion Sync
    const desiredPortrait = player.id === 'khaterine' ? 'portrait_khaterine' : 'portrait_thomas';
    if (this.heroPortraitImg && this.lastHeroPortraitKey !== desiredPortrait && this.textures.exists(desiredPortrait)) {
      this.heroPortraitImg.setTexture(desiredPortrait).setDisplaySize(25, 25);
      this.lastHeroPortraitKey = desiredPortrait;
    }

    if (this.characterSwapText) {
      const activeName = player.name.toUpperCase();
      const otherName = (allyName || (player.id === 'thomas' ? 'Khaterine' : 'Thomas')).toUpperCase();
      this.characterSwapText.setText(`${activeName}  [TAB · ${otherName}]`);
    }

    // Dynamic Proximity Interaction Prompt (ornate obsidian-gold pill)
    if (this.interactionPromptText && this.interactionPromptBg && this.interactionPromptInner) {
      if (interactionPrompt) {
        const cleanPrompt = sanitizeGothicText(interactionPrompt);
        const label = `[E]  ${cleanPrompt}`;
        this.interactionPromptText.setText(label).setVisible(true);
        const pillW = Math.min(480, Math.max(154, this.interactionPromptText.width + 24));
        this.interactionPromptBg.setSize(pillW, 19).setVisible(true);
        this.interactionPromptInner.setSize(pillW - 5, 15).setVisible(true);
      } else {
        this.interactionPromptText.setVisible(false);
        this.interactionPromptBg.setVisible(false);
        this.interactionPromptInner.setVisible(false);
      }
    }

    // Bottom Sector Compass Strip (clean Gothic typography, zero blurry OS emojis)
    if (sectorCompassLabel && this.sectorCompassText) {
      const cleanedCompass = sanitizeGothicText(sectorCompassLabel);
      if (this.sectorCompassText.text !== cleanedCompass) {
        this.sectorCompassText.setText(cleanedCompass);
      }
    }

    // Health + Smooth Delayed Damage Trail
    const hpRatio = Math.max(0, Math.min(1, player.stats.health / Math.max(1, player.stats.maxHealth)));
    const targetHpW = Math.max(1, 114 * hpRatio);
    this.playerHealthFill.setSize(targetHpW, 7.5);
    this.playerHealthFill.setFillStyle(hpRatio < 0.3 ? 0xe03a3a : 0x27c754);
    this.playerHealthText.setText(`${Math.round(player.stats.health)}/${player.stats.maxHealth}`);

    if (hpRatio < this.lastPlayerHpRatio - 0.005) {
      this.tweens.add({
        targets: this.playerHealthTrailFill,
        width: targetHpW,
        delay: 140,
        duration: 340,
        ease: 'Cubic.easeOut'
      });
    } else if (hpRatio > this.lastPlayerHpRatio) {
      this.playerHealthTrailFill.setSize(targetHpW, 7.5);
    }
    this.lastPlayerHpRatio = hpRatio;

    // Posture
    const postureRatio = Math.max(0, Math.min(1, player.stats.posture / Math.max(1, player.stats.maxPosture)));
    this.playerPostureFill.setSize(Math.max(1, 114 * postureRatio), 4.5);

    // Level Up / Shalem EXP
    const lvlExpRatio = Math.max(0, Math.min(1, player.levelUp.currentExp / Math.max(1, player.levelUp.maxExp)));
    this.levelUpFill.setSize(Math.max(1, 114 * lvlExpRatio), 4.5);
    this.levelUpReadyText.setVisible(player.levelUp.isMinigameReady);

    // Story Progress & Objective
    if (storyProgress) {
      const pct = Math.max(0, Math.min(100, Math.round(storyProgress.scenarioProgress)));
      this.storyProgressFill.setSize(Math.max(1, 224 * (pct / 100)), 4);
      const shortAct = storyProgress.getScenarioName().replace(' — ', ' · ');
      const titleStr = `${shortAct} (${pct}%)`;
      this.storyTitleText.setText(titleStr.length > 36 ? `${titleStr.slice(0, 35)}…` : titleStr);
      const rawObj = sanitizeGothicText(storyProgress.getCurrentObjective());
      const objStr = rawObj.length > 38 ? `${rawObj.slice(0, 37)}…` : rawObj;
      this.storyObjectiveText.setText(`▸ ${objStr}`);
    }

    // Equipped Weapon / Khaterine Elemental Arrow + Official Pixel-Art Icons
    const currentWeapon = player.disarmManager.getCurrentWeapon();
    if (player.id === 'khaterine' && activeArrowType) {
      const arrowSpec = ARROW_SPECS_2D[activeArrowType];
      if (this.weaponIconImg && this.textures.exists('icon_skill_piercing_arrow')) {
        this.weaponIconImg.setTexture('icon_skill_piercing_arrow').setDisplaySize(11, 11).setTint(arrowSpec.tint);
      }
      this.weaponBadgeText.setText(`[R] ${arrowSpec.shortName}`);
      this.weaponBadgeText.setColor(arrowSpec.popupColor);
    } else {
      if (this.weaponIconImg) {
        const iconKey = currentWeapon.id === 'alba_gris' && this.textures.exists('icon_oakhaven_cross')
          ? 'icon_oakhaven_cross'
          : 'icon_skill_holy_edge';
        if (this.textures.exists(iconKey)) {
          this.weaponIconImg.setTexture(iconKey).setDisplaySize(11, 11).clearTint();
        }
      }
      let weaponStr = currentWeapon.name;
      if (currentWeapon.durability !== Infinity) {
        weaponStr += ` [${currentWeapon.durability}]`;
      }
      this.weaponBadgeText.setText(weaponStr.length > 24 ? `${weaponStr.slice(0, 23)}…` : weaponStr);
      this.weaponBadgeText.setColor('#e5daf5');
    }

    if (this.balmBadgeText && typeof balmsCount === 'number') {
      this.balmBadgeText.setText(`[H]×${balmsCount}`);
      this.balmBadgeText.setColor(balmsCount > 0 ? '#7ef5a6' : '#806b8f');
      if (this.balmIconImg) {
        this.balmIconImg.setAlpha(balmsCount > 0 ? 1 : 0.4);
      }
    }
    this.disarmWarningText.setVisible(player.disarmManager.isPlayerDisarmed());

    // Combo & Perfect Dodge Counter-Attack Indicator
    const combo = player.comboSystem.getComboCount();
    if (isCounterReady) {
      this.comboText.setText('✦ ¡CONTRAATAQUE +50% LISTO! ✦');
      this.comboText.setColor('#7ef5ff');
      this.comboText.setAlpha(1);
    } else if (combo > 1) {
      const mult = player.comboSystem.getDamageMultiplier().toFixed(2);
      const stepTag = player.id === 'thomas' && meleeComboStep ? ` · TAJO ${meleeComboStep}/3` : '';
      this.comboText.setText(`★ ${combo} GOLPES · x${mult}${stepTag} ★`);
      this.comboText.setColor('#ffd700');
      this.comboText.setAlpha(1);
    } else {
      this.comboText.setText('');
    }

    // Boss Bar + Smooth Delayed Trail Bar
    if (currentBoss && currentBoss.health > 0) {
      this.bossContainer.setVisible(true);
      const bossRatio = Math.max(0, Math.min(1, currentBoss.health / Math.max(1, currentBoss.maxHealth)));
      const bossBarW = Math.max(1, 152 * bossRatio);
      this.bossHealthFill.setSize(bossBarW, 9.5);

      if (this.lastBossId !== currentBoss.id) {
        this.lastBossId = currentBoss.id;
        this.lastBossHpRatio = bossRatio;
        this.bossHealthTrailFill.setSize(bossBarW, 9.5);
      } else if (bossRatio < this.lastBossHpRatio - 0.003) {
        this.tweens.add({
          targets: this.bossHealthTrailFill,
          width: bossBarW,
          delay: 120,
          duration: 360,
          ease: 'Cubic.easeOut'
        });
      } else if (bossRatio > this.lastBossHpRatio) {
        this.bossHealthTrailFill.setSize(bossBarW, 9.5);
      }
      this.lastBossHpRatio = bossRatio;

      if (currentBoss.phase === BossPhaseType.PHASE_2) {
        this.bossHealthFill.setFillStyle(0x9d3dff);
        this.bossTitleText.setText(`${currentBoss.name.toUpperCase()} · FASE II`);
      } else {
        this.bossHealthFill.setFillStyle(0xd4af37);
        this.bossTitleText.setText(currentBoss.name.toUpperCase());
      }
      this.bossHealthText.setText(`${Math.round(currentBoss.health)} / ${currentBoss.maxHealth} HP`);
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
      if (!this.cinematicOverlay?.active) return;
      this.cinematicOverlay.setAlpha(0);
      this.cinematicText.setVisible(false);
    });
  }
}
