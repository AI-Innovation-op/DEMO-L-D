# 03 — Sistemas, datos y contratos de implementación

Los contratos de este documento son propuestas para corregir y extender la base 5a5f3ca. No describen funciones ya implementadas por esta entrega artística.

## 1. Sesión y estados de héroe

Separar identidad, estadísticas persistentes y estado de acción transitorio.

~~~ts
export type HeroId = 'thomas' | 'khaterine' | 'elowen';
export type ActionState = 'idle' | 'moving' | 'windup' | 'active'
  | 'recovery' | 'guarding' | 'dodging' | 'stunned' | 'defeated';

export interface HeroState {
  id: HeroId;
  available: boolean;
  health: number;
  posture: number;
  weaponInstanceId: string | null;
  action: ActionState;
}

export interface HeroDefinition {
  id: HeroId;
  baseMaxHealth: number;
  baseMaxPosture: number;
  moveSpeedMps: number;
  allowedWeaponTags: readonly string[];
}
~~~

Las definiciones no se guardan como progreso mutable del jugador. La sesión guarda el estado de cada personaje y las referencias a equipo adquirido. La vida máxima efectiva se calcula a partir de la definición y de modificadores válidos. El estado de acción se reinicia de forma explícita al cargar un checkpoint; no se restaura un ataque a mitad de un frame.

### Invariantes

- Vida entre cero y vida máxima efectiva; postura entre cero y postura máxima.
- Un ID de arma pertenece a una sola ubicación: inventario, equipo o mundo.
- Cambiar personaje no cura, no daña, no repone postura y no concede armas.
- No se controla a un personaje no disponible o derrotado.
- Un golpe no se cancela mediante el cambio si su definición lo declara no interrumpible.
- Las heridas y mejoras sobreviven al cambio de héroe y a un guardado válido.

### Referencia de caso de uso para cambiar

~~~ts
interface SwitchResult {
  ok: boolean;
  reason?: 'same' | 'unavailable' | 'cooldown' | 'locked-action';
}

function canSwitch(
  current: HeroState,
  target: HeroState,
  nowMs: number,
  nextSwitchAtMs: number
): SwitchResult {
  if (current.id === target.id) return { ok: false, reason: 'same' };
  if (!target.available || target.health <= 0)
    return { ok: false, reason: 'unavailable' };
  if (nowMs < nextSwitchAtMs) return { ok: false, reason: 'cooldown' };
  if (['active', 'stunned', 'defeated'].includes(current.action))
    return { ok: false, reason: 'locked-action' };
  return { ok: true };
}
~~~

La duración de la espera debe ser un dato de balance. Propongo comenzar probando 700 ms; no es un acuerdo narrativo ni una cifra validada. La prueba de usuario decidirá si añade una decisión útil o solo fricción. El reloj se inyecta desde aplicación para poder probar los límites sin esperar tiempo real.

## 2. Combate y animación

El combate debe funcionar con la misma lógica aunque se sustituyan sprites por mallas. Una animación expresa una acción; no debe ser la única fuente de verdad de cuándo se aplica daño.

~~~ts
interface AttackDefinition {
  id: string;
  windupMs: number;
  activeMs: number;
  recoveryMs: number;
  healthDamage: number;
  postureDamage: number;
  rangeMeters: number;
  halfAngleDegrees: number;
  canBeParried: boolean;
  interruptsOnHit: boolean;
}
~~~

### Orden de resolución de un impacto

1. Confirmar que atacante y objetivo están vivos y en el encuentro correcto.
2. Comprobar que el ataque está en su ventana activa.
3. Verificar distancia, ángulo, altura aplicable y obstáculos. En 2.5D se separa la posición en suelo de la altura visual del salto.
4. Descartar un segundo impacto del mismo ataque sobre el mismo objetivo si la definición solo admite uno.
5. Resolver invulnerabilidad de esquiva, parry, bloqueo y modificadores en un orden único.
6. Aplicar daño y postura, limitar rangos y resolver muerte/ruptura.
7. Emitir el resultado una vez. Presentación crea sonido, destello, retroceso y número mostrado a partir del daño realmente aplicado.

La precisión de una colisión no debe depender del ancho transparente de una ilustración. Definir cápsulas, discos o hitboxes de juego aparte del recorte visual. Las mallas del cuerpo y las alas de Morwenna no tienen por qué ser todas partes golpeables.

### Desarme

Modelar WeaponLocation como equipped, ground o inventory, con su propietario y posición cuando esté en suelo. Lanzar crea una instancia de proyectil o acción lanzada y cambia la ubicación; recoger consume esa ubicación del mundo. No generar una espada nueva al alternar a Khaterine y regresar.

