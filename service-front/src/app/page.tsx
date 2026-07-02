import { RecordOverhaulButton, TopDashboard } from '@/features/dashboard';
import { diveLocationLabel, listDives } from '@/features/dives';
import { ensureTimedNotifications } from '@/features/notifications/server/queries';
import { NextPlanCard } from '@/features/plans';
import { recordOverhaul } from '@/features/regulators';
import { fetchTimeline, Timeline } from '@/features/social';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(
    {
        slug: '/',
        title: 'ダッシュボード',
        description: 'あなたのダイビング活動のいまを一望できるダッシュボード',
    },
    { noIndex: true },
);

/**
 * TOP ダッシュボード（認証必須。未認証は proxy.ts が /login へリダイレクト）。
 * feature 間 import 禁止のため、dives / plans / regulators 由来のデータ・コンポーネントは
 * ここ（app 層）で組み立てて TopDashboard に注入する。
 */
export default async function Home() {
    // リマインド通知の遅延生成（025 / FR-009・FR-010。冪等・失敗は内部でログのみ）
    await ensureTimedNotifications();

    const [recentPage, timeline] = await Promise.all([listDives({ limit: 5 }), fetchTimeline({ limit: 20 })]);
    const recentDives = recentPage.items.map((dive) => ({
        id: dive.id,
        diveDate: dive.diveDate,
        location: diveLocationLabel(dive),
        maxDepthM: dive.maxDepthM,
        bottomTimeMin: dive.bottomTimeMin,
    }));

    return (
        <div className="flex flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
                <TopDashboard
                    recentDives={recentDives}
                    nextPlanSection={
                        <section aria-labelledby="dashboard-next-plan" className="flex flex-col gap-3">
                            <h2 id="dashboard-next-plan" className="font-semibold text-lg">
                                次のダイビング予定
                            </h2>
                            <NextPlanCard />
                        </section>
                    }
                    renderRecordButton={(regulatorId) => (
                        <RecordOverhaulButton regulatorId={regulatorId} onRecord={recordOverhaul} />
                    )}
                />

                <section aria-labelledby="dashboard-timeline" className="flex flex-col gap-3">
                    <h2 id="dashboard-timeline" className="font-semibold text-lg">
                        タイムライン
                    </h2>
                    <Timeline items={timeline.items} />
                </section>
            </div>
        </div>
    );
}
