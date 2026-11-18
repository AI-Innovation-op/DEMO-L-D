# 04 — Dirección de arte, producción e integración

## Alcance confirmado

El paquete cubre los sprites PNG y las láminas de referencia 3D de las guías actuales. Kevin autorizó recortar los frames y reducir con vecino más cercano, entregando también los originales. La creación utiliza image_gen integrado. La normalización y las previsualizaciones se realizan con Python/Pillow.

Las hojas generadas son candidatos artísticos. La verificación automática comprueba archivos, dimensiones, transparencia, número de frames y duplicados exactos; no certifica anatomía, continuidad de cada movimiento ni el ajuste final del combate. La revisión dentro del juego sigue siendo una puerta de aprobación necesaria.

## Dirección visual que conservaría

- Fondo nocturno frío y masas de piedra/madera oscuras, con luces cálidas localizadas.
- Thomas: silueta humana ágil, túnica y bufanda ciruela, acero legible, sello violeta.
- Khaterine: silueta triangular por hábito y velo, arco distintivo y magia amatista.
- Elowen: vestido azul, pájaro de madera y luz argéntea contenida.
- Shalem: gato negro de ojos dorados, movimiento y actitud reconocibles sin necesitar texto constante.
- Morwenna: tocado alto y crisol; fase 2 identificable por alas, halo y mandoble.
- Enemigos: ceniza/brasas para sabueso, incensario y máscara para cultista, cadena y venda para flagelante, huesos/cian/claymore para penitente.

La guía nueva usa imaginería gótica con cruces y farolas de aceite. El manuscrito y los acuerdos antiguos también hablan del Cáliz Solar y un entorno medieval anglosajón. Mantener esa diferencia en el registro de decisiones y aprobar el uso de cada símbolo antes de producir una campaña completa.

## Paleta funcional

| Color | Papel |
|---|---|
| #06040b / #141219 | Abismo y fondo de escena |
| #272233 / #3d2716 | Piedra y madera |
| #d4af37 / #ffd700 | Bronce y oro de interacción/parry |
| #aa44ff / #73299e | Energía del Sauce y sello |
| #b5d4ff | Luz argéntea |
| #ff2233 / #ff5511 | Peligro inquisitorial y pira |
| #00e5ff / #d6cfc7 | Fuego de almas y hueso |

El color no sustituye al contorno. La advertencia de un ataque debe tener una forma y una fase temporal distintas de su impacto. Si ambos son círculos brillantes simultáneos, el jugador no sabe cuándo esquivar.

## Contratos de sprites

| Grupo | Celda exportada |
|---|---|
| Thomas / Khaterine con armas | 64×64 |
| Shalem | 32×32 |
| Elowen / Cedric / Cultista | 48×48 |
| Sabueso | 64×48 |
| Flagelante / Penitente | 64×64 |
| Morwenna fase 1 | 96×96 |
| Morwenna fase 2 | 128×128 |
| Iconos | 32×32 |
| Props y VFX | Dimensión específica del manifiesto |

Los dos héroes usan la opción de 64×64 que admite la guía para armas y efectos. La exportación es una tira horizontal: ancho = celda × frames; alto = alto de celda. Los originales pueden tener cuadrícula y resolución distintas. La metadata conserva el orden de lectura para reproducir la exportación.

Origen normalizado de actores/props en suelo: (0.5, 0.9). Los VFX centrados emplean (0.5, 0.5); los pilares se apoyan en suelo. La sombra, la colisión y el punto de interacción se generan aparte del recorte del dibujo.

La normalización aplica una escala uniforme por hoja y una línea de apoyo común a todos los frames del actor. No recentra cada pose por separado: conserva el desplazamiento vertical relativo de la secuencia. La escala entre dos clips diferentes sigue necesitando revisión artística porque el generador puede cambiar proporciones. Las hojas de secuencia en previews permiten detectar ese salto antes de integrar.

El pack lateral representa la dirección derecha. No cuenta como un juego completo de ocho direcciones. El espejo horizontal puede ayudar en la versión lateral, pero necesita revisar espada, manos, símbolos y accesorios asimétricos. La variante 3D requiere su propio rig y clips.

## Estructura de entrega

~~~text
art/pack-v1/
  sources/              originales seleccionados de image_gen
    versions/           variantes sustituidas durante QA
  metadata/             prompt, referencia, acción y parámetros por recurso
  sprites/              tiras PNG normalizadas por grupo
  frames/               PNG individuales numerados desde 00
  concepts/             láminas 3D, sin prometer geometría exportable
  previews/             GIF de revisión y hojas de contacto
  asset-plan.json       inventario pedido por las guías
  manifest.json         archivos entregados y estado
  validation-report.json
  prompts.json
  catalog.html          catálogo local con búsqueda y filtro
~~~

Los originales permanecen además en el directorio de generación de Codex; la entrega copia los archivos al proyecto para no depender de esa ubicación. No es necesario copiar sources a la carpeta pública del juego: se integran solo exportaciones aprobadas.

## Cómo integrar las hojas en Phaser

El siguiente fragmento es una referencia de integración; esta entrega no sustituye la escena de combate.

~~~ts
interface SpriteEntry {
  id: string;
  file: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  frameRate: number;
  repeat: number;
  origin: [number, number];
}

function preloadSprite(scene: Phaser.Scene, entry: SpriteEntry): void {
  scene.load.spritesheet('artv1_' + entry.id, '/assets/approved/' + entry.file, {
    frameWidth: entry.frameWidth,
    frameHeight: entry.frameHeight
  });
}

