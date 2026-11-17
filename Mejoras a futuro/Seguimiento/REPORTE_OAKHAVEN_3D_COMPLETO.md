# 🏰 Oakhaven 3D — Reporte Técnico Completo de la Experiencia 3D

Este documento detalla la arquitectura, mecánicas, controles y sistemas implementados en el módulo Three.js de **The Light in the Darkness** (`src/presentation/three/Oakhaven3DExperience.ts`).

---

## 🎮 Controles y Esquema de Entrada

| Tecla / Control | Acción | Personaje / Contexto |
| :--- | :--- | :--- |
| **W, A, S, D / Flechas** | Movimiento en el plano 3D (X/Z) | Ambos personajes |
| **TAB / Botón HUD** | Alternar entre Thomas y Khaterine | Conmutación instantánea |
| **J** | Tajo Ligero (Thomas) / Flecha Rápida (Khaterine) | Ataque básico (26-28 DMG) |
| **K** | Tajo Fuerte (Thomas) / Flecha Perforante (Khaterine) | Ataque pesado / Aturdimiento (42-48 DMG) |
| **L** | Guardia / Parry (Thomas) / Barrera Abisal (Khaterine) | Defensa y desvío de impactos |
| **ESPACIO** | Esquiva con impulso y recuperación rápida | Ambos personajes |
| **T** | Arrojar Espada al mundo (pelea desarmada) | Exclusivo de Thomas |
| **E / Clic** | Interactuar / Hablar / Recoger Arma / Rematar | Contextual por proximidad |
| **C / Botón HUD** | Alternar Cámara (Isométrica 3/4 ↔ Tercera Persona) | Vista dinámica |
| **M / Botón HUD** | Conmutar Audio Mudo / Activo | BGM de órgano y campanas |

---

## ⚔️ Sistema de Héroes Duales

### 1. Thomas el Acólito de la Orden de San Jude
- **Rol**: Guerrero melé con balance defensivo y sellos de ceniza.
- **Estadísticas**: 100 Salud / 50 Postura.
- **Mecánica Única: Desarme & Pelea a Puños**:
  - Al pulsar `[T]`, arroja la espada hacia adelante.
  - La espada se clava en el pavimento con un haz de luz dorada y permanece en el mundo físico.
  - Thomas entra en estado desarmado: su velocidad aumenta y pelea a puñetazos con guanteletes de plasma rúnico.
  - Al aproximarse a la espada y presionar `[E]`, la recupera al instante.

### 2. Khaterine la Cazadora del Sauce Negro
- **Rol**: Hostigadora a distancia y guardiana mística.
- **Estadísticas**: 90 Salud / 70 Postura (mayor margen para esquivas y absorción de impacto).
- **Mecánica Única: Arco Abisal & Proyectiles Balísticos**:
  - Dispara flechas de plasma abisal con física de vuelo (18-22 m/s).
  - La flecha genera un cono de luz dinámica en su trayectoria y atraviesa la niebla.
  - Al impactar enemigos, jefa o barriles, desencadena stagger o destrucción.
- **Mecánica Única: Barrera Abisal**:
  - Al mantener pulsado `[L]`, despliega una esfera traslúcida de energía abisal con rotación multi-axial que dispersa proyectiles y llamaradas.

### 3. Dinámica de Compañero como NPC
- Cuando se controla a un personaje, el otro permanece en el santuario de la aldea como NPC.
- **Khaterine hablando con Thomas NPC**: Thomas ofrece apoyo espiritual y bendición de postura.
- **Thomas hablando con Khaterine NPC**: Khaterine comparte consejos sobre el Sauce Negro y bonificación de agilidad.

---

## 💥 Entorno Interactivo y Destructible

Se han colocado 7 elementos interactivos a lo largo de la vía de Oakhaven:
1. `barrel-1`: **Barril de Especias** (junto a Elowen).
2. `crate-1`: **Caja de Suministros** (esquina izquierda).
3. `barrel-2`: **Barril de Agua Bendita** (cerca del pozo).
4. `barrel-3`: **Barril de Papiro Antiguo** (frente a la posada).
5. `crate-2`: **Caja Parroquial** (almacén derecho).
6. `barrel-4`: **Barril de Aceite de Lámpara** (camino a la Gran Pira).
7. `crate-3`: **Cofre de la Vigilia** (plaza de la Pira).

**Física de Destrucción (`createDebrisExplosion`)**:
- Al recibir un tajo de espada o un impacto de flecha, la malla original se retira y se generan 7 fragmentos cúbicos de madera.
- Cada fragmento tiene impulso aleatorio hacia arriba y afuera (`velocity`), gravedad (`-13 m/s²`), rotación tridimensional y rebote en el suelo empedrado con amortiguación.
- Se reproduce el efecto de sonido procedural de madera y se otorga **`+15 EXP`** con número flotante dorado.

---

## 👑 Jefa 3D: Madre Morwenna en la Gran Pira

- **Ubicación**: Fin de la calle (Z = -18), frente a la monumental pira en llamas.
- **Comportamiento**:
  - Permanece latente hasta que el jugador cruza la barrera de aproximación (Z <= -8).
  - Al despertar, emite una advertencia sonora, su barra de salud se despliega y comienza a levitar.
  - **Fase de Persecución**: Flota hacia el héroe manteniendo la distancia de combate.
  - **Fase de Carga (Wind-up)**: Gira su Crisol de Fuego Sagrado, emite destellos carmesí y despliega un octaedro de peligro sobre su cabeza durante 650 ms.
  - **Fase de Ataque**: Llama de fuego sagrado (28 DMG). Si el jugador hace parry con `[L]` en el momento exacto, la aturde durante 2.4 segundos.
  - **Remate Cinemático**: Durante el aturdimiento, el jugador puede pulsar `[E]` para ejecutar un golpe crítico de 90 DMG con destello de luz sacra.
  - **Purificación**: Al llegar a 0 HP, la llama abisal se extingue y Morwenna queda redimida en paz.
