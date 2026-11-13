import { DialogueLine, IDialoguePort } from '../../application/ports/IDialoguePort';

export class DialogueRepository implements IDialoguePort {
  public getScenarioIntro(scenarioIndex: number): DialogueLine[] {
    if (scenarioIndex === 1) {
      return [
        {
          speaker: 'Shalem',
          text: '«Vaya, vaya... Oakhaven bajo la niebla. El rebaño duerme creyendo que las monjas rezan por su salvación. Si supieran qué invocan en esas hogueras...»'
        },
        {
          speaker: 'Thomas',
          text: '«Khaterine me advirtió que la Madre Morwenna reunió a los inquisidores. Debo encontrar a Elowen antes de que la obliguen a entrar en la pira.»'
        },
        {
          speaker: 'Shalem',
          text: '«No te precipites, muchacho. Recuerda moverte con [A/D], esquivar con [L] y atacar con [J]. ¡Y por el Abismo, no pierdas tu espada!»'
        }
      ];
    } else if (scenarioIndex === 2) {
      return [
        {
          speaker: 'Shalem',
          text: '«Londinium... La Ciudadela Dorada. Huele a incienso caro y a traición añeja. El Rey Malphas nos espera en su trono flotante.»'
        },
        {
          speaker: 'Thomas',
          text: '«Reconstruí los tres fragmentos de la Profecía Original. Ya sé quién es en verdad el Rey... y qué sangre corre por mis venas.»'
        }
      ];
    } else {
      return [
        {
          speaker: 'Khaterine',
          text: '«La Catedral Invertida... Las leyes de la tierra ya no rigen aquí. Astaroth está consumiendo las almas de todo el reino.»'
        },
        {
          speaker: 'Thomas',
          text: '«Llegó el momento de empuñar Alba Gris. Ni la luz dorada corrupta ni la oscuridad sin control... solo la que elija amar.»'
        }
      ];
    }
  }

  public getElowenDialogue(): DialogueLine[] {
    return [
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        text: '«¡Thomas, has vuelto! Las campanas han estado tañendo sin descanso... Madre Morwenna dice que la noche exige una ofrenda para purificar el alba.»'
      },
      {
        speaker: 'Thomas',
        portraitKey: 'portrait_thomas',
        text: '«No te acerques a la pira, Elowen. No hay salvación en ese fuego, solo ceniza y dogma. Khaterine y yo detendremos a la inquisición.»'
      },
      {
        speaker: 'Elowen',
        portraitKey: 'portrait_elowen',
        text: '«Que la bendición de los antiguos te guarde... Toma este ungüento de mirra. Ten cuidado: los acechadores rondan por el sendero este.»'
      }
    ];
  }

  public getShalemSarcasm(): string {
    const list = [
      '«¡Usa tus combos, Thomas! ¡El botón [J] no muerde!»',
      '«Si te desarman con un golpe pesado, ¡corre a buscar tu espada con [E] o golpéalos a puños!»',
      '«Puedes lanzar tu arma con [T] para aturdir a ese grandullón y luego robarle la suya.»',
      '«¿Ves esa barrita de Level Up? ¡Llénala y ven a jugar conmigo para darte armas de verdad!»'
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  public getBossDialogue(bossId: string, phase: string): DialogueLine[] {
    if (bossId === 'rex_malphas') {
      if (phase === 'PHASE_1') {
        return [
          {
            speaker: 'Rex Malphas',
            text: '«Dieciocho años preguntándome a qué rincón del mundo habías arrastrado mi carne, mi pequeña Khaterine... Y resulta que lo criaste de rodillas frente a un altar.»'
          },
          {
            speaker: 'Khaterine',
            text: '«Míralo bien, Alaric. Porque no tiene nada tuyo.»'
          }
        ];
      } else if (phase === 'PHASE_3_UNBEATABLE') {
        return [
          {
            speaker: 'Rex Malphas',
            text: '«¿Creías que habías ganado? ¿Que unas barras de vida mortal deciden el destino de un Soberano del Deseo?»'
          },
          {
            speaker: 'Rex Malphas',
            text: '«¡DECRETO REAL: LEY DEL DESEO! ¡El juego se termina cuando yo lo diga! ¡SOBREVIVE SI PUEDES!»'
          }
        ];
      }
    }
    return [];
  }
}
