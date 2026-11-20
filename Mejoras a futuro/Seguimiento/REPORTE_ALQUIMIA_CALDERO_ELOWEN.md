# ⚗️ Reporte Técnico: Sistema de Alquimia y Botica en el Caldero de Elowen

**Fecha:** 20 de Noviembre de 2026  
**Proyecto:** *The Light in the Darkness* (DEMO-L-D)  
**Módulo:** Dominio DDD de Alquimia, Caldero 3D en Oakhaven, Modal de Botica e Integración de Materiales  
**Estado:** COMPLETADO Y VERIFICADO (63/63 Tests Unitarios Pasando • Build TypeScript Exitoso • Navegador Verificado)

---

## 1. Resumen Ejecutivo

Siguiendo la hoja de ruta de la novela canónica de Kevin y el diseño de sistemas de *The Light in the Darkness*, se ha implementado de forma completa el **Sistema de Alquimia y Botica en el Caldero de Elowen**.

Elowen de Oakhaven, la Doncella de la Luz Argéntea y boticaria de la parroquia, ahora cuenta con su propio puesto alquímico en las calles de Oakhaven: un caldero tridimensional interactivo con brasero de carbones ardientes, trípode de hierro, poción esmeralda en ebullición, vapores ascendentes y una mesa de botica rústica con viales alquímicos.

El sistema permite a Thomas y Khaterine recolectar ingredientes botánicos y restos abisales (soltados por sabuesos de ceniza, cultistas del incensario, flagelantes y penitentes de la cripta, así como al destruir barriles y cajas) y transmutarlos en bálsamos curativos, rosarios benditos y óleos consagrados, recompensando cada síntesis con puntos de experiencia (EXP) para el Códice del Alma.

---

## 2. Arquitectura de Dominio DDD (`src/domain/alchemy/`)

Siguiendo el patrón de Arquitectura Limpia y Diseño Guiado por el Dominio (DDD), la lógica de síntesis alquímica es 100% pura y desacoplada del motor de renderizado Three.js:

### `AlchemyRecipe.ts`
- Define la interfaz `IngredientRequirement` y la estructura canónica `AlchemyRecipe`.
- **Materiales Canónicos (`CANONICAL_MATERIALS`)**:
  - `herb_silverleaf`: **Hoja de Plata** (hierba medicinal de flor blanca de los jardines de Oakhaven).
  - `ash_purified`: **Ceniza Purificada** (ceniza residual de incensarios y braseros consagrados).
  - `blood_hound`: **Esencia de Fuego Fatuo** (fuego sombrío y sangre de los sabuesos abisales).
  - `water_blessed`: **Agua Bendita de San Jude** (agua pura de la pila bautismal del Padre Cedric).
  - `salve_base`: **Ungüento Base de Cera** (emulsión emoliente de cera virgen para ligar pócimas).
- **Recetas Canónicas (`CANONICAL_RECIPES`)**:
  - `craft_maiden_balm`: **Bálsamo de la Doncella** (2x Hoja de Plata + 1x Ungüento Base -> +35 HP, +15 EXP).
  - `craft_saint_jude_rosary`: **Rosario de San Jude** (1x Ceniza Purificada + 1x Agua Bendita -> +50 Postura, +20 EXP).
  - `craft_consecrated_oil`: **Óleo Consagrado de San Jude** (2x Ceniza Purificada + 1x Esencia de Fuego Fatuo -> +25% Daño por 20s, +25 EXP).
  - `craft_elixir_sunset`: **Bálsamo del Ocaso Concentrado** (3x Hoja de Plata + 1x Agua Bendita -> +40 HP, +25 EXP).

### `AlchemyPot.ts` (Aggregate Root)
- `canCraft(recipeId, inventory)`: Verifica exhaustivamente la presencia y cantidad exacta de ingredientes requeridos. Devuelve lista de ingredientes faltantes y estado booleano.
- `craft(recipeId, inventory)`: Realiza la transacción atómica: si faltan ingredientes, la operación falla y no se consume nada; si se cumplen los requisitos, deduce exactamente las cantidades necesarias, añade el objeto sintetizado al inventario del acólito y devuelve la ganancia de EXP (`expGained`).

---

## 3. Integración con el Inventario y Compatibilidad de Partidas

