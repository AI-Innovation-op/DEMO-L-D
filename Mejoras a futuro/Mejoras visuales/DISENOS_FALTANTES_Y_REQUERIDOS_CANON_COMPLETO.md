# 🎨 Especificación Completa de Diseños Visuales Faltantes y Deseados (Actos I al V) — *The Light in the Darkness*

> [!IMPORTANT]
> **Estado actual del repositorio**: Ya están integrados y funcionando los **123 activos del Paquete Visual v1** (`87` hojas de sprites del Acto I, `14` iconos y `22` láminas de referencia 3D).  
> Este documento enumera **todos los diseños adicionales** que necesitamos o deseamos para que los **Actos I, II, III, IV y V (20 Capítulos completos)** tengan **100% de arte propio y dedicado** sin reutilizar siluetas entre jefes o zonas.

---

## 📐 Resumen Ejecutivo del Inventario Faltante

| Categoría | Cantidad | Formato & Resolución | Carpeta Destino en el Proyecto | Prioridad |
| :--- | :---: | :--- | :--- | :---: |
| **1. Jefes y Sub-Jefes (Actos I–V)** | **36 hojas** | `.png` tira horizontal (`96×64` a `160×160 px` por celda) | `public/assets/enemies/` | 🔴 **ALTA** |
| **2. Nuevas Animaciones de Héroes y NPCs** | **11 hojas** | `.png` tira horizontal (`48×48`, `64×64`, `96×96 px`) | `public/assets/characters/` | 🔴 **ALTA** |
| **3. Retratos Cuadrados Faltantes** | **6 archivos** | `.png` `256 × 256 px` | `public/assets/characters/` | 🟠 **MEDIA-ALTA** |
| **4. Props Animados de los Actos II–V** | **12 hojas** | `.png` tira horizontal (`64×32` a `160×192 px`) | `public/assets/props/` | 🟠 **MEDIA-ALTA** |
| **5. Iconos de Reliquias, Munición y Materiales** | **14 archivos** | `.png` `32 × 32 px` | `public/assets/icons/` | 🟡 **MEDIA** |
| **6. VFX Especiales de Combate (Actos II–V)** | **6 hojas** | `.png` tira horizontal (`48×16` a `128×128 px`) | `public/assets/vfx/` | 🟡 **MEDIA** |
| **7. Fondos Panorámicos por Zona (2D y 3D)** | **5 archivos** | `.png` `1280 × 720 px` | `public/assets/loading/` | 🟡 **MEDIA** |
| **8. Láminas Turnaround 3D / Modelos `.glb`** | **8 láminas** | `.png` `1536 × 1024 px` (y/o `.glb` low-poly) | `public/assets/concepts/` | 🟢 **OPCIONAL** |

---

## 👹 1. Jefes y Sub-Jefes Canónicos (Actos I al V) — 36 Hojas de Sprites

Actualmente, los 6 jefes posteriores a Madre Morwenna reutilizan temporalmente sprites de `zealot`, `hound`, `skeleton` o `morwenna_p2`. Con estas **36 hojas dedicadas**, cada jefe del canon tendrá su silueta y animaciones únicas en 2D y 3D:

### 1.1. Sub-Jefe Acto I (Criptas de San Jude): *El Inquisidor Caído de San Jude*
- **Estética y Paleta**: Armadura de placas de hierro ennegrecido (`#14141c`), cruz inquisitorial de oro viejo (`#8a6d2b`), sombrero piramidal de ala ancha y tabardo carmesí oscuro (`#220c18`), rostro de cráneo con ojos rojos candentes (`#ff1144`), maza pesada de púas en mano derecha y escudo gótico con fuego violeta (`#9b59b6`) en mano izquierda.
- **Tamaño de Celda**: `96 × 96 px`

