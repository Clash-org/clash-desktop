import { StatsType } from "@/typings";
import { fetcher } from "@/utils/api";
import useSWR from "swr";
import { useApi } from "./useApi";

export function useUserRating(userId?: string) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<StatsType>(
    userId ? `${api.ratings}/user/${userId}` : null,
    fetcher,
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