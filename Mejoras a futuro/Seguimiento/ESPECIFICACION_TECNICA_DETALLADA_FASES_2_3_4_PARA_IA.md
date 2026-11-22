# 🛠️ Especificación Técnica Exhaustiva — Fases 2, 3 y 4 del Mundo 2D y 3D (Guía para Modelo de IA)

> [!IMPORTANT]
> **Propósito de este documento**: Este archivo contiene **todas las especificaciones arquitectónicas, rutas de archivos, firmas de métodos TypeScript, coordenadas espaciales `(x, y, z)` en 3D y `(x, y)` en 2.5D, lógica de combate, diálogos canónicos de la novela y criterios de pruebas unitarias** para implementar las **Fases 2, 3 y 4** de *The Light in the Darkness (Double Blood)*. Está diseñado para que cualquier modelo de IA pueda ejecutarlo directamente sin ambigüedades ni regresiones.

---

## 1. Contexto Técnico del Repositorio y Estado Actual (Línea Base: Commit `6269dda`)

### 1.1. Stack Tecnológico y Reglas de Compilación
- **Motor 3D**: `Three.js` (`src/presentation/three/Oakhaven3DExperience.ts`, `src/presentation/three/GothicArticulatedRig3D.ts`, `src/presentation/three/ThreeVisualDesignSystem.ts`).
- **Motor 2D (2.5D)**: `Phaser 3` (`src/presentation/scenes/GameScene.ts`, `src/presentation/scenes/HUDScene.ts`, `src/presentation/assets/VisualPackCatalog.ts`).
- **Capa de Dominio**: TypeScript puro sin dependencias de motor (`src/domain/encounters/DungeonAreaManager.ts`, `src/domain/encounters/ActBosses.ts`, `src/domain/story/CanonChapterCompendium.ts`, `src/domain/inventory/Inventory.ts`, `src/domain/progression/Progression.ts`).
- **TypeScript Estricto (`tsconfig.json`)**:
  - `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`.
  - **Regla crítica**: Ninguna variable, método privado o propiedad declarada puede quedar sin leerse (`error TS6133`).
- **Comandos de Verificación Obligatorios**:
  1. `npm test -- --run` → Actualmente **16 archivos de test / 117 pruebas unitarias pasando al 100%**. Ningún cambio en `DungeonAreaManager.ts` o `ActBosses.ts` debe romper las aserciones existentes en `tests/domain/DungeonCrawler.test.ts` ni `tests/domain/CanonCompendium.test.ts`.
  2. `npm run build` → Ejecuta `tsc && vite build`. Debe terminar con código `0` y `0` errores.

### 1.2. Qué YA está implementado en la Fase 1 (No duplicar ni sobrescribir)
1. **Rig 3D Articulado Gótico (`src/presentation/three/GothicArticulatedRig3D.ts`)**:
   - Ya existe e implementa la jerarquía estilo *OpenLara* (`pelvis`, `torso`, `headGroup`, `capeGroup`, `shoulderL/R`, `forearmL/R`, `weaponSocketL/R`, `hipL/R`, `shinL/R`) para **Thomas** y **Khaterine**, con separación de tren inferior (`idle`, `walk`, `run`, `dodge`, `death`) y tren superior (`slash_light`, `slash_heavy`, `unarmed_punch`, `shoot_light`, `shoot_heavy`, `guard`, `ward`), calibración de zancada (`strideLength = 1.65`) y eventos `ClipEvent` (`footLeft`, `footRight`, `weaponContact`).
2. **Cámara Cercana en 3ª Persona por Defecto + Lock-On `[R]` (`Oakhaven3DExperience.ts`)**:
   - `cameraMode` inicia en `'third_person'`.
   - `toggleLockOn()` y `updateLockOn(delta)` ya fijan al enemigo/jefe más cercano con `[R]`, clic derecho o `#btn-toggle-lockon`, mostrando `lockOnRingMesh` y adaptando el encuadre.
3. **Oakhaven Multi-Sector (Acto I) con Elevación Real (`+2.2m`) y Transición Alba → Medianoche**:
   - `getTerrainHeightAt(x, z)` ya eleva el terreno de `0.0m` a `+2.2m` en la **Colina del Viejo Roble** (`x > 4.5, z ∈ [0.4, 9.6]`).
   - Los aldeanos enfermos **Gedeón el Cantero** (`(-2.5, 0, 2.7)`) y **Marta del Valle** (`(2.3, 0, 3.9)`) ya son interactuables en el Atrio.
   - Entregar el **Pájaro de Madera de Sauce** a **Elowen** en la Colina del Viejo Roble (`(9.4, 2.2, 5.0)`) o pulsar `⚔️ [F] INICIAR ASEDIO` ya activa `triggerOakhavenMidnightSiege()` (Capítulo III).
