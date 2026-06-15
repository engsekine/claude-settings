interface BarChartItem {
    label: string;
    value: number;
}

interface BarChartProps {
    /** x 軸ラベルと値の列。値 0 は高さ 0 の棒として描画する */
    items: BarChartItem[];
    /** SVG 全体の要約（aria-label）。スクリーンリーダー向けにデータの要点を含める */
    description: string;
}

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 220;
const CHART_HEIGHT = 160;
const TOP_PADDING = 20;
const LABEL_Y = VIEW_HEIGHT - 16;
const VALUE_GAP = 6;

/**
 * 静的な SVG 棒グラフ（Server Component）。
 * イベントハンドラを持たず、代替表現は利用側（TrendChartCard のデータテーブル等）で提供する。
 */
export const BarChart = ({ items, description }: BarChartProps) => {
    // データ 0 件は描画しない（slotWidth の 0 除算回避。空状態は呼び出し側で表示する）
    if (items.length === 0) return null;

    // 全項目 0 のときも 0 除算を避けて高さ 0 の棒を描画する
    const maxValue = Math.max(...items.map((item) => item.value), 1);
    const slotWidth = VIEW_WIDTH / items.length;
    const barWidth = Math.min(slotWidth * 0.6, 64);

    return (
        <svg role="img" aria-label={description} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="h-auto w-full">
            <line
                x1="0"
                y1={TOP_PADDING + CHART_HEIGHT}
                x2={VIEW_WIDTH}
                y2={TOP_PADDING + CHART_HEIGHT}
                className="stroke-border"
                strokeWidth="1"
            />
            {items.map((item, index) => {
                const barHeight = Math.round((item.value / maxValue) * CHART_HEIGHT);
                const x = slotWidth * index + (slotWidth - barWidth) / 2;
                const y = TOP_PADDING + CHART_HEIGHT - barHeight;
                const centerX = slotWidth * index + slotWidth / 2;

                return (
                    <g key={item.label}>
                        <rect
                            data-bar
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx="2"
                            className="fill-primary"
                        />
                        <text
                            x={centerX}
                            y={y - VALUE_GAP}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[11px]"
                        >
                            {item.value}
                        </text>
                        <text
                            data-label
                            x={centerX}
                            y={LABEL_Y}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[11px]"
                        >
                            {item.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};
