import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { Weapon } from '../../domain/weapon/Weapon';
import { ProphecyRepository } from '../../domain/mission/Mission';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';

export class MenuModalScene extends Phaser.Scene {
  private player!: Character;
  private audio!: WebAudioSoundAdapter;
  private prophecy!: ProphecyRepository;
  private activeTab: 'STATUS' | 'ARSENAL' | 'PROPHECY' | 'CONTROLS' = 'STATUS';

  // Container & Content Objects
  private modalContainer!: Phaser.GameObjects.Container;
  private contentContainer!: Phaser.GameObjects.Container;
  private tabButtons: Map<string, { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = new Map();

  constructor() {
    super('MenuModalScene');
  }

  public init(data: { player: Character; audio?: WebAudioSoundAdapter }): void {
    this.player = data.player;
    this.audio = data.audio || new WebAudioSoundAdapter();
    this.prophecy = new ProphecyRepository();
    this.prophecy.unlockFragment(1);
    this.prophecy.unlockFragment(2);
    this.prophecy.unlockFragment(3);
  }

  public create(): void {
    // 1. Dim Dark Background Overlay
    this.add.rectangle(320, 180, 640, 360, 0x05030a, 0.88).setInteractive();

    // 2. Modal Main Frame Container (Scale animation)
    this.modalContainer = this.add.container(320, 180);
    this.modalContainer.setScale(0.85);
    this.modalContainer.setAlpha(0);

    // Frame Box with ornate double border
    const frameBg = this.add.rectangle(0, 0, 560, 310, 0x140e21).setStrokeStyle(2, 0xd4af37);
    const innerBorder = this.add.rectangle(0, 0, 552, 302, 0x000000, 0).setStrokeStyle(1, 0x5a3e75);

    // Header Title
    const titleText = this.add.text(0, -135, '— CÓDICE DEL DESTINO & AJUSTES —', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '13px',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Close button (X) top right
    const closeBtn = this.add.text(260, -135, '✕ CERRAR', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#e0c8ff'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeMenu());

    // Tabs Navigation Bar
    const tabs = [
      { key: 'STATUS', label: '1. PERSONAJE' },
      { key: 'ARSENAL', label: '2. ARSENAL' },
      { key: 'PROPHECY', label: '3. PROFECÍA' },
      { key: 'CONTROLS', label: '4. CONTROLES' }
    ];

    const tabWidth = 120;
    const tabStartX = -220;

    tabs.forEach((tab, index) => {
      const tx = tabStartX + index * (tabWidth + 6);
      const ty = -105;

      const tabBg = this.add.rectangle(tx + tabWidth / 2, ty, tabWidth, 22, 0x221738)
        .setStrokeStyle(1, 0x5a3e75)
        .setInteractive({ useHandCursor: true });

      const tabText = this.add.text(tx + tabWidth / 2, ty, tab.label, {
        fontFamily: 'Cinzel, serif',
        fontSize: '9px',
        color: '#c2b0d6',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      tabBg.on('pointerdown', () => {
        this.activeTab = tab.key as 'STATUS' | 'ARSENAL' | 'PROPHECY' | 'CONTROLS';
        this.audio.playSfx('dodge');
        this.updateTabStyles();
        this.renderContent();
      });

      this.tabButtons.set(tab.key, { bg: tabBg, text: tabText });
    });

    // Content container
    this.contentContainer = this.add.container(0, 15);

    this.modalContainer.add([frameBg, innerBorder, titleText, closeBtn]);
    this.tabButtons.forEach(btn => this.modalContainer.add([btn.bg, btn.text]));
    this.modalContainer.add(this.contentContainer);

    // Opening tween animation
    this.tweens.add({
      targets: this.modalContainer,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 220,
      ease: 'Back.easeOut'
    });

    // Render initial active tab
    this.updateTabStyles();
    this.renderContent();

    // Hotkeys
    this.input.keyboard?.on('keydown-ESC', () => this.closeMenu());
    this.input.keyboard?.on('keydown-P', () => this.closeMenu());
    this.input.keyboard?.on('keydown-TAB', () => this.closeMenu());
    this.input.keyboard?.on('keydown-ONE', () => {
      this.activeTab = 'STATUS';
      this.updateTabStyles();
      this.renderContent();
    });
    this.input.keyboard?.on('keydown-TWO', () => {
      this.activeTab = 'ARSENAL';
      this.updateTabStyles();
      this.renderContent();
    });
    this.input.keyboard?.on('keydown-THREE', () => {
      this.activeTab = 'PROPHECY';
      this.updateTabStyles();
      this.renderContent();
    });
    this.input.keyboard?.on('keydown-FOUR', () => {
      this.activeTab = 'CONTROLS';
      this.updateTabStyles();
      this.renderContent();
    });
  }

  private updateTabStyles(): void {
    this.tabButtons.forEach((btn, key) => {
      if (key === this.activeTab) {
        btn.bg.setFillStyle(0x4a2a6b, 1);
        btn.bg.setStrokeStyle(2, 0xffd700);
        btn.text.setColor('#ffd700');
      } else {
        btn.bg.setFillStyle(0x221738, 0.85);
        btn.bg.setStrokeStyle(1, 0x5a3e75);
        btn.text.setColor('#c2b0d6');
      }
    });
  }

  private renderContent(): void {
    this.contentContainer.removeAll(true);

    if (this.activeTab === 'STATUS') {
      this.renderStatusTab();
    } else if (this.activeTab === 'ARSENAL') {
      this.renderArsenalTab();
    } else if (this.activeTab === 'PROPHECY') {
      this.renderProphecyTab();
    } else {
      this.renderControlsTab();
    }
  }

  // ==========================================
  // TAB 1: PERSONAJE & STATS
  // ==========================================
  private renderStatusTab(): void {
    const isThomas = this.player.id === 'thomas';

    // Left Column: Character Card
    const cardBg = this.add.rectangle(-160, 10, 180, 200, 0x1d142e).setStrokeStyle(1, 0x6e4b8a);
    const portraitKey = isThomas ? 'portrait_thomas' : 'portrait_khaterine';
    const portrait = this.add.image(-160, -40, portraitKey).setDisplaySize(72, 72);

    const nameText = this.add.text(-160, 5, isThomas ? 'THOMAS' : 'KHATERINE', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '15px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const roleText = this.add.text(-160, 22, isThomas ? 'Híbrido del Abismo / Monaguillo' : 'Desterrada del Abismo / Falsa Monja', {
      fontFamily: 'sans-serif',
      fontSize: '8px',
      color: '#cbb8e0'
    }).setOrigin(0.5);

    const traitBox = this.add.rectangle(-160, 68, 160, 50, 0x271a3d).setStrokeStyle(1, 0x51386b);
    const traitText = this.add.text(-160, 68, isThomas
      ? 'Rasgo: Superágil y daño destructivo. Se debilita rápidamente ante golpes pesados directos.'
      : 'Rasgo: Hechicera a distancia con arco abismal. Movimiento más lento pero gran resistencia.', {
      fontFamily: 'sans-serif',
      fontSize: '8px',
      color: '#9e8fb3',
      align: 'center',
      wordWrap: { width: 150 }
    }).setOrigin(0.5);

    // Right Column: Detailed Stats & Shalem Level Up
    const statsBg = this.add.rectangle(100, 10, 310, 200, 0x1a1229).setStrokeStyle(1, 0x503766);

    const statsHeader = this.add.text(-40, -75, '— ATRIBUTOS DEL ALMA & ESTADO —', {
      fontFamily: 'Cinzel, serif',
      fontSize: '11px',
      color: '#ffd700',
      fontStyle: 'bold'
    });

    const stats = [
      { label: 'Salud Actual', val: `${this.player.stats.health} / ${this.player.stats.maxHealth}`, col: '#ff7777', pct: this.player.stats.health / this.player.stats.maxHealth },
      { label: 'Guardia / Postura', val: `${this.player.stats.posture} / ${this.player.stats.maxPosture}`, col: '#77aaff', pct: this.player.stats.posture / this.player.stats.maxPosture },
      { label: 'Velocidad de Desplazamiento', val: `${this.player.stats.speed} px/s (${isThomas ? 'Muy Alta' : 'Moderada'})`, col: '#aaffaa', pct: this.player.stats.speed / 250 },
      { label: 'Poder de Ataque Base', val: `${this.player.stats.attackPower} (+ ${this.player.disarmManager.getCurrentWeapon().baseDamage} arma)`, col: '#ddaaff', pct: 0.75 },
      { label: 'Progreso de Nivel (Shalem)', val: `Nivel ${this.player.levelUp.level} (${this.player.levelUp.currentExp}/${this.player.levelUp.maxExp} EXP)`, col: '#ffd700', pct: this.player.levelUp.currentExp / this.player.levelUp.maxExp }
    ];

    stats.forEach((s, i) => {
      const sy = -50 + i * 32;
      this.add.text(-40, sy, s.label, { fontFamily: 'monospace', fontSize: '9px', color: '#c7bed4' });
      this.add.text(240, sy, s.val, { fontFamily: 'monospace', fontSize: '9px', color: s.col }).setOrigin(1, 0);

      // Bar
      this.add.rectangle(100, sy + 15, 270, 6, 0x0c0714).setStrokeStyle(1, 0x3d274f);
      const fillW = Math.max(0, Math.min(270, 270 * s.pct));
      this.add.rectangle(-35 + fillW / 2, sy + 15, fillW, 6, Phaser.Display.Color.HexStringToColor(s.col).color);
    });

    this.contentContainer.add([cardBg, portrait, nameText, roleText, traitBox, traitText, statsBg, statsHeader]);
  }

  // ==========================================
  // TAB 2: ARSENAL & EQUIPAMIENTO INTERACTIVO
  // ==========================================
  private renderArsenalTab(): void {
    const list = [
      { id: 'short_sword', name: 'Espada Corta del Monaguillo', weapon: Weapon.createShortSword(), effect: 'Ascua Prestada: Hollín explosivo al esquivar.' },
      { id: 'lamento_oakhaven', name: 'Lamento de Oakhaven (Incensario)', weapon: Weapon.createLamentoOakhaven(), effect: 'Cosecha de Culpa: Absorbe fuego para curar en combo.' },
      { id: 'colmillo_sauce', name: 'Colmillo del Sauce Negro', weapon: Weapon.createColmilloSauce(), effect: 'Eco del Aquelarre: Silueta espectral de Lyra repite el tajo.' },
      { id: 'falso_veredicto', name: 'Falso Veredicto (Mandoble)', weapon: Weapon.createFalsoVeredicto(), effect: 'Peso de la Conciencia: Rompe escudos y devuelve proyectiles.' },
      { id: 'espejismo_oro', name: 'Espejismo de Oro y Humo', weapon: Weapon.createEspejismoOro(), effect: 'Paso Astral: Esquiva en humo púrpura con señuelo explosivo.' },
      { id: 'alba_gris', name: 'Alba Gris (Espada de la Elección)', weapon: Weapon.createAlbaGris(), effect: 'Luz en las Tinieblas: Fuego negro abismal y luz pura.' }
    ];

    const currentId = this.player.disarmManager.getCurrentWeapon().id;

    list.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const bx = -135 + col * 270;
      const by = -60 + row * 65;

      const isEquipped = currentId === item.id;

      const itemCard = this.add.rectangle(bx, by, 255, 56, isEquipped ? 0x3d2259 : 0x1d152b)
        .setStrokeStyle(isEquipped ? 2 : 1, isEquipped ? 0xffd700 : 0x51386b)
        .setInteractive({ useHandCursor: true });

      const nameT = this.add.text(bx - 115, by - 18, `${isEquipped ? '★ [EQUIPADA] ' : ''}${item.name}`, {
        fontFamily: 'Cinzel, serif',
        fontSize: '9px',
        color: isEquipped ? '#ffd700' : '#ffffff',
        fontStyle: 'bold'
      });

      const statsT = this.add.text(bx - 115, by - 4, `Daño: +${item.weapon.baseDamage}  |  Alcance: ${item.weapon.range}  |  Velocidad: x${item.weapon.attackSpeed}`, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#bbaacc'
      });

      const effectT = this.add.text(bx - 115, by + 10, `Efecto: ${item.effect}`, {
        fontFamily: 'sans-serif',
        fontSize: '7.5px',
        color: '#e0c8ff'
      });

      itemCard.on('pointerdown', () => {
        this.player.disarmManager.setEquippedPrimary(item.weapon);
        this.audio.playCombatHit(true);
        this.renderContent();
      });

      this.contentContainer.add([itemCard, nameT, statsT, effectT]);
    });

    const tip = this.add.text(0, 105, '💡 Haz clic en cualquier arma para equiparla al instante.', {
      fontFamily: 'sans-serif',
      fontSize: '9px',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.contentContainer.add(tip);
  }

  // ==========================================
  // TAB 3: PROFECÍA ORIGINAL & LORE
  // ==========================================
  private renderProphecyTab(): void {
    // Left Box: Profecía Oficial
    const leftBg = this.add.rectangle(-135, 10, 255, 195, 0x181024).setStrokeStyle(1, 0x803333);
    const leftHeader = this.add.text(-135, -75, 'LA PROFECÍA OFICIAL (ALTA PRELATURA)', {
      fontFamily: 'Cinzel, serif',
      fontSize: '8.5px',
      color: '#ff8888',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const officialText = [
      '«Cuando los pastores sean revestidos con pieles',
      'de lobo y alimenten las hogueras sagradas,',
      'de las cenizas surgirá el fruto de dos sangres.',
      '',
      'Temed al nacido bajo la sombra,',
      'pues su virtud será máscara y su alma, un vacío;',
      'la Oscuridad se alzará sobre toda Luz,',
      'y el mundo entero será devorado.»'
    ].join('\n');

    const leftBody = this.add.text(-135, 15, officialText, {
      fontFamily: 'serif',
      fontSize: '8px',
      color: '#e6c8c8',
      fontStyle: 'italic',
      align: 'center',
      lineSpacing: 3
    }).setOrigin(0.5);

    // Right Box: Profecía Original Reconstruida
    const rightBg = this.add.rectangle(135, 10, 255, 195, 0x181024).setStrokeStyle(2, 0xd4af37);
    const rightHeader = this.add.text(135, -75, 'LA PROFECÍA ORIGINAL (3/3 FRAGMENTOS)', {
      fontFamily: 'Cinzel, serif',
      fontSize: '8.5px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const originalText = [
      '«Cuando los pastores vistan piel de lobo',
      'y alimenten las hogueras con la fe inocente,',
      'de las cenizas brotará una semilla de dos sangres.',
      '',
      'Temed a los que rezan bajo el sol,',
      'pues su virtud es la máscara del vacío;',
      'mas buscad al hijo de la sombra...',
      '',
      'Pues cuando el trono de oro se pudra,',
      'solo la Oscuridad que elija amar',
      'será la única Luz en las Tinieblas.»'
    ].join('\n');

    const rightBody = this.add.text(135, 15, originalText, {
      fontFamily: 'serif',
      fontSize: '8px',
      color: '#fff3cc',
      fontStyle: 'italic',
      align: 'center',
      lineSpacing: 3
    }).setOrigin(0.5);

    this.contentContainer.add([leftBg, leftHeader, leftBody, rightBg, rightHeader, rightBody]);
  }

  // ==========================================
  // TAB 4: CONTROLES & GUÍA TÁCTICA
  // ==========================================
  private renderControlsTab(): void {
    const controls = [
      { key: 'A / D o Flechas', desc: 'Desplazamiento horizontal fluido con inercia.' },
      { key: 'W / ESPACIO', desc: 'Salto acrobático para evadir golpes bajos.' },
      { key: 'J', desc: 'Ataque Melee / Magia: Combos continuos y remates.' },
      { key: 'K', desc: 'Bloqueo / Duelista: Consume guardia y anula daño.' },
      { key: 'L', desc: 'Esquiva: Dash con fotogramas de invulnerabilidad.' },
      { key: 'T', desc: 'Lanzar Arma (Desarme Opción B): Aturde a distancia.' },
      { key: 'E', desc: 'Recoger Arma: Recupera tu espada o roba del suelo.' },
      { key: 'M', desc: 'Minijuegos con Shalem: Se activa con Level Up lleno.' },
      { key: '1 / 2 / 3', desc: 'Viaje rápido entre Oakhaven, Londinium y Catedral.' }
    ];

    controls.forEach((c, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const cx = -135 + col * 270;
      const cy = -65 + row * 32;

      const keyPill = this.add.rectangle(cx - 70, cy, 95, 18, 0x2e1f42).setStrokeStyle(1, 0x6e4b8a);
      const keyLabel = this.add.text(cx - 70, cy, c.key, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const descLabel = this.add.text(cx - 15, cy, c.desc, {
        fontFamily: 'sans-serif',
        fontSize: '7.5px',
        color: '#d6c8e8',
        wordWrap: { width: 145 }
      }).setOrigin(0, 0.5);

      this.contentContainer.add([keyPill, keyLabel, descLabel]);
    });

    // Audio Mute Quick Toggle Button inside Controls Tab
    const audioAdapter = WebAudioSoundAdapter.getInstance();
    const isMuted = audioAdapter.getIsMuted();
    const muteTogglePill = this.add.rectangle(0, 95, 260, 22, isMuted ? 0x551a1a : 0x1f3d24)
      .setStrokeStyle(1, isMuted ? 0xff7777 : 0x77ff77)
      .setInteractive({ useHandCursor: true });

    const muteToggleText = this.add.text(0, 95, isMuted ? '🔇 AUDIO: SILENCIADO (Clic para activar)' : '🔊 AUDIO: ACTIVADO (Clic para silenciar)', {
      fontFamily: 'monospace',
      fontSize: '8.5px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    muteTogglePill.on('pointerdown', () => {
      const mutedNow = audioAdapter.toggleMute();
      muteTogglePill.setFillStyle(mutedNow ? 0x551a1a : 0x1f3d24);
      muteTogglePill.setStrokeStyle(1, mutedNow ? 0xff7777 : 0x77ff77);
      muteToggleText.setText(mutedNow ? '🔇 AUDIO: SILENCIADO (Clic para activar)' : '🔊 AUDIO: ACTIVADO (Clic para silenciar)');
    });

    this.contentContainer.add([muteTogglePill, muteToggleText]);
  }

  private closeMenu(): void {
    this.tweens.add({
      targets: this.modalContainer,
      scaleX: 0.85,
      scaleY: 0.85,
      alpha: 0,
      duration: 160,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.scene.stop('MenuModalScene');
        this.scene.resume('GameScene');
      }
    });
  }
}
