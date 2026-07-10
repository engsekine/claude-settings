import Link from 'next/link';
import { CreditBalanceBadge } from '@/features/credits/components/server/CreditBalanceBadge';
import { DashboardHero, RecordOverhaulButton, TopDashboard } from '@/features/dashboard';
import { diveLocationLabel, getCoverThumbUrls, listDives } from '@/features/dives';
import { GuideIntroSection } from '@/features/guide';
import { ensureTimedNotifications } from '@/features/notifications/server/queries';
import { listNextPlansWithProgress, NextPlanCardView } from '@/features/plans';
import { recordOverhaul } from '@/features/regulators';
import { fetchLikedDives, fetchTimeline, LikedDivesList, Timeline, TimelineTabsSwitcher } from '@/features/social';
import { Heading } from '@/shared/components/typography/Heading';
import { buttonVariants } from '@/shared/components/ui/Button';
import { generatePageMetadata } from '@/shared/config/metadata';
import { createClient } from '@/shared/lib/supabase/server';

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
 * 構成は design/req.md に従う: 全幅 FV → 次の予定 → 最近のログ → タイムライン → OH → 累計ダイビング本数。
 * feature 間 import 禁止のため、他 feature 由来のデータ・コンポーネントは
 * ここ（app 層）で組み立てて DashboardHero / TopDashboard に注入する。
 */
export default async function Home() {
    // リマインド通知の遅延生成（025 / FR-009・FR-010。冪等・失敗は内部でログのみ）
    await ensureTimedNotifications();

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 次の予定は FV（先頭 1 件）と「次のダイビング予定」セクション（最大 3 件）で共有する。
    // タイムラインといいねしたログは TOP 内タブで切り替えるため、両方をここで取得する
    const [recentPage, timeline, likedDives, nextPlans] = await Promise.all([
        listDives({ limit: 3 }),
        fetchTimeline({ limit: 20 }),
        fetchLikedDives(),
        listNextPlansWithProgress(3),
    ]);
    // 最近のログのカードに代表写真を出すため、対象ダイブのカバーサムネイルをまとめて解決する
    const coverThumbByDive = await getCoverThumbUrls(recentPage.items.map((dive) => dive.id));
    const recentDives = recentPage.items.map((dive) => ({
        id: dive.id,
        diveDate: dive.diveDate,
        location: diveLocationLabel(dive),
        maxDepthM: dive.maxDepthM,
        bottomTimeMin: dive.bottomTimeMin,
        coverThumbUrl: coverThumbByDive.get(dive.id) ?? null,
    }));

    return (
        <div className="flex flex-1 flex-col">
            {/* FV は全幅（コンテナ外）。残枠バッジ（026 / FR-013）はログ作成ボタンの上に注入 */}
            <DashboardHero badge={<CreditBalanceBadge variant="hero" />} nextPlan={nextPlans[0] ?? null} />
            {/* セクション間の余白は各セクション側（pt-20 / mt-20）で取る */}
            <div className="mx-auto flex w-full max-w-5xl flex-col px-4">
                <TopDashboard
                    recentDives={recentDives}
                    nextPlanSection={
                        <section aria-labelledby="dashboard-next-plan" className="flex flex-col gap-8 pt-20">
                            <div className="flex items-center justify-between gap-4">
                                <Heading level={2} id="dashboard-next-plan">
                                    次のダイビング予定
                                </Heading>
                                {/* 作成導線は予定の有無にかかわらず常に表示する */}
                                <div className="flex items-center gap-3">
                                    <Link href="/plans" className="text-primary underline underline-offset-4">
                                        すべての予定
                                    </Link>
                                    <Link
                                        href="/plans/new"
                                        className={buttonVariants({ variant: 'default', size: 'lg' })}
                                    >
                                        予定を作成する
                                    </Link>
                                </div>
                            </div>
                            {nextPlans.length > 0 ? (
                                nextPlans.map((plan) => <NextPlanCardView key={plan.id} summary={plan} />)
                            ) : (
                                <NextPlanCardView summary={null} />
                            )}
                        </section>
                    }
                    timelineSection={
                        <section aria-label="タイムライン・いいねしたログ" className="flex flex-col gap-8 pt-20">
                            {/* タイムラインといいねしたログを遷移なしで切り替える（spec 027 FR-008a）。
                                内容は Server で用意して panel として注入する */}
                            <TimelineTabsSwitcher
                                timelinePanel={<Timeline items={timeline.items} viewerId={user?.id ?? null} />}
                                likesPanel={
                                    <LikedDivesList
                                        initialItems={likedDives.items}
                                        initialCursor={likedDives.nextCursor}
                                    />
                                }
                            />
                        </section>
                    }
                    renderRecordButton={(regulatorId) => (
                        <RecordOverhaulButton regulatorId={regulatorId} onRecord={recordOverhaul} />
                    )}
                />
                {/* 使い方ページへの導入（030）。既存の日常動線を圧迫しないよう末尾に置く */}
                <GuideIntroSection />
            </div>
        </div>
    );
}
