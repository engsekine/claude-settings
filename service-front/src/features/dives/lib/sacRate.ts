/** SAC 算出に使う任意入力項目（潜水時間は必須項目のため不足になり得ない） */
type SacInputField = 'pressureStartBar' | 'pressureEndBar' | 'tankVolumeL' | 'avgDepthM';

/** 不足項目の表示ラベル。既存 UI（DiveForm / DiveDetail）の項目名に合わせる */
export const SAC_INPUT_FIELD_LABELS: Record<SacInputField, string> = {
    pressureStartBar: '開始残圧',
    pressureEndBar: '終了残圧',
    tankVolumeL: 'タンク容量',
    avgDepthM: '平均水深',
};

/** missing は不足項目の案内表示、invalid は SAC 関連を一切表示しないことに対応する */
type SacRateResult =
    | { status: 'ok'; sacRateLpm: number }
    | { status: 'missing'; missingFields: SacInputField[] }
    | { status: 'invalid' };

/** `Dive` 型の該当フィールドをそのまま渡せる形 */
export interface SacRateInput {
    pressureStartBar: number | null;
    pressureEndBar: number | null;
    tankVolumeL: number | null;
    avgDepthM: number | null;
    bottomTimeMin: number;
}

/** missingFields の列挙順 = この定義順 */
const SAC_INPUT_FIELDS: readonly SacInputField[] = ['pressureStartBar', 'pressureEndBar', 'tankVolumeL', 'avgDepthM'];

/**
 * エア消費率（SAC: 水面換算の毎分ガス消費量 L/分）を算出する純粋関数。
 *
 * 消費ガス量[L] = (開始残圧 − 終了残圧) × タンク容量
 * 周囲圧[気圧] = 平均水深 ÷ 10 + 1（10 m = 1 気圧加算の慣習近似。淡水・海水の密度差は補正しない）
 * SAC[L/分] = 消費ガス量 ÷ 潜水時間 ÷ 周囲圧
 *
 * sacRateLpm は丸めずに返す。表示時の丸めは formatSacRate が行う。
 */
export const calcSacRate = (input: SacRateInput): SacRateResult => {
    const { pressureStartBar, pressureEndBar, tankVolumeL, avgDepthM, bottomTimeMin } = input;

    if (pressureStartBar === null || pressureEndBar === null || tankVolumeL === null || avgDepthM === null) {
        const missingFields = SAC_INPUT_FIELDS.filter((field) => input[field] === null);
        return { status: 'missing', missingFields };
    }

    const consumedL = (pressureStartBar - pressureEndBar) * tankVolumeL;
    if (consumedL <= 0 || tankVolumeL <= 0 || bottomTimeMin <= 0) return { status: 'invalid' };

    const ambientAta = avgDepthM / 10 + 1;
    return { status: 'ok', sacRateLpm: consumedL / bottomTimeMin / ambientAta };
};

/** 表示用に小数第 1 位へ四捨五入して「15.0 L/分」形式にする */
export const formatSacRate = (sacRateLpm: number): string => `${(Math.round(sacRateLpm * 10) / 10).toFixed(1)} L/分`;
