import { requireAdmin } from '@/features/admin-auth';
import { AdminShell } from '@/shared/components/layout/AdminShell';

/**
 * 要・管理者権限グループの共通レイアウト。
 * requireAdmin で二次ガードを掛け（多層防御 / SC-001）、AdminShell でシェルを描画する。
 */
export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const admin = await requireAdmin();

    return <AdminShell displayName={admin.displayName}>{children}</AdminShell>;
}
