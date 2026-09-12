"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, wrapperClassName, id, ...props }, ref) => {
    const areaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label htmlFor={areaId} className="text-sm font-medium text-primary-dark">
            {label}
            {props.required && <span className="ml-0.5 text-error" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          className={cn(
            "w-full rounded-md border bg-white px-3 py-2 text-sm text-primary-dark placeholder:text-[var(--color-sage)]",
            "border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 resize-y min-h-[80px]",
            error && "border-error focus:ring-error",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p role="alert" className="text-xs text-error">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--color-sage)]">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
