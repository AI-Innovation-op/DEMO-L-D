import Phaser from 'phaser';
import { CharacterId } from '../../domain/character/CharacterEnums';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';
import { configureHDSceneCamera } from '../ui/CrispTextPipeline';

export interface CinematicSlide {
  title: string;
  speaker: string;
  portraitKey: string;
  bgKey?: string;
  text: string;
}

export interface CinematicSceneData {
  actTransition: 1 | 2 | 3 | 4 | 5;
  targetAct?: number;
  characterId?: CharacterId;
}

export class CinematicScene extends Phaser.Scene {
  private actTransition: 1 | 2 | 3 | 4 | 5 = 1;
  private targetAct: number = 2;
  private characterId: CharacterId = 'thomas';
  private audio!: WebAudioSoundAdapter;

  private currentSlideIndex: number = 0;
  private slides: CinematicSlide[] = [];

  // Visual Elements
  private bgImage!: Phaser.GameObjects.Image;
  private artworkImage!: Phaser.GameObjects.Image;
  private titleText!: Phaser.GameObjects.Text;
  private speakerText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private indicatorText!: Phaser.GameObjects.Text;

  // Typewriter state
  private fullText: string = '';
  private currentTyped: number = 0;
  private typeTimer?: Phaser.Time.TimerEvent;
  private isTyping: boolean = false;

  constructor() {
    super('CinematicScene');
  }

  public init(data: CinematicSceneData): void {
    this.actTransition = data.actTransition || 1;
    this.targetAct = data.targetAct || (this.actTransition + 1);
    this.characterId = data.characterId || 'thomas';
    this.audio = WebAudioSoundAdapter.getInstance();
    this.currentSlideIndex = 0;
    this.slides = this.buildSlidesForTransition(this.actTransition);
  }

