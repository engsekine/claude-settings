import { describe, expect, it } from 'vitest';

import { CURRENT_TERMS_VERSION } from '@/shared/constants/terms';

import type { CompleteProfileInput } from '../actions';
import { toUserDetailsInsert } from './profile-completion';

const input: CompleteProfileInput = {
    lastName: '山田',
    firstName: '太郎',
    lastNameRomaji: 'Yamada',
    firstNameRomaji: 'Taro',
    nickname: 'たろちゃん',
    birthOn: '1990-01-01',
    gender: 'male',
    heightCm: 170.5,
    weightKg: 65,
    agreedToTerms: true,
};

describe('toUserDetailsInsert', () => {
    it('user_id を付与し camelCase を snake_case の INSERT ペイロードに変換する', () => {
        expect(toUserDetailsInsert('user-1', input)).toEqual(
            expect.objectContaining({
                user_id: 'user-1',
                last_name: '山田',
                first_name: '太郎',
                last_name_romaji: 'Yamada',
                first_name_romaji: 'Taro',
                nickname: 'たろちゃん',
                birth_on: '1990-01-01',
                gender: 'male',
                height_cm: 170.5,
                weight_kg: 65,
            }),
        );
    });

    it('利用規約の同意情報（terms_version / terms_agreed_at）を両方セットする（018）', () => {
        const result = toUserDetailsInsert('user-1', input);
        expect(result.terms_version).toBe(CURRENT_TERMS_VERSION);
        expect(typeof result.terms_agreed_at).toBe('string');
    });

    it('身長・体重が null の場合もそのまま null を保持する', () => {
        const result = toUserDetailsInsert('user-1', { ...input, heightCm: null, weightKg: null });
        expect(result.height_cm).toBeNull();
        expect(result.weight_kg).toBeNull();
    });
});
