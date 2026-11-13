import Phaser from 'phaser';
import { CharacterId } from '../../domain/character/CharacterEnums';

export class TitleScene extends Phaser.Scene {
  private selectedCharacter: CharacterId = 'thomas';
  private thomasCard!: Phaser.GameObjects.Container;
  private khaterineCard!: Phaser.GameObjects.Container;

  constructor() {
    super('TitleScene');
  }

  public create(): void {
    // Background
    this.add.image(320, 180, 'bg_oakhaven').setDisplaySize(640, 360).setAlpha(0.6);

    // Title
    this.add.text(320, 45, 'THE LIGHT IN THE DARKNESS', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '26px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(320, 75, '«Ni la sangre ni el linaje determinan la bondad, sino las elecciones»', {
      fontFamily: 'serif',
      fontSize: '12px',
      color: '#d0c4df',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Thomas Card
    this.thomasCard = this.createCard(210, 180, 'thomas', 'THOMAS', 'Híbrido demonio / Monaguillo', 'Ágil, magia demoníaca, frágil al golpe directo', 'thomas_idle');

    // Khaterine Card
    this.khaterineCard = this.createCard(430, 180, 'khaterine', 'KHATERINE', 'Hechicera del Abismo / Falsa Monja', 'Ataque a distancia, magia potente, más resistente', 'khaterine_idle');

    this.updateCardSelection();

    // Controls text
    this.add.text(320, 290, 'Presiona [← / →] para cambiar de personaje | [ESPACIO / ENTER] para comenzar', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(320, 320, 'Acompañado por Shalem el gato • Combate arcade & duelista • Desarme táctico', {
      fontFamily: 'sans-serif',
      fontSize: '10px',
      color: '#9988aa'
    }).setOrigin(0.5);

    // Input handlers
    this.input.keyboard?.on('keydown-LEFT', () => {
      this.selectedCharacter = 'thomas';
      this.updateCardSelection();
    });

    this.input.keyboard?.on('keydown-RIGHT', () => {
      this.selectedCharacter = 'khaterine';
      this.updateCardSelection();
    });

    this.input.keyboard?.on('keydown-A', () => {
      this.selectedCharacter = 'thomas';
      this.updateCardSelection();
    });

    this.input.keyboard?.on('keydown-D', () => {
      this.selectedCharacter = 'khaterine';
      this.updateCardSelection();
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.startGame();
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.startGame();
    });
  }

  private createCard(
    x: number,
    y: number,
    charId: CharacterId,
    name: string,
    role: string,
    desc: string,
    textureKey: string
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 180, 160, 0x181424, 0.85);
    bg.setStrokeStyle(2, 0x4d3f66);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      this.selectedCharacter = charId;
      this.updateCardSelection();
    });

    const sprite = this.add.image(0, -35, textureKey).setScale(1.4);
    const title = this.add.text(0, 15, name, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '14px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sub = this.add.text(0, 32, role, {
      fontFamily: 'sans-serif',
      fontSize: '9px',
      color: '#bbaacc'
    }).setOrigin(0.5);

    const detail = this.add.text(0, 56, desc, {
      fontFamily: 'sans-serif',
      fontSize: '9px',
      color: '#8f83a3',
      align: 'center',
      wordWrap: { width: 160 }
    }).setOrigin(0.5);

    container.add([bg, sprite, title, sub, detail]);
    return container;
  }

  private updateCardSelection(): void {
    const thomasBg = this.thomasCard.getAt(0) as Phaser.GameObjects.Rectangle;
    const khaterineBg = this.khaterineCard.getAt(0) as Phaser.GameObjects.Rectangle;

    if (this.selectedCharacter === 'thomas') {
      thomasBg.setStrokeStyle(3, 0xffcc00);
      thomasBg.setFillStyle(0x2d1f42, 0.95);
      khaterineBg.setStrokeStyle(1, 0x443355);
      khaterineBg.setFillStyle(0x181424, 0.7);
    } else {
      khaterineBg.setStrokeStyle(3, 0xffcc00);
      khaterineBg.setFillStyle(0x2d1f42, 0.95);
      thomasBg.setStrokeStyle(1, 0x443355);
      thomasBg.setFillStyle(0x181424, 0.7);
    }
  }

  private startGame(): void {
    this.scene.start('GameScene', { characterId: this.selectedCharacter });
    this.scene.launch('HUDScene');
  }
}
