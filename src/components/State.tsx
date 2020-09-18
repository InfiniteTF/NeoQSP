import React, { Dispatch, useEffect, useReducer, useContext, useState } from "react";
import { readFile } from "fs-extra";
import { ipcRenderer } from 'electron';

import { IStore, IPCChannel, IPCType } from '../types';
import { QSPListItem, QSPAPI, CallbackTypes, Callbacks } from "../asm/api";

enum ActionType {
  UpdateMain,
  UpdateStats,
  GameLoading,
  GameLoaded,
  SetActions,
  SetInput,
}

type ReducerAction =
  | { type: ActionType.GameLoading; filename: string }
  | { type: ActionType.GameLoaded }
  | { type: ActionType.UpdateMain; main: string }
  | { type: ActionType.UpdateStats; stats: string }
  | { type: ActionType.SetActions; actions: QSPListItem[] };

export enum GameStatus {
  Loading,
  Idle,
  Playing,
}

export enum HandlerTypes {
  INPUT,
}

export type FrontendCallbacks = {
  type: HandlerTypes.INPUT;
  text: string;
  callback: (input: string) => void;
};

interface GameState {
  main: string;
  stats: string;
  actions: QSPListItem[];
  status: GameStatus;
  dispatch: Dispatch<ReducerAction>;
  filename: string | null;
  inputWaiting: string | null;
  openGame: (filename: string) => void;
  closeGame: () => void;
  resetGame: () => void;
  selectAction: (index: number) => void;
  recentFiles: string[];
  inputText: (input: string) => void;
  registerHandler: (callback: (event: FrontendCallbacks) => void) => void;
  execString: (code: string) => boolean;
  state: IState;
}

const initialState: GameState = {
  main: "",
  stats: "",
  actions: [],
  dispatch: () => {},
  status: GameStatus.Idle,
  filename: null,
  inputWaiting: null,
  openGame: () => {},
  closeGame: () => {},
  resetGame: () => {},
  selectAction: () => {},
  recentFiles: ["F:/gl/glife.qsp"],
  inputText: () => {},
  registerHandler: () => {},
  execString: () => false,
  state: {},
};

let FrontendCallbackHandler: (data: FrontendCallbacks) => void = () => {};

const reducer = (state: GameState, action: ReducerAction) => {
  switch (action.type) {
    case ActionType.UpdateMain:
      return { ...state, main: action.main };
    case ActionType.UpdateStats:
      return { ...state, stats: action.stats };
    case ActionType.GameLoading:
      return {
        ...state,
        status: GameStatus.Loading,
        filename: action.filename,
      };
    case ActionType.GameLoaded:
      return { ...state, status: GameStatus.Playing };
    case ActionType.SetActions:
      return { ...state, actions: action.actions };
    default:
      return state;
  }
};

const GameContext = React.createContext<GameState | null>(null);

interface GameStateProviderProps {
  API: QSPAPI;
}

export const GameStateProvider: React.FC<GameStateProviderProps> = ({
  children,
  API,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [store, setStore] = useState<IStore|null>(null);

  const handler = (callback: Callbacks) => {
    switch (callback.type) {
      case CallbackTypes.MAIN_UPDATED:
        return dispatch({ type: ActionType.UpdateMain, main: callback.main });
      case CallbackTypes.STATS_UPDATED:
        return dispatch({
          type: ActionType.UpdateStats,
          stats: callback.stats,
        });
      case CallbackTypes.ACTIONS_UPDATED:
        return dispatch({
          type: ActionType.SetActions,
          actions: callback.actions,
        });
      case CallbackTypes.INPUT:
        return FrontendCallbackHandler({
          type: HandlerTypes.INPUT,
          text: callback.text,
          callback: callback.callback,
        });
      default:
    }
  };

  const initStore = async () => {
    const res = await ipcRenderer.invoke(IPCChannel, { type: IPCType.GetStore });
    setStore(res);
  }

  useEffect(() => {
    API.registerCallback(handler);
    initStore();
  });

  const openGame = async (filename: string) => {
    dispatch({ type: ActionType.GameLoading, filename });
    const data = await readFile(filename);
    const loadSuccess = API.loadGameWorld(data, true);
    const restartSuccess = API.restart(true);
    if (!loadSuccess || !restartSuccess) {
      const error = API.getLastError();
      throw new Error(JSON.stringify(error));
    } else dispatch({ type: ActionType.GameLoaded });
  };

  const closeGame = () => {
    // CloseGame
  };

  const resetGame = () => {
    // ResetGame
  };

  const selectAction = (index: number) => {
    API.selectAction(index);
  };

  const execString = (code: string) => {
    return API.execString(code, true);
  };

  const registerHandler = (callbackHandler: (data: FrontendCallbacks) => void) => {
    FrontendCallbackHandler = callbackHandler;
  };

  return (
    <GameContext.Provider
      value={{
        ...state,
        dispatch,
        openGame,
        closeGame,
        resetGame,
        selectAction,
        registerHandler,
        execString,
        store,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameState = (): GameState => {
  const state = useContext(GameContext);
  if (state === null) throw new Error("State not yet initialized");

  return state;
};
