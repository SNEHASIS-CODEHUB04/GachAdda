import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4" aria-hidden="true">🌱</div>
        <h1 className="text-4xl font-bold text-primary-dark mb-2">404</h1>
        <h2 className="text-xl font-semibold text-primary-dark mb-3">Page not found</h2>
        <p className="text-[var(--color-sage)] mb-8">
          Looks like this page got lost in the garden. Let&apos;s find you a better path.
        </p>
        <Link href="/">
          <Button size="lg">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
