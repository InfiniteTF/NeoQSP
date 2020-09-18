interface ISplit {
  actions: number[];
  side: number[];
}

interface IGeometry {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface IStore {
  recent: string[];
  geometry: IGeometry;
  splits: ISplit;
}

export const IPCChannel = 'NeoManager';

export enum IPCType {
  GetStore,
  SetStorageKey,
}

