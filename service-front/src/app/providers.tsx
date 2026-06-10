'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

import { getQueryClient } from '@/shared/lib/react-query';

/**
 * アプリケーション全体のProviderコンポーネント
 * TanStack Query、Zustandなどのグローバル状態管理を提供
 */
export function Providers({ children }: { children: ReactNode }) {
    // useState で保持しない: Suspense でレンダーが破棄されても
    // getQueryClient がブラウザではシングルトンを返すためキャッシュは失われない
    const queryClient = getQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* 開発環境でのみReact Query DevToolsを表示 */}
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    );
}
