import React, { useEffect } from "react";
import { normalize, dirname } from "path";
// import { Howl } from "howler";
import Split from "react-split";
import Swal from "sweetalert2";

import { useGameState, FrontendCallbacks, HandlerTypes } from "./State";
import Actions from "./Actions";
import Dialog from "./Dialog";

import "./Main.scss";

/*
function unpackColor(color: number) {
  const r = color & 255;
  const g = (color >> 8) & 255;
  const b = (color >> 16) & 255;
  const a = (color >> 24) & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function setUIProperties(props: any) {
  if (
    props.fcolor == propCache.fcolor &&
    props.lcolor == propCache.lcolor &&
    props.bcolor == propCache.bcolor &&
    props.fname == propCache.fname &&
    props.fsize == propCache.fsize
  )
    return;
  propCache = props;
  const rules = document.styleSheets[0].cssRules;
  rules[0].style.color =
    props.fcolor == 0 ? "inherit" : unpackColor(props.fcolor);
  rules[0].style.backgroundColor =
    props.bcolor == 0 ? "inherit" : unpackColor(props.bcolor);
  rules[0].style.fontFamily = props.fname;
  rules[0].style.fontSize = `${props.fsize}pt`;
  rules[1].style.color =
    props.lcolor == 0 ? "inherit" : unpackColor(props.lcolor);
}
 */

/*
const ViewModal = Swal.mixin({
  animation: false,
  width: "inherit",
});
*/

/*
const showMessage = (text: string) => {
  ViewModal.fire({
    html: text,
  });
};
 */

const InputModal = Swal.mixin({
  animation: false,
  input: "text",
  showCancelButton: true,
  allowOutsideClick: false,
  customClass: {
    confirmButton: "btn btn-primary",
    cancelButton: "btn btn-secondary",
  },
});

  /*
  const eventHandler = (event) => {
      switch(event.type) {
          case("VIEW"):
              let showModal = !!event.value;
              if(showModal) {
                  ViewModal.fire({
                      imageUrl: event.value
                  })
              }
              // Do nothing if asked to close VIEW since it doesn't make sense with a modal
              return;
          case("MSG"):
              showMessage(event.value);
              return;
          case("PROMPT_LOAD"): {
              dialog.showOpenDialog(null, {
                  title: "Select save game file...",
                  filters: [{name: "jsQSP Save Game", extensions: ['jqsav']}],
                  properties: ['openFile']
              }).then(res => {
                  if(res.filePaths && res.filePaths.length)
                  readFile(res.filePaths[0]).then(data => (GameInstance.loadGame(data.toString())));
              });
              return;
          }
          case("PROMPT_SAVE"): {
              dialog.showSaveDialog(null, {
                  title: "Select save game file...",
                  filters: [{name: "jsQSP Save Game", extensions: ['jqsav']}],
                  properties: ['openFile']
              }).then(res => {
                  if(res.filePath)
                  GameInstance.saveGame(res.filePath);
                  })
              return;
          }
          case("LOAD"):
              const loadfile = join(dirname(filename), parse(event.value).name + '.jqsav');
              readFile(loadfile).then(
                  data => (GameInstance.loadGame(data.toString())),
                  error => (showMessage(`Savegame ${loadfile} not found.`))
              );
              return;
          case("SAVE"):
              const savefile = join(dirname(filename), parse(event.value).name + '.jqsav');
              writeFile(savefile, event.data);
              return;
          case("INPUT"): {
              InputModal.fire({
                  html: event.text
              }).then(data => {
                  const input = data.value || '';
                  GameInstance.sendInput(input);
              });
              break;
          }
          case("DELAY"): {
              setTimeout(() => (GameInstance.start()), event.delay);
              break;
          }
          case("PLAY"): {
              const volume = event.volume / 100;
              AudioIndex[event.filename] = new Howl({
                  src: [`./${event.filename}`],
                  volume: volume > 1 ? 1 : volume,
                  autoplay: true,
                  onstop: () => {delete AudioIndex[event.path]}
              });
              break;
          }
          case("KILL_AUDIOFILE"): {
              if(AudioIndex[event.path]) {
                  AudioIndex[event.path].stop();
                  delete AudioIndex[event.path];
              }
              break;
          }
          case("KILL_AUDIO"): {
              for(let path in AudioIndex) {
                  AudioIndex[path].stop();
              }
              AudioIndex = {};
              break;
          }
          case("ADDQST"):
              const gameFile = join(dirname(filename), event.filepath);
              readFile(gameFile).then(
                  data => {
                      const locations = readQSP(Buffer.from(data));
                      GameInstance.addLocations(locations);
                      GameInstance.start();
                  },
                  error => (showMessage(`Game file '${loadfile}' not found.`))
              );
              return;
          default:
              refresh();
      }
  }
  */

const Game: React.FC = () => {
  const state = useGameState();

  const callbackhandler = (event: FrontendCallbacks) => {
    switch (event.type) {
      case HandlerTypes.INPUT: {
        InputModal.fire({
          html: event.text,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).then((data: any) => {
          const input = data.value ?? "";
          event.callback(input);
        });
        break;
      }
      default:
    }
  };

  useEffect(() => {
    state.registerHandler(callbackhandler);
  });

  useEffect(() => {
    if (state.filename) {
      let baseEl = document.getElementsByTagName("base")?.[0];
      if (!baseEl) {
        baseEl = document.createElement("base");
        document.getElementsByTagName("head")[0].appendChild(baseEl);
      }

      const path = normalize(`${dirname(state.filename)}/`);
      baseEl.href = `file://${path}`;
    }
  }, [state.filename]);

  return (
    <div id="game-container">
      <Split
        id="vertical-split"
        className="split d-flex flex-row"
        minSize={100}
        direction="horizontal"
        gutterSize={4}
        gutterAlign="center"
        snapOffset={20}
      >
        <Split
          id="main-windows"
          className="split"
          minSize={150}
          direction="vertical"
          gutterSize={4}
          gutterAlign="center"
          snapOffset={20}
        >
          <Dialog text={state.main} />
          <Actions />
        </Split>
        <Dialog text={state.stats} />
      </Split>
    </div>
  );
};

export default Game;
