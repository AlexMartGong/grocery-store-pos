import { useEffect, useRef } from "react";

interface UseBarcodeScannerOptions {
  onScan: (code: string) => void;
  enabled?: boolean;
  minLength?: number;
  interKeyMs?: number;
}

const isEditableElement = (el: Element | null): boolean => {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA") return true;
  if (tag === "INPUT") {
    const type = (el as HTMLInputElement).type.toLowerCase();
    return type !== "checkbox" && type !== "radio" && type !== "button" && type !== "submit";
  }
  return (el as HTMLElement).isContentEditable;

};

const allowsScannerOnElement = (el: Element | null): boolean => {
  if (!el) return false;
  return (el as HTMLElement).dataset?.allowScanner === "true";
};

const flushInputValue = (el: Element | null): void => {
  if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) return;
  const proto =
    el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, "");
  el.dispatchEvent(new Event("input", { bubbles: true }));
};

export const useBarcodeScanner = ({
  onScan,
  enabled = true,
  minLength = 4,
  interKeyMs = 30,
}: UseBarcodeScannerOptions): void => {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const maxGapRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      bufferRef.current = "";
      lastKeyTimeRef.current = 0;
      maxGapRef.current = 0;
    };

    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const editable = isEditableElement(active);
      const opted = allowsScannerOnElement(active);
      if (editable && !opted) {
        reset();
        return;
      }

      const now = performance.now();
      const gap = lastKeyTimeRef.current === 0 ? Infinity : now - lastKeyTimeRef.current;
      const isSuperhuman = gap <= interKeyMs;

      if (e.key === "Enter") {
        const candidate = bufferRef.current;
        const looksLikeScanner =
          candidate.length >= minLength && maxGapRef.current <= interKeyMs;
        reset();
        if (looksLikeScanner) {
          e.preventDefault();
          e.stopPropagation();
          if (editable && opted) flushInputValue(active);
          onScanRef.current(candidate);
        }
        return;
      }

      if (e.key.length !== 1) return;

      if (!isSuperhuman) {
        bufferRef.current = e.key;
        maxGapRef.current = 0;
      } else {
        bufferRef.current += e.key;
        if (gap > maxGapRef.current) maxGapRef.current = gap;
        if (editable && opted) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
      lastKeyTimeRef.current = now;
    };

    window.addEventListener("keydown", handler, true);
    return () => {
      window.removeEventListener("keydown", handler, true);
      reset();
    };
  }, [enabled, minLength, interKeyMs]);
};
