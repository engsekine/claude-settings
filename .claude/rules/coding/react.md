# React コーディング規約

## コンポーネント設計

- 1ファイル1コンポーネントを基本とする
- コンポーネント名はPascalCase（例: `UserProfile`, `ButtonPrimary`）
- ファイル名はコンポーネント名と一致させる（例: `UserProfile.tsx`）
- Props の型定義は `interface` を使用し、コンポーネントの直上に記載する

```tsx
// Good
interface UserProfileProps {
  userId: string;
  name: string;
  avatarUrl?: string;
}

export const UserProfile = ({ userId, name, avatarUrl }: UserProfileProps) => {
  // ...
};
```

## Hooks

- カスタムフックのファイル名・関数名は `use` プレフィックスをつける（例: `useAuth.ts`）
- フックはコンポーネントのトップレベルでのみ呼び出す
- 条件分岐や繰り返しの中でフックを呼ばない

## State管理

- `useState` はシンプルな状態に使用する
- 複数の関連する状態は `useReducer` にまとめることを検討する
- グローバル状態管理ライブラリ（Zustand・Jotai等）はプロジェクトの規約に従う

## イベントハンドラ

- イベントハンドラ名は `handle` プレフィックスをつける（例: `handleClick`, `handleSubmit`）
- Props として渡すイベントハンドラは `on` プレフィックスをつける（例: `onClick`, `onSubmit`）

## レンダリング最適化

- リスト要素には必ず一意の `key` を設定する（インデックスの使用は避ける）
- 重い処理は `useMemo` / `useCallback` でメモ化する
- 不要な再レンダリングを避けるため、`React.memo` の使用を検討する

## その他

- `useEffect` の依存配列を正確に記載する（eslint-plugin-react-hooks に従う）
- コンポーネントは純粋関数として書く（副作用は `useEffect` に閉じ込める）
- デフォルトエクスポートより名前付きエクスポートを優先する
