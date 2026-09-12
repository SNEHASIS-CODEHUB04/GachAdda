"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white hover:bg-primary-dark active:scale-[0.98] focus-visible:ring-primary shadow-sm",
        secondary:
          "bg-earth text-white hover:bg-earth-dark active:scale-[0.98] focus-visible:ring-earth shadow-sm",
        outline:
          "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white focus-visible:ring-primary",
        ghost:
          "bg-transparent text-primary hover:bg-primary/10 focus-visible:ring-primary",
        destructive:
          "bg-error text-white hover:bg-red-800 focus-visible:ring-error shadow-sm",
        gold:
          "bg-gold text-primary-dark hover:bg-gold-dark active:scale-[0.98] focus-visible:ring-gold shadow-sm",
        cream:
          "bg-cream text-primary-dark border border-[var(--border)] hover:bg-cream-dark focus-visible:ring-primary",
      },
      size: {
        xs:  "h-7  px-3 text-xs",
        sm:  "h-8  px-4 text-sm",
        md:  "h-10 px-5 text-sm",
        lg:  "h-11 px-6 text-base",
        xl:  "h-13 px-8 text-base",
        icon:"h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