  private buildSlidesForTransition(trans: 1 | 2 | 3 | 4 | 5): CinematicSlide[] {
    if (trans === 1) {
      // Transition from Act I (Oakhaven) to Act II (El Campanario y Granero)
      return [
        {
          title: 'CAPÍTULO VI — EL HUMO SOBRE OAKHAVEN',
          speaker: 'KHATERINE',
          portraitKey: 'morwenna_crucible',
          bgKey: 'bg_oakhaven',
          text: '«La pira de Oakhaven ha sido derribada. La maza de la Inquisición yace rota en el barro, pero la victoria fue una trampa: mientras Thomas combatía, los inquisidores encerraron a Elowen en la torre del campanario, preparándola para la sal y el crisol de bronce.»'
        },
        {
          title: 'CAPÍTULO VII — LA LUZ TRAS LOS BARROTES',
          speaker: 'ELOWEN',
          portraitKey: 'elowen_campanario',
          bgKey: 'bg_belltower',
          text: '«En lo alto de la torre del campanario, Elowen contempla los dieciocho inviernos marcados en la piedra fría. Morwenna intentó purgarla con el crisol de bronce, pero la luz plateada de Elowen lo redujo a polvo. Con sus últimas fuerzas, ata una tira de lino al pájaro de madera: "Londinium es sacrificio. Reja suelta."»'
        },
        {
          title: 'CAPÍTULO VIII — EL COLMILLO DEL SAUCE NEGRO',
          speaker: 'KHATERINE',
          portraitKey: 'portrait_khaterine',
          bgKey: 'bg_belltower',
          text: '«Al otro lado del patio, en el granero en sombras, Khaterine retira la venda de su brazo y levanta la losa oculta. Empuña las dos hojas curvas del Colmillo del Sauce Negro y toca el chal de Lyra: "La hora de escondernos ha terminado, Shalem. Esta noche quebramos la torre."»'
        }
      ];
    } else if (trans === 2) {
      // Transition from Act II (El Campanario) to Act III (El Gran Puente de Piedra)
      return [
        {
          title: 'CAPÍTULO IX — LA FUGA POR EL PORTILLO',
          speaker: 'THOMAS',
          portraitKey: 'portrait_thomas',
          bgKey: 'bg_belltower',
          text: '«El cerrojo del portillo cede. Guiando a Elowen y resguardando a los campesinos de Martín y Tobías, el grupo escapa hacia el norte bajo la niebla. El pájaro de madera reposa en las manos de Thomas como símbolo de una promesa que no se romperá.»'
        },
        {
          title: 'CAPÍTULO X — LA MARCHA DE LOS DESTERRADOS',
          speaker: 'ELOWEN',
          portraitKey: 'portrait_elowen',
          bgKey: 'bg_bridge',
          text: '«El río ruge en las profundidades del desfiladero. Ante nosotros se alza el monumental Gran Puente de Piedra: la única vía hacia Londinium, iluminada por farolas de aceite y custodiada por la vanguardia de la Inquisición.»'
        },
        {
          title: 'CAPÍTULO XI — EL MURO DE ESCUDOS ÁUREOS',
          speaker: 'SHALEM',
          portraitKey: 'portrait_shalem',
          bgKey: 'bg_bridge',
          text: '«El Capitán Áureo Vane y sus caballeros bloquean el paso con escudos de torre y lanzas bendecidas. Dicen defender el reino; pero solo son títeres de un rey que vendió su trono al engaño. ¡Rompe sus escudos, muchacho!»'
        }
      ];
    } else if (trans === 3) {
      // Transition from Act III (El Gran Puente) to Act IV (Londinium — Ciudadela Dorada)
      return [
        {
          title: 'CAPÍTULO XII — EL RESCATE EN EL PUENTE',
          speaker: 'THOMAS',
          portraitKey: 'portrait_thomas',
          bgKey: 'bg_bridge',
          text: '«El Capitán Vane ha sido derribado y los carros de prisioneros han quedado libres. Los refugiados de Oakhaven quedan al resguardo de Martín en las granjas del sur. Nuestro camino ahora solo apunta hacia arriba: las puertas doradas de Londinium se abren ante nosotros.»'
        },
        {
          title: 'CAPÍTULO XIII — LA CIUDADELA DEL ENGAÑO',
          speaker: 'KHATERINE',
          portraitKey: 'portrait_khaterine',
          bgKey: 'bg_londinium',
          text: '«Londinium brilla con el oropel del Cáliz Solar, pero su pueblo vive aterrorizado por falsas profecías. En los pasillos de mármol del palacio, el Rey Malphas nos espera rodeado de espejos que reflejan destinos robados.»'
        },
        {
          title: 'CAPÍTULO XIV — EL SALÓN ASTRAL',
          speaker: 'SHALEM',
          portraitKey: 'portrait_shalem',
          bgKey: 'bg_londinium',
          text: '«Shalem olfatea el aire del trono con desagrado: "Huelo a Alaric... Tu antiguo maestro no murió en la Luna Roja, novicia. Se coronó rey para alimentarse del miedo de este mundo. Que no quede un solo espejo entero."»'
        }
      ];
    } else if (trans === 4) {
      // Transition from Act IV (Londinium) to Act V (Catedral Invertida)
      return [
        {
          title: 'CAPÍTULO XVII — EL REY DE LOS ESPEJOS',
          speaker: 'REX MALPHAS (ALARIC)',
          portraitKey: 'portrait_malphas',
          bgKey: 'bg_londinium',
          text: '«Rex Malphas yace en el suelo del salón astral. Bajo la corona destrozada asoma el rostro de Alaric, el mentor del Sauce Negro que sacrificó a sus hermanas por un pacto cósmico: "No tuve que obligarlos a odiarte, Thomas... solo tuve que enseñarles a temerte. Y ellos hicieron el resto."»'
        },
        {
          title: 'CAPÍTULO XVIII — LA FRACTURA DE LA REALIDAD',
          speaker: 'KHATERINE',
          portraitKey: 'portrait_khaterine',
          bgKey: 'bg_cathedral',
          text: '«Con la muerte del monarca, los decretos de la realidad colapsan. Las torres doradas de Londinium se quiebran y el suelo se disuelve en una sima sin fondo. Ante ellos se revela la Catedral Invertida: un santuario cósmico suspendido sobre un abismo de tinieblas perpetuas.»'
        },
        {
          title: 'CAPÍTULO XIX — EL PADRE DE LAS CENIZAS',
          speaker: 'SHALEM',
          portraitKey: 'portrait_shalem',
          bgKey: 'bg_cathedral',
          text: '«Shalem contempla el abismo con reverencia solemne: "Astaroth despierta en el fondo del templo, muchacho. La hora de las mentiras ha terminado. Esta noche sabremos si el fuego de tu espada será la tumba de Albion... o la única Luz en las Tinieblas."»'
        }
      ];
    } else {
      // Epilogue: Act V Victory
      return [
        {
          title: 'CAPÍTULO XX — LA MUERTE DEL SOL DEL ABISMO',
          speaker: 'THOMAS',
          portraitKey: 'portrait_astaroth',
          bgKey: 'bg_cathedral',
          text: '«Astaroth ruge mientras su forma primordial se disuelve en cenizas cósmicas que se extinguen en la nada. La Catedral Invertida se desintegra en polvo de estrellas. El dogma del Cáliz Solar y el pacto de sangre quedan rotos para siempre.»'
        },
        {
          title: 'EPÍLOGO I — LA PROMESA CUMPLIDA',
          speaker: 'ELOWEN',
          portraitKey: 'elowen_campanario',
          bgKey: 'bg_oakhaven',
          text: '«En el silencio del nuevo mundo, la voz de Elowen resuena con infinita dulzura desde el filo de Alba Gris: "Prometimos que encontraríamos la luz juntos, Thomas... y aquí está". La gota de luz divina asciende hacia el firmamento, disipando la niebla de dieciocho inviernos.»'
        },
        {
          title: 'EPÍLOGO II — EL PRIMER AMANECER',
          speaker: 'SHALEM',
          portraitKey: 'portrait_shalem',
          bgKey: 'bg_oakhaven',
          text: '«Por primera vez en generaciones, los primeros rayos de un sol dorado y cálido bañan las colinas de Oakhaven y los campos de Albion. Thomas enfunda su espada. Shalem bosteza sobre su hombro: "Bueno, muchacho... ahora sí que nos hemos ganado ese plato de sardinas".»'
        }
      ];
    }
  }

