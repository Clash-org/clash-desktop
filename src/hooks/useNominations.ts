import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { NominationType } from '@/typings';
import { useApi } from './useApi';

// GET /nominations?lang=
export function useNominations(lang: string) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<NominationType[]>(
    `${api.nominations}?lang=${lang}`,
    fetcher,
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    nominations: data || [],
    isLoading,
    error,
    mutate,
  };
}