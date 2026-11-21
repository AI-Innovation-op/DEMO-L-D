export type DungeonArea =
  | 'surface'
  | 'crypts_interior'
  | 'black_willow_forest'
  | 'belltower_summit'
  | 'great_stone_bridge'
  | 'londinium_citadel'
  | 'inverted_cathedral';

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

  public enterBlackWillowForest(): void {
    this._currentArea = 'black_willow_forest';
  }

  public exitForestToCrypts(): void {
    this._currentArea = 'crypts_interior';
  }

  public enterBelltower(): void {
    this._currentArea = 'belltower_summit';
  }

  public enterGreatStoneBridge(): void {
    this._currentArea = 'great_stone_bridge';
  }

  public enterLondiniumCitadel(): void {
    this._currentArea = 'londinium_citadel';
  }

  public enterInvertedCathedral(): void {
    this._currentArea = 'inverted_cathedral';
  }

  public setArea(area: DungeonArea): void {
    this._currentArea = area;
  }

  public getBounds(): AreaBounds {
    if (this._currentArea === 'inverted_cathedral') {
      return {
        minX: -9.0,
        maxX: 9.0,
        minZ: -415.0,
        maxZ: -360.0,
        camMinZ: -416.0,
        camMaxZ: -359.0,
        camMaxX: 8.8
      };
    }

    if (this._currentArea === 'londinium_citadel') {
      return {
        minX: -8.0,
        maxX: 8.0,
        minZ: -345.0,
        maxZ: -295.0,
        camMinZ: -346.0,
        camMaxZ: -294.0,
        camMaxX: 7.8
      };
    }

    if (this._currentArea === 'great_stone_bridge') {
      return {
        minX: -5.0,
        maxX: 5.0,
        minZ: -280.0,
        maxZ: -235.0,
        camMinZ: -281.0,
        camMaxZ: -234.0,
        camMaxX: 4.8
      };
    }

    if (this._currentArea === 'belltower_summit') {
      return {
        minX: -6.0,
        maxX: 6.0,
        minZ: -220.0,
        maxZ: -185.0,
        camMinZ: -221.0,
        camMaxZ: -184.0,
        camMaxX: 5.8
      };
    }

    if (this._currentArea === 'black_willow_forest') {
      return {
        minX: -7.5,
        maxX: 7.5,
        minZ: -172.0,
        maxZ: -125.0,
        camMinZ: -173.0,
        camMaxZ: -124.0,
        camMaxX: 7.2
      };
    }

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
