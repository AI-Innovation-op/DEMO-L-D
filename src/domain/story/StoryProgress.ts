import { DomainEvent, EventBus } from '../shared/DomainEvent';

export interface ScenarioMilestone {
  readonly id: string;
  readonly description: string;
  readonly progressWeight: number; // e.g., 20%
  isCompleted: boolean;
}

export class ScenarioProgressUpdatedEvent implements DomainEvent {
  public readonly eventName = 'ScenarioProgressUpdated';
  public readonly occurredOn = new Date();
  constructor(
    public readonly act: number,
    public readonly scenarioName: string,
    public readonly currentProgress: number,
    public readonly objective: string
  ) {}
}

export class StoryProgress {
  public currentAct: number = 1;
  public scenarioProgress: number = 0; // 0 to 100
  private milestones: Map<number, ScenarioMilestone[]> = new Map();

  constructor() {
    this.initMilestones();
  }

  private initMilestones(): void {
    // Act 1: Oakhaven
    this.milestones.set(1, [
      { id: 'act1_monks', description: 'Purga la guardia de la pira', progressWeight: 25, isCompleted: false },
      { id: 'act1_beast', description: 'Elimina al Acechador de Ceniza', progressWeight: 25, isCompleted: false },
      { id: 'act1_dialogue', description: 'Habla con Khaterine sobre la profecía', progressWeight: 20, isCompleted: false },
      { id: 'act1_boss', description: 'Vence a la Madre Morwenna en la hoguera', progressWeight: 30, isCompleted: false }
    ]);

    // Act 2: Londinium
    this.milestones.set(2, [
      { id: 'act2_guards', description: 'Infiltra los muros dorados de la capital', progressWeight: 30, isCompleted: false },
      { id: 'act2_prophecy', description: 'Reconstruye los fragmentos de piedra', progressWeight: 30, isCompleted: false },
      { id: 'act2_boss', description: 'Sobrevive a Rex Malphas y su Decreto Real', progressWeight: 40, isCompleted: false }
    ]);

    // Act 3: Catedral Invertida
    this.milestones.set(3, [
      { id: 'act3_abyss', description: 'Atraviesa las ruinas flotantes del eclipse', progressWeight: 30, isCompleted: false },
      { id: 'act3_weapon', description: 'Canaliza el fuego y la luz en Alba Gris', progressWeight: 30, isCompleted: false },
      { id: 'act3_astaroth', description: 'Destruye a Astaroth y salva a Albion', progressWeight: 40, isCompleted: false }
    ]);
  }

  public setAct(act: number): void {
    this.currentAct = act;
    this.scenarioProgress = 0;
    this.notifyUpdate();
  }

  public completeMilestone(milestoneId: string): boolean {
    const list = this.milestones.get(this.currentAct);
    if (!list) return false;

    const milestone = list.find(m => m.id === milestoneId);
    if (milestone && !milestone.isCompleted) {
      milestone.isCompleted = true;
      this.scenarioProgress = Math.min(100, this.scenarioProgress + milestone.progressWeight);
      this.notifyUpdate();
      return true;
    }
    return false;
  }

  public addProgress(amount: number): void {
    this.scenarioProgress = Math.min(100, this.scenarioProgress + amount);
    this.notifyUpdate();
  }

  public getScenarioName(): string {
    switch (this.currentAct) {
      case 1: return 'ACTO I — OAKHAVEN (ALDEA)';
      case 2: return 'ACTO II — LONDINIUM (CIUDADELA)';
      case 3: return 'ACTO III — CATEDRAL INVERTIDA';
      default: return 'PRÓLOGO';
    }
  }

  public getCurrentObjective(): string {
    const list = this.milestones.get(this.currentAct);
    if (!list) return 'Sobrevive y avanza';
    const pending = list.find(m => !m.isCompleted);
    return pending ? pending.description : '¡Objetivos completados! Avanza al siguiente capítulo.';
  }

  public getGlobalJourneyPercentage(): number {
    const completedActs = (this.currentAct - 1) * 33.33;
    const currentPart = (this.scenarioProgress / 100) * 33.33;
    return Math.min(100, Math.round(completedActs + currentPart));
  }

  private notifyUpdate(): void {
    EventBus.getInstance().publish(
      new ScenarioProgressUpdatedEvent(
        this.currentAct,
        this.getScenarioName(),
        this.scenarioProgress,
        this.getCurrentObjective()
      )
    );
  }
}
