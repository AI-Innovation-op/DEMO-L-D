import Phaser from 'phaser';
import { CharacterId } from '../../domain/character/CharacterEnums';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';
import { SessionStateStore } from '../../domain/save/SessionStateStore';

export class TitleScene extends Phaser.Scene {
  private selectedCharacter: CharacterId = 'thomas';
  private audio!: WebAudioSoundAdapter;

  // State
  private isMenuOpen: boolean = false;
  private currentMenuIndex: number = 0; // 0 = Nueva Partida, 1 = Opciones, 2 = Instrucciones, 3 = Créditos

  // Display Containers
  private startPromptContainer!: Phaser.GameObjects.Container;
  private promptTween?: Phaser.Tweens.Tween;
  private menuContainer!: Phaser.GameObjects.Container;
  private activeModalContainer?: Phaser.GameObjects.Container;

  // Menu Button References
  private menuButtons: {
    bg: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
    action: () => void;
  }[] = [];

  private shouldOpenCharacterSelect: boolean = false;

  constructor() {
    super('TitleScene');
  }

  public init(data?: { openCharacterSelect?: boolean }): void {
    this.audio = WebAudioSoundAdapter.getInstance();
    this.isMenuOpen = false;
    this.currentMenuIndex = 0;
    this.menuButtons = [];
    this.activeModalContainer = undefined;
    this.shouldOpenCharacterSelect = data?.openCharacterSelect || false;
  }

