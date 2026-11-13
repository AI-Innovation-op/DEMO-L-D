# Guía de Sprites para "The Light in the Darkness"

¡Hola! Esta carpeta está preparada para que puedas colocar tus propios sprites en formato **PNG con fondo transparente**.
El motor del juego está configurado para que al colocar un archivo con el nombre indicado, se cargue automáticamente reemplazando el sprite procedural.

---

## 1. Personajes Principales

| Archivo | Dimensiones recomendadas | Descripción |
|---|---|---|
| `thomas_idle.png` | 48x60 px (o 64x64 px) | Thomas en reposo con túnica rasgada y espada corta. |
| `thomas_attack.png` | 64x64 px | Thomas en pose de tajo / ataque con espada. |
| `thomas_disarmed.png` | 48x60 px | Thomas en guardia a puños (estado desarmado). |
| `portrait_thomas.png` | 32x32 px (o 64x64 px) | Retrato de primer plano de Thomas para diálogos. |
| `khaterine_idle.png` | 48x60 px (o 64x64 px) | Khaterine con hábito monacal oscuro y cruz dorada. |
| `khaterine_attack.png` | 64x64 px | Khaterine canalizando magia sagrada/violeta. |
| `portrait_khaterine.png` | 32x32 px (o 64x64 px) | Retrato de primer plano de Khaterine con velo. |
| `shalem_cat.png` | 36x28 px (o 48x36 px) | El gato Shalem: negro, esponjoso y ojos dorados. |
| `portrait_shalem.png` | 32x32 px (o 64x64 px) | Retrato del gato Shalem con expresión sarcástica. |

---

## 2. NPCs (Aldea de Oakhaven)

| Archivo | Dimensiones recomendadas | Descripción |
|---|---|---|
| `elowen_npc.png` | 48x60 px | Elowen con vestido azul celeste, delantal blanco y trenzas doradas. |
| `portrait_elowen.png` | 32x32 px | Retrato de Elowen con expresión serena para los diálogos. |

---

## 3. Enemigos y Jefes

| Archivo | Dimensiones recomendadas | Descripción |
|---|---|---|
| `ash_prowler.png` | 64x44 px | Acechador de Ceniza (bestia cuadrúpeda con brasas). |
| `fanatic_monk.png` | 48x60 px | Monje Fanático de la inquisición con báculo o incensario. |
| `golden_guard.png` | 48x64 px | Guardia Áureo con armadura y alabarda de Londinium. |
| `boss_morwenna.png` | 64x80 px | Madre Morwenna con túnica ceremonial carmesí y aureola. |
| `boss_malphas.png` | 72x90 px | Rex Malphas (Alaric) con armadura dorada y capa imperial. |

---

## Recomendaciones de Diseño Pixel Art:
1. **Formato:** Archivos `.png` estándar con **fondo transparente** (canal alfa).
2. **Punto de anclaje (Origin):** En el código los personajes se anclan en la base de sus pies: `setOrigin(0.5, 1)`. Conviene que los pies toquen el borde inferior de la imagen.
3. **Escala:** El lienzo nativo del juego corre a 640x360 con escala nítida entera (pixel perfect). Los tamaños entre 48 y 64 px lucen espectaculares y conservan la proporción con los edificios y fondos.
