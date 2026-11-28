import Phaser from 'phaser';
import { CharacterId } from '../../domain/character/CharacterEnums';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';
import { configureHDSceneCamera } from '../ui/CrispTextPipeline';

export class StoryIntroScene extends Phaser.Scene {
  private characterId: CharacterId = 'thomas';
  private audio!: WebAudioSoundAdapter;

  private currentSlideIndex: number = 0;
  private dialogText!: Phaser.GameObjects.Text;
  private slideIndicator!: Phaser.GameObjects.Text;

  private fullTextToType: string = '';
  private currentTypedLength: number = 0;
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private isTyping: boolean = false;

  private slides = [
    {
      title: 'I. EL MARQUÉS Y EL REINO DE ALBION',
      text: '«Permíteme ilustrarte, ingenuo mortal. Mi nombre es Shalem, antiguo Gran Marqués de las Brasas Susurrantes... reducido por azares del destino a convivir como un gato negro con monaguillos incapaces de abrir una lata de sardinas. Pero escucha con atención, pues la noche perpetua de Albion oculta verdades atroces tras el Cáliz Solar.»'
    },
    {
      title: 'II. LA NOCHE DE LA LUNA ROJA',
      text: '«Hace dieciocho años, en el Bosque del Sauce Negro, el brujo Alaric traicionó a su propio aquelarre por un trono de oro y pactó con el demonio Astaroth. Las brujas fueron sacrificadas y del ritual nació un niño: Thomas. Pero con su último aliento de amor, las hechiceras le otorgaron al recién nacido algo imprevisto: Libre Albedrío.»'
    },
    {
      title: 'III. LA CESTA DE MIMBRE Y EL SELLO DE CENIZA',
      text: '«Khaterine rescató a Thomas y a la pequeña Elowen, hija de su difunta amiga Lyra. Para proteger al niño de la Inquisición, Khaterine grabó el Sello de Ceniza en su pecho... pero la energía residual impregnó las mantas de Elowen, condenando a la niña a dieciocho años de crueles penitencias sobre sal gruesa como la falsa elegida.»'
    },
    {
      title: 'IV. EL ORÁCULO DEL ABISMO',
      text: '«"De las cenizas del Abismo brotará una semilla de dos sangres... Pues cuando el trono de oro se pudra y el cielo llore ceniza, solo la Oscuridad que elija amar será la única Luz en las Tinieblas". ¡Despierta, Thomas! Tu sangre no decide quién eres... ¡ha llegado la hora de elegir tu destino!»'
    }
  ];

  constructor() {
    super('StoryIntroScene');
  }

  public init(data: { characterId?: CharacterId }): void {
    this.characterId = data.characterId || 'thomas';
    this.audio = WebAudioSoundAdapter.getInstance();
    this.currentSlideIndex = 0;
  }

