"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4" aria-hidden="true">🥀</div>
        <h1 className="text-2xl font-bold text-primary-dark mb-2">Something went wrong</h1>
        <p className="text-[var(--color-sage)] mb-6">{error.message ?? "An unexpected error occurred. Please try again."}</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
