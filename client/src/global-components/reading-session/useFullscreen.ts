import { RefObject, useEffect, useState } from "react";

const supported = typeof document !== "undefined" && document.fullscreenEnabled;

export const useFullscreen = (ref: RefObject<HTMLElement | null>) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!supported) return;
    const sync = () => setActive(document.fullscreenElement !== null && document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [ref]);

  const exit = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
  };

  const toggle = () => {
    if (document.fullscreenElement) exit();
    else void ref.current?.requestFullscreen();
  };

  return { supported, active, toggle, exit };
};
