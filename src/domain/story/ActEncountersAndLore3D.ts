import { DungeonArea } from '../encounters/DungeonAreaManager';
import { ArticulatedRigArchetype3D } from '../../presentation/three/GothicArticulatedRig3D';

export interface ActEnemySpawnSpec3D {
  readonly id: string;
  readonly name: string;
  readonly area: DungeonArea;
  readonly archetype: ArticulatedRigArchetype3D;
  readonly spawnPos: { x: number; y: number; z: number };
  readonly maxHp: number;
  readonly attackDamage: number;
  readonly expReward: number;
  readonly moveSpeed: number;
  readonly accentColorHex: number;
  readonly weaponKind: 'censer' | 'flail' | 'halberd' | 'mirror_blade' | 'void_claymore';
}

export interface LoreChoiceBranch3D {
  readonly id: string;
  readonly label: string;
  readonly speaker: string;
  readonly response: string;
  readonly rewardNote?: string;
}

export interface ActCompanionAnchorSpec3D {
  readonly id: string;
  readonly area: DungeonArea;
  readonly name: string;
  readonly title: string;
  readonly roleArchetype: 'khaterine' | 'thomas' | 'elowen' | 'shalem';
  readonly position: { x: number; y: number; z: number };
  readonly badgeColor: string;
  readonly greeting: string;
  readonly branches: readonly LoreChoiceBranch3D[];
}

export interface CinematicBeatSpec3D {
  readonly id:
    | 'morwenna_awaken'
    | 'crucible_awaken'
    | 'crucible_jam'
    | 'vane_awaken'
    | 'master_mirror_shatter'
    | 'malphas_awaken'
    | 'shalem_lion_awaken'
    | 'first_dawn_epilogue';
  readonly durationSec: number;
  readonly caption: string;
  readonly cameraOffset: { x: number; y: number; z: number };
  readonly lookOffsetY: number;
}

/**
 * Canonical secondary enemy patrols for Acts II, IV and V so every Act in 3D features
 * rich tactical combat encounters leading up to its Act Boss.
 */
export const ACT_SECONDARY_ENEMY_SPECS_3D: readonly ActEnemySpawnSpec3D[] = [
  // ACTO II: CAMPANARIO DEL SUR (CAPS. VII - IX)
  {
    id: 'act2_belltower_chorister',
    name: 'Corista Fanático del Crisol',
    area: 'belltower_summit',
    archetype: 'zealot',
    spawnPos: { x: -2.8, y: 0, z: -197.0 },
    maxHp: 95,
    attackDamage: 14,
    expReward: 75,
    moveSpeed: 2.35,
    accentColorHex: 0xff6622,
    weaponKind: 'flail'
  },
  {
    id: 'act2_barn_censer_bearer',
    name: 'Incensario del Granero Sur',
    area: 'belltower_summit',
    archetype: 'cultist',
    spawnPos: { x: 2.8, y: 0, z: -199.5 },
    maxHp: 85,
    attackDamage: 12,
    expReward: 65,
    moveSpeed: 2.15,
    accentColorHex: 0xff9933,
    weaponKind: 'censer'
  },

  // ACTO IV: LONDINIUM — LA CIUDADELA DORADA (CAPS. XIV - XVII)
  {
    id: 'act4_solar_palace_sentinel',
    name: 'Centinela Solar de Londinium',
    area: 'londinium_citadel',
    archetype: 'bridge_guard',
    spawnPos: { x: 3.2, y: 0, z: -314.0 },
    maxHp: 115,
    attackDamage: 16,
    expReward: 95,
    moveSpeed: 2.45,
    accentColorHex: 0xffd700,
    weaponKind: 'halberd'
  },
  {
    id: 'act4_mirror_glass_shadow',
    name: 'Sombra del Cristal Veneciano',
    area: 'londinium_citadel',
    archetype: 'inquisitor',
    spawnPos: { x: -5.2, y: 0, z: -318.5 },
    maxHp: 125,
    attackDamage: 18,
    expReward: 110,
    moveSpeed: 2.6,
    accentColorHex: 0xcc44ff,
    weaponKind: 'mirror_blade'
  },

  // ACTO V: LA CATEDRAL INVERTIDA (CAPS. XVIII - XX)
  {
    id: 'act5_ash_wraith_west',
    name: 'Espectro de Ceniza del Abismo',
    area: 'inverted_cathedral',
    archetype: 'skeleton',
    spawnPos: { x: -3.8, y: 0.85, z: -379.5 },
    maxHp: 130,
    attackDamage: 19,
    expReward: 125,
    moveSpeed: 2.5,
    accentColorHex: 0xff33aa,
    weaponKind: 'void_claymore'
  },
  {
    id: 'act5_ash_wraith_east',
    name: 'Centinela del Sol Negro',
    area: 'inverted_cathedral',
    archetype: 'skeleton',
    spawnPos: { x: 3.6, y: 1.55, z: -387.0 },
    maxHp: 140,
    attackDamage: 20,
    expReward: 135,
    moveSpeed: 2.65,
    accentColorHex: 0xaa22ff,
    weaponKind: 'void_claymore'
  }
];