| Nombre de Archivo (`public/assets/enemies/`) | Fotogramas | Dimensiones Totales | FPS | Bucle | Descripción de la Animación |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `inquisitor_idle.png` | 6 | `576 × 96 px` | 8 | Sí | Respiración pesada tras el escudo de fuego violeta, maza de púas humeando. |
| `inquisitor_walk.png` | 6 | `576 × 96 px` | 8 | Sí | Marcha acorazada implacable con el escudo alzado al frente. |
| `inquisitor_shield_block.png` | 4 | `384 × 96 px` | 12 | No | Planta el escudo absorbiendo un impacto frontal con chispas violetas (`60%` bloqueo). |
| `inquisitor_mace_swing.png` | 6 | `576 × 96 px` | 14 | No | Barrido lateral devastador con la maza de púas dejando estela carmesí. |
| `inquisitor_holy_slam.png` | 8 | `768 × 96 px` | 12 | No | Salto corto y martillazo contra las losas que libera una onda de maldición (`3.8 m`). |
| `inquisitor_stun_death.png` | 6 | `576 × 96 px` | 10 | No | Escudo abierto/aturdido (frames 1–2) y colapso de la armadura vacía en ceniza (frames 3–6). |

---

### 1.2. Bestia Guardiana Acto I (Bosque del Sauce Negro): *Acechador de Raíces (Root Prowler)*
- **Estética y Paleta**: Depredador cuadrúpedo colosal formado por raíces negras retorcidas (`#1f140e`), espinas dorsales de madera fosilizada (`#331c12`), savia bioluminiscente púrpura (`#bb44ff`) corriendo por sus grietas y cráneo lupino de corteza con ojos violetas brillantes.
- **Tamaño de Celda**: `96 × 64 px`

| Nombre de Archivo (`public/assets/enemies/`) | Fotogramas | Dimensiones Totales | FPS | Bucle | Descripción de la Animación |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `root_prowler_patrol.png` | 6 | `576 × 64 px` | 10 | Sí | Acecho felino/lupino bajo entre la niebla, raíces del lomo ondulando. |
| `root_prowler_alert.png` | 4 | `384 × 64 px` | 10 | No | Ruge abriendo las fauces de madera; las espinas dorsales se iluminan en violeta. |
| `root_prowler_run.png` | 6 | `576 × 64 px` | 14 | Sí | Galope salvaje desprendiendo esporas luminosas y hojas negras. |
| `root_prowler_pounce.png` | 6 | `576 × 64 px` | 14 | No | Salto depredador con ambas zarpas de raíz extendidas para desgarrar. |
| `root_prowler_stun.png` | 4 | `384 × 64 px` | 8 | Sí | Aturdido o envuelto en llamas (vulnerabilidad al fuego fatuo), sacudiendo el cráneo. |
| `root_prowler_death.png` | 6 | `576 × 64 px` | 10 | No | Las raíces se secan y se desmoronan liberando una nube de esporas violetas. |

---

### 1.3. Jefe Acto II (Campanario del Sur): *El Guardián del Crisol de Bronce (Crucible Guardian)*
- **Estética y Paleta**: Coloso de fundición inquisitorial con delantal de hierro forjado (`#221a18`), yelmo remachado de herrero con hendidura ocular incandescente (`#ff3300`), cadenas de bronce (`#8b6508`) y un gigantesco martillo de fragua con núcleo de escoria fundida (`#ff5511`).
- **Tamaño de Celda**: `112 × 112 px`

| Nombre de Archivo (`public/assets/enemies/`) | Fotogramas | Dimensiones Totales | FPS | Bucle | Descripción de la Animación |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `crucible_guardian_idle.png` | 6 | `672 × 112 px` | 8 | Sí | Respiración de fuelle; sale humo y chispas naranjas por la visera y el pecho. |
| `crucible_guardian_walk.png` | 6 | `672 × 112 px` | 8 | Sí | Pisadas pesadas que hacen temblar los tablones del campanario, arrastrando el martillo. |
| `crucible_guardian_hammer_slam.png` | 7 | `784 × 112 px` | 12 | No | Alza el martillo sobre su cabeza y lo estrella contra el suelo salpicando metal líquido. |
| `crucible_guardian_slag_burst.png` | 8 | `896 × 112 px` | 12 | No | Golpea su propio pecho de bronce provocando una erupción radial de escoria ardiente. |
| `crucible_guardian_stun.png` | 4 | `448 × 112 px` | 8 | Sí | De rodillas, el martillo clavado en el piso y la válvula del pecho abierta al descubierto. |
| `crucible_guardian_death.png` | 8 | `896 × 112 px` | 10 | No | El núcleo se enfría, el bronce se agrieta y el coloso se desploma soltando el *Lamento de Oakhaven*. |

