import { AdditionsFields, LangType, ParticipantStatusType, PoolCreatedType, PredictType, TournamentFormData, TournamentMatchType, TournamentResponse, TournamentStatusType, TournamentType, UserType } from '@/typings';
import toast from 'react-hot-toast';
import { mutate } from 'swr';
import { getApiConfig } from '@/providers/ApiProvider';

// POST /tournaments
export async function createTournament(data: TournamentFormData) {
  const host = getApiConfig().tournaments
  const result = await fetcher(host, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Инвалидируем кэш списка
  await mutate((key) => typeof key === 'string' && key.startsWith(host));

  return result as TournamentType;
}

// PUT /tournaments
export async function updateTournament(data: TournamentFormData, tournamentId: number) {
  const host = getApiConfig().tournaments
  const result = await fetcher(host, {
    method: 'PUT',
    body: JSON.stringify({ ...data, tournamentId }),
  });

  // Инвалидируем кэш
  await mutate(`${host}/${tournamentId}`);

  return result as TournamentType;
}

// PATCH /tournaments (status)
export async function updateTournamentStatus(status: TournamentStatusType, tournamentId: number) {
  const host = getApiConfig().tournaments
  const result = await fetcher(host + "/status", {
    method: 'PATCH',
    body: JSON.stringify({ status, tournamentId }),
  });

  await mutate(`${host}/${tournamentId}`);

  return result as TournamentType;
}

// DELETE /tournaments
export async function deleteTournament(tournamentId: number) {
  const host = getApiConfig().tournaments
  const result = await fetcher(host, {
    method: 'DELETE',
    body: JSON.stringify({ tournamentId }),
  });

  // Инвалидируем всё
  await mutate((key) => typeof key === 'string' && key.startsWith(host));

  return result as { success: boolean };
}

// POST /upload/image
export async function uploadImage(formData: FormData, dir: "covers"|"profiles") {
  const host = getApiConfig().upload
    const res = await fetcher(host + `/image?dir=${dir}`, {
        method: "POST",
        body: formData
    })

    return res
}

// POST /tournaments/:id/participants
export async function addParticipant(tournamentId: number, nominationId: number) {
  const host = getApiConfig().tournaments
  const url = `${host}/${tournamentId}/participants`;
  const result = await fetcher(url, {
    method: "POST",
    body: JSON.stringify({ tournamentId, nominationId })
  })

  await mutate(
    (key) => typeof key === 'string' && key.includes('/participants')
  );

  return result as { success: boolean };
}

// POST /tournaments/participants/info
export async function addParticipantInfo(tournamentId: number, userId: string, info: AdditionsFields, lang: LangType) {
  const host = getApiConfig().participantsInfo
  const result = await fetcher(host, {
    method: "POST",
    body: JSON.stringify({ tournamentId, userId, info, lang })
  })

  await mutate(
    (key) => typeof key === 'string' && key.startsWith(host)
  );

  return result as { success: true };
}

// PATCH tournaments/:id/participants/status
export async function updateParticipantStatus(tournamentId: number, nominationId: number, userId: string, status: ParticipantStatusType) {
  const host = getApiConfig().tournaments
  const url = `${host}/${tournamentId}/participants/status`;
  const result = await fetcher(url, {
    method: "PATCH",
    body: JSON.stringify({ status, nominationId, userId })
  })

  await mutate(
    (key) => typeof key === 'string' && key.includes('/participants')
  );

  return result as { success: boolean };
}

// POST /ratings/process-tournament
export async function processTournament(tournamentId: number, weaponId: number, nominationId: number, matches: TournamentMatchType[], tournamentDate: Date) {
  const host = getApiConfig().processTournament
  const result = await fetcher(host, {
    method: 'POST',
    body: JSON.stringify({ tournamentId, weaponId, nominationId, matches, tournamentDate }),
  });

  // Инвалидируем кэш списка
  await mutate((key) => typeof key === 'string' && key.startsWith(host));

  return result as TournamentResponse;
}

// PUT /users
export async function updateUser(user: (Partial<Omit<UserType, "id">> & { id: string, password?: string }), lang: LangType) {
  const host = getApiConfig().users
  const result = await fetcher(host + `?lang=${lang}`, {
    method: 'PUT',
    body: JSON.stringify(user)
  });

  // Инвалидируем кэш списка
  await mutate((key) => typeof key === 'string' && key.startsWith(host));

  return result as UserType;
}

// POST /tournaments/:id/pool
export async function createPool(pool: PoolCreatedType) {
  const { tournamentId, ...other } = pool
  const host = getApiConfig().tournaments
  const result = await fetcher(`${host}/${tournamentId}/pool`, {
    method: "POST",
    body: JSON.stringify(other)
  })

  await mutate(
    (key) => typeof key === 'string' && key.includes('/pool')
  );

  return result as { success: true };
}

// PUT /tournaments/pool
export async function updatePool(poolId: number, pool: PoolCreatedType) {
  const host = getApiConfig().tournaments
  const result = await fetcher(host + `/pool`, {
    method: 'PUT',
    body: JSON.stringify({ poolId, ...pool })
  });

  // Инвалидируем кэш списка
  await mutate((key) => typeof key === 'string' && key.includes('/pool'));

  return result as { success: true };
}

// POST /ratings/predict
export async function getPredict(fighterRedId: string, fighterBlueId: string, weaponId: number, nominationId: number) {
  const host = getApiConfig().ratings
  const result = await fetcher(host + `/predict`, {
    method: 'POST',
    body: JSON.stringify({ fighterBlueId, fighterRedId, weaponId, nominationId })
  });

  // Инвалидируем кэш списка
  await mutate((key) => typeof key === 'string' && key.startsWith(host));

  return result as PredictType;
}

// POST /ratings/predict
export async function createWeapons(weapon: string, nomination: string, weaponId?: number) {
  let result: { success: boolean } = { success: false }
  const hostWeapons = getApiConfig().weapons
  const hostNominations = getApiConfig().nominations
  if (!weaponId) {
    const newWeaponId = (await fetcher(hostWeapons, {
      method: 'POST',
      body: JSON.stringify({ title: weapon })
    })) as number

    await mutate((key) => typeof key === 'string' && key.startsWith(hostWeapons));

    result = await fetcher(hostNominations, {
      method: "POST",
      body: JSON.stringify({ title: nomination, weaponId: newWeaponId })
    })
  } else {
    result = await fetcher(hostNominations, {
      method: "POST",
      body: JSON.stringify({ title: nomination, weaponId })
    })
  }

  await mutate((key) => typeof key === 'string' && key.startsWith(hostNominations));

  return result;
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
export const fetcher = async <T>(url: string, options: RequestInit = {}, withoutMessage=false) => {
  const token = getAccessToken();
  const host = getApiConfig().auth
  const isFormData = options.body instanceof FormData;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(!isFormData && options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  });

  // Авто-refresh при 401
  if (res.status === 401 && !url.includes('/refresh')) {
    const refreshRes = await fetch(host + 'refresh', {
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

  if (!res.ok && !withoutMessage) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    toast.error(error.error || res.statusText)
    throw new Error(error.message);
  }

  return res.json() as T;
};

// Для публичных endpoint без токена
export const fetcherPublic = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
};