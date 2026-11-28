import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { Boss, BossPhaseType, BossPhaseChangedEvent } from '../../domain/boss/Boss';
import { EventBus } from '../../domain/shared/DomainEvent';
import { FinisherStyle, FinisherTriggeredEvent } from '../../domain/combat/CombatTypes';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';
import { StoryProgress } from '../../domain/story/StoryProgress';
import { ARROW_SPECS_2D, ArrowType2D } from '../../domain/combat/Combat2DFluidity';

export class HUDScene extends Phaser.Scene {
  private playerHealthFill!: Phaser.GameObjects.Rectangle;
  private playerHealthText!: Phaser.GameObjects.Text;
  private playerPostureFill!: Phaser.GameObjects.Rectangle;
  private levelUpFill!: Phaser.GameObjects.Rectangle;
  private levelUpReadyText!: Phaser.GameObjects.Text;

  // Story Progress UI
  private storyProgressFill!: Phaser.GameObjects.Rectangle;
  private storyTitleText!: Phaser.GameObjects.Text;
  private storyObjectiveText!: Phaser.GameObjects.Text;

  private weaponBadgeText!: Phaser.GameObjects.Text;
  private balmBadgeText!: Phaser.GameObjects.Text;
  private disarmWarningText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;

  // Boss UI
  private bossContainer!: Phaser.GameObjects.Container;
  private bossHealthFill!: Phaser.GameObjects.Rectangle;
  private bossTitleText!: Phaser.GameObjects.Text;
  private bossHealthText!: Phaser.GameObjects.Text;

  // Dual Character, Interaction & Bottom Sector Compass UI
  private characterSwapText!: Phaser.GameObjects.Text;
  private interactionPromptBg!: Phaser.GameObjects.Rectangle;
  private interactionPromptText!: Phaser.GameObjects.Text;
  private sectorCompassText!: Phaser.GameObjects.Text;

  // Cinematic Finisher Flash
  private cinematicOverlay!: Phaser.GameObjects.Rectangle;
  private cinematicText!: Phaser.GameObjects.Text;

  constructor() {
    super('HUDScene');
  }

