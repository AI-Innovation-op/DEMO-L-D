export type MissionId =
  | 'reliquias_sauce'
  | 'fe_padre_cedric'
  | 'inquisidor_gareth'
  | 'teatro_sombras'
  | 'despertar_marques';

export enum MissionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface ProphecyState {
  fragment1: boolean;
  fragment2: boolean;
  fragment3: boolean;
}

export class Mission {
  constructor(
    public readonly id: MissionId,
    public readonly title: string,
    public readonly description: string,
    public readonly scenarioIndex: number,
    public status: MissionStatus = MissionStatus.NOT_STARTED,
    public readonly rewardDescription: string
  ) {}

  public static createInitialMissions(): Mission[] {
    return [
      new Mission(
        'reliquias_sauce',
        'Las Reliquias del Sauce Negro',
        'Encuentra los tres relicarios de plata enterrados en el bosque para desvelar el pasado de Khaterine.',
        1,
        MissionStatus.IN_PROGRESS,
        'Dagas "Colmillo del Sauce Negro"'
      ),
      new Mission(
        'fe_padre_cedric',
        'La Fe del Padre Cedric',
        'Ayuda al anciano sacerdote a proteger a los niños de la parroquia frente a los acechadores.',
        1,
        MissionStatus.NOT_STARTED,
        'Rosario de Madera y Fragmento de Profecía (1/3)'
      ),
      new Mission(
        'inquisidor_gareth',
        'El Inquisidor que Dudó',
        'Libera a Sir Gareth de las mazmorras reales en Londinium.',
        2,
        MissionStatus.NOT_STARTED,
        'Mandoble "Falso Veredicto" y Fragmento de Profecía (2/3)'
      ),
      new Mission(
        'teatro_sombras',
        'El Teatro de las Sombras',
        'Sabotea la propaganda del Rey-Genio junto al Rebaño que Duda.',
        2,
        MissionStatus.NOT_STARTED,
        'Fragmento de Profecía (3/3) — Texto Completo'
      ),
      new Mission(
        'despertar_marques',
        'El Despertar del Marqués',
        'Acompaña a Shalem en la Biblioteca Prohibida para romper el contrato con Astaroth.',
        3,
        MissionStatus.NOT_STARTED,
        'Habilidad Activa de Shalem y Resistencia Máxima'
      )
    ];
  }

  public complete(): void {
    this.status = MissionStatus.COMPLETED;
  }
}

export class ProphecyRepository {
  private fragments: ProphecyState = {
    fragment1: false,
    fragment2: false,
    fragment3: false
  };

  public unlockFragment(index: 1 | 2 | 3): void {
    if (index === 1) this.fragments.fragment1 = true;
    if (index === 2) this.fragments.fragment2 = true;
    if (index === 3) this.fragments.fragment3 = true;
  }

  public isComplete(): boolean {
    return this.fragments.fragment1 && this.fragments.fragment2 && this.fragments.fragment3;
  }

  public getFullOriginalText(): string {
    return [
      '«Cuando los pastores vistan piel de lobo y alimenten las hogueras con la fe de los inocentes,',
      'de las cenizas del Abismo brotará una semilla de dos sangres.',
      'Temed a los que rezan bajo el sol, pues su virtud es la máscara del vacío;',
      'mas buscad al hijo de la sombra, aquel cuya alma no fue forjada por su estirpe, sino por su elección.',
      'Pues cuando el trono de oro se pudra y el cielo llore ceniza,',
      'solo la Oscuridad que elija amar será la única Luz en las Tinieblas.»'
    ].join('\n');
  }

  public getFragmentCount(): number {
    let count = 0;
    if (this.fragments.fragment1) count++;
    if (this.fragments.fragment2) count++;
    if (this.fragments.fragment3) count++;
    return count;
  }
}
