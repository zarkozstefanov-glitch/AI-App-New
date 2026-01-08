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
        ? "border border-slate-200 bg-white text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.08)] hover:bg-slate-50 disabled:opacity-60"
        : "border border-slate-200 bg-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300";
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
