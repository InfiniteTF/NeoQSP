import React, { useEffect, useState } from "react";

import QSP, { QSPAPI } from "../asm/api";
import { GameStateProvider } from "../components/State";
import Game from "../components/app";

const Loader: React.FC = () => {
  const [API, setAPI] = useState<QSPAPI | null>(null);

  const initialize = async () => {
    const result = await QSP;
    result.init();
    setAPI(result);
  };

  useEffect(() => {
    initialize();
  });

  if (API)
    return (
      <GameStateProvider API={API}>
        <Game />
      </GameStateProvider>
    );
  return <div>Loading QSP</div>;
};

export default Loader;
