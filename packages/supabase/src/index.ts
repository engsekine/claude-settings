// バレルでランタイム実装を re-export すると、利用側のビルド時に
// Server / Browser / Edge の依存が混ざってしまうため型のみエクスポートする。
// 実装は `@repo/supabase/{browser,server,middleware}` から個別に import すること。
export type { Database } from './types';
