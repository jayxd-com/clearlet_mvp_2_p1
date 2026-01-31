import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function useAuth(options: { redirectOnUnauthenticated?: boolean } = {}) {
  const utils = trpc.useUtils();
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false, // Prevent refetching when window gains focus to avoid flickering
  });
  
  const [, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      // Invalidate the query to force a refetch and clear the cache
      await utils.auth.me.invalidate();
      // Reset the user data to null immediately to update UI
      utils.auth.me.setData(undefined, null);
      setLocation("/");
    },
  });

  useEffect(() => {
    if (options.redirectOnUnauthenticated && !isLoading && !user) {
      setLocation("/signin");
    }
  }, [user, isLoading, options.redirectOnUnauthenticated, setLocation]);

  return {
    user,
    isAuthenticated: !!user,
    loading: isLoading,
    logout: () => logoutMutation.mutateAsync(),
    refresh: () => utils.auth.me.invalidate(),
  };
}
