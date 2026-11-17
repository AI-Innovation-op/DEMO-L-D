# 🗺️ The Light in the Darkness — Plan y Hoja de Ruta de Mejoras Futuras

Este documento establece las prioridades de desarrollo, mecánicas planeadas y expansiones de contenido tanto para la vertiente **2D** como para la vertiente **3D**.

---

## 🎯 Prioridades a Corto Plazo (Sprint Inmediato)

### 1. Sistema de Inventario y Reliquias
- **Bolsa de Acolito**:
  - Objetos consumibles: *Bálsamo de la Doncella* (cura 35 HP), *Rosario de Madera* (restaura postura), *Ceniza Consagrada* (añade daño sagrado a los ataques durante 15s).
  - Menú de inventario accesible con `[I]` tanto en 2D como en 3D.
- **Reliquias Equipables**:
  - *Pluma del Sauce Negro* (reduce el coste de esquiva un 20%).
  - *Cruz de Oakhaven* (aumenta la ventana de parry de 250ms a 320ms).
  - *Amuleto de Shalem* (otorga aviso anticipado de ataques no bloqueables).

### 2. Patrullas de Enemigos y Variedad de Cultistas
- **Cultista Portador de Incensario**:
  - Ataque en área con humo tóxico/abismal que reduce la postura si se permanece dentro.
- **Flagelante con Cadena**:
  - Ataques de látigo de largo alcance que exigen esquiva lateral en vez de parry directo.
- **Sistema de Rutas de Patrulla**:
  - Enemigos que caminan entre farolas y reaccionan al sonido de pasos o de barriles rotos.

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
