# service-front

Next.js 16を使用したフロントエンドアプリケーション

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript 5.7
- **スタイル**: Tailwind CSS v4
- **データフェッチング**: TanStack Query (React Query)
- **状態管理**: Zustand
- **フォーム**: React Hook Form + Yup
- **テスト**: Jest, Playwright, Testing Library
- **開発ツール**: Storybook, ESLint, Prettier

---

## クイックスタート

**最も簡単な方法（Makefile使用）:**

```bash
cd service-front

# 初回セットアップ（SSL証明書生成 + npm install）
make setup

# 開発サーバー起動（HTTPS）
make dev-https
```

**手動でセットアップする場合は [セットアップ](#セットアップ) を参照してください。**

---

## セットアップ

### 1. パッケージのインストール

```bash
npm install
```

### 2. ローカル開発環境のSSL化（必須）

#### mkcertのインストール

mkcertは、ローカル環境で信頼できるSSL証明書を生成するツールです。

**macOS（Homebrew）**
```bash
brew install mkcert

# mkcertをシステムにインストール
mkcert -install

# localhost用の証明書を生成
mkcert localhost 127.0.0.1 ::1
```

**Windows（Chocolatey）**
```bash
choco install mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

**Linux（Ubuntu/Debian）**
```bash
sudo apt install libnss3-tools
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert

mkcert -install
mkcert localhost 127.0.0.1 ::1
```

#### 証明書の配置

生成された証明書ファイルをプロジェクトルート直下に配置：

```bash
# 生成されたファイルをリネーム
mv localhost+2.pem localhost.pem
mv localhost+2-key.pem localhost-key.pem
```

**ファイル構成:**
```
service-front/
├── localhost.pem         # SSL証明書
├── localhost-key.pem     # 秘密鍵
├── package.json
└── ...
```

#### なぜHTTPS化が必要？

- Service Worker（PWA）の動作に必須
- Web Cryptography APIの使用に必須
- 本番環境に近い環境でのテスト
- Cookie（Secure属性）のテスト

---

## 開発サーバーの起動

### HTTP（通常モード）
```bash
npm run dev
# http://localhost:3000
```

### HTTPS（推奨）
```bash
npm run dev:https
# https://localhost:3000
```

---

## スクリプト一覧

### 開発
- `npm run dev` - 開発サーバー起動（HTTP）
- `npm run dev:https` - 開発サーバー起動（HTTPS）

### ビルド・本番
- `npm run build` - プロダクションビルド
- `npm start` - プロダクションサーバー起動

### コード品質
- `npm run lint` - ESLintチェック
- `npm run lint:fix` - ESLint自動修正
- `npm run prettier` - Prettierチェック
- `npm run prettier:fix` - Prettier自動修正
- `npm run format` - Lint + Prettier一括修正
- `npm run type-check` - TypeScript型チェック

### テスト
- `npm run test` - Jestユニットテスト
- `npm run test:watch` - テストウォッチモード
- `npm run test:coverage` - カバレッジ生成
- `npm run test:e2e` - Playwright E2Eテスト
- `npm run test:all` - 全テスト実行

### Storybook
- `npm run storybook` - Storybook起動
- `npm run build-storybook` - Storybookビルド

### 総合チェック
- `npm run validate` - 型チェック + Lint + テスト

---

## Makeコマンド

プロジェクトには便利なMakefileが用意されています。

### セットアップ
- `make setup` - 初回セットアップ（SSL証明書生成 + npm install）
- `make cert` - SSL証明書のみ生成
- `make clean` - すべてクリーンアップ（node_modules + 証明書）
- `make clean-cert` - SSL証明書のみ削除

### 開発
- `make dev` - 開発サーバー起動（HTTP）
- `make dev-https` - 開発サーバー起動（HTTPS、証明書自動生成）

### ビルド・テスト
- `make build` - プロダクションビルド
- `make test` - テスト実行
- `make lint` - Lint実行
- `make format` - フォーマット実行
- `make type-check` - 型チェック
- `make validate` - すべてのチェック実行

### ヘルプ
- `make help` - 利用可能なコマンド一覧表示

**例:**
```bash
# 初回セットアップ
make setup

# 開発サーバー起動（証明書がなければ自動生成）
make dev-https

# すべてクリーンアップして再セットアップ
make clean && make setup
```

---

## Docker開発環境

```bash
# 開発環境起動
docker-compose -f docker-compose.dev.yml up

# バックグラウンド起動
docker-compose -f docker-compose.dev.yml up -d

# ログ確認
docker-compose -f docker-compose.dev.yml logs -f

# 停止
docker-compose -f docker-compose.dev.yml down
```

---

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx          # Root Layout
│   ├── page.tsx            # トップページ
│   └── providers.tsx       # グローバルProvider
├── components/
│   └── ui/                 # shadcn/ui コンポーネント
├── hooks/
│   └── use-posts.ts        # カスタムフック（TanStack Query）
├── stores/
│   ├── example-store.ts    # Zustandストア例
│   └── user-store.ts       # ユーザーストア
├── lib/
│   └── react-query.ts      # TanStack Query設定
└── styles/
```

---

## 使用例

詳細な使用方法は [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) を参照してください。

### TanStack Query（データフェッチング）

```tsx
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

### Zustand（状態管理）

```tsx
import { useUserStore } from "@/stores/user-store";

export function UserProfile() {
  const { user, setUser, clearUser } = useUserStore();

  return (
    <div>
      {user ? (
        <>
          <p>ようこそ、{user.name}さん</p>
          <button onClick={clearUser}>ログアウト</button>
        </>
      ) : (
        <button onClick={() => setUser({ id: "1", name: "太郎", email: "taro@example.com" })}>
          ログイン
        </button>
      )}
    </div>
  );
}
```

---

## トラブルシューティング

### SSL証明書エラーが出る場合

```bash
# mkcertを再インストール
mkcert -uninstall
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

### ポート3000が使用中の場合

```bash
# プロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>

# または別のポートで起動
npm run dev -- -p 3001
```

### node_modulesの問題

```bash
# クリーンインストール
rm -rf node_modules package-lock.json
npm install
```

---

## 環境変数

`.env.local`ファイルを作成して環境変数を設定：

```bash
# 公開環境変数（クライアント側で使用可能）
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# サーバー側のみの環境変数
NODEMAILER_USER=your_email@example.com
NODEMAILER_PASS=your_password
```

---

## .gitignoreへの追加

証明書ファイルは**Gitにコミットしない**でください：

```gitignore
# SSL証明書（各開発者がローカルで生成）
localhost*.pem
*.key
*.crt
```

---

## ライセンス

Private
