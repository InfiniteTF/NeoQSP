import React, { useEffect, useRef } from "react";
import { shell } from "electron";

import { useGameState } from "./State";

const Dialog: React.FC<{ text: string }> = ({ text }) => {
  const { execString } = useGameState();
  const content = useRef<HTMLDivElement>(null);

  const onClick = (event: MouseEvent) => {
    event.preventDefault();

    if (event.target instanceof Element) {
      const anchor = event.target.closest("a, area");
      if (anchor) {
        const command = (anchor as HTMLAnchorElement).href;
        if (command.slice(0, 5).toLowerCase() === "exec:")
          execString(command.slice(5));
        if (command.slice(0, 4) === "http") shell.openExternal(command);
      }
    }
  };

  const Time = Date.now();

  useEffect(() => {
    if (content.current) {
      const html = text.replace(/\n/g, "<br />");
      const oldEl = content.current.children[0];
      const el = oldEl.cloneNode() as HTMLDivElement;
      el.innerHTML = html;

      const anchors = el.getElementsByTagName("a");
      Array.from(anchors).forEach((el: HTMLAnchorElement) => {
        // eslint-disable-next-line no-param-reassign
        el.onclick = onClick;
      });

      const images = el.getElementsByTagName("img");
      const videos = el.getElementsByTagName("video");

      if (images.length || videos.length) {
        Promise.any([
          new Promise((resolve) => setTimeout(resolve, 50)),
          ...Array.from(images).map((el) => {
            return new Promise((resolve) => {
              el.addEventListener("load", resolve, { once: true });
              el.addEventListener("error", resolve, { once: true });
            });
          }),
          ...Array.from(videos).map((el) => {
            return new Promise((resolve) => {
              el.preload = "auto";
              el.addEventListener(
                "canplay",
                () => {
                  el.play();
                  resolve();
                },
                { once: true }
              );
              el.addEventListener("error", resolve, { once: true });
            });
          }),
        ]).then(() => {
          content.current?.replaceChild(el, oldEl);
          console.log(`Media load time: ${Date.now() - Time}ms`);
        });
      } else {
        content.current?.replaceChild(el, oldEl);
        console.log("No media loaded");
      }
    }
  }, [text]);

  return (
    <div ref={content} className="Dialog">
      <div />
    </div>
  );
};

export default Dialog;
