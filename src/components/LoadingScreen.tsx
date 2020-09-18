import React from "react";
import { basename } from "path";

interface LoadingScreenProps {
  filename: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ filename }) => (
  <div id="loading-screen">
    <div
      id="loading-spinner"
      className="spinner-border text-danger"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
    <h4>
      Loading <i>{basename(filename)}</i>...
    </h4>
  </div>
);

export default LoadingScreen;
