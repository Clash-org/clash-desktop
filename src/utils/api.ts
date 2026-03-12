import { AUTH_HOST, TOURNAMENT_HOST, UPLOAD_HOST } from '@/constants';
import { TournamentFormData, TournamentStatusType, TournamentType } from '@/typings';
import toast from 'react-hot-toast';
import { mutate } from 'swr';

// POST /tournaments
export async function createTournament(data: TournamentFormData) {
  const result = await fetcher(TOURNAMENT_HOST, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Инвалидируем кэш списка
  await mutate((key) => typeof key === 'string' && key.startsWith(TOURNAMENT_HOST));

  return result as TournamentType;
}

// PUT /tournaments
export async function updateTournament(data: TournamentFormData, tournamentId: number) {
  const result = await fetcher(TOURNAMENT_HOST, {
    method: 'PUT',
    body: JSON.stringify({ ...data, tournamentId }),
  });

  // Инвалидируем кэш
  await mutate(`${TOURNAMENT_HOST}/${tournamentId}`);

  return result as TournamentType;
}

// PATCH /tournaments (status)
export async function updateTournamentStatus(status: TournamentStatusType, tournamentId: number) {
  const result = await fetcher(TOURNAMENT_HOST, {
    method: 'PATCH',
    body: JSON.stringify({ status, tournamentId }),
  });

  await mutate(`${TOURNAMENT_HOST}/${tournamentId}`);

  return result as TournamentType;
}

// DELETE /tournaments
export async function deleteTournament(tournamentId: number) {
  const result = await fetcher(TOURNAMENT_HOST, {
    method: 'DELETE',
    body: JSON.stringify({ tournamentId }),
  });

  // Инвалидируем всё
  await mutate((key) => typeof key === 'string' && key.startsWith(TOURNAMENT_HOST));

  return result as { success: boolean };
}

export async function uploadImage(formData: FormData, dir: "covers"|"profiles") {
    const res = await fetcher(UPLOAD_HOST + `/image?dir=${dir}`, {
        method: "POST",
        body: formData
    })
    if (res.status === 201) {
        return (await res.json()) as string
    } else {
        toast.error(res.statusText)
    }
}

// Глобальное состояние access токена (в памяти, не localStorage!)
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Fetcher для useSWR с автоматическим refresh
export const fetcher = async (url: string, options: RequestInit = {}) => {
  const token = getAccessToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  });

  // Авто-refresh при 401
  if (res.status === 401 && !url.includes('/refresh')) {
    const refreshRes = await fetch(AUTH_HOST + 'refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setAccessToken(data.accessToken);

      // Повторяем оригинальный запрос
      const retryRes = await fetch(url, {
        ...options,
        headers: {
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          Authorization: `Bearer ${data.accessToken}`,
          ...options.headers,
        },
        credentials: 'include',
      });

      if (!retryRes.ok) throw new Error('Request failed after refresh');
      return retryRes.json();
    }

    // Refresh не сработал
    setAccessToken(null);
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message);
  }

  return res.json();
};

// Для публичных endpoint без токена
export const fetcherPublic = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
};