"use client";

type PageHeaderProps = {
  label: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
};

export default function PageHeader({
  label,
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-nowrap items-start justify-between gap-3">
      <div className="min-w-0">
        <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:text-[10px]">
          {label}
        </span>
        <h1 className="text-[18px] font-bold leading-tight text-slate-900 sm:text-[22px]">
          {title}
        </h1>
        <p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-[12px]">
          {subtitle}
        </p>
      </div>
      {action && <div className="flex items-center justify-end">{action}</div>}
    </div>
  );
}
