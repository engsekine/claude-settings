import { QueryClient } from "@tanstack/react-query";

/**
 * TanStack Query設定
 * データフェッチング、キャッシング、同期のための設定
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // データの鮮度保持時間（5分）
      staleTime: 1000 * 60 * 5,

      // キャッシュ時間（10分）
      gcTime: 1000 * 60 * 10,

      // ウィンドウフォーカス時に再取得
      refetchOnWindowFocus: false,

      // マウント時に再取得
      refetchOnMount: true,

      // 再接続時に再取得
      refetchOnReconnect: true,

      // エラー時のリトライ回数
      retry: 1,

      // リトライ遅延（指数バックオフ）
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // エラー時のリトライなし（mutations）
      retry: false,
    },
  },
});
