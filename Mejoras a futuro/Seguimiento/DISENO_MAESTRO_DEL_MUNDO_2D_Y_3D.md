# 🌍 Diseño Maestro del Mundo 2D y 3D — *The Light in the Darkness / Double Blood*

> [!IMPORTANT]
> **Propiedad Intelectual y Canon**: Este documento consolida las **13 decisiones de diseño** aprobadas por **Kevin © 2026**, fusionando la obra literaria original (`docs/novela/`) con la ingeniería espacial de **Vice City** y la disciplina de locomoción corporal y cámara de **OpenLara (Tomb Raider)** (`Mejoras a futuro/Seguimiento/investigaciones/RESUMEN_INVESTIGACIONES.md`).

---

## 1. Filosofía del Mundo: Qué Debe Sentir el Jugador

El mundo de **Albion** no es un simple decorado de combate; es la expresión espacial de la tesis moral de la novela:
- **La Falsa Luz Blanca y el Oro Opresivo**: La Iglesia del Cáliz Solar y la corte de Londinium utilizan el oro, el mármol, el incienso narcótico y el fuego blanco para gobernar mediante el miedo.
- **La Oscuridad que Elige Amar**: El Fuego Negro de **Thomas** y las sombras del Sauce Negro de **Khaterine** nacieron del sacrificio de las Nueve Brujas en la Noche de la Luna Roja y crecieron en la humildad de **Oakhaven** junto al **Padre Cedric**, **Elowen** y **Shalem**.
- **Progresión Emocional por Contraste**: El jugador nunca debe entrar a un nivel sintiendo que es una arena vacía; primero debe **habitar el lugar**, sentir lo que está en juego (la paz frágil de Oakhaven, el dolor de Elowen sobre la sal, el clamor de los campesinos enjaulados, el silencio drogadicto de Londinium) y luego **luchar para transformarlo**.

---

## 2. Los 7 Pilares Arquitectónicos Aprobados (Síntesis *OpenLara* + *Vice City* + *Novela*)

| Pilar | Referencia Base | Decisión Aprobada para *The Light in the Darkness* |
| :--- | :--- | :--- |
| **1. Estructura Espacial** | *Vice City* (Sectores) + *OpenLara* (Rooms) | **16 Sub-Sectores Canónicos** distribuidos en 5 Actos semi-abiertos con rutas laterales, interiores, desniveles y retorno libre entre sectores. |
| **2. Tempo Narrativo Inicial** | *Novela Caps. I–III* | **De la Calma a la Tormenta**: El Acto I inicia en el amanecer brumoso (auxiliar enfermos en el Atrio, hablar con Cedric y subir a la Colina del Viejo Roble a entregar el Pájaro de Madera a Elowen), lo cual desencadena la invasión nocturna de las antorchas blancas de Morwenna. |
| **3. Cámara 3D y Combate** | *Vice City* + *OpenLara* `ICamera` | **Tercera Persona Cercana por defecto** (cuerpo entero al ~40% de pantalla, aire por delante, retracción ante muros `traceClip`) + **Fijación de Objetivo (`[R]` Lock-On)** para rodear jefes y apuntar armas arrojadizas, conmutable a Oblicua 3/4 con `[C]`. |
| **4. Representación de Personajes** | *OpenLara* (Jerarquía articular) | **Modo 3D**: Rig 3D Articulado Gótico por capas (piernas con zancada calibrada, giro de torso independiente, brazos con `weaponSocket`, capa/velo y soporte `.glb`), conmutable a Sprites HD-2D en `[V]`. **Modo 2D**: Hojas de sprites pixel-art 2D oficiales. |
| **5. Física del Terreno y Bordes** | *OpenLara* (Apoyos y alturas) | **Verticalidad Inteligente**: Subida/bajada real de escalones, rampas y colinas; `[ESPACIO]` esquiva en combate y salta/trepar desniveles contextuales; peligro real en bordes/abismos (empujar enemigos al río en el Gran Puente). |
| **6. Vida Ambiental y Guía** | *Vice City* (Actividad y señales) | **Habitantes Reactivos + Guía Diegética**: Shalem trota adelantándose hacia el objetivo activo, rótulos caligráficos al cambiar de sector, Pergamino/Brújula Táctica discreta y micro-objetivos canónicos con aldeanos, prisioneros y braseros. |
| **7. Equivalencia en Modo 2D** | Phaser 2.5D | **Escenarios 2.5D Amplios con Scroll de Cámara**: Mapas extendidos (`1280+ px`) con parallax, alturas caminables y conexión continua entre sub-sectores (Atrio -> Colina del Roble -> Plaza -> Cementerio/Criptas). |

---

## 3. Especificación de Mecánicas Narrativas por Jefe y Dilema Final

1. **Madre Morwenna (Acto I — Cap. VI)**:
   - Tras purificar su Fase 2 en la Gran Pira, se dispara el evento dramático del **rapto de Elowen** hacia el Campanario del Sur mientras los aldeanos quedan a salvo en las criptas.
2. **El Guardián del Crisol (Acto II — Cap. IX)**:
   - **Interacción de Escenario**: Si Thomas lanza su espada (`[T]`) apuntando al **Horno del Gran Crisol**, el filo traba el engranaje de bronce y derrama metal hirviente sobre el Guardián (`-120 HP` y `3.0 s` de aturdimiento expuesto a remate `[E]`).
3. **Capitán Áureo Vane (Acto III — Caps. XII–XIII)**:
   - **Interacción de Escenario y Flanqueo**: Con el **Lock-On (`[R]`)** activo, esquivar hacia el flanco ciego de Vane junto al pretil del puente permite golpear la junta de su rodilla y quebrar su Escudo de Torre, o empujar a sus guardias por los tramos rotos de la barandilla hacia el río.
4. **Rex Malphas / Alaric (Acto IV — Caps. XV–XVII)**:
   - **Salón de los Espejos**: Destruir el Espejo Maestro disipa las visiones de culpa de la Luna Roja y otorga el *Espejismo de Oro y Humo*.
   - **Sinergia contra la *Ley del Deseo***: En Fase 2, activar el ataque conjunto de **Khaterine (hilos del Sauce) + Shalem (brasas primordiales) + Thomas (estocada descendente)** anula su distorsión temporal.
5. **Astaroth: El Padre de las Cenizas (Acto V — Cap. XX)**:
   - **Dilema Moral Interactivo**:
     - **Opción 1 (Canónica — *La Luz en las Tinieblas*)**: *«¡Solo la Oscuridad que elija amar será la única Luz en las Tinieblas!»* -> Shalem rompe su contrato demoníaco manifestando su aura de León de Brasas, Elowen y Khaterine sellan las alas del titán, y tras el golpe final de *Alba Gris*, el cielo se transforma en el **Primer Amanecer Dorado** sobre la Colina del Viejo Roble.
     - **Opción 2 (Alternativa — *Eclipse de Ceniza*)**: Ceder al odio y consumir las almas de Albion muestra el epílogo oscuro *What-If*, permitiendo luego regresar al Altar de la Comunión para conquistar el Final Verdadero.
