import { useEffect, useState } from "react";
import { lockScroll, unlockScroll } from "../utils/scrollLock";

interface UseModalAnimationOptions {
  exitDuration?: number;
  closeOnEscape?: boolean;
  onClose?: () => void;
}

export const useModalAnimation = (
  open: boolean,
  { exitDuration = 200, closeOnEscape = true, onClose }: UseModalAnimationOptions = {},
) => {
  const [render, setRender] = useState(open);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        setRender(true);
        raf2 = requestAnimationFrame(() => setShow(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }
    const raf = requestAnimationFrame(() => setShow(false));
    const t = setTimeout(() => setRender(false), exitDuration);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [open, exitDuration]);

  useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, [render, closeOnEscape, onClose]);

  return { render, show };
};
