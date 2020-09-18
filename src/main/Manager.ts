import { ipcMain, IpcMainInvokeEvent } from 'electron';
import Store from '../store/store';
import { IPCChannel, IPCType } from '../types';

type IPCEvent =
  | { type: IPCType.GetStore }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: IPCType.SetStorageKey, key: string, value: any };

const handler = (_event: IpcMainInvokeEvent, msg: IPCEvent) => {
  switch(msg.type) {
    case IPCType.GetStore:
      return Store.store;
    case IPCType.SetStorageKey:
      Store.set(msg.key, msg.value);
      return Store;
    default:
      return null;
  }
}

export const InitManager = (): void => {
  ipcMain.handle(IPCChannel, handler);
}