4. **Brújula Táctica de Pergamino (`#p3d-sector-compass`), Trampa del Crisol (Acto II), Sinergia Tri-Héroe (Acto IV) y Dilema Moral del Capítulo XX (Acto V)**:
   - Ya existen en `Oakhaven3DExperience.ts` (`updateSectorCompassAndShalemGuide`, `executeThrowWeapon` sobre el Gran Crisol, `executeTriHeroSynergyAgainstMalphas`, `openMoralDilemmaModal` y `resolveChapter20MoralDilemma`).
5. **Mapa 2.5D Desplazable (`1180x360`) en `GameScene.ts`**:
   - Ya cuenta con seguimiento de cámara (`this.cameras.main.setBounds(0, 0, 1180, 360)`), terraza elevada de la Colina del Viejo Roble (`x: 225..425, y: 178..210`) y brújula superior 2D (`update2DSectorCompass()`).

---

## 2. Mapa de Archivos a Modificar en las Fases 2, 3 y 4

| Archivo | Rol y Modificaciones Requeridas |
| :--- | :--- |
| `src/presentation/three/Oakhaven3DExperience.ts` | Añadir sub-sectores físicos, elevación `getTerrainHeightAt` en Actos II y V, física de derribo al abismo en Acto III, aliados combatientes Martín y Tobías en Acto III, braseros narcóticos destructibles y 3 espejos de culpa en Acto IV, transformación 3D de Shalem en León de Brasas Carmesíes en Acto V y Epílogo Jugable del Primer Amanecer en la Colina del Viejo Roble. |
| `src/presentation/scenes/GameScene.ts` | Añadir equivalencia 2.5D para los Actos II–V: losa del Granero Quemado y trampa del Crisol con `[T]` en Acto II; derribo de enemigos al río y aliados Martín/Tobías en Acto III; braseros narcóticos destructibles y 3 espejos de culpa en Acto IV; Shalem como León de Brasas y Epílogo del Primer Amanecer en Acto V. |
| `src/presentation/three/GothicArticulatedRig3D.ts` | (Fase 4) Extender el constructor o añadir `GothicEnemyArticulatedRig3D` para dotar a los enemigos humanoides y jefes de articulación jerárquica 3D de brazos, piernas, torso, capas y armas. |
| `src/presentation/assets/VisualPackCatalog.ts` | (Fase 4) Registrar dinámicamente los nuevos sprites y láminas de `DISENOS_FALTANTES_Y_REQUERIDOS_CANON_COMPLETO.md` cuando estén presentes en `public/assets/`. |
| `tests/presentation/CameraAndInputContext.test.ts` | Añadir pruebas unitarias para la elevación de los Actos II y V, la física de derribo al abismo del Gran Puente, el debilitamiento de Malphas al destruir braseros narcóticos y la transformación de Shalem. |

---

## 3. Especificación Técnica Detallada — FASE 2 (Actos II, III y IV)

### 3.1. ACTO II: Granero del Sur Quemado, Escalera Helicoidal a la Celda de Sal (`+2.8m`) y Rastro de Lino y Carbón (Capítulos VII–IX)

#### A. En Modo 3D (`src/presentation/three/Oakhaven3DExperience.ts`)
1. **Límites del Área (`belltower_summit`)**:
   - En `DungeonAreaManager.ts`, los límites actuales son `minX: -6.0, maxX: 6.0, minZ: -220.0, maxZ: -185.0`. **Mantener estos valores en `DungeonAreaManager.ts`** para no alterar `tests/domain/DungeonCrawler.test.ts`.
2. **Elevación Real hacia la Celda de Sal (`getTerrainHeightAt(x, z)`)**:
   - Actualizar `public getTerrainHeightAt(x: number, z: number): number` en `Oakhaven3DExperience.ts` para incluir la rampa/escalera occidental del Campanario del Sur (`belltower_summit`):
     ```ts
     if (this.dungeonAreaManager.currentArea === 'belltower_summit') {
       // Rampa/escalera helicoidal occidental hacia la Celda de Sal de Elowen (x <= -2.8, z: -193..-205 -> sube hasta +2.8m)
       if (x < -2.6 && z <= -192.0 && z >= -205.5) {
         const t = THREE.MathUtils.clamp((-192.0 - z) / 8.5, 0, 1);
         const smooth = t * t * (3 - 2 * t);
         return smooth * 2.8;
       }
     }
     ```
