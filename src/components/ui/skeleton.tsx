import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rect" | "circle" | "text";
}

export function Skeleton({ className, variant = "rect", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        variant === "circle" && "rounded-full",
        variant === "text"   && "rounded h-4 w-full",
        variant === "rect"   && "rounded-lg",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl bg-white shadow-card border border-[var(--border)] overflow-hidden">
      <Skeleton className="h-52 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-xl bg-white shadow-card border border-[var(--border)] p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton variant="text" className="w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-3/4" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton variant="text" className="w-32 h-5" />
          <Skeleton variant="text" className="flex-1 h-5" />
          <Skeleton variant="text" className="w-20 h-5" />
          <Skeleton variant="text" className="w-24 h-5" />
        </div>
      ))}
    </div>
  );
}
