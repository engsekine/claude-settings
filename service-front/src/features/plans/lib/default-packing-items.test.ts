import { describe, expect, it } from 'vitest';

import { PACKING_ITEM_NAME_MAX_LENGTH } from '@/features/plans/constants';

import { DEFAULT_PACKING_ITEMS } from './default-packing-items';

describe('DEFAULT_PACKING_ITEMS', () => {
    it('10 項目以上ある（SC-005: 手入力なしで使い始められる）', () => {
        expect(DEFAULT_PACKING_ITEMS.length).toBeGreaterThanOrEqual(10);
    });

    it('全項目が名称の文字数制約内に収まる', () => {
        for (const name of DEFAULT_PACKING_ITEMS) {
            expect(name.length).toBeGreaterThanOrEqual(1);
            expect(name.length).toBeLessThanOrEqual(PACKING_ITEM_NAME_MAX_LENGTH);
        }
    });

    it('項目名に重複がない', () => {
        expect(new Set(DEFAULT_PACKING_ITEMS).size).toBe(DEFAULT_PACKING_ITEMS.length);
    });
});