3. **Sub-sector 2A: Ruinas del Granero del Sur Quemado (`z: -187 .. -194, x: 2.2 .. 5.4`)**:
   - Dentro de `createBelltowerAct2()`:
     - Añadir 4 vigas de madera carbonizada inclinadas (`color: 0x1c1310`) y una **Losa de Piedra Quebrada con Runas del Sauce Negro** en `(3.8, 0.08, -191.5)` con una luz púrpura tenue (`PointLight(0xaa44ff, 1.8, 4)`).
   - Añadir el objetivo de interacción `'burned_barn_slab'` a `activeInteractTarget`:
     - En `updateProximityInteractions()` (cuando `currentArea === 'belltower_summit'`):
       - Si `pPos.distanceTo(new THREE.Vector3(3.8, 0, -191.5)) <= 2.8`:
         - `targetFound = 'burned_barn_slab'`
         - `badgeText = '🗡️ [E] INSPECCIONAR LOSA DEL GRANERO QUEMADO (CAP. VIII)'`
         - `badgeColor = '#d999ff'`
     - En `handleContextInteraction()` → `interactWithBurnedBarnSlab()`:
       - Otorga `+60 EXP` (primera vez, controlado por `private hasInspectedBurnedBarn: boolean = false;`), desbloquea el Capítulo 8 (`this.canonChapterManager.unlockChapter(8)`), restaura `+25` de postura y muestra el modal canónico:
         - **Título**: `'🗡️ EL GRANERO DEL SUR QUEMADO — LA NOCHE DE LA LUNA ROJA (CAP. VIII) 🗡️'`
         - **Texto**: `'«Bajo las vigas calcinadas del granero donde Khaterine ocultó su pasado, apartas la losa de piedra. Grabados en la roca yacen los nombres de las Nueve Hermanas del Sauce Negro. Khaterine aprieta los puños: "No fue una purga santa, Thomas. Alaric era nuestro aliado; él nos abrió las puertas en la Noche de la Luna Roja para robar el pacto de Malphas y coronarse rey de Londinium sobre las cenizas de mis hermanas."»'`
         - **Recompensa**: `'✦ RECOMPENSA: +60 EXP • MEMORIA DE LA LUNA ROJA REVELADA (CAPÍTULO VIII) ✦'`
4. **Sub-sector 2B: Escalera de Piedra y Plataforma Elevada de la Celda de Sal (`(-5.5, 2.8, -202)`)**:
   - En `createBelltowerAct2()`:
     - Elevar la jaula circular de sal de Elowen (`elowen_cell`) y a `this.willowBirdMesh` a `y = 2.8m` sobre una plataforma de piedra sostenida por columnas góticas en `(-5.0, 1.4, -202)`, y construir 7 peldaños de piedra desde `(-4.2, 0.2, -193)` hasta `(-4.8, 2.8, -200)`.
   - En `updateProximityInteractions()`:
     - Comprobar la distancia a `new THREE.Vector3(-5.0, 2.8, -202)` con radio `<= 3.6` para `'elowen_cell'`.
5. **Rastro Diegético de Hilos de Lino y Carbón**:
   - En `createBelltowerAct2()`, colocar 5 pequeños destellos/marcas en el suelo (`(0.5, 0.05, -189)`, `(-1.5, 0.05, -191.5)`, `(-3.8, 0.4, -194)`, `(-4.5, 1.5, -197.5)`, `(-4.8, 2.82, -200.5)`) que guían visualmente al jugador hasta la celda elevada de Elowen.

#### B. En Modo 2D (`src/presentation/scenes/GameScene.ts`, `scenarioIndex === 2`)
- En `spawnScenarioProps(2)`:
  - Dibujar la **Losa del Granero Quemado** en `(145, 272)` y la **Plataforma Elevada de la Celda de Sal** en `(220, 192)` con peldaños en `(175, 210)` y `(195, 200)`.
- En `handleInput(delta)`:
  - Permitir que `minY` suba hasta `178` también en `this.currentScenario === 2 && nextX >= 170 && nextX <= 290`.
- En `executeWeaponThrow()`:
  - Si `this.currentScenario === 2` y el proyectil de la espada arrojada impacta cerca del **Guardián del Crisol** (`this.currentBoss`), infligir `120` de daño de bronce fundido, romper su postura (`this.currentBoss.posture = 0; this.currentBoss.state = 'STUNNED'`) y mostrar `'🔥 ¡CRISOL TRABADO! -120 HP'`.

---

### 3.2. ACTO III: Física Real de Precipicios en Barandillas Rotas y Aliados Activos Martín y Tobías en el Gran Puente (Capítulos X–XIII)

#### A. En Modo 3D (`src/presentation/three/Oakhaven3DExperience.ts`)
1. **Barandillas Rotas y Zonas de Abismo Fluvial (`great_stone_bridge`, `z: -235 .. -280`)**:
   - En `createGreatStoneBridgeAct3()`:
     - Dejar dos brechas visibles sin parapeto a ambos lados de la calzada (`x = -4.8` y `x = +4.8`) en los tramos `z ∈ [-248, -242]` y `z ∈ [-264, -256]`, colocando postes de piedra partidos y antorchas azules de advertencia en los bordes de cada hueco.
