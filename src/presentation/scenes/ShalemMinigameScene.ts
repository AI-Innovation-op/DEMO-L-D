import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { ShalemCompanion, ShalemMinigameState } from '../../domain/companion/ShalemCompanion';
import { ShalemUseCases } from '../../application/usecases/ShalemUseCases';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';

export class ShalemMinigameScene extends Phaser.Scene {
  private player!: Character;
  private shalem!: ShalemCompanion;
  private audio!: WebAudioSoundAdapter;
  private minigame!: ShalemMinigameState;

  constructor() {
    super('ShalemMinigameScene');
  }

  public init(data: { player: Character; shalem: ShalemCompanion; audio: WebAudioSoundAdapter }): void {
    this.player = data.player;
    this.shalem = data.shalem;
    this.audio = data.audio;
    this.minigame = ShalemUseCases.getActiveMinigame(this.player, this.shalem);
  }

  public create(): void {
    // Semi-transparent background modal overlay
    this.add.rectangle(320, 180, 640, 360, 0x07050d, 0.9);

    // Modal Box
    this.add.rectangle(320, 180, 520, 290, 0x1b1528).setStrokeStyle(2, 0xd4af37);

    // Shalem Cat Avatar
    this.add.image(100, 100, 'shalem_cat').setScale(2.5);

    // Header Title
    this.add.text(320, 60, `★ ${this.minigame.title.toUpperCase()} ★`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '15px',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Shalem Dialogue
    this.add.text(150, 95, `Shalem ronronea: «Completaste la barra de Level Up, así que te daré una oportunidad de ganarte mi respeto... y un arma digna.»`, {
      fontFamily: 'sans-serif',
      fontSize: '10px',
      color: '#c9bedb',
      wordWrap: { width: 340 }
    });

    // Question / Riddle Text
    let questionText = '';
    let options: string[] = [];

    if (this.minigame.type === 'TRIVIA' || this.minigame.type === 'RUNE_PUZZLE') {
      const trivia = this.minigame.data as { question: string; options: string[] };
      questionText = trivia.question;
      options = trivia.options;
    } else {
      questionText = 'Secuencia mística de runas: Selecciona el orden sagrado.';
      options = ['🔥 Pira → 🌑 Abismo → ⚡ Rayo → ✨ Alba', '✨ Alba → 🔥 Pira → ⚡ Rayo → 🌑 Abismo'];
    }

    this.add.text(320, 145, questionText, {
      fontFamily: 'serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 480 }
    }).setOrigin(0.5);

    // Option Buttons
    const startY = 180;
    options.forEach((opt, idx) => {
      const btnY = startY + idx * 26;
      const btn = this.add.rectangle(320, btnY, 460, 22, 0x2e233d).setStrokeStyle(1, 0x5a4675);
      btn.setInteractive({ useHandCursor: true });

      const optText = this.add.text(320, btnY, `[${idx + 1}]  ${opt}`, {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#e2d8f0'
      }).setOrigin(0.5);

      btn.on('pointerover', () => {
        btn.setFillStyle(0x4a3763);
        optText.setColor('#ffd700');
      });

      btn.on('pointerout', () => {
        btn.setFillStyle(0x2e233d);
        optText.setColor('#e2d8f0');
      });

      btn.on('pointerdown', () => {
        this.handleChoice(idx);
      });
    });

    // Close button / instruction
    const closeBtn = this.add.text(320, 310, '[ESC] o Clic aquí para volver al combate', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#8b809e'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this.closeMinigame());

    this.input.keyboard?.on('keydown-ESC', () => this.closeMinigame());
    this.input.keyboard?.on('keydown-ONE', () => this.handleChoice(0));
    this.input.keyboard?.on('keydown-TWO', () => this.handleChoice(1));
    this.input.keyboard?.on('keydown-THREE', () => this.handleChoice(2));
    this.input.keyboard?.on('keydown-FOUR', () => this.handleChoice(3));
  }

  private handleChoice(index: number): void {
    const result = ShalemUseCases.solveMinigame(this.player, this.shalem, index);

    if (result.isCorrect) {
      this.audio.playFinisherSound(true);
      this.cameras.main.flash(400, 255, 215, 0);

      // Show reward banner
      this.add.rectangle(320, 180, 500, 180, 0x110c1f).setStrokeStyle(3, 0xffd700);
      this.add.text(320, 130, '¡RESPUESTA CORRECTA!', {
        fontFamily: 'Cinzel, serif',
        fontSize: '16px',
        color: '#ffd700'
      }).setOrigin(0.5);

      this.add.text(320, 175, result.message, {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 440 }
      }).setOrigin(0.5);

      const resumeBtn = this.add.text(320, 230, '★ CONTINUAR CON TU NUEVA ARMA ★', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#ffd700',
        backgroundColor: '#402a5c',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      resumeBtn.on('pointerdown', () => this.closeMinigame());
    } else {
      this.audio.playCombatHit(true);
      this.cameras.main.shake(200, 0.015);
      alert(result.message);
    }
  }

  private closeMinigame(): void {
    this.scene.stop('ShalemMinigameScene');
    this.scene.resume('GameScene');
  }
}