function createAnimation(scene: Phaser.Scene, entry: SpriteEntry): void {
  if (entry.frames <= 1 || entry.frameRate <= 0) return;
  const key = 'artv1_' + entry.id;
  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(key, { start: 0, end: entry.frames - 1 }),
    frameRate: entry.frameRate,
    repeat: entry.repeat
  });
}
~~~

Copiar el manifiesto y las hojas elegidas a una ruta de recursos aprobados, adaptar el prefijo de URL y mantener claves nuevas para no colisionar con los PNG estáticos anteriores. Crear las animaciones una vez, no en cada update. Llamar play solo cuando cambia la acción para no reiniciar continuamente el clip.

Los props representan estados además de animaciones: no reproducir intacto → roto como un bucle de ambientación. La farola incluye clips separados en el manifiesto: intacta [0], parpadeo [1–3] y rota [4]. Para la verja, reproducir la apertura una vez al recibir GateUnlocked y mantener su estado abierto al restaurar el mundo. Los frames de impacto de combate deben aprobarse con la definición de ataque, no inferirse automáticamente del máximo brillo de una imagen.

El sistema de animaciones de Phaser reproduce secuencias de frames de una hoja o atlas; [documentación oficial](https://docs.phaser.io/phaser/concepts/animations). La temporización de impacto debe seguir el contrato del combate y coincidir visualmente con el frame de contacto.

## Uso opcional en una presentación 2.5D de Three.js

Un sprite lateral se puede colocar en un plano o billboard dentro de una escena con profundidad. Eso sirve para un estilo 2.5D con cámara controlada. No convierte la hoja en una textura UV válida para una malla humanoide.

Para un billboard, mantener la raíz en el suelo, orientar la tarjeta hacia la cámara permitida, elegir filtrado nearest y actualizar la región UV del frame. Definir una política de profundidad/alpha consistente y probar solapamientos de héroes, alas y humo. La colisión permanece en un volumen de juego separado del plano.

Si el objetivo principal sigue siendo personajes completamente modelados y cámara semilibre, usar las láminas como referencia para producir GLB. No forzar la estética lateral a una cámara que pueda rodear una tarjeta plana.

## Contrato de modelado 3D

| Familia | Presupuesto orientativo de la guía | Altura/unidad |
|---|---|---|
| Héroes | 1.200–2.500 triángulos | Thomas 1,80 m; Khaterine 1,75 m |
| Enemigos comunes | 800–1.500; variantes según ficha | Medir contra el héroe |
| Morwenna | 2.500–4.000 | 2,10 m con tocado |
| Props simples | 150–400; arquitectura según ficha | Barril 0,90 m |

Son presupuestos de producción, no conteos medidos de las láminas. Las ilustraciones muestran detalles que se pueden resolver con textura; no implican que cada pliegue deba modelarse.

La guía llama -Z a la dirección de frente. La especificación glTF define +Y hacia arriba y el frente del asset hacia +Z; la cámara es otro objeto con su propia convención. Documentar una conversión en la raíz del adaptador cuando el controlador del proyecto use -Z. No corregirlo a la vez en Blender y en el código. [glTF 2.0, sistema de coordenadas](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#coordinate-system-and-units).

### Nodos y sockets

- Raíz de personaje a nivel de los pies, escala 1 unidad = 1 metro.
- weapon_sword / weapon_bow como nodos sustituibles, con sockets de manos documentados.
- Morwenna: accesorios de alas, halo y espada activables por evento de fase.
- Verja: pivote por hoja, permitiendo apertura sin mover los pilares.
- Props rotos: submallas de fragmentos con presupuesto de vida y cantidad de debris.

Un wireframe dibujado en una lámina no es una topología real ni un rig comprobado. Antes de exportar un modelo, verificar su malla, deformaciones, UV, materiales y nombres de clips en un visor glTF y en la escena real.

## Carga y animación de GLB

~~~ts
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';

const gltf = await new GLTFLoader().loadAsync('/assets/models/thomas_hero.glb');
const root = gltf.scene;
scene.add(root);
const mixer = new AnimationMixer(root);
const idle = gltf.animations.find(clip => clip.name === 'Idle');
if (idle) mixer.clipAction(idle).play();
// En el bucle visual: mixer.update(deltaSeconds).
~~~

Este ejemplo requiere un GLB producido y validado; las láminas de esta entrega no se cargan con GLTFLoader. El cargador y el mezclador están descritos en las fuentes oficiales: [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) y [AnimationMixer](https://threejs.org/docs/pages/AnimationMixer).

## Texturas, luz y legibilidad

Usar color base y emisivo como color; los datos de roughness/metalness son mapas de datos. Seguir la gestión de color del pipeline glTF y verificar la apariencia en el renderer final. Evitar pintar grandes sombras direccionales sobre la ropa si después se quieren iluminar desde lados distintos. [Gestión de color de Three.js](https://threejs.org/manual/pages/color-management.html).

Las láminas de referencia no son mapas UV ni PBR. Los mapas finales se producen sobre el UV del modelo aprobado. Para el prototipo se pueden mantener roughness y metalness constantes por material hasta que exista una necesidad visual concreta.

## Puerta de aprobación artística

1. Abrir original, exportación y GIF del mismo recurso.
2. Confirmar silueta, ropa, arma, manos y paleta contra su ficha.
3. Verificar número de frames y orden de la acción.
4. Comprobar pie estable, ausencia de recortes y continuidad entre último/primer frame de los loops.
5. Revisar a escala 1× y 2× sobre noche, piedra y luz de antorcha.
6. Ajustar temporización junto al combate; distinguir anticipación, contacto y recuperación.
7. Aprobar una versión y marcarla como integrada solo después de probarla en el juego.

Los avisos del validador son señales para revisar, no una aprobación automática. Las variantes que no superan la revisión se conservan como fuentes/versiones y no se presentan como la selección final.

