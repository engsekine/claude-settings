import { KpiCard, getDashboardKpis } from '@/features/dashboard';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata({
    slug: '/',
    title: 'ダッシュボード',
    description: '運営状況の概要',
});

export default async function DashboardPage() {
    const kpis = await getDashboardKpis();

    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-semibold text-2xl">ダッシュボード</h1>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiCard label="登録ユーザー数" value={kpis.userCount} href="/users" />
                <KpiCard label="ダイブログ総数" value={kpis.diveCount} href="/dives" />
                <KpiCard label="ダイブサイト数" value={kpis.diveSiteCount} href="/dive-sites" />
            </div>
        </div>
    );
}
