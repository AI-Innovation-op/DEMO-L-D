import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';

export interface DialogueBeat {
  speaker: 'Thomas' | 'Khaterine' | 'Shalem';
  portraitKey: string;
  portraitSide: 'left' | 'right';
  text: string;
}

export class CharacterDialogueScene extends Phaser.Scene {
  private player!: Character;
  private currentScenario: number = 1;
  private audio!: WebAudioSoundAdapter;

  private dialogueBeats: DialogueBeat[] = [];
  private currentBeatIndex: number = 0;

  // UI Components
  private speakerNameText!: Phaser.GameObjects.Text;
  private dialogueBodyText!: Phaser.GameObjects.Text;
  private leftPortrait!: Phaser.GameObjects.Image;
  private rightPortrait!: Phaser.GameObjects.Image;

  private fullText: string = '';
  private currentTyped: number = 0;
  private typeTimer?: Phaser.Time.TimerEvent;
  private isTyping: boolean = false;

  constructor() {
    super('CharacterDialogueScene');
  }

  public init(data: { player: Character; scenarioIndex?: number; audio?: WebAudioSoundAdapter }): void {
    this.player = data.player;
    this.currentScenario = data.scenarioIndex || 1;
    this.audio = data.audio || WebAudioSoundAdapter.getInstance();
    this.currentBeatIndex = 0;
    this.dialogueBeats = this.generateDialogueForScenario(this.currentScenario);
  }

  private generateDialogueForScenario(scenario: number): DialogueBeat[] {
    const isThomas = this.player.id === 'thomas';
    const mainProtagonist = isThomas ? 'Thomas' : 'Khaterine';
    const allyName = isThomas ? 'Khaterine' : 'Thomas';
    const mainPortrait = isThomas ? 'portrait_thomas' : 'portrait_khaterine';
    const allyPortrait = isThomas ? 'portrait_khaterine' : 'portrait_thomas';

    if (scenario === 1) {
      return [
        {
          speaker: mainProtagonist,
          portraitKey: mainPortrait,
          portraitSide: 'left',
          text: `«${allyName}... ¿Por qué Morwenna vigila con tanto recelo a Elowen? Si la profecía habla de una criatura nacida del Abismo, ¿por qué sospechan de ella?»`
        },
        {
          speaker: allyName,
          portraitKey: allyPortrait,
          portraitSide: 'right',
          text: '«Hay verdades que aún no estás listo para escuchar... La Iglesia del Cáliz Solar ve demonios en cualquier alma pura que no pueda doblegar. Mantén tu fe firme y no te apartes de mi lado.»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          portraitSide: 'left',
          text: '«Qué momento tan conmovedor. Casi se me cae una lágrima de la pata. Menos charla filosófica y más esquivar los colmillos de esos acechadores de ceniza, por favor.»'
        },
        {
          speaker: mainProtagonist,
          portraitKey: mainPortrait,
          portraitSide: 'left',
          text: '«Shalem, eres absolutamente insoportable.»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          portraitSide: 'right',
          text: '«Soy un marqués del Abismo, muchacho. La arrogancia y el sarcasmo vienen incluidos en mi linaje aristocrático. ¡Ahora a pelear!»'
        }
      ];
    } else if (scenario === 2) {
      return [
        {
          speaker: mainProtagonist,
          portraitKey: mainPortrait,
          portraitSide: 'left',
          text: '«El Rey Malphas... Lleva las galas de la realeza de Londinium, pero bajo su piel corre humo del Abismo. ¿Quién era Alaric antes de todo esto?»'
        },
        {
          speaker: allyName,
          portraitKey: allyPortrait,
          portraitSide: 'right',
          text: '«Alaric era el maestro más sabio de nuestro aquelarre... hasta que el deseo de poder lo consumió. Nos vendió a Astaroth a cambio de un trono y una corona demoníaca. No sientas piedad por él.»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          portraitSide: 'left',
          text: '«Yo sugiero que antes de clavarle la espada en el pecho, le exijamos que nos entregue la bodega real de sardinas y salmón ahumado. Hay que tener prioridades tácticas.»'
        }
      ];
    } else {
      return [
        {
          speaker: mainProtagonist,
          portraitKey: mainPortrait,
          portraitSide: 'left',
          text: '«La Catedral Invertida... Las leyes del cielo y la tierra se han roto. Si derroto a Astaroth, ¿el fuego demoníaco en mi interior se apagará para siempre?»'
        },
        {
          speaker: allyName,
          portraitKey: allyPortrait,
          portraitSide: 'right',
          text: '«Tu sangre jamás determinó quién eres. Tuve miedo de ti cuando eras un bebé en esa cesta, pero cada mañana elegí amarte y protegerte. Eres más humano que todos los falsos santos de este reino.»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          portraitSide: 'left',
          text: '«... (Shalem baja las orejas en completo silencio, luego ronronea bajito) ... Bueno, Thomas. Si este es el fin del mundo... ha sido un honor luchar a tu lado.»'
        }
      ];
    }
  }

