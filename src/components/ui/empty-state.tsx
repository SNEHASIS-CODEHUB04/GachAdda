import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;      // use href for server components
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {icon && <div className="mb-4 text-5xl" aria-hidden="true">{icon}</div>}
      <h3 className="text-lg font-semibold text-primary-dark">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-[var(--color-sage)]">{description}</p>}
      {action?.href && (
        <Link
          href={action.href}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
