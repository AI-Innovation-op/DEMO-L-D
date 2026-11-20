export type DungeonArea = 'surface' | 'crypts_interior';

export interface AreaBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  camMinZ: number;
  camMaxZ: number;
  camMaxX: number;
}

export interface SarcophagusState {
  id: string;
  isOpened: boolean;
  type: 'loot' | 'ambush';
}

export class DungeonAreaManager {
  private _currentArea: DungeonArea = 'surface';
  private _cemeteryGateOpen: boolean = false;
  private _sarcophagi: Map<string, SarcophagusState> = new Map();

  constructor() {
    this._sarcophagi.set('sarcophagus_loot', {
      id: 'sarcophagus_loot',
      isOpened: false,
      type: 'loot'
    });
    this._sarcophagi.set('sarcophagus_ambush', {
      id: 'sarcophagus_ambush',
      isOpened: false,
      type: 'ambush'
    });
  }

  public get currentArea(): DungeonArea {
    return this._currentArea;
  }

  public get isCemeteryGateOpen(): boolean {
    return this._cemeteryGateOpen;
  }

  public setCemeteryGateOpen(open: boolean): void {
    this._cemeteryGateOpen = open;
  }

  public enterCrypts(): void {
    this._currentArea = 'crypts_interior';
  }

  public exitToSurface(): void {
    this._currentArea = 'surface';
  }

  public getBounds(): AreaBounds {
    if (this._currentArea === 'crypts_interior') {
      return {
        minX: -5.5,
        maxX: 5.5,
        minZ: -112.0,
        maxZ: -70.0,
        camMinZ: -113.0,
        camMaxZ: -69.0,
        camMaxX: 5.2
      };
    }

    // Surface bounds
    const minZ = this._cemeteryGateOpen ? -46.5 : -23.0;
    const camMinZ = (this._cemeteryGateOpen ? -45.5 : -22.0) - 1.0;

    return {
      minX: -5.2,
      maxX: 5.2,
      minZ,
      maxZ: 11.0,
      camMinZ,
      camMaxZ: 11.2,
      camMaxX: 4.75
    };
  }

  public getSarcophagus(id: string): SarcophagusState | undefined {
    return this._sarcophagi.get(id);
  }

  public openSarcophagus(id: string): boolean {
    const sarc = this._sarcophagi.get(id);
    if (!sarc || sarc.isOpened) {
      return false;
    }
    sarc.isOpened = true;
    return true;
  }
}
