# The Light in the Darkness (v0.5.2) — Double Blood

> **Arcade-Action Adventure & Metroidvania 2.5D** ambientado en un medievo anglosajón teocentrista oscuro.
> Desarrollado con **Phaser 3 + TypeScript + Vite** bajo principios rigurosos de **Domain-Driven Design (DDD)**.

---

> [!IMPORTANT]
> ### 🛡️ PROPIEDAD INTELECTUAL, UNIVERSO NARRATIVO Y DERECHOS DE AUTOR
> **Toda la obra literaria original, universo narrativo, personajes, mitología, facciones, manuscritos y lore de este proyecto fueron creados y son propiedad exclusiva de KEVIN.**
> 
> *Todos los derechos de autor reservados © Kevin — "The Light in the Darkness" / "Double Blood" (2026).*
> 
> *Queda terminantemente prohibida la copia, reproducción, distribución, adaptación, comercialización o apropiación no autorizada de esta narrativa, sus textos canónicos, sus personajes (Thomas, Khaterine, Elowen, Shalem, Padre Cedric, Madre Morwenna, Capitán Vane, Rex Malphas / Alaric, Astaroth) y su cosmología sin el consentimiento expreso y por escrito del autor.*

---

## 📚 Manuscritos Canónicos de la Novela (20 Capítulos en 5 Actos)

