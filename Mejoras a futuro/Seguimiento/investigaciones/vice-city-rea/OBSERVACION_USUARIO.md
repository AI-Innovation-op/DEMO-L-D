# Observación de la partida del usuario

18 de noviembre de 2026, America/Lima. En esta fase el usuario conduce la partida y el agente solo toma capturas; no envía teclas, clics ni cambios de vista. La observación se realiza con imágenes puntuales, no con una grabación continua ni mediciones de rendimiento.

## Registro de imágenes

| Hora local | Captura | Observación directa |
|---|---|---|
| 14:24:50 | [01](evidencias/observacion-usuario-01.jpg) | Cinemática interior, encuadre dirigido y franjas negras; el HUD jugable no aparece. |
| 14:25:51 | [02](evidencias/observacion-usuario-02.jpg) | Personaje a pie sobre una acera, peatones cercanos y cámara elevada oblicua; aparecen radar y HUD. La salud visible es 94. |
| 14:26:35 | [03](evidencias/observacion-usuario-03.jpg) | Personaje muy próximo a otro peatón, junto a una señal de parada; la pose de brazos y el encuadre cambian. Una imagen aislada no establece el instante de impacto ni la reacción completa del otro personaje. |
| 14:27:35 | [04](evidencias/observacion-usuario-04.jpg) | Interior del hotel con marcador rosa, el mismo color en el radar y texto «Camina hasta el marcador rosa para continuar». Personaje en pose de desplazamiento. |
| 14:28:15 | [05](evidencias/observacion-usuario-05.jpg) | Personaje montado en scooter frente a una intersección, taxi y otros vehículos. La cámara está más baja y detrás del vehículo; aparece el rótulo de radio «FLASH FM». |
| 14:29:05 | [06](evidencias/observacion-usuario-06.jpg) | Conducción de un buggy identificado como «BF Injection», en avenida con palmeras y tráfico; la salud visible es 85. El intervalo entre imágenes no permite atribuir la pérdida de salud a una acción concreta. |
| 14:29:47 | [07](evidencias/observacion-usuario-07.jpg) | Buggy en otra calle con tráfico; aparece el rótulo «Washington Beach». Fachadas bajas de color y torres al fondo distinguen planos de profundidad. |
| 14:30:47 | [08](evidencias/observacion-usuario-08.jpg) | Personaje a pie junto a otro acceso con marcador rosa; el mismo lenguaje visual del hotel reaparece en la calle. |

## Última prueba: personaje a pie y cámara

El usuario pidió centrar el cierre en el aspecto del personaje al avanzar y en la cámara. Tras su confirmación, se observó el tramo a pie sin enviar controles.

| Hora local | Captura | Observación directa |
|---|---|---|
| 14:31:32 | [Personaje 01](evidencias/personaje-camara-01.jpg) | Secuencia de presentación del traje, con plano bajo y franjas negras. |
| 14:31:51 | [Personaje 02](evidencias/personaje-camara-02.jpg) | Personaje con traje, cuerpo completo desde atrás en la calle; objetivo «Ve al barco del Coronel». |
| 14:32:09 | [Personaje 03](evidencias/personaje-camara-03.jpg) | Conducción de moto; se registra como contexto distinto, no como prueba de caminar. |
| 14:33:00 | [Personaje 04](evidencias/personaje-camara-04.jpg) | Pose inclinada con extremidades extendidas; la imagen no permite asignar con certeza la acción que la causó. |
| 14:33:22 | [Personaje 05](evidencias/personaje-camara-05.jpg) | Desplazamiento a pie con rodilla elevada; se ve el espacio por delante del personaje. |
| 14:33:39 | [Personaje 06](evidencias/personaje-camara-06.jpg) | Pose legible de carrera, cuerpo completo y cámara detrás con espacio para leer la calle. |
| 14:34:10 | [Personaje 07](evidencias/personaje-camara-07.jpg) | Carrera y cambio de orientación junto a césped y costa; se conserva la silueta completa. |

La interpretación visual y la propuesta técnica completa están en [PERSONAJE_Y_CAMARA.md](PERSONAJE_Y_CAMARA.md). No se midió la continuidad de animación ni latencia mediante vídeo; las conclusiones distinguen composición observada y mejoras propuestas.

## Lectura para Oakhaven

1. **Separar presentación de cinemática y juego.** La desaparición del HUD y el encuadre dirigido distinguen la narración de la exploración. En Oakhaven conviene un estado explícito que controle cámara, HUD e input al entrar y salir de un diálogo o secuencia.
2. **Hacer legible el espacio cercano.** La cámara elevada permite leer acera, calzada y peatones. El personaje necesita un contacto de pies claro y una escala consistente con puertas y mobiliario; los recursos nuevos deben probarse dentro de ese entorno, no solo en láminas aisladas.
3. **Comprobar acciones con secuencias completas.** Las poses permiten reconocer cambios de acción, pero estas capturas no bastan para puntuar fluidez, latencia, anticipación o sincronización de un golpe. Para validar esos aspectos del proyecto hace falta una prueba continua que incluya inicio, contacto y recuperación.
4. **Repetir la señal del objetivo entre mundo y mapa.** El marcador rosa del hotel combina volumen visible, símbolo del radar y una instrucción corta. Oakhaven debería representar una interacción mediante un ID y derivar de él la señal del mundo, el icono y la ayuda; evitar tres estados independientes que puedan contradecirse. El color debe acompañarse de forma/símbolo y texto para no ser el único canal de identificación.
5. **Cambiar cámara y pose según el contexto.** La scooter tiene una pose de conducción y un punto de vista distinto del desplazamiento a pie. Para el proyecto, definir estados de presentación explícitos y sus transiciones, sin reconstruir la identidad ni las estadísticas del héroe. La pose en una captura no prueba la calidad de todas las transiciones de animación.
6. **Comunicar los cambios de zona sin exigir un menú.** El rótulo «Washington Beach» da un nombre al lugar durante el recorrido. Oakhaven puede mostrar una etiqueta breve al cruzar límites de sector y actualizar el mapa y la ambientación desde el mismo evento de entrada a zona. Las capturas no establecen si hubo o no una pausa de carga entre ellas.

Este registro amplía la revisión anterior. Los resultados nuevos deben conservar la distinción entre lo que juega el usuario y lo que ejecutó el agente.
