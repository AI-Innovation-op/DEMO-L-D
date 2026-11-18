# 01 — Feedback crítico y mejoras concretas

## Lo que conservaría

El desarme tiene más identidad que una lista larga de ataques: crea una decisión comprensible, un momento de vulnerabilidad y una recuperación visible. Thomas y Khaterine permiten cambiar el ritmo del combate. Shalem puede conectar tutorial, tono y acompañamiento sin convertir cada avance en un bloque de texto. La transición de la calle al cementerio es una estructura útil para una primera sección terminable.

La dificultad actual está en la consistencia. El juego promete héroes con estados propios, pero comparte sus estadísticas en 3D. Promete progreso persistente, pero solo guarda una parte del mundo. La carpeta de arte define una dirección detallada que todavía no se refleja en los modelos geométricos del prototipo. Son problemas resolubles, y cada uno necesita una prueba que lo haga observable.

## Prioridades

| ID | Prioridad | Hallazgo | Evidencia | Resultado que buscamos |
|---|---|---|---|---|
| H01 | Alta | Cambiar de héroe puede quitar salud y regenerar postura. | Ejecución y código | Estados propios sin curación ni daño implícitos. |
| H02 | Alta | El guardado 3D no representa el estado del mundo. | Código | Recuperar héroes, jefa, puerta, recompensas y checkpoint. |
| H03 | Alta | Cargar salud/postura igual a cero ignora esos valores. | Código | Restauración exacta y validación del esquema. |
| H04 | Alta | Las pruebas de fase 2 verifican otra implementación del jefe. | Código y pruebas | Probar la misma lógica que utiliza el 3D. |
| H05 | Media | La clase 3D reúne reglas, geometría, interfaz y almacenamiento. | Código | Separar reglas comprobables de adaptadores visuales. |
| H06 | Media | El cambio de héroe y la entrada global carecen de un contexto coherente. | Código | Cambio con espera, acciones discretas y control de foco. |
| H07 | Media | Dos guardados y dos modelos de combate divergen. | Código | Contratos explícitos y una fuente de reglas por modo. |
| H08 | Media | La destrucción de la escena no libera todos los recursos que crea. | Código; medición pendiente | Entrar y salir sin crecimiento sostenido de recursos. |
| H09 | Media | La cámara interpola con un factor fijo por frame. | Código | Respuesta equivalente a distintas frecuencias de pantalla. |
| H10 | Media | Algunas ayudas y avisos no representan de forma precisa el efecto real. | Código e interfaz | Una sola definición de controles y efectos. |
| H11 | Media | La legibilidad visual y el HUD no acompañan al alcance de la escena. | Observación | Leer personaje, amenaza y objetivo sin esfuerzo. |
| H12 | Media | El arranque carga ambas implementaciones en el paquete principal. | Código y build | Cargar el 3D al entrar en él. |
| H13 | Diseño | La dirección de arte y los documentos históricos tienen contratos incompatibles. | Documentación | Un contrato vigente, con variantes identificadas. |
| H14 | Diseño | La hoja de ruta añade sistemas antes de cerrar un recorrido completo. | Documentación | Una sección breve, fiable y representativa. |
| H15 | Alta | Dos talentos anuncian efectos que no se consumen en las rutas 3D revisadas. | Código | Comprar una mejora cambia su resultado real. |
| H16 | Alta | El reintento tras una derrota repone estadísticas fijas de otro héroe. | Código | Vida/postura dentro de rangos y política de derrota centralizada. |

## H01 — Cada héroe necesita su propia salud y postura

**Qué sucede.** En una partida nueva Thomas muestra 100/100. Tras pulsar el selector para Khaterine y volver a Thomas, muestra 90/100 sin haber recibido ataques. En el cambio a Khaterine se limita la salud compartida a 90 y se repone la postura a 70. Al volver no se recupera la salud original de Thomas.

