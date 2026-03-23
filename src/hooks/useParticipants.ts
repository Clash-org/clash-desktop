import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { NominationUsersType } from '@/typings';
import { useApi } from './useApi';

export function useParticipants(
  tournamentId: number | undefined,
  nominationIds: number[]
) {
  const { api } = useApi()
  // Формируем URL только если есть id и nominationIds
  const query = nominationIds.length > 0
    ? `?nominationIds=${JSON.stringify(nominationIds)}`
    : '';

  const url = tournamentId
    ? `${api.tournaments}/${tournamentId}/participants${query}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<NominationUsersType>(
    url,
    url=>fetcher(url, {}, true),
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    participants: data,
    isLoading,
    error,
    mutate,
  };
}