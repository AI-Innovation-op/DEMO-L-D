import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';
import { configureHDSceneCamera, drawGothicOrnamentFrame } from '../ui/CrispTextPipeline';

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
    } else if (type === 'elowen_belltower') {
      this.dialogueBeats = this.generateElowenBelltowerDialogue();
    } else if (type === 'barn_slab') {
      this.dialogueBeats = this.generateBarnSlabDialogue();
    } else if (type === 'elowen_bridge') {
      this.dialogueBeats = this.generateElowenBridgeDialogue();
    } else if (type === 'elowen_londinium') {
      this.dialogueBeats = this.generateElowenLondiniumDialogue();
    } else if (type === 'elowen_cathedral') {
      this.dialogueBeats = this.generateElowenCathedralDialogue();
    } else if (type === 'epilogue_elowen') {
      this.dialogueBeats = this.generateEpilogueElowenDialogue();
    } else if (type === 'epilogue_cedric') {
      this.dialogueBeats = this.generateEpilogueCedricDialogue();
    } else if (type === 'cedric') {
      this.dialogueBeats = this.generateCedricDialogue();
    } else {
      this.dialogueBeats = this.generateDialogueForScenario(this.currentScenario);
    }
  }

  /** Act II (Cap. VIII) – Lifting the burned barn stone slab to recover Colmillo del Sauce Negro & Lyra's shawl. */
  private generateBarnSlabDialogue(): DialogueBeat[] {
    return [
      {
        speaker: 'Khaterine',
        portraitKey: 'portrait_khaterine',
        portraitSide: 'right',
        text: '«Bajo esta losa tiznada... aún permanece intacto el chal gris de mi madre, Lyra. Huele a humo de leña y lluvia del Sauce Negro, tal como la noche en que me ocultó para salvarme.»'
      },
      {
        speaker: 'Thomas',
        portraitKey: 'portrait_thomas',
        portraitSide: 'left',
        text: '«Envueltas en la lana descansan las hojas curvas gemelas: el Colmillo del Sauce Negro. Su acero vibra con el juramento de quienes protegieron la vida frente al dogma.»'
      },
      {
        speaker: 'Shalem',
        portraitKey: 'portrait_shalem',
        portraitSide: 'left',
        text: '«Acero brujo templado con memoria verdadera. Empuña ese filo, Thomas, y que tu arco recuerde el pulso de Lyra, cazadora. ¡Es hora de derribar la celda del campanario!»'
      }
    ];
  }

  /** Playable Epilogue (Scenario 6, Cap. XX) – Elowen & Thomas under the Old Oak in the First Dawn. */
  private generateEpilogueElowenDialogue(): DialogueBeat[] {
    return [
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        portraitSide: 'right',
        text: '«Mira el cielo sobre el Viejo Roble, Thomas... Dieciséis flores blancas han brotado donde antes solo había escarcha y ceniza. Por fin llegó el amanecer que nos prometimos de niños.»'
      },
      {
        speaker: 'Thomas',
        portraitKey: 'portrait_thomas',
        portraitSide: 'left',
        text: '«El fuego negro se apagó cuando cayó Astaroth, pero no siento frío, Elowen. Por primera vez en dieciocho años, mis manos solo pesan lo que pesa un hombre libre.»'
      },
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        portraitSide: 'right',
        text: '«Porque nunca fuiste el monstruo de sus profecías. Fuiste la oscuridad que eligió amar y amparar a los débiles. Bienvenido a casa, Thomas.»'
      },
      {
        speaker: 'Shalem',
        portraitKey: 'portrait_shalem',
        portraitSide: 'left',
        text: '«Miau... Mucha poesía matutina y poca trucha asada. Aunque admito que este sol tibio sobre el lomo supera por mucho tres milenios en el Abismo.»'
      }
    ];
  }

  /** Playable Epilogue (Scenario 6, Cap. XX) – Memory & Legacy of Padre Cedric at San Jude's Sunlit Cross. */
  private generateEpilogueCedricDialogue(): DialogueBeat[] {
    return [
      {
        speaker: 'Padre Cedric',
        portraitKey: 'portrait_cedric',
        portraitSide: 'right',
        text: '«La campana de San Jude vuelve a sonar sin temor, hijo mío. Los huérfanos y los enfermos que defendiste hoy caminan bajo la luz sin cadenas ni sal.»'
      },
      {
        speaker: 'Thomas',
        portraitKey: 'portrait_thomas',
        portraitSide: 'left',
        text: '«Guardé vuestro rosario de madera hasta el último abismo, Padre Cedric. Vuestra bondad fue el verdadero escudo que jamás pudieron romper.»'
      }
    ];
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

  /** Act II – Elowen in the Belltower cell with the wooden bird & loose bars. */
  private generateElowenBelltowerDialogue(): DialogueBeat[] {
    return [
      {
        speaker: 'Elowen',
        portraitKey: 'elowen_campanario',
        portraitSide: 'right',
        text: '«Thomas... ¡Llegaste a la torre! Morwenna me encerró aquí y vertió sal gruesa bajo mis rodillas para quebrar mi espíritu antes del traslado. Pero mi luz quebró su crisol de bronce.»'
      },
      {
        speaker: 'Thomas',
        portraitKey: 'portrait_thomas',
        portraitSide: 'left',
        text: '«Elowen, resiste. Khaterine recuperó sus hojas en el granero y yo rompí la guardia de la entrada. Esta reja está suelta; saldremos por el portillo del huerto.»'
      },
      {
        speaker: 'Elowen',
        portraitKey: 'elowen_campanario',
        portraitSide: 'right',
        text: '«Toma mi pájaro de madera... Atada a él va la tira de lino que escribí con carbón: "Londinium es sacrificio. Reja suelta." Llévalo contigo. Los guardias se preparan para mover el convoy hacia el río.»'
      },
      {
        speaker: 'Shalem',
        portraitKey: 'portrait_shalem',
        portraitSide: 'left',
        text: '«Una paloma mensajera de madera tosca... Quién diría que un trozo de pino tallado con un cuchillo viejo guardaría más lealtad que toda la corte imperial junta. ¡Vámonos antes de que el azufre nos ahogue!»'
      }
    ];
  }

  /** Act III – Elowen on the Great Stone Bridge guiding refugees. */
  private generateElowenBridgeDialogue(): DialogueBeat[] {
    return [
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        portraitSide: 'right',
        text: '«Martín y los aldeanos que huyeron de Oakhaven están cruzando el puente... pero los caballeros de la guardia áurea han cerrado el portón de hierro de Londinium. Si no quebramos al Capitán Vane, nos empujarán al río.»'
      },
      {
        speaker: 'Thomas',
        portraitKey: 'portrait_thomas',
        portraitSide: 'left',
        text: '«Mantened a los refugiados tras la balaustrada de piedra, Elowen. Esos caballeros confían demasiado en el grosor de sus escudos de torre... pero el fuego negro no conoce barreras.»'
      },
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        portraitSide: 'right',
        text: '«Siente mi bendición en tu hoja, Thomas... Que la bondad de los que amamos sea tu armadura.»'
      },
      {
        speaker: 'Shalem',
        portraitKey: 'portrait_shalem',
        portraitSide: 'left',
        text: '«Ese Capitán Vane brilla como una moneda recién acuñada. ¡Enséñale que el oro falso se funde con un par de buenos tajos!»'
      }
    ];
  }

  /** Act IV – Elowen is chained in the dungeons of Londinium. */
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
          text: '«Dieciocho años viviendo como un felino bajo el cuidado de un monaguillo... Menos charlas morales y más afilar el acero, saco de carne. ¡Que esos Acechadores tienen dientes muy afilados!»',
          portraitSide: 'left'
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
          text: '«Elowen soportó dieciocho inviernos de sal y sospechas sin guardar rencor. Rompió el crisol sagrado con su propia luz para enviarme su pájaro de madera...»'
        },
        {
          speaker: allyName,
          portraitKey: allyPortrait,
          portraitSide: 'right',
          text: '«En el granero recuperé el Colmillo del Sauce Negro bajo la losa de piedra. El chal de mi madre Lyra sigue oliendo a humo y lluvia... Estamos listos para quebrar la torre.»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          portraitSide: 'left',
          text: '«Esos coristas lanzan azufre como si regalaran caramelos. Mantened el compás: esquivad sus vapores y devolvedles el golpe con interés.»'
        }
      ];
    } else if (scenario === 3) {
      return [
        {
          speaker: mainProtagonist,
          portraitKey: mainPortrait,
          portraitSide: 'left',
          text: '«Los carros de prisioneros cruzaban el Gran Puente bajo la niebla. Si no hubiéramos llegado a tiempo, los soldados habrían arrojado a los campesinos desterrados al abismo del río.»'
        },
        {
          speaker: allyName,
          portraitKey: allyPortrait,
          portraitSide: 'right',
          text: '«El Capitán Vane y sus caballeros áureos protegen los muros de la capital. Creen que su escudo de torre es inquebrantable... pero el fuego negro no pide permiso.»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          portraitSide: 'left',
          text: '«El aire de Londinium huele a corrupción y mirra vieja. En cuanto crucemos este puente, la corte entera sabrá que el hijo del Abismo ha venido a cobrar sus deudas.»'
        }
      ];
    } else if (scenario === 4) {
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
    } else if (scenario === 6) {
      return [
        {
          speaker: mainProtagonist,
          portraitKey: mainPortrait,
          portraitSide: 'left',
          text: '«El Primer Amanecer sobre Oakhaven... Las cenizas de la pira han desaparecido y las campanas anuncian paz desde la colina hasta el río.»'
        },
        {
          speaker: allyName,
          portraitKey: allyPortrait,
          portraitSide: 'right',
          text: '«Mi madre Lyra y el Padre Cedric sonríen en cada brisa que mueve las ramas del Sauce y del Viejo Roble. Cumplimos nuestra promesa.»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          portraitSide: 'left',
          text: '«Y ahora viene el juramento más sagrado de todos: me prometisteis trucha fresca y sardinas de Londinium. ¡Espero un festín digno de un antiguo Señor del Abismo!»'
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
    configureHDSceneCamera(this);
    // 1. Semi-transparent Backdrop
    this.add.rectangle(320, 180, 640, 360, 0x050308, 0.72).setInteractive();

    // 2. Ornate Gothic Dialogue Container at the bottom
    drawGothicOrnamentFrame(this, 24, 206, 592, 136, 2, { bgColor: 0x110a1f, bgAlpha: 0.96 });

    // Portrait Medallion Frames
    this.add.rectangle(66, 274, 72, 72, 0x090512, 0.95).setStrokeStyle(1.5, 0xc9a24b).setDepth(3);
    this.add.rectangle(574, 274, 72, 72, 0x090512, 0.95).setStrokeStyle(1.5, 0xc9a24b).setDepth(3);

    // Left Portrait Box
    this.leftPortrait = this.add.image(66, 274, 'portrait_thomas').setDisplaySize(66, 66).setDepth(4);
    // Right Portrait Box
    this.rightPortrait = this.add.image(574, 274, 'portrait_khaterine').setDisplaySize(66, 66).setDepth(4).setVisible(false);

    // Speaker Name Banner
    this.speakerNameText = this.add.text(114, 218, 'THOMAS', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11.5px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setDepth(5);

    this.add.rectangle(114, 234, 260, 1, 0x67478f, 0.75).setOrigin(0, 0.5).setDepth(4);

    // Dialogue Body Text (Literary Cormorant Garamond in crisp HD!)
    this.dialogueBodyText = this.add.text(114, 240, '', {
      fontFamily: 'Cormorant Garamond, Georgia, serif',
      fontSize: '12px',
      color: '#f4ecff',
      wordWrap: { width: 416 },
      lineSpacing: 3
    }).setDepth(5);

    // Advance Hint
    this.add.text(526, 326, 'ESPACIO / ENTER · Siguiente ▶', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#ffd700',
      backgroundColor: '#29173d',
      padding: { x: 6, y: 3 }
    }).setOrigin(1, 0.5).setDepth(5);

    // Close button top right
    const closeBtn = this.add.text(604, 216, '✕ ESC', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#cbb8e0'
    }).setOrigin(1, 0).setDepth(5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeDialogue());

    // Click / Input to advance
    this.input.keyboard?.on('keydown-SPACE', () => this.handleAdvance());
    this.input.keyboard?.on('keydown-ENTER', () => this.handleAdvance());
    this.input.keyboard?.on('keydown-ESC', () => this.closeDialogue());
    this.input.keyboard?.on('keydown-C', () => this.handleAdvance());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.worldY > 180) {
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
