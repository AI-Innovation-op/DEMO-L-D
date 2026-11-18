# 05 — Plan de implementación recomendado

## Objetivo de producción

Conseguir una sección de Oakhaven que se pueda jugar, entender, perder, reintentar y continuar sin inconsistencias. El objetivo artístico es que el jugador reconozca a los protagonistas y entienda cada ataque con la cámara y la iluminación reales. Esta entrega documenta el trabajo; no declara corregidos los hallazgos del informe.

## Orden y dependencias

~~~mermaid
flowchart TD
  A[Congelar base y casos de reproducción] --> B[Party y estado de héroes]
  B --> C[Guardado V2 y checkpoints]
  C --> D[Morwenna y recompensas de mundo]
  B --> E[Input por contexto y derrota]
  D --> F[Integrar arte aprobado]
  E --> F
  F --> G[Recorrido completo y pruebas externas]
  G --> H[Alquimia o siguiente tramo narrativo]
~~~

No hace falta detener toda producción artística mientras se corrige el dominio. Se pueden preparar hojas y referencias en paralelo, manteniendo una puerta de aprobación antes de integrarlas al juego.

## Entrega 1 — Estados de héroe fiables

**Problema que resuelve:** pérdida de salud y reposición de postura al cambiar; estadísticas fuera de rango después de una derrota.

**Implementación:** crear Party/HeroState, mover selección y estados persistentes, adaptar toggleHero a un caso de uso y centralizar la derrota. Mantener la mochila compartida y el estado propio del arma de Thomas. Añadir un reloj inyectado y una espera de cambio configurable.

**Archivos principales:** nuevo domain/party; nuevo application/services/AdventureSession; adaptador en Oakhaven3DExperience. Evitar cambiar a la vez geometrías, cámara y balance.

**Pruebas:** diez cambios con vidas diferentes, cambios durante un ataque bloqueado, un héroe desarmado, un héroe derrotado y una mejora de vida máxima. Una prueba de interfaz reproduce el caso 100 → Khaterine → Thomas y espera 100/100.

**Terminado cuando:** los estados se conservan, las entradas repetidas no permiten evadir restricciones y el HUD lee la misma fuente de verdad.

## Entrega 2 — Guardado recuperable y progreso del mundo

**Problema que resuelve:** continuar con una llave pero sin el estado correspondiente del escenario; ignorar valores cero; anunciar éxito sin haber escrito.

**Implementación:** SaveSnapshotV2 validado, repositorio durable/temporal, migradores de los dos formatos existentes y política de checkpoint. Guardar IDs estables de encuentros, puertas, recompensas y hechos narrativos. Escribir copia recuperable y confirmar éxito después de persistir.

**Pruebas:** cero de vida/postura, datos incompletos, versión desconocida, cuota del navegador, copia anterior, llave de Morwenna, puerta abierta, retorno al checkpoint y no duplicación de EXP.

**Terminado cuando:** un recorrido de guardar/cerrar/cargar conserva exactamente el progreso acordado y comunica de forma clara cualquier recuperación.

## Entrega 3 — Encuentro de Morwenna comprobable

**Problema que resuelve:** reglas duplicadas de fase 2 y pruebas que solo cubren el Boss del modo 2D.

**Implementación:** extraer MorwennaEncounter, parametrizar vida y tiempos por modo, producir eventos de fase/ataque/derrota y conectar RewardLedger. Mantener alas, luces y efectos en BossView. Incorporar el mismo modificador de guardia/postura en todas las rutas de daño.

**Pruebas:** umbral exacto del 50%, transición única, golpe letal durante cruce de fase, telegráficos cancelados al morir, segunda llamada de derrota, recompensa única, puerta y autoguardado/checkpoint según política.

**Terminado cuando:** el encuentro que se prueba es el que instancia el 3D. El jugador reconoce columna, torbellino y embestida, y tiene una oportunidad consistente de responder.

## Entrega 4 — Input, HUD y ritmo

