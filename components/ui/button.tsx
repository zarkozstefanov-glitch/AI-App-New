import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  full?: boolean;
};

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", full, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70";
    const styles =
      variant === "primary"
        ? "border border-white/40 bg-white/30 text-slate-900 shadow-glow backdrop-blur-xl hover:bg-white/50 disabled:opacity-60"
        : "border border-white/40 bg-transparent text-slate-700 hover:bg-white/20 hover:border-white/60";
    return (
      <button
        ref={ref}
        className={clsx(base, styles, full && "w-full", className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
