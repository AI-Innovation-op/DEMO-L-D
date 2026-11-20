# OpenLara: personaje, locomoción y animación

18 de noviembre de 2026, America/Lima. Análisis estático del checkout `3b268ca4bf986c380f44a26ffd9218bf6d376249` de [XProger/OpenLara](https://github.com/XProger/OpenLara/tree/3b268ca4bf986c380f44a26ffd9218bf6d376249). No se ejecutó el motor en esta parte de la investigación ni se modificaron su código o DEMO-L-D.

## 1. Qué aporta esta referencia

OpenLara vincula el movimiento al estado del cuerpo, a los datos temporales de la animación y a las condiciones del suelo. Las transiciones válidas, el pie que conduce una zancada, el espacio para saltar y la altura de un escalón tienen funciones explícitas. Ese vínculo es una referencia valiosa para que Thomas y Khaterine parezcan personajes que pisan y actúan dentro del mundo.

Esto es una conclusión sobre el código examinado. La sensación real de peso, latencia, precisión, fluidez y cámara necesita observación de una compilación ejecutada. Tampoco se ha establecido que la demo web pública contenga exactamente este commit.

## 2. Separación de responsabilidades que expresa el código

| Capa | Responsabilidad observada | Fuente fijada al commit |
|---|---|---|
| `Controller` | Pose global, animación, referencia al estado de animación, comandos y articulaciones. | [controller.h, línea 107](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/controller.h#L107) |
| `Character` | Salud, velocidades, input semántico y relación con suelo/aire/agua/agarre. Selecciona estado y ordena la actualización. | [character.h, línea 8](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/character.h#L8), [línea 203](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/character.h#L203) |
| `Lara` | Reglas concretas de acciones, salto, escalada, armas, colisiones, desplazamiento y selección de modo de cámara. | [lara.h, línea 69](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L69) |
| `Animation` | Tiempo, frames de referencia, estado, transición, velocidad, comandos y pose articulada. | [animation.h, línea 7](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/animation.h#L7) |

`Controller::state` es una referencia al estado de `Animation`, no un estado de gameplay completamente independiente ([controller.h, línea 116](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/controller.h#L116), [constructor en línea 160](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/controller.h#L160)). Esto explica parte del acoplamiento entre reglas y animaciones.

Para un personaje normal, `Character::update` recoge input, determina el tipo de apoyo, intenta el estado, actualiza el controlador/animación y después velocidad y posición. Si el nuevo lugar no produce una zona válida, puede restaurar la posición anterior. Esta lectura se limita a ese flujo; las cinemáticas tienen otro camino en `Lara::update` ([character.h, línea 203](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/character.h#L203), [lara.h, línea 3252](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L3252)).

## 3. Estados: la postura física importa

### Apoyo o medio

`Character::Stand` distingue aire, suelo, deslizamiento, agarre, bajo el agua, superficie y vadeo. `getNextState` deriva las reglas de acción según ese tipo de apoyo. No equivale simplemente a elegir entre un clip de reposo y uno de carrera. [character.h, línea 13](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/character.h#L13), [línea 149](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/character.h#L149).

La lista de Lara incluye caminar, correr, detenerse, giros, saltos direccionales, caída, agarre, pasos laterales, empujar/tirar, recoger, usar llave y estados de agua, entre otros. Su presencia en el enum no prueba por sí sola que toda acción funcione en toda versión del juego; deben seguirse sus reglas. [lara.h, línea 158](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L158).

### Transiciones permitidas en momentos concretos

`Animation::canSetState` y `setState` consultan estados y rangos de frames de los datos del nivel. Una transición puede existir y todavía no estar dentro de su intervalo permitido. Además, el retorno `true` de `setState` puede indicar que existe el estado solicitado, aunque en esa llamada no se haya cambiado de clip. Conviene distinguir esa semántica de «la transición ya terminó». [animation.h, línea 154](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/animation.h#L154), [línea 173](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/animation.h#L173).

**Lectura de diseño:** estas ventanas pueden conservar una continuidad corporal deliberada. También pueden introducir espera percibida si se trasladan sin ajuste a un combate que exige otra respuesta. El código no mide esa percepción. Para Oakhaven habría que elegir qué acciones esperan a una fase y cuáles admiten interrupción inmediata.

### Dirección y giro

En el camino de teclado terrestre examinado, `FORTH` solicita carrera; izquierda/derecha solas solicitan giro; con caminar aparecen pasos laterales y retroceso. El giro depende del estado y, durante carrera, de la inclinación del cuerpo. Es un control orientado por la dirección del personaje en ese camino de input, no una demostración de WASD relativo a la cámara. Hay ramas separadas para analógico y VR. [lara.h, línea 2525](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L2525), [línea 2628](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L2628), [línea 2671](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L2671), [línea 3384](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L3384).

Para Oakhaven, la continuidad de las poses se puede adoptar conservando la política de movimiento elegida para su tercera persona. Copiar directamente este controlador cambiaría también el diseño de los controles y la relación con los niveles.

## 4. Cómo se relacionan animación y desplazamiento

### Reloj y muestreo de pose

`Animation::update` incrementa tiempo mediante `Core::deltaTime`. La duración y el índice de frame se expresan usando una base lógica de 30 unidades por segundo. El `frameRate` del dato controla cómo se espacian las muestras de pose. Eso no establece que la imagen se renderice a 30 FPS. [animation.h, línea 68](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/animation.h#L68), [línea 77](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/animation.h#L77), [línea 112](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/animation.h#L112).

El sistema selecciona `frameA`, `frameB` y un factor `delta`. Si está activado `smooth`, usa la muestra siguiente, y puede prepararse para la siguiente animación; si no, repite la misma muestra. La posición local y las rotaciones de articulaciones se interpolan antes de componer la jerarquía. La función denominada `lerpAngle` para ángulos articulares convierte las rotaciones a cuaterniones y usa su `lerp`; no debe describirse automáticamente como un `slerp` de todo el esqueleto. [animation.h, línea 128](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/animation.h#L128), [línea 250](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/animation.h#L250), [utils.h, línea 1204](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/utils.h#L1204).

Este camino identifica interpolación entre muestras y preparación del siguiente clip. No demuestra un árbol genérico de mezcla continua entre cualquier par de animaciones.

### Velocidad definida en los datos de animación

La cadena estática más útil es:

```text
Datos del clip: speed y accel
    → Animation::getSpeed()
    → Lara::updateVelocity(): velocidad y dirección según apoyo/estado
    → Lara::move(): desplazamiento con deltaTime × 30 y colisiones
```

`getSpeed` calcula `speed + accel × time × 30`. Para varios estados de suelo y apoyo, Lara toma esa velocidad del clip; otras ramas, como la natación, usan reglas de aceleración propias. `move` combina velocidad, flujo y corrección de colisión. [animation.h, línea 202](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/animation.h#L202), [lara.h, línea 3455](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L3455), [línea 3635](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L3635).

No se debe resumir toda esta solución como «root motion moderno»: hay velocidad y aceleración en los datos, posición local de pose, offsets de fin de animación, comandos de salto y resolución de colisión. La autoridad del movimiento depende del camino concreto.

### Eventos ligados al avance temporal

`isFrameActive` comprueba si se ha cruzado un frame desde la actualización anterior. El controlador usa ese mecanismo para sonidos y efectos; al terminar un clip aplica offsets y salto antes de encadenar la siguiente animación. [animation.h, línea 150](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/animation.h#L150), [controller.h, línea 1136](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/controller.h#L1136), [línea 1193](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/controller.h#L1193).

Esto permite coordinar una acción con su presentación. No prueba que cualquier salto de tiempo, evento repetido o cancelación esté libre de errores; esos casos requieren ensayo.

## 5. Articulación y capas del cuerpo

Lara declara articulaciones de cadera, tres segmentos por pierna, pecho, brazos y cabeza, con máscaras de cuerpo superior e inferior. `Animation::getJoints` recorre nodos jerárquicos, compone transformaciones y admite rotaciones sobrescritas por máscara. [lara.h, línea 239](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L239), [animation.h, línea 254](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/animation.h#L254).

El camino `updateOverrides` copia la pose base, puede sustituirla por una reacción direccional de golpe, y aplica animaciones de los brazos al portar armas. También se ven correcciones para cabeza y pecho al mirar un objetivo. [lara.h, línea 1230](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L1230), [character.h, línea 250](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/character.h#L250).

**Aplicación:** Thomas puede conservar locomoción de piernas y orientar el torso para su arma, y Khaterine puede preparar/apuntar con el arco sin reemplazar indiscriminadamente todas las poses del cuerpo. Esto exige definir máscaras, prioridades y estados permitidos; no basta con superponer clips arbitrariamente.

## 6. Colisión, escalones, salto y agarre

### El pie conductor elige variantes

`getLeadingFoot` infiere la fase de apoyo a partir del estado y el frame. Al colisionar de frente y al ascender o descender, el código selecciona clips de izquierda o derecha. Se identifica una solución explícita de variantes por pie; eso no prueba que haya un solucionador IK universal ni que todo escalón produzca un apoyo perfecto. [lara.h, línea 2814](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L2814), [línea 3687](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L3687), [línea 3726](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L3726), [línea 3750](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L3750).

### El tipo de movimiento limita la altura permitida

`checkMove` hace una consulta de colisión antes de iniciar ciertos movimientos. En `move`, caminar y retroceder limitan el descenso; los pasos laterales tienen límites más pequeños; agua y agarre cambian radio, altura y offsets de consulta. Los valores pertenecen a la escala y formato de este motor. [lara.h, línea 2822](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L2822), [línea 3635](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L3635).

Hay consultas para mallas estáticas de la habitación y colisionadores de entidades, además de correcciones de posición y respuestas de impacto. Los comentarios del código señalan trabajo pendiente, por ejemplo colisiones entre habitaciones enlazadas y ciertas pruebas de cajas. No se presentan esos TODO como errores reproducidos. [lara.h, línea 3540](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L3540).

### Saltar y agarrarse son acciones con condiciones

El salto desde carrera usa una condición `canJump` ligada al estado y a una ventana de frames. La preparación de un salto direccional comprueba espacio frontal. El agarre en aire necesita determinadas poses, acción pulsada, manos libres, colisión frontal y coincidencia entre la altura de las manos y la superficie; después alinea el personaje. [lara.h, línea 2582](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L2582), [línea 2605](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L2605), [línea 2430](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L2430).

Al recuperar suelo se identifica una rama de daño por caída y selección de aterrizaje. [lara.h, línea 2380](https://github.com/XProger/OpenLara/blob/3b268ca4bf986c380f44a26ffd9218bf6d376249/src/lara.h#L2380).

**Aplicación:** si Oakhaven incorpora escalada, debe existir una prueba espacial y una acción corporal coherente. La propuesta no exige añadir escalada, agua o saltos a un diseño que no los necesita.

## 7. Críticas con mejoras aplicables

Son decisiones de adaptación y mantenimiento observadas en fuente, no fallos jugables reproducidos del port.

| Punto a revisar | Fundamento | Mejora propuesta para Oakhaven | Verificación útil |
|---|---|---|---|
| Reglas muy ligadas a índices y frames concretos. | Ventanas de salto, pie conductor y elección de clips usan IDs y números de frame. | Metadata semántica por clip: fase de apoyo, ventanas de interrupción y eventos nombrados; validar que existen al importar. | Cambiar la duración de un clip sin mover accidentalmente la ventana de golpe, apoyo o interacción. |
| Estado de acción y estado del animador comparten identidad. | `Controller::state` referencia `Animation::state`. | Mantener estado de juego por héroe y un estado de presentación derivado; que una malla oculta no conserve la autoridad de la acción del héroe activo. | Alternar Thomas/Khaterine en reposo, carrera, daño y menú sin transferir salud/arma ni ejecutar eventos duplicados. |
| Esperas de transición pueden tener una intención distinta del combate de Oakhaven. | Los rangos de `setState` difieren de un cambio inmediato. | Decidir por acción qué se cancela, qué espera y qué se almacena en un buffer corto de input. Nombrar el resultado como aplicado/diferido/rechazado. | Pulsar justo antes de una ventana y durante una cancelación; verificar una sola acción y la respuesta deseada. |
| Escala y colisión dependen del formato de salas/suelo clásico. | Límites en unidades como 64, 128, 256 y valores propios de la malla/nivel. | Perfil de desplazamiento en unidades documentadas: cápsula, pendiente, escalón, caída, agarre y margen. Mantenerlo separado del modelo visual. | Repetir una pequeña pista con pendientes, peldaños y puertas con ambos héroes y pasos temporales distintos. |
| Capas de armas y reacciones tienen prioridades codificadas directamente. | `updateOverrides` reemplaza articulaciones y modifica máscaras. | Una política explícita de capas: locomoción base, arma, mirada y reacción, con interrupciones y máscaras por héroe. | Apuntar caminando, recibir daño, abrir diálogo y cambiar de arma sin brazos rígidos o pose residual. |

## 8. Implementación mínima recomendada para Thomas y Khaterine

1. **Definir un eje frontal, escala y origen comunes.** Cada modelo se adapta dentro de un nodo visual propio; el controlador conserva la convención de movimiento, ataque y cámara.
2. **Crear un conjunto pequeño de clips propios.** Reposo, caminar, correr, inicio/parada, giro, daño y acciones del arma que realmente utiliza cada héroe. No producir decenas de clips antes de validar la locomoción básica.
3. **Elegir una autoridad de movimiento.** Empezar con controlador que resuelve intención, velocidad y colisión; alimentar el animador con velocidad real y fase. Si se usa desplazamiento conducido por animación en una interacción, delimitarlo como una acción y no sumar dos movimientos independientes.
4. **Separar presentación por héroe.** Un adaptador resuelve malla activa, rig, clips, máscaras y puntos de arma. El dominio conserva estadísticas e inventario por ID.
5. **Añadir eventos temporales con identidad.** Apoyo, sonido, contacto de arma y fin de interacción deben poder emitirse una sola vez al cruzar su instante, incluso si el frame salta. Un evento visual no autoriza por sí mismo daño o cambio de misión: debe validarlo el estado de juego.
6. **Calibrar con una pista corta.** Suelo, una esquina, una puerta, una pendiente y un escalón. Probar avance, parada, giro, golpe y cambio de héroe; medir distancia y comprobar pose con una observación continua.

Contrato de diseño orientativo, no implementado:

```ts
interface CharacterMotionView {
  heroId: string;
  velocity: { x: number; y: number; z: number };
  facingYaw: number;
  support: 'ground' | 'air';
  locomotion: 'idle' | 'walk' | 'run' | 'start' | 'stop' | 'turn';
  action: 'none' | 'attack' | 'dodge' | 'hit' | 'interact';
  actionInstanceId: number;
}

interface ClipEvent {
  name: 'footLeft' | 'footRight' | 'weaponContact' | 'interactionDone';
  timeSeconds: number;
}
```

El conjunto final depende del diseño. Este contrato no se deduce como API existente en OpenLara y no copia su código. Los PNG y láminas de referencia 3D ya entregados no son un rig con animaciones; el modo 3D necesita recursos articulados propios para lograr locomoción corporal comparable.

## 9. Ensayos que faltan para afirmar cómo se siente

- Caminar/correr, girar 90° y 180° y parar con una misma versión ejecutable; comprobar retraso, apoyos y encuadre.
- Saltar y agarrarse, si esa es la característica que se desea evaluar; verificar los límites de altura y dirección de forma reproducible.
- Comparar animación con desplazamiento a distintas tasas de actualización, sin confundir el reloj lógico de 30 unidades con FPS de render.
- Revisar impactos, pisadas y transiciones en una captura continua para detectar duplicados, pies que deslizan o cambios bruscos.
- Contrastar identidad del build web con el source antes de atribuir a ese binario los detalles exactos del checkout.

## 10. Puntos clave

OpenLara aporta una referencia especialmente fuerte para **acciones corporales con condiciones**, **zancada relacionada con movimiento**, **variantes por pie al cambiar de altura** y **articulación por capas**. Para Oakhaven conviene trasladar esos principios mediante contratos y recursos propios, manteniendo su política de controles y cámara. El análisis de fuente no sustituye observar la demo ni establece que todas sus funciones estén presentes en ella.
