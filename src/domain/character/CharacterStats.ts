export class CharacterStats {
  constructor(
    public health: number,
    public maxHealth: number,
    public speed: number,
    public defense: number,
    public attackPower: number,
    public posture: number,
    public maxPosture: number,
    public isVulnerableToHeavyHits: boolean = false
  ) {}

  public static createThomas(): CharacterStats {
    // Thomas: High agility, demonic burst, but fragile if directly hit
    return new CharacterStats(
      100, // Health
      100, // Max Health
      220, // Speed (Very fast & agile)
      8,   // Defense (Low defense - weakens quickly)
      35,  // Attack Power (High damage)
      60,  // Posture
      60,  // Max Posture
      true // Vulnerable to heavy hits
    );
  }

  public static createKhaterine(): CharacterStats {
    // Khaterine: Slower, durable, high ranged magic resistance
    return new CharacterStats(
      140, // Health (More durable)
      140, // Max Health
      160, // Speed (Slower than Thomas)
      18,  // Defense (Higher defense, endures direct hits)
      30,  // Attack Power
      100, // Posture (Solid guard)
      100, // Max Posture
      false
    );
  }

  public takeDamage(amount: number): number {
    const effectiveDamage = Math.max(1, amount - this.defense);
    this.health = Math.max(0, this.health - effectiveDamage);
    return effectiveDamage;
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public damagePosture(amount: number): boolean {
    this.posture = Math.max(0, this.posture - amount);
    return this.posture === 0; // True if posture is broken
  }

  public restorePosture(amount: number): void {
    this.posture = Math.min(this.maxPosture, this.posture + amount);
  }

  public isAlive(): boolean {
    return this.health > 0;
  }
}