---

### 1.4. Jefe Acto III (Gran Puente de Piedra): *Capitán Áureo Vane — El Escudo de Torre*
- **Estética y Paleta**: Comandante paladín del Cáliz Solar con armadura de placas de oro bruñido (`#d4af37`), tabardo blanco inmaculado (`#f5f5ff`) con el emblema del sol radiante, gran yelmo emplumado, un **Escudo de Torre monumental** en el brazo izquierdo y un mandoble solar (`#ffea77`) en el derecho.
- **Tamaño de Celda**: `96 × 96 px`

| Nombre de Archivo (`public/assets/enemies/`) | Fotogramas | Dimensiones Totales | FPS | Bucle | Descripción de la Animación |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `captain_vane_guard_idle.png` | 6 | `576 × 96 px` | 8 | Sí | Postura de muralla inexpugnable tras el escudo de torre dorado que brilla con luz solar. |
| `captain_vane_march.png` | 6 | `576 × 96 px` | 10 | Sí | Avance táctico disciplinado sin bajar la guardia del escudo frontal. |
| `captain_vane_shield_bash.png` | 6 | `576 × 96 px` | 14 | No | Embestida brutal con el borde del escudo de torre que derriba y rompe postura. |
| `captain_vane_verdict_slash.png` | 7 | `672 × 96 px` | 14 | No | Abre el escudo y ejecuta el gran tajo en arco *Falso Veredicto* con destello dorado. |
| `captain_vane_shield_break_stun.png` | 5 | `480 × 96 px` | 10 | No | El escudo de torre sale despedido hacia un lado tras un Parry o Flecha de Plata, dejándolo vulnerable. |
| `captain_vane_death.png` | 6 | `576 × 96 px` | 8 | No | Cae de rodillas apoyado en su mandoble mientras el escudo áureo se desploma sobre las losas. |

---

### 1.5. Jefe Acto IV (Ciudadela de Londinium): *Rex Malphas / Rey Alaric — El Déspota Astral*
- **Estética y Paleta**: El padre de Thomas transformado en monarca astral: armadura real dorada (`#d4af37`), manto de terciopelo carmesí imperial (`#800010`), corona de cinco puntas quebradas, mandoble áureo imbuido en energía cósmica púrpura (`#cc44ff`) y, en Fase 2, un halo/anillo de distorsión temporal (*La Ley del Deseo*) flotando a su espalda.
- **Tamaño de Celda**: `112 × 112 px`

| Nombre de Archivo (`public/assets/enemies/`) | Fotogramas | Dimensiones Totales | FPS | Bucle | Descripción de la Animación |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `malphas_astral_idle.png` | 6 | `672 × 112 px` | 8 | Sí | Porte regio e imponente; la capa flota sin gravedad y el mandoble destella en oro y violeta. |
| `malphas_solar_combo.png` | 8 | `896 × 112 px` | 14 | No | Doble estocada real seguida de un tajo descendente con el Mandoble Áureo. |
| `malphas_phase2_transform.png` | 8 | `896 × 112 px` | 12 | No | Alza la mano hacia el cielo; el anillo astral *Ley del Deseo* se enciende detrás de su corona. |
| `malphas_ley_del_deseo_warp.png` | 8 | `896 × 112 px` | 16 | No | Desplazamiento/teletransporte astral dejando espejismos de oro y humo antes de cortar el espacio. |
| `malphas_stun.png` | 4 | `448 × 112 px` | 8 | Sí | Aturdido tras un parry regicida; se sujeta el pecho mientras su corona chisporrotea. |
| `malphas_death.png` | 8 | `896 × 112 px` | 8 | No | Cae sobre la escalinata del trono; su corona se parte en dos y rueda por el mármol blanco. |

