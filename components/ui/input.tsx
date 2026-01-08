import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";

type Props = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, Props>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/50 focus:bg-white",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
