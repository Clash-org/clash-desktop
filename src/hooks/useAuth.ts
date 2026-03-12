import { AUTH_HOST } from '@/constants';
import { LangType, RegistrationType, UserType } from '@/typings';
import { getAccessToken, setAccessToken } from '@/utils/api';
import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import toast from 'react-hot-toast';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAccessToken());

  // Авто-восстановление сессии при загрузке
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await fetch(AUTH_HOST + 'refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          setIsAuthenticated(true);
        }
      } catch {
        // Сессия не восстановилась — нормально
      }
    };

    if (!getAccessToken()) {
      restoreSession();
    }
  }, []);

  // POST /auth/register
  const register = useCallback(async (
    email: string,
    username: string,
    password: string,
    cityId: number | null,
    clubId: number | null,
    gender: boolean,
    lang: string,
    cityName?: string,
    clubName?: string
  ): Promise<RegistrationType | undefined> => {
    const res = await fetch(AUTH_HOST + 'register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email, username, password, cityId, clubId, gender,
        cityName, clubName, lang
      }),
    });

    if (res.status === 201) {
      const data = await res.json() as RegistrationType;
      setAccessToken(data.accessToken);
      setIsAuthenticated(true);
      return data;
    } else {
      const error = await res.json();
      throw new Error(error.message || 'Registration failed');
    }
  }, []);

  // POST /auth/login
  const login = useCallback(async (email: string, password: string, lang: LangType): Promise<RegistrationType | undefined> => {
    const res = await fetch(AUTH_HOST + 'login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, lang }),
    });

    if (res.status === 200) {
      const data = await res.json() as RegistrationType;
      setAccessToken(data.accessToken);
      setIsAuthenticated(true);
      return data;
    } else {
        toast.error(res.statusText)
    //   const error = await res.json();
    //   throw new Error(error.message || 'Login failed');
    }
  }, []);

  // POST /auth/refresh (используется в fetcher, но можно и явно)
  const refresh = useCallback(async (): Promise<{ accessToken: string } | undefined> => {
    const res = await fetch(AUTH_HOST + 'refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (res.status === 200) {
      const data = await res.json();
      setAccessToken(data.accessToken);
      return data;
    }
  }, []);

  // POST /auth/logout
  const logout = useCallback(async () => {
    await fetch(AUTH_HOST + 'logout', {
      method: 'POST',
      credentials: 'include',
    });

    setAccessToken(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  }, []);

  return {
    isAuthenticated,
    register,
    login,
    logout,
    refresh,
  };
}

// GET /auth/me через useSWR (авто-обновление данных пользователя)
export function useMe(lang: string) {
  const token = getAccessToken();

  const { data, error, isLoading, mutate } = useSWR(
    token ? `${AUTH_HOST}me?lang=${lang}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      errorRetryCount: 3,
    }
  );

  return {
    user: data as UserType | undefined,
    isLoading,
    error,
    mutate,
  };
}