**Dónde.** [toggleHero, línea 2035](https://github.com/AI-Innovation-op/DEMO-L-D/blob/5a5f3ca/src/presentation/three/Oakhaven3DExperience.ts#L2035). La propiedad playerStats es una sola instancia para los dos héroes.

**Impacto.** El jugador pierde salud por una acción que parece segura. También puede aprovechar los cambios para recuperar postura. El balance deja de depender solo de su ejecución del combate.

En código hay otra consecuencia: al activar Khaterine se fija isArmed = true; al volver a Thomas no se restaura su valor anterior. Si había una espada caída, la rama vuelve a mostrarla mientras mantiene ese booleano compartido. La ubicación del arma necesita su propio estado para que cambiar de héroe no sustituya la acción de recuperarla. El cambio de postura máxima tampoco limita el valor compartido al volver de 70 a 50.

**Mejora.** Crear un agregado Party con un HeroCombatState por ID. El héroe activo es una referencia a una entrada del registro, no un objeto cuyas estadísticas se reescriben. La vida máxima y sus bonificaciones se calculan por héroe. Cambiar no modifica vida, postura ni el estado de un arma caída.

**Cómo implementarlo.** Extraer primero la selección y los estados a dominio/application. La vista actualiza la visibilidad de los modelos después de un evento HeroSwitched. Bloquear el cambio durante los estados definidos como no interrumpibles y aplicar una espera corta configurable en milisegundos. Conservar la mochila compartida.

**Aceptación.** Thomas 73/100 y Khaterine 41/90 siguen con esos valores después de diez cambios. La postura no se regenera por cambiar. Thomas desarmado sigue desarmado al regresar. Un héroe derrotado no puede convertirse en un héroe vivo por alternar el control.

## H02 — Guardar inventario no equivale a guardar el mundo

**Qué existe.** executeSanctuarySave serializa héroe activo, un bloque de salud/postura, inventario, progresión y una bandera de visita al santuario. No incluye posición/checkpoint, derrota de Morwenna, fase del encuentro, puerta del cementerio, estado de enemigos o props destruidos.

**Dónde.** [Guardado, línea 4640](https://github.com/AI-Innovation-op/DEMO-L-D/blob/5a5f3ca/src/presentation/three/Oakhaven3DExperience.ts#L4640), [GameSaveManager](https://github.com/AI-Innovation-op/DEMO-L-D/blob/5a5f3ca/src/infrastructure/storage/GameSaveManager.ts).

**Impacto.** Puede conservarse la llave mientras el encuentro y el escenario se reconstruyen con sus valores iniciales. Se pierde la correspondencia entre lo que el jugador hizo y lo que encuentra al continuar. La repetición de recompensas es un riesgo que debe comprobarse con un recorrido completo de derrota/guardado/recarga.

**Mejora.** Definir SaveGameV2 con heroes, inventory, progression, narrativeFacts, worldFlags, checkpoint y claimedRewards. Guardar hechos estables, no referencias a mallas ni nombres de nodos generados al azar.

**Cómo implementarlo.** La aplicación crea el snapshot de dominio. El repositorio de guardado lo valida, versiona y persiste. Al cargar, primero se valida/migra, después se restaura el estado y por último se construye la representación. Morwenna derrotada debe producir un estado consistente de la puerta y de su recompensa.

**Aceptación.** Derrotar a Morwenna, recibir la llave, guardar, recargar: la puerta y el checkpoint tienen el estado acordado, la EXP no se duplica y el jefe no reaparece por accidente. Si se decide que los enemigos comunes reaparecen al descansar, esa es una regla explícita y distinta de reiniciar todo el mundo.

## H03 — Cero es un valor válido

**Qué sucede.** loadSavedSanctuaryState comprueba if (save.health) e if (save.posture). Cero es falso en JavaScript, por lo que esos valores no se restauran. El cargador utiliza además una conversión de JSON a tipo sin una validación completa del contenido.

**Dónde.** [Restauración, línea 4684](https://github.com/AI-Innovation-op/DEMO-L-D/blob/5a5f3ca/src/presentation/three/Oakhaven3DExperience.ts#L4684).

**Mejora.** Comprobar presencia y finitud, aceptar cero y limitar los valores al rango válido. Separar «no hay guardado», «guardado incompatible» y «guardado dañado». Utilizar una función pura parseSave(unknown) que devuelva un resultado tipado.

**Aceptación.** Una postura guardada en 0 carga como 0. Una salud de 0 lleva al flujo de derrota/checkpoint definido; no se sustituye silenciosamente por 100. JSON incompleto, NaN representado como otro tipo, IDs desconocidos y cantidades negativas producen una recuperación controlada.

## H04 — Las 38 pruebas no certifican la fase 2 de Three.js

**Qué comprobé.** BossPhase.test.ts importa Boss del dominio, cuya Morwenna tiene 350 HP. La experiencia 3D mantiene su propio estado, con 280 HP y una transición implementada dentro de la clase visual. Las pruebas de la llave añaden el objeto manualmente al inventario; no ejecutan la ruta real de derrota del jefe 3D.

**Dónde.** [Prueba actual](https://github.com/AI-Innovation-op/DEMO-L-D/blob/5a5f3ca/tests/domain/BossPhase.test.ts), [transición 3D, línea 3262](https://github.com/AI-Innovation-op/DEMO-L-D/blob/5a5f3ca/src/presentation/three/Oakhaven3DExperience.ts#L3262), [derrota 3D, línea 3310](https://github.com/AI-Innovation-op/DEMO-L-D/blob/5a5f3ca/src/presentation/three/Oakhaven3DExperience.ts#L3310).

**Mejora.** Extraer MorwennaEncounter y utilizarlo desde el 3D. Si 350 y 280 son balances deliberados para modos distintos, mantener una configuración por modo con la misma máquina de estados. La prueba del encuentro debe consumir comandos reales de daño y producir eventos de transición y recompensa.

**Aceptación.** El mismo módulo importado por la experiencia 3D se prueba en el umbral exacto, por debajo y con un golpe letal que cruza el umbral. La transición ocurre una sola vez. La recompensa se concede una sola vez. Una prueba de aplicación verifica la apertura de la puerta a partir del evento de derrota.

## H05 — DDD necesita límites de responsabilidad, además de carpetas

La experiencia 3D tiene 4.967 líneas en esta base y combina construcción de mallas, daño, movimiento, IA, árboles de habilidades, inventario, persistencia, HTML y cámara. La escena 2D también contiene una gran parte de la orquestación. Esta organización es útil para experimentar, pero hace costoso cambiar o comprobar una regla sin cargar también la presentación.

Recomiendo extraer por casos de uso: PartySession, CombatResolver, MorwennaEncounter, WorldProgress y SaveGameService. Dejar modelos, luces, cámara y animación en presentación. Mantener los adaptadores de almacenamiento y audio detrás de puertos. El objetivo no es crear una clase por cada método ni imponer un límite arbitrario de líneas: es poder ejecutar una decisión del juego sin WebGL ni DOM.

Aceptación: las pruebas de daño, cambios de héroe y guardado no importan Three.js ni Phaser. Un evento de dominio identifica el actor y el resultado; la vista decide cómo mostrarlo. Se conserva el comportamiento antes de extraer la siguiente responsabilidad.

## H06 — Entrada por contexto y acciones discretas

handleKeyDown cambia héroe y cámara antes de comprobar todos los modales. No descarta la repetición automática del teclado para acciones discretas. La tecla Tab también es la navegación habitual entre controles. No aparece una limpieza de teclas al perder foco.

Separar InputRouter de los casos de uso. Definir contextos Gameplay, Dialogue, Inventory, Skills y Paused. Las acciones discretas se activan en el flanco de pulsación; la guardia y el movimiento tienen estado sostenido. En un modal, Tab debe permitir navegar por sus controles. Al perder foco se limpian teclas, se suspende el juego según la política de pausa y se solicita una nueva pulsación al regresar.

Aceptación: mantener Tab no dispara una sucesión de cambios; cerrar un diálogo no produce además una esquiva; perder foco con W pulsada no deja al personaje andando; un usuario puede abrir y cerrar inventario usando solo teclado.

## H07 — Dos implementaciones, dos contratos de progreso

La campaña 2D emplea SessionStateStore y la clave the_light_in_darkness_save_v1. El 3D emplea GameSaveManager y the_light_in_the_darkness_save_v1. Son claves distintas, y el menú de continuar de un modo no representa necesariamente el otro. El nivel de cobertura y los datos guardados también difieren.

No fusionar esos formatos por renombrar la clave. Identificar modeId en la sesión y explicar el modo al continuar. Crear migradores por formato de origen y pruebas de datos históricos. Compartir reglas de inventario/progresión cuando sean realmente iguales y mantener configuraciones distintas cuando el balance sea deliberado.

Aceptación: el menú identifica de qué modo es una partida. Cargar una partida histórica no borra otra. Se puede volver al 2D sin un restablecimiento accidental del 3D.

## H08 — Recursos y cierre de la escena

destroy cancela el bucle, retira listeners y destruye el renderer. Eso es una base correcta. No recorre los geometries, materials y textures creados para liberarlos explícitamente, ni centraliza todos los temporizadores propios de la experiencia. El crecimiento de memoria aún necesita medirse; no lo presento como una fuga cuantificada.

Implementar un ResourceScope que registre recursos y callbacks de limpieza. Compartir geometrías/materiales repetidos y contar referencias cuando se compartan entre escenas. Limpiar timers, detener el audio del modo al salir y liberar cada recurso una vez. Three.js requiere gestionar explícitamente varios recursos de GPU; [guía oficial de disposición](https://threejs.org/manual/pages/how-to-dispose-of-objects.html).

Aceptación: entrar y salir del 3D diez veces no deja bucles activos ni listeners duplicados. Las cuentas de recursos y la memoria se estabilizan después del calentamiento; se documenta qué recursos se conservan por caché.

## H09 — Cámara independiente del refresco

updateCamera recibe delta pero interpola con 0.08 fijo. A más frames por segundo, la cámara ejecuta más pasos de aproximación por segundo. Usar una interpolación exponencial con alpha = 1 - exp(-lambda * dt), con dt en segundos. Separar esta suavidad de la simulación del combate.

Aceptación: una trayectoria reproducida a 30, 60 y 144 Hz conserva un tiempo de seguimiento comparable. No modificar la sensibilidad del jugador para compensar una cámara dependiente de los FPS.

## H10 — La interfaz debe describir la regla real

En 3D la tecla C cambia cámara, mientras el pie de página global sigue mostrando «C Charlar». El daño temporal parte de una Ceniza Consagrada de +25%, pero la rama 3D aplica 1.35 y el HUD usa «ÓLEO (+35%)». Los códigos de efectos y los textos deben salir de la misma definición. El resultado de saveGame debe decidir si se muestra «guardado» o un error: ahora se muestra el aviso favorable antes de comprobar el booleano devuelto.

Crear ActionBindings y EffectDefinition como datos compartidos por interfaz y lógica. Generar el texto del efecto desde su definición. Emitir SaveSucceeded solo después de persistir. Añadir un aviso recuperable si el navegador no permite guardar o se alcanza su cuota.

Aceptación: el control mostrado corresponde al contexto activo, la descripción del consumible coincide con el multiplicador aplicado y un almacenamiento que lanza una excepción no produce un mensaje de guardado exitoso.

## H11 — Lectura visual: primero silueta, después detalle

En la escena observada, los modelos geométricos y la iluminación muy baja dificultan reconocer personajes desde la cámara. El HUD agrupa muchos botones de tipografía pequeña, y el pie del 2D permanece bajo el 3D. La solución no es aclarar todo el cielo: iluminar siluetas y planos de juego, aumentar el tamaño del texto y ordenar la jerarquía.

Usar un HUD mínimo para combate: héroe activo, salud/postura, objetivo y un acceso a menú. Las ayudas completas quedan en una pantalla de controles. Dar a cada héroe una silueta legible y reservar el brillo máximo para peligro e impacto. Separar color, contorno y sonido para distinguir ataques; no depender solo del rojo o del violeta.

Aceptación: a la resolución de juego elegida un tercero reconoce héroe, enemigo y amenaza. Los textos se leen sin ampliar la página. El pack de sprites se compara sobre el fondo nocturno real, además de sobre transparencia.

## H12 — Carga y presupuesto de la web

main.ts importa estáticamente Phaser y Oakhaven3DExperience. Vite agrupa el arranque revisado en un JS de 2,40 MB, 574 kB con gzip. Ese dato no es una medida de FPS, pero sí muestra margen para separar la carga por modo.

Cargar la experiencia 3D mediante importación dinámica cuando el jugador la solicite. Separar recursos por escena y mostrar progreso de carga real. Medir parseo y arranque además del tamaño. No añadir todos los originales de producción a una ruta que se precargue al jugar: entregar el paquete artístico fuera de los assets públicos y copiar solo las exportaciones aprobadas.

Aceptación: el arranque 2D no descarga Three.js ni los recursos del 3D. Entrar por segunda vez reutiliza cachés sin duplicar instancias. La pantalla de carga refleja trabajo pendiente y tiene una salida de error.

## H13 — Contrato de arte vigente

Las conversaciones anteriores fijaron Thomas de 48 píxeles de altura en lienzo 96×80; la guía nueva especifica celdas 48×48 o 64×64 para héroes. También hay diferencias entre medieval anglosajón y gótico victoriano, y entre Cáliz Solar y cruces. Son decisiones artísticas, no errores de TypeScript.

Este paquete toma las celdas de la guía nueva como contrato de exportación; usa 64×64 para los dos héroes con armas. Conserva el diseño nocturno, la diferenciación violeta/argéntea/carmesí/cian y las referencias existentes. Registrar qué símbolos pertenecen a cada facción y qué elementos son licencias estilísticas. Ninguna lámina nueva debe cambiar por sí sola un hecho del manuscrito.

## H14 — Cerrar una sección antes de ampliar sistemas

La próxima prioridad del roadmap es alquimia. Mi propuesta es anteponer estados de héroes, guardado, encuentro de Morwenna y un recorrido corto comprobado. La alquimia será más valiosa cuando sus efectos sobrevivan a recargar y sus ingredientes tengan una economía consistente.

Definir una sección de 5–8 minutos: entrada segura, tutorial breve del desarme, encuentro de patrulla, pausa narrativa, Morwenna, llave, puerta, checkpoint y salida clara. Esto no equivale a terminar la campaña. Su definición de terminado incluye controles, audio, legibilidad, derrota/reintento y recuperación del guardado, además de poder derrotar al jefe.


## H15 — Habilidades con efecto comprobable

Golpe de Escudo Santo declara un bonus de postura, y Sagrario del Sauce declara mitigación de guardia. En las rutas 3D revisadas no aparece una consulta de thomas_shield_strike o khaterine_abyssal_ward ni consumo de sus modifierType. El guardado del desbloqueo y la tarjeta activa no verifican ese efecto. Paso Espectral sí tiene una consulta explícita para Khaterine en executeDodge y no debe incluirse en este hallazgo.

Crear un cálculo de modificadores efectivos por héroe y utilizarlo en HitResolver y GuardResolver. Escribir pruebas antes/después con el mismo ataque y la misma semilla de estado; deben cambiar postura o mitigación en la proporción aprobada. Si una habilidad todavía es una promesa de contenido, mantenerla deshabilitada y describir su estado en el prototipo.

## H16 — Una derrota no debe reconstruir estadísticas a mano

executeEnemyHit y otras ramas de enemigos reviven con health = 100 y posture = 50. Khaterine tiene maxHealth = 90 en el cambio de héroe, por lo que esta ruta puede dejarla con 100/90. Una mejora de máximo de Thomas tampoco está representada por esos valores fijos.

Mover derrota/reintento a un caso de uso con la definición del héroe y el checkpoint. Cada atacante produce daño y un resultado de derrota; no elige valores de resurrección. Aceptación: salud y postura siempre dentro del máximo efectivo, el reinicio conserva las decisiones durables y no crea una nueva recompensa del jefe.
