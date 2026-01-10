"use client";

import { useEffect, useRef } from "react";

const bubbleConfigs = [
  { className: "glass-bubble--one", speed: 0.15 },
  { className: "glass-bubble--two", speed: 0.1 },
  { className: "glass-bubble--three", speed: 0.2 },
  { className: "glass-bubble--four", speed: 0.12 },
  { className: "glass-bubble--five", speed: 0.18 },
  { className: "glass-bubble--six", speed: 0.08 },
];

export default function DynamicBackground() {
  const bubbleRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const handleScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        bubbleRefs.current.forEach((el, index) => {
          if (!el) return;
          const speed = bubbleConfigs[index]?.speed ?? 0.12;
          el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
        });
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[-10] overflow-hidden">
      <span className="mesh-blob mesh-blob--one" />
      <span className="mesh-blob mesh-blob--two" />
      <span className="mesh-blob mesh-blob--three" />
      <span className="mesh-blob mesh-blob--four" />

      {bubbleConfigs.map((bubble, index) => (
        <span
          key={bubble.className}
          ref={(el) => {
            bubbleRefs.current[index] = el;
          }}
          className={`glass-bubble ${bubble.className}`}
        />
      ))}
    </div>
  );
}
