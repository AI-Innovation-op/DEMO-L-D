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
    // Act 1: Oakhaven (Caps I-VI)
    this.milestones.set(1, [
      { id: 'act1_monks', description: 'Purga la guardia de la pira', progressWeight: 25, isCompleted: false },
      { id: 'act1_beast', description: 'Elimina al Acechador de Ceniza', progressWeight: 25, isCompleted: false },
      { id: 'act1_dialogue', description: 'Habla con el Padre Cedric y Khaterine', progressWeight: 20, isCompleted: false },
      { id: 'act1_boss', description: 'Vence a la Madre Morwenna en la hoguera', progressWeight: 30, isCompleted: false }
    ]);

    // Act 2: El Campanario y Granero del Sur (Caps VII-IX)
    this.milestones.set(2, [
      { id: 'act2_coristas', description: 'Neutraliza a las coristas de azufre', progressWeight: 30, isCompleted: false },
      { id: 'act2_elowen', description: 'Habla con Elowen en la celda y recibe el pájaro de madera', progressWeight: 30, isCompleted: false },
      { id: 'act2_boss', description: 'Vence al Guardián del Crisol de Bronce', progressWeight: 40, isCompleted: false }
    ]);

    // Act 3: El Gran Puente y Camino de los Herejes (Caps X-XIII)
    this.milestones.set(3, [
      { id: 'act3_vanguard', description: 'Quebranta la vanguardia de caballeros áureos', progressWeight: 30, isCompleted: false },
      { id: 'act3_refugees', description: 'Habla con Elowen y resguarda a los refugiados', progressWeight: 30, isCompleted: false },
      { id: 'act3_boss', description: 'Vence al Capitán Áureo Vane en las puertas', progressWeight: 40, isCompleted: false }
    ]);

    // Act 4: Londinium — La Ciudadela Dorada (Caps XIV-XVII)
    this.milestones.set(4, [
      { id: 'act4_guards', description: 'Infiltra los muros dorados y la guardia pretoriana', progressWeight: 30, isCompleted: false },
      { id: 'act4_prophecy', description: 'Reúne las tablillas y revela la verdad de Alaric', progressWeight: 30, isCompleted: false },
      { id: 'act4_boss', description: 'Sobrevive a Rex Malphas y derriba el salón astral', progressWeight: 40, isCompleted: false }
    ]);

    // Act 5: La Catedral Invertida — El Sol del Abismo (Caps XVIII-XX)
    this.milestones.set(5, [
      { id: 'act5_abyss', description: 'Atraviesa las ruinas flotantes de la sima cósmica', progressWeight: 30, isCompleted: false },
      { id: 'act5_weapon', description: 'Canaliza la Gota de Luz de Elowen en Alba Gris', progressWeight: 30, isCompleted: false },
      { id: 'act5_astaroth', description: 'Destruye a Astaroth y trae el Primer Amanecer', progressWeight: 40, isCompleted: false }
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
      case 2: return 'ACTO II — EL CAMPANARIO Y GRANERO';
      case 3: return 'ACTO III — EL GRAN PUENTE DE PIEDRA';
      case 4: return 'ACTO IV — LONDINIUM (CIUDADELA)';
      case 5: return 'ACTO V — CATEDRAL INVERTIDA';
      default: return 'PRÓLOGO';
    }
  }

  public getCurrentObjective(): string {
    if (this.scenarioProgress >= 100) {
      return '¡Victoria! Territorio purgado. Avanza a la salida hacia el norte [D]';
    }
    const list = this.milestones.get(this.currentAct);
    if (!list) return 'Sobrevive y avanza';
    const pending = list.find(m => !m.isCompleted);
    return pending ? pending.description : '¡Victoria! Territorio purgado. Avanza a la salida hacia el norte [D]';
  }

  public getCompletedMilestones(): string[] {
    const res: string[] = [];
    this.milestones.forEach((list) => {
      list.forEach(m => {
        if (m.isCompleted) res.push(m.id);
      });
    });
    return res;
  }

  public completeAllActMilestones(act?: number): void {
    const targetAct = act ?? this.currentAct;
    const list = this.milestones.get(targetAct);
    if (list) {
      list.forEach(m => m.isCompleted = true);
    }
    this.scenarioProgress = 100;
    this.notifyUpdate();
  }

  public getGlobalJourneyPercentage(): number {
    const completedActs = (this.currentAct - 1) * 20;
    const currentPart = (this.scenarioProgress / 100) * 20;
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
