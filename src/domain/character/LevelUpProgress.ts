import { DomainEvent, EventBus } from '../shared/DomainEvent';

export class LevelUpMinigameReadyEvent implements DomainEvent {
  public readonly eventName = 'LevelUpMinigameReady';
  public readonly occurredOn = new Date();
  constructor(public readonly level: number) {}
}

export class LevelUpProgress {
  constructor(
    public currentExp: number = 0,
    public maxExp: number = 100,
    public level: number = 1,
    public isMinigameReady: boolean = false
  ) {}

  public addExp(amount: number): boolean {
    this.currentExp += amount;
    if (this.currentExp >= this.maxExp) {
      this.currentExp -= this.maxExp;
      this.level += 1;
      this.maxExp = Math.round(this.maxExp * 1.25);
      this.isMinigameReady = true;

      EventBus.getInstance().publish(new LevelUpMinigameReadyEvent(this.level));
      return true;
    }
    return false;
  }

  public completeMinigame(): void {
    this.isMinigameReady = false;
  }

  public getProgressPercentage(): number {
    return Math.min(100, Math.floor((this.currentExp / this.maxExp) * 100));
  }
}
