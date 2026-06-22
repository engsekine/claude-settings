interface LineChartItem {
    label: string;
    /** null は欠測。線を分断して描画し、0 とは区別する */
    value: number | null;
}

interface LineChartProps {
    items: LineChartItem[];
    /** SVG 全体の要約（aria-label） */
    description: string;
    /** 値ラベルに付ける単位（例: '℃' / 'm'） */
    unit?: string;
}

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 220;
const CHART_HEIGHT = 150;
const TOP_PADDING = 25;
const LABEL_Y = VIEW_HEIGHT - 16;
const VALUE_GAP = 10;
const POINT_RADIUS = 4;

interface ChartPoint {
    index: number;
    x: number;
    y: number;
    value: number;
}

/** 非 null の点を、null を境に連続する線分ごとへ分割する */
const splitIntoSegments = (points: (ChartPoint | null)[]): ChartPoint[][] => {
    return points.reduce<ChartPoint[][]>((segments, point) => {
        const currentSegment = segments.at(-1);
        if (point === null) {
            if (!currentSegment || currentSegment.length > 0) segments.push([]);
            return segments;
        }
        if (!currentSegment) {
            segments.push([point]);
            return segments;
        }
        currentSegment.push(point);
        return segments;
    }, []);
};

/**
 * 静的な SVG 折れ線グラフ（Server Component）。
 * 欠測（null）は線の分断として表現し、0 と区別する。
 * イベントハンドラを持たず、代替表現は利用側（TrendChartCard のデータテーブル等）で提供する。
 */
export const LineChart = ({ items, description, unit = '' }: LineChartProps) => {
    // データ 0 件は描画しない（slotWidth の 0 除算回避。空状態は呼び出し側で表示する）
    if (items.length === 0) return null;

    const values = items.map((item) => item.value).filter((value): value is number => value !== null);
    // 全点 null のときも 0 除算を避ける
    const maxValue = Math.max(...values, 1);
    const slotWidth = VIEW_WIDTH / items.length;

    const points = items.map((item, index) => {
        if (item.value === null) return null;
        return {
            index,
            x: slotWidth * index + slotWidth / 2,
            y: TOP_PADDING + CHART_HEIGHT - Math.round((item.value / maxValue) * CHART_HEIGHT),
            value: item.value,
        };
    });
    const segments = splitIntoSegments(points).filter((segment) => segment.length >= 2);
    const visiblePoints = points.filter((point): point is ChartPoint => point !== null);

    // 欠測（null）で分断された各線分を、1 本の path の複数サブパス（M…L…）として描画する。
    // 線分ごとに polyline を map で出力すると markuplint(react-spec) が
    // permitted-contents を誤検知するため、d を 1 本にまとめる。
    // 各線分の先頭が M（move-to）になり線が途切れるので、欠測の分断表現は保たれる。
    const linePath = segments
        .map((segment) => segment.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`).join(' '))
        .join(' ');

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
            <path data-line d={linePath} fill="none" className="stroke-primary" strokeWidth="2" />
            {visiblePoints.map((point) => (
                <g key={`point-${point.index}`}>
                    <circle data-point cx={point.x} cy={point.y} r={POINT_RADIUS} className="fill-primary" />
                    <text
                        data-value
                        x={point.x}
                        y={point.y - VALUE_GAP}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[11px]"
                    >
                        {`${point.value}${unit}`}
                    </text>
                </g>
            ))}
            {items.map((item, index) => (
                <text
                    data-label
                    key={item.label}
                    x={slotWidth * index + slotWidth / 2}
                    y={LABEL_Y}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[11px]"
                >
                    {item.label}
                </text>
            ))}
        </svg>
    );
};