2. **Guardias de Vanguardia del Puente y Mecánica de Derribo al Abismo (`checkBridgeAbyssKnockoff`)**:
   - Añadir 2 guardias dorados patrullando el puente (`private bridgeGuard1Group!: THREE.Group; private bridgeGuard1Hp = 90; private bridgeGuard1Dead = false;` en `(-2.2, 0, -245)` y `bridgeGuard2Group` en `(2.4, 0, -259)`).
   - Cuando Thomas o Khaterine golpean con **Ataque Pesado (`[K]`)** o **Flecha de Plata / Explosión**:
     - Aplicar un vector de empuje horizontal (`knockback = dir.multiplyScalar(2.4)`).
     - Si la posición del guardia en el puente supera `Math.abs(guardPos.x) >= 4.1` dentro de las brechas `z ∈ [-249, -241]` o `z ∈ [-265, -255]` (o si cualquier ataque pesado lo empuja al borde `Math.abs(guardPos.x) >= 4.3`):
       - Activar caída al vacío (`guard.fallingToAbyss = true`): durante `0.9s`, `guardGroup.position.y -= 14 * delta`, `guardGroup.rotation.x += 5 * delta`.
       - Mostrar texto flotante `'🌊 ¡ARROJADO AL ABISMO DEL RÍO! (+100 EXP)'`, reproducir sonido de impacto/salpicadura y otorgar `+100 EXP`.
3. **Aliados Combatientes Activos: Martín el Armero y Tobías el Leñador (`martinAllyGroup` y `tobiasAllyGroup`)**:
   - Añadir campos:
     ```ts
     private martinAllyGroup?: THREE.Group;
     private tobiasAllyGroup?: THREE.Group;
     private bridgeAlliesAttackTimer: number = 0;
     ```
   - En `createGreatStoneBridgeAct3()`, crear las mallas 3D de **Martín** (túnica de cuero, lanza de hierro) y **Tobías** (capa de leñador, hacha/lanza) inicialmente dentro de la carreta-jaula en `(-2.6, 0, -249)` (`visible = true`).
   - Cuando el jugador interactúa con `'refugees_cart'` (`interactWithRefugeesCart()`, `this.hasFreedRefugees = true`):
     - Martín y Tobías salen de la jaula y en `updateCaptainVane(delta)` (cuando `this.hasFreedRefugees && !this.captainVaneEncounter.isDefeated`) avanzan automáticamente hacia la posición del **Capitán Áureo Vane** (`this.captainVaneGroup.position`), manteniéndose a `2.2m` a sus flancos (`x - 1.6` y `x + 1.6`).
     - Cada `2.4s`, Martín y Tobías ejecutan una estocada conjunta contra el Capitán Vane:
       - `const res = this.captainVaneEncounter.takeDamage(18, false, true);`
       - `this.spawnFloatingText(this.captainVaneGroup.position, '⚔ ¡MARTÍN Y TOBÍAS FLANQUEAN! -18', '#a3ffc7');`
       - Además, mientras Martín y Tobías distraen a Vane, su escudo frontal queda semi-abierto, permitiendo que los ataques de Thomas y Khaterine con Lock-On (`[R]`) inflijan daño crítico de flanqueo.

#### B. En Modo 2D (`src/presentation/scenes/GameScene.ts`, `scenarioIndex === 3`)
- En `executeAttack(isHeavy: boolean)`:
  - Si `this.currentScenario === 3 && isHeavy`: empujar al enemigo golpeado `35px` hacia arriba (`enemy.position.y -= 35`). Si `enemy.position.y <= 208`, el enemigo cae por la barandilla rota del Gran Puente hacia el río (`tween` de `y: 165, scale: 0.3, alpha: 0`, muerte instantánea y `spawnDamageNumber(x, y, '🌊 ¡AL ABISMO!', true, '#66ccff')`).
- En `interactWithElowen()` (cuando `this.currentScenario === 3`):
  - Hacer aparecer 2 sprites aliados (`martinSprite` y `tobiasSprite`) que avanzan hacia el **Capitán Áureo Vane** y le infligen `-15 HP` cada `2.5s`.

---

### 3.3. ACTO IV: Braseros de Incienso Narcótico, Ciudadanos Hipnotizados y los 3 Espejos de la Culpa en Londinium (Capítulos XIV–XVII)

