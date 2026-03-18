import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { LangType, TournamentShortType, TournamentType } from '@/typings';
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

// GET /tournaments?lang=&short=
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
export function useTournament(id: number | null, lang: LangType) {
  const { api } = useApi()
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${api.tournaments}/${id}?lang=${lang}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    tournament: data as TournamentType|undefined,
    isLoading,
    error,
    mutate,
  };
}

// GET /tournaments/organizer/:uuid
export function useOrganizerTournaments(uuid: string | null, lang: LangType) {
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