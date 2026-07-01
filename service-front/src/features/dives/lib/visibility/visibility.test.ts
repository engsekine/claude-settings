import { describe, expect, it } from 'vitest';

import { generatePublicSlug, resolvePublicSlug } from './visibility';

describe('generatePublicSlug', () => {
    it('16 桁の小文字 16 進文字列を返す', () => {
        const slug = generatePublicSlug();
        expect(slug).toMatch(/^[0-9a-f]{16}$/);
    });

    it('呼ぶたびに異なる値を返す', () => {
        expect(generatePublicSlug()).not.toBe(generatePublicSlug());
    });
});

describe('resolvePublicSlug', () => {
    it('既存 slug があればそれを維持する（再公開で同一 URL）', () => {
        expect(resolvePublicSlug('abc123')).toBe('abc123');
    });

    it('既存 slug が無ければ新規生成する', () => {
        const slug = resolvePublicSlug(null);
        expect(slug).toMatch(/^[0-9a-f]{16}$/);
    });
});