/**
 * Canonical Companion safe-alcove anchors across Acts II - V with branching lore dialogue trees
 * adapted directly from Kevin's novel (docs/novela/ACTO_2..5).
 */
export const ACT_COMPANION_ANCHORS_3D: readonly ActCompanionAnchorSpec3D[] = [
  {
    id: 'companion_act2_khaterine',
    area: 'belltower_summit',
    name: 'Khaterine',
    title: '🏹 KHATERINE EN EL CAMPANARIO DEL SUR (ACTO II) 🏹',
    roleArchetype: 'khaterine',
    position: { x: -2.4, y: 0, z: -187.5 },
    badgeColor: '#d999ff',
    greeting: '«El olor a bronce fundido y ceniza vieja me devuelve a la Noche de la Luna Roja, Thomas. El Granero del Sur arde en mi memoria a unos pasos al sureste, y Elowen nos aguarda allá arriba en la celda de sal.»',
    branches: [
      {
        id: 'act2_ask_barn',
        label: '❓ ¿Qué ocurrió en el Granero del Sur?',
        speaker: 'Khaterine',
        response: '«Allí enterramos los nombres de mis ocho hermanas tras la purga. Bajo la losa grabada yace la prueba de que Alaric nos abrió las puertas al Cáliz Solar para robar el pacto del Abismo. Inspecciona esa losa al sureste [E].»',
        rewardNote: '✦ PISTA CANÓNICA (CAP. VIII): LOSA DEL GRANERO QUEMADO AL SURESTE (3.8, -191.5) ✦'
      },
      {
        id: 'act2_ask_crucible',
        label: '⚔️ ¿Cómo vencemos al Guardián del Crisol?',
        speaker: 'Khaterine',
        response: '«Su armadura de fundición es demasiado gruesa para un duelo frontal prolongado. Cuando el Guardián pase cerca del Gran Horno al norte, arroja tu espada con [T] para trabar la cadena de bronce y derramar el metal fundido sobre él.»',
        rewardNote: '✦ TÁCTICA DEL CRISOL: PULSA [T] CERCA DEL HORNO (-120 HP & ATURDIMIENTO 3s) ✦'
      }
    ]
  },
  {
    id: 'companion_act3_shalem',
    area: 'great_stone_bridge',
    name: 'Shalem',
    title: '🐈‍⬛ SHALEM SOBRE EL GRAN PUENTE DE PIEDRA (ACTO III) 🐈‍⬛',
    roleArchetype: 'shalem',
    position: { x: 3.4, y: 0, z: -241.0 },
    badgeColor: '#ffd700',
    greeting: '«¡Brrr, este viento fluvial eriza hasta el último pelo de mi cola! Escucha bien, monaguillo: las barandillas del puente están rotas en dos tramos marcados con fuego azul. Aprovéchalo.»',
    branches: [
      {
        id: 'act3_ask_gaps',
        label: '🌊 ¿Cómo aprovecho las barandillas rotas?',
        speaker: 'Shalem',
        response: '«Empuja a los lanceros de vanguardia hacia los bordes sin pretil usando ataques pesados [K] o flechas de plata. Un solo empujón bien calculado los enviará directos al río helado con +100 EXP instantáneos.»',
        rewardNote: '✦ TÁCTICA DEL PUENTE: ATAQUE PESADO [K] JUNTO A LAS BRECHAS AZULES = CAÍDA AL ABISMO ✦'
      },
      {
        id: 'act3_ask_vane',
        label: '🛡️ ¿Cuál es el punto débil del Capitán Vane?',
        speaker: 'Shalem',
        response: '«Su Escudo de Torre detiene el 80% del daño frontal. Primero libera a Martín y Tobías de la carreta enrejada [E]: saldrán con lanzas a distraerlo. Luego fija objetivo con [R] y golpea su flanco abierto.»',
        rewardNote: '✦ ALIADOS ACTIVOS: LIBERA LA CARRETA (-2.6, -249) PARA FLANQUEO CRÍTICO CON [R] ✦'
      }
    ]
  },
  {
    id: 'companion_act4_khaterine',
    area: 'londinium_citadel',
    name: 'Khaterine',
    title: '🏹 KHATERINE EN LA CIUDADELA DE LONDINIUM (ACTO IV) 🏹',
    roleArchetype: 'khaterine',
    position: { x: -2.8, y: 0, z: -303.5 },
    badgeColor: '#cc66ff',
    greeting: '«Al fin estamos en el corazón de la mentira de Alaric. Mira a los nobles arrodillados entre ese humo dorado: no rezan por devoción, sino drogados por el incienso del falso sol.»',
    branches: [
      {
        id: 'act4_ask_braziers',
        label: '🌿 ¿Qué hace el incienso narcótico?',
        speaker: 'Khaterine',
        response: '«Alimenta la barrera de vanidad de Rex Malphas y adormece a la ciudad. Destruye los 3 braseros dorados con tu espada o flechas: cada ciudadano que despierte quebrará un 15% de la armadura astral de Alaric (hasta +45% de daño).»',
        rewardNote: '✦ SABOTAJE DE LONDINIUM: 3 BRASEROS DESTRUIDOS = +45% DAÑO CONTRA REX MALPHAS ✦'
      },
      {
        id: 'act4_ask_alaric',
        label: '👑 ¿Quién es realmente Rex Malphas?',
        speaker: 'Khaterine',
        response: '«Otrora fue nuestro maestro en el Aquelarre del Sauce Negro... y lleva tu misma sangre en las venas, Thomas. Antes de enfrentarlo, quiebra los 3 Espejos de la Culpa [E] en la galería occidental para que su Ley del Deseo no pueda doblegar tu mente.»',
        rewardNote: '✦ CAPÍTULO XV: QUEBRA LOS 3 ESPEJOS VENECIANOS EN (-7.0, -320) Y USA SINERGIA [E] ✦'
      }
    ]
  },
  {
    id: 'companion_act5_elowen',
    area: 'inverted_cathedral',
    name: 'Elowen',
    title: '✨ ELOWEN JUNTO AL ALTAR DE LA COMUNIÓN (ACTO V) ✨',
    roleArchetype: 'elowen',
    position: { x: 2.6, y: 0.43, z: -373.0 },
    badgeColor: '#88eeff',
    greeting: '«Has subido hasta el fin del abismo, Thomas... Mi voz ya no tiembla frente al Sol Negro. La Gota de Luz Divina aguarda en este altar blanco para fundirse con tu fuego negro.»',
    branches: [
      {
        id: 'act5_ask_alba',
        label: '⚔️ ¿Qué significa forjar Alba Gris?',
        speaker: 'Elowen',
        response: '«Que ni la luz ciega de la Inquisición ni el odio del Abismo tienen la última palabra. Al aceptar la comunión en el altar [E], tu espada se biseccionará en luz y fuego negro, infligiendo doble daño crítico a Astaroth.»',
        rewardNote: '✦ CAPÍTULO XIX: INTERACTÚA CON EL ALTAR [E] PARA FORJAR ALBA GRIS (+100% CRÍTICO) ✦'
      },
      {
        id: 'act5_ask_shalem',
        label: '🦁 ¿Qué le ocurrirá a Shalem?',
        speaker: 'Elowen',
        response: '«Shalem lleva dieciocho años fingiendo indiferencia, pero romperá su pacto milenario con el Abismo y despertará como el León de Brasas Carmesíes para luchar a tu lado... y ganarse el derecho a vivir en paz bajo el Viejo Roble.»',
        rewardNote: '✦ CAPÍTULO XX: ELIGE LA OPCIÓN CANÓNICA EN EL ALTAR PARA DESPERTAR A SHALEM LEÓN ✦'
      }
    ]
  }
];

