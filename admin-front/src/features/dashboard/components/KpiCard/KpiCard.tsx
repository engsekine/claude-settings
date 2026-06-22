import Link from 'next/link';

interface KpiCardProps {
    label: string;
    value: number;
    /** クリックで対応する管理一覧へ遷移する（US4 シナリオ2） */
    href: string;
}

/** ダッシュボードの KPI カード。数値表示 + 対応一覧へのリンク */
export const KpiCard = ({ label, value, href }: KpiCardProps) => (
    <Link
        href={href}
        className="flex flex-col gap-2 rounded-lg border bg-background p-5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
    >
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="font-semibold text-3xl tabular-nums">{value.toLocaleString('ja-JP')}</span>
    </Link>
);