#### A. En Modo 3D (`src/presentation/three/Oakhaven3DExperience.ts`)
1. **3 Braseros de Incienso Narcótico Destructibles y Ciudadanos en Trance (`londinium_citadel`, `z: -295 .. -345`)**:
   - En `createLondiniumCitadelAct4()`:
     - Crear 3 **Braseros Reales de Incienso Narcótico** y registrarlos en `this.destructibles` con IDs `'narcotic_brazier_1'`, `'narcotic_brazier_2'`, `'narcotic_brazier_3'` en las coordenadas:
       - `(-4.2, 0.6, -304)`
       - `(4.2, 0.6, -311)`
       - `(0.0, 0.6, -317)`
     - Junto a cada brasero, colocar un **Ciudadano Noble Hipnotizado** arrodillado bajo un halo de vapor dorado.
   - En `destroyProp(prop: DestructibleProp3D)`:
     - Si `prop.id.startsWith('narcotic_brazier_')`:
       - Mostrar texto flotante `'🌿 ¡BRASERO NARCÓTICO DESTRUIDO! (CIUDADANO DESPIERTA & MALPHAS DEBILITADO)'` en color `'#ffd700'`.
       - Incrementar `private destroyedNarcoticBraziersCount: number = 0;` (`+1`).
       - Mostrar un toast de diálogo del ciudadano liberado:
         - Brasero 1: `'Ciudadano Despierto: «¡El humo dorado nos cegaba! ¡El rey Alaric nos hizo creer que el Sol del Abismo era la gracia del Cáliz!»'`
         - Brasero 2: `'Noble Liberada: «¡Huid del Salón de los Espejos! ¡Quien cree sus reflejos entrega su voluntad a la Ley del Deseo!»'`
         - Brasero 3: `'Erudito de Londinium: «¡Todos los braseros han caído! ¡La armadura solar de Rex Malphas ha perdido su escudo narcótico!»'`
       - Por cada brasero destruido, aumentar el daño recibido por **Rex Malphas** en un `+15%` (hasta `+45%` con los 3 braseros destruidos).
2. **Los 3 Espejos Venecianos de la Culpa (`guilt_mirror_1..3`) antes del Espejo Maestro**:
   - Añadir estado `private shatteredGuiltMirrors: number = 0;` (de `0` a `3`).
   - En `interactWithMirrorGallery()`:
     - Cada pulsación de `[E]` en el Salón de los Espejos (`(-7.0, 0, -320)`) quiebra primero los 3 reflejos psicológicos de culpa y en el 3º hace añicos el **Espejo Maestro**:
       1. **Reflejo 1 (`shatteredGuiltMirrors === 1`)**: *«El primer espejo muestra el granero ardiendo en la Noche de la Luna Roja y una voz susurra a Khaterine: "Tú sobreviviste mientras tus ocho hermanas ardían". Khaterine estrella una flecha abisal contra el cristal: "¡Yo soy su memoria, no su verdugo!" (+40 EXP)»*
       2. **Reflejo 2 (`shatteredGuiltMirrors === 2`)**: *«El segundo espejo muestra a Thomas coronado de ceniza sobre Oakhaven en llamas: "Llevas la sangre de Astaroth en las venas". Thomas raja el azogue con su espada: "¡Mi sangre es mía, no de mi padre!" (+40 EXP)»*
       3. **Reflejo 3 — Espejo Maestro (`shatteredGuiltMirrors === 3`, `this.hasClearedMirrorGallery = true`)**: *«El Espejo Maestro proyecta a Elowen desvaneciéndose en sal, pero Shalem salta sobre el marco dorado y Thomas lo parte en mil esquirlas luminosas. ¡Las ilusiones de Alaric se derrumban y la Ley del Deseo pierde su poder sobre vosotros! (+90 EXP)»*

#### B. En Modo 2D (`src/presentation/scenes/GameScene.ts`, `scenarioIndex === 4`)
- Añadir 3 sprites de braseros narcóticos (`prop_soul_brazier` con tinte dorado `0xffdd55`) en `(240, 232)`, `(360, 268)` y `(450, 235)` que al ser golpeados con `[J]`/`[K]` estallan con `fx_pyre_explosion`, despiertan a un ciudadano y reducen un `15%` la defensa de **Rex Malphas**.

---

## 4. Especificación Técnica Detallada — FASE 3 (Acto V: Escalada Invertida, Shalem como León de Brasas y Epílogo Jugable del Primer Amanecer)

### 4.1. Peldaños de Escombros Flotantes con Elevación Real en la Catedral Invertida (`inverted_cathedral`, `z: -360 .. -415`)
1. **Elevación Progresiva en `getTerrainHeightAt(x, z)`**:
   - En `Oakhaven3DExperience.ts`, añadir dentro de `getTerrainHeightAt(x, z)`:
     ```ts
     if (this.dungeonAreaManager.currentArea === 'inverted_cathedral') {
       // Ascenso progresivo por las losas de mármol flotantes hacia el Altar de la Comunión (-378) y el Sol Negro (-400)
       if (z <= -368.0) {
         const t = THREE.MathUtils.clamp((-368.0 - z) / 28.0, 0, 1);
         return t * 2.4;
       }
     }
     ```
