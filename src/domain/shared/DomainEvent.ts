export interface DomainEvent {
  readonly eventName: string;
  readonly occurredOn: Date;
}

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void;

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, EventHandler[]> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public subscribe<T extends DomainEvent>(eventName: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler as EventHandler);
  }

  public publish<T extends DomainEvent>(event: T): void {
    const list = this.handlers.get(event.eventName);
    if (list) {
      list.forEach(handler => handler(event));
    }
  }

  public clear(): void {
    this.handlers.clear();
  }
}
