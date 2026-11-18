# 02 — Arquitectura técnica y DDD propuesto

## Estado actual

La aplicación inicia Phaser desde main.ts. Sus escenas contienen portada, introducción, campaña, HUD, diálogos, inventario, cinemáticas y el minijuego de Shalem. El prototipo Three.js se abre como una experiencia paralela: oculta el canvas de Phaser, pausa escenas y añade su propio renderer y su propia interfaz HTML.

El dominio 2D contiene Character, CharacterStats, Enemy, Boss, DisarmManager, ComboSystem, Inventory, Progression, StoryProgress y SessionStateStore. CombatUseCases y ShalemUseCases coordinan algunas acciones. El 3D reutiliza Inventory y Progression, pero mantiene gran parte del combate y la IA como propiedades y métodos de Oakhaven3DExperience.

~~~mermaid
flowchart LR
  Main[main.ts] --> Phaser[Escenas Phaser]
  Main --> Three[Oakhaven3DExperience]
  Phaser --> Domain[Dominio 2D]
  Phaser --> Application[Casos de uso]
  Three --> Inventory[Inventory / Progression]
  Three --> Inline[Combate / IA / mundo / UI internos]
  Domain --> Session[SessionStateStore]
  Three --> Storage[GameSaveManager]
~~~

La separación de carpetas ya aporta orden. El siguiente paso es convertirla en una dirección de dependencias que se pueda comprobar.

## Principios de implementación

1. Dominio no importa Phaser, Three.js, DOM, almacenamiento, audio ni reloj global.
2. Aplicación coordina acciones, transacciones y puertos. No decide qué geometría o HTML se dibuja.
3. Presentación transforma input en comandos y resultados en imagen, sonido y texto.
4. Infraestructura implementa almacenamiento, carga de recursos, reloj y audio.
5. Los valores de balance viven en configuraciones versionadas; no se copian dentro de cada renderer.
6. Un sistema debe tener un propietario claro. La vista de un héroe no es dueña de su salud.
7. Los adaptadores pueden sustituirse, pero el proyecto no necesita una abstracción para cada operación de una biblioteca.

## Módulos recomendados

~~~text
src/
  domain/
    party/             HeroId, HeroCombatState, Party, SwitchPolicy
    combat/            AttackDefinition, HitResolver, StatusEffects
    encounters/        MorwennaEncounter, EnemyStateMachine
    world/             WorldProgress, EntityId, GateState, RewardLedger
    inventory/         Inventory, ItemDefinition, ItemStack, RelicLoadout
    progression/       SkillDefinition, SkillProgress, Modifiers
    narrative/         NarrativeFact, CharacterKnowledge, ChapterProgress
    save/              SaveSnapshotV2, validators, migrations
  application/
    commands/          SwitchHero, Attack, UseItem, Interact, SaveGame
    services/          AdventureSession, EncounterDirector, SaveGameService
    ports/             SaveRepository, Clock, AudioOutput, EventSink
  infrastructure/
    storage/           LocalStorageSaveRepository
    assets/            AssetCatalog, GltfAssetLoader
    audio/             WebAudioAdapter
  presentation/
    three/             SceneHost, CharacterView, EnemyView, BossView
                       InputRouter, CameraRig, HudView, SceneResourceScope
    phaser/            adaptadores y escenas del modo 2D
~~~

Los nombres son una propuesta. Lo importante es la responsabilidad y la dependencia; no hace falta mover todas las carpetas actuales de una sola vez.

## Contextos y propietarios

| Contexto | Posee | No posee |
|---|---|---|
| Party | Héroes, selección, disponibilidad, estados persistentes | Mallas y teclas físicas |
| Combat | Daño, postura, fases de ataque, bloqueo, esquiva | Números flotantes y shaders |
| Encounter | Estado y reglas de una pelea, condiciones de victoria | Inventario global completo |
| WorldProgress | Puertas, encuentros concluidos, recompensas reclamadas | Instancias de geometrías |
| Inventory | Cantidades, compatibilidad, reliquias, consumo | Curación aplicada por su cuenta al renderer |
| Narrative | Hechos, conocimiento por personaje y acceso a escenas | Texto completo incrustado en cada clase visual |
| Save | Snapshot validado y migración de datos | Reproducción de animaciones o DOM |

