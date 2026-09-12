"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";

interface MarketplacePaginationProps {
  currentPage: number;
  totalPages: number;
}

export function MarketplacePagination({ currentPage, totalPages }: MarketplacePaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/marketplace?${params.toString()}`);
  }

  return (
    <Pagination
      page={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
