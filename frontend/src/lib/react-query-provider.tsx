'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Singleton query client for purely client-side SPA context
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is considered fresh for 1 minute
            staleTime: 60 * 1000,
            // If data is stale, refetch in background, but show cached data first
            refetchOnWindowFocus: false,
        },
    },
});

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
