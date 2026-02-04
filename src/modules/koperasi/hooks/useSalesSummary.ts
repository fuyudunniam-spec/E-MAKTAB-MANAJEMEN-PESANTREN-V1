import { useQuery } from "@tanstack/react-query";
import { getSalesSummary, TransactionFilters } from "@/modules/inventaris/services/inventaris.service";

export function useSalesSummary(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ["sales-summary", filters],
    queryFn: () => getSalesSummary(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