  public create(): void {
    // ---------------------------------------------------------
    // 1. TOP-LEFT COMPACT GOTHIC HERO & OBJECTIVE PANEL (x: 8..214, y: 6..104)
    // ---------------------------------------------------------
    this.add.rectangle(8, 6, 208, 98, 0x0b0714, 0.90)
      .setOrigin(0, 0)
      .setStrokeStyle(1.5, 0xc9a24b)
      .setDepth(42);

    this.characterSwapText = this.add.text(14, 10, '▸ THOMAS  [TAB: KHATERINE]', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setDepth(45);

    // Health Bar
    this.add.text(14, 24, 'HP', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ff9e9e',
      fontStyle: 'bold'
    }).setDepth(45);
    this.add.rectangle(36, 29, 114, 8, 0x2b0e12)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x803038)
      .setDepth(44);
    this.playerHealthFill = this.add.rectangle(36, 29, 114, 8, 0x27c754)
      .setOrigin(0, 0.5)
      .setDepth(45);
    this.playerHealthText = this.add.text(154, 24, '100/100', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#f5eefc',
      fontStyle: 'bold'
    }).setDepth(45);

    // Posture / Guard Bar
    this.add.text(14, 36, 'GRD', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#9ec0ff',
      fontStyle: 'bold'
    }).setDepth(45);
    this.add.rectangle(36, 40, 114, 5, 0x10132e)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x354a8a)
      .setDepth(44);
    this.playerPostureFill = this.add.rectangle(36, 40, 114, 5, 0x4b8cff)
      .setOrigin(0, 0.5)
      .setDepth(45);

    // Level / Shalem EXP Bar
    this.add.text(14, 46, 'EXP', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#d9a8ff',
      fontStyle: 'bold'
    }).setDepth(45);
    this.add.rectangle(36, 50, 114, 5, 0x1e1030)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x673999)
      .setDepth(44);
    this.levelUpFill = this.add.rectangle(36, 50, 1, 5, 0xb25cff)
      .setOrigin(0, 0.5)
      .setDepth(45);

    this.levelUpReadyText = this.add.text(155, 45, '★ [M]', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#ffd700',
      backgroundColor: '#3b1d5c',
      padding: { x: 3, y: 1 },
      fontStyle: 'bold'
    }).setDepth(46).setVisible(false);

    // Equipped Weapon & Quick Heal Balm Indicator ([H] / LT)
    this.weaponBadgeText = this.add.text(14, 58, '⚔ Espada Corta', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#dfd2f0'
    }).setDepth(45);

    this.balmBadgeText = this.add.text(210, 58, '🌿[H]3', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#7ef5a6',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(46);

    // Thin divider
    this.add.rectangle(14, 71, 196, 1, 0x483163, 0.85).setOrigin(0, 0.5).setDepth(44);

    // Act Title + Progress Bar + Objective (strictly bounded inside top-left panel)
    this.storyTitleText = this.add.text(14, 74, 'ACTO I · OAKHAVEN (0%)', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#c9b4e0',
      fontStyle: 'bold'
    }).setDepth(45);

    this.add.rectangle(14, 86, 194, 4, 0x160d24)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x5c3e7a)
      .setDepth(44);
    this.storyProgressFill = this.add.rectangle(14, 86, 1, 4, 0xffd700)
      .setOrigin(0, 0.5)
      .setDepth(45);

    this.storyObjectiveText = this.add.text(14, 91, '▸ Purga la guardia de la pira', {
      fontFamily: 'sans-serif',
      fontSize: '9px',
      color: '#ffe388'
    }).setDepth(45);

    // Disarm warning pill directly below the hero panel
    this.disarmWarningText = this.add.text(8, 108, '⚠ DESARMADO · Pulsa [E] sobre tu arma', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#ff6666',
      backgroundColor: '#2a090d',
      padding: { x: 5, y: 2 }
    }).setDepth(46).setVisible(false);

    // ---------------------------------------------------------
    // 2. TOP-CENTER BOSS BAR (Hidden until a live Boss exists) & COMBO COUNTER
    // ---------------------------------------------------------
    this.bossContainer = this.add.container(320, 22).setDepth(44).setVisible(false);
    const bossFrame = this.add.rectangle(0, 0, 174, 28, 0x0d0614, 0.90).setStrokeStyle(1, 0x993333);
    const bossBg = this.add.rectangle(0, 5, 160, 10, 0x240608).setStrokeStyle(1, 0x9e2a2a);
    this.bossHealthFill = this.add.rectangle(-80, 5, 160, 10, 0xd4af37).setOrigin(0, 0.5);

    this.bossTitleText = this.add.text(0, -7, 'MADRE MORWENNA', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '9px',
      color: '#ffe0b2',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.bossHealthText = this.add.text(0, 5, '350 / 350 HP', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.bossContainer.add([bossFrame, bossBg, this.bossHealthFill, this.bossTitleText, this.bossHealthText]);

    this.comboText = this.add.text(320, 48, '', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '12px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(44);

    // ---------------------------------------------------------
    // 3. TOP-RIGHT COMPACT ACTION DOCK (x: 416..632, y: 6..30)
    // ---------------------------------------------------------
    this.add.rectangle(524, 18, 216, 24, 0x0b0714, 0.92)
      .setStrokeStyle(1.5, 0xc9a24b)
      .setDepth(45);

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
      const rect = this.add.rectangle(x, 18, w, 17, bg)
        .setStrokeStyle(1, border)
        .setDepth(46)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, 18, label, {
        fontFamily: 'monospace',
        fontSize: '9px',
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

    makeTopBtn(441, 42, '🏛 3D', '#ffd700', 0x26143b, 0xd4af37, () => {
      audioAdapter.playSfx('menu_select');
      (window as unknown as { launch3DPrototype?: () => void }).launch3DPrototype?.();
    });

    const audioBtnText = makeTopBtn(
      491,
      50,
      audioAdapter.getIsMuted() ? '🔇 OFF' : '🔊 ON',
      audioAdapter.getIsMuted() ? '#ff8888' : '#9effa8',
      0x1a1329,
      0x6e4b8a,
      () => {
        const isMuted = audioAdapter.toggleMute();
        audioBtnText.setText(isMuted ? '🔇 OFF' : '🔊 ON');
        audioBtnText.setColor(isMuted ? '#ff8888' : '#9effa8');
      }
    );

    makeTopBtn(546, 54, '💬 [C]', '#ffd700', 0x1a1329, 0xd4af37, () => {
      const gameScene = this.scene.get('GameScene') as unknown as { player: Character; currentScenario?: number };
      if (gameScene) {
        this.scene.pause('GameScene');
        this.scene.launch('CharacterDialogueScene', {
          player: gameScene.player,
          scenarioIndex: gameScene.currentScenario || 1
        });
      }
    });

    makeTopBtn(602, 52, '⚙ [P]', '#ffd700', 0x1a1329, 0xd4af37, () => {
      const gameScene = this.scene.get('GameScene');
      if (gameScene && gameScene.scene.isActive()) {
        gameScene.scene.pause();
        this.scene.launch('MenuModalScene', {
          player: (gameScene as unknown as { player: Character }).player
        });
      }
    });

    // ---------------------------------------------------------
    // 4. SINGLE CLEAN PROXIMITY INTERACTION PILL (y = 324)
    // ---------------------------------------------------------
    this.interactionPromptBg = this.add.rectangle(320, 323, 220, 18, 0x0e081a, 0.94)
      .setStrokeStyle(1, 0xd4af37)
      .setDepth(49)
      .setVisible(false);

    this.interactionPromptText = this.add.text(320, 323, '', {
      fontFamily: 'monospace',
      fontSize: '9.5px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(50).setVisible(false);

    // ---------------------------------------------------------
    // 5. BOTTOM GOTHIC SECTOR & SHALEM COMPASS STRIP (y = 349)
    // (Replaces the redundant tiny controls line since full controls sit cleanly below the canvas in HTML)
    // ---------------------------------------------------------
    this.add.rectangle(320, 349, 640, 22, 0x08050f, 0.95)
      .setStrokeStyle(1, 0x452d61)
      .setDepth(48);

    this.sectorCompassText = this.add.text(320, 349, '📍 ATRIO DE SAN JUDE (CAP. I) · 🐈‍⬛ Habla con Padre Cedric [E] o sube al Roble', {
      fontFamily: 'sans-serif',
      fontSize: '9.5px',
      color: '#e5d4f7',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(49);

    // ---------------------------------------------------------
    // 6. CINEMATIC FINISHER OVERLAY
    // ---------------------------------------------------------
    this.cinematicOverlay = this.add.rectangle(320, 180, 640, 360, 0xffffff, 0).setDepth(100);
    this.cinematicText = this.add.text(320, 180, '', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '26px',
      color: '#ff0044',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(101).setVisible(false);

    // Domain Events
    EventBus.getInstance().subscribe<BossPhaseChangedEvent>('BossPhaseChanged', event => {
      if (!this.scene || !this.scene.isActive() || !this.bossTitleText?.active) return;
      this.cameras.main.flash(300, 200, 100, 255);
      this.bossTitleText.setText(`⚠ ${event.uiMessage.toUpperCase()} ⚠`);
      this.bossTitleText.setColor('#ff88ff');
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

    // Active Hero
    if (this.characterSwapText) {
      const activeName = player.name.toUpperCase();
      const otherName = (allyName || (player.id === 'thomas' ? 'Khaterine' : 'Thomas')).toUpperCase();
      this.characterSwapText.setText(`▸ ${activeName}  [TAB: ${otherName}]`);
    }

    // Dynamic Proximity Interaction Prompt (auto-sized obsidian pill)
    if (this.interactionPromptText && this.interactionPromptBg) {
      if (interactionPrompt) {
        const label = `[E] · ${interactionPrompt}`;
        this.interactionPromptText.setText(label).setVisible(true);
        const pillW = Math.min(480, Math.max(150, this.interactionPromptText.width + 20));
        this.interactionPromptBg.setSize(pillW, 18).setVisible(true);
      } else {
        this.interactionPromptText.setVisible(false);
        this.interactionPromptBg.setVisible(false);
      }
    }

    // Bottom Sector Compass Strip
    if (sectorCompassLabel && this.sectorCompassText && this.sectorCompassText.text !== sectorCompassLabel) {
      this.sectorCompassText.setText(sectorCompassLabel);
    }

    // Health
    const hpRatio = Math.max(0, Math.min(1, player.stats.health / Math.max(1, player.stats.maxHealth)));
    this.playerHealthFill.setSize(Math.max(1, 114 * hpRatio), 8);
    this.playerHealthFill.setFillStyle(hpRatio < 0.3 ? 0xe03a3a : 0x27c754);
    this.playerHealthText.setText(`${Math.round(player.stats.health)}/${player.stats.maxHealth}`);

    // Posture
    const postureRatio = Math.max(0, Math.min(1, player.stats.posture / Math.max(1, player.stats.maxPosture)));
    this.playerPostureFill.setSize(Math.max(1, 114 * postureRatio), 5);

    // Level Up / Shalem EXP
    const lvlExpRatio = Math.max(0, Math.min(1, player.levelUp.currentExp / Math.max(1, player.levelUp.maxExp)));
    this.levelUpFill.setSize(Math.max(1, 114 * lvlExpRatio), 5);
    this.levelUpReadyText.setVisible(player.levelUp.isMinigameReady);

    // Story Progress & Objective (strictly clamped to 4px bar height & panel width)
    if (storyProgress) {
      const pct = Math.max(0, Math.min(100, Math.round(storyProgress.scenarioProgress)));
      this.storyProgressFill.setSize(Math.max(1, 194 * (pct / 100)), 4);
      const shortAct = storyProgress.getScenarioName().replace(' — ', ' · ');
      const titleStr = `${shortAct} (${pct}%)`;
      this.storyTitleText.setText(titleStr.length > 34 ? `${titleStr.slice(0, 33)}…` : titleStr);
      const rawObj = storyProgress.getCurrentObjective();
      const objStr = rawObj.length > 34 ? `${rawObj.slice(0, 33)}…` : rawObj;
      this.storyObjectiveText.setText(`▸ ${objStr}`);
    }

    // Equipped Weapon / Khaterine Elemental Arrow, Balms & Disarm
    const currentWeapon = player.disarmManager.getCurrentWeapon();
    if (player.id === 'khaterine' && activeArrowType) {
      const arrowSpec = ARROW_SPECS_2D[activeArrowType];
      this.weaponBadgeText.setText(`🏹 ${arrowSpec.badge} ${arrowSpec.shortName}`.slice(0, 23));
      this.weaponBadgeText.setColor(arrowSpec.popupColor);
    } else {
      let weaponStr = `⚔ ${currentWeapon.name}`;
      if (currentWeapon.durability !== Infinity) {
        weaponStr += ` [${currentWeapon.durability}]`;
      }
      this.weaponBadgeText.setText(weaponStr.length > 22 ? `${weaponStr.slice(0, 21)}…` : weaponStr);
      this.weaponBadgeText.setColor('#dfd2f0');
    }
    if (this.balmBadgeText && typeof balmsCount === 'number') {
      this.balmBadgeText.setText(`🌿[H]${balmsCount}`);
      this.balmBadgeText.setColor(balmsCount > 0 ? '#7ef5a6' : '#806b8f');
    }
    this.disarmWarningText.setVisible(player.disarmManager.isPlayerDisarmed());

    // Combo & Perfect Dodge Counter-Attack Indicator
    const combo = player.comboSystem.getComboCount();
    if (isCounterReady) {
      this.comboText.setText('⚡ ¡CONTRAATAQUE +50% LISTO! ⚡');
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

    // Boss Bar
    if (currentBoss && currentBoss.health > 0) {
      this.bossContainer.setVisible(true);
      const bossRatio = Math.max(0, Math.min(1, currentBoss.health / Math.max(1, currentBoss.maxHealth)));
      this.bossHealthFill.setSize(Math.max(1, 160 * bossRatio), 10);
      if (currentBoss.phase === BossPhaseType.PHASE_2) {
        this.bossHealthFill.setFillStyle(0x9d3dff);
        this.bossTitleText.setText(`${currentBoss.name.toUpperCase()} · FASE 2`);
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
