import Phaser from 'phaser';

export interface SpriteSheetSpec {
  id: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  frameRate: number;
  repeat: number;
}

export interface Concept3DSpec {
  id: string;
  title: string;
  category: 'personaje' | 'enemigo' | 'prop';
  url: string;
  description: string;
}

/**
 * Complete catalog of the 65 animation sheets, 11 props, 11 VFX, 14 icons, and 22 3D reference sheets
 * from Kevin's visual pack (Mejoras a futuro/Mejoras visuales/manifiesto.json).
 */
export const VISUAL_PACK_SPRITESHEETS: readonly SpriteSheetSpec[] = [
  // 1. Thomas el Acólito (15 sheets, 64x64)
  { id: 'thomas_idle', url: '/assets/characters/thomas_idle.png', frameWidth: 64, frameHeight: 64, frames: 6, frameRate: 8, repeat: -1 },
  { id: 'thomas_walk', url: '/assets/characters/thomas_walk.png', frameWidth: 64, frameHeight: 64, frames: 8, frameRate: 10, repeat: -1 },
  { id: 'thomas_run', url: '/assets/characters/thomas_run.png', frameWidth: 64, frameHeight: 64, frames: 8, frameRate: 12, repeat: -1 },
  { id: 'thomas_slash_light', url: '/assets/characters/thomas_slash_light.png', frameWidth: 64, frameHeight: 64, frames: 5, frameRate: 14, repeat: 0 },
  { id: 'thomas_slash_heavy', url: '/assets/characters/thomas_slash_heavy.png', frameWidth: 64, frameHeight: 64, frames: 7, frameRate: 12, repeat: 0 },
  { id: 'thomas_guard', url: '/assets/characters/thomas_guard.png', frameWidth: 64, frameHeight: 64, frames: 3, frameRate: 10, repeat: 0 },
  { id: 'thomas_parry', url: '/assets/characters/thomas_parry.png', frameWidth: 64, frameHeight: 64, frames: 4, frameRate: 16, repeat: 0 },
  { id: 'thomas_dodge', url: '/assets/characters/thomas_dodge.png', frameWidth: 64, frameHeight: 64, frames: 6, frameRate: 14, repeat: 0 },
  { id: 'thomas_throw_sword', url: '/assets/characters/thomas_throw_sword.png', frameWidth: 64, frameHeight: 64, frames: 5, frameRate: 12, repeat: 0 },
  { id: 'thomas_hurt', url: '/assets/characters/thomas_hurt.png', frameWidth: 64, frameHeight: 64, frames: 3, frameRate: 12, repeat: 0 },
  { id: 'thomas_death', url: '/assets/characters/thomas_death.png', frameWidth: 64, frameHeight: 64, frames: 8, frameRate: 8, repeat: 0 },
  { id: 'thomas_finisher', url: '/assets/characters/thomas_finisher.png', frameWidth: 64, frameHeight: 64, frames: 9, frameRate: 14, repeat: 0 },
  { id: 'thomas_unarmed_idle', url: '/assets/characters/thomas_unarmed_idle.png', frameWidth: 64, frameHeight: 64, frames: 4, frameRate: 8, repeat: -1 },
  { id: 'thomas_punch_light', url: '/assets/characters/thomas_punch_light.png', frameWidth: 64, frameHeight: 64, frames: 4, frameRate: 14, repeat: 0 },
  { id: 'thomas_punch_heavy', url: '/assets/characters/thomas_punch_heavy.png', frameWidth: 64, frameHeight: 64, frames: 5, frameRate: 12, repeat: 0 },

  // 2. Khaterine la Cazadora del Sauce Negro (10 sheets, 64x64)
  { id: 'khaterine_idle', url: '/assets/characters/khaterine_idle.png', frameWidth: 64, frameHeight: 64, frames: 6, frameRate: 8, repeat: -1 },
  { id: 'khaterine_walk', url: '/assets/characters/khaterine_walk.png', frameWidth: 64, frameHeight: 64, frames: 6, frameRate: 10, repeat: -1 },
  { id: 'khaterine_run', url: '/assets/characters/khaterine_run.png', frameWidth: 64, frameHeight: 64, frames: 8, frameRate: 12, repeat: -1 },
  { id: 'khaterine_aim', url: '/assets/characters/khaterine_aim.png', frameWidth: 64, frameHeight: 64, frames: 3, frameRate: 12, repeat: 0 },
  { id: 'khaterine_shoot_light', url: '/assets/characters/khaterine_shoot_light.png', frameWidth: 64, frameHeight: 64, frames: 4, frameRate: 14, repeat: 0 },
  { id: 'khaterine_shoot_heavy', url: '/assets/characters/khaterine_shoot_heavy.png', frameWidth: 64, frameHeight: 64, frames: 6, frameRate: 12, repeat: 0 },
  { id: 'khaterine_ward', url: '/assets/characters/khaterine_ward.png', frameWidth: 64, frameHeight: 64, frames: 5, frameRate: 10, repeat: 0 },
  { id: 'khaterine_dodge', url: '/assets/characters/khaterine_dodge.png', frameWidth: 64, frameHeight: 64, frames: 5, frameRate: 14, repeat: 0 },
  { id: 'khaterine_hurt', url: '/assets/characters/khaterine_hurt.png', frameWidth: 64, frameHeight: 64, frames: 3, frameRate: 12, repeat: 0 },
  { id: 'khaterine_death', url: '/assets/characters/khaterine_death.png', frameWidth: 64, frameHeight: 64, frames: 6, frameRate: 8, repeat: 0 },

  // 3. Shalem el Gato (4 sheets, 32x32)
  { id: 'shalem_sit_idle', url: '/assets/characters/shalem_sit_idle.png', frameWidth: 32, frameHeight: 32, frames: 4, frameRate: 8, repeat: -1 },
  { id: 'shalem_lick_paw', url: '/assets/characters/shalem_lick_paw.png', frameWidth: 32, frameHeight: 32, frames: 6, frameRate: 10, repeat: 0 },
  { id: 'shalem_stretch', url: '/assets/characters/shalem_stretch.png', frameWidth: 32, frameHeight: 32, frames: 5, frameRate: 10, repeat: 0 },
  { id: 'shalem_walk', url: '/assets/characters/shalem_walk.png', frameWidth: 32, frameHeight: 32, frames: 6, frameRate: 10, repeat: -1 },

  // 4. Elowen de Oakhaven (3 sheets, 48x48)
  { id: 'elowen_idle', url: '/assets/characters/elowen_idle.png', frameWidth: 48, frameHeight: 48, frames: 4, frameRate: 8, repeat: -1 },
  { id: 'elowen_pray', url: '/assets/characters/elowen_pray.png', frameWidth: 48, frameHeight: 48, frames: 6, frameRate: 10, repeat: 0 },
  { id: 'elowen_speak', url: '/assets/characters/elowen_speak.png', frameWidth: 48, frameHeight: 48, frames: 4, frameRate: 10, repeat: 0 },

  // 5. Padre Cedric (2 sheets, 48x48)
  { id: 'cedric_idle', url: '/assets/characters/cedric_idle.png', frameWidth: 48, frameHeight: 48, frames: 4, frameRate: 8, repeat: -1 },
  { id: 'cedric_bless', url: '/assets/characters/cedric_bless.png', frameWidth: 48, frameHeight: 48, frames: 6, frameRate: 10, repeat: 0 },

  // 6. Sabueso de Ceniza (6 sheets, 64x48)
  { id: 'hound_patrol', url: '/assets/enemies/hound_patrol.png', frameWidth: 64, frameHeight: 48, frames: 6, frameRate: 10, repeat: -1 },
  { id: 'hound_alert', url: '/assets/enemies/hound_alert.png', frameWidth: 64, frameHeight: 48, frames: 3, frameRate: 10, repeat: 0 },
  { id: 'hound_windup', url: '/assets/enemies/hound_windup.png', frameWidth: 64, frameHeight: 48, frames: 4, frameRate: 10, repeat: 0 },
  { id: 'hound_bite', url: '/assets/enemies/hound_bite.png', frameWidth: 64, frameHeight: 48, frames: 4, frameRate: 12, repeat: 0 },
  { id: 'hound_stagger', url: '/assets/enemies/hound_stagger.png', frameWidth: 64, frameHeight: 48, frames: 4, frameRate: 10, repeat: 0 },
  { id: 'hound_death', url: '/assets/enemies/hound_death.png', frameWidth: 64, frameHeight: 48, frames: 6, frameRate: 10, repeat: 0 },

  // 7. Cultista del Incensario (5 sheets, 48x48)
  { id: 'cultist_patrol', url: '/assets/enemies/cultist_patrol.png', frameWidth: 48, frameHeight: 48, frames: 6, frameRate: 10, repeat: -1 },
  { id: 'cultist_alert', url: '/assets/enemies/cultist_alert.png', frameWidth: 48, frameHeight: 48, frames: 3, frameRate: 10, repeat: 0 },
  { id: 'cultist_swing', url: '/assets/enemies/cultist_swing.png', frameWidth: 48, frameHeight: 48, frames: 5, frameRate: 12, repeat: 0 },
  { id: 'cultist_stagger', url: '/assets/enemies/cultist_stagger.png', frameWidth: 48, frameHeight: 48, frames: 3, frameRate: 10, repeat: 0 },
  { id: 'cultist_death', url: '/assets/enemies/cultist_death.png', frameWidth: 48, frameHeight: 48, frames: 6, frameRate: 10, repeat: 0 },

  // 8. Flagelante con Cadena (5 sheets, 64x64)
  { id: 'zealot_patrol', url: '/assets/enemies/zealot_patrol.png', frameWidth: 64, frameHeight: 64, frames: 6, frameRate: 10, repeat: -1 },
  { id: 'zealot_alert', url: '/assets/enemies/zealot_alert.png', frameWidth: 64, frameHeight: 64, frames: 4, frameRate: 10, repeat: 0 },
  { id: 'zealot_chain_whip', url: '/assets/enemies/zealot_chain_whip.png', frameWidth: 64, frameHeight: 64, frames: 6, frameRate: 12, repeat: 0 },
  { id: 'zealot_heavy_slam', url: '/assets/enemies/zealot_heavy_slam.png', frameWidth: 64, frameHeight: 64, frames: 6, frameRate: 12, repeat: 0 },
  { id: 'zealot_death', url: '/assets/enemies/zealot_death.png', frameWidth: 64, frameHeight: 64, frames: 6, frameRate: 10, repeat: 0 },

  // 9. Penitente de la Cripta (5 sheets, 64x64)
  { id: 'skeleton_patrol', url: '/assets/enemies/skeleton_patrol.png', frameWidth: 64, frameHeight: 64, frames: 6, frameRate: 10, repeat: -1 },
  { id: 'skeleton_alert', url: '/assets/enemies/skeleton_alert.png', frameWidth: 64, frameHeight: 64, frames: 4, frameRate: 10, repeat: 0 },
  { id: 'skeleton_claymore_slash', url: '/assets/enemies/skeleton_claymore_slash.png', frameWidth: 64, frameHeight: 64, frames: 6, frameRate: 12, repeat: 0 },
  { id: 'skeleton_parried', url: '/assets/enemies/skeleton_parried.png', frameWidth: 64, frameHeight: 64, frames: 4, frameRate: 10, repeat: 0 },
  { id: 'skeleton_finisher_shatter', url: '/assets/enemies/skeleton_finisher_shatter.png', frameWidth: 64, frameHeight: 64, frames: 8, frameRate: 10, repeat: 0 },

  // 10. Madre Morwenna Fase 1 (4 sheets, 96x96) & Fase 2 (6 sheets, 128x128)
  { id: 'morwenna_levitate_idle', url: '/assets/enemies/morwenna_levitate_idle.png', frameWidth: 96, frameHeight: 96, frames: 6, frameRate: 8, repeat: -1 },
  { id: 'morwenna_cast_flame', url: '/assets/enemies/morwenna_cast_flame.png', frameWidth: 96, frameHeight: 96, frames: 8, frameRate: 12, repeat: 0 },
  { id: 'morwenna_swing_crucible', url: '/assets/enemies/morwenna_swing_crucible.png', frameWidth: 96, frameHeight: 96, frames: 6, frameRate: 12, repeat: 0 },
  { id: 'morwenna_stunned', url: '/assets/enemies/morwenna_stunned.png', frameWidth: 96, frameHeight: 96, frames: 4, frameRate: 8, repeat: -1 },
  { id: 'morwenna_phase2_shockwave', url: '/assets/enemies/morwenna_phase2_shockwave.png', frameWidth: 128, frameHeight: 128, frames: 8, frameRate: 12, repeat: 0 },
  { id: 'morwenna_phase2_idle', url: '/assets/enemies/morwenna_phase2_idle.png', frameWidth: 128, frameHeight: 128, frames: 6, frameRate: 10, repeat: -1 },
  { id: 'morwenna_phase2_whirlwind', url: '/assets/enemies/morwenna_phase2_whirlwind.png', frameWidth: 128, frameHeight: 128, frames: 8, frameRate: 14, repeat: 0 },
  { id: 'morwenna_phase2_geysers_cast', url: '/assets/enemies/morwenna_phase2_geysers_cast.png', frameWidth: 128, frameHeight: 128, frames: 8, frameRate: 12, repeat: 0 },
  { id: 'morwenna_phase2_lunge', url: '/assets/enemies/morwenna_phase2_lunge.png', frameWidth: 128, frameHeight: 128, frames: 6, frameRate: 14, repeat: 0 },
  { id: 'morwenna_purified', url: '/assets/enemies/morwenna_purified.png', frameWidth: 128, frameHeight: 128, frames: 10, frameRate: 10, repeat: 0 },

  // 11. Props Destructibles & Escenografía (11 sheets)
  { id: 'prop_barrel', url: '/assets/props/prop_barrel.png', frameWidth: 32, frameHeight: 48, frames: 3, frameRate: 8, repeat: 0 },
  { id: 'prop_parish_crate', url: '/assets/props/prop_parish_crate.png', frameWidth: 32, frameHeight: 32, frames: 3, frameRate: 8, repeat: 0 },
  { id: 'prop_street_lamp', url: '/assets/props/prop_street_lamp.png', frameWidth: 32, frameHeight: 96, frames: 5, frameRate: 6, repeat: -1 },
  { id: 'prop_sanctuary_cross', url: '/assets/props/prop_sanctuary_cross.png', frameWidth: 48, frameHeight: 80, frames: 4, frameRate: 8, repeat: -1 },
  { id: 'prop_sanctuary_altar', url: '/assets/props/prop_sanctuary_altar.png', frameWidth: 64, frameHeight: 48, frames: 4, frameRate: 8, repeat: -1 },
  { id: 'prop_great_pyre', url: '/assets/props/prop_great_pyre.png', frameWidth: 96, frameHeight: 96, frames: 6, frameRate: 10, repeat: -1 },
  { id: 'prop_cemetery_gate', url: '/assets/props/prop_cemetery_gate.png', frameWidth: 64, frameHeight: 96, frames: 5, frameRate: 8, repeat: 0 },
  { id: 'prop_celtic_gravestone', url: '/assets/props/prop_celtic_gravestone.png', frameWidth: 32, frameHeight: 48, frames: 3, frameRate: 8, repeat: 0 },
  { id: 'prop_monumental_sarcophagus', url: '/assets/props/prop_monumental_sarcophagus.png', frameWidth: 64, frameHeight: 64, frames: 3, frameRate: 8, repeat: 0 },
  { id: 'prop_soul_brazier', url: '/assets/props/prop_soul_brazier.png', frameWidth: 32, frameHeight: 48, frames: 4, frameRate: 10, repeat: -1 },
  { id: 'prop_mausoleum_facade', url: '/assets/props/prop_mausoleum_facade.png', frameWidth: 96, frameHeight: 128, frames: 4, frameRate: 8, repeat: -1 },

  // 12. VFX de Combate y Magia (11 sheets)
  { id: 'fx_slash_gold', url: '/assets/vfx/fx_slash_gold.png', frameWidth: 64, frameHeight: 64, frames: 4, frameRate: 16, repeat: 0 },
  { id: 'fx_slash_abyss', url: '/assets/vfx/fx_slash_abyss.png', frameWidth: 64, frameHeight: 64, frames: 4, frameRate: 16, repeat: 0 },
  { id: 'fx_parry_spark', url: '/assets/vfx/fx_parry_spark.png', frameWidth: 64, frameHeight: 64, frames: 3, frameRate: 18, repeat: 0 },
  { id: 'fx_arrow_abyssal', url: '/assets/vfx/fx_arrow_abyssal.png', frameWidth: 64, frameHeight: 32, frames: 3, frameRate: 14, repeat: -1 },
  { id: 'fx_pyre_explosion', url: '/assets/vfx/fx_pyre_explosion.png', frameWidth: 128, frameHeight: 128, frames: 6, frameRate: 14, repeat: 0 },
  { id: 'fx_flame_geyser_ground', url: '/assets/vfx/fx_flame_geyser_ground.png', frameWidth: 96, frameHeight: 64, frames: 4, frameRate: 12, repeat: -1 },
  { id: 'fx_flame_pillar', url: '/assets/vfx/fx_flame_pillar.png', frameWidth: 64, frameHeight: 128, frames: 6, frameRate: 14, repeat: 0 },
  { id: 'fx_spectral_soul_flame', url: '/assets/vfx/fx_spectral_soul_flame.png', frameWidth: 64, frameHeight: 64, frames: 4, frameRate: 12, repeat: -1 },
  { id: 'fx_bone_shatter', url: '/assets/vfx/fx_bone_shatter.png', frameWidth: 64, frameHeight: 64, frames: 5, frameRate: 14, repeat: 0 },
  { id: 'fx_wood_splinters', url: '/assets/vfx/fx_wood_splinters.png', frameWidth: 32, frameHeight: 32, frames: 4, frameRate: 14, repeat: 0 },
  { id: 'fx_stone_debris', url: '/assets/vfx/fx_stone_debris.png', frameWidth: 48, frameHeight: 48, frames: 4, frameRate: 14, repeat: 0 }
];

