# OpenLara: cámara, organización espacial y entrega web

Revisión estática del 18 de noviembre de 2026, America/Lima. Repositorio: `XProger/OpenLara`, commit `3b268ca4bf986c380f44a26ffd9218bf6d376249`. Se examinó el código normal de `src/`, principalmente `camera.h`, `controller.h`, `level.h`, `game.h` y `platform/web/`. La variante `src/fixed/` no se utilizó para describir estos mecanismos.

El objetivo es extraer decisiones útiles para el modo 3D de Oakhaven. Este documento no afirma que el ejecutable de la demo web coincida con ese commit ni que estos mecanismos hayan sido observados en una partida de la demo. Las observaciones de navegador y REA, si se consiguen, deben añadirse con identidad y límites propios.

## 1. Qué ofrece esta cámara

La cámara es un sistema de estados con reglas de composición, seguimiento y corrección espacial. No consiste únicamente en colocar un punto detrás del personaje. La interfaz declara seis modos: seguimiento, estática, mirada, combate, cinemática y `heavy`; además conserva posición/room del ojo y objetivo, ángulos, sacudida, primera persona y reflexión. [Interfaz `ICamera`, líneas 18–46][ol-camera-interface]

| Estado o variante | Mecanismo que aparece en el código | Alcance |
|---|---|---|
| Seguimiento | Distancia base de 1.536 unidades del nivel; parámetro de velocidad 12. | Valores del código TR, no metros ni valores recomendados para Three.js. |
| Combate | Distancia base de 2.048 unidades salvo ciertas plataformas; parámetro de velocidad 8. | En la fórmula de seguimiento, el parámetro menor genera mayor factor de aproximación por paso. No equivale a una medición de sensación o latencia. |
| Mirada | Distancia 512, input para orientar la vista y límites angulares. | Las teclas de dirección y stick se interpretan según este contexto. |
| Estática | Usa una cámara declarada en el nivel y mira a un objetivo o al dueño. | No es una cámara libre genérica que el jugador coloca en cualquier sitio. |
| `Heavy` | Comparte tratamiento de objetivo estático y temporizador; puede conservarse hasta agotar su tiempo. | No se atribuye aquí un significado narrativo concreto a todos los triggers que lo activan. |
| Cinemática | Recorre frames de cámara y transforma posición/objetivo mediante una matriz de secuencia. | Puede interpolar o cortar entre encuadres. |
| Primera persona | Obtiene la articulación de cabeza y ajusta posición y rotación de cámara. | Rama distinta del seguimiento exterior, con excepciones para animación de cabeza y VR. |

Los valores y ramas están en [constantes y estado de cámara][ol-camera-constants], [actualización de modos][ol-camera-update] y [primera persona][ol-camera-firstperson].

`changeView` asigna FOV 65 para la vista exterior y 90 para primera persona, con planos de recorte propios; son argumentos de esta implementación, no una medición del FOV servido en la web. [camera.h:711–719][ol-camera-fov]

## 2. Cómo elige el punto que sigue

`getViewPoint()` parte de la posición y bounding box del dueño. En modo de mirada puede seguir la articulación de cabeza; en seguimiento calcula una altura basada en los límites del cuerpo y la ajusta según el estado bajo el agua. Para otras entidades emplea el centro. `centerView` decide además si X/Z siguen el centro de la caja. [camera.h:127–167][ol-camera-target]

La consecuencia de diseño es importante: **el objetivo visual de una cámara puede variar por postura y contexto sin cambiar la posición de autoridad del personaje**. Para Oakhaven conviene exponer un punto de seguimiento estable por héroe, junto a la altura de pie/agachado y las condiciones de combate. Eso evita que cada modelo nuevo obligue a reescribir la cámara.

En el seguimiento normal, X/Z del objetivo se actualizan directamente, mientras Y se aproxima con `deltaTime × 5`. La orientación deseada combina ángulo del dueño, mirada y stick de vista. Las ramas de mirada y seguimiento mantienen reglas diferentes. [camera.h:419–528][ol-camera-update]

## 3. Seguimiento y tiempo

`move()` aproxima la posición del ojo con un factor proporcional a `Core::deltaTime`: `30 / speed × deltaTime`, o `20 × deltaTime` en mirada. Después vuelve a consultar sector, suelo y techo y corrige la altura del ojo. La cámara tiene una bandera `smooth`; tras un reset o determinadas transiciones puede aplicar directamente el destino. [camera.h:330–353][ol-camera-move]

La aplicación no entrega sin más todo el delta del frame a esta fórmula. Fuera de niveles de cinemática limita el delta acumulado a 0,2 segundos y luego lo consume en subpasos de, como máximo, 1/30 de segundo. El último subpaso puede ser menor. Esto no significa que el render funcione a 30 FPS. [game.h:271–325][ol-game-timestep]

