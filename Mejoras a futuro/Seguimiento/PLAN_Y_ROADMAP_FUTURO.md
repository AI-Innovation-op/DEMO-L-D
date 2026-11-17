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

## 🚀 Próximas Prioridades (Siguiente Sprint)

### 1. Sistema de Alquimia y Fabricación en el Caldero de Elowen
- Puesto interactivo junto a la boticaria Elowen (`[E]` para abrir mesa de mezclas).
- Recetas canónicas para sintetizar bálsamos mejorados, agua bendita bendecida y elixires de postura combinando restos botados por cultistas y cenizas consagradas.

### 2. Descenso a los Interiores de las Criptas de San Jude (Dungeon Crawler)
- Transición interactiva en el portal del mausoleo para ingresar al nivel subterráneo.
- Catacumbas con trampas de estacas, sarcófagos con penitentes durmientes y pasillos con antorchas.
- Jefe secundario opcional: *Inquisidor de las Catacumbas*.

### 3. Sistema de Audio Procedural / Web Audio API
- Síntesis de sonido ambiental (viento tenebroso, crujido de fuego de las antorchas).
- Efectos de impacto metálico de espadas, parry resonante, zumbido de flechas de plasma y rugido de fuego de Morwenna.

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