Los ataques pesados y la ruptura de postura pueden provocar el desarme según una regla de resistencia. Para recuperar el arma, indicar su posición y permitir recoger dentro de una distancia definida. La interfaz debe aclarar cuándo E hablará y cuándo recogerá.

### Parry y guardia

La ventana se abre en la pulsación inicial de guardia, no en cada evento repetido del teclado. Una guardia mantenida después de esa ventana sigue bloqueando, pero no conserva un parry perfecto indefinidamente. Las reliquias y habilidades modifican una definición efectiva del héroe; no se vuelven a sumar en cada rama de enemigo.

### Esquiva

Separar duración de invulnerabilidad, desplazamiento y recuperación. Usar temporizadores de simulación para que pausa, pérdida de foco y reinicio sean consistentes. La habilidad Paso Espectral ya se consulta por ID para Khaterine en el código actual: conservar ese comportamiento al extraerlo. Revisar por separado los talentos de postura y barrera, cuya integración no aparece en las rutas revisadas.

## 3. Morwenna y máquinas de estado

~~~mermaid
stateDiagram-v2
  [*] --> Dormant
  Dormant --> Chase: comienza el encuentro
  Chase --> Windup: objetivo al alcance
  Windup --> Active: termina anticipación
  Active --> Recovery: termina ataque
  Recovery --> Chase: termina recuperación
  Chase --> PhaseTransition: vida <= 50% y fase 1
  Windup --> PhaseTransition: daño cruza el umbral
  Recovery --> PhaseTransition: daño cruza el umbral
  PhaseTransition --> Chase: fase 2 preparada
  Chase --> Defeated: vida = 0
  Active --> Defeated: vida = 0
  Defeated --> [*]
~~~

El diagrama resume la intención; la implementación debe cubrir también daño durante anticipación, recuperación y transición. Definir de forma expresa si la transición admite daño o concede una breve invulnerabilidad. Un golpe letal que cruza el 50% no debe resucitar al jefe para mostrar una fase.

### Eventos del encuentro

- EncounterStarted: limita el área, presenta nombre y fija el objetivo.
- BossPhaseChanged: cambia patrones y solicita alas/halo/espada a la vista.
- AttackTelegraphed: identifica forma, posición y tiempo de peligro.
- EncounterDefeated: ocurre una sola vez.
- RewardClaimed: concede EXP y llave si su ID no está en RewardLedger.
- GateUnlocked: habilita el acceso al cementerio y actualiza el objetivo.

La fase 1 puede conservar sus valores actuales de prototipo y la fase 2 sus tres familias de ataques. La mejora prioritaria es que el peligro se lea y la recompensa sea fiable. Las columnas necesitan distinguir anticipación, erupción y zona ya segura con forma además de color.

## 4. Estado de mundo y recompensas

~~~ts
interface WorldState {
  completedEncounters: string[];
  openedGates: string[];
  destroyedPersistentProps: string[];
  claimedRewards: string[];
  narrativeFacts: Record<string, boolean | number | string>;
}
~~~

Usar IDs estables definidos en contenido: oakhaven.morwenna, oakhaven.cemetery_gate y reward.morwenna_first_defeat. No usar UUIDs de mallas de Three.js como claves de progreso. Separar props que reaparecen al descansar de objetos irreversibles de misión.

Una recompensa debe ser idempotente. Si el evento de derrota se procesa otra vez por una recarga o por dos vías de daño, el ledger impide concederla de nuevo. La apertura de la puerta tampoco depende de que termine un texto flotante.

## 5. Guardado V2

~~~ts
interface SaveGameV2 {
  schemaVersion: 2;
  modeId: 'phaser-campaign' | 'oakhaven-three';
  contentVersion: string;
  savedAt: string;
  activeHero: HeroId;
  heroes: Partial<Record<HeroId, {
    health: number;
    posture: number;
    weaponInstanceId: string | null;
    available: boolean;
  }>>;
  inventory: { itemId: string; quantity: number }[];
  equippedRelicIds: string[];
  progression: { experience: number; unlockedSkillIds: string[] };
  world: WorldState;
  checkpoint: { id: string; sceneId: string; x: number; z: number };
}
~~~

### Secuencia de guardado

Crear snapshot → validar invariantes → serializar → escribir una copia recuperable del último dato válido → persistir nuevo valor → leer y comprobar → emitir SaveSucceeded. Un error de cuota o permiso produce SaveFailed y mantiene una indicación clara de que no hay persistencia durable.

