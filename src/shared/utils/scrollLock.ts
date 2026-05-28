/**
 * Reference-counted body scroll lock. Multiple overlapping modals each call
 * `lockScroll` / `unlockScroll`; the document only scrolls again once the last
 * lock is released. Prevents one closing modal from restoring scroll while
 * another is still open.
 */
let lockCount = 0;
const originalOverflow = new Map<HTMLElement, string>();

export const lockScroll = (): void => {
  const body = document.body;
  if (lockCount === 0) {
    originalOverflow.set(body, body.style.overflow);
    body.style.overflow = "hidden";
  }
  lockCount++;
};

export const unlockScroll = (): void => {
  if (lockCount === 0) return;
  lockCount--;
  if (lockCount === 0) {
    const body = document.body;
    body.style.overflow = originalOverflow.get(body) ?? "";
    originalOverflow.delete(body);
  }
};
