import { describe, expect, it } from 'vitest';

import type { SheetPrefill } from '../../types';
import { toSheetDefaultValues } from './toSheetDefaultValues';

const emptyPrefill: SheetPrefill = {
    fullName: null,
    birthOn: null,
    age: null,
    gender: null,
    heightCm: null,
    weightKg: null,
    licenseRank: null,
    diveCount: null,
    lastDiveYearMonth: null,
};

describe('toSheetDefaultValues', () => {
    it('自動入力値をフォーム初期値（文字列）へ変換する（FR-007）', () => {
        const defaults = toSheetDefaultValues({
            ...emptyPrefill,
            fullName: '山田 太郎',
            birthOn: '1990-05-03',
            age: 36,
            gender: 'male',
            heightCm: 172.5,
            weightKg: 65,
            licenseRank: 'Advanced Open Water Diver',
            diveCount: 52,
            lastDiveYearMonth: '2026-05',
        });

        expect(defaults).toEqual({
            fullName: '山田 太郎',
            birthOn: '1990-05-03',
            age: '36',
            gender: 'male',
            heightCm: '172.5',
            weightKg: '65',
            licenseRank: 'Advanced Open Water Diver',
            diveCount: '52',
            lastDiveYearMonth: '2026-05',
        });
    });

    it('未登録（null）の項目は初期値に含めない（FR-009）', () => {
        expect(toSheetDefaultValues(emptyPrefill)).toEqual({});
    });

    it('prefill が null でも空の初期値を返す', () => {
        expect(toSheetDefaultValues(null)).toEqual({});
    });
});
