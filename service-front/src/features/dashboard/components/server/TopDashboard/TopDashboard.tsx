import { buttonVariants } from '@repo/ui/components/button';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { BlankDays } from '@/features/dashboard/components/server/BlankDays';
import { DiveTrends } from '@/features/dashboard/components/server/DiveTrends';
import { RecentDives } from '@/features/dashboard/components/server/RecentDives';
import { RegulatorPanel } from '@/features/dashboard/components/server/RegulatorPanel';
import { StatsCards } from '@/features/dashboard/components/server/StatsCards';
import {
    getDashboardHero,
    getDiveStats,
    getMonthlyDiveStats,
    getPrimaryRegulatorStatus,
    getYearlyDiveCounts,
} from '@/features/dashboard/server/queries';
import type {
    DiveStats,
    MonthlyDiveStat,
    PrimaryRegulatorStatus,
    RecentDiveItem,
    YearlyDiveCount,
} from '@/features/dashboard/types';

interface TopDashboardProps {
    /** 最近のダイブログ（dives 機能のデータはページ側で変換して渡す） */
    recentDives: RecentDiveItem[];
    /** 「次の予定」セクション（plans 機能のコンポーネントはページ側で組み立てて渡す） */
    nextPlanSection?: ReactNode;
    /** OH 完了記録ボタン（regulators 機能の Server Action はページ側で注入する） */
    renderRecordButton?: (regulatorId: string) => ReactNode;
}

/**
 * TOP ダッシュボードの組み立て（FR-002）。
 * dashboard 機能が持つデータ（ヒーロー / 統計 / OH ステータス）はここで取得し、
 * 他 feature 由来のデータ・コンポーネントは props / slot で受け取る（feature 間 import 禁止のため）。
 */
export const TopDashboard = async ({ recentDives, nextPlanSection, renderRecordButton }: TopDashboardProps) => {
    const hero = await getDashboardHero();

    // 集計失敗時は StatsCards 側のエラー表示に委ねる（plan.md エラーハンドリング）
    let stats: DiveStats | null = null;
    try {
        stats = await getDiveStats();
    } catch (error) {
        console.error('[TopDashboard] stats error:', error);
    }

    // 推移の集計失敗時は DiveTrends 側のエラー表示に委ねる（null で渡す）
    let yearlyCounts: YearlyDiveCount[] | null = null;
    let monthlyStats: MonthlyDiveStat[] | null = null;
    try {
        [yearlyCounts, monthlyStats] = await Promise.all([getYearlyDiveCounts(), getMonthlyDiveStats()]);
    } catch (error) {
        console.error('[TopDashboard] trends error:', error);
        yearlyCounts = null;
        monthlyStats = null;
    }

    // 機材取得失敗時はパネルの代わりにエラー文言 + 設定導線を表示する
    let regulatorStatus: PrimaryRegulatorStatus | null = null;
    let regulatorFailed = false;
    try {
        regulatorStatus = await getPrimaryRegulatorStatus();
    } catch (error) {
        console.error('[TopDashboard] regulator error:', error);
        regulatorFailed = true;
    }

    return (
        <div className="flex flex-col gap-8">
            <section aria-labelledby="dashboard-hero" className="flex flex-col gap-3">
                <h1 id="dashboard-hero" className="font-semibold text-2xl">
                    {hero.nickname ? `ようこそ、${hero.nickname}さん` : 'ようこそ'}
                </h1>
                {hero.blankDays === null ? (
                    <p className="text-muted-foreground text-sm">
                        まだダイブログがありません。最初の 1 本を記録しましょう
                    </p>
                ) : (
                    <BlankDays blankDays={hero.blankDays} />
                )}
                <div className="flex items-center gap-2">
                    <Link href="/dives/new" className={buttonVariants({ variant: 'default' })}>
                        新しいログを記録
                    </Link>
                    <Link href="/settings/certifications" className={buttonVariants({ variant: 'outline' })}>
                        保有資格を管理
                    </Link>
                </div>
            </section>

            <section aria-labelledby="dashboard-stats" className="flex flex-col gap-3">
                <h2 id="dashboard-stats" className="font-semibold text-lg">
                    累計統計
                </h2>
                <StatsCards stats={stats} />
            </section>

            <section aria-labelledby="dashboard-trends" className="flex flex-col gap-3">
                <h2 id="dashboard-trends" className="font-semibold text-lg">
                    統計の推移
                </h2>
                <DiveTrends yearlyCounts={yearlyCounts} monthlyStats={monthlyStats} />
            </section>

            <section aria-labelledby="dashboard-regulator" className="flex flex-col gap-3">
                <h2 id="dashboard-regulator" className="font-semibold text-lg">
                    レギュレーター OH 状況
                </h2>
                {regulatorFailed ? (
                    <div className="rounded-lg border border-border bg-background p-4">
                        <p role="status" className="text-muted-foreground text-sm">
                            機材情報の取得に失敗しました。時間をおいて再度お試しください。
                        </p>
                        <Link href="/settings/equipment" className="text-primary text-sm underline">
                            機材設定を開く
                        </Link>
                    </div>
                ) : (
                    <RegulatorPanel
                        status={regulatorStatus}
                        recordButton={
                            regulatorStatus && renderRecordButton
                                ? renderRecordButton(regulatorStatus.regulatorId)
                                : undefined
                        }
                    />
                )}
            </section>

            {nextPlanSection}

            <section aria-labelledby="dashboard-recent" className="flex flex-col gap-3">
                <h2 id="dashboard-recent" className="font-semibold text-lg">
                    最近のダイブログ
                </h2>
                <RecentDives dives={recentDives} />
            </section>
        </div>
    );
};
