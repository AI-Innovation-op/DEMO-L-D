# Visuales y documentación — The Light in the Darkness

Obra y personajes de Kevin. Base revisada: 5a5f3ca. Pack v1, 17/11/2026.

## Abrir la entrega
1. Extrae el ZIP completo.
2. Abre [catalogo.html](catalogo.html): funciona localmente y permite buscar y ver animaciones.
3. Consulta [documentación completa](documentacion/technical-review/DOCUMENTACION_COMPLETA.md) y [notas de arte](documentacion/NOTAS_DE_ARTE.md).
4. Consulta [manifiesto.json](manifiesto.json) para integrar archivos y [validacion.json](validacion.json) para conocer el resultado mecánico.

## Carpetas
- personajes/: Thomas, Khaterine, Shalem, Elowen y Cedric.
- enemigos/: sabueso, cultista, flagelante, penitente y Morwenna en dos fases.
- iconos/: consumibles, reliquias y talentos.
- props/: estados del entorno.
- efectos/: secuencias VFX.
- 3D/: referencias para modelado, por personajes/enemigos/props.
- previews/: hojas de contacto y secuencias completas.
- documentacion/: revisión técnica y especificaciones del proyecto.

Cada grupo 2D incluye sprites, frames, originales, previews y metadatos. Los originales sustituidos en QA están en originales/versiones; no son la selección final.

## Cobertura y uso
123 recursos: 65 hojas de animación, 14 iconos, 11 VFX, 11 props y 22 referencias 3D. 463 frames 2D.
Los PNG de juego son tiras horizontales a la celda indicada en el manifiesto. Las hojas de revisión muestran las secuencias completas. La vista base es lateral derecha; no son ocho direcciones.
Las referencias 3D no son GLB, UV, texturas PBR, rigs ni clips esqueléticos.
Hay 0 recursos con avisos automáticos. Una validación mecánica correcta no certifica continuidad artística perfecta; aprobar cada clip en el juego.
El combate del proyecto no se ha sustituido por este pack. La documentación distingue comportamiento actual y propuestas.
Generación: image_gen integrado. Normalización autorizada por Kevin: recorte y vecino más cercano con Python/Pillow. Prompts y ediciones en prompts.json.
La estructura de este ZIP es la solicitada para entrega; el repositorio conserva art/pack-v1 como layout de trabajo.
