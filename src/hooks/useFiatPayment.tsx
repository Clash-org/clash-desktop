import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { FiatType } from '@/typings';
import { useApi } from './useApi';

// GET /pay-server-link
export function useFiatPayment() {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<FiatType>(
    `${api.payServerLink}`,
    fetcher,
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    fiat: data,
    isLoading,
    error,
    mutate,
  };
}