  public create(): void {
    configureHDSceneCamera(this);
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // 1. Background image
    const initialBg = this.slides[0]?.bgKey || 'bg_oakhaven';
    this.bgImage = this.add.image(320, 180, initialBg).setDisplaySize(640, 360).setAlpha(0.38);

    // Vignette & particles
    this.add.image(320, 180, 'fx_vignette').setDisplaySize(640, 360).setAlpha(0.85);

    this.add.particles(320, 260, 'particle_ember', {
      speedX: { min: -15, max: 15 },
      speedY: { min: -20, max: -50 },
      scale: { start: 0.8, end: 0.1 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 2800,
      frequency: 300
    });

    // 2. Center/Left Stage: Artwork Presentation
    this.add.rectangle(135, 140, 150, 150, 0x140e21, 0.95)
      .setStrokeStyle(2, 0xd4af37);
    this.add.rectangle(135, 140, 144, 144, 0x000000, 0).setStrokeStyle(1, 0x5a3e75);

    this.artworkImage = this.add.image(135, 140, this.slides[0].portraitKey).setDisplaySize(140, 140);

    // 3. Skip Button (Top Right)
    const skipBtn = this.add.text(615, 18, 'SALTAR [ESC] >>', {
      fontFamily: 'monospace',
      fontSize: '9.5px',
      color: '#cbb8e0',
      backgroundColor: 'rgba(20, 12, 33, 0.85)',
      padding: { x: 7, y: 3 }
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerover', () => skipBtn.setColor('#ffd700'));
    skipBtn.on('pointerout', () => skipBtn.setColor('#cbb8e0'));
    skipBtn.on('pointerdown', () => this.finishCinematic());

    // 4. Slide Indicator (Top Center)
    this.indicatorText = this.add.text(320, 18, '', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8.5px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // 5. Right Area: Title & Narrative Box
    this.titleText = this.add.text(230, 48, '', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 2,
      fontStyle: 'bold'
    });

    this.speakerText = this.add.text(230, 68, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#b094db',
      fontStyle: 'bold'
    });

    // Body Container
    this.add.rectangle(425, 155, 390, 130, 0x110c1c, 0.95)
      .setStrokeStyle(1.5, 0xd4af37);
    this.add.rectangle(425, 155, 384, 124, 0x000000, 0)
      .setStrokeStyle(1, 0x4e2f6b);

    this.bodyText = this.add.text(240, 100, '', {
      fontFamily: 'serif',
      fontSize: '10.5px',
      color: '#f0e6ff',
      wordWrap: { width: 370 },
      lineSpacing: 4
    });

    // Prompt to advance
    this.add.text(605, 235, '[ESPACIO / ENTER] Siguiente ▶', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#ffd700',
      backgroundColor: '#26153b',
      padding: { x: 6, y: 3 }
    }).setOrigin(1, 0.5);

    // Keyboard handlers
    this.input.keyboard?.on('keydown-SPACE', () => this.handleAdvance());
    this.input.keyboard?.on('keydown-ENTER', () => this.handleAdvance());
    this.input.keyboard?.on('keydown-ESC', () => this.finishCinematic());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.worldX < 550 || pointer.worldY > 40) {
        this.handleAdvance();
      }
    });

    // Render first slide
    this.showSlide(0);
  }

  private showSlide(index: number): void {
    if (index >= this.slides.length) {
      this.finishCinematic();
      return;
    }

    this.currentSlideIndex = index;
    const slide = this.slides[index];

    // Indicator
    this.indicatorText.setText(`✦ CRÓNICA ${index + 1} DE ${this.slides.length} ✦`);
    this.titleText.setText(slide.title);
    this.speakerText.setText(`— ${slide.speaker} —`);

    // Artwork & Background
    if (slide.bgKey && this.textures.exists(slide.bgKey)) {
      this.bgImage.setTexture(slide.bgKey);
    }

    if (this.textures.exists(slide.portraitKey)) {
      this.artworkImage.setTexture(slide.portraitKey).setDisplaySize(140, 140);
    }

    // Typewriter
    this.fullText = slide.text;
    this.currentTyped = 0;
    this.bodyText.setText('');
    this.isTyping = true;

    if (this.typeTimer) {
      this.typeTimer.remove();
    }

    this.audio.playSfx('dodge');

    this.typeTimer = this.time.addEvent({
      delay: 18,
      repeat: this.fullText.length - 1,
      callback: () => {
        this.currentTyped++;
        this.bodyText.setText(this.fullText.substring(0, this.currentTyped));
        if (this.currentTyped >= this.fullText.length) {
          this.isTyping = false;
        }
      }
    });
  }

  private handleAdvance(): void {
    if (this.isTyping) {
      if (this.typeTimer) this.typeTimer.remove();
      this.bodyText.setText(this.fullText);
      this.isTyping = false;
    } else {
      this.audio.playSfx('menu_select');
      this.showSlide(this.currentSlideIndex + 1);
    }
  }

  private finishCinematic(): void {
    if (this.typeTimer) this.typeTimer.remove();

    this.cameras.main.fade(350, 0, 0, 0);
    this.time.delayedCall(380, () => {
      if (this.actTransition === 5) {
        // Epilogue finishes and returns to TitleScene
        this.scene.start('TitleScene');
      } else {
        // Launch loading screen into next Act!
        const configs: Record<number, { image: string; title: string; story: string; tip: string }> = {
          2: {
            image: 'loading_concept_art',
            title: 'ACTO II — EL CAMPANARIO: LA REJA SUELTA Y EL GRANERO',
            story: '«Elowen resiste el tormento de la sal gruesa en lo alto del campanario. Khaterine recupera las hojas curvas del Colmillo del Sauce Negro bajo la losa del granero. Ha llegado el momento de quebrar el asedio.»',
            tip: '«Consejo de Shalem: Habla con Elowen en su celda con [E]. Su pájaro de madera contiene el mensaje de la rebelión.»'
          },
          3: {
            image: 'loading_bridge_journey',
            title: 'ACTO III — EL GRAN PUENTE: EL CAMINO DE LOS HEREJES',
            story: '«Huyendo de Oakhaven con el convoy de campesinos desterrados, el camino a Londinium cruza un monumental puente de piedra bajo la niebla fluvial, custodiado por la vanguardia de la Inquisición.»',
            tip: '«Táctica de Combate: El Capitán Vane bloquea con escudo de torre. ¡Usa el ataque pesado [K] o un Parry con [L] para quebrar su guardia!»'
          },
          4: {
            image: 'loading_londinium_gate',
            title: 'ACTO IV — LONDINIUM: LA CIUDADELA DORADA',
            story: '«Las puertas ciclópeas de Londinium se abren. En el salón de los espejos aguarda Rex Malphas, el soberano que vendió a su aquelarre por una corona marchita y el poder de distorsionar la realidad.»',
            tip: '«Consejo de Shalem: El Decreto Real de Malphas parece invencible... ¡Resiste sus embates hasta quebrar sus reflejos!»'
          },
          5: {
            image: 'loading_shalem_wall',
            title: 'ACTO V — LA CATEDRAL INVERTIDA: EL SOL DEL ABISMO',
            story: '«El Rex Malphas ha sido derribado y las leyes del mundo colapsan. Ante ellos se abre la sima cósmica hacia la Catedral Invertida: el templo sacrílego donde el demonio primordial Astaroth aguarda su manifestación definitiva.»',
            tip: '«Shalem: Elowen te otorgará su Gota de Luz Divina para forjar Alba Gris. ¡Usa su Onda Sagrada para purgar las sombras!»'
          }
        };

        const cfg = configs[this.targetAct] || configs[2];

        this.scene.start('LoadingScene', {
          targetScene: 'GameScene',
          targetData: {
            characterId: this.characterId,
            scenarioIndex: this.targetAct
          },
          imageKey: cfg.image,
          chapterTitle: cfg.title,
          storyText: cfg.story,
          tipText: cfg.tip,
          minDurationMs: 2500
        });
      }
    });
  }
}
