import clsx from "clsx";
import { ReactNode } from "react";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/40 bg-white/20 backdrop-blur-3xl shadow-glow animate-float",
        className,
      )}
    >
      {children}
    </div>
  );
}
