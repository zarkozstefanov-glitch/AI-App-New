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
        "rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