## Flujo de una acción

~~~mermaid
sequenceDiagram
  participant I as InputRouter
  participant A as AdventureSession
  participant P as Party
  participant V as CharacterView/HUD
  I->>A: SwitchHeroCommand(target, nowMs)
  A->>P: trySwitch(target, nowMs)
  P-->>A: HeroSwitched o rechazo tipado
  A-->>V: Snapshot + eventos
  V->>V: Cambiar modelo y actualizar HUD
~~~

Un rechazo esperado no necesita lanzar una excepción. Puede devolver un código como cooldown, unavailable o locked_action que la interfaz transforma en una indicación breve.

## Contrato de comandos y eventos

~~~ts
export type HeroId = 'thomas' | 'khaterine' | 'elowen';

export type GameCommand =
  | { type: 'switch-hero'; target: HeroId; issuedAtMs: number }
  | { type: 'attack'; actor: HeroId; attackId: string }
  | { type: 'use-item'; actor: HeroId; itemId: string }
  | { type: 'interact'; actor: HeroId; targetId: string };

export type GameEvent =
  | { type: 'hero-switched'; previous: HeroId; current: HeroId }
  | { type: 'damage-applied'; targetId: string; healthDamage: number; postureDamage: number }
  | { type: 'encounter-completed'; encounterId: string }
  | { type: 'reward-claimed'; rewardId: string };
~~~

Elowen se incluye aquí como contrato futuro acordado en la conversación, no como función presente en el código revisado. Su disponibilidad narrativa debe impedir el cambio hacia ella durante el cautiverio. No basta con añadir un ID al selector.

## Orden de extracción seguro

### Paso 1: Party y cambio de héroe

Copiar el comportamiento observado a pruebas, especificar el comportamiento correcto y extraer solo el estado de los dos héroes. Mantener los modelos y los botones existentes como adaptadores. Es la corrección de mayor impacto con menor alcance visual.

### Paso 2: Snapshot y persistencia

Crear un DTO versionado y validado. Separar crear snapshot, persistir y restaurar. Añadir migración de guardados históricos antes de sustituir el cargador. Mantener una copia recuperable del dato anterior cuando una migración cambie formato.

### Paso 3: Morwenna y progreso de mundo

Extraer fase, temporizadores, transición y resolución de daño a MorwennaEncounter. La presentación escucha eventos para alas, halo, espada, luces y sonidos. La victoria produce un evento único; WorldProgress y RewardLedger resuelven puerta, llave y EXP.

### Paso 4: IA común y variantes

Identificar estados compartidos entre sabueso, cultista, flagelante y penitente. Compartir la máquina de estados y las transiciones realmente comunes; mantener perfiles de ataque y alcance distintos. Evitar una clase base gigante que mezcle todos los casos especiales.

### Paso 5: Vistas y recursos

Extraer CharacterView, BossView, HudView y SceneResourceScope. Cambiar la carga estática del 3D por carga diferida. Al final de este paso, Oakhaven3DExperience debe coordinar la escena, no implementar cada regla.

## Pruebas de límites

Agregar una comprobación de imports que falle si domain depende de presentation, infrastructure, phaser o three. Las pruebas de aplicación pueden usar repositorios y relojes falsos. Las pruebas de presentación validan que un evento activa la animación y la información correctas, sin volver a probar toda la aritmética de daño.

## Decisiones que conviene evitar

- Crear un motor genérico para todas las campañas antes de cerrar Oakhaven.
- Reescribir todo en otro motor para poder separar salud y presentación.
- Duplicar la fuente de verdad en DOM, modelo 3D y dominio.
- Persistir una copia completa de la escena Three.js.
- Guardar definiciones de habilidades mutables como si fueran progreso del usuario.
- Encadenar lógica de recompensas a que haya terminado un efecto visual. La regla debe funcionar aunque se omita la animación.

