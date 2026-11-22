import { DungeonArea } from '../encounters/DungeonAreaManager';
import { CANON_CHAPTERS } from './CanonChapterCompendium';

export interface CampaignWorldSnapshot3D {
  currentArea: DungeonArea;
  narrativePhase: 'DAWN_CALM' | 'MIDNIGHT_SIEGE' | 'FIRST_DAWN_EPILOGUE';
  hasAidedVillagersOrCedric: boolean;
  hasDeliveredBirdOnOakHill: boolean;
  hasTalkedToKhaterineOrFought: boolean;
  hasVisitedApothecary: boolean;
  morwennaAwakened: boolean;
  morwennaDefeated: boolean;
  cemeteryGateOpen: boolean;
  inquisitorDefeated: boolean;
  rootProwlerDefeated: boolean;
  hasWillowFang: boolean;
  hasInspectedBurnedBarn: boolean;
  hasCollectedWillowBird: boolean;
  crucibleGuardianDefeated: boolean;
  hasFreedRefugees: boolean;
  captainVaneAwakened: boolean;
  captainVaneDefeated: boolean;
  destroyedNarcoticBraziersCount: number;
  shatteredGuiltMirrors: number;
  hasClearedMirrorGallery: boolean;
  rexMalphasAwakened: boolean;
  rexMalphasDefeated: boolean;
  hasForgedAlbaGris: boolean;
  astarothDefeated: boolean;
}

export interface CampaignObjective3D {
  chapterId: number;
  act: number;
  romanLabel: string;
  title: string;
  objectiveText: string;
  targetArea: DungeonArea;
  waypoint: { x: number; y: number; z: number } | null;
  beaconColorHex: number;
  progressPct: number;
  isEpilogue: boolean;
}

export interface PrologueSlide3D {
  readonly index: number;
  readonly header: string;
  readonly subtitle: string;
  readonly body: string;
  readonly imageUrl: string;
  readonly accentColor: string;
}

/**
 * Canonical 3-slide atmospheric Prologue ("La Noche de la Luna Roja") adapted directly
 * from Kevin's manuscript docs/novela/00_PROLOGO_Y_COSMOLOGIA.md.
 */
export const CAMPAIGN_PROLOGUE_SLIDES: readonly PrologueSlide3D[] = [
  {
    index: 0,
    header: '🌒 PRÓLOGO — LA NOCHE DE LA LUNA ROJA (1/3) 🌒',
    subtitle: 'La Herejía del Sauce Negro y el Juramento de las Nueve',
    body: '«En el año de la gran peste, la Iglesia del Cáliz Solar rodeó el bosque del Sauce Negro con millares de antorchas blancas. Nueve hermanas brujas fueron atadas a la pira mientras una madre agonizante daba a luz al niño Thomas. Con su último aliento sellaron el fuego negro primordial en sus venas: "No nacerás esclavo de la luz ni verdugo de la noche; serás el puente entre dos mundos."»',
    imageUrl: '/assets/loading/shalem-opening.png',
    accentColor: '#ff5544'
  },
  {
    index: 1,
    header: '🕊️ PRÓLOGO — EL RESCATE EN OAKHAVEN (2/3) 🕊️',
    subtitle: 'Khaterine la Exiliada, el Padre Cedric y la Huérfana Elowen',
    body: '«Entre las filas inquisitoriales, la falsa novicia Khaterine arrebató al recién nacido de las cenizas y lo entregó al compasivo Padre Cedric en la brumosa aldea de Oakhaven. Allí creció junto a Elowen, la niña marcada con el falso estigma de la brujería. En las madrugadas gélidas subían a la Colina del Viejo Roble jurando hallar una luz que no exigiera sacrificios de sangre.»',
    imageUrl: '/assets/loading/oakhaven-aftermath.png',
    accentColor: '#ffd700'
  },
  {
    index: 2,
    header: '🐈‍⬛ PRÓLOGO — LA BESTIA SELLADA (3/3) 🐈‍⬛',
    subtitle: 'Shalem, el Gran Marqués de las Brasas',
    body: '«Atraído por el fuego abisal del infante, Shalem —antiguo señor del Abismo— cayó en el hechizo final de la novena bruja y fue encadenado durante dieciocho inviernos al cuerpo de un gato negro de ojos dorados. Hoy el sello del Cáliz Solar se agrieta en Londinium y las trompetas de la purga vuelven a sonar sobre Oakhaven...»',
    imageUrl: '/assets/title_cover.png',
    accentColor: '#cc66ff'
  }
];

