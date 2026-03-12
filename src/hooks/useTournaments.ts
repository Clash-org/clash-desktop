import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { TOURNAMENT_HOST } from '@/constants';
import { TournamentShortType, TournamentType } from '@/typings';


export function useTournaments(lang: string, page: number, short: true): {
  tournaments: TournamentShortType[];
  tournamentsCount: number
  isLoading: boolean;
  error: any;
  mutate: () => void;
};

export function useTournaments(lang: string, page: number, short?: false): {
  tournaments: TournamentType[];
  tournamentsCount: number
  isLoading: boolean;
  error: any;
  mutate: () => void;
};

// GET /tournaments?lang=&short=
export function useTournaments(lang: string, page: number, short?: boolean): {
  tournaments: TournamentShortType[]|TournamentType[];
  tournamentsCount: number;
  isLoading: boolean;
  error: any;
  mutate: () => void;
} {
  const query = new URLSearchParams({ lang, page: String(page) });
  if (short) query.set('short', 'true');

  const { data, error, isLoading, mutate } = useSWR(
    `${TOURNAMENT_HOST}?${query}`,
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
export function useTournament(id: number | null, lang: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${TOURNAMENT_HOST}/${id}?lang=${lang}` : null,
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
export function useOrganizerTournaments(uuid: string | null) {
  const { data, error, isLoading } = useSWR(
    uuid ? `${TOURNAMENT_HOST}/organizer/${uuid}` : null,
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