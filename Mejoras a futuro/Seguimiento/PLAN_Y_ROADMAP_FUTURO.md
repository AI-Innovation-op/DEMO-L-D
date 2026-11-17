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

---

## 🚀 Próximas Prioridades (Siguiente Sprint)

### 1. Segundo Enemigo Especializado: Flagelante con Cadena
- Ataques de látigo con rango extendido (4.5m) que barren en semicírculo horizontal.
- Exige esquiva con `[ESPACIO]` o bloqueo firme para evitar derribo.

### 2. Árbol de Habilidades y EXP de Héroes
- Inversión de los puntos de EXP acumulados al romper barriles (+15) o derrotar cultistas (+100):
  - **Thomas**: *Golpe de Escudo Santo*, *Corte Doble Ascendente*, *Tenacidad Inquebrantable*.
  - **Khaterine**: *Disparo Abisal Perforante*, *Paso Umbrío*, *Lluvia de Flechas*.

### 3. Sistema de Guardado Persistente (Checkpoints en Santuario)
- Guardado en `localStorage` al rezar con el Padre Cedric o beber del pozo sagrado.
- Serialización de inventario, reliquias equipadas y progreso de misiones.

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
