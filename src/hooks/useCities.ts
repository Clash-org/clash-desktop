import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { CITY_HOST } from '@/constants';
import { CityType } from '@/typings';

// GET /cities?lang=
export function useCities(lang: string) {
  const { data, error, isLoading, mutate } = useSWR<CityType[]>(
    `${CITY_HOST}?lang=${lang}`,
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
  const { data, error, isLoading, mutate } = useSWR<CityType>(
    id ? `${CITY_HOST}/${id}` : null,
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