export const VISUAL_PACK_ICONS: readonly { id: string; url: string }[] = [
  { id: 'icon_maiden_balm', url: '/assets/icons/icon_maiden_balm.png' },
  { id: 'icon_jude_rosary', url: '/assets/icons/icon_jude_rosary.png' },
  { id: 'icon_consecrated_ash', url: '/assets/icons/icon_consecrated_ash.png' },
  { id: 'icon_dusk_balm', url: '/assets/icons/icon_dusk_balm.png' },
  { id: 'icon_holy_water', url: '/assets/icons/icon_holy_water.png' },
  { id: 'icon_crypt_key', url: '/assets/icons/icon_crypt_key.png' },
  { id: 'icon_oakhaven_cross', url: '/assets/icons/icon_oakhaven_cross.png' },
  { id: 'icon_black_willow_feather', url: '/assets/icons/icon_black_willow_feather.png' },
  { id: 'icon_skill_shield_slam', url: '/assets/icons/icon_skill_shield_slam.png' },
  { id: 'icon_skill_holy_edge', url: '/assets/icons/icon_skill_holy_edge.png' },
  { id: 'icon_skill_unyielding', url: '/assets/icons/icon_skill_unyielding.png' },
  { id: 'icon_skill_piercing_arrow', url: '/assets/icons/icon_skill_piercing_arrow.png' },
  { id: 'icon_skill_spectral_step', url: '/assets/icons/icon_skill_spectral_step.png' },
  { id: 'icon_skill_willow_sanctuary', url: '/assets/icons/icon_skill_willow_sanctuary.png' }
];

