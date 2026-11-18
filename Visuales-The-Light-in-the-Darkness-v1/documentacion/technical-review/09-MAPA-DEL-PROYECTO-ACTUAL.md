# 09 — Mapa técnico del proyecto actual

Esta ficha describe la base 5a5f3ca. Los contratos de los capítulos 02 y 03 describen la arquitectura propuesta. Cuando una cifra difiere entre modos se conserva la diferencia para hacer visible el estado real.

## Entorno y dependencias

| Pieza | Versión instalada desde package-lock.json | Papel |
|---|---|---|
| Phaser | 3.90.0 | Escenas y presentación 2D/2.5D. |
| Three.js | 0.187.0 | Prototipo 3D de Oakhaven. |
| TypeScript | 5.9.3 | Comprobación estática. |
| Vite | 6.4.6 | Desarrollo y build web. |
| Vitest | 2.1.9 | Pruebas automatizadas. |

package.json declara rangos, por ejemplo Phaser ^3.88.2, y su versión de paquete sigue en 0.5.0; la portada del README dice 0.5.2. Para identificar un resultado de esta revisión se utiliza el commit, no esa etiqueta ambigua. Recomiendo acordar un único número de versión y actualizar paquete, interfaz y notas de entrega en el mismo cambio.

TypeScript usa strict, noUnusedLocals, noUnusedParameters, target ES2022 y noEmit. Los alias @domain, @application, @infrastructure y @presentation se declaran tanto en tsconfig.json como en vite.config.ts. El build comprueba tipos y deja a Vite la emisión de los archivos web. El include actual es src: no equivale a una comprobación completa de tipos de todos los tests.

Vite usa el puerto 3000, no abre el navegador automáticamente, apunta a ES2022 y mantiene assetsInlineLimit en cero. El frontend se entrega como archivos estáticos en dist. Esta base no necesita una API de servidor para el recorrido revisado; el progreso reside en el navegador. Una recarga desde otro origen, perfil o navegador no comparte automáticamente la partida.

## Cómo ejecutarlo y reproducir un hallazgo

~~~sh
npm ci
npm test
npm run build
npm run dev -- --host 127.0.0.1
~~~

Abrir http://127.0.0.1:3000/ para el flujo Phaser. Para solicitar el prototipo 3D al arrancar: http://127.0.0.1:3000/#3d o ?mode=3d. Si Vite anuncia otro puerto, usar el que muestra su consola. La revisión manual usó 4173 para aislar su servidor de comprobación.

Para revisar la compilación, ejecutar npm run preview -- --host 127.0.0.1. Servir dist mediante HTTP; abrir index.html directamente desde el disco no reproduce el entorno de módulos y recursos de la aplicación.

No borrar localStorage para reproducir un fallo sin guardar antes los datos que se quieran conservar. Una prueba nueva debe emplear un perfil/origen de ensayo o una exportación de sus claves. Las dos claves actuales están documentadas más abajo.

## Arranque y ciclo de vida

1. index.html crea game-container y el pie de controles.
2. main.ts registra DOMContentLoaded y crea Phaser.Game: resolución lógica 640×360, pixelArt y roundPixels, escalado FIT centrado.
3. BootScene prepara recursos; las escenas de título, introducción y juego coordinan el recorrido 2D.
4. launch3DPrototype oculta el canvas Phaser, pausa sus escenas activas, crea three-wrapper e instancia Oakhaven3DExperience.
5. init construye mundo, personajes, enemigos, interfaz, input y bucle de animación; restaura el guardado 3D disponible.
6. exit3DPrototype destruye la experiencia 3D, oculta su wrapper y devuelve visibilidad/reanudación a Phaser.

launch3DPrototype y exit3DPrototype se exponen en window para los handlers de interfaz. La instancia 3D también se expone durante su vida. Es una comodidad de prototipo; la lógica de aplicación propuesta debe recibir dependencias explícitas en vez de acceder a esas variables globales.

## Responsabilidades por archivo