  public create(): void {
    configureHDSceneCamera(this);
    // 1. Atmospheric Gothic Background
    this.add.image(320, 180, 'bg_oakhaven').setDisplaySize(640, 360).setAlpha(0.45);

    // Dark vignette overlay
    this.add.image(320, 180, 'fx_vignette').setDisplaySize(640, 360).setAlpha(0.85);

    // Ambient floating embers & fog
    this.add.particles(320, 240, 'particle_ember', {
      speedX: { min: -20, max: 20 },
      speedY: { min: -30, max: -70 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 2500,
      frequency: 250
    });

    // 2. Center Stage: Shalem on Ancient Pedestal (Animated Sprite from Visual Pack)
    this.add.rectangle(320, 160, 100, 35, 0x1b1429).setStrokeStyle(1, 0x7a5a3a);
    const shalemKey = this.textures.exists('shalem_sit_idle') ? 'shalem_sit_idle' : 'shalem_cat';
    const shalemSprite = this.add.sprite(320, 146, shalemKey, 0).setOrigin(0.5, 1).setScale(2.1);
    if (this.anims.exists('shalem_sit_idle')) {
      shalemSprite.play('shalem_sit_idle');
    }

    // Subtle breathing animation for Shalem
    this.tweens.add({
      targets: shalemSprite,
      scaleY: 2.26,
      y: 142,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Pedestal runes
    this.add.text(320, 160, '✦ SHALEM ✦', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // 3. Skip Intro Button (Top Right)
    const skipBtn = this.add.text(615, 18, 'SALTAR INTRO [ESC] >>', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#cbb8e0',
      backgroundColor: 'rgba(20, 12, 33, 0.85)',
      padding: { x: 8, y: 4 }
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerover', () => skipBtn.setColor('#ffd700'));
    skipBtn.on('pointerout', () => skipBtn.setColor('#cbb8e0'));
    skipBtn.on('pointerdown', () => this.startGameplay());

    // 4. Large Story Dialogue Box (Bottom)
    this.add.rectangle(320, 280, 580, 120, 0x110c1c, 0.94).setStrokeStyle(2, 0xd4af37);
    this.add.rectangle(320, 280, 572, 112, 0x000000, 0).setStrokeStyle(1, 0x5a3e75);

    // Shalem Portrait inside Dialog Box
    this.add.image(62, 275, 'portrait_shalem').setDisplaySize(72, 72);

    // Speaker Name Banner
    this.add.text(105, 230, 'SHALEM — GRAN MARQUÉS DE LAS BRASAS', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '10.5px',
      color: '#ffd700',
      fontStyle: 'bold'
    });

    // Slide Title Indicator
    this.slideIndicator = this.add.text(585, 230, '1 / 4', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#c2b0d6'
    }).setOrigin(1, 0);

    // Dialogue Body Text
    this.dialogText = this.add.text(105, 250, '', {
      fontFamily: 'serif',
      fontSize: '11px',
      color: '#f0e6ff',
      wordWrap: { width: 480 },
      lineSpacing: 4
    });

    // Advance Button
    const nextBtn = this.add.text(585, 325, 'CONTINUAR [ESPACIO / CLIC] ▶', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ffd700',
      backgroundColor: '#2e1d42',
      padding: { x: 8, y: 3 }
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    nextBtn.on('pointerdown', () => this.handleAdvance());

    // 5. Input Controls
    this.input.keyboard?.on('keydown-SPACE', () => this.handleAdvance());
    this.input.keyboard?.on('keydown-ENTER', () => this.handleAdvance());
    this.input.keyboard?.on('keydown-ESC', () => this.startGameplay());
    this.input.keyboard?.on('keydown-S', () => this.startGameplay());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.worldY > 200) {
        this.handleAdvance();
      }
    });

    // Play BGM and start first slide
    this.audio.playBgm('bgm_oakhaven_night');
    this.showSlide(0);
  }

  private showSlide(index: number): void {
    if (index >= this.slides.length) {
      this.startGameplay();
      return;
    }

    this.currentSlideIndex = index;
    const slide = this.slides[index];

    this.slideIndicator.setText(`${index + 1} / ${this.slides.length} — ${slide.title}`);
    this.fullTextToType = slide.text;
    this.currentTypedLength = 0;
    this.dialogText.setText('');
    this.isTyping = true;

    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
    }

    this.audio.playSfx('dodge');

    this.typewriterTimer = this.time.addEvent({
      delay: 24,
      repeat: this.fullTextToType.length - 1,
      callback: () => {
        this.currentTypedLength++;
        this.dialogText.setText(this.fullTextToType.substring(0, this.currentTypedLength));
        if (this.currentTypedLength >= this.fullTextToType.length) {
          this.isTyping = false;
        }
      }
    });
  }

  private handleAdvance(): void {
    if (this.isTyping) {
      // Complete current typing instantly
      if (this.typewriterTimer) this.typewriterTimer.remove();
      this.dialogText.setText(this.fullTextToType);
      this.isTyping = false;
    } else {
      // Move to next slide
      this.showSlide(this.currentSlideIndex + 1);
    }
  }

  private startGameplay(): void {
    this.audio.playFinisherSound(false);
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(320, () => {
      this.scene.start('LoadingScene', {
        targetScene: 'GameScene',
        targetData: { characterId: this.characterId, scenarioIndex: 1 },
        imageKey: 'loading_pyre_remains',
        chapterTitle: 'ACTO I — OAKHAVEN: LAS HOGUERAS DE LA INQUISICIÓN',
        storyText: '«Al cumplir dieciocho años, la Inquisición marchó sobre la aldea de Oakhaven para arrebatar a Elowen creyéndola el fruto maldito. Thomas despertó el fuego negro en su espada para salvarla, amparado por el Padre Cedric y Khaterine frente a la Abadesa Morwenna.»',
        tipText: '«Khaterine: No te apartes del camino empedrado. Los acechadores vigilan la niebla.»',
        minDurationMs: 2000
      });
    });
  }
}
