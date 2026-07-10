import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SheetFormValues } from '../types';
import { saveApplicationProfile } from './actions';

const revalidatePath = vi.fn();
const createClient = vi.fn();

vi.mock('next/cache', () => ({
    revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock('@/shared/lib/supabase/server', () => ({
    createClient: (...args: unknown[]) => createClient(...args),
}));

interface SupabaseMockOptions {
    user?: { id: string } | null;
    upsertError?: { code?: string; message: string } | null;
}

const buildSupabaseMock = (options: SupabaseMockOptions = {}) => {
    const { user = { id: 'user-1' }, upsertError = null } = options;

    const upsert = vi.fn().mockResolvedValue({ error: upsertError });
    const from = vi.fn().mockReturnValue({ upsert });
    const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
        from,
    };
    createClient.mockResolvedValue(supabase);
    return { from, upsert };
};

const validInput: SheetFormValues = {
    fullName: '山田 太郎',
    age: '36',
    birthOn: '1990-05-03',
    gender: 'male',
    phone: '090-1234-5678',
    emergencyContactRelation: '妻',
    emergencyContactPhone: '080-9876-5432',
    nearestStation: '横浜駅',
    licenseRank: 'Open Water Diver',
    diveCount: '52',
    hasIzuChibaExperience: 'yes',
    hasBoatExperience: 'no',
    lastDiveYearMonth: '2026-05',
    hasDrySuitExperience: '',
    drySuitDiveCount: '10',
    hasRental: 'yes',
    rentalItems: ['wetSuitFullSet', 'fin'],
    omitRentalBlock: true,
    heightCm: '172.5',
    weightKg: '65',
    footSizeCm: '26.5',
    hasContactLens: 'yes',
    contactLensType: 'soft',
    needsPrescriptionMask: 'no',
};

describe('saveApplicationProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('本人 user_id で個人属性を upsert する（FR-010）', async () => {
        const { from, upsert } = buildSupabaseMock();

        const result = await saveApplicationProfile(validInput);

        expect(result).toEqual({ success: true });
        expect(from).toHaveBeenCalledWith('application_profiles');
        expect(upsert).toHaveBeenCalledWith({
            user_id: 'user-1',
            phone: '090-1234-5678',
            emergency_contact_relation: '妻',
            emergency_contact_phone: '080-9876-5432',
            nearest_station: '横浜駅',
            foot_size_cm: 26.5,
            has_izu_chiba_experience: true,
            has_boat_experience: false,
            has_dry_suit_experience: null,
            dry_suit_dive_count: 10,
            has_contact_lens: true,
            contact_lens_type: 'soft',
            needs_prescription_mask: false,
        });
    });

    it('レンタル選択・トグル・自動入力系の項目は保存対象に含めない（FR-010）', async () => {
        const { upsert } = buildSupabaseMock();

        await saveApplicationProfile(validInput);

        const savedRow = upsert.mock.calls[0]?.[0] as Record<string, unknown>;
        for (const excludedKey of [
            'full_name',
            'age',
            'birth_on',
            'gender',
            'height_cm',
            'weight_kg',
            'license_rank',
            'dive_count',
            'last_dive_year_month',
            'has_rental',
            'rental_items',
            'omit_rental_block',
        ]) {
            expect(savedRow).not.toHaveProperty(excludedKey);
        }
    });

    it('未入力の任意項目は null / 空文字で保存される', async () => {
        const { upsert } = buildSupabaseMock();

        await saveApplicationProfile({
            ...validInput,
            footSizeCm: '',
            drySuitDiveCount: '',
            contactLensType: '',
            hasContactLens: '',
        });

        expect(upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                foot_size_cm: null,
                dry_suit_dive_count: null,
                contact_lens_type: null,
                has_contact_lens: null,
            }),
        );
    });

    it('不正な入力はエラーを返し upsert しない', async () => {
        const { upsert } = buildSupabaseMock();

        const result = await saveApplicationProfile({ ...validInput, phone: '090-abcd' });

        expect(result).toEqual({ success: false, error: '携帯電話は数字とハイフンで入力してください' });
        expect(upsert).not.toHaveBeenCalled();
    });

    it('未ログインなら失敗を返す', async () => {
        const { upsert } = buildSupabaseMock({ user: null });

        const result = await saveApplicationProfile(validInput);

        expect(result).toEqual({ success: false, error: 'ログインが必要です' });
        expect(upsert).not.toHaveBeenCalled();
    });

    it('DB エラー時は失敗を返し、ログに個人情報の値を含めない', async () => {
        buildSupabaseMock({ upsertError: { message: 'db error' } });

        const result = await saveApplicationProfile(validInput);

        expect(result).toEqual({ success: false, error: '保存に失敗しました。時間をおいて再度お試しください' });

        const loggedText = vi
            .mocked(console.error)
            .mock.calls.flat()
            .map((arg) => JSON.stringify(arg) ?? String(arg))
            .join(' ');
        expect(loggedText).not.toContain('090-1234-5678');
        expect(loggedText).not.toContain('080-9876-5432');
        expect(loggedText).not.toContain('横浜駅');
    });
});