| Ubicación | Responsabilidad actual |
|---|---|
| src/main.ts | Configura Phaser y alterna la experiencia 3D. |
| src/presentation/scenes/BootScene.ts | Preparación de recursos 2D y respaldos visuales. |
| src/presentation/scenes/TitleScene.ts | Portada, selección y continuación. |
| src/presentation/scenes/GameScene.ts | Simulación/presentación de la campaña 2.5D. |
| src/presentation/scenes/HUDScene.ts | Barras, avisos, objetivos y datos de combate. |
| src/presentation/scenes/CharacterDialogueScene.ts | Presentación de conversaciones. |
| src/presentation/scenes/MenuModalScene.ts / InventoryScene.ts | Consulta y menús del modo Phaser. |
| src/presentation/scenes/ShalemMinigameScene.ts | Interacción de mejora asociada a Shalem. |
| src/presentation/three/Oakhaven3DExperience.ts | Mundo, modelos procedurales, combate, IA, HTML, input, cámara y coordinación del guardado 3D. |
| src/domain/character | Personajes, estadísticas y progreso de nivel del modo 2D. |
| src/domain/combat | Combos, tipos de combate y desarme del dominio 2D. |
| src/domain/boss / enemy | Jefes y enemigos de ese dominio. |
| src/domain/inventory | Pilas de objetos, consumo, reliquias y serialización. |
| src/domain/progression | EXP de talentos, requisitos y modificadores declarados. |
| src/domain/story / mission | Hitos y objetivos narrativos. |
| src/domain/save/SessionStateStore.ts | Snapshot y almacenamiento de la sesión Phaser. |
| src/application/usecases | Orquestación de combate y acciones de Shalem. |
| src/application/ports | Contratos de audio y diálogo. |
| src/infrastructure/audio | Síntesis y reproducción mediante Web Audio. |
| src/infrastructure/dialogue | Datos de conversaciones. |
| src/infrastructure/storage/GameSaveManager.ts | Formato y almacenamiento del prototipo 3D. |
| public/assets | Recursos existentes que sirve Vite. |
| docs/novela | Manuscrito y compendio de Kevin. |
| Mejoras a futuro/Mejoras visuales | Especificación que dirige el nuevo pack. |
| godot_reference | Referencia parcial; no es una segunda implementación completa. |

La ubicación de SessionStateStore dentro de domain no vuelve puro su almacenamiento: accede directamente a window.localStorage. El capítulo 02 propone sacar ese acceso mediante un puerto de aplicación y un adaptador de infraestructura.

## Estadísticas iniciales: distinguir modos

| Entidad | Phaser / SessionStateStore | Oakhaven 3D |
|---|---|---|
| Thomas | Vida 100, postura 60, velocidad 220, defensa 8, ataque 35 | Vida 100, postura 50 antes de modificadores. |
| Khaterine | Vida 140, postura 100, velocidad 160, defensa 18, ataque 30 | Al cambiar: máxima 90, postura máxima 70; comparte playerStats. |
| Sabueso | Perfil del dominio Enemy | Vida 120. |
| Cultista | Perfil del dominio Enemy | Vida 90. |
| Flagelante | Perfil del dominio Enemy | Vida 130. |
| Penitente de cripta | No es la prueba de la rama 3D | Vida 130. |
| Morwenna | Boss usado por BossPhase.test: vida 350 | Vida 280, fase 2 al cruzar el 50%. |

No trasladar 220 de velocidad de Phaser a metros por segundo en Three.js. Son convenciones distintas. Si ambos modos deben compartir balance, definir unidades y perfiles explícitos antes de unificar números.

## Input real del 3D

| Acción | Tecla actual | Observación |
|---|---|---|
| Movimiento | WASD / flechas | La cámara y el plano de movimiento determinan la dirección visual. |
| Ataque ligero / flecha | J | Depende del héroe activo. |
| Ataque pesado / disparo cargado | K | No derivar el daño real del texto del pie HTML. |
| Guardia / barrera | L | keydown abre la ventana y keyup libera. |
| Esquiva | Espacio | Acción discreta. |
| Cambio de héroe | Tab | Se procesa antes de bloquear input por modal. |
| Lanzar espada | T | Solo Thomas. |
| Interacción / recoger / remate | E | Según objetivo de proximidad. |
| Consumible rápido | Q | En el README histórico también aparece como lanzar: hay conflicto. |
| Inventario | I | Escape permite cerrar. |
| Talentos | H | Escape permite cerrar. |
| Guardar / consagrar | G | Cerca de Cedric también restaura; lejos guarda sin esa restauración. |
| Cámara | C | Cambia oblicua/tercera persona; el pie global aún dice «Charlar». |
| Silencio | M | En Phaser se anuncia como minijuego de Shalem. |

No anunciar P como una pausa completa del 3D: su handler actual no la implementa como el menú Phaser. Tampoco asumir gamepad, rebinding o navegación accesible completa porque exista un botón HTML. El capítulo 05 propone resolver estos contextos y actualizar las ayudas desde una definición común.

## Inventario inicial y correspondencia de arte

| ID actual | Cantidad / máximo | Efecto o propiedad | Recurso del pack |
|---|---|---|---|
| maiden_balm | 3 / 10 | Cura 35. | icon_maiden_balm |
| saint_jude_rosary | 2 / 5 | Declara valor 50; la rama 3D repone toda la postura. | icon_jude_rosary |
| consecrated_ash | 1 / 5 | Declara +25% por 20 s; la rama 3D aplica +35%. | icon_consecrated_ash |
| relic_oakhaven_cross | 1 / 1, equipada | +70 ms de parry. | icon_oakhaven_cross |
| relic_willow_feather | 1 / 1 | -20% de fatiga de esquiva al equipar. | icon_black_willow_feather |

