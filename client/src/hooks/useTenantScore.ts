import { trpc } from "@/lib/trpc";

export function useTenantScore(userId?: number) {
  const { data: ownScore, isLoading: ownLoading, error: ownError } = trpc.profile.getTenantScore.useQuery(undefined, {
    enabled: !userId,
    staleTime: 0,
    refetchInterval: 10000, // Poll every 10 seconds for score updates
  });

  const { data: userScore, isLoading: userLoading, error: userError } = trpc.profile.getUserTenantScore.useQuery(
    { userId: userId! }, 
    {
      enabled: !!userId,
      staleTime: 0,
      refetchInterval: 10000,
    }
  );

  if (userId) {
    return {
      data: userScore,
      isLoading: userLoading,
      error: userError,
    };
  }

  return {
    data: ownScore,
    isLoading: ownLoading,
    error: ownError,
  };
}
