/** 管理者の権限種別 */
export type AdminRole = 'admin' | 'superadmin';

/** 認証済みの管理者を表す。requireAdmin / getAdminUser が返す */
export interface AdminUser {
    id: string;
    displayName: string;
    role: AdminRole;
}
