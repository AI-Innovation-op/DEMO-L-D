import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { ProphecyRepository } from '../../domain/mission/Mission';

export class InventoryScene extends Phaser.Scene {
  private player!: Character;
  private prophecy!: ProphecyRepository;

  constructor() {
    super('InventoryScene');
  }

  public init(data: { player: Character }): void {
    this.player = data.player;
    this.prophecy = new ProphecyRepository();
    // Unlock fragments for demonstration
    this.prophecy.unlockFragment(1);
    this.prophecy.unlockFragment(2);
    this.prophecy.unlockFragment(3);
  }

  public create(): void {
    // Dim background
    this.add.rectangle(320, 180, 640, 360, 0x0a0812, 0.92);

    // Modal frame with Celtic gold borders
    this.add.rectangle(320, 180, 560, 310, 0x171224).setStrokeStyle(2, 0xd4af37);

    // Title
    this.add.text(320, 48, '★ ARSENAL & PROFECÍA ORIGINAL ★', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '15px',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Column Left: Weapons
    this.add.text(160, 80, '— ARSENAL DESBLOQUEABLE —', {
      fontFamily: 'Cinzel, serif',
      fontSize: '11px',
      color: '#e2d4f0',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const weaponsList = [
      { name: '1. Espada Corta del Monaguillo', effect: '«Ascua Prestada» (Hollín explosivo al esquivar)' },
      { name: '2. Lamento de Oakhaven (Incensario)', effect: '«Cosecha de Culpa» (Cura leve con combo completo)' },
      { name: '3. Colmillo del Sauce Negro (Dagas)', effect: '«Eco del Aquelarre» (Sombra de Lyra repite el tajo)' },
      { name: '4. Falso Veredicto (Mandoble)', effect: '«Peso de la Conciencia» (Rompe escudos de la iglesia)' },
      { name: '5. Espejismo de Oro y Humo (Sable)', effect: '«Paso Astral» (Esquiva en niebla púrpura explosiva)' },
      { name: '6. Alba Gris (Espada de la Elección)', effect: '«Luz en las Tinieblas» (Fuego negro + Luz purificadora)' }
    ];

    weaponsList.forEach((w, i) => {
      const y = 105 + i * 28;
      const isCurrent = this.player.disarmManager.getCurrentWeapon().name.includes(w.name.split('.')[1].trim().split(' ')[0]);

      this.add.text(60, y, `${isCurrent ? '▶ ' : ''}${w.name}`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: isCurrent ? '#ffd700' : '#d2c7e0',
        fontStyle: isCurrent ? 'bold' : 'normal'
      });

      this.add.text(70, y + 12, w.effect, {
        fontFamily: 'sans-serif',
        fontSize: '8px',
        color: '#8e829e'
      });
    });

    // Column Right: Prophecy Original (Assembled Parchment)
    this.add.text(440, 80, '— PROFECÍA ORIGINAL PROHIBIDA —', {
      fontFamily: 'Cinzel, serif',
      fontSize: '11px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const prophecyBox = this.add.rectangle(440, 185, 230, 180, 0x1f1730).setStrokeStyle(1, 0x6e5287);
    prophecyBox.setInteractive();

    const prophecyText = [
      '«Cuando los pastores vistan piel de lobo',
      'y alimenten las hogueras con la fe inocente,',
      'de las cenizas del Abismo brotará',
      'una semilla de dos sangres.',
      '',
      'Temed a los que rezan bajo el sol,',
      'pues su virtud es máscara del vacío;',
      'mas buscad al hijo de la sombra...',
      '',
      'Pues cuando el trono de oro se pudra,',
      'solo la Oscuridad que elija amar',
      'será la única Luz en las Tinieblas.»'
    ].join('\n');

    this.add.text(440, 185, prophecyText, {
      fontFamily: 'serif',
      fontSize: '9px',
      color: '#f0e6ff',
      fontStyle: 'italic',
      align: 'center',
      lineSpacing: 3
    }).setOrigin(0.5);

    // Close Hint
    const closeBtn = this.add.text(320, 315, '[P] / [TAB] / [ESC] o Clic aquí para volver', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffd700'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this.closeInventory());

    this.input.keyboard?.on('keydown-P', () => this.closeInventory());
    this.input.keyboard?.on('keydown-TAB', () => this.closeInventory());
    this.input.keyboard?.on('keydown-ESC', () => this.closeInventory());
  }

  private closeInventory(): void {
    this.scene.stop('InventoryScene');
    this.scene.resume('GameScene');
  }
}
