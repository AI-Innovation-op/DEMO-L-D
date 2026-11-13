export interface IAudioPort {
  playBgm(trackKey: string, loop?: boolean): void;
  stopBgm(): void;
  playSfx(sfxKey: string): void;
  playCombatHit(isCritical?: boolean): void;
  playDisarmSound(): void;
  playWeaponThrowSound(): void;
  playFinisherSound(isCinematic: boolean): void;
  playBossPhaseChangeSound(): void;
}

export interface DialogueLine {
  speaker: string;
  portraitKey?: string;
  text: string;
}

export interface IDialoguePort {
  getScenarioIntro(scenarioIndex: number): DialogueLine[];
  getShalemSarcasm(): string;
  getBossDialogue(bossId: string, phase: string): DialogueLine[];
}
