import { storage } from "@/utils/storage";
import { createContext, ReactNode, useCallback, useEffect, useState } from "react";

export class ApiConfig {
  private _baseUrl: string;
  private readonly defaultHost = "http://localhost:3000/";

  constructor(initialHost?: string) {
    this._baseUrl = initialHost || this.defaultHost;
  }

  // Геттеры для всех endpoint'ов
  get base(): string {
    return this._baseUrl;
  }

  get auth(): string {
    return `${this._baseUrl}auth/`;
  }

  get logout(): string {
    return `${this.auth}logout`
  }

  get users(): string {
    return `${this._baseUrl}users/`;
  }

  get cities(): string {
    return `${this._baseUrl}cities`;
  }

  get clubs(): string {
    return `${this._baseUrl}clubs`;
  }

  get tournaments(): string {
    return `${this._baseUrl}tournaments`;
  }

  get weapons(): string {
    return `${this._baseUrl}weapons`;
  }

  get nominations(): string {
    return `${this._baseUrl}nominations`;
  }

  get participantsInfo(): string {
    return `${this.tournaments}/participants/info`
  }

  get ratings(): string {
    return `${this._baseUrl}ratings`;
  }

  get processTournament(): string {
    return `${this.ratings}/process-tournament`;
  }

  get upload(): string {
    return `${this._baseUrl}upload`;
  }

  get covers(): string {
    return `${this._baseUrl}uploads/images/covers/`;
  }

  // Метод для изменения базового хоста
  setBaseUrl(newUrl: string): void {
    // Валидация URL
    try {
      new URL(newUrl);
      this._baseUrl = newUrl.endsWith('/') ? newUrl : `${newUrl}/`;
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  // Метод для сброса к хосту по умолчанию
  resetToDefault(): void {
    this._baseUrl = this.defaultHost;
  }

  // Получить все endpoint'ы в виде объекта
  getAllEndpoints(): Record<string, string> {
    return {
      base: this.base,
      auth: this.auth,
      users: this.users,
      cities: this.cities,
      clubs: this.clubs,
      tournaments: this.tournaments,
      weapons: this.weapons,
      nominations: this.nominations,
      upload: this.upload,
      covers: this.covers,
    };
  }
}

// --------------------------------------------------------------------------------
// Глобальный экземпляр для использования вне компонентов
let globalApiConfig: ApiConfig | null = null;

export const setGlobalApiConfig = (config: ApiConfig) => {
  globalApiConfig = config;
};

export const getApiConfig = (): ApiConfig => {
  if (!globalApiConfig) {
    throw new Error('ApiConfig not initialized. Make sure ApiProvider is mounted.');
  }
  return globalApiConfig;
};
// --------------------------------------------------------------------------------

// Тип для контекста
export interface ApiContextType {
  api: ApiConfig;
  baseUrl: string;
  setBaseUrl: (newUrl: string) => void;
  resetToDefault: () => void;
  updateConfig: (newConfig: ApiConfig) => void;
}

// Создаём контекст
export const ApiContext = createContext<ApiContextType | undefined>(undefined);

// Провайдер контекста
interface ApiProviderProps {
  children: ReactNode;
  initialConfig?: ApiConfig;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({
  children,
  initialConfig
}) => {
  const [api] = useState(() => initialConfig || new ApiConfig());
  const [baseUrl, setBaseUrlState] = useState(api.base);
  const [, setUpdateTrigger] = useState(0);

  useEffect(()=>{
        (async ()=>{
            await storage.init()
            const server = await storage.get<string>("server")
            if (server) {
              setGlobalApiConfig(new ApiConfig(server))
              setBaseUrl(server)
            }
        })()
  }, [])

  const setBaseUrl = useCallback((newUrl: string) => {
    try {
      api.setBaseUrl(newUrl);
      setBaseUrlState(api.base);
      setUpdateTrigger(prev => prev + 1); // Форсируем перерендер
    } catch (error) {
      console.error('Failed to set base URL:', error);
      throw error;
    }
  }, [api]);

  const resetToDefault = useCallback(() => {
    api.resetToDefault();
    setBaseUrlState(api.base);
    setUpdateTrigger(prev => prev + 1);
  }, [api]);

  const updateConfig = useCallback((newConfig: ApiConfig) => {
    // Обновляем ссылку на конфиг (если нужно)
    Object.assign(api, newConfig);
    setBaseUrlState(api.base);
    setUpdateTrigger(prev => prev + 1);
  }, [api]);

  return (
    <ApiContext.Provider value={{
      api,
      baseUrl,
      setBaseUrl,
      resetToDefault,
      updateConfig
    }}>
      {children}
    </ApiContext.Provider>
  );
};