export interface CanonChapter {
  readonly id: number;
  readonly act: number;
  readonly romanNumber: string;
  readonly title: string;
  readonly actTitle: string;
  readonly location: string;
  readonly summary: string;
  readonly keyCharacters: string[];
  readonly bossOrEncounter?: string;
  readonly relicReward?: string;
  readonly targetAreaKey: string;
}

export const CANON_CHAPTERS: CanonChapter[] = [
  // --- PRÓLOGO & ACTO I: CENIZAS EN OAKHAVEN (CAPÍTULOS I - VI) ---
  {
    id: 1,
    act: 1,
    romanNumber: 'I',
    title: 'El Monaguillo de las Sombras',
    actTitle: 'Acto I: Cenizas en Oakhaven',
    location: 'Parroquia de San Jude, Oakhaven',
    summary: 'Thomas, huérfano criado como monaguillo por el Padre Cedric, descubre que la sangre que corre por sus venas es fuego negro primordial. Las cruces de madera del templo comienzan a sangrar resina caliente.',
    keyCharacters: ['Thomas', 'Padre Cedric'],
    relicReward: 'Espada Corta del Monaguillo',
    targetAreaKey: 'surface'
  },
  {
    id: 2,
    act: 1,
    romanNumber: 'II',
    title: 'La Huida en la Nieve',
    actTitle: 'Acto I: Cenizas en Oakhaven',
    location: 'Pozo de Piedra de la Aldea',
    summary: 'Los centinelas del Cáliz Solar irrumpen en la aldea. Un gato negro de ojos dorados, Shalem —el Gran Marqués de las Brasas sellado en carne felina—, guía a Thomas a través de las cenizas y le enseña la técnica de la esquiva milimétrica.',
    keyCharacters: ['Thomas', 'Shalem'],
    bossOrEncounter: 'Sabueso de Ceniza',
    targetAreaKey: 'surface'
  },
  {
    id: 3,
    act: 1,
    romanNumber: 'III',
    title: 'La Cazadora del Sauce',
    actTitle: 'Acto I: Cenizas en Oakhaven',
    location: 'Linderos del Bosque Norte',
    summary: 'Khaterine, la falsa novicia y última superviviente del Aquelarre del Sauce Negro, protege a Thomas con su arco abisal y su barrera mística, recordándole el juramento de sangre que los une desde la cuna.',
    keyCharacters: ['Thomas', 'Khaterine'],
    bossOrEncounter: 'Portador de Cenizas',
    relicReward: 'Pluma del Sauce Negro',
    targetAreaKey: 'surface'
  },
  {
    id: 4,
    act: 1,
    romanNumber: 'IV',
    title: 'La Botica de las Cenizas',
    actTitle: 'Acto I: Cenizas en Oakhaven',
    location: 'Botica de Elowen',
    summary: 'Elowen prepara ungüentos y bálsamos de hoja de plata bendita en su caldero ancestral antes de ser capturada por los guardias inquisitoriales por negarse a quemar a los enfermos.',
    keyCharacters: ['Elowen', 'Thomas'],
    relicReward: 'Bálsamo de la Doncella & Caldero de Botica',
    targetAreaKey: 'surface'
  },
  {
    id: 5,
    act: 1,
    romanNumber: 'V',
    title: 'La Pira de los Herejes',
    actTitle: 'Acto I: Cenizas en Oakhaven',
    location: 'La Gran Pira de Oakhaven',
    summary: 'Madre Morwenna enciende la hoguera comunal empuñando el Crisol de Fuego Abisal. Thomas y Khaterine enfrentan a la inquisidora fanática entre llamaradas y géiseres de azufre.',
    keyCharacters: ['Thomas', 'Khaterine', 'Madre Morwenna'],
    bossOrEncounter: 'Madre Morwenna (Fase 1)',
    targetAreaKey: 'surface'
  },
  {
    id: 6,
    act: 1,
    romanNumber: 'VI',
    title: 'El Velo del Crisol Desatado',
    actTitle: 'Acto I: Cenizas en Oakhaven',
    location: 'Cementerio y Criptas de San Jude',
    summary: 'Morwenna desata las alas de ceniza y la corona de espinas ígneas. Tras su caída, Thomas obtiene la Llave de las Criptas y desciende a las losas subterráneas donde el Inquisidor Caído custodia los sellos.',
    keyCharacters: ['Thomas', 'Madre Morwenna', 'Inquisidor Caído'],
    bossOrEncounter: 'Madre Morwenna (Fase 2) / Inquisidor Caído',
    relicReward: 'Llave de las Criptas & Sello de la Inquisición',
    targetAreaKey: 'crypts_interior'
  },

  // --- ACTO II: EL CAMPANARIO Y EL GRANERO DEL SUR (CAPÍTULOS VII - IX) ---
  {
    id: 7,
    act: 2,
    romanNumber: 'VII',
    title: 'La Torre del Martirio',
    actTitle: 'Acto II: El Campanario y el Granero del Sur',
    location: 'Torre del Campanario del Sur',
    summary: 'Elowen permanece encerrada en la celda circular de sal gruesa bajo el tañido ensordecedor de las campanas de hierro. Escribe una advertencia en una tira de lino atada a su pájaro de madera tallada y la arroja por la reja.',
    keyCharacters: ['Elowen'],
    relicReward: 'Pájaro de Madera de Sauce',
    targetAreaKey: 'belltower_summit'
  },
  {
    id: 8,
    act: 2,
    romanNumber: 'VIII',
    title: 'El Colmillo Bajo la Losa Sagrada',
    actTitle: 'Acto II: El Campanario y el Granero del Sur',
    location: 'El Bosque del Sauce Negro',
    summary: 'Thomas y Khaterine hallan el pájaro tallado y se internan en el Bosque del Sauce Negro. Tras abatir al Acechador de Raíces, descubren bajo el altar de las nueve hermanas el Colmillo del Sauce Negro.',
    keyCharacters: ['Thomas', 'Khaterine', 'Shalem'],
    bossOrEncounter: 'Acechador de Raíces (Root Prowler)',
    relicReward: 'Colmillo del Sauce Negro [U]',
    targetAreaKey: 'black_willow_forest'
  },
  {
    id: 9,
    act: 2,
    romanNumber: 'IX',
    title: 'La Purga del Crisol',
    actTitle: 'Acto II: El Campanario y el Granero del Sur',
    location: 'Cúspide del Campanario y Gran Horno de Bronce',
    summary: 'Ascenso vertical a través de la torre combatiendo coristas y fanáticos con mayales. En la sala del horno, enfrentan al colosal Guardián del Crisol de Bronce y liberan a Elowen de sus cadenas.',
    keyCharacters: ['Thomas', 'Khaterine', 'Elowen', 'Guardián del Crisol'],
    bossOrEncounter: 'El Guardián del Crisol',
    relicReward: 'Lamento de Oakhaven (Incensario Litúrgico)',
    targetAreaKey: 'belltower_summit'
  },

  // --- ACTO III: EL GRAN PUENTE DE PIEDRA — EL CAMINO DE LOS HEREJES (CAPÍTULOS X - XIII) ---
  {
    id: 10,
    act: 3,
    romanNumber: 'X',
    title: 'El Camino de los Herejes',
    actTitle: 'Acto III: El Gran Puente de Piedra',
    location: 'Calzada Fluvial y Marismas del Norte',
    summary: 'La comitiva avanza por la calzada bordeada de cruces de herejes y niebla fría. Shalem advierte sobre las armaduras solares y los escudos de torre impenetrables de la guardia de Londinium.',
    keyCharacters: ['Thomas', 'Khaterine', 'Shalem'],
    targetAreaKey: 'great_stone_bridge'
  },
  {
    id: 11,
    act: 3,
    romanNumber: 'XI',
    title: 'La Jaula de los Condenados',
    actTitle: 'Acto III: El Gran Puente de Piedra',
    location: 'Campamento del Convoy Imperial',
    summary: 'Thomas y Khaterine asaltan la caravana de carretas enrejadas, rescatando a Martín el armero y Tobías el leñador junto a decenas de campesinos sentenciados al sacrificio.',
    keyCharacters: ['Thomas', 'Khaterine', 'Martín', 'Tobías'],
    relicReward: 'Lingote de Hierro Forjado de Martín',
    targetAreaKey: 'great_stone_bridge'
  },
  {
    id: 12,
    act: 3,
    romanNumber: 'XII',
    title: 'El Escudo de Torre del Capitán Áureo Vane',
    actTitle: 'Acto III: El Gran Puente de Piedra',
    location: 'Entrada del Gran Puente sobre el Abismo Fluvial',
    summary: 'El Capitán Áureo Vane, coloso de dos metros con armadura de placas doradas y un descomunal escudo de torre capaz de frenar arietes, bloquea el cruce proclamando el edicto del rey Alaric.',
    keyCharacters: ['Thomas', 'Capitán Áureo Vane'],
    bossOrEncounter: 'Capitán Áureo Vane (Fase 1)',
    targetAreaKey: 'great_stone_bridge'
  },
  {
    id: 13,
    act: 3,
    romanNumber: 'XIII',
    title: 'El Falso Veredicto',
    actTitle: 'Acto III: El Gran Puente de Piedra',
    location: 'Centro del Gran Puente de Piedra',
    summary: 'Duelo titánico sobre las aguas rugientes. Tras fingir un traspié y quebrar las correas del escudo con flechas de plata y fuego negro, Thomas desarma a Vane y se apodera del mandoble Falso Veredicto.',
    keyCharacters: ['Thomas', 'Khaterine', 'Capitán Áureo Vane'],
    bossOrEncounter: 'Capitán Áureo Vane (Fase 2)',
    relicReward: 'Falso Veredicto (Mandoble Inquisitorial)',
    targetAreaKey: 'great_stone_bridge'
  },

  // --- ACTO IV: LONDINIUM — LA CIUDADELA DORADA (CAPÍTULOS XIV - XVII) ---
  {
    id: 14,
    act: 4,
    romanNumber: 'XIV',
    title: 'La Ciudadela Dorada',
    actTitle: 'Acto IV: Londinium — La Ciudadela Dorada',
    location: 'Avenidas de Mármol de Londinium',
    summary: 'Infiltración a través de los acueductos a una metrópoli de mármol blanco y oro donde los ciudadanos caminan drogados por incienso sacro, entregando a sus hijos en ofrenda al falso dios solar.',
    keyCharacters: ['Thomas', 'Khaterine', 'Shalem'],
    targetAreaKey: 'londinium_citadel'
  },
  {
    id: 15,
    act: 4,
    romanNumber: 'XV',
    title: 'El Salón de los Espejos',
    actTitle: 'Acto IV: Londinium — La Ciudadela Dorada',
    location: 'Galería de Cristal Veneciano del Palacio Real',
    summary: 'Los espejos dorados proyectan visiones ilusorias del pasado para quebrar la voluntad de Thomas con la culpa. Al quebrar el espejo maestro, obtiene el estoque mágico Espejismo de Oro y Humo.',
    keyCharacters: ['Thomas', 'Khaterine'],
    bossOrEncounter: 'Sombras del Cristal',
    relicReward: 'Espejismo de Oro y Humo (Estoque Astral)',
    targetAreaKey: 'londinium_citadel'
  },
  {
    id: 16,
    act: 4,
    romanNumber: 'XVI',
    title: 'La Máscara de Rex Malphas',
    actTitle: 'Acto IV: Londinium — La Ciudadela Dorada',
    location: 'Salón del Trono Astral',
    summary: 'Rex Malphas desciende de la escalinata de obsidiana y revela la verdad definitiva: él es Alaric, el maestro fundador del Aquelarre del Sauce Negro y padre biológico de Thomas, quien traicionó a las nueve brujas por el trono.',
    keyCharacters: ['Thomas', 'Khaterine', 'Rex Malphas (Alaric)'],
    bossOrEncounter: 'Rex Malphas (Fase 1: Mandoble Áureo)',
    targetAreaKey: 'londinium_citadel'
  },
  {
    id: 17,
    act: 4,
    romanNumber: 'XVII',
    title: 'La Caída del Trono y el Velo Roto',
    actTitle: 'Acto IV: Londinium — La Ciudadela Dorada',
    location: 'Abismo de la Sala del Trono',
    summary: 'Malphas invoca la Ley del Deseo doblando el tiempo y la gravedad. Tras una feroz ofensiva coordinada con Khaterine y Shalem, Thomas atraviesa el corazón del rey. El palacio se derrumba hacia una sima cósmica.',
    keyCharacters: ['Thomas', 'Khaterine', 'Shalem', 'Rex Malphas'],
    bossOrEncounter: 'Rex Malphas (Fase 2: Ley del Deseo)',
    relicReward: 'Corona Partida de Alaric & Núcleo Astral',
    targetAreaKey: 'londinium_citadel'
  },

  // --- ACTO V: LA CATEDRAL INVERTIDA — EL SOL DEL ABISMO (CAPÍTULOS XVIII - XX) ---
  {
    id: 18,
    act: 5,
    romanNumber: 'XVIII',
    title: 'El Vacío Cósmico y la Gravedad Invertida',
    actTitle: 'Acto V: La Catedral Invertida — El Sol del Abismo',
    location: 'Bóvedas Flotantes del Abismo',
    summary: 'Thomas despierta en la Catedral Invertida, suspendida de cabeza sobre un cielo de nebulosas violetas. Las almas sacrificadas en dieciocho años de inquisición están atrapadas en los vitrales bajo el Sol del Abismo.',
    keyCharacters: ['Thomas', 'Khaterine', 'Shalem'],
    targetAreaKey: 'inverted_cathedral'
  },
  {
    id: 19,
    act: 5,
    romanNumber: 'XIX',
    title: 'La Forja de Alba Gris',
    actTitle: 'Acto V: La Catedral Invertida — El Sol del Abismo',
    location: 'Altar de la Comunión Inmaculada',
    summary: 'Elowen entrega la Gota de Luz Divina, su pureza cristalizada. Thomas funde su fuego negro primordial con la luz celestial en el altar, forjando la espada sagrada biseccionada: Alba Gris.',
    keyCharacters: ['Thomas', 'Elowen', 'Khaterine'],
    relicReward: 'Alba Gris (Espada de la Elección Definitiva)',
    targetAreaKey: 'inverted_cathedral'
  },
  {
    id: 20,
    act: 5,
    romanNumber: 'XX',
    title: 'El Sol de las Tinieblas y el Primer Amanecer',
    actTitle: 'Acto V: La Catedral Invertida — El Sol del Abismo',
    location: 'El Vértice del Sol del Abismo',
    summary: 'Astaroth, el Padre de las Cenizas, tienta a Thomas para condenar a la humanidad. Thomas rehúsa y descarga a Alba Gris en el núcleo del demonio, quebrando el Sol Negro y trayendo el primer amanecer libre sobre Albion.',
    keyCharacters: ['Thomas', 'Elowen', 'Khaterine', 'Shalem', 'Astaroth'],
    bossOrEncounter: 'Astaroth (El Padre de las Cenizas)',
    relicReward: 'El Primer Amanecer de Albion (Victoria Total)',
    targetAreaKey: 'inverted_cathedral'
  }
];