---

### 1.6. Titán Final Acto V (La Catedral Invertida): *Astaroth — El Padre de las Cenizas y Sol del Abismo*
- **Estética y Paleta**: Entidad cósmica titánica suspendida bajo las bóvedas invertidas: silueta humanoide/serafín de obsidiana agrietada (`#08030d`) fusionada con un **Sol Negro eclipsado** en el torso (`#ff2288`), seis alas de ceniza estelar, corona de prominencias solares magenta/doradas y filamentos de gravedad invertida.
- **Tamaño de Celda**: `160 × 160 px`

| Nombre de Archivo (`public/assets/enemies/`) | Fotogramas | Dimensiones Totales | FPS | Bucle | Descripción de la Animación |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `astaroth_cosmic_idle.png` | 6 | `960 × 160 px` | 8 | Sí | Levitación solemne; la corona del Sol Negro gira lentamente absorbiendo luz hacia su núcleo. |
| `astaroth_meteor_storm.png` | 8 | `1280 × 160 px` | 12 | No | Extiende sus brazos de obsidiana invocando una lluvia de meteoros de ceniza incandescente. |
| `astaroth_black_sun_burst.png` | 8 | `1280 × 160 px` | 14 | No | El núcleo del Sol Negro se contrae y detona en un colapso gravitatorio magenta y negro. |
| `astaroth_core_exposed_stun.png` | 4 | `640 × 160 px` | 8 | Sí | Las placas de obsidiana se abren dejando el corazón del Sol Negro expuesto al filo de *Alba Gris*. |
| `astaroth_purified_collapse.png` | 8 | `1280 × 160 px` | 10 | No | Biseccionado por *Alba Gris*: el Sol Negro se quiebra en haces de luz celeste y dorada. |
| `astaroth_dawn_birth.png` | 6 | `960 × 160 px` | 8 | Sí | El núcleo purificado asciende transformado en el primer sol cálido y dorado del amanecer de Albion. |

---

## ⚔️ 2. Nuevas Animaciones de Héroes y NPCs Canónicos — 11 Hojas de Sprites

Estas hojas cubren las habilidades desbloqueables de los Actos I–V (*Frasco de Fuego Sagrado `[T]`*, *Eco del Aquelarre `[U]`*, *Espada Biseccionada Alba Gris*, y los NPCs del Gran Puente):

| Nombre de Archivo (`public/assets/characters/`) | Celda | Fotogramas | Dimensiones Totales | FPS | Bucle | Descripción de la Animación |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `thomas_throw_flask.png` | `64 × 64` | 6 | `384 × 64 px` | 14 | No | Thomas arroja en parábola un Frasco de Fuego Sagrado (`#ff7722`) con la mano izquierda. |
| `thomas_finisher.png` | `64 × 64` | 8 | `512 × 64 px` | 14 | No | Remate ejecutor `[E]`: estocada profunda a dos manos con destello de cruz dorada. |
| `thomas_alba_gris_idle.png` | `64 × 64` | 6 | `384 × 64 px` | 8 | Sí | Thomas en guardia empuñando *Alba Gris* (mitad luz celeste `#88eeff`, mitad sombra violeta `#9933ff`). |
| `thomas_alba_gris_slash.png` | `64 × 64` | 8 | `512 × 64 px` | 16 | No | Tajo biseccionado con *Alba Gris* que deja una doble estela de amanecer dorado y penumbra. |
| `khaterine_echo_vortex.png` | `96 × 96` | 8 | `768 × 96 px` | 16 | No | Habilidad `[U]` *Eco del Aquelarre*: giro acrobático con las dagas gemelas *Colmillo del Sauce Negro* creando un vórtice púrpura de `360°`. |
| `khaterine_shoot_fire.png` | `64 × 64` | 6 | `384 × 64 px` | 14 | No | Disparo de *Flecha de Fuego Fatuo* (`[2]`) con llamarada naranja en la punta del arco. |
| `khaterine_shoot_silver.png` | `64 × 64` | 6 | `384 × 64 px` | 14 | No | Disparo de *Flecha de Plata Consagrada* (`[3]`) con destello cian perfora-escudos. |
| `npc_martin_prisoner.png` | `48 × 48` | 4 | `192 × 48 px` | 6 | Sí | Martín el herrero de Oakhaven (encadenado y luego liberado en el Gran Puente, Acto III). |
| `npc_tobias_acolyte.png` | `48 × 48` | 4 | `192 × 48 px` | 6 | Sí | El joven monaguillo Tobías junto a la carreta de refugiados en el Gran Puente (Acto III). |
| `sun_paladin_patrol.png` | `64 × 64` | 6 | `384 × 64 px` | 10 | Sí | Soldado de la Guardia Solar de Londinium (Actos III y IV) patrullando con alabarda dorada. |
| `sun_paladin_slash.png` | `64 × 64` | 6 | `384 × 64 px` | 14 | No | Estocada de alabarda solar de la Guardia de Londinium. |

