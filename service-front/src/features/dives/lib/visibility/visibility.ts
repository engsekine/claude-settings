/**
 * ログ公開/非公開（spec 021 US2）の純粋ロジック。
 * Server Action から副作用（DB 更新）と切り離してテスト可能にする。
 */

/** 公開 URL 用の slug を生成する（16 桁の小文字 16 進。public_slug の unique 制約で衝突は検知） */
export const generatePublicSlug = (): string => crypto.randomUUID().replace(/-/g, '').slice(0, 16);

/**
 * 公開化時に使う slug を決める。
 * 既存 slug があれば再公開で同一 URL を維持し、無ければ新規生成する。
 */
export const resolvePublicSlug = (existingSlug: string | null): string => existingSlug ?? generatePublicSlug();
