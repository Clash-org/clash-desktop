// src/providers/AuthProvider.tsx
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  // useAuth сам восстановит сессию в useEffect
  useAuth();

  // Можно добавить глобальный стейт если нужно
  return <>{children}</>;
}