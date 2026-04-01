import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * サンプルストアの型定義
 */
interface ExampleStore {
  // State
  count: number;
  isOpen: boolean;

  // Actions
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  toggle: () => void;
}

/**
 * サンプルストア
 * カウンターとモーダル開閉状態を管理する例
 */
export const useExampleStore = create<ExampleStore>()(
  devtools(
    persist(
      (set) => ({
        // 初期状態
        count: 0,
        isOpen: false,

        // アクション
        increment: () => set((state) => ({ count: state.count + 1 })),
        decrement: () => set((state) => ({ count: state.count - 1 })),
        reset: () => set({ count: 0 }),
        toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      }),
      {
        name: "example-store", // localStorageのキー名
      },
    ),
    {
      name: "ExampleStore", // Redux DevToolsでの表示名
    },
  ),
);
