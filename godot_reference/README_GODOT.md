# Prototipo 3D en Godot 4.x — The Light in the Darkness

> ⚠️ **PROPIEDAD INTELECTUAL Y AUTORÍA**
> Universo, personajes (Thomas, Shalem, Sabueso de Ceniza), lore y mecánicas concebidas exclusivamente por **Kevin © 2026**.

Este directorio contiene la arquitectura de referencia lista para importar en **Godot Engine 4.3+** (Forward+ / Mobile) para la **Cuarta Entrega: Prueba pequeña en 3D**.

---

## 🎮 Contenido del Proyecto

1. `project.godot`:
   - Configuración de resolución (1280×720, escalado adaptable).
   - Mapeo unificado de controles canónicos:
     - Movimiento: `W`, `A`, `S`, `D`.
     - Ataque ligero: `J`.
     - Ataque pesado: `K`.
     - Guardia / Parry: `L`.
     - Esquiva: `Espacio`.
     - Lanzar arma: `T`.
     - Recoger / Interactuar: `E`.
2. `scripts/PlayerController.gd`:
   - Controlador de CharacterBody3D para Thomas.
   - Rotación cinemática fluida hacia la dirección de movimiento.
   - Mecánica de desarme y lanzamiento de espada.
   - I-Frames y deslizamiento de esquiva.
3. `scripts/EnemyAI.gd`:
   - Inteligencia artificial para el Sabueso de Ceniza / Cultista.
   - Máquina de estados con telegrafiado visible (*Wind-up* de 480 ms) y aturdimiento por parry.

---

## 🚀 Cómo abrir en Godot Engine

1. Descarga e inicia **Godot Engine 4.3** (Standard version).
2. Haz clic en **Importar** (Import).
3. Selecciona la carpeta `godot_reference/` y abre `project.godot`.
4. Pulsa **F5** (o el botón Play arriba a la derecha) para ejecutar la escena.
