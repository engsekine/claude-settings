# フロントエンド開発ガイド

フロントエンドプロジェクトにおけるコード配置とプロジェクト構造のガイドライン。

## プロジェクト構造の原則

```
/src
  /components        # 共通UIコンポーネント
  /features          # 機能固有のコード（ビジネスロジック含む）
  /lib               # 汎用ユーティリティ・ヘルパー
  /hooks             # カスタムHook（汎用的なもの）
  /types             # 型定義（共有されるもの）
  /utils             # ユーティリティ関数（純粋関数）
```

## 配置判断の基準

| 種類              | 配置場所             | 条件                      |
| ----------------- | -------------------- | ------------------------- |
| UI コンポーネント | `/components`        | 2つ以上の場所で使用される |
| ビジネスロジック  | `/features/<domain>` | 特定のドメインに依存      |
| ユーティリティ    | `/lib/utils`         | ドメイン非依存、純粋関数  |
| カスタムHook      | `/hooks`             | 状態管理ロジック、汎用的  |
| 型定義            | `/types`             | 複数ファイルで共有される  |

## コード配置の例

### 良い例

```
/src
  /components
    /Button
      Button.tsx
      Button.test.tsx
      Button.stories.tsx
  /features
    /auth
      /components
        LoginForm.tsx
      /hooks
        useAuth.ts
      /api
        authApi.ts
  /hooks
    useLocalStorage.ts
    useDebounce.ts
  /lib
    /utils
      formatDate.ts
      calculateTotal.ts
```

### 悪い例

```
[NG] 機能固有の場所に汎用コードを配置
  /features/UserProfile/utils/formatDate.ts  # 日付フォーマットは汎用的
  /pages/Dashboard/helpers/calculateTotal.ts  # 計算ロジックは汎用的

[OK] 正しい配置
  /lib/utils/formatDate.ts
  /lib/helpers/calculateTotal.ts
```

## React/Next.js 固有のガイドライン

### コンポーネント配置

- **Pageコンポーネント**: `/app` または `/pages`（Next.jsのルーティングに従う）
- **共通コンポーネント**: `/components`（2箇所以上で使用）
- **機能固有コンポーネント**: `/features/<domain>/components`

### Hooks配置

- **汎用Hook**: `/hooks`（例: `useDebounce`, `useLocalStorage`）
- **機能固有Hook**: `/features/<domain>/hooks`（例: `useAuth`, `useCart`）

### 型定義配置

- **共有型**: `/types`（複数の機能で使用）
- **機能固有型**: `/features/<domain>/types`
- **APIレスポンス型**: `/types/api` または `/features/<domain>/types`

## 判断基準のチェックリスト

新しいコードを配置する際、以下を確認:

- [ ] このコードは2箇所以上で使用されるか？
- [ ] このコードは特定のドメイン/機能に依存しているか？
- [ ] このコードは独立して動作するか（副作用は少ないか）？
- [ ] 既存のプロジェクト構造に従っているか？

## 参考

- プロジェクト固有の構造がある場合は、それを優先
- 不明な場合は、類似コードの配置場所を検索して確認
