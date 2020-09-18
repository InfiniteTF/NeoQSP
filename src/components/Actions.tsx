/* eslint-disable jsx-a11y/control-has-associated-label */

import React from "react";
import { useGameState } from "./State";
import "./Actions.scss";

const Actions: React.FC = () => {
  const { actions, selectAction } = useGameState();
  const disabled = false;

  return (
    <ul className="Actions">
      {actions.map((action, index) => (
        <li className="Actions-item" key={action.name}>
          <button
            type="button"
            className="Actions-button"
            disabled={disabled}
            onClick={() => selectAction(index)}
            dangerouslySetInnerHTML={{ __html: action.name }}
          />
        </li>
      ))}
    </ul>
  );
};

export default Actions;
