import Phaser from 'phaser';
import { CharacterId } from '../../domain/character/CharacterEnums';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';

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

  constructor() {
    super('TitleScene');
  }

  public init(): void {
    this.audio = WebAudioSoundAdapter.getInstance();
    this.isMenuOpen = false;
    this.currentMenuIndex = 0;
    this.menuButtons = [];
    this.activeModalContainer = undefined;
  }

  public create(): void {
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

    // 1. Button "Continuar · sin partida" (Disabled)
    const btnContinueBg = this.add.rectangle(0, -70, boxW - 20, 24, 0x0f0b1a, 0.8)
      .setStrokeStyle(1, 0x2b2238);

    const btnContinueText = this.add.text(0, -70, 'Continuar · sin partida', {
      fontFamily: 'sans-serif',
      fontSize: '9px',
      color: '#5e5570',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    this.menuContainer.add([btnContinueBg, btnContinueText]);

    // Menu Interactive Items Configuration
    const items = [
      {
        label: 'Nueva partida',
        action: () => this.showCharacterSelectModal()
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

    // Close button
    const closeBtn = this.add.text(0, 105, '[ VOLVER AL MENÚ ]', {
      fontFamily: 'monospace',
      fontSize: '9px',
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

    this.activeModalContainer.add([c1, c2, closeBtn]);
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

    const spr = this.add.image(0, -28, spriteKey).setDisplaySize(38, 68);

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
  // MODAL 3: INSTRUCCIONES
  // ==========================================
  private showInstructionsModal(): void {
    this.closeModal();

    this.activeModalContainer = this.add.container(320, 180).setDepth(50);

    const dimBg = this.add.rectangle(0, 0, 640, 360, 0x040208, 0.8).setInteractive();
    dimBg.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());

    const winBg = this.add.rectangle(0, 0, 480, 260, 0x0c0817, 0.97)
      .setStrokeStyle(2, 0xd4af37);

    const title = this.add.text(0, -110, '✦ CÓDICE DE COMBATE Y CONTROLES ✦', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const controls = [
      '• [W, A, S, D] o Flechas: Movimiento fluido en 2.5D (profundidad en el escenario)',
      '• [J]: Ataque Ligero con Espada / Magia rúnica',
      '• [K]: Golpe Pesado / Absorción de Guardia',
      '• [L]: Postura de Guardia táctica',
      '• [ESPACIO]: Esquivar rodando con invulnerabilidad temporal',
      '• [TAB]: Alternar al instante entre Thomas y Khaterine',
      '• [T / Q]: Lanzar el arma para aturdir enemigos',
      '• [E]: Recoger armas caídas / Charlar con Elowen para curarte',
      '• [C]: Charlar entre el grupo y escuchar a Shalem',
      '• [M]: Desbloquear Minijuegos de Shalem al subir de nivel',
      '• [P]: Menú de pausa y arsenal'
    ];

    controls.forEach((line, idx) => {
      const lineTxt = this.add.text(-220, -82 + idx * 16, line, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#e4d6f5'
      });
      this.activeModalContainer?.add(lineTxt);
    });

    const closeBtn = this.add.text(0, 108, '[ VOLVER AL MENÚ ]', {
      fontFamily: 'monospace',
      fontSize: '9px',
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

    this.activeModalContainer.add([dimBg, winBg, title, closeBtn]);
  }

  // ==========================================
  // MODAL 4: CRÉDITOS
  // ==========================================
  private showCreditsModal(): void {
    this.closeModal();

    this.activeModalContainer = this.add.container(320, 180).setDepth(50);

    const dimBg = this.add.rectangle(0, 0, 640, 360, 0x040208, 0.8).setInteractive();
    dimBg.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());

    const winBg = this.add.rectangle(0, 0, 420, 230, 0x0c0817, 0.97)
      .setStrokeStyle(2, 0xd4af37);

    const title = this.add.text(0, -90, '✦ THE LIGHT IN THE DARKNESS ✦', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

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
      const t = this.add.text(0, -55 + idx * 22, line, {
        fontFamily: isQuote ? 'serif' : 'sans-serif',
        fontSize: isQuote ? '9.5px' : '8.5px',
        color: isQuote ? '#ffd700' : '#d2c5e3',
        fontStyle: isQuote ? 'italic' : 'normal',
        align: 'center'
      }).setOrigin(0.5);
      this.activeModalContainer?.add(t);
    });

    const closeBtn = this.add.text(0, 85, '[ VOLVER AL MENÚ ]', {
      fontFamily: 'monospace',
      fontSize: '9px',
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

    this.activeModalContainer.add([dimBg, winBg, title, closeBtn]);
  }

  private closeModal(): void {
    if (this.activeModalContainer) {
      this.audio.playSfx('menu_select');
      this.activeModalContainer.destroy();
      this.activeModalContainer = undefined;
    }
  }

  private startGame(): void {
    this.audio.playSfx('dodge');
    this.cameras.main.fade(320, 0, 0, 0);
    this.time.delayedCall(340, () => {
      this.scene.start('StoryIntroScene', { characterId: this.selectedCharacter });
    });
  }
}