2. **Salto / Impulso Contextual con `[ESPACIO]` en Escombros Flotantes (`executeDodge()`)**:
   - En `executeDodge()`, cuando `this.dungeonAreaManager.currentArea === 'inverted_cathedral'`, añadir un impulso vertical visual (`this.playerGroup.position.y += 0.65`) y texto `'✨ ¡IMPULSO ASTRAL!'` para enfatizar el salto entre las losas suspendidas sobre el vacío cósmico.

### 4.2. Transformación Física 3D/2D de Shalem en el León Colosal de Brasas Carmesíes (Capítulo XX)
1. **En Modo 3D (`Oakhaven3DExperience.ts`)**:
   - Añadir propiedades:
     ```ts
     private shalemLionGroup?: THREE.Group;
     private isShalemLionActive: boolean = false;
     private shalemLionAttackTimer: number = 0;
     ```
   - Crear método `private createOrActivateShalemLion(): void`:
     - Construye un grupo 3D majestuoso a escala heróica (`scale: 1.9`):
       - Torso leonino musculoso de obsidiana (`color: 0x120916, roughness: 0.6`).
       - Melena ardiente compuesta por 12 coronas/conos radiales de brasas carmesíes y oro (`MeshBasicMaterial({ color: 0xff4411 })` y `0xffaa22`).
       - Ojos solares (`0xffdd44`), 4 patas articuladas con garras ígneas, cola con penacho de fuego negro y `PointLight(0xff4400, 4.5, 12)`.
     - Posiciona `this.shalemLionGroup` en `(2.5, 2.0, -392)` junto a **Astaroth** y activa `this.isShalemLionActive = true`.
   - Llamar a `this.createOrActivateShalemLion()` dentro de `resolveChapter20MoralDilemma('canon')`!
   - En `updateAstarothTitan(delta)`:
     - Si `this.isShalemLionActive && this.shalemLionGroup && !this.astarothEncounter.isDefeated`:
       - Hacer que `this.shalemLionGroup` orbite agresivamente alrededor de `this.astarothGroup.position` (`angle = this.clock.elapsedTime * 1.6`, radio `3.8m`).
       - Cada `3.0s` (`this.shalemLionAttackTimer`), Shalem León embiste al Sol Negro:
         - `const hit = this.astarothEncounter.takeDamage(45, true);`
         - `this.visualDesigns.spawnVfxBillboard(this.scene, this.astarothGroup.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 2.8, 2.8, '/assets/vfx/fx_slash_gold.png', 5, 20);`
         - `this.spawnFloatingText(this.astarothGroup.position, '🦁 ¡SHALEM LEÓN DE BRASAS! -45', '#ff7722');`
         - Actualizar `#p3d-astaroth-hp-fill` y comprobar `if (hit.defeated) this.handleAstarothDefeat();`.
2. **En Modo 2D (`GameScene.ts`, `scenarioIndex === 5`)**:
   - Cuando `this.awakenAlbaGris()` se activa al hablar con Elowen en el Acto V:
     - Aumentar la escala de `this.shalemSprite` a `2.2x`, aplicarle un aura ígnea carmesí/dorada (`setTint(0xff7733)`), mostrar `'🦁 ¡SHALEM ROMPE SU PACTO: LEÓN DE BRASAS!'` y hacer que embista a **Astaroth** cada `3.0s` infligiendo `-40 HP`.

