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
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </span>
        <h1 className="text-[22px] font-bold leading-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-1 text-[12px] font-medium text-slate-500">{subtitle}</p>
      </div>
      {action && <div className="flex items-center">{action}</div>}
    </div>
  );
}
