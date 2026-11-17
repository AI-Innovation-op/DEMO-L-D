import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { Weapon } from '../../domain/weapon/Weapon';
import { ProphecyRepository } from '../../domain/mission/Mission';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';

export class MenuModalScene extends Phaser.Scene {
  private player!: Character;
  private audio!: WebAudioSoundAdapter;
  private prophecy!: ProphecyRepository;
  private activeTab: 'STATUS' | 'ARSENAL' | 'PROPHECY' | 'CHRONICLES' | 'CONTROLS' = 'STATUS';
  private selectedChronicleIndex: number = 0;

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
    // 0. Sleep and completely HIDE HUDScene so HUD elements don't bleed through or conflict with the modal
    const hud = this.scene.get('HUDScene');
    if (hud) {
      hud.cameras?.main?.setVisible(false);
    }
    if (this.scene.isActive('HUDScene')) {
      this.scene.sleep('HUDScene');
      this.scene.setVisible(false, 'HUDScene');
    }
    this.scene.bringToTop('MenuModalScene');

    // 1. Dim Dark Background Overlay (opaque enough to keep focus completely on the modal)
    this.add.rectangle(320, 180, 640, 360, 0x05030a, 0.95).setInteractive().setDepth(99);

    // 2. Modal Main Frame Container (Scale animation)
    this.modalContainer = this.add.container(320, 180).setDepth(100);
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
      { key: 'STATUS', label: '1. HÉROE' },
      { key: 'ARSENAL', label: '2. ARSENAL' },
      { key: 'PROPHECY', label: '3. PROFECÍA' },
      { key: 'CHRONICLES', label: '4. CÓDICE' },
      { key: 'CONTROLS', label: '5. CONTROLES' }
    ];

    const tabWidth = 98;
    const tabStartX = -255;

    tabs.forEach((tab, index) => {
      const tx = tabStartX + index * (tabWidth + 6);
      const ty = -105;

      const tabBg = this.add.rectangle(tx + tabWidth / 2, ty, tabWidth, 22, 0x221738)
        .setStrokeStyle(1, 0x5a3e75)
        .setInteractive({ useHandCursor: true });

      const tabText = this.add.text(tx + tabWidth / 2, ty, tab.label, {
        fontFamily: 'Cinzel, serif',
        fontSize: '8.5px',
        color: '#c2b0d6',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      tabBg.on('pointerdown', () => {
        this.activeTab = tab.key as 'STATUS' | 'ARSENAL' | 'PROPHECY' | 'CHRONICLES' | 'CONTROLS';
        this.audio.playSfx('dodge');
        this.updateTabStyles();
        this.renderContent();
      });

      this.tabButtons.set(tab.key, { bg: tabBg, text: tabText });
    });

    // Content container (centered with ample margin to header tabs and bottom action buttons)
    this.contentContainer = this.add.container(0, 8);

    // Bottom Action Bar: [⮌ VOLVER AL MENÚ INICIAL] and [▶ VOLVER A LA PARTIDA]
    const btnMenuBg = this.add.rectangle(-115, 134, 210, 24, 0x2e111d)
      .setStrokeStyle(1.5, 0xb83d52)
      .setInteractive({ useHandCursor: true });

    const btnMenuText = this.add.text(-115, 134, '⮌ VOLVER AL MENÚ INICIAL', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8.5px',
      color: '#ffb3ba',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btnMenuBg.on('pointerover', () => {
      btnMenuBg.setFillStyle(0x4a1827);
      btnMenuBg.setStrokeStyle(1.5, 0xffd700);
      btnMenuText.setColor('#ffffff');
    });
    btnMenuBg.on('pointerout', () => {
      btnMenuBg.setFillStyle(0x2e111d);
      btnMenuBg.setStrokeStyle(1.5, 0xb83d52);
      btnMenuText.setColor('#ffb3ba');
    });
    btnMenuBg.on('pointerdown', () => this.returnToMainMenu());

    const btnResumeBg = this.add.rectangle(115, 134, 210, 24, 0x142b1a)
      .setStrokeStyle(1.5, 0x3d9456)
      .setInteractive({ useHandCursor: true });

    const btnResumeText = this.add.text(115, 134, '▶ VOLVER A LA PARTIDA', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8.5px',
      color: '#b3ffc6',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btnResumeBg.on('pointerover', () => {
      btnResumeBg.setFillStyle(0x1d4026);
      btnResumeBg.setStrokeStyle(1.5, 0xffd700);
      btnResumeText.setColor('#ffffff');
    });
    btnResumeBg.on('pointerout', () => {
      btnResumeBg.setFillStyle(0x142b1a);
      btnResumeBg.setStrokeStyle(1.5, 0x3d9456);
      btnResumeText.setColor('#b3ffc6');
    });
    btnResumeBg.on('pointerdown', () => this.closeMenu());

    this.modalContainer.add([frameBg, innerBorder, titleText, closeBtn, btnMenuBg, btnMenuText, btnResumeBg, btnResumeText]);
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
    } else if (this.activeTab === 'CHRONICLES') {
      this.renderChroniclesTab();
    } else {
      this.renderControlsTab();
    }
  }

  // ==========================================
  // TAB 1: PERSONAJE & STATS
  // ==========================================
  private renderStatusTab(): void {
    const isThomas = this.player.id === 'thomas';

    // Left Column: Character Card (188px height to maintain 14px breathing room above bottom buttons)
    const cardBg = this.add.rectangle(-160, 6, 180, 188, 0x1d142e).setStrokeStyle(1, 0x6e4b8a);
    const portraitKey = isThomas ? 'portrait_thomas' : 'portrait_khaterine';
    let portrait: Phaser.GameObjects.GameObject;
    if (this.textures.exists(portraitKey)) {
      portrait = this.add.image(-160, -42, portraitKey).setDisplaySize(70, 70);
    } else {
      portrait = this.add.rectangle(-160, -42, 70, 70, 0x271a3d).setStrokeStyle(1, 0x6e4b8a);
    }

    const nameText = this.add.text(-160, 3, isThomas ? 'THOMAS' : 'KHATERINE', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '15px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const roleText = this.add.text(-160, 20, isThomas ? 'Híbrido del Abismo / Monaguillo' : 'Desterrada del Abismo / Falsa Monja', {
      fontFamily: 'sans-serif',
      fontSize: '8px',
      color: '#cbb8e0'
    }).setOrigin(0.5);

    const traitBox = this.add.rectangle(-160, 62, 160, 46, 0x271a3d).setStrokeStyle(1, 0x51386b);
    const traitText = this.add.text(-160, 62, isThomas
      ? 'Rasgo: Superágil y daño destructivo. Se debilita rápidamente ante golpes pesados directos.'
      : 'Rasgo: Hechicera a distancia con arco abismal. Movimiento más lento pero gran resistencia.', {
      fontFamily: 'sans-serif',
      fontSize: '8px',
      color: '#9e8fb3',
      align: 'center',
      wordWrap: { width: 150 }
    }).setOrigin(0.5);

    // Right Column: Detailed Stats & Shalem Level Up
    const statsBg = this.add.rectangle(100, 6, 310, 188, 0x1a1229).setStrokeStyle(1, 0x503766);

    const statsHeader = this.add.text(100, -73, '— ATRIBUTOS DEL ALMA & ESTADO —', {
      fontFamily: 'Cinzel, serif',
      fontSize: '11px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const stats = [
      { label: 'Salud Actual', val: `${this.player.stats.health} / ${this.player.stats.maxHealth}`, col: '#ff7777', pct: this.player.stats.health / this.player.stats.maxHealth },
      { label: 'Guardia / Postura', val: `${this.player.stats.posture} / ${this.player.stats.maxPosture}`, col: '#77aaff', pct: this.player.stats.posture / this.player.stats.maxPosture },
      { label: 'Velocidad de Desplazamiento', val: `${this.player.stats.speed} px/s (${isThomas ? 'Muy Alta' : 'Moderada'})`, col: '#aaffaa', pct: this.player.stats.speed / 250 },
      { label: 'Poder de Ataque Base', val: `${this.player.stats.attackPower} (+ ${this.player.disarmManager.getCurrentWeapon().baseDamage} arma)`, col: '#ddaaff', pct: 0.75 },
      { label: 'Progreso de Nivel (Shalem)', val: `Nivel ${this.player.levelUp.level} (${this.player.levelUp.currentExp}/${this.player.levelUp.maxExp} EXP)`, col: '#ffd700', pct: this.player.levelUp.maxExp > 0 ? this.player.levelUp.currentExp / this.player.levelUp.maxExp : 0 }
    ];

    this.contentContainer.add([cardBg, portrait, nameText, roleText, traitBox, traitText, statsBg, statsHeader]);

    const barW = 280;
    stats.forEach((s, i) => {
      const sy = -52 + i * 29;
      const labelText = this.add.text(-40, sy, s.label, {
        fontFamily: 'Cinzel, monospace',
        fontSize: '8.5px',
        color: '#c7bed4'
      });
      const valText = this.add.text(240, sy, s.val, {
        fontFamily: 'monospace',
        fontSize: '8.5px',
        color: s.col,
        fontStyle: 'bold'
      }).setOrigin(1, 0);

      // Bar container & fill
      const barBg = this.add.rectangle(100, sy + 13, barW, 6, 0x0c0714).setStrokeStyle(1, 0x3d274f);
      const safePct = isNaN(s.pct) ? 0 : Math.max(0, Math.min(1, s.pct));
      const fillW = Math.max(0, Math.min(barW, barW * safePct));
      const barFill = this.add.rectangle(-40 + fillW / 2, sy + 13, fillW, 6, Phaser.Display.Color.HexStringToColor(s.col).color);

      this.contentContainer.add([labelText, valText, barBg, barFill]);
    });
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
    // Left Box: Profecía Oficial (188px height for clean bottom margin)
    const leftBg = this.add.rectangle(-135, 6, 255, 188, 0x181024).setStrokeStyle(1, 0x803333);
    const leftHeader = this.add.text(-135, -73, 'LA PROFECÍA OFICIAL (ALTA PRELATURA)', {
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

    const leftBody = this.add.text(-135, 12, officialText, {
      fontFamily: 'serif',
      fontSize: '8px',
      color: '#e6c8c8',
      fontStyle: 'italic',
      align: 'center',
      lineSpacing: 3
    }).setOrigin(0.5);

    // Right Box: Profecía Original Reconstruida (188px height)
    const rightBg = this.add.rectangle(135, 6, 255, 188, 0x181024).setStrokeStyle(2, 0xd4af37);
    const rightHeader = this.add.text(135, -73, 'LA PROFECÍA ORIGINAL (3/3 FRAGMENTOS)', {
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

    const rightBody = this.add.text(135, 12, originalText, {
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
  // TAB 4: CÓDICE DE ALBION (LOS 20 CAPÍTULOS DE KEVIN)
  // ==========================================
  private renderChroniclesTab(): void {
    const chronicles = [
      {
        id: 'act1',
        title: 'I. OAKHAVEN (CAPS I–VI)',
        sub: 'Las Cenizas de la Inquisición',
        portrait: 'morwenna_crucible',
        speaker: 'THOMAS & CEDRIC',
        text: '«Dieciocho inviernos vivió Thomas como un modesto monaguillo en Oakhaven, ignorando que en su sangre latía el fuego del Abismo legado por las nueve brujas sacrificadas en la Luna Roja. Cuando Madre Morwenna marchó con sus bestias de ceniza para arrancar a Elowen hacia la pira, el Padre Cedric entregó a Thomas el Rosario de Madera y la primera tablilla. Thomas despertó el fuego negro en su hoja, quebrando las hogueras de la Inquisición.»',
        quote: '«Shalem: "Un buen comienzo, monaguillo. Pero el humo de Oakhaven solo fue la mecha de la tormenta".»'
      },
      {
        id: 'campanario',
        title: 'II. EL CAMPANARIO (CAPS VII–IX)',
        sub: 'La Reja Suelta y el Granero',
        portrait: 'elowen_campanario',
        speaker: 'ELOWEN & KHATERINE',
        text: '«Recluida en la celda del campanario, Elowen soportó el castigo de la sal gruesa. Antes de que los caballeros dorados la trasladasen a Londinium como ofrenda, Elowen quebró el crisol sagrado de Morwenna con su luz plateada. Con carbón y una tira de lino atada a su pájaro de madera, envió su mensaje a Thomas: "Londinium es sacrificio. Reja suelta." Al otro lado, Khaterine recuperó las dos hojas del Colmillo del Sauce Negro bajo la losa del granero.»',
        quote: '«Shalem: "El coraje de esa chica supera al de cualquier rey con corona de latón podrido".»'
      },
      {
        id: 'puente',
        title: 'III. EL GRAN PUENTE (CAPS X–XIII)',
        sub: 'El Camino de los Herejes',
        portrait: 'portrait_thomas',
        speaker: 'THOMAS & ELOWEN',
        text: '«El avance hacia el norte llevó al grupo a través de la densa niebla fluvial del Gran Puente de Piedra. Custodiado por el Capitán Áureo Vane y caballeros con escudos de torre, los rebeldes lucharon para liberar el convoy de campesinos y los carros de prisioneros de Martín y Tobías, abriéndose paso hacia las murallas exteriores de Londinium.»',
        quote: '«Shalem: "Los escudos pesados solo sirven si el corazón de quien los sostiene no tiembla de miedo".»'
      },
      {
        id: 'act2',
        title: 'IV. LONDINIUM (CAPS XIV–XVII)',
        sub: 'La Corona del Deseo y Alaric',
        portrait: 'portrait_malphas',
        speaker: 'REX MALPHAS (ALARIC)',
        text: '«La Ciudadela Dorada brillaba con la hipocresía del Cáliz Solar. Los caballeros imperiales custodiaban a un monarca que vendió a su familia: Rex Malphas, el antiguo maestro Alaric del Sauce Negro. Thomas y Khaterine se abrieron paso hasta el trono astral, donde Malphas reveló que Thomas era el hijo de la Luna Roja. Al quebrar al falso rey, las leyes de la gravedad y la realidad colapsaron.»',
        quote: '«Shalem: "Los espejos de Alaric eran hermosos, pero la verdad siempre corta más profundo que el cristal".»'
      },
      {
        id: 'act3',
        title: 'V. CATEDRAL INVERTIDA (CAPS XVIII–XX)',
        sub: 'Alba Gris y la Luz en las Tinieblas',
        portrait: 'portrait_astaroth',
        speaker: 'THOMAS & ELOWEN',
        text: '«Suspendida sobre el vacío cósmico, la Catedral Invertida aguardaba la manifestación de Astaroth, el Padre de las Cenizas. Elowen sacrificó su Gota de Luz Divina para forjar Alba Gris: la espada biseccionada que no pertenece ni al Cielo ni al Abismo. Al elegir amar en lugar de odiar, Thomas venció a Astaroth, disipando la niebla de dieciocho años y trayendo el primer amanecer.»',
        quote: '«Shalem: "Solo la Oscuridad que elija amar será la única Luz en las Tinieblas. Nunca lo olvides".»'
      }
    ];

    // Left List (Chronicle Selectors)
    const listX = -155;
    const listW = 195;

    chronicles.forEach((c, idx) => {
      const cy = -68 + idx * 37;
      const isSelected = idx === this.selectedChronicleIndex;

      const btnBg = this.add.rectangle(listX, cy, listW, 33, isSelected ? 0x3d2259 : 0x181026)
        .setStrokeStyle(1.5, isSelected ? 0xffd700 : 0x483259)
        .setInteractive({ useHandCursor: true });

      const titleTxt = this.add.text(listX - listW / 2 + 10, cy - 7, c.title, {
        fontFamily: 'Cinzel, monospace',
        fontSize: '8px',
        color: isSelected ? '#ffd700' : '#d2c2e8',
        fontStyle: 'bold'
      });

      const subTxt = this.add.text(listX - listW / 2 + 10, cy + 6, c.sub, {
        fontFamily: 'sans-serif',
        fontSize: '6.5px',
        color: isSelected ? '#ffffff' : '#8874a3'
      });

      btnBg.on('pointerdown', () => {
        this.selectedChronicleIndex = idx;
        this.audio.playSfx('menu_select');
        this.renderContent();
      });

      this.contentContainer.add([btnBg, titleTxt, subTxt]);
    });

    // Right Detail View (188px height for clean bottom margin)
    const cur = chronicles[this.selectedChronicleIndex] || chronicles[0];
    const rightX = 105;
    const rightW = 310;
    const rightH = 188;

    const detailBg = this.add.rectangle(rightX, 6, rightW, rightH, 0x140c21)
      .setStrokeStyle(1.5, 0xd4af37);
    const detailInner = this.add.rectangle(rightX, 6, rightW - 6, rightH - 6, 0x000000, 0)
      .setStrokeStyle(1, 0x5a3b75);

    // Mini Portrait / Artwork Badge
    let img;
    if (this.textures.exists(cur.portrait)) {
      img = this.add.image(rightX - rightW / 2 + 38, -45, cur.portrait).setDisplaySize(54, 54);
    }
    const border = this.add.rectangle(rightX - rightW / 2 + 38, -45, 56, 56, 0x000000, 0)
      .setStrokeStyle(1, 0xd4af37);

    const bannerTitle = this.add.text(rightX - rightW / 2 + 75, -60, cur.title, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '10px',
      color: '#ffd700',
      fontStyle: 'bold'
    });

    const speakerBanner = this.add.text(rightX - rightW / 2 + 75, -42, `Crónica canónica · ${cur.speaker}`, {
      fontFamily: 'monospace',
      fontSize: '7.5px',
      color: '#b094db'
    });

    const divider = this.add.rectangle(rightX, -10, rightW - 20, 1, 0x6e4b8a);

    const body = this.add.text(rightX - rightW / 2 + 12, 0, cur.text, {
      fontFamily: 'serif',
      fontSize: '8.5px',
      color: '#f0e6ff',
      wordWrap: { width: rightW - 24 },
      lineSpacing: 3
    });

    const quoteBox = this.add.rectangle(rightX, 82, rightW - 20, 26, 0x241538).setStrokeStyle(1, 0x7a5296);
    const quoteText = this.add.text(rightX, 82, cur.quote, {
      fontFamily: 'serif',
      fontSize: '7.5px',
      color: '#ffd700',
      fontStyle: 'italic',
      align: 'center',
      wordWrap: { width: rightW - 30 }
    }).setOrigin(0.5);

    const detailObjects: Phaser.GameObjects.GameObject[] = [detailBg, detailInner, border, bannerTitle, speakerBanner, divider, body, quoteBox, quoteText];
    if (img) detailObjects.unshift(img);
    this.contentContainer.add(detailObjects);
  }

  // ==========================================
  // TAB 5: CONTROLES & GUÍA TÁCTICA
  // ==========================================
  private renderControlsTab(): void {
    const controls = [
      { key: 'WASD / Flechas', desc: 'Movimiento en 2.5D: Desplazamiento y profundidad.' },
      { key: 'J', desc: 'Ataque Ligero / Rúnico: Cadencia rápida y combos continuos.' },
      { key: 'K', desc: 'Ataque Fuerte (x1.6): Quiebra guardia y causa alto impacto.' },
      { key: 'L (Mantener)', desc: 'Guardia & Parry: Bloquea y repele con timing exacto.' },
      { key: 'ESPACIO', desc: 'Esquiva / Dash: Evasión acrobática con invulnerabilidad.' },
      { key: 'TAB', desc: 'Cambiar Héroe: Alterna entre Thomas y Khaterine en combate.' },
      { key: 'T / Q', desc: 'Lanzar Arma (Opción B): Desarme táctico para noquear a distancia.' },
      { key: 'E', desc: 'Recoger / Hablar: Toma armas del suelo o dialoga con aliados.' },
      { key: 'C', desc: 'Charlas de Lore: Diálogos canónicos con Elowen y Cedric.' },
      { key: 'P / ESC', desc: 'Menú & Códice: Arsenal, profecía, crónicas y pausa.' }
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

    // Audio Mute Quick Toggle & 3D Prototype buttons side by side at y = 92 (aligned under left and right columns)
    const audioAdapter = WebAudioSoundAdapter.getInstance();
    const isMuted = audioAdapter.getIsMuted();
    const muteTogglePill = this.add.rectangle(-135, 92, 255, 20, isMuted ? 0x551a1a : 0x1f3d24)
      .setStrokeStyle(1, isMuted ? 0xff7777 : 0x77ff77)
      .setInteractive({ useHandCursor: true });

    const muteToggleText = this.add.text(-135, 92, isMuted ? '🔇 AUDIO: SILENCIADO (Clic para activar)' : '🔊 AUDIO: ACTIVADO (Clic para silenciar)', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    muteTogglePill.on('pointerdown', () => {
      const mutedNow = audioAdapter.toggleMute();
      muteTogglePill.setFillStyle(mutedNow ? 0x551a1a : 0x1f3d24);
      muteTogglePill.setStrokeStyle(1, mutedNow ? 0xff7777 : 0x77ff77);
      muteToggleText.setText(mutedNow ? '🔇 AUDIO: SILENCIADO (Clic para activar)' : '🔊 AUDIO: ACTIVADO (Clic para silenciar)');
    });

    const proto3dBtn = this.add.rectangle(135, 92, 255, 20, 0x1a243d)
      .setStrokeStyle(1, 0x5599ff)
      .setInteractive({ useHandCursor: true });

    const proto3dText = this.add.text(135, 92, '🏛️ PROBAR PROTOTIPO 3D (OAKHAVEN)', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '8px',
      color: '#99ddff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    proto3dBtn.on('pointerdown', () => {
      this.closeMenu();
      (window as unknown as { launch3DPrototype?: () => void }).launch3DPrototype?.();
    });

    this.contentContainer.add([muteTogglePill, muteToggleText, proto3dBtn, proto3dText]);
  }

  private returnToMainMenu(): void {
    this.audio.playSfx('menu_select');

    // Attempt to persist latest progress
    const gameScene = this.scene.get('GameScene') as unknown as { saveCheckpoint?: () => void };
    if (gameScene && typeof gameScene.saveCheckpoint === 'function') {
      try {
        gameScene.saveCheckpoint();
      } catch { /* ignore */ }
    }

    if (this.scene.isActive('HUDScene') || this.scene.isSleeping('HUDScene')) {
      this.scene.stop('HUDScene');
    }

    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(320, () => {
      this.scene.stop('MenuModalScene');
      this.scene.stop('GameScene');
      this.scene.start('TitleScene');
    });
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
        const hud = this.scene.get('HUDScene');
        if (hud) {
          hud.cameras?.main?.setVisible(true);
        }
        if (this.scene.isSleeping('HUDScene') || this.scene.isActive('HUDScene')) {
          this.scene.setVisible(true, 'HUDScene');
          this.scene.wake('HUDScene');
        }
        this.scene.stop('MenuModalScene');
        this.scene.resume('GameScene');
      }
    });
  }
}