---

## 🖼️ 3. Retratos Cuadrados Faltantes para HUD y Diálogos (`256 × 256 px`) — 6 Archivos

En `public/assets/characters/` ya tenemos `portrait_thomas.png`, `portrait_khaterine.png`, `portrait_shalem.png`, `portrait_elowen.png`, `portrait_cedric.png`, `portrait_morwenna.png`, `portrait_malphas.png` y `portrait_astaroth.png`. Faltan estos **6 retratos** en el mismo estilo pixel-art gótico enmarcado (`256 × 256 px`):

| Nombre de Archivo (`public/assets/characters/`) | Personaje / Interlocutor | Paleta Dominante | Descripción del Retrato |
| :--- | :--- | :--- | :--- |
| `portrait_morwenna_phase2.png` | Madre Morwenna (Fase 2 Desatada) | `#ff3300`, `#ffd700`, `#1a0808` | Rostro sin capucha con corona de espinas ardiente, ojos de plasma blanco y alas de ceniza detrás. |
| `portrait_inquisitor.png` | El Inquisidor Caído de San Jude | `#14141c`, `#9b59b6`, `#ff1144` | Sombrero inquisitorial negro de ala ancha sobre máscara/cráneo de hierro con ojos rojos. |
| `portrait_root_prowler.png` | Acechador de Raíces | `#1f140e`, `#bb44ff`, `#243428` | Fauces de madera retorcida del Sauce Negro con ojos y venas de savia violeta brillante. |
| `portrait_crucible_guardian.png` | El Guardián del Crisol | `#221a18`, `#8b6508`, `#ff5511` | Yelmo pesado de fundición de bronce remachado con ranura ocular escupiendo fuego de fragua. |
| `portrait_captain_vane.png` | Capitán Áureo Vane | `#d4af37`, `#f5f5ff`, `#ffea77` | Gran yelmo dorado con cresta solar y visera severa flanqueado por el borde de su escudo de torre. |
| `portrait_martin_tobias.png` | Martín y Tobías (Refugiados) | `#62442c`, `#c5b4db`, `#ffd7aa` | El veterano herrero Martín protegiendo al joven Tobías entre las rejas del convoy. |

---

## 🏛️ 4. Props Animados e Interactivos de los Actos I al V — 12 Hojas de Sprites

En `public/assets/props/` ya contamos con los 11 props de Oakhaven y el Cementerio (`prop_sanctuary_cross`, `prop_sanctuary_altar`, `prop_street_lamp`, `prop_barrel`, `prop_parish_crate`, `prop_great_pyre`, `prop_cemetery_gate`, `prop_soul_brazier`, `prop_celtic_gravestone`, `prop_monumental_sarcophagus`, `prop_mausoleum_facade`). Para vestir los escenarios de las **Criptas, Bosque del Sauce Negro, Campanario, Gran Puente, Londinium y Catedral Invertida** tanto en 2D como en 3D:

