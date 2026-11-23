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
    // Thomas: High agility, demonic burst, agile parry specialist (takes real hits if careless)
    return new CharacterStats(
      125, // Health
      125, // Max Health
      220, // Speed (Very fast & agile)
      8,   // Defense (~16.7% armor mitigation)
      14,  // Attack Power (Light ~24 dmg, Heavy ~35 dmg with Short Sword -> 4-6 hits per enemy)
      55,  // Posture
      55,  // Max Posture
      true // Vulnerable to heavy hits
    );
  }

  public static createKhaterine(): CharacterStats {
    // Khaterine: Slower, durable, ranged archer/sorceress (~31% armor mitigation)
    return new CharacterStats(
      155, // Health (More durable)
      155, // Max Health
      160, // Speed (Slower than Thomas)
      18,  // Defense (~31% proportional armor mitigation — tough without reducing enemy hits to 1!)
      12,  // Attack Power (Light ~23 dmg, Heavy ~33 dmg with Abyssal Bow)
      75,  // Posture (Solid guard)
      75,  // Max Posture
      false
    );
  }

  public takeDamage(amount: number): number {
    // Diminishing-returns RPG armor mitigation so high defense feels sturdy without making heroes immortal
    const mitigation = this.defense / (this.defense + 40);
    const effectiveDamage = Math.max(4, Math.round(amount * (1 - mitigation)));
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
