import { Vector2 } from '../shared/Vector2';

export type EnemyType = 'ash_prowler' | 'fanatic_monk' | 'golden_guard' | 'pyre_inquisitor' | 'inquisitor_torre' | 'shield_knight' | 'abyssal_shadow';

export class Enemy {
  public posture: number;
  public maxPosture: number;
  public state: 'IDLE' | 'MOVING' | 'ATTACKING' | 'STUNNED' | 'DEAD' = 'IDLE';
  public facingDirection: number = -1;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: EnemyType,
    public health: number,
    public readonly maxHealth: number,
    public readonly attackPower: number,
    public readonly speed: number,
    public position: Vector2,
    maxPosture: number = 50
  ) {
    this.posture = maxPosture;
    this.maxPosture = maxPosture;
  }

  public static createAshProwler(id: string, pos: Vector2): Enemy {
    return new Enemy(id, 'Acechador de Ceniza', 'ash_prowler', 45, 45, 14, 120, pos, 30);
  }

  public static createFanaticMonk(id: string, pos: Vector2): Enemy {
    return new Enemy(id, 'Monje Fanático', 'fanatic_monk', 60, 60, 18, 70, pos, 50);
  }

  public static createGoldenGuard(id: string, pos: Vector2): Enemy {
    return new Enemy(id, 'Guardia Áureo de Londinium', 'golden_guard', 85, 85, 22, 85, pos, 80);
  }

  public static createInquisitorTorre(id: string, pos: Vector2): Enemy {
    return new Enemy(id, 'Corista Inquisitorial', 'inquisitor_torre', 65, 65, 17, 75, pos, 55);
  }

  public static createShieldKnight(id: string, pos: Vector2): Enemy {
    return new Enemy(id, 'Caballero de Escudo Pesado', 'shield_knight', 95, 95, 20, 70, pos, 90);
  }

  public static createAbyssalShadow(id: string, pos: Vector2): Enemy {
    return new Enemy(id, 'Sombra Primordial del Vacío', 'abyssal_shadow', 75, 75, 24, 110, pos, 60);
  }

  public takeDamage(amount: number): number {
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.state = 'DEAD';
    }
    return amount;
  }

  public damagePosture(amount: number): boolean {
    this.posture = Math.max(0, this.posture - amount);
    if (this.posture === 0) {
      this.state = 'STUNNED';
      return true; // Posture broken!
    }
    return false;
  }

  public recoverPosture(): void {
    this.posture = this.maxPosture;
    if (this.state === 'STUNNED') {
      this.state = 'IDLE';
    }
  }

  public isAlive(): boolean {
    return this.health > 0 && this.state !== 'DEAD';
  }
}