Para trasladar la idea a Oakhaven:

- Definir respuestas por contexto y expresarlas por tiempo.
- Separar la respuesta de posición, punto de mirada y giro.
- Decidir cuándo interpolar y cuándo cortar: respawn, teleport, cinemática y cambio de objetivo requieren políticas explícitas.
- Probar varios pasos temporales y un frame largo. La misma fórmula puede sentirse distinta si el bucle de actualización cambia.

Una propuesta para el proyecto es usar amortiguación exponencial `alpha = 1 − exp(−k × dt)` y diferencia angular corta al orientar. Es una decisión de reconstrucción, no el algoritmo literal de OpenLara.

## 4. Paredes, sectores y oclusión

La cámara calcula una posición deseada detrás del objetivo y llama a `traceClip()` antes de mover el ojo. Ese método hace un trazado del dueño, identifica cajas del sector, ajusta límites con información de bloqueo, deja margen y corrige la posición mediante deslizamiento. [camera.h:248–328][ol-camera-clip]

El trazado del controlador recorre fronteras X/Z y usa suelo/techo para acotar la línea. La corrección de cámara vuelve a comprobar altura después de interpolar. Es un mecanismo adaptado a rooms, sectores y cajas del formato del nivel. **No se establece aquí una solución universal contra todo mesh dinámico ni una política general de transparencia para objetos que tapan al personaje.** [controller.h:1054–1086][ol-controller-trace], [camera.h:330–353][ol-camera-move]

Para una escena propia de Three.js, tomar la responsabilidad del sistema, sin copiar sus supuestos geométricos: calcular destino, comprobar el volumen de la cámara frente a colisionadores relevantes, retraer al encontrar un obstáculo y recuperar distancia al despejarse. Una hoja, una partícula, un enemigo y una pared pueden pertenecer a capas de oclusión distintas. La revisión del port no demuestra cuál será el radio correcto para los héroes de Oakhaven.

## 5. Cinemáticas, agua y sonido

Las cinemáticas avanzan sobre una secuencia de frames de cámara. Cuando la distancia entre frames de posición o de objetivo excede un umbral, el código usa directamente el frame A; en los demás casos interpola ojo, objetivo y FOV. Esto permite preservar cortes en lugar de convertirlos todos en movimientos largos. [camera.h:372–417][ol-camera-cinematic]

La condición submarina de la cámara procede de la bandera de la room del ojo. El listener de sonido utiliza la matriz de cámara y calcula reverberación del espacio principal a partir del tamaño de room. En la actualización del nivel, la condición submarina activa el ambiente y el estado correspondiente del listener. [camera.h:113–124][ol-camera-audio], [level.h:2320–2332][ol-level-audio]

La preparación del render contempla un plano de reflexión, transformación de la matriz y proyección oblicua. Es una rama de render, no prueba de que todos los materiales de agua tengan exactamente el mismo efecto. [camera.h:634–681][ol-camera-render]

Aplicación a Oakhaven: una transición de zona puede coordinar luz, niebla, sonido y cámara a partir de un estado compartido. La cámara y el audio no deberían deducir por separado, con criterios incompatibles, si el jugador está en un interior o bajo agua.

## 6. Cómo organiza lo visible

El nivel usa rooms conectadas mediante portales. `checkPortal()` comprueba la orientación del portal, proyecta sus cuatro vértices, trata los cruces del plano y calcula un rectángulo recortado contra el viewport recibido. `getVisibleRooms()` propaga ese rectángulo a rooms conectadas. Hay límites de 255 entradas y profundidad de recorrido 16. [level.h:2495–2589][ol-level-portals]

En la vista ordinaria se inicia el recorrido desde la room de la cámara. En niveles de cinemática existe una rama que incorpora otras rooms no alternativas. El render de rooms aplica scissor según el rectángulo de portal y separa pasadas de geometría. El render de entidades recibe el frustum de cámara. [level.h:2619–2657][ol-level-view], [level.h:2004–2059][ol-level-rooms], [level.h:2131–2170][ol-level-entities]

Esto es **selección de geometría visible**, no una prueba de streaming de recursos por proximidad. La carga de un nivel siguiente es otra operación: se pide un `Stream`, su callback deja el dato en `Game::nextLevel`, y después `startLevel()` reemplaza la instancia de nivel. [level.h:2173–2178][ol-level-loading], [game.h:60–95][ol-game-loading]

Para Oakhaven, un grafo sencillo de sectores y accesos puede ayudar a organizar visibilidad, sonido y carga anticipada. No hace falta implementar un sistema de portales completo antes de medir una zona propia. La selección de render y la carga/liberación de recursos deben conservar interfaces separadas: ocultar un mesh no necesariamente descarga su textura ni detiene su simulación.

