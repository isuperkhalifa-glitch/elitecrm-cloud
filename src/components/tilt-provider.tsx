"use client";

import { useEffect, type ReactNode } from "react";

type ListenerPair = {
  move: (event: MouseEvent) => void;
  leave: () => void;
};

export function TiltProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canUseTilt = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 769px)"
    ).matches;

    if (reduceMotion || !canUseTilt) return;

    const selector =
      ".safe-card, .elite-login-card, .elite-floating-card, .elite-motion-card, .elite-nav-link";

    const listeners = new Map<HTMLElement, ListenerPair>();

    function bindElement(element: HTMLElement) {
      if (listeners.has(element)) return;

      function move(event: MouseEvent) {
        const rect = element.getBoundingClientRect();

        if (!rect.width || !rect.height) return;

        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        const strength = element.classList.contains("elite-nav-link") ? 2 : 5;

        element.style.setProperty("--tilt-x", `${-y * strength}deg`);
        element.style.setProperty("--tilt-y", `${x * strength}deg`);
        element.style.setProperty("--tilt-glow-x", `${(x + 0.5) * 100}%`);
        element.style.setProperty("--tilt-glow-y", `${(y + 0.5) * 100}%`);
      }

      function leave() {
        element.style.setProperty("--tilt-x", "0deg");
        element.style.setProperty("--tilt-y", "0deg");
        element.style.setProperty("--tilt-glow-x", "50%");
        element.style.setProperty("--tilt-glow-y", "50%");
      }

      element.addEventListener("mousemove", move);
      element.addEventListener("mouseleave", leave);

      listeners.set(element, { move, leave });
    }

    function scan() {
      document
        .querySelectorAll<HTMLElement>(selector)
        .forEach((element) => bindElement(element));
    }

    scan();

    const observer = new MutationObserver(scan);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();

      listeners.forEach((listener, element) => {
        element.removeEventListener("mousemove", listener.move);
        element.removeEventListener("mouseleave", listener.leave);
      });

      listeners.clear();
    };
  }, []);

  return <>{children}</>;
}
