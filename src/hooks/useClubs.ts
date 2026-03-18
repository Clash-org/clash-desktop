import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { ClubType } from '@/typings';
import { useApi } from './useApi';

// GET /clubs
export function useClubs() {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<ClubType[]>(
    api.clubs,
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
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<ClubType>(
    id ? `${api.clubs}/${id}` : null,
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