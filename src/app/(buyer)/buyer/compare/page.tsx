"use client";

import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2 } from "lucide-react";
import Link from "next/link";

export default function ComparePage() {
  // Compare products would be stored in localStorage/zustand
  // For now show the UI skeleton
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Compare Plants</h1>
        <p className="text-sm text-[var(--color-sage)]">Compare up to 4 plants side by side</p>
      </div>

      <Card>
        <CardBody className="text-center py-16">
          <BarChart2 className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
          <p className="font-semibold text-primary-dark">No plants to compare</p>
          <p className="text-sm text-[var(--color-sage)] mt-1">
            Browse the marketplace and click &quot;Compare&quot; on any plant
          </p>
          <Link href="/marketplace">
            <Button className="mt-4" size="sm">Browse Marketplace</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