### 4.3. Epílogo Jugable del Primer Amanecer en la Colina del Viejo Roble (`triggerFirstDawnPlayableEpilogue()`)
1. **En Modo 3D (`Oakhaven3DExperience.ts`)**:
   - Cuando `this.astarothEncounter.isDefeated` es `true` y el jugador interactúa con `'black_sun_core'` (`interactWithBlackSunCore()`):
     - Llamar a `public triggerFirstDawnPlayableEpilogue(): void`:
       1. Cambiar área a `'surface'` (`this.dungeonAreaManager.exitToSurface()`) y teletransportar al jugador a la **Colina del Viejo Roble** (`this.setPlayerPosition(8.6, 2.2, 5.0)`).
       2. Configurar `this.oakhavenNarrativePhase = 'FIRST_DAWN_EPILOGUE'`:
          - Cielo y niebla dorados-rosados del Primer Amanecer (`this.scene.background = new THREE.Color(0x4a3252)`, `this.scene.fog = new THREE.FogExp2(0x583c5e, 0.008)`).
          - Iluminación cálida (`ambientLightRef` a `0xffe0b2`, intensidad `3.2`; `moonLightRef` a `0xffdd88`, intensidad `3.5`).
       3. Ocultar todos los enemigos de Oakhaven (`this.enemyGroup.visible = false`, `this.cultistGroup.visible = false`, `this.zealotGroup.visible = false`, `this.morwennaGroup.visible = false`).
       4. Reunir a todos los compañeros bajo el Viejo Roble (`y = 2.2m`):
          - **Elowen** en `(9.6, 2.2, 5.0)`
          - **Khaterine / Thomas NPC** en `(9.2, 2.2, 3.8)`
          - **Padre Cedric** en `(8.2, 2.2, 6.2)`
          - **Shalem** (de nuevo como pequeño gato negro en `(9.5, 2.2, 4.5)` con una luz dorada suave).
       5. Hacer brotar 16 **Flores Blancas del Amanecer** (`SphereGeometry(0.08)` blanco/dorado) sobre el césped de la Colina del Viejo Roble.
       6. Mostrar el modal de epílogo canónico del **Capítulo XX: *La Luz en las Tinieblas***:
          - **Título**: `'🌅 EPÍLOGO CANÓNICO — EL PRIMER AMANECER EN LA COLINA DEL VIEJO ROBLE 🌅'`
          - **Texto**: `'«Por primera vez en dieciocho años, la niebla de ceniza se abre sobre el valle de Oakhaven y un sol cálido tiñe de oro las hojas del Viejo Roble. Shalem ronronea hecho un ovillo sobre la piedra musgosa, libre al fin de las cadenas del Abismo. Elowen apoya su frente sobre el hombro de Thomas mientras Khaterine contempla el horizonte en paz: "Ya no somos hijos de la noche ni del temor, Thomas. Somos la oscuridad que eligió amar."»'`
          - **Recompensa**: `'👑 OBRA COMPLETA (20/20 CAPÍTULOS) — PUEDES CAMINAR LIBREMENTE POR LA COLINA O USAR EL COMPENDIO [N] 👑'`

---

## 5. Especificación Técnica Detallada — FASE 4 (Rigs 3D Articulados para Enemigos/Jefes e Integración de los 98 Assets Faltantes)

### 5.1. Rigs 3D Articulados para Enemigos y Jefes (`GothicArticulatedRig3D.ts`)
- Actualmente `GothicArticulatedRig3D` soporta `'thomas' | 'khaterine'`.
- Ampliar el tipo de perfil en `GothicArticulatedRig3D.ts`:
  ```ts
  export type ArticulatedRigArchetype3D =
    | 'thomas'
    | 'khaterine'
    | 'cultist'
    | 'zealot'
    | 'skeleton'
    | 'morwenna'
    | 'inquisitor'
    | 'crucible_guardian'
    | 'captain_vane'
    | 'rex_malphas';
  ```
- Configurar paleta de materiales y escala por arquetipo:
  - `'morwenna'`: Escala `1.22`, túnica carmesí/ceniza `0x3b101c`, corona/halo espinado, incensario/espada de fuego en `weaponSocketR`.
  - `'captain_vane'`: Escala `1.25`, armadura áurea `0xd4af37`, escudo de torre articulado en `weaponSocketL` (que rota en `Y` cuando bloquea vs cuando es flanqueado) y espadón en `weaponSocketR`.
  - `'crucible_guardian'`: Escala `1.35`, coraza de bronce tiznado `0x6e4726`, martillo de forja incandescente en `weaponSocketR`.
  - `'rex_malphas'`: Escala `1.28`, manto astral púrpura/oro `0x3a1452`, corona solar y dos espadas gemelas en `weaponSocketL` y `weaponSocketR`.

