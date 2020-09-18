import React from "react";

import { useGameState } from "./State";

const Startup: React.FC = () => {
  const state = useGameState();
  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const filename = e.currentTarget.files?.[0]?.path;
    if (filename) state.openGame(filename);
  };
  const handleRecent = (filename: string) => {
    state.openGame(filename);
  };

  const recentList = state.recentFiles.map((recent) => (
    <li key={recent}>
      <button type="button" onClick={() => handleRecent(recent)}>
        {recent}
      </button>
    </li>
  ));

  return (
    <div className="d-flex flex-row">
      <div id="open-game">
        <h4>Open Game:</h4>
        <input id="qspinput" type="file" accept=".qsp" onClick={handleClick} />
      </div>
      <div id="recent-games">
        <h4>Recently opened games:</h4>
        <ul id="recent-games-list">{recentList}</ul>
      </div>
    </div>
  );
};

export default Startup;