## 7. Plataforma web del repositorio

La plataforma normal está escrita en C++ y utiliza Emscripten. Los scripts de build generan JavaScript y paquetes de datos; existe una variante explícita WASM. El HTML/PHP comprueba `WebAssembly` y elige `OpenLara_wasm.js`; si no está disponible, solicita `OpenLara.js` y un inicializador de memoria. [build.bat][ol-web-build], [build_wasm.bat][ol-web-wasm], [index.php:198–221][ol-web-selection]

El código de plataforma intenta WebGL 2 y, si no consigue contexto, WebGL 1. Registra teclado, ratón, toque, redimensionado y loop principal mediante callbacks de Emscripten. [main.cpp:161–200][ol-web-gl], [main.cpp:281–348][ol-web-input]

El cargador declara memoria inicial en `Module`, estado de descargas y tratamiento de pérdida de contexto WebGL. No se infiere de ello memoria real de una partida, tamaño total descargado ni compatibilidad probada en un navegador concreto. Los scripts contienen opciones de toolchain de época y este examen no los ejecutó con un SDK moderno. [index.php:60–90][ol-web-shell]

### Descarga y persistencia

`osDownload()` consulta si el nombre está en IndexedDB; si existe lo carga, y si no existe lo descarga. El resultado se escribe a fichero virtual y se entrega como `Stream`. Guardados y caché de plataforma usan funciones de IndexedDB con callbacks. [main.cpp:16–92][ol-web-storage]

En estas funciones se observó una ruta de fallo concreta, descrita abajo. No se probó guardar, recargar ni agotar cuota en la demo.

## 8. Críticas con mejora y prueba concreta

| Prioridad | Hallazgo respaldado | Mejora | Verificación necesaria |
|---|---|---|---|
| Alta para robustez web | `onLoadAndStore()` pasa `NULL` como argumento de callback a `emscripten_idb_async_store`, con `onError`; ese handler interpreta su argumento como `Stream*` y accede a `stream->name`. Según el contrato oficial, el callback recibe el argumento sin modificar. Hay una ruta estática de desreferencia nula si falla esa escritura. | Separar el error de caché del error de descarga. Un fallo de persistencia de un recurso recuperable no debe usar un handler que exige un `Stream` válido. Usar un contexto propio con vida útil explícita si hace falta identidad de la solicitud. | Forzar rechazo de escritura/cuota y comprobar que el nivel descargado se puede usar y que se comunica el fallo. No se reprodujo un crash durante esta revisión. |
| Media para cámara | Al salir de mirada, X usa `fabsf` para decidir si llegó a cero, pero yaw usa `lookAngle.y < EPS`. Todo yaw negativo satisface esa condición tras el primer paso de aproximación, mientras el positivo normalmente continúa interpolando. | Comparar el valor absoluto y conservar una política simétrica por dirección, junto a diferencia angular corta. | Liberar mirada desde ±0,5 rad con el mismo dt y comparar el recorrido de recentrado. La asimetría procede del código, no de una observación de la demo. |
| Media para recuperación | El fallo al consultar/cargar IndexedDB va al mismo handler de error que entrega `NULL` al consumidor; en la ruta examinada no hay un fallback explícito a descarga de red cuando falla la caché. | Clasificar caché no disponible, archivo ausente y fallo real de descarga; permitir red cuando sea apropiado y distinguir la disponibilidad del guardado. | Probar red disponible con IndexedDB rechazado, y después red ausente con recurso ya guardado. |
| Media para mantenibilidad | Cámara y render conocen rooms, sectores, boxes y unidades específicas del nivel. | En un juego nuevo, poner la consulta de cámara detrás de una interfaz de colisión/visibilidad y usar perfiles por héroe/contexto. | Sustituir una zona de prueba por otra geometría sin reescribir el controlador de cámara. |
| Media para evolución de contenido | La visibilidad tiene límites explícitos de profundidad y cantidad de rooms. No se ha demostrado aquí que un nivel válido los alcance. | Validar esos límites en el pipeline y emitir diagnósticos si se exceden; elegir presupuestos según contenido medido. | Un nivel de prueba que sobrepasa el límite debe fallar de forma explicable o degradarse con una política definida. |
| Media para reproducibilidad | Los builds web revisados no expresan en esos scripts una versión fijada del SDK ni aportan por sí mismos identidad verificable del ejecutable servido. | Fijar toolchain y dependencias; generar metadata de commit y hashes del bundle; conservar un ensayo de arranque del paquete publicado. | Reconstruir en un entorno limpio y comparar la identidad de los archivos o documentar las fuentes de no determinismo. |

