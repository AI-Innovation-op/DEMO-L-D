export interface GuiltMirrorSpec2D {
  readonly index: 1 | 2 | 3;
  readonly x: number;
  readonly y: number;
  readonly title: string;
  readonly reflectionQuote: string;
  readonly shalemOrHeroReply: string;
}

export const ACT4_GUILT_MIRRORS_2D: readonly GuiltMirrorSpec2D[] = [
  {
    index: 1,
    x: 150,
    y: 210,
    title: 'Espejo I · La Noche de la Luna Roja',
    reflectionQuote: '«Reflejo I: El llanto de un recién nacido entre las llamas del Sauce Negro...»',
    shalemOrHeroReply: 'Khaterine: «Alaric vendió al aquelarre aquella noche, Thomas. ¡Esa culpa es suya, jamás tuya!»'
  },
  {
    index: 2,
    x: 296,
    y: 210,
    title: 'Espejo II · La Sangre de Astaroth',
    reflectionQuote: '«Reflejo II: "Llevas la ceniza primordial en las venas; naciste para devorar Albion."»',
    shalemOrHeroReply: 'Thomas: «¡Mientes, Malphas! El Padre Cedric y Elowen me enseñaron que mis manos eligen a quién proteger.»'
  },
  {
    index: 3,
    x: 442,
    y: 210,
    title: 'Espejo Maestro · El Rostro Verdadero',
    reflectionQuote: '«¡CRACK! El cristal astral estalla revelando a Thomas, Khaterine, Elowen y Shalem unidos.»',
    shalemOrHeroReply: 'Shalem: «¡Tres de tres! ¡Se acabaron tus espejismos baratos, Alaric! ¡Tu guardia astral está rota!»'
  }
];

export type ChapterXXChoice2D = 'UNDECIDED' | 'CANON_ALBA_GRIS' | 'ECLIPSE_DE_CENIZA';

/**
 * Pure domain state tracker for Opción A canonical 2D interactive events across Acts II–V + Epilogue.
 */
export class CanonEvents2DTracker {
  public hasOpenedBarnSlab: boolean = false;
  private shatteredMirrors: Set<number> = new Set();
  public chapterXXChoice: ChapterXXChoice2D = 'UNDECIDED';
  public isFirstDawnEpilogueActive: boolean = false;
  public epilogueConversationsCompleted: Set<string> = new Set();

  public resetAll(): void {
    this.hasOpenedBarnSlab = false;
    this.shatteredMirrors.clear();
    this.chapterXXChoice = 'UNDECIDED';
    this.isFirstDawnEpilogueActive = false;
    this.epilogueConversationsCompleted.clear();
  }

  public openBarnSlab(): { openedNow: boolean; weaponUnlocked: 'colmillo_sauce'; expReward: number; khaterineAtkBonus: number } {
    if (this.hasOpenedBarnSlab) {
      return { openedNow: false, weaponUnlocked: 'colmillo_sauce', expReward: 0, khaterineAtkBonus: 0 };
    }
    this.hasOpenedBarnSlab = true;
    return {
      openedNow: true,
      weaponUnlocked: 'colmillo_sauce',
      expReward: 45,
      khaterineAtkBonus: 3
    };
  }

  public shatterMirror(index: 1 | 2 | 3): {
    shatteredNow: boolean;
    shatteredCount: number;
    allShattered: boolean;
    spec: GuiltMirrorSpec2D;
  } {
    const spec = ACT4_GUILT_MIRRORS_2D.find(m => m.index === index) || ACT4_GUILT_MIRRORS_2D[0];
    if (this.shatteredMirrors.has(index)) {
      return {
        shatteredNow: false,
        shatteredCount: this.shatteredMirrors.size,
        allShattered: this.shatteredMirrors.size >= 3,
        spec
      };
    }
    this.shatteredMirrors.add(index);
    const shatteredCount = this.shatteredMirrors.size;
    return {
      shatteredNow: true,
      shatteredCount,
      allShattered: shatteredCount >= 3,
      spec
    };
  }

  public isMirrorShattered(index: number): boolean {
    return this.shatteredMirrors.has(index);
  }

  public getShatteredMirrorCount(): number {
    return this.shatteredMirrors.size;
  }

  public resetAct4Mirrors(): void {
    this.shatteredMirrors.clear();
  }

  public selectChapterXXChoice(choice: 'CANON_ALBA_GRIS' | 'ECLIPSE_DE_CENIZA'): ChapterXXChoice2D {
    this.chapterXXChoice = choice;
    return this.chapterXXChoice;
  }

  public rewindEclipseToAltar(): void {
    if (this.chapterXXChoice === 'ECLIPSE_DE_CENIZA') {
      this.chapterXXChoice = 'UNDECIDED';
    }
  }

  public enterFirstDawnEpilogue(): void {
    this.isFirstDawnEpilogueActive = true;
  }

  public recordEpilogueConversation(npcId: string): number {
    this.epilogueConversationsCompleted.add(npcId);
    return this.epilogueConversationsCompleted.size;
  }
}