export const VISUAL_PACK_3D_CONCEPTS: readonly Concept3DSpec[] = [
  { id: 'concept_thomas', title: 'Thomas el Acólito (Turnaround 3D & Wireframe)', category: 'personaje', url: '/assets/concepts/concept_thomas.png', description: 'Túnica clerical gris/ciruela, Sello de Ceniza emisivo en el pecho y nodo weapon_sword desmontable.' },
  { id: 'concept_khaterine', title: 'Khaterine la Cazadora (Turnaround 3D & Arco Abisal)', category: 'personaje', url: '/assets/concepts/concept_khaterine.png', description: 'Hábito negro abisal, velo translúcido, runas amatistas y arco de madera del Sauce Negro.' },
  { id: 'concept_shalem', title: 'Shalem el Gato Persa (Turnaround 3D & Rig de Cola)', category: 'personaje', url: '/assets/concepts/concept_shalem.png', description: 'Pelaje negro carbón, ojos dorados emisivos (#ffd700) y cola articulada de 4 segmentos.' },
  { id: 'concept_elowen', title: 'Elowen de Oakhaven (Turnaround 3D & Pájaro de Madera)', category: 'personaje', url: '/assets/concepts/concept_elowen.png', description: 'Vestido azul noche, delantal de lino penitente, diadema argéntea y pájaro tallado en pino.' },
  { id: 'concept_cedric', title: 'Padre Cedric (Turnaround 3D & Farol de Aceite)', category: 'personaje', url: '/assets/concepts/concept_cedric.png', description: 'Hábito franciscano marrón, cíngulo blanco, barba larga y báculo con farol cálido.' },
  { id: 'concept_morwenna', title: 'Madre Morwenna Fase 1 (Vigía de la Pira)', category: 'enemigo', url: '/assets/concepts/concept_morwenna.png', description: 'Túnica carmesí inquisitorial con ribetes de oro, alto capirote y Crisol de Fuego Sagrado.' },
  { id: 'concept_morwenna_phase2', title: 'Madre Morwenna Fase 2 (Pira del Abismo Desatada)', category: 'enemigo', url: '/assets/concepts/concept_morwenna_phase2.png', description: 'Alas de ceniza y fuego de 12 plumas, Corona de Espinas candente y Gran Mandoble Flamígero.' },
  { id: 'concept_hound', title: 'Sabueso de Ceniza (Patrulla Cuadrúpeda 3D)', category: 'enemigo', url: '/assets/concepts/concept_hound.png', description: 'Bestia carbonizada con grietas de brasa interna, ojos rubí emisivos y fauces dentadas.' },
  { id: 'concept_cultist', title: 'Cultista del Incensario (Patrulla del Santo Oficio)', category: 'enemigo', url: '/assets/concepts/concept_cultist.png', description: 'Túnica oscura, máscara de ceniza y cadena oscilante con incensario de bronce ardiente.' },
  { id: 'concept_zealot', title: 'Flagelante con Cadena (Penitente del Mangual)', category: 'enemigo', url: '/assets/concepts/concept_zealot.png', description: 'Faldón carmesí, vendas blancas en los ojos y mangual pesado de hierro con púas.' },
  { id: 'concept_skeleton', title: 'Penitente de la Cripta (Guardián Esqueleto)', category: 'enemigo', url: '/assets/concepts/concept_skeleton.png', description: 'Osamenta ancestral, cuencas oculares cian (#00e5ff), mortaja rota y Claymore oxidada.' },
  { id: 'concept_prop_great_pyre', title: 'Gran Pira de Oakhaven (Arquitectura & Fuego)', category: 'prop', url: '/assets/concepts/concept_prop_great_pyre.png', description: 'Pira ceremonial de troncos y piedra en la plaza norte donde Morwenna celebra el auto de fe.' },
  { id: 'concept_prop_sanctuary_cross', title: 'Cruz del Santuario de San Jude', category: 'prop', url: '/assets/concepts/concept_prop_sanctuary_cross.png', description: 'Cruz monumental con grabados y velas votivas para guardar progreso y consagrar.' },
  { id: 'concept_prop_sanctuary_altar', title: 'Altar de Piedra de San Jude', category: 'prop', url: '/assets/concepts/concept_prop_sanctuary_altar.png', description: 'Mesa ritual de piedra con cirios encendidos junto al Padre Cedric.' },
  { id: 'concept_prop_street_lamp', title: 'Farola Victoriana de Aceite', category: 'prop', url: '/assets/concepts/concept_prop_street_lamp.png', description: 'Poste de hierro forjado con farol acristalado y estados de luz intacta, parpadeo y rotura.' },
  { id: 'concept_prop_cemetery_gate', title: 'Verja de Hierro del Cementerio', category: 'prop', url: '/assets/concepts/concept_prop_cemetery_gate.png', description: 'Pilares de granito con cruces y doble hoja batiente de hierro forjado.' },
  { id: 'concept_prop_mausoleum_facade', title: 'Fachada del Mausoleo y Cripta de San Jude', category: 'prop', url: '/assets/concepts/concept_prop_mausoleum_facade.png', description: 'Arco ojival gótico que conduce a las catacumbas subterráneas.' },
  { id: 'concept_prop_soul_brazier', title: 'Pebetero Espectral de Almas', category: 'prop', url: '/assets/concepts/concept_prop_soul_brazier.png', description: 'Trípode de hierro con llama espiritual cian (#00e5ff) que ilumina cementerio y criptas.' },
  { id: 'concept_prop_monumental_sarcophagus', title: 'Gran Sarcófago Monumental', category: 'prop', url: '/assets/concepts/concept_prop_monumental_sarcophagus.png', description: 'Tumba de piedra tallada con tapa deslizable e inscripción funeraria.' },
  { id: 'concept_prop_celtic_gravestone', title: 'Lápida Celta Destructible', category: 'prop', url: '/assets/concepts/concept_prop_celtic_gravestone.png', description: 'Lápida de granito con cruz celta y submallas de fractura.' },
  { id: 'concept_prop_barrel', title: 'Barril Parroquial Destructible', category: 'prop', url: '/assets/concepts/concept_prop_barrel.png', description: 'Barril de roble con aros de hierro y duelas fragmentables.' },
  { id: 'concept_prop_parish_crate', title: 'Caja de Suministros Destructible', category: 'prop', url: '/assets/concepts/concept_prop_parish_crate.png', description: 'Caja claveteada de madera con tablas astillables.' }
];