/**
 * Dramatic 3D camera sweep specs for the 8 iconic narrative beats across Acts I - V.
 */
export const CINEMATIC_CAMERA_BEATS_3D: Record<CinematicBeatSpec3D['id'], CinematicBeatSpec3D> = {
  morwenna_awaken: {
    id: 'morwenna_awaken',
    durationSec: 2.2,
    caption: '🔥 CAPÍTULO V — MADRE MORWENNA, VIGÍA DE LA GRAN PIRA 🔥',
    cameraOffset: { x: 3.4, y: 2.8, z: 5.2 },
    lookOffsetY: 1.8
  },
  crucible_awaken: {
    id: 'crucible_awaken',
    durationSec: 2.2,
    caption: '🔨 CAPÍTULO IX — EL GUARDIÁN DEL CRISOL DE BRONCE 🔨',
    cameraOffset: { x: -3.8, y: 3.0, z: 5.5 },
    lookOffsetY: 1.9
  },
  crucible_jam: {
    id: 'crucible_jam',
    durationSec: 1.9,
    caption: '🔥 ¡ENGRANAJE DEL GRAN CRISOL TRABADO! ¡BRONCE FUNDIDO DESATADO! 🔥',
    cameraOffset: { x: 4.2, y: 3.4, z: 4.4 },
    lookOffsetY: 1.5
  },
  vane_awaken: {
    id: 'vane_awaken',
    durationSec: 2.2,
    caption: '🛡️ CAPÍTULO XII — CAPITÁN ÁUREO VANE DEL GRAN PUENTE 🛡️',
    cameraOffset: { x: 3.2, y: 2.6, z: 5.8 },
    lookOffsetY: 1.7
  },
  master_mirror_shatter: {
    id: 'master_mirror_shatter',
    durationSec: 2.0,
    caption: '🪞 CAPÍTULO XV — EL ESPEJO MAESTRO SE HACE AÑICOS 🪞',
    cameraOffset: { x: 4.2, y: 2.4, z: 2.8 },
    lookOffsetY: 2.0
  },
  malphas_awaken: {
    id: 'malphas_awaken',
    durationSec: 2.3,
    caption: '👑 CAPÍTULO XVI — REX MALPHAS (ALARIC), EL DÉSPOTA ASTRAL 👑',
    cameraOffset: { x: -3.6, y: 3.1, z: 5.8 },
    lookOffsetY: 1.9
  },
  shalem_lion_awaken: {
    id: 'shalem_lion_awaken',
    durationSec: 2.5,
    caption: '🦁 CAPÍTULO XX — SHALEM ROMPE SU PACTO: LEÓN DE BRASAS CARMESÍES 🦁',
    cameraOffset: { x: 4.4, y: 3.0, z: 5.2 },
    lookOffsetY: 1.8
  },
  first_dawn_epilogue: {
    id: 'first_dawn_epilogue',
    durationSec: 2.8,
    caption: '🌅 EPÍLOGO CANÓNICO — EL PRIMER AMANECER EN LA COLINA DEL VIEJO ROBLE 🌅',
    cameraOffset: { x: -4.2, y: 2.4, z: 3.6 },
    lookOffsetY: 1.4
  }
};
