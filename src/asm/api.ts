/* eslint-disable no-underscore-dangle */

import QSP from "./qsp";
import wasm from "./qsp.wasm";

const locateFile = (path: string) => {
  if (path.endsWith(".wasm")) return wasm;
  return path;
};

export interface QSPListItem {
  image: string;
  name: string;
}

export interface QSPError {
  errorNum: number;
  errorLoc: string;
  errorActIndex: number;
  errorLine: number;
  desc: string;
}

export enum QSPNewCallback {
  DEBUG /* void func(QSPString str) */,
  ISPLAYINGFILE /* QSP_BOOL func(QSPString file) */,
  PLAYFILE /* void func(QSPString file, int volume) */,
  CLOSEFILE /* void func(QSPString file) */,
  SHOWIMAGE /* void func(QSPString file) */,
  SHOWWINDOW /* void func(int type, QSP_BOOL isShow) */,
  SHOWMENU /* int func(QSPListItem *items, int count) */,
  SHOWMSGSTR /* void func(QSPString text) */,
  REFRESHINT /* void func(QSP_BOOL isRedraw) */,
  SETTIMER /* void func(int msecs) */,
  SETINPUTSTRTEXT /* void func(QSPString text) */,
  SYSTEM /* void func(QSPString cmd) */,
  OPENGAME /* void func(QSP_BOOL isNewGame) */,
  OPENGAMESTATUS /* void func(QSPString file) */,
  SAVEGAMESTATUS /* void func(QSPString file) */,
  SLEEP /* void func(int msecs) */,
  GETMSCOUNT /* int func() */,
  INPUTBOX /* void func(QSPString text, QSP_CHAR *buffer, int maxLen) */,
  DUMMY,
}

export enum QSPCallback {
  DEBUG /* void func(QSPString str) */,
  ISPLAYINGFILE /* QSP_BOOL func(QSPString file) */,
  PLAYFILE /* void func(QSPString file, int volume) */,
  CLOSEFILE /* void func(QSPString file) */,
  SHOWIMAGE /* void func(QSPString file) */,
  SHOWWINDOW /* void func(int type, QSP_BOOL isShow) */,
  DELETEMENU,
  ADDMENUITEM,
  SHOWMENU /* int func(QSPListItem *items, int count) */,
  SHOWMSGSTR /* void func(QSPString text) */,
  REFRESHINT /* void func(QSP_BOOL isRedraw) */,
  SETTIMER /* void func(int msecs) */,
  SETINPUTSTRTEXT /* void func(QSPString text) */,
  SYSTEM /* void func(QSPString cmd) */,
  OPENGAMESTATUS /* void func(QSPString file) */,
  SAVEGAMESTATUS /* void func(QSPString file) */,
  SLEEP /* void func(int msecs) */,
  GETMSCOUNT /* int func() */,
  INPUTBOX /* void func(QSPString text, QSP_CHAR *buffer, int maxLen) */,
  DUMMY,
}

let Time: number = 0;

export enum CallbackTypes {
  MAIN_UPDATED,
  STATS_UPDATED,
  ACTIONS_UPDATED,
  OBJECTS_UPDATED,
  INPUT,
}

export type Callbacks =
  | { type: CallbackTypes.MAIN_UPDATED; main: string }
  | { type: CallbackTypes.STATS_UPDATED; stats: string }
  | { type: CallbackTypes.ACTIONS_UPDATED; actions: QSPListItem[] }
  | { type: CallbackTypes.OBJECTS_UPDATED; objects: QSPListItem[] }
  | {
      type: CallbackTypes.INPUT;
      text: string;
      callback: (input: string) => void;
    };

