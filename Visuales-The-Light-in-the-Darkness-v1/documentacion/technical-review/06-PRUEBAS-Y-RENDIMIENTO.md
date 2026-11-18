# 06 — Validación, cobertura y rendimiento

## Línea base verificada

| Comprobación | Resultado en 5a5f3ca |
|---|---|
| Vitest | 38/38, ocho archivos |
| TypeScript | Sin errores en el comando de compilación |
| Vite | Compilación completada, 47 módulos transformados |
| JS de salida | 2.404,50 kB; gzip 574,33 kB |
| Navegador | Arranque del 3D, selector e inventario observados |
| Consola durante ese recorrido | Sin errores registrados |
| Regresión reproducida | Thomas 100/100 → Khaterine → Thomas 90/100 sin combate |
| Campaña completa | No validada por esta revisión |
| 60 FPS / p95 / p99 | No medidos en esta entrega |

Las pruebas unitarias actuales validan reglas útiles de inventario, progreso, combate, Shalem y almacenamiento. La prueba de fase 2 usa el Boss del dominio 2D, no la implementación de Morwenna embebida en el 3D. Esa diferencia de cobertura es más importante que aumentar el número total de comprobaciones.

## Comandos del proyecto

~~~sh
npm ci
npm test
npm run build
npm run dev -- --host 127.0.0.1
~~~

Usar package-lock.json para repetir la instalación. La sesión de revisión utilizó Node.js 24.22.3 del runtime disponible. No cambiar versiones de dependencias mientras se intenta reproducir un fallo de lógica salvo que la causa lo requiera.

## Pirámide de pruebas propuesta

### Dominio

Pruebas rápidas y deterministas para daño, postura, estados de acción, selección, inventario, habilidades, encuentro, recompensas y datos de guardado. Inyectar tiempo; no esperar con timers reales para probar una ventana de parry.

### Aplicación

Escenarios de varios comandos con repositorios falsos: derrotar al jefe, reclamar recompensa, guardar y cargar. Verificar el resultado de la sesión completa, no solo que se llamó a una función interna.

### Adaptadores

Probar fallo de localStorage, formato dañado, migración de V1, carga de recursos ausentes y resultado de audio desactivado. Para vistas, probar correspondencia de estado → animación/HUD, no duplicar la fórmula de daño.

### Recorrido de usuario

Una suite pequeña para arrancar, abrir una partida, cambiar, combatir, guardar, salir y continuar. Usar controles visibles, sin editar salud desde la consola. Las herramientas de depuración pueden ayudar a preparar un caso, pero deben declararse y no equivalen a completar el recorrido del jugador.

## Casos que faltan y que escribiría primero

| Caso | Preparación | Resultado esperado |
|---|---|---|
| Cambio sin combate | Ambos héroes sanos | Cambiar no altera sus vidas. |
| Heridas independientes | 73/100 y 41/90 | Se conservan en cambios y carga. |
| Cero válido | Postura 0 guardada | Carga como 0. |
| Partida dañada | JSON incompleto o tipos incorrectos | Recuperación controlada sin crash. |
| Recompensa idempotente | Dos eventos de derrota | Una llave y una concesión de EXP. |
| Estado de cementerio | Jefe derrotado, puerta abierta | Sigue consistente después de cargar. |
| Derrota de Khaterine | Su máxima efectiva es 90 | Nunca revive con 100/90. |
| Talento de postura | Ataque antes/después de comprar | Diferencia real y explicable en postura. |
| Talento de barrera | Mismo golpe antes/después | Mitigación definida, solo en su condición válida. |
| Buff de ceniza | Una definición de +25% o el valor aprobado | Texto, daño y duración coinciden. |
| Tecla repetida | Mantener Tab/L | Cambio/parry no se reabren indebidamente. |
| Pérdida de foco | Mantener movimiento y cambiar ventana | Al volver no hay movimiento atascado. |
| Entrada/salida 3D | Diez ciclos | Sin loops/listeners duplicados ni crecimiento indefinido. |

