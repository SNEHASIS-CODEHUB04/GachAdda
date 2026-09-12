import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:    "bg-primary/10 text-primary",
        success:    "bg-success/10 text-success",
        warning:    "bg-warning/10 text-warning",
        error:      "bg-error/10 text-error",
        info:       "bg-info/10 text-info",
        gold:       "bg-gold/15 text-gold-dark",
        sage:       "bg-sage/20 text-primary-dark",
        earth:      "bg-earth/10 text-earth",
        outline:    "border border-primary/40 text-primary bg-transparent",
        solid:      "bg-primary text-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Map order status → badge variant */
export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    PAYMENT_PENDING:      "warning",
    PAYMENT_VERIFICATION: "info",
    PAYMENT_VERIFIED:     "success",
    ORDER_ACCEPTED:       "success",
    PROCESSING:           "info",
    PACKED:               "info",
    DISPATCHED:           "default",
    DELIVERED:            "success",
    COMPLETED:            "success",
    CANCELLED:            "error",
    REJECTED:             "error",
  };
  const labels: Record<string, string> = {
    PAYMENT_PENDING:      "Payment Pending",
    PAYMENT_VERIFICATION: "Verifying",
    PAYMENT_VERIFIED:     "Verified",
    ORDER_ACCEPTED:       "Accepted",
    PROCESSING:           "Processing",
    PACKED:               "Packed",
    DISPATCHED:           "Dispatched",
    DELIVERED:            "Delivered",
    COMPLETED:            "Completed",
    CANCELLED:            "Cancelled",
    REJECTED:             "Rejected",
  };
  return <Badge variant={map[status] ?? "default"}>{labels[status] ?? status}</Badge>;
}
