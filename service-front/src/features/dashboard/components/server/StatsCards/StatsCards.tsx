import type { DiveStats } from '@/features/dashboard/types';

interface StatsCardsProps {
    /** 累計統計。null は集計失敗を表す */
    stats: DiveStats | null;
}

/**
 * 累計潜水時間（分）を「XX時間YY分」形式にする（FR-005）。
 * 60 分未満は「YY分」。100 時間を超えても丸めず時間表記のまま（例: 120時間30分）。
 */
export const formatTotalBottomTime = (totalMinutes: number): string => {
    if (totalMinutes < 60) return `${totalMinutes}分`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}時間${minutes}分`;
};

interface StatItem {
    label: string;
    value: string;
}

const FAILED_VALUE = '-';

const buildStatItems = (stats: DiveStats | null): StatItem[] => {
    if (!stats) {
        return [
            { label: '累計ダイブ本数', value: FAILED_VALUE },
            { label: '累計潜水時間', value: FAILED_VALUE },
            { label: '最大水深', value: FAILED_VALUE },
            { label: '訪問スポット数', value: FAILED_VALUE },
        ];
    }

    return [
        { label: '累計ダイブ本数', value: `${stats.totalDives} 本` },
        { label: '累計潜水時間', value: formatTotalBottomTime(stats.totalBottomTimeMin) },
        { label: '最大水深', value: `${stats.maxDepthM} m` },
        { label: '訪問スポット数', value: `${stats.visitedLocations} スポット` },
    ];
};

export const StatsCards = ({ stats }: StatsCardsProps) => {
    const items = buildStatItems(stats);

    return (
        <div className="flex flex-col gap-2">
            {stats === null && (
                <p role="status" className="text-muted-foreground text-sm">
                    集計に失敗しました
                </p>
            )}
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex flex-col gap-1 rounded-lg border border-border bg-background p-4"
                    >
                        <dt className="text-muted-foreground text-sm">{item.label}</dt>
                        <dd className="font-semibold text-foreground text-lg">{item.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};