| Nombre de Archivo (`public/assets/props/`) | Celda | Fotogramas | Dimensiones Totales | FPS | Descripción Visual |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `prop_elowen_cauldron.png` | `64 × 64` | 6 | `384 × 64 px` | 8 | Caldero de bronce de la Botica de Elowen sobre brasas con elixir verde esmeralda (`#2ecc71`) burbujeando y vapor. |
| `prop_spike_trap.png` | `64 × 32` | 4 | `256 × 32 px` | 12 | Losa de bronce de las Criptas: frame 1 inactiva, frame 2 aviso, frames 3–4 estacas de acero ensangrentadas desplegadas. |
| `prop_sister_altar.png` | `96 × 96` | 6 | `576 × 96 px` | 8 | Altar circular de las Nueve Hermanas con 9 menhires, círculo rúnico púrpura y las dagas *Colmillo del Sauce* flotando. |
| `prop_great_black_willow.png` | `160 × 192` | 4 | `640 × 192 px` | 6 | El Gran Sauce Negro monumental con raíces arqueadas y follaje llorón violeta mecido por el viento con esporas. |
| `prop_salt_cage_elowen.png` | `80 × 96` | 4 | `320 × 96 px` | 6 | Celda octogonal de barrotes de hierro con lecho de sal blanca y el *Pájaro de Madera de Sauce* brillando dentro. |
| `prop_bronze_bell.png` | `96 × 96` | 6 | `576 × 96 px` | 8 | Campana gigante de bronce del Santo Oficio oscilando con ondas acústicas doradas. |
| `prop_crucible_furnace.png` | `128 × 128` | 6 | `768 × 128 px` | 8 | Gran Horno del Crisol en la cima del Campanario con río de escoria incandescente en ebullición. |
| `prop_prisoner_wagon.png` | `128 × 80` | 4 | `512 × 80 px` | 6 | Carreta inquisitorial de madera y barrotes en el Gran Puente con farol oscilante. |
| `prop_heretic_cross_brazier.png` | `64 × 96` | 4 | `256 × 96 px` | 8 | Cruz de madera del Camino de los Herejes con brasero de hierro encendido a sus pies. |
| `prop_illusion_mirror.png` | `64 × 112` | 6 | `384 × 112 px` | 8 | Espejo Maestro de marco dorado del Salón de los Espejos (Acto IV): reflejo astral ondulante y estado quebrado. |
| `prop_astral_throne.png` | `128 × 128` | 6 | `768 × 128 px` | 8 | Trono Astral de mármol blanco, oro y terciopelo carmesí de Rex Malphas con portal hacia la Catedral Invertida. |
| `prop_communion_altar_dawn.png` | `96 × 96` | 6 | `576 × 96 px` | 8 | Altar de la Comunión (Acto V) con la *Gota de Luz* suspendida sobre el yunque espiritual donde se forja *Alba Gris*. |

---

## 💎 5. Iconos Faltantes de Reliquias Canónicas, Municiones y Materiales (`32 × 32 px`) — 14 Archivos

Para que cada reliquia de los 20 capítulos, cada tipo de flecha/frasco y cada ingrediente alquímico tenga su propio icono `32 × 32 px` en `public/assets/icons/`:

