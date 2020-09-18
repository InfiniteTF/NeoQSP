import React, { useEffect } from "react";
import { basename } from "path";
import { debounce } from "lodash";
import { remote as Electron, OpenDialogReturnValue } from "electron";

import { useGameState, GameStatus } from "./State";

import Startup from "./Startup";
import LoadingScreen from "./LoadingScreen";
import Store from "../store/store";
import Game from "./Game";

const { app, Menu, dialog } = Electron;

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let menu: Electron.Menu;
const electronWindow = Electron.getCurrentWindow();

const saveWindowGeometry = () => {
  const { width, height, x, y } = electronWindow.getBounds();
  Store.set({
    geometry: {
      width,
      height,
      x,
      y,
    },
  });
};
electronWindow.addListener("resize", debounce(saveWindowGeometry, 500));
electronWindow.addListener("moved", debounce(saveWindowGeometry, 500));

const Sveta: React.FC = () => {
  const state = useGameState();

  function onDrop(this: HTMLElement, event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.name.slice(-3) === "qsp") state.openGame(file.path);
    }
  }

  function onDragEvent(this: Document, event: DragEvent) {
    event.preventDefault();
  }

  useEffect(() => {
    if (document.getElementsByTagName("title").length === 0) {
      const titleElement = document.createElement("title");
      document.getElementsByTagName("head")[0].appendChild(titleElement);
    }

    if (state.filename)
      document.getElementsByTagName("title")[0].innerHTML = `${basename(
        state.filename
      )} — jsQSP`;
    else document.getElementsByTagName("title")[0].innerHTML = "jsQSP";
  }, [state.filename]);

  useEffect(() => {
    document.addEventListener("dragenter", onDragEvent);
    document.addEventListener("dragover", onDragEvent);
    document.body.addEventListener("drop", onDrop);

    menu = Menu.buildFromTemplate([
      {
        label: "File",
        submenu: [
          {
            label: "Open Game...",
            id: "menu-open",
            click: () => {
              dialog
                .showOpenDialog({
                  title: "Select game to open...",
                  filters: [{ name: "QSP game file", extensions: ["qsp"] }],
                  properties: ["openFile"],
                })
                .then((res: OpenDialogReturnValue) => {
                  if (res.filePaths && res.filePaths.length)
                    if (state.status === GameStatus.Playing) state.closeGame();
                    else state.openGame(res.filePaths[0]);
                });
            },
          },
          {
            label: "Restart Game",
            id: "menu-restart",
            enabled: false,
            click: () => {
              state.resetGame();
            },
          },
          {
            label: "Close Game",
            id: "menu-close",
            enabled: false,
            click: () => {
              state.closeGame();
            },
          },
          { type: "separator" },
          {
            label: "Exit",
            click() {
              app.quit();
            },
          },
        ],
      },
      {
        label: "Game",
        submenu: [
          {
            label: "Load saved game...",
            id: "game-load",
            enabled: false,
            click: () => {},
            // click: promptLoad
          },
          {
            label: "Save game...",
            id: "game-save",
            enabled: false,
            click: () => {},
            // click: promptSave
          },
        ],
      },
    ]);
    Menu.setApplicationMenu(menu);

    // electronWindow.setBounds(state.geometry);
    electronWindow.show();

    return () => {
      document.removeEventListener("dragenter", onDragEvent);
      document.removeEventListener("dragover", onDragEvent);
      document.body.removeEventListener("drop", onDrop);
    };
  });

  useEffect(() => {
    const status = state.status !== GameStatus.Idle;
    menu.getMenuItemById("menu-restart").enabled = status;
    menu.getMenuItemById("menu-close").enabled = status;
    menu.getMenuItemById("game-save").enabled = status;
    menu.getMenuItemById("game-load").enabled = status;
  }, [state.status]);

  // const promptLoad = () => gameState?.game.promptLoad({type: "PROMPT_LOAD"});
  // const promptSave = () => gameState?.game.eve.eventHandler({type: "PROMPT_SAVE"});

  if (state.status === GameStatus.Playing) return <Game />;
  if (state.status === GameStatus.Idle) return <Startup />;
  if (state.status === GameStatus.Loading && state.filename)
    return <LoadingScreen filename={state.filename} />;
  return <div>error</div>;
};

export default Sveta;
