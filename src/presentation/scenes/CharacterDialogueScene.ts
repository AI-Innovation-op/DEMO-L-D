import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';

export interface DialogueBeat {
  speaker: 'Thomas' | 'Khaterine' | 'Shalem' | 'Elowen' | string;
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

  public init(data: { player: Character; scenarioIndex?: number; audio?: WebAudioSoundAdapter; dialogueType?: string }): void {
    this.player = data.player;
    this.currentScenario = data.scenarioIndex || 1;
    this.audio = data.audio || WebAudioSoundAdapter.getInstance();
    this.currentBeatIndex = 0;

    const type = data.dialogueType || 'party';
    if (type === 'elowen') {
      this.dialogueBeats = this.generateElowenDialogue();
    } else if (type === 'elowen_londinium') {
      this.dialogueBeats = this.generateElowenLondiniumDialogue();
    } else if (type === 'elowen_cathedral') {
      this.dialogueBeats = this.generateElowenCathedralDialogue();
    } else if (type === 'cedric') {
      this.dialogueBeats = this.generateCedricDialogue();
    } else {
      this.dialogueBeats = this.generateDialogueForScenario(this.currentScenario);
    }
  }

  private generateCedricDialogue(): DialogueBeat[] {
    return [
      {
        speaker: 'Padre Cedric',
        portraitKey: 'portrait_cedric',
        portraitSide: 'right',
        text: '«¡Thomas, hijo mío! Vi cómo te arrojaste contra esas bestias de ceniza para proteger a los niños... No sé de qué abismo proviene ese fuego negro que arde en tu espada... pero tus manos siguen siendo las del buen muchacho que cuidaba a los leprosos de Oakhaven.»'
      },
      {
        speaker: 'Thomas',
        portraitKey: 'portrait_thomas',
        portraitSide: 'left',
        text: '«Padre Cedric, llevad a los niños a la cripta de piedra. Morwenna ha desatado el fuego en el bosque, pero yo extinguiré sus piras.»'
      },
      {
        speaker: 'Padre Cedric',
        portraitKey: 'portrait_cedric',
        portraitSide: 'right',
        text: '«Toma este humilde rosario de madera... te protegerá en el camino. Y guarda esta tablilla de piedra que rescaté de las cenizas: es el primer fragmento de la Profecía Original. ¡Que la bondad guíe tu corazón!»'
      },
      {
        speaker: 'Shalem',
        portraitKey: 'portrait_shalem',
        portraitSide: 'left',
        text: '«Un cura que no intenta quemarnos al vernos... Qué rareza tan refrescante. Guarda bien esa tablilla, Thomas: cada verso grabado en ella desarmará las mentiras del reino.»'
      }
    ];
  }

