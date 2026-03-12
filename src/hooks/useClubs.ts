import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { CLUB_HOST } from '@/constants';
import { ClubType } from '@/typings';

// GET /clubs
export function useClubs() {
  const { data, error, isLoading, mutate } = useSWR<ClubType[]>(
    CLUB_HOST,
    fetcher,
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    clubs: data || [],
    isLoading,
    error,
    mutate,
  };
}

// GET /clubs/:id
export function useClub(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR<ClubType>(
    id ? `${CLUB_HOST}/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    club: data,
    isLoading,
    error,
    mutate,
  };
}