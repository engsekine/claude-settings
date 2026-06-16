import { diveLocationLabel } from './diveLabel';

describe('diveLocationLabel', () => {
    it('サイト参照があれば「エリア / 名称」を返す', () => {
        expect(
            diveLocationLabel({ location: null, diveSite: { id: '1', name: '大瀬崎', area: '伊豆' } }),
        ).toBe('伊豆 / 大瀬崎');
    });

    it('サイト参照でエリアが null なら名称のみ', () => {
        expect(diveLocationLabel({ location: null, diveSite: { id: '1', name: '大瀬崎', area: null } })).toBe('大瀬崎');
    });

    it('サイト参照が無ければ自由入力のポイント名を返す', () => {
        expect(diveLocationLabel({ location: '秘密のポイント', diveSite: null })).toBe('秘密のポイント');
    });

    it('どちらも無ければ空文字を返す', () => {
        expect(diveLocationLabel({ location: null, diveSite: null })).toBe('');
    });
});
