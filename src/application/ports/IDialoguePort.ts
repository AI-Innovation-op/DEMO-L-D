export interface DialogueLine {
  speaker: string;
  portraitKey?: string;
  text: string;
}

export interface IDialoguePort {
  getScenarioIntro(scenarioIndex: number): DialogueLine[];
  getShalemSarcasm(): string;
  getBossDialogue(bossId: string, phase: string): DialogueLine[];
  getElowenDialogue?(): DialogueLine[];
}
