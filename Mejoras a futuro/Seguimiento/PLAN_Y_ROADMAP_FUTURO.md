# 🗺️ The Light in the Darkness — Plan y Hoja de Ruta de Mejoras Futuras

Este documento establece las prioridades de desarrollo, mecánicas planeadas y expansiones de contenido tanto para la vertiente **2D** como para la vertiente **3D**.

---

## 🎯 Estado de Entregas del Sprint Actual

### 1. Sistema de Inventario y Reliquias [COMPLETADO ✅]
- [x] **Bolsa de Acólito**:
  - Objetos consumibles: *Bálsamo de la Doncella* (cura 35 HP), *Rosario de San Jude* (restaura postura al 100%), *Ceniza Consagrada* (+25% daño por 20s), *Bálsamo del Ocaso*, *Agua Bendita de Jude*.
  - Menú de inventario modal interactivo accesible con tecla `[I]` y botón en HUD.
  - Consumo rápido de bálsamos con tecla `[Q]` y botón con contador de stock en tiempo real.
- [x] **Reliquias Equipables**:
  - *Cruz de Oakhaven* (+70ms de ventana de Parry, extendiendo a 350ms).
  - *Pluma del Sauce Negro* (-20% de coste de fatiga de esquiva).
  - Gestión de ranuras dinámicas (1/2, 2/2) con persistencia y estadísticas en vivo.

### 2. Patrullas de Enemigos y Variedad de Cultistas [COMPLETADO ✅]
- [x] **Sistema de Rutas de Patrulla por Waypoints (FSM)**:
  - Enemigos con estados `PATROL`, `ALERT` (0.55s de aviso con ⚠️), `CHASE`, `WINDUP`, `ATTACK`, `RECOVERY`, `STUNNED`, `RETURNING`, `DEAD`.
  - Retorno automático a ruta si el héroe se aleja más de 10.5m.
- [x] **Sabueso de Ceniza (Ash Prowler)** con patrulla activa entre farolas de la calle.
- [x] **Cultista Portador de Incensario (Censer Bearer)**:
  - Modelo 3D encapuchado con máscara, incensario oscilante con luz puntual y cadenas.
  - Barra de salud dedicada `#p3d-cultist-hud`, vulnerable a parry y rematable con `[E]`.
  - Botín de consumibles al ser purificado.

### 3. Flagelante con Cadena y Mangual [COMPLETADO ✅]
- [x] **Enemigo Especializado de Rango Medio**:
  - Modelo 3D con túnica carmesí, capucha penitente y mangual de púas.
  - Ataque de látigo horizontal en abanico (4.2m de alcance).
  - Barra de salud propia `#p3d-zealot-hud`, aviso telegrafiado de ataque y remate especial con botín de *Ceniza Consagrada*.

### 4. Árbol de Habilidades y EXP de Héroes [COMPLETADO ✅]
- [x] **Dominio de Progresión (`src/domain/progression/`)**:
  - Acumulación de EXP en tiempo real (+15 por prop, +40 a +250 por enemigos).
  - Modal interactivo del **Códice del Alma** (`[H]`) con visualización de árbol para Thomas y Khaterine.
  - Habilidades funcionales con desbloqueo y modificadores activos:
    - *Golpe de Escudo Santo* (+35% impacto en postura).
    - *Filo Consagrado* (+20% daño espada).
    - *Tenacidad Inquebrantable* (+25 Max HP a 125).
    - *Disparo Abisal Perforante* (+25% daño de flechas).
    - *Paso Espectral* (+30% distancia de esquiva).
    - *Sagrario del Sauce* (reduce daño de guardia al 50%).

### 5. Sistema de Guardado Persistente en el Santuario [COMPLETADO ✅]
- [x] **Punto de Checkpoint en el Altar de San Jude (`[G]`)**:
  - Consagración junto al Padre Cedric y la cruz dorada luminosa.
  - Restauración completa de Salud y Postura.
  - Pulso sagrado de luz y bendición pastoral.
  - Persistencia en `localStorage` con serialización limpia y recarga automática al iniciar.

