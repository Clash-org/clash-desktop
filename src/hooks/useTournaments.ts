import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { LangType, PoolType, TournamentShortType, TournamentType } from '@/typings';
import { useApi } from './useApi';


export function useTournaments(lang: LangType, page: number, short: true): {
  tournaments: TournamentShortType[];
  tournamentsCount: number
  isLoading: boolean;
  error: any;
  mutate: () => void;
};

export function useTournaments(lang: LangType, page: number, short?: false): {
  tournaments: TournamentType[];
  tournamentsCount: number
  isLoading: boolean;
  error: any;
  mutate: () => void;
};

// GET /tournaments?lang=&short=&page=
export function useTournaments(lang: LangType, page: number, short?: boolean): {
  tournaments: TournamentShortType[]|TournamentType[];
  tournamentsCount: number;
  isLoading: boolean;
  error: any;
  mutate: () => void;
} {
  const query = new URLSearchParams({ lang, page: String(page) });
  if (short) query.set('short', 'true');

  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR(
    `${api.tournaments}?${query}`,
    fetcher,
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    tournaments: short ? (data?.tournaments as TournamentShortType[] || []) : (data?.tournaments as TournamentType[] || []),
    tournamentsCount: data?.tournamentsCount,
    isLoading,
    error,
    mutate,
  };
}

// GET /tournaments/:id?lang=
export function useTournament(id: number | undefined, lang: LangType) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<TournamentType>(
    id ? `${api.tournaments}/${id}?lang=${lang}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    tournament: data,
    isLoading,
    error,
    mutate,
  };
}

// GET /tournaments?lang=&ids=
export function useTournamentsByIds(ids: number[] | undefined, lang: LangType) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<TournamentType[]>(
    ids && ids.length ? `${api.tournaments}?lang=${lang}&ids=${JSON.stringify(ids)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    tournaments: data,
    isLoading,
    error,
    mutate,
  };
}

// GET /tournaments/participants/:id
export function useTournamentsByUserId(userId: string | undefined, lang: LangType) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<TournamentType[]>(
    userId ? `${api.tournaments}/participants/${userId}?lang=${lang}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    tournaments: data,
    isLoading,
    error,
    mutate,
  };
}

// GET /tournaments/organizer/:uuid
export function useOrganizerTournaments(uuid: string | undefined, lang: LangType) {
  const { api } = useApi()
  const { data, error, isLoading } = useSWR(
    uuid ? `${api.tournaments}/organizer/${uuid}?lang=${lang}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    tournaments: data as TournamentType[] || [],
    isLoading,
    error,
  };
}

// GET /tournaments/:id/pool
export function usePool(tournamentId?: number) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR<PoolType[]>(
    tournamentId ? `${api.tournaments}/${tournamentId}/pool` : null,
    url => fetcher(url, undefined, true),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    pools: data,
    isLoading,
    error,
    mutate,
  };
}