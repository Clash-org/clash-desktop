import { useEffect } from 'react';
import { useDeepLink } from '@/hooks/useDeepLink';
import { Pages, usePage } from '@/hooks/usePage';

export function DeepLinkHandler() {
  const { initialUrl, lastUrl } = useDeepLink();
  const { setPage } = usePage();

  useEffect(() => {
    const handleDeepLink = (url: any) => {
      switch (url.page) {
        case 'profile':
          if (url.id) {
            setPage(Pages.PROFILE, { id: url.id });
          }
          break;

        case 'tournament':
          if (url.id) {
            setPage(Pages.TOURNAMENT, { id: url.id });
          }
          break;

        case 'leaderboard':
          const weaponId = url.params.get('weapon');
          const nominationId = url.params.get('nomination');
          if (weaponId && nominationId) {
            setPage(Pages.LEADERBOARD, { weaponId, nominationId });
          } else {
            setPage(Pages.LEADERBOARD);
          }
          break;

        case 'settings':
          setPage(Pages.SETTINGS);
          break;

        default:
          // Если путь не распознан, идём на главную
          setPage(Pages.SETTINGS);
      }
    };

    if (initialUrl) {
      handleDeepLink(initialUrl);
    }

    if (lastUrl) {
      handleDeepLink(lastUrl);
    }
  }, [initialUrl, lastUrl]);

  return null;
}