  public create(): void {
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // 1. Full Cover Artwork (640x360 16:9)
    const coverKey = this.textures.exists('title_cover') ? 'title_cover' : 'bg_oakhaven';
    this.add.image(320, 180, coverKey).setDisplaySize(640, 360).setOrigin(0.5).setDepth(0);

    // Subtle atmospheric vignette overlay
    this.add.image(320, 180, 'fx_vignette').setDisplaySize(640, 360).setAlpha(0.45).setDepth(1);

    // Ambient floating embers
    this.add.particles(480, 240, 'particle_ember', {
      speedX: { min: -15, max: 20 },
      speedY: { min: -25, max: -60 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 2200,
      frequency: 300
    }).setDepth(2);

    // 2. Initial Start Prompt Button (Visible until player clicks or presses Enter/Space)
    this.startPromptContainer = this.add.container(495, 275).setDepth(15);

    const promptBg = this.add.rectangle(0, 0, 240, 28, 0x0d0818, 0.94)
      .setStrokeStyle(1.5, 0xd4af37)
      .setInteractive({ useHandCursor: true });

    const promptText = this.add.text(0, 0, '⚔ PULSA ENTER O HAZ CLIC ⚔', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '9.5px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.startPromptContainer.add([promptBg, promptText]);

    // Breathing pulse animation on prompt
    this.promptTween = this.tweens.add({
      targets: this.startPromptContainer,
      alpha: 0.55,
      scaleX: 0.97,
      scaleY: 0.97,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 3. Right-Side Gothic Menu Panel (Exactly as Reference Image!)
    this.createMenuPanel();

    if (this.shouldOpenCharacterSelect) {
      this.startPromptContainer.setVisible(false);
      this.time.delayedCall(120, () => {
        this.openMenu();
        this.showCharacterSelectModal();
      });
    }

    // 4. Input Handlers
    this.input.on('pointerdown', () => {
      if (!this.isMenuOpen) {
        this.openMenu();
      }
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      if (!this.isMenuOpen) {
        this.openMenu();
      } else if (!this.activeModalContainer) {
        this.menuButtons[this.currentMenuIndex]?.action();
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.isMenuOpen) {
        this.openMenu();
      } else if (!this.activeModalContainer) {
        this.menuButtons[this.currentMenuIndex]?.action();
      }
    });

    this.input.keyboard?.on('keydown-UP', () => {
      if (this.isMenuOpen && !this.activeModalContainer) {
        this.navigateMenu(-1);
      }
    });

    this.input.keyboard?.on('keydown-W', () => {
      if (this.isMenuOpen && !this.activeModalContainer) {
        this.navigateMenu(-1);
      }
    });

    this.input.keyboard?.on('keydown-DOWN', () => {
      if (this.isMenuOpen && !this.activeModalContainer) {
        this.navigateMenu(1);
      }
    });

    this.input.keyboard?.on('keydown-S', () => {
      if (this.isMenuOpen && !this.activeModalContainer) {
        this.navigateMenu(1);
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.activeModalContainer) {
        this.closeModal();
      }
    });
  }

  private openMenu(): void {
    if (this.isMenuOpen) return;
    this.isMenuOpen = true;

    this.audio.playSfx('menu_select');

    if (this.promptTween) {
      this.promptTween.stop();
    }

    // Fade out start prompt and fade in menu
    this.tweens.add({
      targets: this.startPromptContainer,
      alpha: 0,
      duration: 180,
      onComplete: () => {
        this.startPromptContainer.setVisible(false);
      }
    });

    this.menuContainer.setVisible(true);
    this.tweens.add({
      targets: this.menuContainer,
      alpha: 1,
      x: 505,
      duration: 320,
      ease: 'Cubic.easeOut'
    });
  }

  private createMenuPanel(): void {
    const boxW = 190;
    const boxH = 265;
    const boxX = 515;
    const boxY = 195;

    this.menuContainer = this.add.container(boxX, boxY).setDepth(20).setVisible(false).setAlpha(0);

    // Outer Obsidian Box
    const bgOuter = this.add.rectangle(0, 0, boxW, boxH, 0x090614, 0.94)
      .setStrokeStyle(1.5, 0xb8923b);

    // Inner Fillet
    const bgInner = this.add.rectangle(0, 0, boxW - 8, boxH - 8)
      .setStrokeStyle(1, 0x3d2754);

    // Header Title: "ALBION TE ESPERA"
    const titleText = this.add.text(0, -108, 'ALBION TE ESPERA', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5);

    // Header Divider Line
    const divider = this.add.rectangle(0, -94, boxW - 24, 1, 0x735591);

    this.menuContainer.add([bgOuter, bgInner, titleText, divider]);

    // 1. Button "Continuar partida" — opens scenario selector allowing player to pick any act
    const checkpoint = this.loadCheckpoint();
    const hasSave = !!checkpoint;

    const btnContinueBg = this.add.rectangle(0, -70, boxW - 20, 24, 0x1a1030, 0.95)
      .setStrokeStyle(1.5, 0xd4af37)
      .setInteractive({ useHandCursor: true });

    const actNames: Record<number, string> = {
      1: 'I · Oakhaven',
      2: 'II · Campanario',
      3: 'III · Gran Puente',
      4: 'IV · Londinium',
      5: 'V · Catedral Invertida'
    };
    const continueLabel = hasSave
      ? `Continuar partida · Elegir Acto (${actNames[checkpoint!.scenarioIndex] || 'Acto ' + checkpoint!.scenarioIndex})`
      : 'Continuar partida · Elegir Acto';

    const btnContinueText = this.add.text(0, -70, continueLabel, {
      fontFamily: 'Cinzel, sans-serif',
      fontSize: '8px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btnContinueBg.on('pointerover', () => {
      btnContinueBg.setFillStyle(0x351952, 0.98);
      btnContinueBg.setStrokeStyle(1.5, 0xffe680);
      btnContinueText.setColor('#ffffff');
    });
    btnContinueBg.on('pointerout', () => {
      btnContinueBg.setFillStyle(0x1a1030, 0.95);
      btnContinueBg.setStrokeStyle(1.5, 0xd4af37);
      btnContinueText.setColor('#ffd700');
    });
    btnContinueBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      if (!this.activeModalContainer) {
        this.audio.playSfx('menu_select');
        this.showScenarioSelectModal(checkpoint || undefined);
      }
    });

    this.menuContainer.add([btnContinueBg, btnContinueText]);

    // Menu Interactive Items Configuration
    const items = [
      {
        label: 'Nueva partida',
        action: () => {
          this.audio.playSfx('menu_select');
          this.cameras.main.fade(300, 0, 0, 0);
          this.time.delayedCall(320, () => {
            this.scene.start('LoadingScene', {
              targetScene: 'TitleScene',
              targetData: { openCharacterSelect: true },
              imageKey: 'loading_concept_art',
              chapterTitle: 'PRÓLOGO — EL REINO QUE OLVIDÓ LA LUZ',
              storyText: '«Durante generaciones, Albion vivió sumido en una oscuridad perpetua bajo el dogma del Cáliz Solar. Nueve brujas sacrificadas en la Noche de la Luna Roja otorgaron libre albedrío al recién nacido Thomas, salvado del fuego por Khaterine mientras Elowen cargó involuntariamente con la sospecha del reino.»',
              tipText: '«Shalem: Despierta, mortal. El reino de Albion aguarda tus elecciones...»',
              minDurationMs: 2000
            });
          });
        }
      },
      {
        label: 'Opciones',
        action: () => this.showOptionsModal()
      },
      {
        label: 'Instrucciones',
        action: () => this.showInstructionsModal()
      },
      {
        label: 'Créditos',
        action: () => this.showCreditsModal()
      }
    ];

    let startY = -36;
    const spacingY = 32;

    items.forEach((item, index) => {
      const y = startY + index * spacingY;
      const isFirst = index === 0;

      const btnBg = this.add.rectangle(0, y, boxW - 20, 24, isFirst ? 0x2a1440 : 0x140e21, 0.92)
        .setStrokeStyle(1, isFirst ? 0xd4af37 : 0x47315e)
        .setInteractive({ useHandCursor: true });

      const btnText = this.add.text(0, y, item.label, {
        fontFamily: 'Cinzel, sans-serif',
        fontSize: '9.5px',
        color: isFirst ? '#ffffff' : '#d2c5e3',
        fontStyle: isFirst ? 'bold' : 'normal'
      }).setOrigin(0.5);

      btnBg.on('pointerover', () => {
        if (!this.activeModalContainer) {
          this.setMenuFocus(index);
        }
      });

      btnBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation();
        if (!this.activeModalContainer) {
          item.action();
        }
      });

      this.menuContainer.add([btnBg, btnText]);
      this.menuButtons.push({ bg: btnBg, text: btnText, action: item.action });
    });

    // Footer Version Text
    const footerText = this.add.text(0, 114, 'DEMO NARRATIVA · 0.5.0', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#84739c'
    }).setOrigin(0.5);

