import React from "react";
import { render } from "react-dom";
import "./style.css";
import "bootstrap/dist/css/bootstrap.min.css";

import Loader from "./Loader";

render(<Loader />, document.getElementById("app"));