## Pruebas visuales del paquete

Resultado final de esta entrega: 123/123 recursos, 463 frames, cero errores y cero avisos automáticos pendientes. Se revisaron las hojas de secuencia de las once familias de actores, los props, los VFX y las referencias 3D. Se corrigieron variantes de arma, fondo y secuencia durante esa revisión; su trazabilidad queda en metadata/versions y prompts.json.

El catálogo se probó en navegador: búsqueda de Khaterine, GIF cargado, filtro de 22 referencias y consola sin errores durante ese recorrido. La integración de estas animaciones en combate sigue como trabajo propuesto.

El validador del pack comprueba ancho de la tira, alto de celda, archivos por frame, transparencia presente y número de frames distintos exactos. Crea GIF y hoja de contacto. Una advertencia de contacto con el borde invita a revisar recortes de arma/efectos; una animación idéntica en todos sus frames necesita corrección.

Añadir revisión humana de continuidad, manos, identidad entre clips, escala y posición de pies. Un frame distinto no implica una buena animación. Una hoja generada con apariencia de pixel art puede necesitar limpieza artística adicional, aunque la reducción por vecino más cercano sea correcta.

## Protocolo de jugabilidad

1. Dar a tres personas ajenas al desarrollo un objetivo breve y controles básicos.
2. Registrar si reconocen al personaje activo, la salida y un ataque telegrafiado.
3. Observar sin explicar durante el primer intento por qué fallaron o acertaron.
4. Pedir que lancen/recuperen un arma, cambien de héroe y continúen una partida.
5. Anotar puntos de confusión y tiempo hasta realizar cada acción.
6. Corregir señales o controles y repetir con participantes nuevos cuando el aprendizaje anterior sesgue el resultado.

La prueba no necesita medir si «les encanta todo». Debe responder preguntas concretas: ¿entienden el peligro?, ¿ven dónde está el arma?, ¿confían en continuar su progreso?, ¿el cambio de héroe aporta una decisión?

## Protocolo de rendimiento

El objetivo anterior de 60 FPS es una meta por validar. Conservar un escenario y una ruta reproducibles, una cámara fija por prueba y un número de enemigos conocido. Registrar equipo, alimentación, perfil de energía, navegador, resolución, devicePixelRatio, frecuencia y VSync.

Separar calentamiento, tiempo de carga y acción. Medir tres recorridos de cinco minutos con el mismo contenido; informar mediana y percentiles de frame time, pausas y condiciones. Los umbrales acordados anteriormente —p95 ≤18 ms, p99 ≤33,3 ms y ausencia de pausas de acción >100 ms— requieren medición externa o una instrumentación fiable. No deducirlos del límite de FPS del motor.

### Qué medir

- Tiempo de CPU de simulación y de presentación.
- Frame time y variación, además de FPS medio.
- Llamadas de dibujo, triángulos visibles y luces con sombras.
- Transparencias, partículas, resolución y relación con el coste de GPU.
- Recursos asignados antes/después de entrar y salir.
- Tiempo hasta interacción y peso descargado por modo.

### Optimización en orden

1. Medir y reproducir el problema.
2. Eliminar trabajo duplicado y DOM actualizado sin cambios.
3. Reutilizar geometrías/materiales y agrupar elementos repetidos cuando tenga sentido.
4. Reducir luces con sombras y transparencias costosas.
5. Ajustar resolución/efectos por perfil, conservando legibilidad.
6. Volver a medir la misma ruta.

Las ilustraciones de referencia no validan un presupuesto de polígonos ni una tasa de cuadros. El coste final depende de modelos, materiales, luces, pantalla y hardware.

## Cierre y evidencia

Por cada entrega guardar: commit/base, comando o recorrido, resultado esperado, resultado observado y artefacto pertinente. No llamar «integración» a una prueba que solo instancia un objeto del dominio. No afirmar que un sistema está verificado si su evidencia solo muestra el menú donde se anuncia.

