# 08 — Decisiones, contexto y fuentes

## Alcance de esta entrega

Kevin pidió feedback completo, documentación técnica con críticas y mejoras implementables, todos los sprites de la carpeta de especificaciones y diseños de referencia para 3D. Confirmó conservar los originales y normalizar los PNG mediante recorte y reducción por vecino más cercano. Confirmó que el paquete no requiere GLB con rig/animaciones.

La entrega añade documentación, fuentes gráficas, exportaciones y herramientas del pipeline artístico. Los problemas del juego se documentan con sus soluciones propuestas; no se presentan como correcciones de runtime ya aplicadas.

## Fuentes del proyecto

| Fuente | Uso en la revisión |
|---|---|
| [Repositorio DEMO-L-D](https://github.com/AI-Innovation-op/DEMO-L-D) | Implementación vigente, pruebas y documentación de arte. |
| [Base exacta 5a5f3ca](https://github.com/AI-Innovation-op/DEMO-L-D/tree/5a5f3ca) | Referencia reproducible antes de esta entrega. |
| [Chat Double Blood](https://chatgpt.com/s/cx_6afca2beb2d0819193e9f675c186b9e3) | Historia de decisiones, canon, papel de Elowen y memoria de decisiones. |
| [Chat Revisa el juego con REA](https://chatgpt.com/s/cx_6afca67c276c819194fcde8616e2cb1b) | Revisión anterior del demo, problemas de progreso/controles y propuesta de una prueba 3D pequeña. |
| [Guía de sprites](../especificaciones/ESPECIFICACION_SPRITES_2D.md) | IDs, acciones, celdas, frames y familias visuales del pack. |
| [Guía de modelos](../especificaciones/ESPECIFICACION_MODELOS_Y_TEXTURAS_3D.md) | Diseño, escala, presupuesto y partes móviles para las referencias. |
| [Guía de estilo](../especificaciones/GUIA_ESTILO_Y_PALETAS.md) | Paleta, siluetas y clima visual. |
| [Compendio de la novela](../novela/INDICE_Y_COMPENDIO.md) | Personajes y organización narrativa presentes en el repositorio. |

## Acuerdos que tomo como contexto

- The Light in the Darkness es el nombre actual; Double Blood es el título anterior de la misma obra.
- La obra de Kevin es la referencia narrativa. Una adaptación propuesta no cambia el canon automáticamente.
- Thomas y Khaterine son personas distintas, no variantes de género de una misma persona.
- Elowen tendrá tramos propios y disponibilidad condicionada por la historia. En el código revisado sigue como NPC.
- La selección inicial y el cambio de control no deben transmitir mágicamente conocimientos entre personajes.
- Las rutas pueden converger conservando resultados locales y relaciones.
- El último chat favorece mejorar una base jugable y probar un espacio 3D pequeño antes de trasladar toda la campaña.

## Decisiones de producción propuestas

| Decisión | Recomendación y motivo | Estado |
|---|---|---|
| Base técnica inmediata | Consolidar el prototipo Three.js actual; evaluar una migración en una prueba separada si se desea. | Propuesta |
| Próxima implementación | Salud/estado por héroe y guardado antes de alquimia. | Propuesta |
| Celdas de arte | Contrato de la guía nueva; 64×64 para héroes con armas. | Aplicado al pack |
| Vista de sprites | Lateral derecha como base, sin afirmar ocho direcciones completas. | Alcance del pack |
| 3D | Láminas de referencia para modelado, sin GLB ni rig. | Confirmado por Kevin |
| Originales | Preservados; exportaciones separadas y variantes de QA conservadas. | Confirmado por Kevin |
| Color de fuego y símbolos | Seguir la guía vigente para este pack y registrar diferencias históricas antes de campaña. | Requiere dirección artística final |

## Conflictos que conviene cerrar explícitamente

### Pixel art lateral y modelos 3D completos

Ambos pueden existir como líneas de producción, pero tienen costes y cámaras diferentes. Una hoja lateral funciona con cámara controlada; un modelo necesita malla, UV y clips propios. Escoger qué representación se integrará en la siguiente sección evita producir dos juegos completos a la vez.

### Medieval anglosajón y gótico victoriano

El contexto inicial y la guía nueva utilizan etiquetas distintas. Se puede elegir una fantasía estilizada que mezcle referencias, pero debería ser una decisión consciente: arquitectura, farolas, vestimenta y símbolos deben parecer del mismo mundo.

### Cruces y Cáliz Solar

La iconografía religiosa actual está basada en cruces en varios props, mientras el desarrollo narrativo propuso un cáliz con rayos. Recomiendo un vocabulario por facción y función. Una cruz de un santuario no debería sustituir sin discusión todo el emblema de la institución ficticia.

### Tres escenarios y cinco actos

Son niveles de organización diferentes. Los capítulos del manuscrito, los actos de campaña y las zonas físicas no necesitan tener la misma cantidad. Documentar el mapeo antes de afirmar que cinco arenas representan cinco actos terminados.

## Referencias técnicas primarias

- [Animaciones de Phaser](https://docs.phaser.io/phaser/concepts/animations): hojas, frames y reproducción de clips.
- [GLTFLoader de Three.js](https://threejs.org/docs/pages/GLTFLoader.html): carga de escenas y animaciones glTF.
- [AnimationMixer de Three.js](https://threejs.org/docs/pages/AnimationMixer): reproducción de clips sobre un objeto.
- [Gestión de color de Three.js](https://threejs.org/manual/pages/color-management.html): tratamiento de texturas de color y salida.
- [Liberación de objetos de Three.js](https://threejs.org/manual/pages/how-to-dispose-of-objects.html): ciclo de vida de geometrías, materiales y texturas.
- [glTF 2.0](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html): formato, coordenadas y unidades de assets 3D.

Las recomendaciones de arquitectura y secuencia de trabajo son mi evaluación de este código y de su alcance. No son resultados medidos de esas fuentes ni una garantía de calendario o rendimiento.

