import Phaser from 'phaser';

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
  private tipText: string = '«Consejo de Shalem: Esquivar con [L] te otorga invulnerabilidad breve. ¡Aprovéchala!»';
  private minDurationMs: number = 2000;

  private progressBarFill!: Phaser.GameObjects.Rectangle;
  private percentText!: Phaser.GameObjects.Text;
  private bgImage!: Phaser.GameObjects.Image;

  private tipsPool: string[] = [
    '«Consejo de Shalem: Si lanzas tu arma con [T], recuerda recogerla con [E] antes de que te arranquen las orejas.»',
    '«Códice de Albion: La Iglesia del Cáliz Solar afirma que Thomas es un monstruo para ocultar sus propios pactos.»',
    '«Táctica de Combate: Alterna entre el modo Duelista [K] y combos continuos con [J] para maximizar tu daño.»',
    '«Consejo de Shalem: La barra de Level Up desbloquea mis minijuegos con [M]. Responder bien te dará armas legendarias.»',
    '«Códice de Albion: Khaterine finge ser novicia para proteger a Thomas del fuego de la Inquisición.»',
    '«Táctica de Combate: Si te rompen la guardia, quedarás desarmado temporalmente peleando a puños.»'
  ];

  constructor() {
    super('LoadingScene');
  }

  public init(data: LoadingSceneConfig): void {
    if (data.targetScene) this.targetScene = data.targetScene;
    if (data.targetData) this.targetData = data.targetData;
    if (data.imageKey) this.imageKey = data.imageKey;
    if (data.chapterTitle) this.chapterTitle = data.chapterTitle;
    if (data.minDurationMs) this.minDurationMs = data.minDurationMs;

    this.tipText = data.tipText || this.tipsPool[Math.floor(Math.random() * this.tipsPool.length)];
  }

  public preload(): void {
    // Load high-resolution artwork images from public folder if not already cached
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
    // Select background art (fallback to bg_oakhaven if loading image key isn't loaded yet)
    const activeKey = this.textures.exists(this.imageKey) ? this.imageKey : 'bg_oakhaven';
    this.bgImage = this.add.image(320, 180, activeKey).setDisplaySize(640, 360).setOrigin(0.5);

    // Subtle Ken Burns slow zoom-in animation
    this.tweens.add({
      targets: this.bgImage,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 5000,
      ease: 'Sine.easeInOut'
    });

    // Dark cinematic vignette overlay
    this.add.image(320, 180, 'fx_vignette').setDisplaySize(640, 360).setAlpha(0.85);

    // Bottom dark gradient banner for text readability
    const bottomBanner = this.add.rectangle(320, 310, 640, 100, 0x050308, 0.88);
    bottomBanner.setStrokeStyle(1, 0x5a3e75);

    // Chapter Header
    this.add.text(320, 275, `✦ ${this.chapterTitle} ✦`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Tip Lore Text
    this.add.text(320, 298, this.tipText, {
      fontFamily: 'serif',
      fontSize: '9.5px',
      color: '#e2d4f0',
      fontStyle: 'italic',
      align: 'center',
      wordWrap: { width: 560 }
    }).setOrigin(0.5);

    // Progress Bar Container
    const barWidth = 380;
    const barX = (640 - barWidth) / 2;
    const barY = 328;

    this.add.rectangle(barX, barY, barWidth, 7, 0x140e21).setOrigin(0, 0.5).setStrokeStyle(1, 0xd4af37);
    this.progressBarFill = this.add.rectangle(barX, barY, 0, 7, 0xffd700).setOrigin(0, 0.5);

    // Percentage & Loading Label
    this.percentText = this.add.text(320, 345, 'CARGANDO DESTINO... 0%', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#c2b0d6'
    }).setOrigin(0.5);

    // Simulated smooth progress tween
    const progressObj = { value: 0 };
    this.tweens.add({
      targets: progressObj,
      value: 100,
      duration: this.minDurationMs,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        const val = Math.round(progressObj.value);
        this.progressBarFill.width = (barWidth * val) / 100;
        this.percentText.setText(`CARGANDO DESTINO... ${val}%`);
      },
      onComplete: () => {
        this.cameras.main.fade(300, 0, 0, 0);
        this.time.delayedCall(320, () => {
          this.scene.start(this.targetScene, this.targetData);
        });
      }
    });
  }
}
