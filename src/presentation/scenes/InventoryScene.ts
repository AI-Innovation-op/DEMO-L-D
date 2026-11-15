import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { ProphecyRepository } from '../../domain/mission/Mission';
import { Weapon } from '../../domain/weapon/Weapon';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';

export interface InventorySceneData {
  player: Character;
  prophecy?: ProphecyRepository;
  unlockedWeaponIds?: string[];
  hasRosarioCedric?: boolean;
}

export class InventoryScene extends Phaser.Scene {
  private player!: Character;
  private prophecy!: ProphecyRepository;
  private unlockedWeaponIds: string[] = ['short_sword'];
  private hasRosarioCedric: boolean = false;
  private audio: WebAudioSoundAdapter = WebAudioSoundAdapter.getInstance();

  constructor() {
    super('InventoryScene');
  }

  public init(data: InventorySceneData): void {
    this.player = data.player;
    this.prophecy = data.prophecy || new ProphecyRepository();
    this.unlockedWeaponIds = data.unlockedWeaponIds || ['short_sword', 'lamento_oakhaven'];
    this.hasRosarioCedric = data.hasRosarioCedric ?? false;
  }

  public create(): void {
    // Dim background
    this.add.rectangle(320, 180, 640, 360, 0x0a0812, 0.94);

    // Modal frame with Celtic gold borders
    this.add.rectangle(320, 180, 580, 320, 0x140e21).setStrokeStyle(2, 0xd4af37);
    this.add.rectangle(320, 180, 572, 312, 0x000000, 0).setStrokeStyle(1, 0x5a3e75);

    // Title
    this.add.text(320, 36, '★ ARSENAL, RELIQUIAS Y PROFECÍA ORIGINAL ★', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '13px',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // ==========================================
    // COLUMN LEFT: WEAPONS & RELICS
    // ==========================================
    this.add.text(160, 64, '— ARSENAL (HAZ CLIC PARA EQUIPAR) —', {
      fontFamily: 'Cinzel, serif',
      fontSize: '10px',
      color: '#e2d4f0',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const weaponsList = [
      { id: 'short_sword', name: '1. Espada Corta del Monaguillo', effect: '«Ascua Prestada» (Hollín explosivo al esquivar)', weapon: Weapon.createShortSword() },
      { id: 'lamento_oakhaven', name: '2. Lamento de Oakhaven (Incensario)', effect: '«Cosecha de Culpa» (+5 HP en combos)', weapon: Weapon.createLamentoOakhaven() },
      { id: 'colmillo_sauce', name: '3. Colmillo del Sauce Negro', effect: '«Eco del Aquelarre» (Sombra de Lyra repite el tajo)', weapon: Weapon.createColmilloSauce() },
      { id: 'falso_veredicto', name: '4. Falso Veredicto (Mandoble)', effect: '«Peso de la Conciencia» (Rompe escudos de oro)', weapon: Weapon.createFalsoVeredicto() },
      { id: 'espejismo_oro', name: '5. Espejismo de Oro y Humo', effect: '«Paso Astral» (Esquiva en niebla púrpura)', weapon: Weapon.createEspejismoOro() },
      { id: 'alba_gris', name: '6. Alba Gris (Espada de la Elección)', effect: '«Luz en las Tinieblas» (Fuego dual sagrado)', weapon: Weapon.createAlbaGris() }
    ];

    const weaponLabels: Phaser.GameObjects.Text[] = [];

    weaponsList.forEach((w, i) => {
      const y = 88 + i * 27;
      const isUnlocked = this.unlockedWeaponIds.includes(w.id);
      const isCurrent = this.player.disarmManager.getCurrentWeapon().id === w.id;

      let color = '#554466';
      let prefix = '🔒 ';
      if (isUnlocked) {
        prefix = isCurrent ? '▶ ' : '  ';
        color = isCurrent ? '#ffd700' : '#e0d2f0';
      }

      const itemBtn = this.add.text(45, y, `${prefix}${w.name}`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color,
        fontStyle: isCurrent ? 'bold' : 'normal'
      });

      this.add.text(58, y + 11, isUnlocked ? w.effect : '«Bloqueado · Continúa la aventura para forjarla»', {
        fontFamily: 'sans-serif',
        fontSize: '7.5px',
        color: isUnlocked ? '#a090b8' : '#453855'
      });

      if (isUnlocked) {
        itemBtn.setInteractive({ useHandCursor: true });
        itemBtn.on('pointerdown', () => {
          this.audio.playSfx('menu_select');
          if (w.id === 'lamento_oakhaven') {
            this.audio.playCenserSwing();
          } else {
            this.audio.playWeaponThrowSound();
          }
          this.player.disarmManager.setEquippedPrimary(w.weapon);
          this.refreshWeaponsUI(weaponsList, weaponLabels);
        });
      }

      weaponLabels.push(itemBtn);
    });

    // Relic Box: Rosario de Madera Humilde
    this.add.text(160, 258, '— RELIQUIA ACTIVA —', {
      fontFamily: 'Cinzel, serif',
      fontSize: '9.5px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.rectangle(160, 285, 250, 36, 0x1b1329).setStrokeStyle(1, 0x6e5287);
    if (this.hasRosarioCedric) {
      this.add.text(160, 278, '📿 ROSARIO DE MADERA HUMILDE', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#88ff88',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.text(160, 292, 'Don del Padre Cedric · +10% Defensa y Postura Sagrada', {
        fontFamily: 'sans-serif',
        fontSize: '7.5px',
        color: '#c0b4d4'
      }).setOrigin(0.5);
    } else {
      this.add.text(160, 285, '🔒 [Sin reliquia · Rescata al Padre Cedric en Oakhaven]', {
        fontFamily: 'sans-serif',
        fontSize: '8px',
        color: '#6e5d80'
      }).setOrigin(0.5);
    }

    // ==========================================
    // COLUMN RIGHT: THE ORIGINAL PROPHECY TABLETS
    // ==========================================
    this.add.text(450, 64, '— PROFECÍA ORIGINAL PROHIBIDA —', {
      fontFamily: 'Cinzel, serif',
      fontSize: '10px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Tablet 1
    const t1Unlocked = true; // Always unlocked once Cedric given
    this.createTabletBox(450, 102, 'TABLILLA I · DON DEL PADRE CEDRIC', [
      '«Cuando los pastores vistan piel de lobo',
      'y alimenten las hogueras con la fe de los inocentes,',
      'de las cenizas del Abismo brotará una semilla de dos sangres.»'
    ], t1Unlocked);

    // Tablet 2
    const t2Unlocked = this.prophecy.isComplete() || this.unlockedWeaponIds.includes('falso_veredicto');
    this.createTabletBox(450, 172, 'TABLILLA II · RESCATE DE SIR GARETH', [
      '«Temed a los que rezan bajo el sol,',
      'pues su virtud es la máscara del vacío;',
      'mas buscad al hijo de la sombra...»'
    ], t2Unlocked);

    // Tablet 3
    const t3Unlocked = this.prophecy.isComplete() || this.unlockedWeaponIds.includes('alba_gris');
    this.createTabletBox(450, 242, 'TABLILLA III · EL VERSO FINAL DEL ABISMO', [
      '«Pues cuando el trono de oro se pudra y el cielo llore ceniza,',
      'solo la Oscuridad que elija amar',
      'será la única Luz en las Tinieblas.»'
    ], t3Unlocked);

    // Close Hint
    const closeBtn = this.add.text(320, 326, '[P] / [I] / [ESC] o Haz Clic Aquí para Volver a Albion ◀', {
      fontFamily: 'monospace',
      fontSize: '9.5px',
      color: '#ffd700',
      backgroundColor: '#26153b',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this.closeInventory());

    this.input.keyboard?.on('keydown-P', () => this.closeInventory());
    this.input.keyboard?.on('keydown-I', () => this.closeInventory());
    this.input.keyboard?.on('keydown-TAB', () => this.closeInventory());
    this.input.keyboard?.on('keydown-ESC', () => this.closeInventory());
  }

  private createTabletBox(x: number, y: number, title: string, lines: string[], isUnlocked: boolean): void {
    this.add.rectangle(x, y, 240, 56, 0x181026)
      .setStrokeStyle(1, isUnlocked ? 0xd4af37 : 0x483259);

    this.add.text(x, y - 20, title, {
      fontFamily: 'monospace',
      fontSize: '7.5px',
      color: isUnlocked ? '#ffd700' : '#6a5582',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const textToDisplay = isUnlocked ? lines.join('\n') : '[Tablilla quebrada en fragmentos · Desbloquea en la aventura]';

    this.add.text(x, y + 4, textToDisplay, {
      fontFamily: 'serif',
      fontSize: isUnlocked ? '8px' : '7.5px',
      color: isUnlocked ? '#f0e6ff' : '#524363',
      fontStyle: isUnlocked ? 'italic' : 'normal',
      align: 'center',
      lineSpacing: 2
    }).setOrigin(0.5);
  }

  private refreshWeaponsUI(
    weaponsList: { id: string; name: string; effect: string }[],
    weaponLabels: Phaser.GameObjects.Text[]
  ): void {
    weaponsList.forEach((w, i) => {
      const isUnlocked = this.unlockedWeaponIds.includes(w.id);
      const isCurrent = this.player.disarmManager.getCurrentWeapon().id === w.id;
      let color = '#554466';
      let prefix = '🔒 ';
      if (isUnlocked) {
        prefix = isCurrent ? '▶ ' : '  ';
        color = isCurrent ? '#ffd700' : '#e0d2f0';
      }
      weaponLabels[i].setText(`${prefix}${w.name}`).setColor(color);
    });
  }

  private closeInventory(): void {
    this.audio.playSfx('menu_select');
    this.scene.stop('InventoryScene');
    this.scene.resume('GameScene');
  }
}
