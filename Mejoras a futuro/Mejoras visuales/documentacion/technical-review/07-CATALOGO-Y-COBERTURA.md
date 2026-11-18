# 07 — Catálogo y cobertura del paquete visual

Base: 5a5f3ca. Recursos especificados: 123. Entregados: 123. Frames 2D: 463.

[Abrir catálogo local con animaciones](../../catalogo.html). Los PNG de sprites están normalizados; las láminas 3D son referencias de modelado y no contienen geometría GLB.

| Tipo | Recursos |
|---|---:|
| Hojas de personajes/enemigos | 65 |
| Iconos | 14 |
| Hojas de efectos | 11 |
| Hojas de props | 11 |
| Referencias 3D | 22 |

## Criterio de cobertura

Se elige el máximo de cada rango de frames de la guía. Un recurso se contabiliza cuando tiene original seleccionado, metadata y exportación legible. El número de frames se comprueba por celda; las variantes rechazadas se conservan aparte y no incrementan el total.

Todos los frames de cada hoja siguen el orden de lectura del original. El archivo normalizado es una tira horizontal; los PNG individuales están en frames/ID/00.png y siguientes. El manifiesto incluye pivote, origen, velocidad, repetición, hash y avisos.

Los props combinan estados y clips: no deben reproducirse todos automáticamente como ciclos. La farola reserva 0 para intacta, 1–3 para parpadeo y 4 para rota. Las animaciones de ataque son referencias visuales: el momento de daño se define en las reglas del combate.

La cobertura de archivos no certifica limpieza manual de pixel art, anatomía, identidad perfecta entre clips ni continuidad de cada ciclo. Revisar las secuencias completas y probar la muestra aprobada en la escena real.

## Recursos 2D

