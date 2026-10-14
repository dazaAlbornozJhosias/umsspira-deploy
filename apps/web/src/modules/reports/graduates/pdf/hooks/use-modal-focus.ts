'use client';

import { RefObject, useEffect } from 'react';

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Los botones repetidos para computadora y celular existen los dos; sólo cuenta el que se ve
function isVisible(element: HTMLElement, container: HTMLElement): boolean {
  for (let node: HTMLElement | null = element; node && node !== container; node = node.parentElement) {
    if (window.getComputedStyle(node).display === 'none') return false;
  }
  return true;
}

// Foco de una ventana modal: entra al abrirse y Tab no sale hacia la página de atrás
export function useModalFocus(
  containerRef: RefObject<HTMLElement>,
  initialFocusRef: RefObject<HTMLElement>,
): void {
  useEffect(() => {
    initialFocusRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      const container = containerRef.current;
      if (event.key !== 'Tab' || !container) return;
      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((item) =>
        isVisible(item, container),
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const isOutside = !container.contains(active);
      if (event.shiftKey && (active === first || isOutside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || isOutside)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, initialFocusRef]);
}
