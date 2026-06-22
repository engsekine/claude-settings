import { calcSacRate, formatSacRate, SAC_INPUT_FIELD_LABELS, type SacRateInput } from './sacRate';

/** specs/008 data-model.md 3 節のフィクスチャを組み立てる */
const buildInput = (overrides: Partial<SacRateInput> = {}): SacRateInput => ({
    pressureStartBar: 200,
    pressureEndBar: 50,
    tankVolumeL: 10,
    avgDepthM: 10,
    bottomTimeMin: 50,
    ...overrides,
});

describe('calcSacRate', () => {
    describe('ok: 5 項目が揃っているとき', () => {
        it('代表ケース（200→50 bar / 10 L / 10 m / 50 分）は 15.0 L/分', () => {
            const result = calcSacRate(buildInput());
            expect(result.status).toBe('ok');
            if (result.status !== 'ok') return;
            expect(result.sacRateLpm).toBeCloseTo(15.0, 5);
        });

        it('180→60 bar / 12 L / 15 m / 48 分 は 12.0 L/分', () => {
            const result = calcSacRate(
                buildInput({
                    pressureStartBar: 180,
                    pressureEndBar: 60,
                    tankVolumeL: 12,
                    avgDepthM: 15,
                    bottomTimeMin: 48,
                }),
            );
            expect(result.status).toBe('ok');
            if (result.status !== 'ok') return;
            expect(result.sacRateLpm).toBeCloseTo(12.0, 5);
        });

        it('平均水深 0 m は周囲圧 1 気圧として計算する（200→100 bar / 10 L / 50 分 → 20.0 L/分）', () => {
            const result = calcSacRate(buildInput({ pressureEndBar: 100, avgDepthM: 0 }));
            expect(result.status).toBe('ok');
            if (result.status !== 'ok') return;
            expect(result.sacRateLpm).toBeCloseTo(20.0, 5);
        });

        it('sacRateLpm は丸めずに返す（200→50 bar / 10 L / 12 m / 45 分 → 15.1515…）', () => {
            const result = calcSacRate(buildInput({ avgDepthM: 12, bottomTimeMin: 45 }));
            expect(result.status).toBe('ok');
            if (result.status !== 'ok') return;
            expect(result.sacRateLpm).toBeCloseTo(15.1515, 3);
        });
    });

    describe('missing: 任意項目が欠けているとき', () => {
        it('開始残圧のみ null のときは不足項目として列挙する', () => {
            expect(calcSacRate(buildInput({ pressureStartBar: null }))).toEqual({
                status: 'missing',
                missingFields: ['pressureStartBar'],
            });
        });

        it('複数不足はフィールド定義順に列挙する', () => {
            expect(calcSacRate(buildInput({ tankVolumeL: null, avgDepthM: null }))).toEqual({
                status: 'missing',
                missingFields: ['tankVolumeL', 'avgDepthM'],
            });
        });
    });

    describe('invalid: 計算が成立しないとき', () => {
        it('開始残圧 = 終了残圧（消費量 0）は invalid', () => {
            expect(calcSacRate(buildInput({ pressureStartBar: 100, pressureEndBar: 100 }))).toEqual({
                status: 'invalid',
            });
        });

        it('開始残圧 < 終了残圧（消費量が負）は invalid', () => {
            expect(calcSacRate(buildInput({ pressureStartBar: 80, pressureEndBar: 100 }))).toEqual({
                status: 'invalid',
            });
        });

        it('タンク容量 0 以下・潜水時間 0 以下は防御的に invalid', () => {
            expect(calcSacRate(buildInput({ tankVolumeL: 0 }))).toEqual({ status: 'invalid' });
            expect(calcSacRate(buildInput({ bottomTimeMin: 0 }))).toEqual({ status: 'invalid' });
        });
    });

    it('同一入力に対して常に同一の結果を返す（決定的）', () => {
        expect(calcSacRate(buildInput())).toEqual(calcSacRate(buildInput()));
    });
});

describe('formatSacRate', () => {
    it('小数第 1 位までの「L/分」形式にする', () => {
        expect(formatSacRate(15)).toBe('15.0 L/分');
        expect(formatSacRate(12.04)).toBe('12.0 L/分');
    });

    it('小数第 2 位以下は四捨五入する（15.1515… → 15.2）', () => {
        expect(formatSacRate(15.1515)).toBe('15.2 L/分');
    });
});

describe('SAC_INPUT_FIELD_LABELS', () => {
    it('任意 4 項目すべての日本語ラベル（既存 UI の項目名）を持つ', () => {
        expect(SAC_INPUT_FIELD_LABELS).toEqual({
            pressureStartBar: '開始残圧',
            pressureEndBar: '終了残圧',
            tankVolumeL: 'タンク容量',
            avgDepthM: '平均水深',
        });
    });
});
