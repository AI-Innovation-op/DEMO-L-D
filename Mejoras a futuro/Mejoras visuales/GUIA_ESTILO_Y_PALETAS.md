# 🎨 Guía de Estilo, Paletas Cromáticas & Dirección de Arte

Esta guía define la identidad visual de **The Light in the Darkness**, unificando la estética tanto de los sprites 2D como de los modelos y shaders 3D en torno al universo literario gótico victoriano creado por Kevin en su novela.

---

## 🎭 Atmósfera & Tono Visual

La atmósfera de Oakhaven y el mundo del juego se basa en el **contraste entre la devoción decadente y la oscuridad abisal**:
- **La Niebla Asfixiante**: El mundo está sumergido en una penumbra húmeda y fría donde las farolas de aceite y las velas votivas son islas de salvación.
- **La Belleza en la Decadencia**: Casonas victorianas de piedra y madera envejecida, cruces con musgo, hojas marchitas de sauce y herrajes oxidados.
- **La Doble Naturaleza de la Luz**:
  - *La Llama Sagrada (Morwenna/Inquisición)*: Luz abrasadora, opresiva, carmesí y cobriza que castiga.
  - *La Luz Argéntea (Elowen)*: Luz suave, compasiva, azulada y blanca como el reflejo lunar en aguas calmas.
  - *El Plasma del Sauce (Khaterine)*: Energía nocturna, púrpura y amatista, que protege desde las sombras sin someter.

---

## 🎨 Paleta Cromática Canónica (Códigos HEX & Roles)

```
[#06040b] Fondo / Abismo Nocturno       [#141219] Adoquines de Oakhaven
[#ffd700] Oro Sagrado / Parry           [#73299e] Runa de Ceniza / Khaterine
[#ff3344] Fuego de Madre Morwenna       [#b5d4ff] Luz Lunar de Elowen
[#d9b38c] Piel / Fragilidad Humana      [#3d2716] Madera / Cruces y Barriles
```

### 1. Tonos de Entorno & Sombras
| Nombre del Tono | Código HEX | RGB | Uso Principal |
| :--- | :---: | :---: | :--- |
| **Abismo Profundo** | `#06040b` | (6, 4, 11) | Fondo del cielo nocturno, niebla lejana, vacío. |
| **Ceniza Nocturna** | `#141219` | (20, 18, 25) | Pavimento empedrado, fachadas de piedra oscura. |
| **Pizarra Húmeda** | `#272233` | (39, 34, 51) | Líneas de división de baldosas, tejas de pizarra. |
| **Madera Añeja** | `#3d2716` | (61, 39, 22) | Barriles, vigas de las casonas, cruces parroquiales. |

### 2. Tonos Sagrados & Fe Inquisitorial
| Nombre del Tono | Código HEX | RGB | Uso Principal |
| :--- | :---: | :---: | :--- |
| **Oro de San Jude** | `#ffd700` | (255, 215, 0) | Destellos de parry exitoso, EXP, santuarios, halo de fe. |
| **Bronce Inquisitorial** | `#d4af37` | (212, 175, 55) | Marcos de la interfaz, ribetes del manto de Morwenna. |
| **Fuego de la Gran Pira** | `#ff5511` | (255, 85, 17) | Hogueras monumentales, brasas flotantes, advertencias. |
| **Carmesí del Crisol** | `#ff2233` | (255, 34, 51) | Ojos del Sabueso, llamarada inquisitorial de Morwenna. |

### 3. Tonos del Sauce Negro & Energía Abisal
| Nombre del Tono | Código HEX | RGB | Uso Principal |
| :--- | :---: | :---: | :--- |
| **Amatista Abisal** | `#aa44ff` | (170, 68, 255) | Flechas de plasma de Khaterine, sello de ceniza de Thomas. |
| **Velo de Sombra** | `#1a0f26` | (26, 15, 38) | Ropajes de Khaterine, gasa ceremonial, sombras activas. |
| **Luz Rúnica Intensa** | `#e699ff` | (230, 153, 255) | Impacto de flecha pesada, orbe de la barrera protectora. |

### 4. Tonos de Gracia & Pureza
| Nombre del Tono | Código HEX | RGB | Uso Principal |
| :--- | :---: | :---: | :--- |
| **Luz Argéntea** | `#b5d4ff` | (181, 212, 255) | Aura de Elowen, diadema de plata, curación de salud. |
| **Lino Penitente** | `#ede8f5` | (237, 232, 245) | Delantal de Elowen, cordón franciscano del Padre Cedric. |
| **Ámbar de Farol** | `#ffaa33` | (255, 170, 51) | Luz acogedora de farolas victorianas y velas del altar. |

---

## 👁️ Siluetas & Legibilidad en Juego

Tanto en la vista 2D (lateral/cenital) como en 3D (isométrica 3/4), es crucial que cada personaje sea identificable al instante por su silueta exterior (*silhouette readability*):

1. **Thomas**:
   - Silueta recta y ágil.
   - La bufanda añade volumen alrededor del cuello.
   - Hoja de espada plateada que sobresale verticalmente con reflejos claros.
   - Cuando se desarma, adopta postura baja con puños al frente.

2. **Khaterine**:
   - Silueta triangular y fluida en la base por la túnica larga.
   - El velo crea una curva suave que desciende de la cabeza a la espalda.
   - El arco abisal rompe la silueta lateralmente formando una media luna distintiva.

3. **Padre Cedric**:
   - Silueta amplia y pesada con hábito largo hasta el suelo.
   - Línea vertical prominente del báculo que remata en el farol colgante luminoso.

4. **Madre Morwenna**:
   - Silueta alta y piramidal por su tocado ceremonial puntiagudo.
   - El crisol de bronce se extiende en su mano como un foco de calor que rompe su silueta derecha.

---

## 💡 Iluminación y Composición

- **Regla del Foco Cálido en Entorno Frío**: El mundo base siempre es azulado/púrpura oscuro (`0x06040b` a `0x231a38`), y las fuentes de interacción (farolas, velas, santuarios, héroes) son puntos cálidos de oro, ámbar o amatista que invitan al jugador a avanzar.
- **Telegrafiado Visual**: Todo ataque peligroso o letal debe tener una anticipación cromática clara:
  - Fuego / Mordisco: **Rojo rubí** (`#ff2233`).
  - Ventana de Parry / Oportunidad: **Destello dorado** (`#ffd700`).
  - Barrera o Absorción: **Púrpura / Blanco** (`#aa44ff`).
