import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { CityType } from '@/typings';
import { useApi } from './useApi';

// GET /cities?lang=
export function useCities(lang: string) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<CityType[]>(
    `${api.cities}?lang=${lang}`,
    fetcher,
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    cities: data || [],
    isLoading,
    error,
    mutate,
  };
}

// GET /cities/:id
export function useCity(id: number | null) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<CityType>(
    id ? `${api.cities}/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    city: data,
    isLoading,
    error,
    mutate,
  };
}