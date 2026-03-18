import Settings from '@/components/Settings';
import Club from '@/components/Club';
import CreateTournament from '@/components/CreateTournament';
import Fight from '@/components/Fight';
import FightViewerWindow from '@/components/FightViewerWindow';
import Grid from '@/components/Grid';
import Profile from '@/components/Profile';
import Servers from '@/components/Servers';
import Tournament from '@/components/Tournament';
import TournamentsList from '@/components/TournamentsList';
import { useContext, useEffect, useState } from 'react';
import { PageContext } from '@/providers/PageProvider';

// Перечисление всех страниц
export enum Pages {
    SETTINGS,
    TIMER,
    GRID,
    TIMER_VIEW,
    PROFILE,
    TOURNAMENTS_LIST,
    TOURNAMENTS_CREATE,
    TOURNAMENT,
    CLUB,
    SERVERS
}

// Типы параметров для каждой страницы
export type PageParams = {
    [Pages.SETTINGS]: undefined;
    [Pages.TIMER]: undefined;
    [Pages.GRID]: undefined;
    [Pages.TIMER_VIEW]: undefined;
    [Pages.PROFILE]: undefined;
    [Pages.TOURNAMENTS_LIST]: undefined;
    [Pages.TOURNAMENT]: { id: number | null };
    [Pages.TOURNAMENTS_CREATE]: undefined;
    [Pages.CLUB]: { id: number | null };
    [Pages.SERVERS]: undefined;
};

// Тип для состояния страницы
export type PageState = {
    currentPage: Pages;
    params: PageParams[Pages];
};

class PageStore {
  private history: PageState[] = [{
    currentPage: Pages.SETTINGS,
    params: undefined
  }];

  private listeners: Set<() => void> = new Set();

  constructor() {}

  getCurrentState(): PageState {
    return this.history[this.history.length - 1];
  }

  getHistory(): PageState[] {
    return [...this.history];
  }

  setPage<T extends Pages>(page: T, params?: PageParams[T]) {
    this.history = [...this.history, { currentPage: page, params }];
    this.notifyListeners();
  }

  goBack() {
    if (this.history.length > 1) {
      this.history = this.history.slice(0, -1);
      this.notifyListeners();
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

// Глобальный экземпляр
let globalPageStore: PageStore | null = null;

export const getPageStore = (): PageStore => {
  if (!globalPageStore) {
    globalPageStore = new PageStore();

    // Добавляем слушатель для сохранения перед закрытием
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        // Можно сохранить что-то перед закрытием
      });
    }
  }
  return globalPageStore;
};

export const initPage = () => {
  const [state, setState] = useState(() => {
    const store = getPageStore();
    return store.getCurrentState();
  });

  useEffect(() => {
    const store = getPageStore();

    // Подписка на изменения
    const unsubscribe = store.subscribe(() => {
      setState(store.getCurrentState());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const store = getPageStore();

  return {
    page: state.currentPage,
    params: state.params,
    setPage: <T extends Pages>(page: T, params?: PageParams[T]) =>
      store.setPage(page, params),
    goBack: () => store.goBack(),
    history: store.getHistory()
  };
};

export const usePage = () => {
    const context = useContext(PageContext);
    if (!context) {
        console.warn('usePage must be used within a PageProvider');
        return { page: Pages.SETTINGS, setPage: () => console.warn('PageProvider not found') }
    }
    return context;
};

// Рендерер страниц
export const PageRenderer: React.FC<{
    page: Pages;
    params: PageParams[Pages];
    setPage: <T extends Pages>(page: T, params?: PageParams[T]) => void;
    goBack: () => void;
}> = ({ page, params, setPage, goBack }) => {
    const contextValue = {
        page,
        params,
        setPage,
        goBack,
        history: [] // или передайте history если нужно
    };
    const renderPage = () => {
        switch(page) {
            case Pages.SETTINGS:
                return <Settings key="settings" />;
            case Pages.TIMER:
                return <Fight key="fight" />;
            case Pages.PROFILE:
                return <Profile key="profile" />;
            case Pages.TIMER_VIEW:
                return <FightViewerWindow key="fight-viewer" />;
            case Pages.GRID:
                return <Grid key="grid" />;
            case Pages.TOURNAMENTS_LIST:
                return <TournamentsList key="tournaments-list" />;
            case Pages.TOURNAMENT:
                return <Tournament key="tournament" {...(params as PageParams[Pages.TOURNAMENT])} />;
            case Pages.TOURNAMENTS_CREATE:
                return <CreateTournament key="create-tournament" />;
            case Pages.CLUB:
                return <Club key="club" {...(params as PageParams[Pages.CLUB])} />;
            case Pages.SERVERS:
                return <Servers key="servers" />;
            default:
                return <Settings />;
        }
    };

    return <PageContext.Provider value={contextValue}>
        {renderPage()}
    </PageContext.Provider>
};