interface BlankDaysProps {
    /** 最後に潜ってからの経過日数（0 以上）。ログ 0 件（null）の分岐は呼び出し側が担う */
    blankDays: number;
}

/**
 * ブランク日数の表示。ショップ申告にそのまま使える値として数値を強調する。
 * 全体を 1 つの段落にし、スクリーンリーダーで一続きの文として読み上げられる構造にする。
 */
export const BlankDays = ({ blankDays }: BlankDaysProps) => (
    <p className="text-muted-foreground text-sm">
        最後に潜ってから
        <span className="mx-1 font-semibold text-2xl text-foreground">{blankDays}</span>日
        {blankDays === 0 && <span className="ml-2">今日もダイビング日和！</span>}
    </p>
);