### 5.2. Conexión Automática de los 98 Diseños Visuales Restantes (`VisualPackCatalog.ts`)
- Consultar el documento [DISENOS_FALTANTES_Y_REQUERIDOS_CANON_COMPLETO.md](file:///d:/Edged/Mejoras%20a%20futuro/Mejoras%20visuales/DISENOS_FALTANTES_Y_REQUERIDOS_CANON_COMPLETO.md).
- A medida que se añadan archivos PNG en `public/assets/enemies/`, `public/assets/characters/`, `public/assets/props/`, `public/assets/icons/`, `public/assets/vfx/` y `public/assets/loading/`, registrarlos en:
  1. `VISUAL_PACK_SPRITE_SHEETS` en `src/presentation/assets/VisualPackCatalog.ts`.
  2. `setupOfficial3DVisualDesigns()` en `src/presentation/three/Oakhaven3DExperience.ts` (reemplazando los *fallbacks* de los jefes de los Actos II–V `boss_inquisitor`, `boss_root_prowler`, `boss_crucible`, `boss_vane`, `boss_malphas`, `boss_astaroth` por sus nuevas tiras dedicadas: `inquisitor_*`, `prowler_*`, `crucible_*`, `vane_*`, `malphas_*`, `astaroth_*`).

---

## 6. 📋 Prompt Maestro Listo para Copiar y Pegar en el Otro Modelo de IA

> [!TIP]
> Copia y pega el siguiente bloque directamente en el otro modelo de IA para que implemente las **Fases 2, 3 y 4** de inmediato siguiendo toda la arquitectura del repositorio:

```markdown
Actúa como Arquitecto Principal de Videojuegos 2D (Phaser 3) y 3D (Three.js) en TypeScript.

Tu tarea es implementar de principio a fin las **Fases 2, 3 y 4** del mundo de *The Light in the Darkness (Double Blood)* siguiendo exactamente las especificaciones de estos dos documentos del repositorio:
1. `Mejoras a futuro/Seguimiento/DISENO_MAESTRO_DEL_MUNDO_2D_Y_3D.md`
2. `Mejoras a futuro/Seguimiento/ESPECIFICACION_TECNICA_DETALLADA_FASES_2_3_4_PARA_IA.md`

### Reglas Estrictas del Repositorio:
1. **No rompas nada de la Fase 1 ya implementada**: Mantén intactos `GothicArticulatedRig3D.ts`, la cámara en 3ª persona por defecto con Lock-On `[R]`, la Colina del Viejo Roble (`+2.2m`), la transición Alba -> Medianoche (`DAWN_CALM` -> `MIDNIGHT_SIEGE`), la brújula `#p3d-sector-compass` y el Dilema Moral del Capítulo XX (`#p3d-moral-dilemma-modal`).
2. **Respeta los tests existentes**: No modifiques los valores numéricos de `getBounds()` en `src/domain/encounters/DungeonAreaManager.ts` que son verificados por `tests/domain/DungeonCrawler.test.ts`.
3. **TypeScript Estricto (`noUnusedLocals: true`)**: No dejes ninguna variable o propiedad privada sin usar (`TS6133`).

### Tareas a Implementar:
1. **Fase 2 (Actos II, III y IV en `Oakhaven3DExperience.ts` y `GameScene.ts`)**:
   - **Acto II**: Añade las ruinas y la Losa del Granero del Sur Quemado (`burned_barn_slab` en `(3.8, 0, -191.5)` con el diálogo canónico de la Noche de la Luna Roja de Khaterine y `+60 EXP`), la elevación real en `getTerrainHeightAt(x, z)` hasta `+2.8m` para subir a la Celda de Sal de Elowen (`(-5.0, 2.8, -202)`), el rastro diegético de hilos de lino y carbón, y la trampa del Gran Crisol al lanzar el arma `[T]` también en 2D.
   - **Acto III**: Añade los tramos de barandilla rota en el Gran Puente de Piedra (`z ∈ [-248, -242]` y `z ∈ [-264, -256]`) con física real de derribo al abismo del río al usar ataques pesados `[K]` (`🌊 ¡ARROJADO AL ABISMO DEL RÍO! +100 EXP`), y haz que al liberar a Martín y Tobías de la carreta (`refugees_cart`) salgan físicamente con lanzas a combatir y flanquear al Capitán Áureo Vane en 3D y 2D.
   - **Acto IV**: Añade los 3 Braseros de Incienso Narcótico destructibles (`narcotic_brazier_1..3`) con ciudadanos nobles en trance que despiertan al destruirlos y debilitan un 15% cada uno la defensa astral de Rex Malphas, además de la secuencia interactiva de quebrar los 3 Espejos Venecianos de la Culpa en el Salón de los Espejos.
2. **Fase 3 (Acto V en `Oakhaven3DExperience.ts` y `GameScene.ts`)**:
   - Añade la elevación progresiva sobre peldaños de mármol flotantes en `getTerrainHeightAt(x, z)` dentro de `inverted_cathedral` (hasta `+2.4m`) con impulso astral al pulsar `[ESPACIO]`.
   - Al elegir la Opción 1 (Canon) en `resolveChapter20MoralDilemma('canon')`, transforma físicamente a Shalem en el **León Colosal de Brasas Carmesíes** (`shalemLionGroup`), haciendo que orbite y ataque a Astaroth cada 3 segundos (`-45 HP`).
   - Al derrotar a Astaroth y pulsar `[E]` en `black_sun_core`, ejecuta `triggerFirstDawnPlayableEpilogue()` para trasladar al jugador a la **Colina del Viejo Roble (`+2.2m`)** bajo el cielo dorado-rosado del Primer Amanecer, con flores blancas brotando y Elowen, Khaterine, Padre Cedric y Shalem reunidos bajo el árbol.
3. **Pruebas y Compilación**:
   - Añade pruebas unitarias en `tests/presentation/CameraAndInputContext.test.ts` para las nuevas funciones de elevación y mecánicas tácticas.
   - Ejecuta `npm test -- --run` y `npm run build` asegurando 0 errores.
```
