import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { NOMINATION_HOST } from '@/constants';
import { NominationType } from '@/typings';

// GET /nominations?lang=
export function useNominations(lang: string) {
  const { data, error, isLoading, mutate } = useSWR<NominationType[]>(
    `${NOMINATION_HOST}?lang=${lang}`,
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