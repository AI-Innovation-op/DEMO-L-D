# 📜 The Light in the Darkness — Reporte Histórico de Entregas & Hitos

Este documento consolida el progreso completo de desarrollo del videojuego **The Light in the Darkness**, basado en la novela original de 20 capítulos escrita por Kevin.

---

## 📌 Hitos y Entregas Completadas

### ✦ Entrega 1: Fundación de Arquitectura Hexagonal & Motor 2D
- **Arquitectura Limpia**: Separación estricta en capas:
  - `domain`: Entidades puras (`CombatState`, `StoryProgress`, `ShalemCompanion`).
  - `application`: Puertos e interfaces de servicios (`IAudioPort`, `IDialoguePort`).
  - `infrastructure`: Adaptadores de audio procedural (`WebAudioSoundAdapter`) y diálogos (`NovelDialogueAdapter`).
  - `presentation`: Motor Canvas 2D a 60 FPS con bucle desacoplado (`GameEngine.ts`, `OakhavenExperience.ts`).
- **Máquina de Estados de Thomas (FSM)**:
  - Estados: `IDLE`, `WALK`, `ATTACK_LIGHT`, `ATTACK_HEAVY`, `DODGE`, `GUARD`, `STUNNED`, `DISARMED`.
  - Mecánica de desarmado y combate a puños limpios al arrojar la espada.

---

### ✦ Entrega 2: Sistema de Combate Táctico Souls-Like / Beat 'em Up
- **Esquivas con Ventana de Invulnerabilidad (i-frames)**: Rodar ágil con `[ESPACIO]`.
- **Parry Preciso (250 ms)**: Desvío oportuno con `[L]` que desestabiliza a los enemigos y rompe su postura.
- **Barra de Postura y Aturdimiento**: Desgaste de guardia que deja a los rivales vulnerables.
- **Remates Cinemáticos (Finishers)**: Pulsar `[E]` sobre enemigos aturdidos para desencadenar impactos críticos con cámara lenta y destello.
- **Retroceso Físico (Knockback)** y números de daño flotantes proyectados en pantalla.
- **Batería de Tests Unitarios**: 21 pruebas automatizadas con Vitest ejecutadas y validadas con 100% de éxito.

---

### ✦ Entrega 3: Integración Canónica de la Novela & Audio Procedural
- **Adaptación Fiel de los 20 Capítulos**: Textos, lore y citas exactas extraídas de `docs/novela/` incorporadas en el sistema de diálogos.
- **Personajes Canónicos Activos**:
  - **Elowen de Oakhaven**: Doncella de la Luz Argéntea que cura y fortalece el espíritu.
  - **Padre Cedric**: Párroco veterano que imparte bendiciones sagradas y advertencias sobre el Crisol.
  - **Khaterine**: Cazadora proscrita del Sauce Negro con pactos arcanos y bonificación de agilidad.
  - **Shalem**: Gato negro sabio y sarcástico que aconseja en los puntos de descanso.
- **Paisaje Sonoro Litúrgico en Web Audio**:
  - Droning polifónico de órgano catedralicio filtrado por paso bajo (frecuencias en quinta abierta: 110Hz, 164.8Hz, 220Hz).
  - Repiques periódicos de campanas góticas cada 12 segundos con parciales armónicos reales y decadencia natural.
  - Melodía medieval arpegiada en modo menor.
  - Efectos de sonido dinámicos: tajos, parry metálico, esquiva sibilante, advertencias telegrafiadas y crujido de madera.

---

### ✦ Entrega 4: Jefa Madre Morwenna — Vigía de la Gran Pira
- **Jefa de Fin de Zona en Oakhaven**:
  - Encuentro climático en la Gran Pira al final de la calle adoquinada.
  - Barra de salud propia de jefa con iluminación carmesí.
  - Ataque del **Crisol de Fuego Sagrado**: llamada de llamas con indicador telegrafiado en forma de octaedro rojo pulsante.
  - Posibilidad de parry sobre el crisol para desatar una ventana prolongada de aturdimiento y remate.
  - Cinemática de purificación y bendición al derrotarla.

---

### ✦ Entrega 5: Mundo 3D de Oakhaven (Three.js) & Conmutación Dual
- **Mundo 3D Completo**:
  - Adoquines procedurales con textura generada en canvas y mapeo repetido.
  - Casonas góticas con techos a dos aguas, vigas de madera y ventanas con luz titilante.
  - Farolas victorianas de hierro forjado con luz puntual cálida que oscila orgánicamente.
  - Santuario del Padre Cedric con cruz monumental y velas votivas.
  - Pozo de piedra donde Shalem descansa y ronronea.
  - Gran Pira al fondo de la calle con llamas vivas y partículas de brasas flotantes.
- **Cámara Dual**: Modo Isométrico 3/4 por defecto y Modo Tercera Persona con `[C]`.
- **Sistema Dual de Héroes con `[TAB]`**:
  - **Thomas**: Espada corta, desarmado a puños y espada arrojadiza.
  - **Khaterine**: Cazadora ágil con túnica oscura, velo abisal y **Arco Abisal**. Dispara flechas mágicas de plasma balístico (`[J]` rápida, `[K]` cargada) y levanta la **Barrera Abisal** (`[L]`).
  - Cuando juegas con un héroe, el otro aparece como NPC interactivo en la aldea con diálogos propios.
- **Props Destructibles**:
  - Barriles y cajas de la aldea que se rompen al recibir tajos o flechas.
  - Física de astillas cúbicas que saltan y rebotan en el suelo.
  - Recompensa de `+15 EXP` con sonido crujiente procedural.
- **Control de Audio**: Botón en pantalla y tecla `[M]` para silenciar o activar la música sacra.

---

## 📊 Métricas del Proyecto
- **Lenguaje**: TypeScript 100% estricto.
- **Framework Gráfico 2D**: HTML5 Canvas nativo de alto rendimiento (60 FPS sin caídas).
- **Framework Gráfico 3D**: Three.js con sombras suaves PCFSoft, ACESFilmic Tone Mapping y niebla exponencial.
- **Audio**: Web Audio API nativo sin dependencias de archivos externos.
- **Tests**: 21 pruebas unitarias vitest aprobadas.
- **Repositorio**: Sincronizado en GitHub (`main`).
