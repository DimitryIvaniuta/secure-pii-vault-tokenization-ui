import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * Centralized query defaults keep retries conservative for sensitive workflows.
 * We avoid aggressive background refetching because these screens often expose
 * audit or PII-related operations where explicit user intent is preferred.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            gcTime: 5 * 60 * 1_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
