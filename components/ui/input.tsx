import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";

type Props = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, Props>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-xl border border-white/40 bg-white/30 px-3 py-2 text-sm text-slate-800 outline-none shadow-glow backdrop-blur-xl transition focus:border-blue-400/60 focus:bg-white/60",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
