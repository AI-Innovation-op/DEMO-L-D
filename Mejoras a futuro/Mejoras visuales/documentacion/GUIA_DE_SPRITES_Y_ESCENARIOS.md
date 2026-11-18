# Guía Maestra de Sprites y Escenarios Canónicos — The Light in the Darkness

> ⚠️ **PROPIEDAD INTELECTUAL Y DERECHOS DE AUTOR**
> Todo el universo, diseño de personajes, escenarios y mitología pertenecen exclusivamente a **Kevin © 2026**.

Esta guía técnica detalla la lista completa de sprites, retratos y fondos que puedes dibujar y adjuntar para cada uno de los **5 Actos (20 Capítulos)** de tu obra literaria.

---

## 🛠️ Especificaciones Técnicas Globales

1. **Formato**: Archivo `.png` con **fondo transparente** (canal alfa RGBA).
2. **Resolución del Lienzo del Juego**: 640 × 360 píxeles (formato 16:9).
3. **Punto de Apoyo (`origin: (0.5, 1.0)`)**:
   - Los pies de los personajes deben apoyarse exactamente en el borde inferior del dibujo para que coincidan con la profundidad 2.5D del suelo y la proyección de sombras elípticas.
4. **Carga Automática**:
   - Al colocar cualquier archivo en `public/assets/characters/` con el nombre exacto indicado, el motor Phaser lo carga de inmediato sustituyendo el gráfico procedural de reserva.

---

## 🎭 1. Protagonistas y Aliados

| Nombre de Archivo | Dimensiones Recomendadas | Descripción Canónica | Poses Clave |
|---|---|---|---|
| `thomas_idle.png` | 48×60 px (o 64×64) | Thomas en reposo con túnica de monaguillo rasgada, marcas de ceniza en el pecho y espada corta. | Idle / Respiración |
| `thomas_attack.png` | 64×64 px (o 80×64) | Tajo frontal de Thomas despidiendo fuego negro abismal en el filo. | Ataque / Tajo |
| `thomas_disarmed.png` | 48×60 px | Thomas en guardia a puños, con las manos envueltas en humo oscuro tras lanzar su espada. | Guardia desarmada |
| `portrait_thomas.png` | 64×64 px | Primer plano de Thomas con mirada decidida y cabello castaño alborotado para diálogos y menús. | Rostro / Diálogo |
| `khaterine_idle.png` | 48×60 px | Khaterine con hábito monacal oscuro, velo ceremonial y cruz violeta luminosa. | Idle / Serena |
| `khaterine_attack.png` | 64×64 px | Khaterine canalizando un arco rúnico abismal con proyectiles violetas. | Magia / Disparo |
| `portrait_khaterine.png` | 64×64 px | Primer plano de Khaterine con su velo y runas arcanas en la mejilla. | Rostro / Diálogo |
| `shalem_cat.png` | 36×28 px (o 48×36) | Shalem: gato negro azabache de pelo esponjoso, cola sinuosa y ojos dorados con destellos de brasa. | Idle / Mirada perezosa |
| `portrait_shalem.png` | 64×64 px | Retrato de Shalem con expresión cínica y sarcástica de Gran Marqués. | Rostro / Diálogo |

---

## 🌲 2. Acto I: Oakhaven — La Aldea de la Herejía (Caps. I – VI)

*Escenario de apertura: Niebla nocturna, bosque de sauces, faroles de aceite y la gran pira central.*

| Nombre de Archivo | Dimensiones | Descripción Canónica |
|---|---|---|
| `bg_oakhaven.png` | 640×360 px | Cabañas de madera oscura con techos de paja húmeda, la pira ardiente al fondo y bosque de sauces. |
| `elowen_npc.png` | 48×60 px | Elowen de niña/joven: vestido campesino azul celeste, delantal blanco de lino y trenza dorada. |
| `padre_cedric.png` | 48×60 px | Sacerdote anciano con túnica marrón remendada, barba blanca y antorcha encendida. |
| `portrait_cedric.png` | 64×64 px | Retrato compasivo del Padre Cedric para su diálogo de bienvenida y entrega del Rosario. |
| `ash_prowler.png` | 64×44 px (o 75×48) | Sabueso de Ceniza: bestia cuadrúpeda canina nacida de las brasas con ojos incandescentes. |
| `fanatic_monk.png` | 48×60 px | Monje Fanático de la Inquisición con capucha negra y antorcha de azufre. |
| `boss_morwenna.png` | 64×80 px (o 72×86) | **Madre Morwenna**: Inquisidora implacable con túnica escarlata, aureola de hierro y cetro piroclástico. |
| `portrait_morwenna.png` | 64×64 px | Retrato de Morwenna con mirada inquisitorial fanática para diálogos. |