    this.menuContainer.add(footerText);
  }

  private navigateMenu(delta: number): void {
    const newIdx = (this.currentMenuIndex + delta + this.menuButtons.length) % this.menuButtons.length;
    this.setMenuFocus(newIdx);
  }

  private setMenuFocus(idx: number): void {
    if (this.currentMenuIndex === idx && this.menuButtons[idx].bg.fillColor === 0x3d1d5e) return;
    this.currentMenuIndex = idx;
    this.audio.playSfx('menu_select');

    this.menuButtons.forEach((btn, i) => {
      if (i === idx) {
        btn.bg.setFillStyle(0x3d1d5e, 0.98);
        btn.bg.setStrokeStyle(1.5, 0xffd700);
        btn.text.setColor('#ffffff');
        btn.text.setFontStyle('bold');
      } else {
        btn.bg.setFillStyle(0x140e21, 0.9);
        btn.bg.setStrokeStyle(1, 0x47315e);
        btn.text.setColor('#d2c5e3');
        btn.text.setFontStyle('normal');
      }
    });
  }

  // ==========================================
  // MODAL 1: SELECCIÓN DE PERSONAJE
  // ==========================================
  private showCharacterSelectModal(): void {
    this.closeModal();

    this.activeModalContainer = this.add.container(320, 180).setDepth(50);

    // Dim background
    const dimBg = this.add.rectangle(0, 0, 640, 360, 0x040208, 0.8).setInteractive();
    dimBg.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());

    // Window Frame
    const frameW = 460;
    const frameH = 260;
    const winBg = this.add.rectangle(0, 0, frameW, frameH, 0x0c0817, 0.97)
      .setStrokeStyle(2, 0xd4af37);

    const winInner = this.add.rectangle(0, 0, frameW - 8, frameH - 8)
      .setStrokeStyle(1, 0x4d3263);

    const title = this.add.text(0, -105, '✦ ¿QUIÉN LIDERA EL VIAJE? ✦', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '12.5px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sub = this.add.text(0, -88, 'Alterna el control entre Thomas y Khaterine en cualquier momento con [TAB]', {
      fontFamily: 'serif',
      fontSize: '9px',
      color: '#c5b4db',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    this.activeModalContainer.add([dimBg, winBg, winInner, title, sub]);

    // Card 1: Thomas
    const c1 = this.createCharCard(-105, 5, 'thomas', 'THOMAS', 'Monaguillo · Híbrido Oscuro', 'Combate con espada, ágil, lanza armas con [T] y pelea a puños.', 'thomas_idle');
    // Card 2: Khaterine
    const c2 = this.createCharCard(105, 5, 'khaterine', 'KHATERINE', 'Hechicera del Abismo', 'Magia rúnica a distancia, poderosa y resistente.', 'khaterine_idle');

    // Close & Quick Action buttons
    const quickBtn = this.add.text(-80, 105, '⚡ ACCIÓN RÁPIDA (COMBATE)', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8px',
      color: '#ffd700',
      backgroundColor: '#1b2612',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    quickBtn.on('pointerover', () => quickBtn.setColor('#ffffff'));
    quickBtn.on('pointerout', () => quickBtn.setColor('#ffd700'));
    quickBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.startQuickGame(this.selectedCharacter);
    });

    const closeBtn = this.add.text(90, 105, '[ VOLVER AL MENÚ ]', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#bba8d4',
      backgroundColor: '#1b1226',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => closeBtn.setColor('#ffd700'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#bba8d4'));
    closeBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.closeModal();
    });

    this.activeModalContainer.add([c1, c2, quickBtn, closeBtn]);
  }

  private startQuickGame(charId: CharacterId = 'thomas'): void {
    SessionStateStore.getInstance().resetToDefaults(charId, 1);
    this.audio.playSfx('dodge');
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(320, () => {
      this.scene.start('LoadingScene', {
        targetScene: 'GameScene',
        targetData: {
          characterId: charId,
          scenarioIndex: 1
        },
        imageKey: 'loading_pyre_remains',
        chapterTitle: 'ACTO I — CENIZAS EN OAKHAVEN',
        storyText: '«Thomas y Khaterine empuñan sus armas ante la pira de los herejes. Shalem observa desde el muro... La batalla comienza.»',
        tipText: '«Consejo: Usa [J] para golpe ligero y [K] para golpe pesado capaz de romper escudos.»',
        minDurationMs: 1200
      });
    });
  }

  private createCharCard(
    x: number,
    y: number,
    charId: CharacterId,
    name: string,
    role: string,
    desc: string,
    spriteKey: string
  ): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 185, 145, 0x140e21, 0.92)
      .setStrokeStyle(1.5, 0x6e4b8a)
      .setInteractive({ useHandCursor: true });

    // Proportional character sprite rendering: Thomas native pixel art is 96x80 (ratio 1.2:1)
    let spr: Phaser.GameObjects.Image;
    if (charId === 'thomas') {
      spr = this.add.image(0, -28, spriteKey).setDisplaySize(82, 68);
    } else {
      spr = this.add.image(0, -28, spriteKey).setDisplaySize(30, 68);
    }

    const nameTxt = this.add.text(0, 16, name, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const roleTxt = this.add.text(0, 31, role, {
      fontFamily: 'sans-serif',
      fontSize: '8px',
      color: '#cca8f0'
    }).setOrigin(0.5);

    const descTxt = this.add.text(0, 52, desc, {
      fontFamily: 'sans-serif',
      fontSize: '7.5px',
      color: '#9e91b3',
      align: 'center',
      wordWrap: { width: 170 }
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x2d1747, 0.98);
      bg.setStrokeStyle(2, 0xffd700);
      nameTxt.setColor('#ffffff');
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x140e21, 0.92);
      bg.setStrokeStyle(1.5, 0x6e4b8a);
      nameTxt.setColor('#ffd700');
    });

    bg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.selectedCharacter = charId;
      this.startGame();
    });

    card.add([bg, spr, nameTxt, roleTxt, descTxt]);
    return card;
  }

  // ==========================================
  // MODAL 2: OPCIONES
  // ==========================================
  private showOptionsModal(): void {
    this.closeModal();

    this.activeModalContainer = this.add.container(320, 180).setDepth(50);

    const dimBg = this.add.rectangle(0, 0, 640, 360, 0x040208, 0.8).setInteractive();
    dimBg.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());

    const winBg = this.add.rectangle(0, 0, 380, 220, 0x0c0817, 0.97)
      .setStrokeStyle(2, 0xd4af37);

    const title = this.add.text(0, -82, '✦ OPCIONES DEL REINO ✦', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Audio Mute Toggle
    const isMuted = this.audio.getIsMuted();
    const audioBtn = this.add.rectangle(0, -32, 280, 30, 0x181126, 0.94)
      .setStrokeStyle(1.5, 0x6e4b8a)
      .setInteractive({ useHandCursor: true });

    const audioTxt = this.add.text(0, -32, isMuted ? 'SONIDO: [ 🔇 SILENCIADO ]' : 'SONIDO: [ 🔊 ACTIVADO ]', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: isMuted ? '#ff7777' : '#aaffaa',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    audioBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      const muted = this.audio.toggleMute();
      audioTxt.setText(muted ? 'SONIDO: [ 🔇 SILENCIADO ]' : 'SONIDO: [ 🔊 ACTIVADO ]');
      audioTxt.setColor(muted ? '#ff7777' : '#aaffaa');
    });

    // Fullscreen Toggle
    const fsBtn = this.add.rectangle(0, 16, 280, 30, 0x181126, 0.94)
      .setStrokeStyle(1.5, 0x6e4b8a)
      .setInteractive({ useHandCursor: true });

    const fsTxt = this.add.text(0, 16, 'PANTALLA COMPLETA: [ ALTERNAR ]', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffd700'
    }).setOrigin(0.5);

    fsBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    // Close button
    const closeBtn = this.add.text(0, 75, '[ VOLVER AL MENÚ ]', {
      fontFamily: 'monospace',
      fontSize: '9.5px',
      color: '#bba8d4',
      backgroundColor: '#1b1226',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => closeBtn.setColor('#ffd700'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#bba8d4'));
    closeBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.closeModal();
    });

    this.activeModalContainer.add([dimBg, winBg, title, audioBtn, audioTxt, fsBtn, fsTxt, closeBtn]);
  }

  // ==========================================
  // ==========================================
  // MODAL 3: INSTRUCCIONES Y CÓDICE DE COMBATE
  // ==========================================
  private showInstructionsModal(): void {
    this.closeModal();

    this.activeModalContainer = this.add.container(320, 180).setDepth(50);

    // Dim background covering entire canvas
    const dimBg = this.add.rectangle(0, 0, 640, 360, 0x040208, 0.85).setInteractive();
    dimBg.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());

    // Window frame
    const frameW = 540;
    const frameH = 296;
    const winBg = this.add.rectangle(0, 0, frameW, frameH, 0x090614, 0.98)
      .setStrokeStyle(2, 0xd4af37);

    const winInner = this.add.rectangle(0, 0, frameW - 8, frameH - 8)
      .setStrokeStyle(1, 0x472e5a);

    const title = this.add.text(0, -126, '✦ CÓDICE DE COMBATE, MANDOS Y CONTROLES ✦', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11.5px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sub = this.add.text(0, -110, 'Domina a Thomas y Khaterine en la lucha por Albion contra la oscuridad', {
      fontFamily: 'serif',
      fontSize: '8.5px',
      color: '#c5b4db',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    const dividerTop = this.add.rectangle(0, -98, frameW - 32, 1, 0x735591);

    // IMPORTANT: Add backgrounds and header FIRST so they stay behind all text!
    this.activeModalContainer.add([dimBg, winBg, winInner, title, sub, dividerTop]);

    // Columna 1: Combate & Movimiento 2.5D (X = -250)
    const col1X = -250;
    const headerCol1 = this.add.text(col1X, -90, '⚔ MOVIMIENTO Y COMBATE 2.5D', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    this.activeModalContainer.add(headerCol1);

    const col1Items = [
      { key: '[W, A, S, D] / Flechas', desc: 'Movimiento fluido en 8 direcciones y profundidad 2.5D en el escenario.' },
      { key: '[J]', desc: 'Ataque Ligero: Combo rápido de espada o proyectiles de magia rúnica.' },
      { key: '[K]', desc: 'Ataque Pesado: Quiebra posturas enemigas y absorbe su guardia.' },
      { key: '[L]', desc: 'Guardia táctica: Reduce un 80% del daño a costa de tu barra azul.' },
      { key: '[ESPACIO]', desc: 'Esquivar rodando: Otorga invulnerabilidad temporal y reposicionamiento.' },
      { key: '[T / Q]', desc: 'Lanzar arma: Aturde enemigos a distancia; luego lucha a puñetazos.' }
    ];

    col1Items.forEach((item, idx) => {
      const y = -72 + idx * 25;
      const keyText = this.add.text(col1X, y, item.key, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffdd6b',
        fontStyle: 'bold'
      });
      const descText = this.add.text(col1X, y + 10, item.desc, {
        fontFamily: 'sans-serif',
        fontSize: '7.5px',
        color: '#d5c7e8',
        wordWrap: { width: 235 }
      });
      this.activeModalContainer?.add([keyText, descText]);
    });

    // Columna 2: Táctica, Arsenal y Magia (X = +15)
    const col2X = 15;
    const headerCol2 = this.add.text(col2X, -90, '📜 TÁCTICA, DIÁLOGOS Y ARSENAL', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    this.activeModalContainer.add(headerCol2);

    const col2Items = [
      { key: '[TAB]', desc: 'Alternar al instante el héroe activo entre Thomas y Khaterine.' },
      { key: '[E]', desc: 'Interactuar: Habla con Elowen o Cedric, y recoge armas caídas o reliquias.' },
      { key: '[I]', desc: 'Inventario de Reliquias: Ver arsenal, tablillas proféticas y mejoras.' },
      { key: '[C]', desc: 'Diálogo de grupo: Consulta las impresiones tácticas de Khaterine y Shalem.' },
      { key: '[M]', desc: 'Minijuegos de Shalem: Desafíos del gato persa para regenerar maná.' },
      { key: '[P] / [ESC]', desc: 'Pausar la partida para contemplar el códice o ajustar sonido.' }
    ];

    col2Items.forEach((item, idx) => {
      const y = -72 + idx * 25;
      const keyText = this.add.text(col2X, y, item.key, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffdd6b',
        fontStyle: 'bold'
      });
      const descText = this.add.text(col2X, y + 10, item.desc, {
        fontFamily: 'sans-serif',
        fontSize: '7.5px',
        color: '#d5c7e8',
        wordWrap: { width: 235 }
      });
      this.activeModalContainer?.add([keyText, descText]);
    });

    // Separador central vertical
    const colSeparator = this.add.rectangle(0, 5, 1, 160, 0x3d2754);
    this.activeModalContainer.add(colSeparator);

    // Cuadro de consejo de Shalem al fondo
    const tipBg = this.add.rectangle(0, 92, frameW - 32, 22, 0x140e21, 0.92)
      .setStrokeStyle(1, 0x5a3e75);
    const tipText = this.add.text(0, 92, '💡 CONSEJO DE SHALEM: La barra azul de Guardia se regenera sola tras 2s sin recibir golpes.', {
      fontFamily: 'sans-serif',
      fontSize: '8px',
      color: '#98f5c4',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    this.activeModalContainer.add([tipBg, tipText]);

    // Botón para volver
    const closeBtn = this.add.text(0, 126, '[ VOLVER AL MENÚ ]', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#bba8d4',
      backgroundColor: '#1b1226',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => closeBtn.setColor('#ffd700'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#bba8d4'));
    closeBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.closeModal();
    });

    this.activeModalContainer.add(closeBtn);
  }

  // ==========================================
  // MODAL 4: CRÉDITOS
  // ==========================================
  private showCreditsModal(): void {
    this.closeModal();

    this.activeModalContainer = this.add.container(320, 180).setDepth(50);

    const dimBg = this.add.rectangle(0, 0, 640, 360, 0x040208, 0.85).setInteractive();
    dimBg.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());

    const frameW = 440;
    const frameH = 240;
    const winBg = this.add.rectangle(0, 0, frameW, frameH, 0x0c0817, 0.98)
      .setStrokeStyle(2, 0xd4af37);

    const winInner = this.add.rectangle(0, 0, frameW - 8, frameH - 8)
      .setStrokeStyle(1, 0x472e5a);

    const title = this.add.text(0, -92, '✦ THE LIGHT IN THE DARKNESS ✦', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '12px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const dividerTop = this.add.rectangle(0, -78, frameW - 40, 1, 0x735591);

    // IMPORTANT: Add backgrounds and header FIRST so they stay behind all text!
    this.activeModalContainer.add([dimBg, winBg, winInner, title, dividerTop]);

    const creditsLines = [
      'Dirección Creativa, Concepto & Sprites Originales: Kevin',
      'Arquitectura de Software: Domain-Driven Design (DDD)',
      'Motor de Renderizado: Phaser 3 + TypeScript + Vite',
      'Música & Efectos de Sonido: Sintetizador Procedural Web Audio',
      '',
      '«Solo la Oscuridad que elija amar será la única Luz en las Tinieblas»'
    ];

    creditsLines.forEach((line, idx) => {
      const isQuote = idx === 5;
      const t = this.add.text(0, -50 + idx * 22, line, {
        fontFamily: isQuote ? 'Cinzel, Georgia, serif' : 'sans-serif',
        fontSize: isQuote ? '9.5px' : '8.5px',
        color: isQuote ? '#ffd700' : '#d2c5e3',
        fontStyle: isQuote ? 'italic' : 'normal',
        align: 'center'
      }).setOrigin(0.5);
      this.activeModalContainer?.add(t);
    });

    const closeBtn = this.add.text(0, 92, '[ VOLVER AL MENÚ ]', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#bba8d4',
      backgroundColor: '#1b1226',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => closeBtn.setColor('#ffd700'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#bba8d4'));
    closeBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.closeModal();
    });

    this.activeModalContainer.add(closeBtn);
  }

  private closeModal(): void {
    if (this.activeModalContainer) {
      this.audio.playSfx('menu_select');
      this.activeModalContainer.destroy();
      this.activeModalContainer = undefined;
    }
  }

  private startGame(): void {
    SessionStateStore.getInstance().resetToDefaults(this.selectedCharacter, 1);
    this.audio.playSfx('dodge');
    this.cameras.main.fade(320, 0, 0, 0);
    this.time.delayedCall(340, () => {
      this.scene.start('StoryIntroScene', { characterId: this.selectedCharacter });
    });
  }

  // ==========================================
  // MODAL: SELECCIÓN DE ESCENARIO (CONTINUAR)
  // ==========================================
  private showScenarioSelectModal(checkpoint?: { characterId: string; scenarioIndex: number }): void {
    this.closeModal();

    this.activeModalContainer = this.add.container(320, 180).setDepth(55);

    const dimBg = this.add.rectangle(0, 0, 640, 360, 0x040208, 0.85).setInteractive();
    dimBg.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());

    const frameW = 500;
    const frameH = 310;
    const winBg = this.add.rectangle(0, 0, frameW, frameH, 0x0c0817, 0.98)
      .setStrokeStyle(2, 0xd4af37);
    const winInner = this.add.rectangle(0, 0, frameW - 8, frameH - 8)
      .setStrokeStyle(1, 0x5a3e75);

    const title = this.add.text(0, -132, '✦ ELEGIR ESCENARIO PARA CONTINUAR ✦', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    let activeCharId: CharacterId = (checkpoint && checkpoint.characterId === 'khaterine') ? 'khaterine' : 'thomas';

    // Character Switcher Pill
    const charPillBg = this.add.rectangle(0, -108, 320, 20, 0x1d132b)
      .setStrokeStyle(1, 0x7e5999)
      .setInteractive({ useHandCursor: true });

    const charPillText = this.add.text(0, -108, `LÍDER INICIAL: [ ${activeCharId.toUpperCase()} ] · Clic para alternar`, {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    charPillBg.on('pointerover', () => {
      charPillBg.setFillStyle(0x351b52);
      charPillBg.setStrokeStyle(1.5, 0xffd700);
      charPillText.setColor('#ffffff');
    });
    charPillBg.on('pointerout', () => {
      charPillBg.setFillStyle(0x1d132b);
      charPillBg.setStrokeStyle(1, 0x7e5999);
      charPillText.setColor('#ffd700');
    });
    charPillBg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.audio.playSfx('menu_select');
      activeCharId = activeCharId === 'thomas' ? 'khaterine' : 'thomas';
      charPillText.setText(`LÍDER INICIAL: [ ${activeCharId.toUpperCase()} ] · Clic para alternar`);
    });

    this.activeModalContainer.add([dimBg, winBg, winInner, title, charPillBg, charPillText]);

    const scenarios = [
      {
        act: 1,
        tag: 'ACTO I',
        name: 'OAKHAVEN (ALDEA EN LLAMAS)',
        sub: 'Caps I–VI · Piras de la Inquisición, Padre Cedric y Madre Morwenna'
      },
      {
        act: 2,
        tag: 'ACTO II',
        name: 'EL CAMPANARIO Y GRANERO DEL SUR',
        sub: 'Caps VII–IX · Elowen en la Celda, Pájaro de Madera y Crisol de Bronce'
      },
      {
        act: 3,
        tag: 'ACTO III',
        name: 'EL GRAN PUENTE DE PIEDRA',
        sub: 'Caps X–XIII · Camino de los Herejes, Refugiados y Capitán Áureo Vane'
      },
      {
        act: 4,
        tag: 'ACTO IV',
        name: 'LONDINIUM — LA CIUDADELA DORADA',
        sub: 'Caps XIV–XVII · Salón de los Espejos, Ley del Deseo y Rex Malphas (Alaric)'
      },
      {
        act: 5,
        tag: 'ACTO V',
        name: 'LA CATEDRAL INVERTIDA — EL ABISMO',
        sub: 'Caps XVIII–XX · Forja de Alba Gris, Juicio de Astaroth y Primer Amanecer'
      }
    ];

    const startY = -78;
    const rowH = 34;

    scenarios.forEach((s, idx) => {
      const cy = startY + idx * (rowH + 4);
      const isCheckpoint = !!(checkpoint && checkpoint.scenarioIndex === s.act);

      const rowBg = this.add.rectangle(0, cy, 460, rowH, isCheckpoint ? 0x2e1a42 : 0x160f24)
        .setStrokeStyle(isCheckpoint ? 1.5 : 1, isCheckpoint ? 0xffd700 : 0x5a3d75)
        .setInteractive({ useHandCursor: true });

      const tagText = this.add.text(-215, cy - 6, s.tag, {
        fontFamily: 'Cinzel, monospace',
        fontSize: '9px',
        color: isCheckpoint ? '#ffd700' : '#d2bfff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const nameText = this.add.text(-155, cy - 6, s.name, {
        fontFamily: 'Cinzel, sans-serif',
        fontSize: '8.5px',
        color: isCheckpoint ? '#ffffff' : '#e6dcfa',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const subText = this.add.text(-215, cy + 7, s.sub, {
        fontFamily: 'sans-serif',
        fontSize: '7px',
        color: isCheckpoint ? '#ffea9f' : '#8f7da8'
      }).setOrigin(0, 0.5);

      let badge: Phaser.GameObjects.Text | undefined;
      if (isCheckpoint) {
        badge = this.add.text(215, cy, '★ ÚLTIMO CHECKPOINT ★', {
          fontFamily: 'monospace',
          fontSize: '7.5px',
          color: '#ffd700',
          backgroundColor: '#4a2608',
          padding: { x: 4, y: 2 }
        }).setOrigin(1, 0.5);
      }

      rowBg.on('pointerover', () => {
        rowBg.setFillStyle(0x3d2059);
        rowBg.setStrokeStyle(1.5, 0xffe680);
        nameText.setColor('#ffffff');
      });
      rowBg.on('pointerout', () => {
        rowBg.setFillStyle(isCheckpoint ? 0x2e1a42 : 0x160f24);
        rowBg.setStrokeStyle(isCheckpoint ? 1.5 : 1, isCheckpoint ? 0xffd700 : 0x5a3d75);
        nameText.setColor(isCheckpoint ? '#ffffff' : '#e6dcfa');
      });

      rowBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation();
        this.audio.playSfx('menu_select');
        const session = SessionStateStore.getInstance();
        session.loadFromStorage();
        session.currentAct = s.act;
        session.leaderId = activeCharId;
        this.cameras.main.fade(300, 0, 0, 0);
        this.time.delayedCall(320, () => {
          const cfg = this.getContinueLoadingConfig(s.act);
          this.scene.start('LoadingScene', {
            targetScene: 'GameScene',
            targetData: {
              characterId: activeCharId,
              scenarioIndex: s.act
            },
            imageKey: cfg.image,
            chapterTitle: cfg.title,
            storyText: cfg.story,
            tipText: cfg.tip,
            minDurationMs: 2000
          });
        });
      });

      this.activeModalContainer?.add([rowBg, tagText, nameText, subText]);
      if (badge && this.activeModalContainer) this.activeModalContainer.add(badge);
    });

    // Close button
    const closeBtn = this.add.text(0, 130, '[ VOLVER AL MENÚ ]', {
      fontFamily: 'monospace',
      fontSize: '9.5px',
      color: '#bba8d4',
      backgroundColor: '#1b1226',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => closeBtn.setColor('#ffd700'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#bba8d4'));
    closeBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.closeModal();
    });

    this.activeModalContainer?.add(closeBtn);
  }

  /** Read the lightweight checkpoint from localStorage. Returns null if none. */
  private loadCheckpoint(): { characterId: string; scenarioIndex: number; timestamp: number } | null {
    try {
      const raw = localStorage.getItem('litd_checkpoint');
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && data.characterId && data.scenarioIndex) return data;
    } catch { /* corrupted or private browsing */ }
    return null;
  }

  /** Loading-screen config for resuming from a checkpoint. */
  private getContinueLoadingConfig(scenarioIndex: number): { image: string; title: string; story: string; tip: string } {
    const configs: Record<number, { image: string; title: string; story: string; tip: string }> = {
      1: {
        image: 'loading_pyre_remains',
        title: 'ACTO I — OAKHAVEN: LAS HOGUERAS DE LA INQUISICIÓN',
        story: '«Retomarás la lucha en las calles de Oakhaven. Los Acechadores de Ceniza y la Madre Morwenna siguen amenazando la aldea. Elowen te espera cerca del jardín.»',
        tip: '«Shalem: Habla con Elowen [E] para recibir su bendición y con el Padre Cedric para obtener el Rosario de Madera.»'
      },
      2: {
        image: 'loading_concept_art',
        title: 'ACTO II — EL CAMPANARIO Y EL GRANERO DEL SUR',
        story: '«Retomarás la gesta en el Campanario. Elowen resiste el tormento de la sal gruesa en lo alto de la torre. El Colmillo del Sauce Negro aguarda bajo la losa del granero.»',
        tip: '«Shalem: Elowen te entregará su pájaro de madera [E] con el mensaje que guiará la fuga hacia el norte.»'
      },
      3: {
        image: 'loading_bridge_journey',
        title: 'ACTO III — EL GRAN PUENTE: EL CAMINO DE LOS HEREJES',
        story: '«Retomarás el asedio en el Gran Puente de Piedra. El convoy de refugiados de Martín y Tobías intenta cruzar el desfiladero mientras el Capitán Áureo Vane bloquea el paso.»',
        tip: '«Táctica de Combate: Los caballeros áureos portan escudos de torre. ¡Usa ataques pesados [K] o contraataques con Parry [L]!»'
      },
      4: {
        image: 'loading_londinium_gate',
        title: 'ACTO IV — LONDINIUM: LA CIUDADELA DORADA',
        story: '«Retomarás el asalto a la Ciudadela Dorada. Elowen permanece encadenada en las mazmorras de Londinium. El Rex Malphas aguarda en su trono astral.»',
        tip: '«Shalem: Busca a Elowen en las mazmorras [E] antes de enfrentar al falso rey. ¡Su bendición te dará fuerzas!»'
      },
      5: {
        image: 'loading_shalem_wall',
        title: 'ACTO V — LA CATEDRAL INVERTIDA: EL SOL DEL ABISMO',
        story: '«Retomarás la batalla en la Catedral Invertida. Elowen ha sacrificado su Gota de Luz Divina para forjar Alba Gris. El demonio primordial Astaroth te espera.»',
        tip: '«Shalem: Habla con Elowen [E] antes del combate final. Su bendición despierta la Onda Sagrada en Alba Gris.»'
      }
    };
    return configs[scenarioIndex] || configs[1];
  }
}
