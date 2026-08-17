"use client";

import { useEffect, useRef } from "react";

export function AuthInteractiveBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const fineGridRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0.5, y: 0.45 });
  const current = useRef({ x: 0.5, y: 0.45 });
  const raf = useRef<number | null>(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1280px)");
    reduceMotion.current = motion.matches;

    const onMotionChange = () => {
      reduceMotion.current = motion.matches;
    };
    motion.addEventListener("change", onMotionChange);

    const root = rootRef.current;
    if (!root) {
      return () => motion.removeEventListener("change", onMotionChange);
    }

    const setVars = (x: number, y: number) => {
      const xp = `${(x * 100).toFixed(2)}%`;
      const yp = `${(y * 100).toFixed(2)}%`;

      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty("--spot-x", xp);
        spotlightRef.current.style.setProperty("--spot-y", yp);
      }
      if (gridRef.current) {
        gridRef.current.style.setProperty("--spot-x", xp);
        gridRef.current.style.setProperty("--spot-y", yp);
      }
      if (fineGridRef.current) {
        fineGridRef.current.style.setProperty("--spot-x", xp);
        fineGridRef.current.style.setProperty("--spot-y", yp);
      }
    };

    setVars(0.5, 0.45);

    const tick = () => {
      const ease = reduceMotion.current ? 1 : 0.12;
      current.current.x += (target.current.x - current.current.x) * ease;
      current.current.y += (target.current.y - current.current.y) * ease;
      setVars(current.current.x, current.current.y);
      raf.current = window.requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      target.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      };
    };

    const onLeave = () => {
      target.current = { x: 0.5, y: 0.45 };
    };

    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (raf.current !== null) {
        window.cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };

    const start = () => {
      if (raf.current !== null) return;
      raf.current = window.requestAnimationFrame(tick);
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    };

    const syncViewport = () => {
      if (desktop.matches) start();
      else stop();
    };

    syncViewport();
    desktop.addEventListener("change", syncViewport);

    return () => {
      motion.removeEventListener("change", onMotionChange);
      desktop.removeEventListener("change", syncViewport);
      stop();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 hidden overflow-hidden xl:block"
      aria-hidden="true"
    >
      <div className="absolute inset-0 auth-page-gradient" />
      <div ref={spotlightRef} className="auth-mouse-spotlight absolute inset-0" />
      <div ref={gridRef} className="auth-math-grid auth-math-grid-interactive absolute inset-0" />
      <div
        ref={fineGridRef}
        className="auth-math-grid-fine auth-math-grid-interactive absolute inset-0 opacity-60"
      />
    </div>
  );
}