1. **Categoría `material`**: Se extendió `ItemCategory` en [InventoryItem.ts](file:///d:/Edged/src/domain/inventory/InventoryItem.ts) para soportar `'material'` y efecto `'none'`.
2. **Método `getMaterials()`**: Se añadió a [Inventory.ts](file:///d:/Edged/src/domain/inventory/Inventory.ts) para consultar rápidamente la bolsa de ingredientes.
3. **Pouch Inicial de Aprendiz**: `Inventory.createDefault()` otorga al jugador al inicio 2x Hoja de Plata, 1x Ungüento Base y 1x Ceniza Purificada para permitir probar la síntesis del Bálsamo de la Doncella de inmediato.
4. **Compatibilidad hacia atrás**: En `loadSavedSanctuaryState()`, si una partida guardada previamente en `localStorage` no contenía materiales, se le inyecta automáticamente el set de iniciación botánica sin perder ningún progreso ni reliquia existente.
5. **Navegación Cruzada de Inventario**: Al abrir el inventario (`[I]`), los ingredientes muestran el botón interactivo `⚗️ IR AL CALDERO [B]`, permitiendo saltar directamente a la botica con un solo clic.

---

## 4. Caldero 3D de Elowen en Three.js

En [Oakhaven3DExperience.ts](file:///d:/Edged/src/presentation/three/Oakhaven3DExperience.ts):

- **Ubicación Canónica**: Emplazado en `(-2.4, 0, -0.7)`, justo al lado del puesto de Elowen (`-3.2, 0, -1.0`).
- **Geometría y Materiales**:
  - **Fuelle y Base**: Hogar circular de adoquín oscuro con carbones ardientes emissivos (`0xff3300`).
  - **Trípode de Hierro Forjado**: 3 patas cilíndricas inclinadas a 120° con material metálico oscuro (`0x1f1f22`).
  - **Cuerpo del Caldero**: Olla de bronce martillado (`0x5a4832`) con reborde tórico y dos asas laterales de hierro.
  - **Líquido Alquímico Esmeralda**: Disco de poción mágica verde (`0x2ecc71`) con reflectividad estándar y brillo interior.
  - **Luz Puntual Pulsante**: Luz puntual verde esmeralda (`0x2ecc71`) cuya intensidad oscila armónicamente en el bucle principal (`1.6 + Math.sin(t * 5) * 0.4`).
  - **Vapores Procedimentales**: 6 esferas semitransparentes de vapor que ascienden continuamente, oscilan con funciones seno/coseno, se expanden y se desvanecen gradualmente.
  - **Mesa de Botica**: Pequeño velador de madera rústica junto al caldero con tres viales alquímicos de vidrio translúcido (verde, azul y rojo).
- **Proximidad Dinámica**:
  - Cuando el jugador se sitúa a menos de 2.6m del caldero, la insignia contextual inferior cambia a:
    `⚗️ [E] CALDERO DE ELOWEN: BOTICA & ALQUIMIA` en color verde esmeralda (`#2ecc71`).
  - Al pulsar `[E]` o hacer clic sobre la insignia, se abre instantáneamente el modal de botica.

---

## 5. Modal de Botica y Jerarquía de Contexto de Entrada

- **Extensión de `InputContext`**:
  `export type InputContext = 'gameplay' | 'dialogue' | 'inventory' | 'skillTree' | 'alchemy' | 'defeated';`
- **Atajos y Controles**:
  - Tecla `[B]` (Botica) abre y cierra el modal en modo single-pulse (`!e.repeat`).
  - Tecla `[Escape]` cierra el modal y regresa a gameplay limpio sin arrastre de inputs.
  - Botón permanente en el HUD superior: `⚗️ [B] BOTICA`.
- **Estructura del Modal (`#p3d-alchemy-modal`)**:
  - Encabezado temático gótico en tonos esmeralda y oro: `⚗️ BOTICA DE ELOWEN: CALDERO DE ALQUIMIA & ELIXIRES ⚗️`.
  - Barra de estado con EXP disponible, estado del fuego del caldero y héroe activo.
  - Rejilla de recetas con descripción, ganancia de EXP y comprobación visual de ingredientes con iconos (`✓` verde o `✗` rojo).
  - Botón `⚗️ SINTETIZAR` reactivo: habilitado con estilo esmeralda brillante si se poseen los ingredientes; desactivado con opacidad si faltan.
  - Cajón inferior de materiales en posesión (`🎒 MATERIALES EN TU BOLSA`).
- **Efecto de Síntesis**:
  - Destello de sobrecarga lumínica en el caldero 3D (aumento temporal a intensidad 4.5).
  - Texto flotante en el mundo 3D: `⚗️ ¡[NOMBRE] SINTETIZADO! (+[EXP] EXP)`.
  - Sonido de confirmación y actualización simultánea del HUD y bolsa de objetos.

---

## 6. Sistema Unificado de Botín de Enemigos y Objetos Destruibles

Se centralizó la adjudicación de recompensas en `awardEnemyKillRewards(...)`, activa tanto en ataques cuerpo a cuerpo, disparos de flecha/lanzamiento de arma como en ejecuciones cinemáticas (`[E]`):

| Fuente / Enemigo | Botín de Materiales Alquímicos | EXP Base | EXP Remate |
| :--- | :--- | :---: | :---: |
| **Sabueso de Ceniza** | 1x Esencia de Fuego Fatuo (`blood_hound`) | +40 EXP | +75 EXP |
| **Cultista del Incensario** | 2x Hoja de Plata (`herb_silverleaf`) + 1x Ceniza Purificada (`ash_purified`) | +60 EXP | +100 EXP |
| **Flagelante con Cadena** | 1x Ungüento Base (`salve_base`) + 2x Ceniza Purificada (`ash_purified`) | +80 EXP | +150 EXP |
| **Penitente de la Cripta** | 1x Agua Bendita (`water_blessed`) + 1x Ceniza Purificada (`ash_purified`) | +100 EXP | +180 EXP |
| **Barriles y Cajas (Props)** | 45% de prob. de soltar Hoja de Plata o Ungüento Base | +15 EXP | N/A |

---

## 7. Evidencia Visual y Verificación

### Pruebas Unitarias
El conjunto de tests de Vitest pasó de 60 a **63 pruebas pasando sin un solo fallo**:
- `tests/domain/Alchemy.test.ts` (5 pruebas):
  - Inicialización con recetas canónicas de Oakhaven.
  - Detección precisa de ingredientes faltantes.
  - Bloqueo de síntesis y conservación de materiales ante escasez.
  - Deducción exacta de ingredientes y adjudicación de EXP.
  - Comprobación de todas las recetas canónicas.
- `tests/presentation/CameraAndInputContext.test.ts` (11 pruebas):
  - Prioridad del contexto `'alchemy'`.
  - Supeditación limpia ante derrota y diálogos.

### Verificación en Navegador (Subagente Playwright en `http://localhost:3000/#3d`)
1. **Entrada a Oakhaven 3D**: Verificado botón `⚗️ [B] BOTICA` en barra superior y `B: Botica/Alquimia` en controles inferiores.
2. **Apertura de Botica**: Modal desplegado con recetas y materiales iniciales (2x Hoja de Plata, 1x Ungüento Base, 1x Ceniza Consagrada).
3. **Síntesis en Vivo**: Clic en `⚗️ SINTETIZAR` sobre *Bálsamo de la Doncella* incrementó la EXP de 600 a 615 EXP, consumió 2 hojas y 1 ungüento, actualizó el acceso rápido `🌿 [Q] BÁLSAMO (1)` y deshabilitó el botón.
4. **Proximidad al Caldero**: Al caminar junto a Elowen y el caldero, la insignia inferior mostró:
   `⚗️ [E] CALDERO DE ELOWEN: BOTICA & ALQUIMIA`.

### Capturas de Pantalla Registradas:
- **Modal de Botica y Recetas:** [oakhaven_3d_botica_recetas_modal.png](file:///d:/Edged/Mejoras%20a%20futuro/Seguimiento/capturas/oakhaven_3d_botica_recetas_modal.png)
- **Síntesis Alquímica Completada:** [oakhaven_3d_sintesis_alquimia_completada.png](file:///d:/Edged/Mejoras%20a%20futuro/Seguimiento/capturas/oakhaven_3d_sintesis_alquimia_completada.png)
- **Caldero 3D e Insignia Proximidad:** [oakhaven_3d_caldero_elowen_proximidad.png](file:///d:/Edged/Mejoras%20a%20futuro/Seguimiento/capturas/oakhaven_3d_caldero_elowen_proximidad.png)
