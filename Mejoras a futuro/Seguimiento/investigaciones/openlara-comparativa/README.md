# Revisión de OpenLara y comparación con Vice City

18 de noviembre de 2026, America/Lima. Fuentes: `XProger/OpenLara`, commit `3b268ca4bf986c380f44a26ffd9218bf6d376249`.

Abre [DOCUMENTACION_COMPLETA.md](DOCUMENTACION_COMPLETA.md) para leer la revisión en un solo archivo. Los documentos individuales son:

1. [Conclusiones, comparación y plan para Oakhaven](REVISION_Y_COMPARATIVA.md).
2. [Personaje, locomoción y animación](PERSONAJE_Y_ANIMACION.md).
3. [Cámara, arquitectura espacial y plataforma web](CAMARA_Y_ARQUITECTURA.md).

El paquete incluye registros de alcance, identidad de fuentes, una prueba aritmética del recentrado y el resultado fallido del intento de abrir la demo mediante REA. La demo no llegó a ser jugable en este entorno; no se presentan capturas, FPS ni sensaciones de control como si se hubieran observado.

`repositorio/` es la copia local de estudio y no forma parte del ZIP documental. Los enlaces a código fijan el commit revisado y el inventario conserva hashes de quince archivos relevantes. El texto de licencia del repositorio está en [LICENSE_OpenLara.txt](LICENSE_OpenLara.txt).

La fuente de OpenLara y DEMO-L-D se conservaron sin cambios. Las propuestas de implementación y las pruebas de aceptación están documentadas; no se integró un motor nuevo ni se ejecutaron binarios del repositorio.

`SHA256SUMS.json` permite comprobar los archivos entregados. `evidencias/verificacion-documentacion.json` registra la comprobación de enlaces y rangos de líneas contra el checkout local. El checkpoint REA contiene cero registros retenidos: el fallo ocurrió antes de capturar el juego, y su observación parcial se conserva por separado en `rea-intento-demo.json`.