### 6. Fase 2 de Jefa Madre Morwenna: Pira del Abismo Desatada [COMPLETADO ✅]
- [x] **Transición Cinemática al 50% HP (<= 140/280 HP)**:
  - Onda de choque flamígera con empuje radial de 6.0m y daño sagrado de fuego.
  - Diálogo enfurecido de Madre Morwenna en banner superior.
  - Transformación visual: Alas gigantescas de ceniza y fuego ardiente, Gran Mandoble Flamígero con hoja de fuego, Corona de Espinas Candente en su cabeza, ojos de plasma blanco incandescente y aura de fuego expandida a 12m.
- [x] **Tríada de Ataques Avanzados**:
  - *Torbellino de la Pira (360°)*: Giro letal con ráfaga de 4 proyectiles de fuego dispersos.
  - *Columnas de Fuego del Crisol (AoE)*: 3 geiseres subterráneos telegrafiados en el suelo con erupción letal.
  - *Embestida Infernal*: Carrera a 7.5 m/s con estocada flamígera, vulnerable a Parry perfecto.
- [x] **Victoria y Botín Clave**:
  - Recompensa de +350 EXP.
  - Obtención de la *Llave de las Criptas de San Jude* (`oakhaven_crypt_key`) en el inventario.
  - Desbloqueo y apertura automática de las rejas de hierro del Cementerio.

### 7. Expansión del Cementerio y Criptas de San Jude [COMPLETADO ✅]
- [x] **Ampliación del Territorio 3D (`z: -23.5` a `-48.0`)**:
  - Portón gótico de hierro forjado que rota 80° al vencer a Morwenna o usar la llave.
  - Expansión dinámica del límite de desplazamiento del jugador de `-23.0` a `-46.5`.
  - 4 lápidas celtas destruibles (+20 EXP cada una) y un Gran Sarcófago Monumental (+30 EXP).
  - 2 pebeteros de fuego espectral cian (`0x00e5ff`) con iluminación nocturna.
  - Fachada del Mausoleo de las Criptas de San Jude con portal abisal a la mazmorra.
- [x] **Enemigo 4: Penitente de la Cripta (Esqueleto Guardián)**:
  - Guerrero esquelético animado con claymore herrumbrosa, ojos cian resplandecientes y manto fúnebre.
  - Patrulla entre lápidas, FSM completa, barra de salud `#p3d-skeleton-hud`.
  - Remate ejecutor `[E]` con +180 EXP y botín de consumibles.

---

### 8. Sistema de Alquimia y Botica en el Caldero de Elowen [COMPLETADO ✅]
- [x] **Dominio DDD de Alquimia (`src/domain/alchemy/`)**:
  - `AlchemyRecipe.ts`: Materiales canónicos (`herb_silverleaf`, `ash_purified`, `blood_hound`, `water_blessed`, `salve_base`) y recetas canónicas (`craft_maiden_balm`, `craft_saint_jude_rosary`, `craft_consecrated_oil`, `craft_elixir_sunset`).
  - `AlchemyPot.ts`: Aggregate root con transacciones atómicas, validación estricta de ingredientes y recompensas de EXP.
- [x] **Caldero 3D de Elowen en Three.js**:
  - Hogar de carbones incandescentes, trípode de hierro forjado, caldero de bronce martillado y líquido esmeralda en ebullición.
  - Luz puntual verde pulsante con animación de vapores ascendentes y mesa con redomas de boticaria.
  - Detección de proximidad contextual a < 2.6m con insignia `⚗️ [E] CALDERO DE ELOWEN: BOTICA & ALQUIMIA`.
- [x] **Modal de Botica y Jerarquía de Entrada (`InputContext: 'alchemy'`)**:
  - Atajo global `[B]` y botón permanente en el HUD superior `⚗️ [B] BOTICA`.
  - Rejilla reactiva de recetas con comprobación de ingredientes en vivo, indicador de bolsa y botón de síntesis con destello lumínico en el caldero.