  private generateElowenDialogue(): DialogueBeat[] {
    return [
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        portraitSide: 'right',
        text: '«Thomas... ¿recuerdas cuando éramos niños y subíamos a la colina del viejo roble antes del amanecer? Tenías miedo de atravesar el sendero oscuro del bosque y me preguntaste qué haríamos si la luz nunca llegaba.»'
      },
      {
        speaker: 'Thomas',
        portraitKey: 'portrait_thomas',
        portraitSide: 'left',
        text: '«Me tomaste de la mano y me dijiste que la encontraríamos juntos. Jamás olvidé esa promesa, Elowen. No permitiré que Morwenna ni los inquisidores te hagan daño.»'
      },
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        portraitSide: 'right',
        text: '«Durante dieciocho años me obligaron a arrodillarme sobre sal gruesa para purificar una culpa que jamás fue mía... Pero el Padre Cedric me enseñó que la bondad no se compra con dogmas. Toma mi bendición, Thomas: sana tus heridas y mantén tu corazón puro.»'
      },
      {
        speaker: 'Shalem',
        portraitKey: 'portrait_shalem',
        portraitSide: 'left',
        text: '«Qué conmovedor... casi se me cae un bigote de la emoción. Menos sentimentalismo y más estar alerta, Thomas: ¡esos Acechadores de Ceniza tienen colmillos muy reales!»'
      }
    ];
  }

  /** Act II – Elowen is chained in the dungeons of Londinium. */
  private generateElowenLondiniumDialogue(): DialogueBeat[] {
    return [
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        portraitSide: 'right',
        text: '«Thomas... Viniste. Me arrastraron desde Oakhaven encadenada a un carro de sal. Los guardias dorados dicen que soy la ofrenda del Cáliz Solar... que mi sangre sellará el pacto del Rey con el Abismo.»'
      },
      {
        speaker: 'Thomas',
        portraitKey: 'portrait_thomas',
        portraitSide: 'left',
        text: '«Nadie más va a arrodillarte sobre sal gruesa, Elowen. He cruzado Oakhaven entera para encontrarte. Romperé estas cadenas y luego le arrancaré la corona al falso rey.»'
      },
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        portraitSide: 'right',
        text: '«Ten cuidado... Malphas no es solo un tirano. Es Alaric, el antiguo maestro de Khaterine. Vendió a su propia familia en la Noche de la Luna Roja por el poder de torcer la realidad. No le subestimes.»'
      },
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        portraitSide: 'right',
        text: '«Toma mi bendición una vez más... Es lo único que estos muros no pudieron quitarme. Que sane tus heridas y te recuerde por qué luchas.»'
      },
      {
        speaker: 'Shalem',
        portraitKey: 'portrait_shalem',
        portraitSide: 'left',
        text: '«Bueno, bueno... una reunión entrañable en las mazmorras más pestilentes del reino. ¡Rompe esos grilletes de una vez y vamos por el impostor de la corona, muchacho!»'
      }
    ];
  }

  /** Act III – Elowen sacrifices her Gota de Luz Divina to forge Alba Gris. */
  private generateElowenCathedralDialogue(): DialogueBeat[] {
    return [
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        portraitSide: 'right',
        text: '«Las leyes del mundo se han roto, Thomas... Siento cómo la catedral nos empuja hacia el vacío. Pero hay algo que aún puedo hacer.»'
      },
      {
        speaker: 'Thomas',
        portraitKey: 'portrait_thomas',
        portraitSide: 'left',
        text: '«Elowen, no... Veo lo que pretendes. Si entregas tu Gota de Luz Divina morirás. ¡Tiene que haber otra manera!»'
      },
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        portraitSide: 'right',
        text: '«No voy a morir, Thomas. Voy a convertirme en parte de tu espada. Mi luz unida a tu fuego negro forjará Alba Gris: la hoja que no pertenece ni al Cielo ni al Abismo. Es la única arma que puede herir a Astaroth.»'
      },
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        portraitSide: 'right',
        text: '«¿Recuerdas la colina del viejo roble? Prometí que encontraríamos la luz juntos. Esta es mi forma de cumplir esa promesa... para siempre.»'
      },
      {
        speaker: 'Shalem',
        portraitKey: 'portrait_shalem',
        portraitSide: 'left',
        text: '«...Maldita sea. Es la primera vez en tres mil años que un humano me deja sin palabras. Toma esa espada, Thomas, y hazle justicia a lo que ella te ha dado. ¡Terminemos con esto!»'
      }
    ];
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
          text: `«${allyName}... El Padre Cedric se interpuso frente a los Acechadores de Ceniza solo con una antorcha para salvar a los niños. Antes de morir me dijo: "Tus manos siguen siendo las del buen muchacho que cuidaba a los enfermos". No pienso fallarle.»`
        },
        {
          speaker: allyName,
          portraitKey: allyPortrait,
          portraitSide: 'right',
          text: '«Cedric poseía una fe auténtica en medio de una Iglesia podrida de hipocresía. Morwenna cree que Elowen es el fruto del Abismo... No descansará hasta que purguemos a sus inquisidores de Oakhaven.»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          portraitSide: 'left',
          text: '«Dieciocho años viviendo como un felino bajo el cuidado de un monaguillo... Menos charlas morales y más afilar el acero, saco de carne. ¡Que esos Acechadores tienen dientes muy afilados!»'
        },
        {
          speaker: mainProtagonist,
          portraitKey: mainPortrait,
          portraitSide: 'left',
          text: '«Shalem, a veces olvido que comandabas legiones en el Abismo.»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          portraitSide: 'right',
          text: '«Comandé los nueve fuegos del Abismo, muchacho. Y por cierto: cuando ganemos, exijo que me consigas trucha y sardinas frescas de Londinium.»'
        }
      ];
    } else if (scenario === 2) {
      return [
        {
          speaker: mainProtagonist,
          portraitKey: mainPortrait,
          portraitSide: 'left',
          text: '«El Rey Malphas... es Alaric. Tu antiguo maestro en el Aquelarre del Sauce Negro. Me dijo: "No tuve que obligarlos a odiarte, solo tuve que enseñarles a temerte".»'
        },
        {
          speaker: allyName,
          portraitKey: allyPortrait,
          portraitSide: 'right',
          text: '«Alaric vendió a su familia en la Noche de la Luna Roja a cambio de una corona maldita y el poder de alterar la realidad. Tuve miedo al ver sus ojos grises en ti de bebé... pero elegí amarte. Tu alma es tuya, Thomas.»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          portraitSide: 'left',
          text: '«El "Monarca de los Deseos" y su salón de espejos temporales. Yo solo deseo que le arranques esa corona de oropel de un buen mandoble.»'
        }
      ];
    } else {
      return [
        {
          speaker: mainProtagonist,
          portraitKey: mainPortrait,
          portraitSide: 'left',
          text: '«La Catedral Invertida... Las leyes del mundo están rotas. Elowen sacrificó su Gota de Luz Divina para forjar Alba Gris... Si este fuego se apaga al final, ¿quién seré?»'
        },
        {
          speaker: allyName,
          portraitKey: allyPortrait,
          portraitSide: 'right',
          text: '«Serás el muchacho que prometió encontrar la luz junto a Elowen. Lyra y las brujas del Sauce Negro nos acompañan en este filo. ¡No estás solo!»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          portraitSide: 'left',
          text: '«Tenía en mis garras el contrato para liberarme y volver al Abismo. Lo quemé. No pienso dejarte morir solo frente a Astaroth, idiota... Ha sido un verdadero honor luchar a tu lado.»'
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
    this.rightPortrait = this.add.image(575, 275, 'portrait_khaterine').setDisplaySize(68, 68).setVisible(false);

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
