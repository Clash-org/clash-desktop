import { PageParams, Pages, PageState } from '@/hooks/usePage';
import React, { createContext, ReactNode, useCallback, useState } from 'react';

interface PageProviderProps {
    children: ReactNode;
    defaultPage?: Pages;
}

interface PageContextType {
    page: Pages;
    params: PageParams[Pages];
    setPage: <T extends Pages>(page: T, params?: PageParams[T]) => void;
    goBack: () => void;
    history: PageState[];
}

export const PageContext = createContext<PageContextType | undefined>(undefined);

export const PageProvider: React.FC<PageProviderProps> = ({
    children,
    defaultPage = Pages.SETTINGS
}) => {
    const [history, setHistory] = useState<PageState[]>([{
        currentPage: defaultPage,
        params: undefined
    }]);

    const currentState = history[history.length - 1];

    const setPage = useCallback(<T extends Pages>(page: T, params?: PageParams[T]) => {
        setHistory(prev => [...prev, { currentPage: page, params }]);
    }, []);

    const goBack = useCallback(() => {
        setHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    }, []);

    return (
        <PageContext.Provider value={{
            page: currentState.currentPage,
            params: currentState.params,
            setPage,
            goBack,
            history
        }}>
            {children}
        </PageContext.Provider>
    );
};