- [x] **Sistema Unificado de Drops de Enemigos y Objetos**:
  - Botín de materiales en Sabueso de Ceniza, Cultista del Incensario, Flagelante y Penitente de la Cripta (tanto en golpes normales como en remates `[E]`).
  - 45% de probabilidad de soltar hierbas o ungüentos al destruir barriles o cajas.

---

## 🚀 Próximas Prioridades (Siguiente Sprint)

### 9. Descenso a los Interiores de las Criptas de San Jude (Dungeon Crawler) [COMPLETADO ✅]
- [x] **Transición Subterránea Interactiva (`transitionToArea`)**:
  - Proximidad contextual en portal del Mausoleo (`z: -44.5`) con prompt `🚪 [E] DESCENDER A LAS CRIPTAS DE SAN JUDE`.
  - Fundido en negro cinemático con tarjeta de título gótica sobreimpresa y sonido de piedra milenaria.
  - Escaleras ascendentes hacia la superficie con prompt `🚪 [E] SUBIR A LA SUPERFICIE DE OAKHAVEN`.
- [x] **Arquitectura y Ambientación de Mazmorra 3D**:
  - Salón de 46m x 13m con suelo de losas antiguas, muros macizos y bóveda gótica a 5.2m de altura.
  - 7 pares de columnas cilíndricas con arcos fajones transversales y apliques de antorchas cálidas (`0xff7722`).
  - Gran Altar fúnebre con cruz de piedra y pebeteros de fuego espectral cian (`0x00e5ff`).
- [x] **Trampas de Espinas Mecánicas Procedurales (`SpikeTrap3D`)**:
  - Dos losas de bronce con 8 estacas retráctiles de acero cada una en `(-1.2, -80)` y `(1.5, -91)`.
  - Activación por proximidad (1.2m), chasquido metálico (`playSpikeTrap`), 25 de daño físico y cooldown de rearme.
- [x] **Sarcófagos Interactivos & Emboscada de Penitente**:
  - *Sarcófago Profanado* `(-3.8, -85)`: Deslizamiento de losa, +40 EXP, Hojas de Plata y Agua Bendita.
  - *Sarcófago Sellado* `(3.8, -97)`: Estallido de la losa y despertar del *Penitente de las Catacumbas* esquelético.
- [x] **Sub-Jefe: El Inquisidor Caído de San Jude**:
  - Modelo 3D con coraza de hierro negro, sombrero inquisitorial piramidal de ala ancha, tabardo carmesí y ojos candentes.
  - Maza pesada de púas y Escudo de fuego oscuro con bloqueo frontal activo del 60% (`dot < -0.2`).
  - Ataque devastador de martillazo en área telegrafiado (*Holy Curse AoE Slam*) con onda de choque de 3.8m.
  - Barra de salud propia `#p3d-inquisitor-hud`, ventana de vulnerabilidad con remate crítico `[E]` (+65 daño).
  - Recompensas: +250 EXP, *Sello de la Inquisición Caída*, Agua Bendita x2, Ceniza Purificada x2 y restauración completa de salud.

### 10. Sistema de Audio Procedural / Web Audio API [COMPLETADO ✅]
- [x] **Sintetizadores Procedurales Nativos sin Dependencias Externas**:
  - `playSpikeTrap()`: Doble oscilador sierra/cuadrada simulando el resorte y choque de púas metálicas.
  - `playCryptDoor()`: Sub-graves triangulares y modulación de fricción de losas de piedra y goznes.
  - `playHolyCurse()`: Disonancia coral amenazante para hechizos oscuros y ataques inquisitoriales.
  - `playMaceImpact()`: Golpe seco contundente de hierro y masa roma.
  - `playCauldronBubble()`: Tren de burbujas en ebullición para la síntesis alquímica de la botica.
  - `playHeartbeat()`: Doble pulso sinusoidal grave (lub-dub 70->30 Hz) activado automáticamente al tener <30% de salud.
  - `playHolyFlash()`: Acordes de campana resonante brillante con caída exponencial para parries exitosos y remates de jefes.
  - `playFlaskExplosion()`: Estallido de cristal, ruido blanco filtrado de deflagración y rugido de fuego fatuo.
  - `playArrowSwitch()`: Clic de tensión de cuerda y muesca metálica al cambiar de proyectil en combate.

