import { Character } from '../../domain/character/Character';
import { ShalemCompanion, ShalemMinigameState } from '../../domain/companion/ShalemCompanion';
import { Weapon } from '../../domain/weapon/Weapon';

export class ShalemUseCases {
  public static isMinigameAvailable(player: Character): boolean {
    return player.levelUp.isMinigameReady;
  }

  public static getActiveMinigame(player: Character, shalem: ShalemCompanion): ShalemMinigameState {
    return shalem.generateMinigame(player.levelUp.level);
  }

  public static solveMinigame(
    player: Character,
    shalem: ShalemCompanion,
    selectedOptionIndex: number
  ): { isCorrect: boolean; rewardedWeapon?: Weapon; message: string } {
    const minigame = shalem.generateMinigame(player.levelUp.level);

    let isSuccess = false;
    if (minigame.type === 'TRIVIA' || minigame.type === 'RUNE_PUZZLE') {
      const trivia = minigame.data as { correctIndex: number; explanation: string };
      isSuccess = selectedOptionIndex === trivia.correctIndex;
    } else {
      // Memory game success check
      isSuccess = true;
    }

    if (isSuccess) {
      player.levelUp.completeMinigame();
      // Equip or reward weapon
      player.disarmManager.setEquippedPrimary(minigame.rewardWeapon);
      return {
        isCorrect: true,
        rewardedWeapon: minigame.rewardWeapon,
        message: `¡Correcto! Shalem te otorga: ${minigame.rewardWeapon.name}. ¡${minigame.rewardWeapon.description}!`
      };
    } else {
      return {
        isCorrect: false,
        message: "Shalem bosteza y sacude la cola: «Esa no es la respuesta, novato. Inténtalo de nuevo cuando prestes atención.»"
      };
    }
  }
}
