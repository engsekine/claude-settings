import { type ProfileRow, toProfile, toUserDetailsUpdate } from './profile';

const baseRow: ProfileRow = {
    last_name: '田中',
    first_name: '太郎',
    last_name_romaji: 'Tanaka',
    first_name_romaji: 'Taro',
    nickname: 'タロー',
    birth_on: '1990-01-01',
    gender: 'male',
    height_cm: 170.5,
    weight_kg: 65.2,
};

describe('toProfile', () => {
    it('snake_case の Row を camelCase のドメイン型に変換する', () => {
        expect(toProfile(baseRow, 'test@example.com')).toEqual({
            email: 'test@example.com',
            lastName: '田中',
            firstName: '太郎',
            lastNameRomaji: 'Tanaka',
            firstNameRomaji: 'Taro',
            nickname: 'タロー',
            birthOn: '1990-01-01',
            gender: 'male',
            heightCm: 170.5,
            weightKg: 65.2,
        });
    });

    it('height_cm / weight_kg が null ならそのまま null を保持する', () => {
        const row: ProfileRow = { ...baseRow, height_cm: null, weight_kg: null };
        const result = toProfile(row, 'test@example.com');

        expect(result.heightCm).toBeNull();
        expect(result.weightKg).toBeNull();
    });

    it('height_cm / weight_kg が数値ならそのまま数値で返す', () => {
        const row: ProfileRow = { ...baseRow, height_cm: 180, weight_kg: 70 };
        const result = toProfile(row, 'test@example.com');

        expect(result.heightCm).toBe(180);
        expect(result.weightKg).toBe(70);
    });
});

describe('toUserDetailsUpdate', () => {
    it('camelCase の入力を snake_case の DB ペイロードに変換する', () => {
        expect(
            toUserDetailsUpdate({
                lastName: '佐藤',
                firstName: '花子',
                lastNameRomaji: 'Sato',
                firstNameRomaji: 'Hanako',
                nickname: 'はな',
                birthOn: '1995-05-05',
                gender: 'female',
                heightCm: 160,
                weightKg: 50,
            }),
        ).toEqual({
            last_name: '佐藤',
            first_name: '花子',
            last_name_romaji: 'Sato',
            first_name_romaji: 'Hanako',
            nickname: 'はな',
            birth_on: '1995-05-05',
            gender: 'female',
            height_cm: 160,
            weight_kg: 50,
        });
    });

    it('heightCm / weightKg が null ならそのまま null を渡す', () => {
        const result = toUserDetailsUpdate({
            lastName: '佐藤',
            firstName: '花子',
            lastNameRomaji: 'Sato',
            firstNameRomaji: 'Hanako',
            nickname: 'はな',
            birthOn: '1995-05-05',
            gender: 'unanswered',
            heightCm: null,
            weightKg: null,
        });

        expect(result.height_cm).toBeNull();
        expect(result.weight_kg).toBeNull();
    });
});