La documentación oficial de Emscripten confirma que `arg` se reenvía a `onerror`; esta combinación con el código local sustenta el primer hallazgo. Es análisis de una ruta de fallo, no un resultado de ejecución del sitio. [Contrato de IndexedDB de Emscripten][ol-emscripten-idb]

**Cuidado con la corrección del primer hallazgo:** sustituir `NULL` por `stream` sin más tampoco resuelve la vida útil, porque `onLoad()` borra ese stream inmediatamente después de iniciar el almacenamiento asíncrono. La corrección debe separar callbacks o mantener un contexto independiente hasta terminar la operación. [main.cpp:27–40][ol-web-storage]

La asimetría de mirada se ve en [camera.h:440–445][ol-camera-recenter]. `clampAngle` conserva negativos del intervalo normal, y `EPS` es `FLT_EPSILON`; no hay una conversión que vuelva siempre positivo ese yaw. Para ±0,5 y un paso de 1/30, la aproximación produce ±1/3 antes del umbral: el negativo pasa directamente a cero con esa condición. [utils.h:93][ol-utils-eps], [utils.h:174–180][ol-utils-angle]

Se conserva una [prueba aritmética de esa condición](evidencias/prueba-aritmetica-recentrado.json), que evalúa la fórmula sin ejecutar el motor ni la demo. Es evidencia de la asimetría matemática del fragmento, no una medida de la cámara en pantalla.

## 9. Decisiones recomendadas para Oakhaven

1. **Cámara por contextos:** seguimiento, combate, interacción y cinemática con perfiles explícitos de distancia, altura, objetivo y transición.
2. **Objetivo visual por héroe:** exponer un punto estable y una altura de referencia; no acoplar toda la cámara a una malla concreta ni al seno usado para simular carrera.
3. **Colisión antes de pulir números:** un seguimiento agradable en una plaza necesita conservar legibilidad en puertas, esquinas y desniveles.
4. **Sectores con propósito:** usar conexiones de zonas para orientar, anticipar contenido y variar ambiente; introducir culling o portales más complejos cuando una medición lo justifique.
5. **Errores recuperables separados:** caché, descarga, guardado y parsing de recursos son fronteras diferentes, con estados y mensajes propios.
6. **Identidad de la versión visible:** mostrar o exportar build/commit permite conectar una observación de la web con el código que se revisa.

La comparación con Vice City debe conservar una diferencia: allí se estudiaron un port y escenas de una partida; aquí el código permite seguir mecanismos concretos, pero el comportamiento de la demo todavía requiere su propia comprobación. No se atribuyen FPS, sensación de control ni ausencia de clipping al repositorio por leer sus funciones.

## Fuentes fijadas y límites

Todos los enlaces de OpenLara siguientes fijan el commit revisado. No se compilaron ni ejecutaron sus binarios, no se alteró el repositorio y no se modificó el ledger REA. Las mejoras son propuestas de diseño e implementación para el proyecto del usuario.

[ol-camera-interface]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/controller.h#L18-L46
[ol-camera-constants]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/camera.h#L9-L98
[ol-camera-target]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/camera.h#L127-L167
[ol-camera-firstperson]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/camera.h#L179-L208
[ol-camera-clip]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/camera.h#L248-L328
[ol-camera-move]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/camera.h#L330-L353
[ol-camera-update]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/camera.h#L419-L557
[ol-camera-cinematic]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/camera.h#L372-L417
[ol-camera-fov]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/camera.h#L711-L719
[ol-camera-audio]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/camera.h#L113-L124
[ol-camera-render]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/camera.h#L634-L681
[ol-camera-recenter]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/camera.h#L440-L445
[ol-controller-trace]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/controller.h#L1054-L1086
[ol-game-timestep]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/game.h#L271-L325
[ol-game-loading]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/game.h#L60-L95
[ol-level-loading]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/level.h#L2173-L2178
[ol-level-audio]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/level.h#L2320-L2332
[ol-level-portals]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/level.h#L2495-L2589
[ol-level-view]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/level.h#L2619-L2657
[ol-level-rooms]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/level.h#L2004-L2059
[ol-level-entities]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/level.h#L2131-L2170
[ol-web-build]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/platform/web/build.bat
[ol-web-wasm]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/platform/web/build_wasm.bat
[ol-web-selection]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/platform/web/index.php#L198-L221
[ol-web-shell]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/platform/web/index.php#L60-L90
[ol-web-gl]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/platform/web/main.cpp#L161-L200
[ol-web-input]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/platform/web/main.cpp#L281-L348
[ol-web-storage]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/platform/web/main.cpp#L16-L92
[ol-utils-eps]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/utils.h#L93
[ol-utils-angle]: https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/utils.h#L174-L180
[ol-emscripten-idb]: https://emscripten.org/docs/api_reference/emscripten.h.html#c.emscripten_idb_async_store
