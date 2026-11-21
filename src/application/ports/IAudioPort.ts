export interface IAudioPort {
  playBgm(trackKey: string, loop?: boolean): void;
  stopBgm(): void;
  playSfx(sfxKey: string): void;
  playCombatHit(isCritical?: boolean): void;
  playDisarmSound(): void;
  playWeaponThrowSound(): void;
  playFinisherSound(isCinematic: boolean): void;
  playBossPhaseChangeSound(): void;
  playGlassShatter?(): void;
  playClockRewind?(): void;
  playHealingEmber?(): void;
  playCenserSwing?(): void;
  playWoodBreak?(): void;
  playBowShot?(): void;
  playSpikeTrap?(): void;
  playCryptDoor?(): void;
  playHolyCurse?(): void;
  playMaceImpact?(): void;
  playCauldronBubble?(): void;
  playHeartbeat?(): void;
  playHolyFlash?(): void;
  playFlaskExplosion?(): void;
  playArrowSwitch?(): void;
  playWillowWhisper?(): void;
  playBeastRoar?(): void;
  playDaggerVortex?(): void;
  playBellToll?(): void;
  playShieldCrush?(): void;
  playAstralDistortion?(): void;
  playCosmicChime?(): void;
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
