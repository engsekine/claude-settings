# @repo/supabase

複数アプリで共有する Supabase クライアントライブラリ。

## エクスポート

| import パス | 用途 |
|------------|------|
| `@repo/supabase` | `Database` 型のみ |
| `@repo/supabase/browser` | Client Component 用クライアント（`createClient()`） |
| `@repo/supabase/server` | Server Component / Route Handler 用クライアント（`createClient()`） |
| `@repo/supabase/middleware` | Next.js middleware 用 |

> Server / Browser / Edge の依存が混ざるとビルドエラーになるため、利用側はバレル経由ではなく **個別の import パスから直接** 取得してください。

## ローカル Supabase の起動・マイグレーション運用

CLI セットアップ・スキーマ管理は [../../supabase/README.md](../../supabase/README.md) を参照してください。
