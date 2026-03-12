import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { TOURNAMENT_HOST } from '@/constants';
import { NominationUsersType } from '@/typings';

export function useParticipants(
  tournamentId: number | null,
  nominationIds: number[]
) {
  // Формируем URL только если есть id и nominationIds
  const query = nominationIds.length > 0
    ? `?nominationIds=${encodeURIComponent(JSON.stringify(nominationIds))}`
    : '';

  const url = tournamentId
    ? `${TOURNAMENT_HOST}/${tournamentId}/participants${query}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<NominationUsersType>(
    url,
    fetcher,
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