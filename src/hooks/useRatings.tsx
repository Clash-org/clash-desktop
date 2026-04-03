import { LeaderboardType, MatchType, StatsType } from "@/typings";
import { fetcher } from "@/utils/api";
import useSWR from "swr";
import { useApi } from "./useApi";

export function useUserRating(userId?: string) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<StatsType>(
    userId ? `${api.ratings}/user/${userId}` : null,
    url => fetcher(url, undefined, true),
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    stats: data,
    isLoading,
    error,
    mutate,
  };
}

export function useLeaderboard(page: number, weaponId?: number, nominationId?: number, limit?: number) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<{ users: LeaderboardType[], usersCount: number }>(
    weaponId && nominationId ? `${api.ratings}/leaderboard?weaponId=${weaponId}&nominationId=${nominationId}&limit=${limit}&page=${page}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  )

  return {
    leaderboard: data?.users,
    count: data?.usersCount,
    isLoading,
    error,
    mutate,
  };
}

export function useMatches(tournamentId?: number, nominationId?: number) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<MatchType[]>(
    tournamentId && nominationId ? `${api.matches}?tournamentId=${tournamentId}&nominationId=${nominationId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    matches: data || [],
    isLoading,
    error,
    mutate,
  };
}