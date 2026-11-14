import Phaser from 'phaser';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';

export interface LoadingSceneConfig {
  targetScene: string;
  targetData?: Record<string, unknown>;
  imageKey?: string;
  chapterTitle?: string;
  tipText?: string;
  minDurationMs?: number;
}

export class LoadingScene extends Phaser.Scene {
  private targetScene: string = 'TitleScene';
  private targetData: Record<string, unknown> = {};
  private imageKey: string = 'loading_shalem_wall';
  private chapterTitle: string = 'ALBION — EDAD MEDIA OSCURA';
  private tipText: string = '«Consejo de Shalem: Esquivar con [Espacio] te otorga invulnerabilidad breve. ¡Aprovéchala!»';
  private minDurationMs: number = 2000;

  private isLoaded: boolean = false;
  private isTransitioning: boolean = false;

  private bgImage!: Phaser.GameObjects.Image;
  private progressBarFill!: Phaser.GameObjects.Rectangle;
  private percentText!: Phaser.GameObjects.Text;
  private promptContainer!: Phaser.GameObjects.Container;
  private promptTween?: Phaser.Tweens.Tween;

  private keyEnter!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  private tipsPool: string[] = [
    '«Consejo de Shalem: Tu barra azul de GUARDIA absorbe el daño antes que tu vida. ¡Espera 2 segundos sin golpes para que se regenere sola!»',
    '«Códice de Albion: Khaterine y Thomas comparten el mismo destino. Pulsa [TAB] en cualquier momento para alternar quién lidera el combate.»',
    '«Táctica de Combate: Muévete en 2.5D con WASD para flanquear a los monjes inquisidores y evitar quedar acorralado.»',
    '«Consejo de Shalem: Si lanzas tu espada con [T] aturdirás a los enemigos. ¡Luego corre con [E] para recuperarla o pelea a puños!»',
    '«Códice de Albion: En Oakhaven, la joven Elowen cuida el huerto. Pulsa [E] junto a ella para escucharla y recibir su bendición curativa.»',
    '«Consejo de Shalem: La barra de Level Up desbloquea mis minijuegos con [M]. ¡Responder con sabiduría te otorgará armas de leyenda!»',
    '«Códice de Albion: El Rex Malphas gobierna la Ciudadela Dorada con decretos tiránicos que alteran la propia realidad.»'
  ];

  constructor() {
    super('LoadingScene');
  }

  public init(data: LoadingSceneConfig): void {
    this.isLoaded = false;
    this.isTransitioning = false;

    if (data.targetScene) this.targetScene = data.targetScene;
    if (data.targetData) this.targetData = data.targetData;
    if (data.imageKey) this.imageKey = data.imageKey;
    if (data.chapterTitle) this.chapterTitle = data.chapterTitle;
    if (data.minDurationMs) this.minDurationMs = data.minDurationMs;

    this.tipText = data.tipText || this.tipsPool[Math.floor(Math.random() * this.tipsPool.length)];
  }

  public preload(): void {
    // Ensure all 5 high-resolution artwork images are cached
    if (!this.textures.exists('loading_shalem_wall')) {
      this.load.image('loading_shalem_wall', '/assets/loading/loading_shalem_wall.jpg');
    }
    if (!this.textures.exists('loading_bridge_journey')) {
      this.load.image('loading_bridge_journey', '/assets/loading/loading_bridge_journey.jpg');
    }
    if (!this.textures.exists('loading_londinium_gate')) {
      this.load.image('loading_londinium_gate', '/assets/loading/loading_londinium_gate.jpg');
    }
    if (!this.textures.exists('loading_pyre_remains')) {
      this.load.image('loading_pyre_remains', '/assets/loading/loading_pyre_remains.jpg');
    }
    if (!this.textures.exists('loading_concept_art')) {
      this.load.image('loading_concept_art', '/assets/loading/loading_concept_art.jpg');
    }
  }