let CallbackFunction: (data: Callbacks) => void | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const module: Promise<QSPAPI> = QSP({ locateFile }).then((Module: any) => {
  const allocateStackPtr = (size = 16) =>
    Module.allocate(size, "i8", Module.ALLOC_STACK);

  /*
  const decoder = new TextDecoder("utf-16le");
  const getNewStringValue = (ptr: number) => {
    const start = Module.getValue(ptr, "i32");
    const end = Module.getValue(ptr + 4, "i32");
    const length = (end - start) / 4;
    const view = new Uint32Array(
      Module.HEAPU32.subarray(start / 4, start / 4 + length)
    );
    const u16 = Uint16Array.from(view);
    return decoder.decode(u16);
  };
  */

  const getStringValue = (ptr: number) => {
    return Module.UTF32ToString(ptr);
  };

  const arrayToHeap = (typedArray: Uint8Array) => {
    const numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
    const ptr = Module._malloc(numBytes);
    const heapBytes = new Uint8Array(Module.HEAPU8.buffer, ptr, numBytes);
    heapBytes.set(typedArray);
    return ptr;
  };

  const isMainDescChanged = () =>
    Module.ccall("QSPIsMainDescChanged", "number") === 1;

  const isVarsDescChanged = () =>
    Module.ccall("QSPIsVarsDescChanged", "number") === 1;

  const isActionsChanged = () =>
    Module.ccall("QSPIsActionsChanged", "number") === 1;

  const isObjectsChanged = () =>
    Module.ccall("QSPIsObjectsChanged", "number") === 1;

  const fireCallback = (data: Callbacks) => {
    if (CallbackFunction) CallbackFunction(data);
  };

  const onRefresh = (isRedraw: boolean) => {
    console.log("Called: onRefresh");

    if (isRedraw || isMainDescChanged()) {
      const main = getMainDesc();
      fireCallback({ type: CallbackTypes.MAIN_UPDATED, main });
    }

    if (isRedraw || isVarsDescChanged()) {
      const stats = getVarsDesc();
      fireCallback({ type: CallbackTypes.STATS_UPDATED, stats });
    }

    if (isRedraw || isActionsChanged()) {
      const actions = getActions();
      fireCallback({ type: CallbackTypes.ACTIONS_UPDATED, actions });
    }

    if (isRedraw || isObjectsChanged()) {
      const objects = getObjects();
      fireCallback({ type: CallbackTypes.OBJECTS_UPDATED, objects });
    }
  };

  const onShowWindow = (type: string, isShown: boolean) => {
    console.log("CALLBACK: onShowWindow");
  };

  const onMenu = (listPtr: number, count: number) => {
    console.log("CALLBACK: onMenu");
  };

  const onMsg = (textPtr: number) => {
    console.log("CALLBACK: onMsg");
  };

  const onInput = (textPtr: number, retPtr: number, maxSize: number) => {
    onRefresh(false);
    const text = getStringValue(textPtr);

    return Module.Asyncify.handleSleep((wakeUp: (val: number) => void) => {
      const onInput = (inputText: string) => {
        Module.stringToUTF32(inputText, retPtr, maxSize);
        wakeUp(0);
      };
      fireCallback({ type: CallbackTypes.INPUT, text, callback: onInput });
    });
  };

  const onWait = (ms: number) => {
    console.log("CALLBACK: onWait");
  };

  const onSetTimer = (ms: number) => {
    console.log("CALLBACK: onSetTimer");
  };

  const onSetUserInput = (textPtr: number) => {
    console.log("CALLBACK: onSetUserInput");
  };

  const onView = (pathPtr: number) => {
    console.log("CALLBACK: onView");
  };

  const onDebug = (strPtr: number) => {
    console.log("CALLBACK: onDebug");
  };

  const onGetMS = () => {
    console.log("CALLBACK: onGetMS");
    const elapsed = Date.now() - Time;
    Time = Date.now();
    return elapsed;
  };

  const onOpenGameStatus = (pathPtr: number) => {
    console.log("CALLBACK: onOpenGameStatus");
  };

  const onSaveGameStatus = (pathPtr: number) => {
    console.log("CALLBACK: onSaveGameStatus");
  };

  const onIsPlay = (filePtr: number) => {
    console.log("CALLBACK: onIsPlay");
  };

  const onPlayFile = (filePtr: number, volume: number) => {
    console.log("CALLBACK: onPlayFile");
  };

  const onCloseFile = (filePtr: number) => {
    console.log("CALLBACK: onCloseFile");
  };

  const setCallback = (ptr: number, type: number) => {
    Module.ccall(
      "QSPSetCallBack",
      "undefined",
      ["number", "type"],
      [type, ptr]
    );
  };

  const registerCallbacks = () => {
    const onRefreshPtr = Module.addFunction(onRefresh, "ii");
    setCallback(onRefreshPtr, QSPCallback.REFRESHINT);
    const onShowWindowPtr = Module.addFunction(onShowWindow, "iii");
    setCallback(onShowWindowPtr, QSPCallback.SHOWWINDOW);
    const onMenuPtr = Module.addFunction(onMenu, "iii");
    setCallback(onMenuPtr, QSPCallback.SHOWMENU);
    const onMsgPtr = Module.addFunction(onMsg, "ii");
    setCallback(onMsgPtr, QSPCallback.SHOWMSGSTR);
    const onInputPtr = Module.addFunction(onInput, "iiii");
    setCallback(onInputPtr, QSPCallback.INPUTBOX);
    const onWaitPtr = Module.addFunction(onWait, "ii");
    setCallback(onWaitPtr, QSPCallback.SLEEP);
    const onSetTimerPtr = Module.addFunction(onSetTimer, "ii");
    setCallback(onSetTimerPtr, QSPCallback.SETTIMER);
    const onSetUserInputPtr = Module.addFunction(onSetUserInput, "ii");
    setCallback(onSetUserInputPtr, QSPCallback.SETINPUTSTRTEXT);
    const onViewPtr = Module.addFunction(onView, "ii");
    setCallback(onViewPtr, QSPCallback.SHOWIMAGE);
    const onDebugPtr = Module.addFunction(onDebug, "ii");
    setCallback(onDebugPtr, QSPCallback.DEBUG);
    const onGetMSPtr = Module.addFunction(onGetMS, "i");
    setCallback(onGetMSPtr, QSPCallback.GETMSCOUNT);
    /*
    const onOpenGamePtr = Module.addFunction(onOpenGame, "iii");
    setCallback(onOpenGamePtr, QSPCallback.OPENGAME);
    */
    const onOpenGameStatusPtr = Module.addFunction(onOpenGameStatus, "ii");
    setCallback(onOpenGameStatusPtr, QSPCallback.OPENGAMESTATUS);
    const onSaveGameStatusPtr = Module.addFunction(onSaveGameStatus, "ii");
    setCallback(onSaveGameStatusPtr, QSPCallback.SAVEGAMESTATUS);
    const onIsPlayPtr = Module.addFunction(onIsPlay, "ii");
    setCallback(onIsPlayPtr, QSPCallback.ISPLAYINGFILE);
    const onPlayFilePtr = Module.addFunction(onPlayFile, "iii");
    setCallback(onPlayFilePtr, QSPCallback.PLAYFILE);
    const onCloseFilePtr = Module.addFunction(onCloseFile, "ii");
    setCallback(onCloseFilePtr, QSPCallback.CLOSEFILE);
  };

  const init = () => {
    console.log("QSP: Init");
    Module.ccall("QSPInit", "undefined");
    registerCallbacks();
  };

  const getCompiledDateTime = () => {
    //console.log('QSP: GetCompiledDateTime');
    const stringPtr = allocateStackPtr();
    Module.ccall(
      "QSPGetCompiledDateTime",
      "undefined",
      ["number"],
      [stringPtr]
    );
    return getStringValue(stringPtr);
  };

  const getVersion = () => {
    //console.log('QSP: GetVersion');
    const stringPtr = allocateStackPtr();
    Module.ccall("QSPGetVersion", "undefined", ["number"], [stringPtr]);
    return getStringValue(stringPtr);
  };

  const getMainDesc = () => {
    const ptr = Module.ccall("QSPGetMainDesc", "number");
    return getStringValue(ptr);
  };

  /*
  const getNewMainDesc = () => {
    //console.log('QSP: GetMainDesc');
    const stringPtr = allocateStackPtr();
    Module.ccall("QSPGetMainDesc", "undefined", ["number"], [stringPtr]);
    return getStringValue(stringPtr);
  };
  */

  const getVarsDesc = () => {
    const ptr = Module.ccall("QSPGetVarsDesc", "number");
    return getStringValue(ptr);
  };

  const printError = () => {
    const error = JSON.stringify(getLastError());
    console.log(`ERROR: ${error}`);
  };

  const execString = (code: string, isRefresh: boolean) => {
    const length = Module.lengthBytesUTF32(code);
    const ptr = Module._malloc(length);
    Module.stringToUTF32(code, ptr);
    const success =
      Module.ccall(
        "QSPExecString",
        "number",
        ["number", "number"],
        [ptr, isRefresh ? 1 : 0]
      ) === 1;
    if (!success) printError();
    Module._free(ptr);
    return success;
  };

  /*
  const getNewVarsDesc = () => {
    //console.log('QSP: GetVarsDesc');
    const stringPtr = allocateStackPtr();
    Module.ccall("QSPGetVarsDesc", "undefined", ["number"], [stringPtr]);
    return getStringValue(stringPtr);
  };
  */

  const restart = (isRefresh: boolean) => {
    console.log("QSP: Restart");
    const val = Module.ccall(
      "QSPRestartGame",
      "number",
      ["number"],
      [isRefresh ? 1 : 0]
    );
    Time = Date.now();
    return val;
  };

  const getErrorDesc = (code: number) => {
    //console.log('QSP: GetErrorDesc');
    const stringPtr = allocateStackPtr();
    Module.ccall(
      "QSPGetErrorDesc",
      "number",
      ["number", "number"],
      [stringPtr, code]
    );
    return getStringValue(stringPtr);
  };

  const getLastError = () => {
    //console.log('QSP: GetLastError');
    const errorNum = allocateStackPtr(8);
    const errorLoc = allocateStackPtr(16);
    const errorActIndex = allocateStackPtr(8);
    const errorLine = allocateStackPtr(8);
    Module.ccall(
      "QSPGetLastErrorData",
      "undefined",
      ["number", "number", "number", "number"],
      [errorNum, errorLoc, errorActIndex, errorLine]
    );
    const code = Module.getValue(errorNum, "i32");
    return {
      errorNum: code,
      errorLoc: getStringValue(errorLoc),
      errorActIndex: Module.getValue(errorActIndex, "i32"),
      errorLine: Module.getValue(errorLine, "i32"),
      desc: getErrorDesc(code),
    };
  };

  const loadGameWorld = (data: Uint8Array, isNewGame: boolean) => {
    console.log("QSP: LoadGameWorld");
    const heapData = arrayToHeap(data);
    const val = Module.ccall(
      "QSPLoadGameWorldFromData",
      "number",
      ["number", "number", "number"],
      [heapData, data.byteLength, isNewGame ? 1 : 0]
    );
    Module._free(heapData);
    return val === 1;
  };

  const getActions = (): QSPListItem[] => {
    //console.log('QSP: GetActions');
    const count = Module.ccall("QSPGetActionsCount", "number");
    const namePtr = allocateStackPtr(8);
    const imagePtr = allocateStackPtr(8);

    const actions: QSPListItem[] = [];
    for (let i = 0; i < count; i += 1) {
      Module.ccall(
        "QSPGetActionData",
        "undefined",
        ["number", "number", "number"],
        [i, imagePtr, namePtr]
      );
      const nameStrPtr = Module.getValue(namePtr, "i32");
      const imageStrPtr = Module.getValue(imagePtr, "i32");
      const name = Module.UTF32ToString(nameStrPtr);
      const image = Module.UTF32ToString(imageStrPtr);
      actions.push({ image, name });
    }

    console.log(JSON.stringify(getLastError()));
    return actions;
  };

  /*
  const getNewActions = (): QSPListItem[] => {
    //console.log('QSP: GetActions');
    const MAX = 20;
    const stringPtr = Module._malloc(32 * MAX);
    const count = Module.ccall(
      "QSPGetActions",
      "number",
      ["number", "number"],
      [stringPtr, MAX]
    );
    const actions: QSPListItem[] = [];
    for (let i = 0; i < count; i += 1) {
      const image = getStringValue(stringPtr + i * 16);
      const name = getStringValue(stringPtr + i * 16 + 8);
      actions.push({ image, name });
    }
    Module._free(stringPtr);
    return actions;
  };
  */

  const getObjects = (): QSPListItem[] => {
    const count = Module.ccall("QSPGetObjectsCount", "number");
    const namePtr = allocateStackPtr(8);
    const imagePtr = allocateStackPtr(8);

    const actions: QSPListItem[] = [];
    for (let i = 0; i < count; i += 1) {
      Module.ccall(
        "QSPGetObjectData",
        "undefined",
        ["number", "number", "number"],
        [i, imagePtr, namePtr]
      );
      const nameStrPtr = Module.getValue(namePtr, "i32");
      const imageStrPtr = Module.getValue(imagePtr, "i32");
      const name = Module.UTF32ToString(nameStrPtr);
      const image = Module.UTF32ToString(imageStrPtr);
      actions.push({ image, name });
    }

    console.log(JSON.stringify(getLastError()));
    return actions;
  };

  /*
  const getNewObjects = (): QSPListItem[] => {
    //console.log('QSP: GetObjects');
    const MAX = 20;
    const stringPtr = Module._malloc(32 * MAX);
    const count = Module.ccall(
      "QSPGetObjects",
      "number",
      ["number", "number"],
      [stringPtr, MAX]
    );
    const objects: QSPListItem[] = [];
    for (let i = 0; i < count; i += 1) {
      const image = getStringValue(stringPtr + i * 16);
      const name = getStringValue(stringPtr + i * 16 + 8);
      objects.push({ image, name });
    }
    Module._free(stringPtr);
    return objects;
  };
  */

  const selectAction = (index: number) => {
    const selectionSuccess = Module.ccall(
      "QSPSetSelActionIndex",
      "number",
      ["number", "number"],
      [index, 0]
    );
    if (!selectionSuccess) {
      throw new Error(`Error selection index: ${index}`);
    }
    const executionSuccess = Module.ccall(
      "QSPExecuteSelActionCode",
      "number",
      ["number"],
      [1]
    );
    if (!executionSuccess) {
      throw new Error(`Error executing action: ${index}`);
    }
  };

  const registerCallback = (callback: (data: Callbacks) => void) => {
    CallbackFunction = callback;
  };

  return {
    init,
    restart,
    loadGameWorld,
    getMainDesc,
    getCompiledDateTime,
    getVersion,
    getActions,
    getLastError,
    selectAction,
    registerCallback,
    execString,
  };
});

export interface QSPAPI {
  init: () => void;
  restart: (isRefresh: boolean) => boolean;
  loadGameWorld: (data: Uint8Array, isNewGame: boolean) => boolean;
  getCompiledDateTime: () => string;
  getVersion: () => string;
  getActions: () => QSPListItem[];
  getMainDesc: () => string;
  getLastError: () => Error;
  selectAction: (index: number) => void;
  registerCallback: (callback: (data: Callbacks) => void) => void;
  execString: (code: string, isRefresh: boolean) => boolean;
}

export default module;