### 11. Arsenal de Municiones Elementales para Khaterine [COMPLETADO ✅]
- [x] **Sistema de Tipos de Flecha en Tiempo Real (`src/domain/combat/ArsenalManager.ts`)**:
  - *Flechas Abisales (`abyssal`)*: Munición infinita base con daño sombrío equilibrado (28/48 daño).
  - *Flechas de Fuego Fatuo (`fire`)*: Proyectil con fuego naranja (`0xff5500`), ignición de 6 ticks de 4 de daño DoT a lo largo de 3s.
  - *Flechas de Plata Consagrada (`silver`)*: Proyectil resplandeciente cian-plata (`0x00e5ff`), daño masivo de postura (2.5x), aturdimiento extendido a 2.0s y perforación total del escudo frontal del Inquisidor y Penitentes.
- [x] **Selector Interactivo en HUD y Atajos de Combate**:
  - Distintivo `#p3d-weapon-badge` reactivo que muestra el tipo activo y stock restante en tiempo real.
  - Ciclo con un solo clic sobre la insignia o teclas dedicadas `[1]`, `[2]`, `[3]`.
  - Fallback automático a flecha abisal infinita si se agotan las municiones especiales.

### 12. Frascos Arrojadizos de Fuego Fatuo para Thomas [COMPLETADO ✅]
- [x] **Arma Arrojadiza Especial con Balística Física (`[T]`)**:
  - Botella de vidrio consagrado con líquido ígneo resplandeciente y luz puntual naranja.
  - Trayectoria parabólica física con gravedad (`14 m/s²`) y rotación tridimensional sobre ejes X y Z.
  - Impacto por colisión directa o choque contra el suelo a `y <= 0.2m`.
- [x] **Onda de Choque Radial y Daño en Área (AoE)**:
  - Estallido de 3.8m de radio con esfera de fuego expansiva de disipación suave.
  - 55 de daño de área + quemadura DoT a todos los enemigos cercanos (Sabueso, Cultista, Flagelante, Penitente, Inquisidor, Morwenna) y destrucción inmediata de elementos del entorno.
  - Fallback a desarmado táctico de espada corta cuando el stock de frascos es 0.

### 13. Nuevas Fórmulas de Alquimia en el Caldero de Elowen [COMPLETADO ✅]
- [x] **Expansión de Recetas Canónicas en `AlchemyRecipe.ts`**:
  - `craft_fire_arrows`: 1 Esencia de Fuego Fatuo (`blood_hound`) + 2 Cenizas Purificadas (`ash_purified`) -> 5 Flechas de Fuego Fatuo.
  - `craft_silver_arrows`: 2 Hojas de Plata (`herb_silverleaf`) + 1 Agua Bendita (`water_blessed`) -> 5 Flechas de Plata Consagrada.
  - `craft_holy_fire_flask`: 2 Esencias de Fuego Fatuo + 1 Ungüento Base (`salve_base`) + 1 Agua Bendita -> 2 Frascos de Fuego Fatuo.
- [x] Rejilla de la Botica interactiva con comprobación de stock y actualización instantánea de la bolsa.

### 14. Efectos Cinemáticos de Pantalla y Post-FX en Tiempo Real [COMPLETADO ✅]
- [x] **Viñeta de Daño Periférico (`#p3d-damage-vignette`)**:
  - Resplandor carmesí pulsante en los bordes de la pantalla con intensidad proporcional al impacto (0.6 a 0.85).
  - Activado en trampas de pinchos, estocadas de jefes, embestidas y ataques de cultistas.
- [x] **Trauma y Sacudida de Cámara (`Screen Shake / Trauma Decay`)**:
  - Desplazamiento pseudoaleatorio exponencial de la cámara (`trauma² * 0.16`) que decae suavemente con el delta time.