---

## 🔔 3. Acto II: El Campanario y el Granero del Sur (Caps. VII – IX)

*Escenario cerrado: Muros de mampostería húmeda, barrotes de hierro forjado, campana monumental y brasas del crisol.*

| Nombre de Archivo | Dimensiones | Descripción Canónica |
|---|---|---|
| `bg_belltower.png` | 640×360 px | Interior gótico del campanario: vigas de roble, la gran campana de bronce y ventanal enrejado con luna. |
| `inquisitor_torre.png` | 48×60 px | Inquisidor de Torre con maza de hierro pesado y saco de sal gruesa a la cintura. |
| `boss_guardian_crisol.png` | 64×80 px (o 72×86) | **Guardián del Crisol**: Verdugo colosal con mandil de cuero quemado y martillo de forja de bronce. |
| `lamento_oakhaven.png` | 32×32 px | Incensario litúrgico de cadenas de plata desprendiendo humo azulado (reliquia recogible). |

---

## 🌉 4. Acto III: El Gran Puente de Piedra — Camino de los Herejes (Caps. X – XIII)

*Escenario abierto: Monumental puente romano/gótico sobre desfiladero profundo, farolas de aceite y lluvia fina.*

| Nombre de Archivo | Dimensiones | Descripción Canónica |
|---|---|---|
| `bg_bridge.png` | 640×360 px | Puente de piedra colosal con parapetos góticos, farolas de aceite y fondo de nubes violetas tormentosas. |
| `golden_guard.png` | 48×64 px | Guardia Áureo imperial de Londinium con armadura dorada pulida y alabarda. |
| `shield_knight.png` | 52×64 px | Caballero de Vanguardia portando un escudo de torre rectangular con el Cáliz Solar grabado. |
| `boss_capitan_aureo.png` | 68×84 px (o 76×88) | **Capitán Áureo Vane**: Comandante militar con coraza de oro labrado, capa carmesí y mandoble inquisitorial. |
| `portrait_vane.png` | 64×64 px | Retrato del Capitán Vane con casco descubierto y cicatriz de batalla. |

---

## 👑 5. Acto IV: Londinium — La Ciudadela Dorada (Caps. XIV – XVII)

*Escenario palaciego: Arcos triunfales de mármol negro y oro, vitrales de la falsa luz y el Salón del Trono Solar.*

| Nombre de Archivo | Dimensiones | Descripción Canónica |
|---|---|---|
| `bg_londinium.png` | 640×360 px | Palacio imperial de Londinium con columnas de mármol estriadas de oro y estandartes solares. |
| `boss_malphas.png` | 72×90 px (o 76×88) | **Rex Malphas (Alaric)**: Brujo supremo y soberano falso; corona astral, armadura de oro negro y capa ceremonial. |
| `portrait_malphas.png` | 64×64 px | Retrato de Alaric revelando sus ojos de brujo traidor y rostro aristocrático envejecido. |

---

## 🌌 6. Acto V: La Catedral Invertida — El Sol del Abismo (Caps. XVIII – XX)

*Escenario cósmico: Catedral gótica flotando boca abajo en el vacío del Abismo, estrellas púrpuras y el Sol Negro.*

| Nombre de Archivo | Dimensiones | Descripción Canónica |
|---|---|---|
| `bg_cathedral.png` | 640×360 px | Catedral Invertida: pináculos y arbotantes colgando hacia un abismo de nebulosa púrpura con el orbe solar negro. |
| `abyssal_shadow.png` | 48×60 px | Sombra Abisal: silueta etérea de humo negro con ojos rasgados violetas flotando sobre el suelo. |
| `boss_astaroth.png` | 96×110 px | **Astaroth (El Padre de las Cenizas)**: Titán primordial con cuernos de obsidiana, alas de humo y corona de fuego negro. |
| `portrait_astaroth.png` | 64×64 px | Retrato aterrador de Astaroth con mirada abisal milenaria para el clímax final. |

---

## 💡 Consejos de Paleta y Estilo

1. **Paleta Gótica**:
   - Luces: `#ffd700` (Oro solar sagrado), `#e6c8ff` (Brillo plateado de Elowen).
   - Sombras y Magia: `#7b1fa2` (Violeta abisal de Khaterine), `#11081a` (Negro ceniza de Thomas), `#c62828` (Fuego inquisitorial de Morwenna).
2. **Escalado Seguro Automático**:
   - El motor ahora cuenta con **Normalización Proporcional Automática** (`normalizeSprite`), por lo que si dibujas una ilustración en alta resolución, el juego la ajustará perfectamente a su caja de combate sin salirse de la pantalla.