function getChapterMeta(id: number): { romanLabel: string; title: string; act: number } {
  const ch = CANON_CHAPTERS.find(c => c.id === id) || CANON_CHAPTERS[0];
  return {
    romanLabel: `CAPÍTULO ${ch.romanNumber}`,
    title: ch.title,
    act: ch.act
  };
}

/**
 * Pure deterministic 3D Campaign Director: resolves the active canonical chapter,
 * actionable player objective, 3D diegetic waypoint beacon coordinate, and progress %
 * across the entire 20-chapter saga from Act I Dawn through Act V & First Dawn Epilogue.
 */
export function resolveActiveCampaignObjective(s: CampaignWorldSnapshot3D): CampaignObjective3D {
  // 21. EPÍLOGO JUGABLE — PRIMER AMANECER EN LA COLINA DEL VIEJO ROBLE
  if (s.narrativePhase === 'FIRST_DAWN_EPILOGUE' && s.currentArea === 'surface') {
    return {
      chapterId: 20,
      act: 5,
      romanLabel: 'EPÍLOGO CANÓNICO',
      title: 'El Primer Amanecer en el Viejo Roble',
      objectiveText: 'Conversa en paz [E] con Elowen, Khaterine, Padre Cedric y Shalem bajo el Viejo Roble',
      targetArea: 'surface',
      waypoint: { x: 9.6, y: 2.2, z: 5.0 },
      beaconColorHex: 0xffe488,
      progressPct: 100,
      isEpilogue: true
    };
  }

  // 20. ACTO V — NÚCLEO DEL SOL NEGRO PURIFICADO -> ABRIR EPÍLOGO
  if (s.astarothDefeated) {
    const m = getChapterMeta(20);
    return {
      chapterId: 20,
      act: 5,
      romanLabel: m.romanLabel,
      title: m.title,
      objectiveText: s.currentArea === 'inverted_cathedral'
        ? 'Interactúa con el Sol Purificado [E] o pulsa [Y] para abrir el Epílogo en Oakhaven'
        : 'Viaja a la Colina del Viejo Roble [Y] para el Epílogo del Primer Amanecer',
      targetArea: 'inverted_cathedral',
      waypoint: s.currentArea === 'inverted_cathedral' ? { x: 0, y: 2.35, z: -395 } : { x: 9.6, y: 2.2, z: 5.0 },
      beaconColorHex: 0xffdd55,
      progressPct: 98,
      isEpilogue: false
    };
  }

  // 19. ACTO V — COMBATE FINAL CONTRA ASTAROTH CON ALBA GRIS & SHALEM LEÓN
  if (s.currentArea === 'inverted_cathedral' || s.rexMalphasDefeated) {
    if (s.currentArea !== 'inverted_cathedral') {
      const m = getChapterMeta(17);
      return {
        chapterId: 17,
        act: 4,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: 'Acércate al Trono Astral [E] al norte para descender a la Catedral Invertida (Acto V)',
        targetArea: 'londinium_citadel',
        waypoint: s.currentArea === 'londinium_citadel' ? { x: 0, y: 0.6, z: -336 } : null,
        beaconColorHex: 0xff33aa,
        progressPct: 86,
        isEpilogue: false
      };
    }

    if (!s.hasForgedAlbaGris) {
      const m = getChapterMeta(18);
      return {
        chapterId: 18,
        act: 5,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: 'Asciende los peldaños flotantes [ESPACIO] y pulsa [E] en el Altar de la Comunión (Forjar Alba Gris)',
        targetArea: 'inverted_cathedral',
        waypoint: { x: 0, y: 0.86, z: -378 },
        beaconColorHex: 0x88eeff,
        progressPct: 90,
        isEpilogue: false
      };
    }

    const m = getChapterMeta(19);
    return {
      chapterId: 19,
      act: 5,
      romanLabel: m.romanLabel,
      title: m.title,
      objectiveText: 'Combate a Astaroth junto a Shalem León de Brasas con Alba Gris (+100% Crítico)',
      targetArea: 'inverted_cathedral',
      waypoint: { x: 0, y: 2.35, z: -395 },
      beaconColorHex: 0xff4499,
      progressPct: 95,
      isEpilogue: false
    };
  }

  // 14-17. ACTO IV — LONDINIUM, LA CIUDADELA DORADA
  if (s.currentArea === 'londinium_citadel' || s.captainVaneDefeated) {
    if (s.currentArea !== 'londinium_citadel') {
      const m = getChapterMeta(13);
      return {
        chapterId: 13,
        act: 3,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: 'Cruza el Portón Norte del Gran Puente [E] para entrar en Londinium (Acto IV)',
        targetArea: 'great_stone_bridge',
        waypoint: s.currentArea === 'great_stone_bridge' ? { x: 0, y: 0, z: -276 } : null,
        beaconColorHex: 0xcc44ff,
        progressPct: 68,
        isEpilogue: false
      };
    }

    if (s.destroyedNarcoticBraziersCount < 3) {
      const m = getChapterMeta(14);
      const brazierSpots = [
        { x: -4.2, y: 0.55, z: -304 },
        { x: 4.2, y: 0.55, z: -311 },
        { x: 0.0, y: 0.55, z: -317 }
      ];
      const nextSpot = brazierSpots[Math.min(2, s.destroyedNarcoticBraziersCount)];
      return {
        chapterId: 14,
        act: 4,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: `Destruye los Braseros Narcóticos [J]/[K] (${s.destroyedNarcoticBraziersCount}/3) para despertar ciudadanos y debilitar a Malphas`,
        targetArea: 'londinium_citadel',
        waypoint: nextSpot,
        beaconColorHex: 0xffdd55,
        progressPct: 72 + s.destroyedNarcoticBraziersCount * 2,
        isEpilogue: false
      };
    }

    if (!s.hasClearedMirrorGallery) {
      const m = getChapterMeta(15);
      return {
        chapterId: 15,
        act: 4,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: `Quiebra los 3 Espejos de Culpa [E] en el Salón de los Espejos (${s.shatteredGuiltMirrors}/3)`,
        targetArea: 'londinium_citadel',
        waypoint: { x: -7.0, y: 0, z: -320 },
        beaconColorHex: 0xd999ff,
        progressPct: 78,
        isEpilogue: false
      };
    }

    const m = getChapterMeta(16);
    return {
      chapterId: 16,
      act: 4,
      romanLabel: m.romanLabel,
      title: m.title,
      objectiveText: s.rexMalphasAwakened
        ? 'Desata la Sinergia Tri-Héroe [E] y derrota a Rex Malphas (Alaric)'
        : 'Avanza hacia el Trono Astral para enfrentar a Rex Malphas (Alaric)',
      targetArea: 'londinium_citadel',
      waypoint: { x: 0, y: 0, z: -325 },
      beaconColorHex: 0xaa22ff,
      progressPct: 82,
      isEpilogue: false
    };
  }

  // 10-13. ACTO III — EL GRAN PUENTE DE PIEDRA
  if (s.currentArea === 'great_stone_bridge' || s.crucibleGuardianDefeated) {
    if (s.currentArea !== 'great_stone_bridge') {
      const m = getChapterMeta(9);
      return {
        chapterId: 9,
        act: 2,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: 'Avanza al norte tras el Gran Crisol [E] para marchar hacia el Gran Puente de Piedra (Acto III)',
        targetArea: 'belltower_summit',
        waypoint: s.currentArea === 'belltower_summit' ? { x: 0, y: 0, z: -217 } : null,
        beaconColorHex: 0xffaa22,
        progressPct: 50,
        isEpilogue: false
      };
    }

    if (!s.hasFreedRefugees) {
      const m = getChapterMeta(10);
      return {
        chapterId: 10,
        act: 3,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: 'Empuja guardias al río [K] por las brechas y libera a Martín y Tobías de la carreta [E]',
        targetArea: 'great_stone_bridge',
        waypoint: { x: -2.6, y: 0, z: -249 },
        beaconColorHex: 0xffd700,
        progressPct: 55,
        isEpilogue: false
      };
    }

    const m = getChapterMeta(s.captainVaneAwakened ? 12 : 11);
    return {
      chapterId: s.captainVaneAwakened ? 12 : 11,
      act: 3,
      romanLabel: m.romanLabel,
      title: m.title,
      objectiveText: 'Flanquea al Capitán Áureo Vane con Lock-On [R] y ataques pesados [K] junto a Martín y Tobías',
      targetArea: 'great_stone_bridge',
      waypoint: { x: 0, y: 0, z: -260 },
      beaconColorHex: 0xffd700,
      progressPct: s.captainVaneAwakened ? 64 : 60,
      isEpilogue: false
    };
  }

  // 7-9. ACTO II — CAMPANARIO DEL SUR & GRANERO QUEMADO
  if (s.currentArea === 'belltower_summit') {
    if (!s.hasInspectedBurnedBarn) {
      const m = getChapterMeta(8);
      return {
        chapterId: 8,
        act: 2,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: 'Inspecciona la Losa del Granero del Sur Quemado [E] para revelar la Noche de la Luna Roja',
        targetArea: 'belltower_summit',
        waypoint: { x: 3.8, y: 0, z: -191.5 },
        beaconColorHex: 0xcc66ff,
        progressPct: 38,
        isEpilogue: false
      };
    }
    if (!s.hasCollectedWillowBird) {
      const m = getChapterMeta(7);
      return {
        chapterId: 7,
        act: 2,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: 'Sube por la escalera helicoidal oeste (+2.8m) hasta la Celda de Sal de Elowen [E]',
        targetArea: 'belltower_summit',
        waypoint: { x: -5.0, y: 2.8, z: -202 },
        beaconColorHex: 0xffd700,
        progressPct: 42,
        isEpilogue: false
      };
    }
    const m = getChapterMeta(9);
    return {
      chapterId: 9,
      act: 2,
      romanLabel: m.romanLabel,
      title: m.title,
      objectiveText: 'Arroja tu espada [T] al Gran Crisol y derrota al Guardián del Crisol de Bronce',
      targetArea: 'belltower_summit',
      waypoint: { x: 0, y: 0, z: -204 },
      beaconColorHex: 0xff6622,
      progressPct: 46,
      isEpilogue: false
    };
  }

  // BOSQUE DEL SAUCE NEGRO (PUENTE ENTRE ACTO I Y ACTO II)
  if (s.currentArea === 'black_willow_forest' || s.inquisitorDefeated) {
    if (s.currentArea !== 'black_willow_forest') {
      const m = getChapterMeta(6);
      return {
        chapterId: 6,
        act: 1,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: 'Cruza el Portal Consagrado al fondo de las Criptas [E] hacia el Bosque del Sauce Negro',
        targetArea: 'crypts_interior',
        waypoint: s.currentArea === 'crypts_interior' ? { x: 0, y: 0, z: -110 } : null,
        beaconColorHex: 0xbb44ff,
        progressPct: 32,
        isEpilogue: false
      };
    }
    if (!s.rootProwlerDefeated) {
      const m = getChapterMeta(8);
      return {
        chapterId: 8,
        act: 2,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: 'Derrota al Acechador de Raíces (vulnerable al Fuego Fatuo) en el Bosque del Sauce Negro',
        targetArea: 'black_willow_forest',
        waypoint: { x: 0, y: 0, z: -146 },
        beaconColorHex: 0xbb44ff,
        progressPct: 34,
        isEpilogue: false
      };
    }
    if (!s.hasWillowFang) {
      const m = getChapterMeta(8);
      return {
        chapterId: 8,
        act: 2,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: 'Reclama el Colmillo del Sauce Negro [E] en el Altar de las Nueve Hermanas',
        targetArea: 'black_willow_forest',
        waypoint: { x: 0, y: 0, z: -155 },
        beaconColorHex: 0xd999ff,
        progressPct: 36,
        isEpilogue: false
      };
    }
    const m = getChapterMeta(7);
    return {
      chapterId: 7,
      act: 2,
      romanLabel: m.romanLabel,
      title: m.title,
      objectiveText: 'Asciende por el sendero norte [E] hacia el Campanario del Sur (Acto II)',
      targetArea: 'black_willow_forest',
      waypoint: { x: 0, y: 0, z: -169 },
      beaconColorHex: 0xffaa44,
      progressPct: 37,
      isEpilogue: false
    };
  }

  // CRIPTAS DE SAN JUDE (CAP. VI)
  if (s.currentArea === 'crypts_interior' || s.morwennaDefeated) {
    const m = getChapterMeta(6);
    if (s.currentArea === 'crypts_interior') {
      return {
        chapterId: 6,
        act: 1,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: 'Supera las trampas y derrota al Inquisidor Caído de San Jude para abrir el portal al Sauce Negro',
        targetArea: 'crypts_interior',
        waypoint: { x: 0, y: 0, z: -102 },
        beaconColorHex: 0x9b59b6,
        progressPct: 28,
        isEpilogue: false
      };
    }
    return {
      chapterId: 6,
      act: 1,
      romanLabel: m.romanLabel,
      title: m.title,
      objectiveText: 'Cruza la Verja del Cementerio al norte y desciende al Mausoleo de las Criptas [E]',
      targetArea: 'surface',
      waypoint: { x: 0, y: 0, z: -44.2 },
      beaconColorHex: 0x00e5ff,
      progressPct: 25,
      isEpilogue: false
    };
  }

  // ACTO I — SUPERFICIE DE OAKHAVEN (CAPÍTULOS I - V)
  if (s.narrativePhase === 'DAWN_CALM') {
    if (!s.hasAidedVillagersOrCedric) {
      const m = getChapterMeta(1);
      return {
        chapterId: 1,
        act: 1,
        romanLabel: m.romanLabel,
        title: m.title,
        objectiveText: 'Auxilia a Gedeón o Marta [E] en el Atrio de San Jude o conversa con Padre Cedric [E]',
        targetArea: 'surface',
        waypoint: { x: -2.5, y: 0, z: 2.7 },
        beaconColorHex: 0x88ffaa,
        progressPct: 5,
        isEpilogue: false
      };
    }
    const m = getChapterMeta(2);
    return {
      chapterId: 2,
      act: 1,
      romanLabel: m.romanLabel,
      title: m.title,
      objectiveText: 'Sube la Colina del Viejo Roble al este (+2.2m) y entrega el Pájaro de Sauce a Elowen [E]',
      targetArea: 'surface',
      waypoint: { x: 9.4, y: 2.2, z: 5.0 },
      beaconColorHex: 0xffd700,
      progressPct: 10,
      isEpilogue: false
    };
  }

  // ACTO I — BAJO ASEDIO DE MEDIANOCHE (CAPS. III - V)
  if (!s.hasTalkedToKhaterineOrFought && !s.morwennaAwakened) {
    const m = getChapterMeta(3);
    return {
      chapterId: 3,
      act: 1,
      romanLabel: m.romanLabel,
      title: m.title,
      objectiveText: 'Reúnete con Khaterine [E] / [TAB] y despeja los centinelas de la Calle Mayor',
      targetArea: 'surface',
      waypoint: { x: 2.2, y: 0, z: -3.5 },
      beaconColorHex: 0xd999ff,
      progressPct: 14,
      isEpilogue: false
    };
  }

  if (!s.hasVisitedApothecary && !s.morwennaAwakened) {
    const m = getChapterMeta(4);
    return {
      chapterId: 4,
      act: 1,
      romanLabel: m.romanLabel,
      title: m.title,
      objectiveText: 'Prepara un bálsamo en el Caldero de Elowen [E / B] o marcha al norte hacia la Gran Pira',
      targetArea: 'surface',
      waypoint: { x: -2.4, y: 0, z: -0.7 },
      beaconColorHex: 0x2ecc71,
      progressPct: 18,
      isEpilogue: false
    };
  }

  const m5 = getChapterMeta(5);
  return {
    chapterId: 5,
    act: 1,
    romanLabel: m5.romanLabel,
    title: m5.title,
    objectiveText: s.morwennaAwakened
      ? 'Derrota a Madre Morwenna en la Gran Pira (usa Lock-On [R], Parry [L] y Esquiva [ESPACIO])'
      : 'Marcha al norte por la Calle Mayor hacia la Plaza de la Gran Pira (Z = -21)',
    targetArea: 'surface',
    waypoint: { x: 0, y: 0, z: -21.0 },
    beaconColorHex: 0xff4433,
    progressPct: 22,
    isEpilogue: false
  };
}
