/**
 * 認証セッション Cookie 名（全クライアント共通）。
 *
 * @supabase/ssr のデフォルト Cookie 名は接続先 URL のホスト名から導出される
 * （`sb-<ホスト名の先頭ラベル>-auth-token`）。本プロジェクトはサーバー側が
 * `SUPABASE_INTERNAL_URL`（host.docker.internal → `sb-host-auth-token`）、
 * ブラウザ側が `NEXT_PUBLIC_SUPABASE_URL`（127.0.0.1 → `sb-127-auth-token`）と
 * 別ホスト名で接続するため、デフォルトのままだと Cookie 名が食い違い、
 * ブラウザクライアントがセッションを読めず anon 扱いになる
 * （RLS で全行除外され、クライアント検索が常に 0 件になる）。
 * これを防ぐため、全クライアントで同一の Cookie 名を明示する。
 */
export const AUTH_COOKIE_NAME = 'sb-divelog-auth-token';
