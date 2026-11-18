# Notas de producción y revisión artística

La guía vigente define el inventario de este pack. Los originales provienen de image_gen integrado. Las tiras de juego y los frames individuales se obtienen por recorte y vecino más cercano, según la autorización de Kevin. Las láminas 3D son referencias para un modelador.

## Correcciones realizadas durante la revisión

- Thomas desarmado: se sustituyeron tres primeras variantes que conservaban una espada; las seleccionadas muestran puños sin arma.
- Shalem: se pidió una referencia de gato natural sin equipo añadido.
- Khaterine: se eliminó fondo residual y se sustituyó la carrera de arranque/parada por ocho fases de carrera continua.
- Morwenna: se eliminó el fondo residual del torbellino y se rehízo la transición para comenzar sin alas y desplegarlas progresivamente.
- Rosario: se sustituyó una variante con damero pintado por un diseño más sencillo de cuentas, cruz y borla sobre transparencia.
- Farola: se retiró el fondo de estudio y se comprobó el alfa en zonas de fondo; los estados de parpadeo y rotura permanecen separados.
- Exportación: se reservó espacio por encima del pivote y se fijó una línea de apoyo común por clip para evitar recortes y conservar el movimiento vertical.

Las variantes anteriores se conservan en sources/versions y metadata/versions. No se cuentan como recursos adicionales ni son la selección final.

## Qué aprobar al integrar

La revisión de secuencias permite detectar los problemas grandes. Una animación generada todavía puede variar pequeños detalles del rostro, los pliegues o la proporción entre clips. El remate final debe revisarse a tamaño nativo y sobre el fondo de la escena.

1. Usar idle como referencia de altura, cabeza, hombros y arma por personaje.
2. Comparar el primer y último frame de walk/run; ajustar la temporización o corregir un frame si se percibe un salto.
3. Alinear la raíz de juego con el pivote del manifiesto, manteniendo colisión y sombra independientes.
4. Definir las ventanas de anticipación/contacto/recuperación con la regla de combate. No conceder daño por cada frame visible de una estela.
5. Probar el ataque contra un objetivo inmóvil y después contra una patrulla; comprobar alcance y lectura de la amenaza.
6. Aprobar una muestra antes de extender cámaras o direcciones. El pack base es lateral derecho.

No usar el número de frames distintos como una puntuación de calidad artística. El validador detecta condiciones mecánicas; la selección final de estilo y actuación pertenece a la dirección de Kevin.

## Correspondencia con el ZIP

El layout de trabajo es art/pack-v1. El ZIP de entrega reagrupa las imágenes en personajes/, enemigos/, iconos/, props/, efectos/ y 3D/; su manifiesto y catálogo utilizan esas rutas. Los bytes de los PNG se conservan.
