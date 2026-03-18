import { LangType, ParticipantInfo } from "@/typings";
import { useApi } from "./useApi";
import useSWR from "swr";
import { fetcher } from "@/utils/api";

export function useParticipantsInfo(tournamentId: number | undefined, lang: LangType) {
    const { api } = useApi()
    const { data, error, isLoading, mutate } = useSWR<ParticipantInfo[]>(
    tournamentId ? `${api.tournaments}/${tournamentId}/participants/info?lang=${lang}` : null,
    url=>fetcher(url, {}, true),
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    info: data?.length ? data : [],
    isLoading,
    error,
    mutate,
  };
}