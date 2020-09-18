import Store from "electron-store";
import { IStore } from '../types';

const schema = {
  recent: {
    type: "array",
    items: {
      type: "string",
    },
    default: [],
  },
  geometry: {
    type: "object",
    default: {
      width: 1024,
      height: 768,
    },
    properties: {
      x: { type: "number", minimum: 0 },
      y: { type: "number", minimum: 0 },
      width: { type: "number", minimum: 400 },
      height: { type: "number", minimum: 400 },
    },
  },
  splits: {
    type: "object",
    default: {
      actions: [75, 25],
      side: [70, 30],
    },
    properties: {
      actions: {
        type: "array",
        items: {
          type: "number",
        },
      },
      side: {
        type: "array",
        items: {
          type: "number",
        },
      },
    },
  },
} as const;

const store = new Store<IStore>({ schema });

export default store;
