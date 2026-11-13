export class Vector2 {
  constructor(public readonly x: number, public readonly y: number) {}

  public static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  public add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  public scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  public distanceTo(other: Vector2): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public equals(other: Vector2): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

export class Result<T, E = string> {
  private constructor(
    private readonly isSuccess: boolean,
    private readonly value?: T,
    private readonly error?: E
  ) {}

  public static ok<U>(value: U): Result<U, never> {
    return new Result<U, never>(true, value);
  }

  public static fail<U = void, F = string>(error: F): Result<U, F> {
    return new Result<U, F>(false, undefined, error);
  }

  public get isOk(): boolean {
    return this.isSuccess;
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error("Cannot get value from failed Result: " + this.error);
    }
    return this.value!;
  }

  public getError(): E {
    if (this.isSuccess) {
      throw new Error("Cannot get error from successful Result");
    }
    return this.error!;
  }
}
