import { ApiConfig, ApiContext, ApiContextType } from "@/providers/ApiProvider";
import { useContext } from "react";

// Хук для использования контекста
export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

// Хук для получения endpoint'ов
export const useApiEndpoints = () => {
  const { api } = useApi();
  return api.getAllEndpoints();
};

// Хук для получения конкретного endpoint'a
export const useApiEndpoint = <K extends keyof ReturnType<ApiConfig['getAllEndpoints']>>(
  key: K
): string => {
  const { api } = useApi();
  return api.getAllEndpoints()[key];
};