import { describe, expect, it } from 'vitest';

import { parseSpecialtyTags } from './specialtyTags';

describe('parseSpecialtyTags', () => {
    it('カンマ区切りの文字列をタグ配列に変換する', () => {
        expect(parseSpecialtyTags('エンリッチド・エア, ディープ')).toEqual(['エンリッチド・エア', 'ディープ']);
    });

    it('全角読点（、）でも区切れる', () => {
        expect(parseSpecialtyTags('ナイトロックス、レック')).toEqual(['ナイトロックス', 'レック']);
    });

    it('前後の空白を trim する', () => {
        expect(parseSpecialtyTags('  ドライスーツ ,  ボート  ')).toEqual(['ドライスーツ', 'ボート']);
    });

    it('空要素は除外する', () => {
        expect(parseSpecialtyTags('ディープ,, ,ナビゲーション,')).toEqual(['ディープ', 'ナビゲーション']);
    });

    it('重複タグは 1 つにまとめる', () => {
        expect(parseSpecialtyTags('ディープ, ディープ')).toEqual(['ディープ']);
    });

    it('空文字列は空配列を返す', () => {
        expect(parseSpecialtyTags('')).toEqual([]);
    });

    it('空白のみは空配列を返す', () => {
        expect(parseSpecialtyTags('   ')).toEqual([]);
    });
});
