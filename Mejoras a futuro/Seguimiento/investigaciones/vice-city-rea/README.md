# Revisión de Vice City con REA

Documentación cerrada el 18 de noviembre de 2026, America/Lima. Proyecto de aplicación: The Light in the Darkness / DEMO-L-D. No se modificó el código del proyecto.

Abre [DOCUMENTACION_COMPLETA.md](DOCUMENTACION_COMPLETA.md) para leer todo en un archivo. También puedes consultar cada documento:

1. [Revisión jugable y decisiones de diseño](REVISION_DEL_JUEGO.md).
2. [Personaje, movimiento y cámara](PERSONAJE_Y_CAMARA.md).
3. [Análisis técnico del port y mejoras aplicables](ANALISIS_TECNICO.md).
4. [Registro de observación de la partida del usuario](OBSERVACION_USUARIO.md).

## Contenido del paquete

- `evidencias/`: capturas JPEG, verificación de identidad del cargador y bundle REA exportado.
- `captura/`: cargador inline extraído de la pestaña, metadata y resumen del manifiesto.
- `runtime/`: dos JavaScript públicos contrastados por tamaño y SHA-256 con el manifiesto de esa versión.
- `SHA256SUMS.json`: inventario y hashes de los archivos del paquete, excluido el propio inventario.

El bundle REA conserva cuatro registros: dos análisis padre y sus proyecciones. El análisis del cargador y del emulador de mando mantiene cobertura semántica parcial explícita. El runtime WebAssembly no se decompiló. El vuelo sostenido y un recorrido aéreo completo no se verificaron; la vista general del mapa y el tramo final a pie sí se observaron. El informe distingue hechos de código, observación visual y propuestas de implementación.

Las capturas pertenecen a la revisión de la referencia. El paquete no añade sprites ni modelos de Vice City a los recursos propios del proyecto.
