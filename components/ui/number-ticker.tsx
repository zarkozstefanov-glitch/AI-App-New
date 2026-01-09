"use client";

import { useEffect, useState } from "react";

type NumberTickerProps = {
  value: number;
  durationMs?: number;
  delayMs?: number;
  format?: (value: number) => string;
  className?: string;
};

export default function NumberTicker({
  value,
  durationMs = 1800,
  delayMs = 120,
  format,
  className,
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let rafId = 0;
    let timerId = 0;
    const target = Number.isFinite(value) ? value : 0;

    const startAnimation = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / durationMs, 1);
        const nextValue = target * progress;
        setDisplayValue(nextValue);
        if (progress < 1) {
          rafId = window.requestAnimationFrame(tick);
        }
      };
      setDisplayValue(0);
      rafId = window.requestAnimationFrame(tick);
    };

    timerId = window.setTimeout(startAnimation, delayMs);
    return () => {
      window.clearTimeout(timerId);
      window.cancelAnimationFrame(rafId);
    };
  }, [value, durationMs, delayMs]);

  const formatted = format ? format(displayValue) : displayValue.toFixed(2);
  return <span className={className}>{formatted}</span>;
}
