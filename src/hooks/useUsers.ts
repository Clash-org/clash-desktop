import { LangType, UserType } from "@/typings";
import { fetcher } from "@/utils/api";
import useSWR from "swr";
import { useApi } from "./useApi";

export function useUsersByClubId(clubId: number|null) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<(UserType & { tournamentsCount: number, nominationCount: number })[]>(
    clubId ? `${api.users}/club/${clubId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    users: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useUsers(lang: LangType) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<UserType[]>(
    api.users + `?lang=${lang}`,
    fetcher,
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    users: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useUser(id: string | undefined) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<UserType>(
    id ? api.users + `/${id}` : null,
    url => fetcher(url, undefined, true),
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    user: data,
    isLoading,
    error,
    mutate,
  };
}