| ID | Tipo | Frames | Celda | FPS | PNG | Original |
|---|---|---:|---|---:|---|---|
| thomas_idle | animation | 6 | 64×64 | 8 | [PNG](../../personajes/thomas/sprites/thomas_idle.png) | [Fuente](../../personajes/thomas/originales/thomas_idle.png) |
| thomas_walk | animation | 8 | 64×64 | 10 | [PNG](../../personajes/thomas/sprites/thomas_walk.png) | [Fuente](../../personajes/thomas/originales/thomas_walk.png) |
| thomas_run | animation | 8 | 64×64 | 12 | [PNG](../../personajes/thomas/sprites/thomas_run.png) | [Fuente](../../personajes/thomas/originales/thomas_run.png) |
| thomas_slash_light | animation | 5 | 64×64 | 14 | [PNG](../../personajes/thomas/sprites/thomas_slash_light.png) | [Fuente](../../personajes/thomas/originales/thomas_slash_light.png) |
| thomas_slash_heavy | animation | 7 | 64×64 | 12 | [PNG](../../personajes/thomas/sprites/thomas_slash_heavy.png) | [Fuente](../../personajes/thomas/originales/thomas_slash_heavy.png) |
| thomas_guard | animation | 3 | 64×64 | 10 | [PNG](../../personajes/thomas/sprites/thomas_guard.png) | [Fuente](../../personajes/thomas/originales/thomas_guard.png) |
| thomas_parry | animation | 4 | 64×64 | 16 | [PNG](../../personajes/thomas/sprites/thomas_parry.png) | [Fuente](../../personajes/thomas/originales/thomas_parry.png) |
| thomas_dodge | animation | 6 | 64×64 | 14 | [PNG](../../personajes/thomas/sprites/thomas_dodge.png) | [Fuente](../../personajes/thomas/originales/thomas_dodge.png) |
| thomas_throw_sword | animation | 5 | 64×64 | 12 | [PNG](../../personajes/thomas/sprites/thomas_throw_sword.png) | [Fuente](../../personajes/thomas/originales/thomas_throw_sword.png) |
| thomas_hurt | animation | 3 | 64×64 | 12 | [PNG](../../personajes/thomas/sprites/thomas_hurt.png) | [Fuente](../../personajes/thomas/originales/thomas_hurt.png) |
| thomas_death | animation | 8 | 64×64 | 8 | [PNG](../../personajes/thomas/sprites/thomas_death.png) | [Fuente](../../personajes/thomas/originales/thomas_death.png) |
| thomas_finisher | animation | 9 | 64×64 | 14 | [PNG](../../personajes/thomas/sprites/thomas_finisher.png) | [Fuente](../../personajes/thomas/originales/thomas_finisher.png) |
| thomas_unarmed_idle | animation | 4 | 64×64 | 8 | [PNG](../../personajes/thomas/sprites/thomas_unarmed_idle.png) | [Fuente](../../personajes/thomas/originales/thomas_unarmed_idle.png) |
| thomas_punch_light | animation | 4 | 64×64 | 14 | [PNG](../../personajes/thomas/sprites/thomas_punch_light.png) | [Fuente](../../personajes/thomas/originales/thomas_punch_light.png) |
| thomas_punch_heavy | animation | 5 | 64×64 | 12 | [PNG](../../personajes/thomas/sprites/thomas_punch_heavy.png) | [Fuente](../../personajes/thomas/originales/thomas_punch_heavy.png) |
| khaterine_idle | animation | 6 | 64×64 | 8 | [PNG](../../personajes/khaterine/sprites/khaterine_idle.png) | [Fuente](../../personajes/khaterine/originales/khaterine_idle.png) |
| khaterine_walk | animation | 6 | 64×64 | 10 | [PNG](../../personajes/khaterine/sprites/khaterine_walk.png) | [Fuente](../../personajes/khaterine/originales/khaterine_walk.png) |
| khaterine_run | animation | 8 | 64×64 | 12 | [PNG](../../personajes/khaterine/sprites/khaterine_run.png) | [Fuente](../../personajes/khaterine/originales/khaterine_run.png) |
| khaterine_aim | animation | 3 | 64×64 | 12 | [PNG](../../personajes/khaterine/sprites/khaterine_aim.png) | [Fuente](../../personajes/khaterine/originales/khaterine_aim.png) |
| khaterine_shoot_light | animation | 4 | 64×64 | 14 | [PNG](../../personajes/khaterine/sprites/khaterine_shoot_light.png) | [Fuente](../../personajes/khaterine/originales/khaterine_shoot_light.png) |
| khaterine_shoot_heavy | animation | 6 | 64×64 | 12 | [PNG](../../personajes/khaterine/sprites/khaterine_shoot_heavy.png) | [Fuente](../../personajes/khaterine/originales/khaterine_shoot_heavy.png) |
| khaterine_ward | animation | 5 | 64×64 | 10 | [PNG](../../personajes/khaterine/sprites/khaterine_ward.png) | [Fuente](../../personajes/khaterine/originales/khaterine_ward.png) |
| khaterine_dodge | animation | 5 | 64×64 | 14 | [PNG](../../personajes/khaterine/sprites/khaterine_dodge.png) | [Fuente](../../personajes/khaterine/originales/khaterine_dodge.png) |
| khaterine_hurt | animation | 3 | 64×64 | 12 | [PNG](../../personajes/khaterine/sprites/khaterine_hurt.png) | [Fuente](../../personajes/khaterine/originales/khaterine_hurt.png) |
| khaterine_death | animation | 6 | 64×64 | 8 | [PNG](../../personajes/khaterine/sprites/khaterine_death.png) | [Fuente](../../personajes/khaterine/originales/khaterine_death.png) |
| shalem_sit_idle | animation | 4 | 32×32 | 10 | [PNG](../../personajes/shalem/sprites/shalem_sit_idle.png) | [Fuente](../../personajes/shalem/originales/shalem_sit_idle.png) |
| shalem_lick_paw | animation | 6 | 32×32 | 10 | [PNG](../../personajes/shalem/sprites/shalem_lick_paw.png) | [Fuente](../../personajes/shalem/originales/shalem_lick_paw.png) |
| shalem_stretch | animation | 5 | 32×32 | 10 | [PNG](../../personajes/shalem/sprites/shalem_stretch.png) | [Fuente](../../personajes/shalem/originales/shalem_stretch.png) |
| shalem_walk | animation | 6 | 32×32 | 10 | [PNG](../../personajes/shalem/sprites/shalem_walk.png) | [Fuente](../../personajes/shalem/originales/shalem_walk.png) |
| elowen_idle | animation | 4 | 48×48 | 10 | [PNG](../../personajes/elowen/sprites/elowen_idle.png) | [Fuente](../../personajes/elowen/originales/elowen_idle.png) |
| elowen_pray | animation | 6 | 48×48 | 10 | [PNG](../../personajes/elowen/sprites/elowen_pray.png) | [Fuente](../../personajes/elowen/originales/elowen_pray.png) |
| elowen_speak | animation | 4 | 48×48 | 10 | [PNG](../../personajes/elowen/sprites/elowen_speak.png) | [Fuente](../../personajes/elowen/originales/elowen_speak.png) |
| cedric_idle | animation | 4 | 48×48 | 10 | [PNG](../../personajes/cedric/sprites/cedric_idle.png) | [Fuente](../../personajes/cedric/originales/cedric_idle.png) |
| cedric_bless | animation | 6 | 48×48 | 10 | [PNG](../../personajes/cedric/sprites/cedric_bless.png) | [Fuente](../../personajes/cedric/originales/cedric_bless.png) |
| hound_patrol | animation | 6 | 64×48 | 10 | [PNG](../../enemigos/hound/sprites/hound_patrol.png) | [Fuente](../../enemigos/hound/originales/hound_patrol.png) |
| hound_alert | animation | 3 | 64×48 | 10 | [PNG](../../enemigos/hound/sprites/hound_alert.png) | [Fuente](../../enemigos/hound/originales/hound_alert.png) |
| hound_windup | animation | 4 | 64×48 | 10 | [PNG](../../enemigos/hound/sprites/hound_windup.png) | [Fuente](../../enemigos/hound/originales/hound_windup.png) |
| hound_bite | animation | 4 | 64×48 | 10 | [PNG](../../enemigos/hound/sprites/hound_bite.png) | [Fuente](../../enemigos/hound/originales/hound_bite.png) |
| hound_stagger | animation | 4 | 64×48 | 10 | [PNG](../../enemigos/hound/sprites/hound_stagger.png) | [Fuente](../../enemigos/hound/originales/hound_stagger.png) |
| hound_death | animation | 6 | 64×48 | 10 | [PNG](../../enemigos/hound/sprites/hound_death.png) | [Fuente](../../enemigos/hound/originales/hound_death.png) |
| morwenna_levitate_idle | animation | 6 | 96×96 | 10 | [PNG](../../enemigos/morwenna/sprites/morwenna_levitate_idle.png) | [Fuente](../../enemigos/morwenna/originales/morwenna_levitate_idle.png) |
| morwenna_cast_flame | animation | 8 | 96×96 | 10 | [PNG](../../enemigos/morwenna/sprites/morwenna_cast_flame.png) | [Fuente](../../enemigos/morwenna/originales/morwenna_cast_flame.png) |
| morwenna_swing_crucible | animation | 6 | 96×96 | 10 | [PNG](../../enemigos/morwenna/sprites/morwenna_swing_crucible.png) | [Fuente](../../enemigos/morwenna/originales/morwenna_swing_crucible.png) |
| morwenna_stunned | animation | 4 | 96×96 | 10 | [PNG](../../enemigos/morwenna/sprites/morwenna_stunned.png) | [Fuente](../../enemigos/morwenna/originales/morwenna_stunned.png) |
| morwenna_phase2_shockwave | animation | 8 | 128×128 | 10 | [PNG](../../enemigos/morwenna_phase2/sprites/morwenna_phase2_shockwave.png) | [Fuente](../../enemigos/morwenna_phase2/originales/morwenna_phase2_shockwave.png) |
| morwenna_phase2_idle | animation | 6 | 128×128 | 10 | [PNG](../../enemigos/morwenna_phase2/sprites/morwenna_phase2_idle.png) | [Fuente](../../enemigos/morwenna_phase2/originales/morwenna_phase2_idle.png) |
| morwenna_phase2_whirlwind | animation | 8 | 128×128 | 10 | [PNG](../../enemigos/morwenna_phase2/sprites/morwenna_phase2_whirlwind.png) | [Fuente](../../enemigos/morwenna_phase2/originales/morwenna_phase2_whirlwind.png) |
| morwenna_phase2_geysers_cast | animation | 8 | 128×128 | 10 | [PNG](../../enemigos/morwenna_phase2/sprites/morwenna_phase2_geysers_cast.png) | [Fuente](../../enemigos/morwenna_phase2/originales/morwenna_phase2_geysers_cast.png) |
| morwenna_phase2_lunge | animation | 6 | 128×128 | 10 | [PNG](../../enemigos/morwenna_phase2/sprites/morwenna_phase2_lunge.png) | [Fuente](../../enemigos/morwenna_phase2/originales/morwenna_phase2_lunge.png) |
| morwenna_purified | animation | 10 | 128×128 | 10 | [PNG](../../enemigos/morwenna_phase2/sprites/morwenna_purified.png) | [Fuente](../../enemigos/morwenna_phase2/originales/morwenna_purified.png) |
| cultist_patrol | animation | 6 | 48×48 | 10 | [PNG](../../enemigos/cultist/sprites/cultist_patrol.png) | [Fuente](../../enemigos/cultist/originales/cultist_patrol.png) |
| cultist_alert | animation | 3 | 48×48 | 10 | [PNG](../../enemigos/cultist/sprites/cultist_alert.png) | [Fuente](../../enemigos/cultist/originales/cultist_alert.png) |
| cultist_swing | animation | 5 | 48×48 | 10 | [PNG](../../enemigos/cultist/sprites/cultist_swing.png) | [Fuente](../../enemigos/cultist/originales/cultist_swing.png) |
| cultist_stagger | animation | 3 | 48×48 | 10 | [PNG](../../enemigos/cultist/sprites/cultist_stagger.png) | [Fuente](../../enemigos/cultist/originales/cultist_stagger.png) |
| cultist_death | animation | 6 | 48×48 | 10 | [PNG](../../enemigos/cultist/sprites/cultist_death.png) | [Fuente](../../enemigos/cultist/originales/cultist_death.png) |
| zealot_patrol | animation | 6 | 64×64 | 10 | [PNG](../../enemigos/zealot/sprites/zealot_patrol.png) | [Fuente](../../enemigos/zealot/originales/zealot_patrol.png) |
| zealot_alert | animation | 4 | 64×64 | 10 | [PNG](../../enemigos/zealot/sprites/zealot_alert.png) | [Fuente](../../enemigos/zealot/originales/zealot_alert.png) |
| zealot_chain_whip | animation | 6 | 64×64 | 10 | [PNG](../../enemigos/zealot/sprites/zealot_chain_whip.png) | [Fuente](../../enemigos/zealot/originales/zealot_chain_whip.png) |
| zealot_heavy_slam | animation | 6 | 64×64 | 10 | [PNG](../../enemigos/zealot/sprites/zealot_heavy_slam.png) | [Fuente](../../enemigos/zealot/originales/zealot_heavy_slam.png) |
| zealot_death | animation | 6 | 64×64 | 10 | [PNG](../../enemigos/zealot/sprites/zealot_death.png) | [Fuente](../../enemigos/zealot/originales/zealot_death.png) |
| skeleton_patrol | animation | 6 | 64×64 | 10 | [PNG](../../enemigos/skeleton/sprites/skeleton_patrol.png) | [Fuente](../../enemigos/skeleton/originales/skeleton_patrol.png) |
| skeleton_alert | animation | 4 | 64×64 | 10 | [PNG](../../enemigos/skeleton/sprites/skeleton_alert.png) | [Fuente](../../enemigos/skeleton/originales/skeleton_alert.png) |
| skeleton_claymore_slash | animation | 6 | 64×64 | 10 | [PNG](../../enemigos/skeleton/sprites/skeleton_claymore_slash.png) | [Fuente](../../enemigos/skeleton/originales/skeleton_claymore_slash.png) |
| skeleton_parried | animation | 4 | 64×64 | 10 | [PNG](../../enemigos/skeleton/sprites/skeleton_parried.png) | [Fuente](../../enemigos/skeleton/originales/skeleton_parried.png) |
| skeleton_finisher_shatter | animation | 8 | 64×64 | 10 | [PNG](../../enemigos/skeleton/sprites/skeleton_finisher_shatter.png) | [Fuente](../../enemigos/skeleton/originales/skeleton_finisher_shatter.png) |
| icon_maiden_balm | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_maiden_balm.png) | [Fuente](../../iconos/originales/icon_maiden_balm.png) |
| icon_jude_rosary | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_jude_rosary.png) | [Fuente](../../iconos/originales/icon_jude_rosary.png) |
| icon_consecrated_ash | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_consecrated_ash.png) | [Fuente](../../iconos/originales/icon_consecrated_ash.png) |
| icon_dusk_balm | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_dusk_balm.png) | [Fuente](../../iconos/originales/icon_dusk_balm.png) |
| icon_holy_water | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_holy_water.png) | [Fuente](../../iconos/originales/icon_holy_water.png) |
| icon_crypt_key | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_crypt_key.png) | [Fuente](../../iconos/originales/icon_crypt_key.png) |
| icon_oakhaven_cross | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_oakhaven_cross.png) | [Fuente](../../iconos/originales/icon_oakhaven_cross.png) |
| icon_black_willow_feather | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_black_willow_feather.png) | [Fuente](../../iconos/originales/icon_black_willow_feather.png) |
| icon_skill_shield_slam | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_skill_shield_slam.png) | [Fuente](../../iconos/originales/icon_skill_shield_slam.png) |
| icon_skill_holy_edge | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_skill_holy_edge.png) | [Fuente](../../iconos/originales/icon_skill_holy_edge.png) |
| icon_skill_unyielding | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_skill_unyielding.png) | [Fuente](../../iconos/originales/icon_skill_unyielding.png) |
| icon_skill_piercing_arrow | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_skill_piercing_arrow.png) | [Fuente](../../iconos/originales/icon_skill_piercing_arrow.png) |
| icon_skill_spectral_step | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_skill_spectral_step.png) | [Fuente](../../iconos/originales/icon_skill_spectral_step.png) |
| icon_skill_willow_sanctuary | icon | 1 | 32×32 | 0 | [PNG](../../iconos/sprites/icon_skill_willow_sanctuary.png) | [Fuente](../../iconos/originales/icon_skill_willow_sanctuary.png) |
| fx_slash_gold | vfx | 4 | 64×64 | 12 | [PNG](../../efectos/sprites/fx_slash_gold.png) | [Fuente](../../efectos/originales/fx_slash_gold.png) |
| fx_slash_abyss | vfx | 4 | 64×64 | 12 | [PNG](../../efectos/sprites/fx_slash_abyss.png) | [Fuente](../../efectos/originales/fx_slash_abyss.png) |
| fx_parry_spark | vfx | 3 | 64×64 | 12 | [PNG](../../efectos/sprites/fx_parry_spark.png) | [Fuente](../../efectos/originales/fx_parry_spark.png) |
| fx_arrow_abyssal | vfx | 3 | 64×32 | 12 | [PNG](../../efectos/sprites/fx_arrow_abyssal.png) | [Fuente](../../efectos/originales/fx_arrow_abyssal.png) |
| fx_pyre_explosion | vfx | 6 | 128×128 | 12 | [PNG](../../efectos/sprites/fx_pyre_explosion.png) | [Fuente](../../efectos/originales/fx_pyre_explosion.png) |
| fx_flame_geyser_ground | vfx | 4 | 96×64 | 12 | [PNG](../../efectos/sprites/fx_flame_geyser_ground.png) | [Fuente](../../efectos/originales/fx_flame_geyser_ground.png) |
| fx_flame_pillar | vfx | 6 | 64×128 | 12 | [PNG](../../efectos/sprites/fx_flame_pillar.png) | [Fuente](../../efectos/originales/fx_flame_pillar.png) |
| fx_spectral_soul_flame | vfx | 4 | 64×64 | 12 | [PNG](../../efectos/sprites/fx_spectral_soul_flame.png) | [Fuente](../../efectos/originales/fx_spectral_soul_flame.png) |
| fx_bone_shatter | vfx | 5 | 64×64 | 12 | [PNG](../../efectos/sprites/fx_bone_shatter.png) | [Fuente](../../efectos/originales/fx_bone_shatter.png) |
| fx_wood_splinters | vfx | 4 | 32×32 | 12 | [PNG](../../efectos/sprites/fx_wood_splinters.png) | [Fuente](../../efectos/originales/fx_wood_splinters.png) |
| fx_stone_debris | vfx | 4 | 48×48 | 12 | [PNG](../../efectos/sprites/fx_stone_debris.png) | [Fuente](../../efectos/originales/fx_stone_debris.png) |
| prop_barrel | prop | 3 | 32×48 | 8 | [PNG](../../props/sprites/prop_barrel.png) | [Fuente](../../props/originales/prop_barrel.png) |
| prop_parish_crate | prop | 3 | 32×32 | 8 | [PNG](../../props/sprites/prop_parish_crate.png) | [Fuente](../../props/originales/prop_parish_crate.png) |
| prop_street_lamp | prop | 5 | 32×96 | 8 | [PNG](../../props/sprites/prop_street_lamp.png) | [Fuente](../../props/originales/prop_street_lamp.png) |
| prop_sanctuary_cross | prop | 4 | 48×80 | 8 | [PNG](../../props/sprites/prop_sanctuary_cross.png) | [Fuente](../../props/originales/prop_sanctuary_cross.png) |
| prop_sanctuary_altar | prop | 4 | 64×48 | 8 | [PNG](../../props/sprites/prop_sanctuary_altar.png) | [Fuente](../../props/originales/prop_sanctuary_altar.png) |
| prop_great_pyre | prop | 6 | 96×96 | 8 | [PNG](../../props/sprites/prop_great_pyre.png) | [Fuente](../../props/originales/prop_great_pyre.png) |
| prop_cemetery_gate | prop | 5 | 64×96 | 8 | [PNG](../../props/sprites/prop_cemetery_gate.png) | [Fuente](../../props/originales/prop_cemetery_gate.png) |
| prop_celtic_gravestone | prop | 3 | 32×48 | 8 | [PNG](../../props/sprites/prop_celtic_gravestone.png) | [Fuente](../../props/originales/prop_celtic_gravestone.png) |
| prop_monumental_sarcophagus | prop | 3 | 64×64 | 8 | [PNG](../../props/sprites/prop_monumental_sarcophagus.png) | [Fuente](../../props/originales/prop_monumental_sarcophagus.png) |
| prop_soul_brazier | prop | 4 | 32×48 | 8 | [PNG](../../props/sprites/prop_soul_brazier.png) | [Fuente](../../props/originales/prop_soul_brazier.png) |
| prop_mausoleum_facade | prop | 4 | 96×128 | 8 | [PNG](../../props/sprites/prop_mausoleum_facade.png) | [Fuente](../../props/originales/prop_mausoleum_facade.png) |