| Nombre de Archivo (`public/assets/icons/`) | Categoría | Nombre en el Juego | Descripción del Icono (`32 × 32 px`) |
| :--- | :---: | :--- | :--- |
| `icon_inquisition_seal.png` | Reliquia (Cap. V) | *Sello de la Inquisición Caída* | Medallón de hierro negro y oro con sello lacrado violeta quebrado. |
| `icon_willow_fang_daggers.png` | Reliquia (Cap. VI) | *Colmillo del Sauce Negro* | Par de dagas curvas de obsidiana cruzadas con runas violetas (`[U]`). |
| `icon_carved_willow_bird.png` | Reliquia (Cap. VII) | *Pájaro de Madera de Sauce* | Pequeña ave tallada en madera cálida con destello argénteo de Elowen. |
| `icon_oakhaven_lament.png` | Reliquia (Cap. IX) | *Lamento de Oakhaven* | Badajo de campana de bronce fundido envuelto en una lágrima de ceniza. |
| `icon_false_verdict.png` | Reliquia (Cap. XIII) | *Falso Veredicto* | Fragmento de escudo solar dorado partido por una grieta oscura. |
| `icon_shattered_crown.png` | Reliquia (Cap. XVII) | *Espejismo de Oro y Humo* | Corona real de cinco puntas partida por la mitad con volutas de humo astral. |
| `icon_dawn_grey_sword.png` | Arma Final (Cap. XVIII) | *Alba Gris (Espada Biseccionada)* | Hoja vertical dividida exactamente en luz celeste/dorada y sombra abisal. |
| `icon_first_dawn_albion.png` | Reliquia (Cap. XX) | *El Primer Amanecer de Albion* | Sol naciente cálido emergiendo sobre un eclipse quebrado. |
| `icon_arrow_abyssal.png` | Munición `[1]` | *Flecha Abisal (∞)* | Punta de flecha de plasma violeta oscuro con plumas de sombra. |
| `icon_arrow_fire.png` | Munición `[2]` | *Flecha de Fuego Fatuo* | Flecha envuelta en llamas naranjas y brasas vivas. |
| `icon_arrow_silver.png` | Munición `[3]` | *Flecha de Plata Consagrada* | Punta de plata reluciente con halo cian anti-escudos. |
| `icon_holy_fire_flask.png` | Arrojadizo `[T]` | *Frasco de Fuego Sagrado* | Redoma esférica de vidrio con mecha encendida y líquido ígneo dorado. |
| `icon_herb_silverleaf.png` | Material Alquímico | *Hoja de Plata* | Rama botánica con tres hojas plateadas luminiscentes. |
| `icon_essence_willow_blood.png` | Material Alquímico | *Esencia de Fuego Fatuo / Savia* | Gota cristalizada de ámbar rojizo y violeta. |

---

## ✨ 6. Efectos Visuales (VFX) Adicionales para los Actos II–V — 6 Hojas de Sprites

En `public/assets/vfx/` ya tenemos 11 hojas (`fx_slash_gold`, `fx_slash_abyss`, `fx_parry_spark`, `fx_arrow_abyssal`, `fx_pyre_explosion`, `fx_flame_geyser_ground`, `fx_flame_pillar`, `fx_bone_shatter`, `vfx_blood_hit`, `vfx_fire_burst`, `vfx_holy_heal`). Faltan estos **6 VFX** para las habilidades avanzadas:

| Nombre de Archivo (`public/assets/vfx/`) | Celda | Fotogramas | Dimensiones Totales | FPS | Descripción del Efecto |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `fx_dagger_vortex_echo.png` | `128 × 128` | 8 | `1024 × 128 px` | 18 | Anillo ciclónico de dagas espectrales violetas y plumas negras para el *Eco del Aquelarre* `[U]`. |
| `fx_arrow_fire_trail.png` | `48 × 16` | 4 | `192 × 16 px` | 16 | Proyectil horizontal de *Flecha de Fuego Fatuo* dejando chispas naranjas. |
| `fx_arrow_silver_trail.png` | `48 × 16` | 4 | `192 × 16 px` | 16 | Proyectil horizontal de *Flecha de Plata Consagrada* con estela cian/blanca. |
| `fx_holy_flask_explosion.png` | `96 × 96` | 8 | `768 × 96 px` | 16 | Estallido de cristal y onda expansiva de fuego sagrado al impactar el frasco `[T]`. |
| `fx_astral_time_warp.png` | `128 × 128` | 8 | `1024 × 128 px` | 16 | Reloj astral / anillo de distorsión violeta y dorado de la *Ley del Deseo* (Rex Malphas). |
| `fx_alba_gris_bisect.png` | `128 × 128` | 8 | `1024 × 128 px` | 18 | Gran arco de corte dual (mitad luz celeste/dorada, mitad penumbra violeta) de la espada *Alba Gris*. |