Hay dos ranuras de reliquia por defecto. El pack también incluye iconos de bálsamo del ocaso, agua bendita y llave porque los pide la guía. Tener un icono no implementa su objeto, efecto ni obtención. Añadir una tabla de correspondencia explícita evita que los nombres de archivos se confundan con IDs persistentes.

## Talentos actuales

Progression.createDefault inicia con 50 EXP de prueba. Cada rama sigue costes 40 → 70 → 110 y exige el talento anterior. Comprar consume EXP disponible; totalExpEarned se conserva aparte.

| ID | Dato declarado | Estado de integración 3D revisado |
|---|---|---|
| thomas_shield_strike | +35% de impacto de postura | No aparece aplicado en las rutas revisadas; H15. |
| thomas_blade_mastery | +20% de daño | Existe getter por héroe; mantener la prueba de su consumo en el resolver real. |
| thomas_iron_will | +25 de vida máxima | Se consulta al recalcular máximos; resolver con estado propio de héroe. |
| khaterine_piercing_arrow | +25% de daño de flechas | Getter de daño de flecha. El nombre no demuestra perforación física de varios blancos. |
| khaterine_shadow_step | +30% de distancia de esquiva | Consulta explícita en executeDodge para Khaterine. |
| khaterine_abyssal_ward | -50% del daño de guardia | No aparece aplicado en las rutas revisadas; H15. |

Al migrar, guardar IDs desbloqueados y la economía de EXP; resolver valores desde la versión de contenido. El serializador actual conserva las definiciones completas de SkillNode, lo que dificulta actualizar balance de partidas antiguas sin una política explícita.

## Persistencia existente

| Dato | Phaser | Three.js |
|---|---|---|
| Clase | SessionStateStore | GameSaveManager |
| Clave | the_light_in_darkness_save_v1 | the_light_in_the_darkness_save_v1 |
| Versión interna | version: 1.0.0 | La clave dice v1; no hay campo de esquema. |
| Héroes | Registro Thomas/Khaterine | activeHero y un único bloque de vida/postura. |
| Progreso | Acto, nivel/EXP, armas, reliquias de historia, hitos | Inventory, Progression y sanctuaryVisited. |
| Mundo 3D | No representa esa escena | No guarda jefa, puerta, destrucción, posición ni ledger. |
| Error de acceso | Booleano de persistencia | Puede recurrir a memoria temporal; también devuelve booleano. |

Son dos partidas de modos distintos. Su parecido nominal no implica compatibilidad. Los datos se leen con casts de TypeScript y comprobaciones parciales, sin un validador exhaustivo en runtime. No cambiar una clave para apuntar al otro formato sin una migración probada.

## API pública que concentra hoy la clase 3D

| Grupo | Métodos |
|---|---|
| Ciclo de vida | init, exit, destroy |
| Selección y sonido | toggleHero, toggleAudio |
| Mundo | handleContextInteraction, interactWithCemeteryGate, openCemeteryGate, setPlayerPosition |
| NPC | interactWithThomas, interactWithKhaterine, interactWithElowen, interactWithCedric, interactWithShalem |
| Diálogo | showDialogueModal, closeDialogueModal |
| Combate contextual | executeFinisher3D |
| Inventario | toggleInventoryModal, useQuickConsumable, useInventoryItem, toggleRelic |
| Progresión | toggleSkillTreeModal, unlockSkillFromTree |
| Guardado | executeSanctuarySave |

Esta tabla ayuda a localizar puntos de entrada; no recomienda convertirlos en API permanente. La extracción propuesta mueve reglas a aplicación/dominio y deja en la vista solo coordinación visual.

## Godot: límite comprobado

godot_reference contiene project.godot, PlayerController.gd y EnemyAI.gd, junto a su README. Falta la escena de arranque que referencia el proyecto. Importar la carpeta no basta para disponer de un juego ejecutable completo. Si se elige esa vía, hay que crear escenas, nodos, recursos, señales e integración de los scripts y volver a probar el mismo recorrido.

## Mantenimiento del paquete nuevo

El arte vive fuera de public para evitar que la aplicación cargue originales de alta resolución. La herramienta tools/artpack/normalize.py reconstruye exportaciones, GIF, catálogo y manifiesto desde asset-plan.json y sources. Requiere Python y Pillow; no llama a un servicio de generación ni necesita una clave API.

~~~sh
python tools/artpack/normalize.py --require-complete
python tools/artpack/package_delivery.py
~~~

El primer comando comprueba cobertura y reconstruye exportaciones. El segundo genera el dossier consolidado, el catálogo documentado y el ZIP de entrega. Las fuentes permanecen intactas. No ejecutar build_plan.py sobre un plan que se haya editado manualmente sin revisar su diff: sirve para reconstruir el inventario inicial a partir de las guías, no para decidir silenciosamente nuevas direcciones artísticas.