**Implementación:** ActionBindings por modo/contexto, descarte de repeat para acciones discretas, limpieza de teclas al perder foco, pausa consistente y navegación de menús con teclado. Unificar textos de consumibles y efectos desde definiciones. Ocultar el pie de controles 2D cuando está activo el 3D.

**Dirección de interfaz:** mostrar lo necesario durante combate y llevar inventario, talentos y controles a paneles con jerarquía clara. El objetivo actual debe ser una frase operativa y cambiar al derrotar al jefe. La puerta abierta necesita una señal en el mundo y una actualización del objetivo, no solo una notificación efímera.

**Terminado cuando:** un jugador nuevo entiende cómo moverse, bloquear, esquivar, lanzar y recuperar sin leer todos los botones al mismo tiempo.

## Entrega 5 — Sustitución gradual del arte

1. Aprobar Thomas idle/walk/ataque/guardia/esquiva/desarme en una escena de prueba.
2. Aprobar Khaterine y el contraste de sus proyectiles con el peligro enemigo.
3. Sustituir una patrulla de cada familia; comprobar anticipación y silueta.
4. Integrar Morwenna fase 1, transición y fase 2 como una misma identidad visual.
5. Incorporar props, iconos y VFX con el catálogo como contrato.
6. Si se eligen mallas completas, producir GLB a partir de las referencias y validar rig/UV/animaciones antes de reemplazar la geometría provisional.

**Terminado cuando:** el recurso fue revisado a tamaño nativo y en la escena real. No basta con que la ilustración sea atractiva ampliada.

## Entrega 6 — Una sección completa de Oakhaven

### Recorrido propuesto

| Tramo | Función | Salida comprobable |
|---|---|---|
| Entrada segura | Moverse y reconocer personajes | El jugador encuentra el objetivo. |
| Conversación breve | Dar motivación y tono | Puede continuar sin un bloque largo de exposición. |
| Patrulla sencilla | Leer anticipación y esquivar/bloquear | Entiende por qué recibió o evitó daño. |
| Desarme | Dar valor a la mecánica distintiva | Recupera un arma y conoce la alternativa a puños. |
| Descanso y checkpoint | Dar pausa y seguridad de progreso | Guardado confirmado y recuperable. |
| Morwenna | Combinar aprendizajes | Victoria/reintento con reglas claras. |
| Llave y cementerio | Mostrar consecuencia y nueva meta | Puerta, objetivo y persistencia consistentes. |
| Salida | Cerrar el bloque | El jugador sabe qué completó y qué queda para después. |

Esta estructura debe adaptarse al guion aprobado. No reemplaza por sí sola el orden del manuscrito ni obliga a mostrar todas las revelaciones en la demo.

## Qué pospondría

- Alquimia con muchas recetas antes de validar consumo, buffs y guardado.
- Otro jefe complejo antes de tener una máquina de encuentro compartida y probada.
- Cámara libre/orbital si el arte aprobado es lateral.
- Cooperativo online o local antes de separar correctamente la sesión y el input por jugador.
- Producción masiva de todas las direcciones antes de medir una muestra consistente.

## Cómo estimar sin inventar una fecha

Usar la primera entrega de cada familia como muestra: registrar implementación, correcciones, revisión de Kevin y herramientas. Diferenciar horas activas de espera de generación/compilación. Registrar una estimación antes de ejecutar, un coste real después y la razón de desviación. Las 14 horas semanales del contexto sirven para planificar dedicación, no para asegurar una fecha de campaña completa.

Una incidencia que rompe progreso se atiende antes que una mejora cosmética. Una decisión de cámara que cambia el coste de todo el reparto se cierra antes de pedir nuevas direcciones de todos los personajes.

## Definición común de terminado

- Requisito y criterio de aceptación escritos.
- Prueba en el módulo que realmente utiliza la escena.
- Compilación correcta y pruebas relevantes aprobadas.
- Reproducción manual documentada cuando la mejora es visual o interactiva.
- Datos históricos/migración comprobados si cambia un formato persistente.
- Captura o vídeo del resultado pertinente, con versión/commit identificado.
- Estado «implementado», «verificado» o «pendiente» actualizado sin mezclar estos términos.