  public create(): void {
    // 1. Semi-transparent Backdrop
    this.add.rectangle(320, 180, 640, 360, 0x050308, 0.75).setInteractive();

    // 2. Large Dialogue Container at the bottom
    this.add.rectangle(320, 275, 590, 130, 0x140e21, 0.95)
      .setStrokeStyle(2, 0xd4af37);
    this.add.rectangle(320, 275, 582, 122, 0x000000, 0)
      .setStrokeStyle(1, 0x5a3e75);

    // Left Portrait Box
    this.leftPortrait = this.add.image(65, 275, 'portrait_thomas').setDisplaySize(68, 68);
    // Right Portrait Box
    this.rightPortrait = this.add.image(575, 275, 'khaterine_idle').setDisplaySize(68, 68).setVisible(false);

    // Speaker Name Banner
    this.speakerNameText = this.add.text(115, 225, 'THOMAS', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#ffd700',
      fontStyle: 'bold'
    });

    // Dialogue Body Text
    this.dialogueBodyText = this.add.text(115, 245, '', {
      fontFamily: 'serif',
      fontSize: '11px',
      color: '#f0e6ff',
      wordWrap: { width: 440 },
      lineSpacing: 4
    });

    // Advance Hint
    this.add.text(510, 325, '[ESPACIO / ENTER] Siguiente ▶', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ffd700',
      backgroundColor: '#2b1a3d',
      padding: { x: 6, y: 3 }
    }).setOrigin(1, 0.5);

    // Close button top right
    const closeBtn = this.add.text(595, 222, '✕ CERRAR [ESC]', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#c2b0d6'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeDialogue());

    // Click / Input to advance
    this.input.keyboard?.on('keydown-SPACE', () => this.handleAdvance());
    this.input.keyboard?.on('keydown-ENTER', () => this.handleAdvance());
    this.input.keyboard?.on('keydown-ESC', () => this.closeDialogue());
    this.input.keyboard?.on('keydown-C', () => this.handleAdvance());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > 180) {
        this.handleAdvance();
      }
    });

    // Show first beat
    this.showBeat(0);
  }

  private showBeat(index: number): void {
    if (index >= this.dialogueBeats.length) {
      this.closeDialogue();
      return;
    }

    this.currentBeatIndex = index;
    const beat = this.dialogueBeats[index];

    this.speakerNameText.setText(beat.speaker.toUpperCase());

    // Configure portraits
    if (beat.portraitSide === 'left') {
      this.leftPortrait.setTexture(beat.portraitKey).setDisplaySize(68, 68).setVisible(true).setAlpha(1.0);
      this.rightPortrait.setAlpha(0.35);
    } else {
      this.rightPortrait.setTexture(beat.portraitKey).setDisplaySize(68, 68).setVisible(true).setAlpha(1.0);
      this.leftPortrait.setAlpha(0.35);
    }

    // Typewriter effect
    this.fullText = beat.text;
    this.currentTyped = 0;
    this.dialogueBodyText.setText('');
    this.isTyping = true;

    if (this.typeTimer) {
      this.typeTimer.remove();
    }

    this.audio.playSfx('dodge');

    this.typeTimer = this.time.addEvent({
      delay: 20,
      repeat: this.fullText.length - 1,
      callback: () => {
        this.currentTyped++;
        this.dialogueBodyText.setText(this.fullText.substring(0, this.currentTyped));
        if (this.currentTyped >= this.fullText.length) {
          this.isTyping = false;
        }
      }
    });
  }

  private handleAdvance(): void {
    if (this.isTyping) {
      if (this.typeTimer) this.typeTimer.remove();
      this.dialogueBodyText.setText(this.fullText);
      this.isTyping = false;
    } else {
      this.showBeat(this.currentBeatIndex + 1);
    }
  }

  private closeDialogue(): void {
    this.scene.stop('CharacterDialogueScene');
    this.scene.resume('GameScene');
  }
}
