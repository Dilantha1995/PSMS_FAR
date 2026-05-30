import React from "react";
import Link from "next/link";
import { STATUS_LABELS } from "@/lib/format";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex gap-2">{action}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "blue",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "blue" | "green" | "orange" | "slate" | "red";
}) {
  const colors: Record<string, string> = {
    blue: "border-l-brand-blue",
    green: "border-l-brand-green",
    orange: "border-l-brand-orange",
    slate: "border-l-slate-400",
    red: "border-l-red-500",
  };
  return (
    <div className={`bg-white rounded-lg border border-slate-200 border-l-4 ${colors[accent]} shadow-sm p-4`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    DISPOSED: "bg-red-100 text-red-800",
    TRANSFERRED: "bg-amber-100 text-amber-800",
    WRITTEN_OFF: "bg-slate-200 text-slate-700",
    FULLY_DEPRECIATED: "bg-blue-100 text-blue-800",
    DRAFT: "bg-amber-100 text-amber-800",
    POSTED: "bg-green-100 text-green-800",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${map[status] || "bg-slate-100 text-slate-700"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function Btn({
  children,
  variant = "primary",
  type = "submit",
  href,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "submit" | "button";
  href?: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<string, string> = {
    primary: "bg-brand-blue hover:bg-brand-blueDark text-white",
    secondary: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "text-brand-blue hover:underline",
  };
  const cls = `inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${styles[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  step,
  options,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
  step?: string;
  options?: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {options ? (
        <select
          name={name}
          defaultValue={defaultValue}
          required={required}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue bg-white"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
        />
      ) : (
        <input
          name={name}
          type={type}
          step={step}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
        />
      )}
    </label>
  );
}

export function Empty({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-16 text-slate-400">
      <div className="text-sm">{message}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
