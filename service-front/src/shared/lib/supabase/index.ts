// 実装は `@/shared/lib/supabase/{browser,server,middleware}` から個別に import する。
// ここでバレル経由で再エクスポートすると Server / Browser / Edge の依存が混ざってビルドに失敗するため、型のみ公開する。
export type { Database } from '@repo/supabase';