El fallback en memoria sirve para pruebas o una sesión temporal; no debe anunciarse como equivalente a guardar en el navegador. La aplicación debe conocer si el repositorio es durable o temporal.

### Secuencia de carga

Leer como unknown → identificar modo y versión → validar → migrar si hay migrador probado → resolver referencias a contenido → hidratar dominio → construir escena → colocar al grupo en checkpoint seguro. Si el dato está dañado, ofrecer recuperar la copia anterior o comenzar una partida nueva, preservando el dato defectuoso para exportación local si el usuario lo necesita.

### Política de derrota

Centralizar la derrota en AdventureSession. La ruta actual de varios enemigos repone 100 de salud y 50 de postura directamente; esos valores no son correctos para todos los héroes o mejoras. Proponer una política explícita: cargar checkpoint y aplicar la recuperación de su definición, con límites al máximo efectivo. Nunca producir 100/90 de salud para Khaterine.

## 6. Inventario, efectos y habilidades

Separar ItemDefinition de ItemStack. La definición posee nombre, icono, efecto y máximo. La pila posee ID y cantidad. Una partida guarda pilas y IDs de reliquias, no una copia mutable de todas las descripciones y fórmulas.

UseItem debe validar compatibilidad y aplicar el efecto mediante un servicio antes de confirmar el consumo. Si se rechaza por salud completa, decidir si se permite desperdiciar el objeto o se devuelve una razón sin consumirlo. Esa política debe ser uniforme entre botón del HUD, teclado y menú.

Para Ceniza Consagrada, la definición actual dice +25%, pero la rama 3D establece 1.35. Elegir una cifra y derivar el texto de ese dato. Para los talentos, mapear cada modifierType a una fórmula aplicada y a una prueba de efecto. Comprar un talento no se considera validado solo porque cambia el color de su tarjeta.

## 7. Narrativa, disponibilidad y memoria

Los últimos acuerdos del chat introducen selección inicial Thomas/Khaterine, tramos propios, Elowen desbloqueable durante su cautiverio y cambios cuando los personajes están juntos. Esto supera el estado actual del selector, que solo contempla dos héroes de combate y mantiene a Elowen como NPC.

Modelar por separado:

| Dato | Ejemplo | Función |
|---|---|---|
| Hecho de mundo | refugio_preparado | Decide ayuda o resultado local. |
| Autor de la acción | khaterine | Permite una respuesta coherente. |
| Conocimiento | thomas_knows_letter | Evita transmitir secretos sin una escena de comunicación. |
| Disponibilidad | elowen_in_party | Autoriza cambiar hacia ella. |
| Hito obligatorio | morwenna_defeated | Converge rutas y abre el siguiente bloque. |

Mantener hasta dos decisiones narrativas con memoria por bloque como presupuesto inicial acordado, distinguiéndolas de vida, inventario y progreso obligatorio. Cada decisión necesita al menos un retorno visible. Una variación de frase puede ser suficiente si fue lo prometido; una promesa de rescatar a alguien exige un resultado proporcional.

Separar el orden de revelaciones del dato «personaje activo». Elegir a Khaterine no hace que Thomas conozca automáticamente sus secretos. El mensaje de Elowen conserva a Thomas como destinatario según la recomendación adoptada en la conversación; la perspectiva y los preparativos de Khaterine pueden cambiar sin alterar ese hecho.

## 8. Entradas, pausa y audio

Crear una tabla por contexto para acciones, teclas, textos y gamepad. Mantener separadas Move, AttackLight, AttackHeavy, GuardHeld, DodgePressed, SwitchHero, Interact, Inventory y Pause. Las teclas físicas no llegan al dominio.

La pausa debe detener simulación, temporizadores de daño, buffs y enemigos, pero permitir el menú. El audio debe distinguir música, ambiente, efectos y diálogo. Las pérdidas narrativas previstas deben poder silenciar también avisos de recompensa: el silencio de Shalem necesita apoyo del sistema, no solo una línea de guion.

## 9. API de vistas

CharacterView recibe posición, orientación, estado de animación y visibilidad. HudView recibe un ViewModel serializable. La escena no lee salud desde un elemento HTML. Una barra no ejecuta reglas de daño. Un clip puede omitir frames por rendimiento sin cambiar el número de impactos del ataque.

La sustitución de geometrías por un modelo GLB o por un billboard animado debe afectar al adaptador visual y a su catálogo de recursos, conservando las pruebas de dominio.

