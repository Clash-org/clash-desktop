import { useEffect, useState } from 'react';
import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { listen } from '@tauri-apps/api/event';

interface DeepLinkInfo {
  url: string;
  path: string;
  params: URLSearchParams;
  page?: string;
  id?: string;
}

export function useDeepLink() {
  const [initialUrl, setInitialUrl] = useState<DeepLinkInfo | null>(null);
  const [lastUrl, setLastUrl] = useState<DeepLinkInfo | null>(null);

  const parseDeepLink = (url: string): DeepLinkInfo => {
    // Убираем схему clash://
    const urlWithoutScheme = url.replace(/^clash:\/\//, '');

    // Разделяем путь и query параметры
    const [path, queryString] = urlWithoutScheme.split('?');
    const parts = path.split('/').filter(Boolean);

    const page = parts[0] || '';
    const id = parts[1];
    const params = new URLSearchParams(queryString || '');

    return {
      url,
      path,
      page,
      id,
      params
    };
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      // Проверяем, не был ли запуск через deep link
      const startUrls = await getCurrent();
      if (startUrls && startUrls.length > 0) {
        setInitialUrl(parseDeepLink(startUrls[0]));
      }

      // Слушаем события deep link во время работы приложения
      const unlisten = await onOpenUrl((urls) => {
        if (urls.length > 0) {
          setLastUrl(parseDeepLink(urls[0]));
        }
      });

      unsubscribe = unlisten;
    };

    // Также слушаем событие от single-instance плагина
    const unlistenSingle = listen('deep-link', (event: any) => {
      setLastUrl(parseDeepLink(event.payload));
    });

    init();

    return () => {
      unsubscribe?.();
      unlistenSingle.then(fn => fn());
    };
  }, []);

  return { initialUrl, lastUrl };
}