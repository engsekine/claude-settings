# TanStack Query & Zustand 使用例

## TanStack Query（データフェッチング）

### 基本的な使い方

```tsx
"use client";

import { usePosts } from "@/hooks/use-posts";

export function PostList() {
  const { data, isLoading, error } = usePosts();

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;

  return (
    <ul>
      {data?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Mutationの使い方

```tsx
"use client";

import { useCreatePost } from "@/hooks/use-posts";

export function CreatePostForm() {
  const createPost = useCreatePost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createPost.mutateAsync({
        title: "新しい投稿",
        body: "本文",
        userId: 1,
      });
      alert("投稿が作成されました！");
    } catch (error) {
      alert("投稿の作成に失敗しました");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={createPost.isPending}>
        {createPost.isPending ? "作成中..." : "投稿を作成"}
      </button>
    </form>
  );
}
```

### 並列フェッチング

```tsx
import { usePosts, usePost } from "@/hooks/use-posts";

export function Dashboard() {
  const posts = usePosts();
  const post1 = usePost(1);
  const post2 = usePost(2);

  // 3つのリクエストが並列で実行される
  if (posts.isLoading || post1.isLoading || post2.isLoading) {
    return <div>読み込み中...</div>;
  }

  return <div>...</div>;
}
```

---

## Zustand（状態管理）

### 基本的な使い方

```tsx
"use client";

import { useExampleStore } from "@/stores/example-store";

export function Counter() {
  const { count, increment, decrement, reset } = useExampleStore();

  return (
    <div>
      <p>カウント: {count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
      <button onClick={reset}>リセット</button>
    </div>
  );
}
```

### 部分的な状態の購読（パフォーマンス最適化）

```tsx
import { useExampleStore } from "@/stores/example-store";

export function CountDisplay() {
  // countだけを購読（他の状態が変わっても再レンダリングされない）
  const count = useExampleStore((state) => state.count);

  return <div>カウント: {count}</div>;
}
```

### ユーザーストアの使用例

```tsx
"use client";

import { useUserStore } from "@/stores/user-store";

export function UserProfile() {
  const { user, isAuthenticated, setUser, clearUser } = useUserStore();

  const handleLogin = () => {
    setUser({
      id: "1",
      name: "山田太郎",
      email: "yamada@example.com",
    });
  };

  const handleLogout = () => {
    clearUser();
  };

  if (!isAuthenticated) {
    return (
      <div>
        <p>ログインしていません</p>
        <button onClick={handleLogin}>ログイン</button>
      </div>
    );
  }

  return (
    <div>
      <p>ようこそ、{user?.name}さん</p>
      <button onClick={handleLogout}>ログアウト</button>
    </div>
  );
}
```

---

## 組み合わせ例（TanStack Query + Zustand）

```tsx
"use client";

import { usePosts } from "@/hooks/use-posts";
import { useUserStore } from "@/stores/user-store";

export function UserPosts() {
  const { user } = useUserStore();
  const { data: posts, isLoading } = usePosts();

  if (!user) {
    return <div>ログインしてください</div>;
  }

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  // ユーザーIDでフィルタリング
  const userPosts = posts?.filter((post) => post.userId === Number(user.id));

  return (
    <div>
      <h2>{user.name}さんの投稿</h2>
      <ul>
        {userPosts?.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx          # ProvidersでラップしたRoot Layout
│   └── providers.tsx       # TanStack QueryのProvider
├── hooks/
│   └── use-posts.ts        # データフェッチング用カスタムフック
├── stores/
│   ├── example-store.ts    # サンプルストア
│   └── user-store.ts       # ユーザーストア
└── lib/
    └── react-query.ts      # TanStack Query設定
```

---

## 開発ツール

### React Query DevTools
開発環境で自動的に表示されます（画面左下のアイコン）

- キャッシュの状態確認
- クエリの再実行
- キャッシュのクリア

### Redux DevTools（Zustand）
ブラウザ拡張機能をインストールすると、Zustandの状態が確認できます

1. Chrome/Firefoxに「Redux DevTools」をインストール
2. DevToolsを開く
3. Zustandの状態変更を追跡

---

## パッケージインストール

```bash
npm install
```

セットアップ済みのパッケージ:
- `@tanstack/react-query`: データフェッチング
- `@tanstack/react-query-devtools`: 開発ツール
- `zustand`: 状態管理
