# The Light in the Darkness (v0.5.0)

> **Arcade-Action Adventure & Metroidvania** ambientado en un medievo anglosajón teocentrista.
> Desarrollado con **Phaser 3 + TypeScript + Vite** bajo los principios de **Domain-Driven Design (DDD)**.

---

## 🏛️ Arquitectura del Proyecto (DDD)

El proyecto sigue una separación estricta entre capas:

```
src/
├── domain/                      # Lógica pura del dominio (Sin acoplamiento a frameworks)
│   ├── character/               # Aggregate Root: Character, Stats, Enums, LevelUpProgress
│   ├── combat/                  # DisarmManager (Opción A & B), ComboSystem, CombatTypes
│   ├── weapon/                  # Entidad Weapon, armas desbloqueables y efectos especiales
│   ├── companion/               # Entidad ShalemCompanion (Sarcasmo, Guía, Minijuegos)
│   ├── boss/                    # Aggregate Root Boss (Morwenna, Rex Malphas F3 UI Shatter, Astaroth)
│   ├── enemy/                   # Entidad Enemy (Acechador de Ceniza, Monje, Guardia Áureo)
│   ├── mission/                 # Misiones y repositorio de la Profecía Original (3 fragmentos)
│   └── shared/                  # EventBus, DomainEvent, Vector2, Result
│
├── application/                 # Casos de uso y orquestación
│   ├── usecases/                # CombatUseCases, ShalemUseCases
│   └── ports/                   # Interfaces IAudioPort, IDialoguePort
│
├── infrastructure/              # Adaptadores de infraestructura y generación
│   ├── audio/                   # WebAudioSoundAdapter (Síntesis procedural WebAudio)
│   ├── dialogue/                # DialogueRepository (Scripts narrativos y de jefes)
│   └── graphics/                # ProceduralAssetGenerator (Generación pixel-art procedural)
│
└── presentation/                # Interfaz de usuario y ciclo visual (Phaser 3)
    ├── scenes/
    │   ├── BootScene.ts         # Inicialización de texturas pixel-art y audio
    │   ├── TitleScene.ts        # Pantalla de título y selección de Thomas o Khaterine
    │   ├── GameScene.ts         # Bucle principal de combate, escenarios y físicas
    │   ├── HUDScene.ts          # Barra de salud, guardia, Level Up y rotura de UI de Malphas
    │   └── ShalemMinigameScene.ts # Modal interactivo de minijuegos con Shalem
    └── main.ts                  # Configuración y arranque del motor Phaser (640x360)
```

---

## ⚔️ Mecánicas Clave Implementadas

1. **Selección de Personaje:**
   - **Thomas:** Superágil, magia demoníaca, alto daño, pero vulnerable al golpe directo.
   - **Khaterine:** Hechicera del abismo, ataques a distancia con proyectiles, mayor resistencia.
   - Si eliges a uno, el otro actúa como NPC aliado en pantalla.

2. **Mecánica de Desarme (Opción A + Opción B):**
   - **Opción A (Crisis Táctica):** Si el jugador recibe un golpe pesado o le rompen la guardia, su arma sale volando al suelo. Queda desarmado y debe pelear a puñetazos mientras corre hacia el arma con `[E]`.
   - **Opción B (Herramienta y Recurso):** Pulsa `[T]` para lanzar el arma voluntariamente. Atraviesa y aturde a los enemigos a distancia, y el jugador puede improvisar recogiendo armas enemigas temporales con durabilidad limitada.

3. **Ritmo de Combate y Remates:**
   - Modo Duelista con guardia precisa y bloqueo `[K]`.
   - Modo Beat 'em up con combos progresivos `[J]` y multiplicador de daño.
   - Al quebrar la postura enemiga: remate fluido o **Remate Cinemático** con cámara lenta y sacudida de pantalla si el enemigo tiene baja salud.

4. **Shalem (El Gato Marqués del Abismo):**
   - Acompaña al protagonista todo el tiempo, bromeando y dando instrucciones tácticas.
   - **Level Up & Minijuegos:** Al llenar la barra de Level Up, se activa la notificación `[M]`. Abre un minijuego de trivia, runas o memoria con Shalem. Al resolverlo, entrega armas legendarias.
   - **Regla del Silencio:** En los momentos trágicos del guion, Shalem enmudece y se acurruca en silencio.

5. **Jefes y Escenarios:**
   - `[1]` **Oakhaven:** Aldea medieval, hoguera de brujas y combate contra la Madre Morwenna.
   - `[2]` **Londinium:** Ciudadela dorada y combate contra Rex Malphas. En la Fase 3, **Malphas rompe la barra de vida de la interfaz**, volviéndola de Oro Infinito con el objetivo de **SOBREVIVIR**.
   - `[3]` **La Catedral Invertida:** El abismo y la batalla decisiva contra Astaroth.

---

## 🎮 Controles

| Tecla | Acción |
|---|---|
| `A` / `D` o Flechas | Moverse a la izquierda / derecha |
| `W` / Espacio o Flecha Arriba | Saltar |
| `J` | Atacar (Combos melee / mágicos) |
| `K` | Bloquear / Postura de Guardia |
| `L` | Esquivar (Dash con invulnerabilidad) |
| `T` | Lanzar arma (Desarme voluntario para aturdir) |
| `E` | Recoger arma del suelo |
| `M` | Abrir Minijuego de Shalem (cuando Level Up esté listo) |
| `1` / `2` / `3` | Cambiar entre los 3 escenarios |

---

## 🛠️ Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en http://localhost:3000
npm run dev

# Ejecutar la suite de pruebas unitarias del dominio con Vitest
npm run test

# Compilar para producción (TypeScript + Vite)
npm run build
```