## Láminas de referencia 3D

| ID | Resolución | Diseño |
|---|---|---|
| concept_thomas | 1536×1024 | [Lámina](../../3D/personajes/concept_thomas.png) |
| concept_khaterine | 1774×887 | [Lámina](../../3D/personajes/concept_khaterine.png) |
| concept_shalem | 1536×1024 | [Lámina](../../3D/personajes/concept_shalem.png) |
| concept_elowen | 1536×1024 | [Lámina](../../3D/personajes/concept_elowen.png) |
| concept_cedric | 1774×887 | [Lámina](../../3D/personajes/concept_cedric.png) |
| concept_hound | 1536×1024 | [Lámina](../../3D/enemigos/concept_hound.png) |
| concept_morwenna | 1774×887 | [Lámina](../../3D/enemigos/concept_morwenna.png) |
| concept_morwenna_phase2 | 1774×887 | [Lámina](../../3D/enemigos/concept_morwenna_phase2.png) |
| concept_cultist | 1774×887 | [Lámina](../../3D/enemigos/concept_cultist.png) |
| concept_zealot | 1774×887 | [Lámina](../../3D/enemigos/concept_zealot.png) |
| concept_skeleton | 1536×1024 | [Lámina](../../3D/enemigos/concept_skeleton.png) |
| concept_prop_barrel | 1536×1024 | [Lámina](../../3D/props/concept_prop_barrel.png) |
| concept_prop_parish_crate | 1536×1024 | [Lámina](../../3D/props/concept_prop_parish_crate.png) |
| concept_prop_street_lamp | 1536×1024 | [Lámina](../../3D/props/concept_prop_street_lamp.png) |
| concept_prop_sanctuary_cross | 1536×1024 | [Lámina](../../3D/props/concept_prop_sanctuary_cross.png) |
| concept_prop_sanctuary_altar | 1536×1024 | [Lámina](../../3D/props/concept_prop_sanctuary_altar.png) |
| concept_prop_great_pyre | 1536×1024 | [Lámina](../../3D/props/concept_prop_great_pyre.png) |
| concept_prop_cemetery_gate | 1536×1024 | [Lámina](../../3D/props/concept_prop_cemetery_gate.png) |
| concept_prop_celtic_gravestone | 1536×1024 | [Lámina](../../3D/props/concept_prop_celtic_gravestone.png) |
| concept_prop_monumental_sarcophagus | 1536×1024 | [Lámina](../../3D/props/concept_prop_monumental_sarcophagus.png) |
| concept_prop_soul_brazier | 1536×1024 | [Lámina](../../3D/props/concept_prop_soul_brazier.png) |
| concept_prop_mausoleum_facade | 1536×1024 | [Lámina](../../3D/props/concept_prop_mausoleum_facade.png) |

## Resultado del validador

- Errores de exportación: 0.
- Recursos pendientes: 0.
- Recursos con avisos automáticos: 0.

[Informe completo](../../validacion.json) · [Manifiesto](../../manifiesto.json) · [Prompts y ediciones](../../prompts.json).

## Organización del ZIP

El ZIP agrupa el mismo contenido para revisión humana: personajes/, enemigos/, iconos/, props/, efectos/ y 3D/. Cada grupo conserva originales, PNG de juego, frames y previews. La raíz contiene catalogo.html y manifiesto.json con rutas adaptadas a esas carpetas. La documentación está en documentacion/.

En el repositorio se mantiene art/pack-v1 para que las herramientas tengan un punto de entrada estable. El ZIP no cambia los IDs de los recursos ni el contenido de sus PNG.