---

## 🌄 7. Fondos Panorámicos por Zona (`1280 × 720 px`) — 5 Archivos

Para que cada una de las 7 zonas canónicas tenga su propia ilustración panorámica de fondo en el Modo 2D, en las pantallas de transición de capítulo y en los murales de horizonte del Modo 3D (`public/assets/loading/`):

| Nombre de Archivo (`public/assets/loading/`) | Zona / Acto | Paleta Principal | Composición Visual (`1280 × 720 px`, Pixel-Art Gótico Detallado) |
| :--- | :--- | :--- | :--- |
| `vista_crypts_san_jude.png` | Acto I — Criptas de San Jude | `#14121a`, `#00e5ff`, `#ff7722` | Bóveda subterránea de arcos góticos, sarcófagos de piedra, pebeteros de fuego cian y el altar del Inquisidor al fondo. |
| `vista_black_willow_forest.png` | Acto I/II — Bosque del Sauce Negro | `#160820`, `#bb44ff`, `#243428` | Sendero de raíces gigantescas bajo la lluvia de esporas violetas, con el colosal Sauce Negro y los 9 menhires al fondo. |
| `vista_southern_belltower.png` | Acto II — Campanario del Sur | `#221e28`, `#ff5511`, `#8b6508` | Interior/cumbre de la torre de madera y piedra con la gigantesca campana de bronce, la celda de sal y el horno del crisol. |
| `vista_great_stone_bridge.png` | Acto III — Gran Puente de Piedra | `#282338`, `#ffd700`, `#446688` | Viaducto monumental sobre el río Támesis envuelto en bruma, flanqueado por cruces con braseros y las murallas de Londinium al horizonte. |
| `vista_inverted_cathedral.png` | Acto V — La Catedral Invertida | `#08030d`, `#ff2288`, `#88eeff` | Nave catedralicia colosal flotando boca abajo en el vacío abisal, con las agujas apuntando hacia el Sol Negro eclipsado en el centro. |

---

## 🧊 8. Láminas de Referencia 3D Turnaround (`1536 × 1024 px`) y/o Modelos `.glb` — 8 Láminas

Si deseas completar la galería **`🎨 [V] DISEÑOS 3D`** (que actualmente tiene las 22 láminas del Acto I) para llegar a **30 láminas turnaround** y/o modelar sus mallas `.glb`:

1. `public/assets/concepts/concept_inquisitor.png` — *El Inquisidor Caído de San Jude (Turnaround 3D, Maza de Púas y Escudo Oscuro)*
2. `public/assets/concepts/concept_root_prowler.png` — *Acechador de Raíces del Sauce Negro (Turnaround Cuadrúpedo y Espinas Bioluminiscentes)*
3. `public/assets/concepts/concept_crucible_guardian.png` — *El Guardián del Crisol de Bronce (Turnaround Coloso y Martillo de Fundición)*
4. `public/assets/concepts/concept_captain_vane.png` — *Capitán Áureo Vane (Turnaround Paladín Solar y Escudo de Torre)*
5. `public/assets/concepts/concept_rex_malphas.png` — *Rex Malphas / Rey Alaric (Turnaround Monarca Astral, Corona y Mandoble)*
6. `public/assets/concepts/concept_astaroth_titan.png` — *Astaroth: Padre de las Cenizas (Turnaround Titán y Núcleo del Sol Negro)*
7. `public/assets/concepts/concept_alba_gris_sword.png` — *Espada Alba Gris Biseccionada & Frasco de Fuego Sagrado (Hoja de Armas)*
8. `public/assets/concepts/concept_inverted_cathedral_altar.png` — *Altar de la Comunión, Trono Astral y Espejo Maestro (Props de Actos IV y V)*