export class CanonChapterManager {
  private currentChapterId: number = 1;
  private unlockedChapterIds: Set<number> = new Set([1]);

  constructor(initialChapter: number = 1) {
    this.currentChapterId = initialChapter;
    for (let i = 1; i <= initialChapter; i++) {
      this.unlockedChapterIds.add(i);
    }
  }

  public getCurrentChapter(): CanonChapter {
    return CANON_CHAPTERS.find(c => c.id === this.currentChapterId) || CANON_CHAPTERS[0];
  }

  public getChapter(id: number): CanonChapter | undefined {
    return CANON_CHAPTERS.find(c => c.id === id);
  }

  public getAllChapters(): CanonChapter[] {
    return [...CANON_CHAPTERS];
  }

  public getChaptersForAct(act: number): CanonChapter[] {
    return CANON_CHAPTERS.filter(c => c.act === act);
  }

  public isChapterUnlocked(id: number): boolean {
    return this.unlockedChapterIds.has(id);
  }

  public unlockChapter(id: number): boolean {
    if (id < 1 || id > 20) return false;
    this.unlockedChapterIds.add(id);
    return true;
  }

  public unlockAllChapters(): void {
    for (let i = 1; i <= 20; i++) {
      this.unlockedChapterIds.add(i);
    }
  }

  public selectChapter(id: number): boolean {
    if (this.isChapterUnlocked(id)) {
      this.currentChapterId = id;
      return true;
    }
    return false;
  }

  public advanceToNextChapter(): CanonChapter | undefined {
    const nextId = this.currentChapterId + 1;
    if (nextId <= 20) {
      this.unlockedChapterIds.add(nextId);
      this.currentChapterId = nextId;
      return this.getCurrentChapter();
    }
    return undefined;
  }

  public getUnlockedCount(): number {
    return this.unlockedChapterIds.size;
  }

  public getProgressPercentage(): number {
    return Math.round((this.unlockedChapterIds.size / 20) * 100);
  }
}