  public create(): void {
    // 1. Background Artwork (Crisp, High-Resolution 640x360)
    const activeKey = this.textures.exists(this.imageKey) ? this.imageKey : 'bg_oakhaven';
    this.bgImage = this.add.image(320, 180, activeKey).setDisplaySize(640, 360).setOrigin(0.5).setDepth(0);

    // Subtle Ken Burns slow zoom animation
    this.tweens.add({
      targets: this.bgImage,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 8000,
      ease: 'Sine.easeInOut'
    });

    // 2. Atmospheric Dark Vignette Overlay
    this.add.image(320, 180, 'fx_vignette').setDisplaySize(640, 360).setAlpha(0.65).setDepth(2);

    // 3. Delicate Top Header Badge
    this.add.rectangle(320, 16, 460, 20, 0x06030c, 0.82)
      .setStrokeStyle(1, 0x5a3e75)
      .setDepth(3);

    this.add.text(320, 16, '✦ REINO DE ALBION — CRÓNICAS DE LA LUZ Y LA OSCURIDAD ✦', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '8px',
      color: '#ffd700',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(4);

    // 4. Elegant Bottom Narrative Card Frame
    const cardX = 320;
    const cardY = 296;
    const cardWidth = 590;
    const cardHeight = 98;

    // Outer Obsidian Glass Plate
    this.add.rectangle(cardX, cardY, cardWidth, cardHeight, 0x07040e, 0.93)
      .setStrokeStyle(1.5, 0xb8923b)
      .setDepth(5);

    // Inner Gothic Fillet Border
    this.add.rectangle(cardX, cardY, cardWidth - 8, cardHeight - 8)
      .setStrokeStyle(1, 0x3d2554)
      .setDepth(6);

    // Chapter / Act Title
    this.add.text(cardX, cardY - 36, `✦ ${this.chapterTitle.toUpperCase()} ✦`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '10px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(7);

    // Lore / Tip Text with elegant word wrap
    this.add.text(cardX, cardY - 14, this.tipText, {
      fontFamily: 'serif',
      fontSize: '9px',
      color: '#e7d8f5',
      fontStyle: 'italic',
      align: 'center',
      wordWrap: { width: 550 }
    }).setOrigin(0.5).setDepth(7);

    // 5. Progress Bar
    const barWidth = 360;
    const barX = (640 - barWidth) / 2;
    const barY = cardY + 14;

    this.add.rectangle(320, barY, barWidth, 6, 0x140c24)
      .setStrokeStyle(1, 0x735591)
      .setDepth(7);

    this.progressBarFill = this.add.rectangle(barX, barY, 0, 6, 0xffd700)
      .setOrigin(0, 0.5)
      .setDepth(8);

    // 6. Status Text (Visible while loading)
    this.percentText = this.add.text(320, cardY + 34, 'INSCRIBIENDO RUNAS... 0%', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#bfa8d6'
    }).setOrigin(0.5).setDepth(9);

    // 7. Interactive Prompt Button Container (Visible only when 100% loaded!)
    this.promptContainer = this.add.container(320, cardY + 34).setDepth(10).setVisible(false);

    const btnBg = this.add.rectangle(0, 0, 320, 20, 0x241138, 0.96)
      .setStrokeStyle(1.5, 0xffd700)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(0, 0, '⚔ PULSA ENTER O HAZ CLIC PARA ENTRAR ⚔', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '8.5px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.promptContainer.add([btnBg, btnText]);

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x4a2278);
      btnText.setColor('#ffffff');
    });

    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x241138);
      btnText.setColor('#ffd700');
    });

    btnBg.on('pointerdown', () => this.proceedToTargetScene());

    // Fullscreen click backup
    this.input.on('pointerdown', () => {
      if (this.isLoaded) {
        this.proceedToTargetScene();
      }
    });

    // 8. Keyboard Controls
    if (this.input.keyboard) {
      this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // 9. Smooth Progress Tween
    const progressObj = { value: 0 };
    this.tweens.add({
      targets: progressObj,
      value: 100,
      duration: this.minDurationMs,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        const val = Math.round(progressObj.value);
        this.progressBarFill.width = (barWidth * val) / 100;
        this.percentText.setText(`INSCRIBIENDO RUNAS SAGRADAS... ${val}%`);
      },
      onComplete: () => {
        // Complete the bar cleanly
        this.progressBarFill.width = barWidth;
        this.isLoaded = true;

        // Hide loading text and show interactive prompt
        this.percentText.setVisible(false);
        this.promptContainer.setVisible(true);

        // Play gentle ready chime
        WebAudioSoundAdapter.getInstance().playSfx('menu_select');

        // Animated breathing pulse on the prompt button
        this.promptTween = this.tweens.add({
          targets: this.promptContainer,
          alpha: 0.55,
          scaleX: 0.98,
          scaleY: 0.98,
          duration: 650,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });
  }

  public update(): void {
    if (this.isLoaded && !this.isTransitioning) {
      if (
        (this.keyEnter && Phaser.Input.Keyboard.JustDown(this.keyEnter)) ||
        (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace))
      ) {
        this.proceedToTargetScene();
      }
    }
  }

  private proceedToTargetScene(): void {
    if (!this.isLoaded || this.isTransitioning) return;
    this.isTransitioning = true;

    if (this.promptTween) {
      this.promptTween.stop();
    }

    WebAudioSoundAdapter.getInstance().playSfx('dodge');
    this.cameras.main.fade(360, 0, 0, 0);

    this.time.delayedCall(380, () => {
      this.scene.start(this.targetScene, this.targetData);
    });
  }
}
