import { DialogueLine, IDialoguePort } from '../../application/ports/IDialoguePort';

export class DialogueRepository implements IDialoguePort {
  public getScenarioIntro(scenarioIndex: number): DialogueLine[] {
    if (scenarioIndex === 1) {
      return [
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          text: '«Oakhaven bajo la niebla... Los aldeanos duermen creyendo que la Iglesia del Cáliz Solar los protege de los demonios. Si supieran qué invocan en esas hogueras...»'
        },
        {
          speaker: 'Thomas',
          portraitKey: 'portrait_thomas',
          text: '«Khaterine me advirtió que la Madre Morwenna prepara el traslado de Elowen hacia la capital. No permitiré que la arrojen a la pira.»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          text: '«Mueve tus pies con [WASD] en 2.5D, usa [K] para tu guardia de armadura y ataca con [J]. ¡Y por el Abismo, no pierdas tu espada, muchacho!»'
        }
      ];
    } else if (scenarioIndex === 2) {
      return [
        {
          speaker: 'Khaterine',
          portraitKey: 'portrait_khaterine',
          text: '«El Campanario de Oakhaven... Elowen está retenida en lo alto de la torre sobre sal gruesa. Los inquisidores calientan su crisol de bronce.»'
        },
        {
          speaker: 'Thomas',
          portraitKey: 'portrait_thomas',
          text: '«Encontré el pájaro de madera con la nota escrita en lino: "Londinium es sacrificio. Reja suelta." ¡Debemos quebrar el asedio de la torre!»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          text: '«Cuidado con los coristas de azufre. Usa [L] para ejecutar un Parry Perfecto justo antes de sus impactos y quebrarás su compostura.»'
        }
      ];
    } else if (scenarioIndex === 3) {
      return [
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          text: '«El Gran Puente de Piedra... El Camino de los Herejes que conduce a Londinium. La niebla del río oculta los carros de prisioneros.»'
        },
        {
          speaker: 'Thomas',
          portraitKey: 'portrait_thomas',
          text: '«El convoy de Martín y los campesinos desterrados intenta cruzar. El Capitán Áureo Vane bloquea el puente con sus escudos pesados.»'
        },
        {
          speaker: 'Khaterine',
          portraitKey: 'portrait_khaterine',
          text: '«Nadie más será entregado como ofrenda al falso Cáliz Solar. ¡Avanzad!»'
        }
      ];
    } else if (scenarioIndex === 4) {
      return [
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          text: '«Londinium... La Ciudadela Dorada. Huele a incienso sacro y a traición añeja. El Rey Malphas nos aguarda en su trono astral.»'
        },
        {
          speaker: 'Thomas',
          portraitKey: 'portrait_thomas',
          text: '«Reuní los fragmentos de la profecía... El Rey no es otro que Alaric, el antiguo maestro de Khaterine. Y yo llevo la sangre de Astaroth.»'
        },
        {
          speaker: 'Khaterine',
          portraitKey: 'portrait_khaterine',
          text: '«No temas a su magia temporal, Thomas. Tu alma no la forja tu estirpe, sino tu elección. ¡Quebrantemos sus decretos!»'
        }
      ];
    } else {
      return [
        {
          speaker: 'Khaterine',
          portraitKey: 'portrait_khaterine',
          text: '«La Catedral Invertida... Las leyes del cielo y la tierra se han quebrado. Las almas de mis hermanas del Sauce Negro siguen atrapadas en los muros.»'
        },
        {
          speaker: 'Thomas',
          portraitKey: 'portrait_thomas',
          text: '«Es hora de empuñar Alba Gris. Fuego negro y la Gota de Luz Divina de Elowen unidos... Solo la Oscuridad que elija amar será la Luz en las Tinieblas.»'
        },
        {
          speaker: 'Shalem',
          portraitKey: 'portrait_shalem',
          text: '«Quemé mi contrato demoníaco, idiota. No pienso dejarte solo frente a Astaroth. ¡Ha sido un honor luchar a tu lado, saco de carne!»'
        }
      ];
    }
  }

  public getElowenDialogue(): DialogueLine[] {
    return [
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        text: '«Thomas... ¿recuerdas cuando éramos niños y subíamos a la colina del viejo roble antes del amanecer? Me preguntaste qué haríamos si algún día la luz no llegaba. Te prometí que la encontraríamos juntos.»'
      },
      {
        speaker: 'Thomas',
        portraitKey: 'portrait_thomas',
        text: '«Lo recuerdo cada día, Elowen. No permitiré que Morwenna ni la Inquisición te sigan castigando sobre sal gruesa por una profecía que jamás fue tu culpa.»'
      },
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        text: '«Toma mi bendición... No dejes que la oscuridad te consuma. El Padre Cedric tenía razón: tus manos siguen siendo las del buen muchacho que cuidaba a los enfermos.»'
      }
    ];
  }

  public getCedricDialogue(): DialogueLine[] {
    return [
      {
        speaker: 'Padre Cedric',
        portraitKey: 'portrait_cedric',
        text: '«¡Thomas, hijo mío! Vi cómo te arrojaste contra esas bestias de ceniza para proteger a los niños... No sé de qué abismo proviene ese fuego negro que brota de tu espada... pero tus manos siguen siendo las del buen muchacho que cuidaba a los leprosos de Oakhaven.»'
      },
      {
        speaker: 'Thomas',
        portraitKey: 'portrait_thomas',
        text: '«Padre Cedric, llevad a los niños a la cripta de piedra. Morwenna ha desatado a la inquisición en el bosque, pero yo detendré sus hogueras.»'
      },
      {
        speaker: 'Padre Cedric',
        portraitKey: 'portrait_cedric',
        text: '«Toma este humilde rosario de madera... no tiene oro ni blasfemias, solo plegarias de paz. Y guarda esta tablilla de piedra negra que rescaté de la sacristía: contiene el primer fragmento de la Profecía Original. ¡Que Dios guíe tus pasos!»'
      }
    ];
  }

  public getShalemSarcasm(): string {
    const list = [
      '«¡Usa tus combos, muchacho! ¡El botón [J] no muerde!»',
      '«Si te desarman de un golpe pesado, ¡corre con [E] a recoger tu arma o pelea a puñetazos!»',
      '«Puedes lanzar tu espada con [T] para aturdir a ese grandullón y luego robarle su maza.»',
      '«¿Ves esa barrita de Level Up? ¡Llénala y ven a charlar conmigo con [M] para otorgarte dones abismales!»',
      '«Dieciocho años de humillación viviendo como gato... ¡exijo que saquemos la bodega real de sardinas tras salvar el reino!»'
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  public getBossDialogue(bossId: string, phase: string): DialogueLine[] {
    if (bossId === 'rex_malphas') {
      if (phase === 'PHASE_1') {
        return [
          {
            speaker: 'Rex Malphas',
            portraitKey: 'portrait_malphas',
            text: '«Dieciocho años escondido bajo los hábitos de una novicia... y finalmente vienes a conocer a tu padre. Mírate, muchacho: llevas mis mismos ojos grises.»'
          },
          {
            speaker: 'Thomas',
            portraitKey: 'portrait_thomas',
            text: '«No eres mi padre. Eres el traidor que vendió a su propio aquelarre por una corona marchita.»'
          },
          {
            speaker: 'Rex Malphas',
            portraitKey: 'portrait_malphas',
            text: '«No tuve que obligar al reino a odiarte, hijo mío. Solo tuve que enseñarles a temerte. El resto lo hicieron ellos solos.»'
          }
        ];
      } else if (phase === 'PHASE_3_UNBEATABLE') {
        return [
          {
            speaker: 'Rex Malphas',
            portraitKey: 'portrait_malphas',
            text: '«¿Creías que habías ganado? ¿Que unas barras de vida mortal deciden el destino del Monarca de los Deseos?»'
          },
          {
            speaker: 'Rex Malphas',
            portraitKey: 'portrait_malphas',
            text: '«¡DECRETO REAL: LEY DEL DESEO! ¡El tiempo retrocede y las leyes de la realidad se doblegan a mi antojo! ¡SOBREVIVE SI PUEDES!»'
          }
        ];
      }
    } else if (bossId === 'guardian_crisol') {
      return [
        {
          speaker: 'Inquisidor Mayor',
          portraitKey: 'portrait_morwenna',
          text: '«¡Herejes! Esta torre es el purgatorio de los pecadores. ¡El bronce del crisol fundirá vuestras blasfemias antes de que Elowen toque el lino!»'
        },
        {
          speaker: 'Khaterine',
          portraitKey: 'portrait_khaterine',
          text: '«Tu crisol ya está quebrado por la luz de Elowen. ¡Aparta tu acero si valoras tu vida!»'
        }
      ];
    } else if (bossId === 'capitan_aureo') {
      return [
        {
          speaker: 'Capitán Áureo Vane',
          portraitKey: 'portrait_malphas',
          text: '«¡Por la corona de Londinium y el Cáliz Solar! Ningún rebelde cruzará el río mientras la vanguardia áurea custodie este puente.»'
        },
        {
          speaker: 'Thomas',
          portraitKey: 'portrait_thomas',
          text: '«Vuestros escudos dorados no protegen a un dios, sino a un usurpador. ¡Abre paso, Capitán!»'
        }
      ];
    } else if (bossId === 'morwenna' || bossId === 'boss_morwenna') {
      return [
        {
          speaker: 'Madre Morwenna',
          portraitKey: 'portrait_morwenna',
          text: '«¡Almas impuras! ¿Creíais que esconder el fruto de la Noche de la Luna Roja en Oakhaven bastaría? ¡El Cáliz Solar reclama a la elegida para su pira sagrada!»'
        },
        {
          speaker: 'Khaterine',
          portraitKey: 'portrait_khaterine',
          text: '«¡Tus hogueras no purifican nada, Morwenna! Solo alimentan al demonio Astaroth con la sangre de inocentes. ¡Oakhaven termina aquí su pesadilla!»'
        }
      ];
    } else if (bossId === 'astaroth' || bossId === 'boss_astaroth') {
      return [
        {
          speaker: 'Astaroth',
          portraitKey: 'portrait_astaroth',
          text: '«Mírala, hijo de mi ceniza... La única criatura que te amó agoniza en las losas de esta catedral. ¿Y por quién ha muerto? Por esos gusanos que te llamaron monstruo desde antes de que pudieras caminar.»'
        },
        {
          speaker: 'Astaroth',
          portraitKey: 'portrait_astaroth',
          text: '«Tu espada aún toca el canal del Cáliz Solar. Tienes mi sangre primordial. Si cierras el puño y absorbes las almas de Albion... su luz cerrará la herida de Elowen. ¡Hazlo! ¡Elige a quien amas y condena a quienes te temen!»'
        },
        {
          speaker: 'Thomas',
          portraitKey: 'portrait_thomas',
          text: '«Si los mato para salvarla... entonces tú ganas, Astaroth. Y todo lo que ella amó de mí habrá sido una mentira. ¡Solo la Oscuridad que elija amar será la única Luz en las Tinieblas!»'
        }
      ];
    }
    return [];
  }
}