- [x] **Latido de Agonía por Baja Salud**:
  - Detección reactiva cuando HP < 30% del máximo: pulso rítmico de viñeta roja acompañado del sintetizador de latido cardíaco.
- [x] **Destello Sagrado (`#p3d-holy-flash`)**:
  - Flare radiante dorado/cian en pantalla entera al ejecutar un Parry perfecto o al derrotar a jefes mayores (Madre Morwenna, Inquisidor Caído).

### 15. Exportación e Importación de Partidas en Archivo JSON [COMPLETADO ✅]
- [x] **Respaldo Portátil de Guardado (`GameSaveManager`)**:
  - Botón `[💾 EXPORTAR JSON]`: Descarga instantánea del archivo `the_light_in_the_darkness_save_<timestamp>.json` con toda la progresión, bolsa de acólito, reliquias, héroes y mundo.
  - Botón `[📂 IMPORTAR JSON]`: Selector de archivo con validación estricta de esquema y tipos numéricos, restaurando el estado completo del juego sin necesidad de recargar la página.

---

## 🚀 Próximas Prioridades (Siguiente Sprint)

### 1. El Bosque del Sauce Negro (Exterior Salvaje)
- Escenario exterior de raíces retorcidas, niebla densa y ramas que bloquean la visión.
- Santuario salvaje del Sauce Negro con nuevos enemigos (Acechadores de Raíces y Bestias Abisales).
- Expansión de flechas arcanas de Khaterine con tipos de munición elemental sintetizables en botica.

### 2. Sistema de Shaders y Post-Procesado en 3D
- Bloom sagrado en antorchas, velas y pebeteros.
- Viñeta y aberración cromática en estados de daño o aturdimiento.

---

## 🚀 Prioridades a Medio Plazo (Expansión de Escenarios & Sistemas)

### 1. Nuevos Escenarios Canónicos (Basados en la Novela)
- **El Bosque del Sauce Negro**:
  - Terreno de raíces retorcidas, niebla densa y ramas que bloquean la visión.
  - Escenario principal de Khaterine antes de unirse a Thomas.
- **Las Criptas de San Jude**:
  - Mazmorra subterránea con trampas de pinchos, ataúdes de piedra y esqueletos de penitentes.
- **Los Muros de Londinium**:
  - Fortaleza gótica amurallada donde la Inquisición tiene su bastión central.

### 2. Guardado y Progresión Persistente
- Guardado automático en puntos de santuario (cruces o fuentes con velas).
- Persistencia en `localStorage` con opción de exportar e importar archivo `.save` en formato JSON.
- Registro de capítulos completados de la novela en el menú de pausa.

### 3. Árbol de Habilidades de Thomas y Khaterine
- Puntos de EXP obtenidos al derrotar enemigos y romper props:
  - Thomas: *Golpe de Escudo*, *Corte Ascendente*, *Furia del Monaguillo*.
  - Khaterine: *Lluvia de Flechas Sombrías*, *Paso Espectral*, *Disparo Penetrante Doble*.

---

## 🌌 Visión a Largo Plazo (Pulido Final & Producción)

### 1. Sistema de Shaders y Post-Procesado en 3D
- **Bloom**: Resplandor sagrado en velas, fuego de la pira y flechas de plasma.
- **Aberración Cromática & Viñeta**: Borde oscuro y sutil distorsión en momentos de baja salud o aturdimiento.
- **Niebla Volumétrica por Shaders**: Humo que se dispersa al pasar los personajes corriendo o al disparar flechas.

### 2. Actuación de Voz y Banda Sonora Grabada
- Voces ambientales para los monólogos clave de Elowen, Shalem y Morwenna.
- Temas orquestales completos mezclados con los drones procedurales de Web Audio.

### 3. Publicación Multiplataforma
- Empaquetado para escritorio con **Electron** o **Tauri** (Windows, Linux, macOS).
- Soporte completo para mandos (Gamepad API para Xbox, PlayStation y Switch).
- Integración en Steam con logros y guardado en la nube.