export function preloadVisualPackInPhaser(scene: Phaser.Scene): void {
  for (const spec of VISUAL_PACK_SPRITESHEETS) {
    scene.load.spritesheet(spec.id, spec.url, {
      frameWidth: spec.frameWidth,
      frameHeight: spec.frameHeight
    });
  }
  for (const icon of VISUAL_PACK_ICONS) {
    scene.load.image(icon.id, icon.url);
  }
}

export function registerVisualPackAnimations(scene: Phaser.Scene): void {
  for (const spec of VISUAL_PACK_SPRITESHEETS) {
    if (spec.frames <= 1 || spec.frameRate <= 0) continue;
    if (!scene.textures.exists(spec.id)) continue;

    // Register under exact id (e.g. 'thomas_idle', 'thomas_walk', 'hound_patrol')
    if (!scene.anims.exists(spec.id)) {
      scene.anims.create({
        key: spec.id,
        frames: scene.anims.generateFrameNumbers(spec.id, { start: 0, end: spec.frames - 1 }),
        frameRate: spec.frameRate,
        repeat: spec.repeat
      });
    }
  }

  // Legacy alias used by older calls
  if (!scene.anims.exists('thomas_walk_anim') && scene.textures.exists('thomas_walk')) {
    scene.anims.create({
      key: 'thomas_walk_anim',
      frames: scene.anims.generateFrameNumbers('thomas_walk', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
  }
}