Los textos completos de la obra literaria de Kevin se encuentran archivados en el directorio [docs/novela/](file:///d:/Edged/docs/novela/):

* 📜 **[Compendio General e Índice de la Obra](file:///d:/Edged/docs/novela/INDICE_Y_COMPENDIO.md)**: Fichas de autor, mapa de personajes, facciones, cosmología y registro de derechos de autor.
* 🌒 **[Prólogo: La Noche de la Luna Roja](file:///d:/Edged/docs/novela/00_PROLOGO_Y_COSMOLOGIA.md)**: El sacrificio de las nueve brujas, el nacimiento marcado de Thomas, el rescate clandestino de Khaterine, la infancia vigilada de Elowen y el dogma del Cáliz Solar.
* ⚔️ **[Acto I: Cenizas en Oakhaven (Caps. I a VI)](file:///d:/Edged/docs/novela/ACTO_1_OAKHAVEN_CAPS_01_06.md)**: Thomas monaguillo, el pájaro de madera tallado, la invasión de Madre Morwenna, el sacrificio del Padre Cedric, el despertar del fuego negro y la captura de Elowen.
* 🔔 **[Acto II: El Campanario y Granero del Sur (Caps. VII a IX)](file:///d:/Edged/docs/novela/ACTO_2_CAMPANARIO_CAPS_07_09.md)**: El martirio de Elowen sobre sal gruesa, el mensaje en el pájaro de madera, el desentierro del *Colmillo del Sauce Negro* y la destrucción del crisol inquisitorial.
* 🌉 **[Acto III: El Gran Puente de Piedra — El Camino de los Herejes (Caps. X a XIII)](file:///d:/Edged/docs/novela/ACTO_3_GRAN_PUENTE_CAPS_10_13.md)**: La marcha en la niebla fluvial, la liberación del convoy de campesinos de Martín y Tobías, el duelo contra el escudo de torre del Capitán Áureo Vane y la toma del mandoble *Falso Veredicto*.
* 👑 **[Acto IV: Londinium — La Ciudadela Dorada (Caps. XIV a XVII)](file:///d:/Edged/docs/novela/ACTO_4_LONDINIUM_CAPS_14_17.md)**: La entrada por acueductos, el Salón de los Espejos, la revelación desgarradora de Rex Malphas como Alaric (padre de Thomas y traidor del aquelarre), el Decreto Real de la *Ley del Deseo* y el colapso del palacio.
* 🌌 **[Acto V: La Catedral Invertida — El Sol del Abismo (Caps. XVIII a XX)](file:///d:/Edged/docs/novela/ACTO_5_CATEDRAL_INVERTIDA_CAPS_18_20.md)**: El descenso a la arquitectura flotante sobre el vacío cósmico, la forja sagrada de *Alba Gris* con la Gota de Luz Divina de Elowen y el fuego negro de Thomas, el juicio final contra Astaroth y el primer amanecer sobre Albion.

---

## 👥 Personajes Principales

| Personaje | Rol Canónico | Estilo de Juego / Mecánica |
|---|---|---|
| **Thomas** | Protagonista híbrido, nacido del sacrificio de las 9 brujas. | Ágil, combate cuerpo a cuerpo con espada corta, fuego negro destructivo y esquiva fluida con estela. |
| **Khaterine** | Exiliada del Sauce Negro, protectora bajo hábito monacal. | Combate a media distancia con proyectiles violetas, alta resistencia física, apoyo místico y dagas rituales. |
| **Shalem** | Gran Marqués de las Brasas atrapado en el cuerpo de un gato negro. | Guía sarcástico en 2.5D, tutor de combate, juez del minijuego de *Level Up* y guardián moral. |
| **Elowen** | Hermana de destino de Thomas, símbolo de pureza y perdón. | PNJ central; su *Gota de Luz Divina* permite forjar el arma definitiva de la redención. |
| **Padre Cedric** | Sacerdote disidente de Oakhaven leal a la verdad. | Entrega el *Rosario de Madera*, el incensario litúrgico arrojadizo y la primera tablilla profética. |
| **Madre Morwenna** | Jefa del Acto I, inquisidora fanática del Cáliz Solar. | Ataques con báculo de fuego, invocación de Acechadores de Ceniza y embestidas piroclásticas. |
| **Guardián del Crisol** | Jefe del Acto II, verdugo de bronce del Campanario. | Martillazos de fundición de área, salpicaduras de salitre y defensa acorazada pesada. |
| **Capitán Áureo Vane** | Jefe del Acto III, comandante de la guardia del Gran Puente. | Escudo de torre impenetrable, mandoble pesado y barreras de contención marcial. |
| **Rex Malphas (Alaric)** | Jefe del Acto IV, monarca corrupto de Londinium y padre de Thomas. | Combate en dos fases: esgrima áurea y despertar cósmico con la *Ley del Deseo*. |
| **Astaroth** | Jefe del Acto V, entidad primordial y Padre de las Cenizas. | Lluvia de meteoros de vacío, ondas gravitatorias y tentación moral de juicio absoluto. |

---

## 🎮 Controles Unificados (In-Game & HUD)

| Tecla / Control | Acción | Descripción |
|---|---|---|
| `[W]` `[A]` `[S]` `[D]` o Flechas | **Movimiento en 2.5D** | Desplazamiento lateral y profundidad en la arena de combate con alineación precisa al suelo. |
| `[J]` | **Ataque Ligero / Magia** | Cadenas de golpes rápidos (Thomas: tajo cuerpo a cuerpo / Khaterine: proyectil violeta arcano). |
| `[K]` | **Ataque Pesado (x1.6)** | Golpe contundente que inflige daño masivo y destroza la postura enemiga. |
| `[L]` | **Guardia / Parry Perfecto** | Bloqueo frontal que reduce daño; si se pulsa justo antes del impacto, desvía y aturde al agresor. |
| `[ESPACIO]` | **Esquiva con Estela** | Dash veloz con cuadros de invulnerabilidad (*i-frames*) y silueta sombría residual. |
| `[TAB]` | **Cambio de Personaje** | Alterna el control instantáneamente entre Thomas y Khaterine. El aliado acompaña en pantalla. |
| `[T]` o `[Q]` | **Lanzar Arma** | Arroja el arma equipada para aturdir a distancia y quebrar escudos. |
| `[E]` | **Recoger / Interactuar** | Recoge armas desarmadas del suelo y abre diálogos con NPCs y rescatados. |
| `[C]` | **Charlar Lore** | Inicia conversaciones contextuales de historia con el compañero de viaje. |
| `[M]` | **Minijuego de Shalem** | Se activa al llenar la barra de *Level Up* para obtener bendiciones y mejoras permanentes de atributos. |
| `[P]` | **Códice & Menú gótico** | Pausa la partida, consulta estadísticas de alma, arsenal, profecías, crónicas y acceso al Menú Principal. |
| `[1]` a `[5]` | **Atajos de Actos** | Acceso de depuración directo para transitar entre los 5 Actos de la campaña. |

---

## 🏰 Los 5 Actos Jugables

1. **Acto I: Oakhaven — Las Cenizas de la Inquisición**
   * *Escenario:* La aldea de Oakhaven bajo el asedio nocturno del Cáliz Solar.
   * *Jefa:* Madre Morwenna.
   * *Objetivo:* Defender la parroquia del Padre Cedric, repeler a los Acechadores de Ceniza y quebrar a la Inquisición.
2. **Acto II: El Campanario y Granero del Sur**
   * *Escenario:* La torre fortificada donde Elowen permanece martirizada sobre sal gruesa.
   * *Jefe:* Guardián del Crisol / Madre Morwenna del Crisol.
   * *Objetivo:* Desenterrar el *Colmillo del Sauce Negro* bajo la losa del granero, quebrar el crisol y rescatar a Elowen.
3. **Acto III: El Gran Puente de Piedra — El Camino de los Herejes**
   * *Escenario:* El viaducto monumental rodeado de densa niebla fluvial y el convoy de carretas.
   * *Jefe:* Capitán Áureo Vane.
   * *Objetivo:* Liberar a los prisioneros desterrados de Martín y Tobías, quebrar el escudo de torre de Vane y reclamar el *Falso Veredicto*.
4. **Acto IV: Londinium — La Ciudadela Dorada**
   * *Escenario:* Las calles monumentales y el trono astral del palacio de Londinium.
   * *Jefe:* Rex Malphas (Alaric).
   * *Objetivo:* Atravesar el Salón de los Espejos, confrontar la verdad del padre biológico traidor y quebrar la *Ley del Deseo*.
5. **Acto V: La Catedral Invertida — El Sol del Abismo**
   * *Escenario:* Santuario cósmico suspendido de cabeza sobre el vacío estelar y el Sol del Abismo.
   * *Jefe Final:* Astaroth, el Padre de las Cenizas.
   * *Objetivo:* Forjar la espada definitiva *Alba Gris* uniendo la Gota de Luz Divina de Elowen con el Fuego Negro de Thomas, derrotar a Astaroth y desatar el primer amanecer sobre Albion.

---

## ⚙️ Innovaciones Técnicas y Jugabilidad (v0.5.2)

* **Persistencia Integral de Partida (`SessionStateStore` v1.0.0):**
  Guarda en memoria y `localStorage` el nivel, experiencia acumulada, salud, postura, armas desbloqueadas, reliquias e hitos de historia. Los avances de Thomas y Khaterine se conservan al cambiar de acto, recargar o continuar partida.
* **Protocolo de Victoria Coherente:**
  Al derrotar al jefe de cada acto, todos los esbirros menores quedan neutralizados de inmediato, el jugador adquiere invulnerabilidad absoluta y el HUD actualiza el objetivo en tiempo real hacia la salida norte.
* **Calibración y Normalización Visual:**
  Proporciones pixel art calibradas sin estiramientos. Sprites de Elowen, Morwenna, Guardián del Crisol y los protagonistas alineados con apoyos en el suelo y cajas de colisión independientes.
* **Menú Modal de Códice & Ajustes `[P]` Pulido:**
  Aislamiento visual completo (ocultamiento de HUD de fondo), acceso directo para volver a la partida o retornar al Menú Inicial.
* **Selector de Actos en Portada ("Continuar partida"):**
  Permite seleccionar cualquiera de los 5 Actos desbloqueados con persistencia de atributos del personaje.
* **Audio Procedural en Web Audio API:**
  Efectos de sonido sintetizados en tiempo real (tajos, parries, fuego oscuro, pasos y melodías góticas) sin dependencias pesadas externas.

---

## 🏛️ Arquitectura del Software (Domain-Driven Design - DDD)

```
src/
├── domain/                      # Reglas puras de negocio (agnósticas de la tecnología)
│   ├── character/               # Character, Stats, LevelUpProgress, Dual-Switch
│   ├── combat/                  # DisarmManager, ComboSystem, CombatTypes
│   ├── weapon/                  # Entidades de Armas (Espada Corta, Alba Gris, etc.)
│   ├── companion/               # ShalemCompanion (Sarcasmo, Guía, Minijuegos)
│   ├── boss/                    # Aggregate Root Boss (Morwenna, Vane, Malphas, Astaroth)
│   ├── enemy/                   # Entidades de esbirros (Acechador, Monje, Guardia Áureo)
│   ├── mission/                 # Misiones y Fragmentos de la Profecía Original
│   ├── story/                   # Hitos narrativos y seguimiento de capítulos
│   ├── save/                    # SessionStateStore (Persistencia cross-act v1.0.0)
│   └── shared/                  # EventBus desacoplado, Vector2, ValueObjects
│
├── application/                 # Casos de uso y orquestación de la aplicación
│   ├── usecases/                # CombatUseCases, ShalemUseCases
│   └── ports/                   # Interfaces IAudioPort, IDialoguePort
│
├── infrastructure/              # Adaptadores técnicos concretos
│   ├── audio/                   # WebAudioSoundAdapter (Síntesis procedural)
│   ├── dialogue/                # DialogueRepository (Diálogos canónicos completos)
│   └── graphics/                # ProceduralAssetGenerator (Generación de respaldo)
│
└── presentation/                # Capa visual e interactiva (Phaser 3)
    ├── scenes/
    │   ├── BootScene.ts         # Precarga de spritesheets, fondos y audio
    │   ├── TitleScene.ts        # Portada maestra, selector de héroe y selector de actos
    │   ├── LoadingScene.ts      # Pantallas de carga Ken Burns con crónicas
    │   ├── StoryIntroScene.ts   # Prólogo interactivo con Shalem
    │   ├── GameScene.ts         # Bucle 2.5D, combate, jefes y progresión de los 5 Actos
    │   ├── HUDScene.ts          # Salud, postura, experiencia, combos, leyendas y jefes
    │   ├── MenuModalScene.ts    # Códice gótico, estado, arsenal, profecía y controles
    │   ├── CharacterDialogueScene.ts # Diálogos in-game con retratos
    │   ├── InventoryScene.ts    # Arsenal rápido y tablillas sagradas
    │   └── ShalemMinigameScene.ts # Minijuegos de trivia y dones abismales
    └── main.ts                  # Inicialización y configuración de Phaser
```

---

## 🛠️ Comandos de Instalación, Pruebas y Compilación

```bash
# 1. Instalar dependencias del proyecto
npm install

# 2. Iniciar servidor de desarrollo en local (puerto 3000)
npm run dev

# 3. Ejecutar la suite completa de pruebas unitarias (Vitest)
npm test

# 4. Compilar el paquete optimizado para producción
npm run build
```

---

*Proyecto desarrollado con máxima dedicación para dar vida jugable y visual a la obra de **Kevin**.*
