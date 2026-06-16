import { siteLabel } from './siteLabel';

describe('siteLabel', () => {
    it('エリアがあれば「エリア / 名称」を返す', () => {
        expect(siteLabel({ name: '大瀬崎', area: '伊豆' })).toBe('伊豆 / 大瀬崎');
    });

    it('エリアが null なら名称のみを返す', () => {
        expect(siteLabel({ name: '大瀬崎', area: null })).toBe('大瀬崎');
    });

    it('エリアが空白のみなら名称のみを返す', () => {
        expect(siteLabel({ name: '大瀬崎', area: '   ' })).toBe('大瀬崎');
    });

    it('名称・エリアの前後空白を整形する', () => {
        expect(siteLabel({ name: ' 大瀬崎 ', area: ' 伊豆 ' })).toBe('伊豆 / 大瀬崎');
    });
});
