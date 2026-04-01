import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * ユーザー情報の型
 */
interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * ユーザーストアの型定義
 */
interface UserStore {
  // State
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
}

/**
 * ユーザーストア
 * 認証済みユーザー情報をグローバルに管理
 */
export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set) => ({
        // 初期状態
        user: null,
        isAuthenticated: false,

        // ユーザー情報をセット
        setUser: (user) =>
          set({
            user,
            isAuthenticated: true,
          }),

        // ユーザー情報をクリア（ログアウト）
        clearUser: () =>
          set({
            user: null,
            isAuthenticated: false,
          }),
      }),
      {
        name: "user-store", // localStorageのキー名
      },
    ),
    {
      name: "UserStore", // Redux DevToolsでの表示名
    },
  ),
);
