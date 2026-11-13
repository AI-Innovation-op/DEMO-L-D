import { Weapon } from '../weapon/Weapon';

export enum MinigameType {
  TRIVIA = 'TRIVIA',
  MEMORY = 'MEMORY',
  RUNE_PUZZLE = 'RUNE_PUZZLE'
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ShalemMinigameState {
  type: MinigameType;
  title: string;
  instructions: string;
  data: TriviaQuestion | string[];
  rewardWeapon: Weapon;
}

export class ShalemCompanion {
  public isSilentMode: boolean = false; // Golden rule: in deep tragedy, Shalem falls silent
  private sarcasmQuotes: string[] = [
    "¡Esquiva hacia la izquierda, animal sin cola! ¡La otra izquierda!",
    "Por las nueve fosas, si mueres hoy tendré que volver a cazar ratones crudos.",
    "Qué sermón tan inspirador. Casi me dan ganas de arrepentirme de mis pecados, pero soy un marqués del Abismo.",
    "¿Ese fue tu mejor combo? He visto ovillos de lana dar golpes más contundentes.",
    "Apúrate, Thomas. Mi siesta imperial no se va a posponer sola.",
    "¡Cuidado con esa antorcha! ¡Mi glorioso pelaje negro absorbe la luz, pero el fuego chamusca!",
    "Si ese demonio te muerde, no esperes que te chupe el veneno. Apenas tolero el agua."
  ];

  public getRandomComment(): string {
    if (this.isSilentMode) {
      return "... (Shalem te mira en completo silencio con las orejas bajas) ...";
    }
    const idx = Math.floor(Math.random() * this.sarcasmQuotes.length);
    return this.sarcasmQuotes[idx];
  }

  public getCombatAdvice(isDisarmed: boolean): string {
    if (this.isSilentMode) return "...";
    if (isDisarmed) {
      return "¡Brillante jugada, genio! ¡Tiraste tu espada y ahora estás peleando a puñetazos! ¡Corre a recogerla antes de que te conviertan en pudín!";
    }
    return "¡Aprovecha que bajó la guardia! ¡Rompe su postura y usa un remate digno de un marqués!";
  }

  public generateMinigame(level: number): ShalemMinigameState {
    const minigameIndex = (level - 1) % 3;

    if (minigameIndex === 0) {
      return {
        type: MinigameType.TRIVIA,
        title: "Trivia del Marqués de las Brasas",
        instructions: "Responde correctamente a la pregunta del lore para reclamar el arma.",
        data: {
          question: "¿Quién es en verdad Rex Malphas, el monarca que rige desde la capital?",
          options: [
            "Un ángel solar enviado por los cielos",
            "Alaric, el antiguo maestro del Aquelarre que traicionó a los suyos",
            "El hermano gemelo perdido del Padre Cedric",
            "Un inquisidor común poseído por un duende"
          ],
          correctIndex: 1,
          explanation: "¡Exacto! Alaric vendió a sus hermanas brujas a cambio de una corona demoníaca."
        },
        rewardWeapon: Weapon.createLamentoOakhaven()
      };
    } else if (minigameIndex === 1) {
      return {
        type: MinigameType.MEMORY,
        title: "Cálculo de Runas de Shalem",
        instructions: "Memoriza la secuencia de 4 runas de fuego abismal y repítela sin equivocarte.",
        data: ["🔥 Pira", "🌑 Abismo", "⚡ Rayo", "✨ Alba"],
        rewardWeapon: Weapon.createColmilloSauce()
      };
    } else {
      return {
        type: MinigameType.RUNE_PUZZLE,
        title: "El Enigma del Sello del Sauce Negro",
        instructions: "Alinea los 3 fragmentos de piedra rúnica para descifrar la profecía prohibida.",
        data: {
          question: "¿Qué dice el verso final de la Profecía Original?",
          options: [
            "La oscuridad consumirá todo vestigio de luz sin piedad.",
            "Solo la Oscuridad que elija amar será la única Luz en las Tinieblas.",
            "El oro del altar protegerá eternamente a los inocentes.",
            "Los lobos heredarán el trono sin que nadie lo impida."
          ],
          correctIndex: 1,
          explanation: "¡Esa es la profecía real! No la mentira que difunde la Alta Prelatura."
        },
        rewardWeapon: Weapon.createFalsoVeredicto()
      };
    }
  }

  public enterTragedySilence(): void {
    this.isSilentMode = true;
  }

  public exitTragedySilence(): void {
    this.isSilentMode = false;
  }
}
