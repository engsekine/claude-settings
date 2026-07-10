import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getApplicationSheetPrefill } from './queries';

const createClient = vi.fn();

vi.mock('@/shared/lib/supabase/server', () => ({
    createClient: (...args: unknown[]) => createClient(...args),
}));

interface SupabaseMockOptions {
    user?: { id: string } | null;
    details?: {
        last_name: string;
        first_name: string;
        birth_on: string;
        gender: string;
        height_cm: number | null;
        weight_kg: number | null;
    } | null;
    certification?: { rank: string } | null;
    divesCount?: number;
    lastDiveDate?: string | null;
    profile?: Record<string, unknown> | null;
}

const buildSupabaseMock = (options: SupabaseMockOptions = {}) => {
    const {
        user = { id: 'user-1' },
        details = null,
        certification = null,
        divesCount = 0,
        lastDiveDate = null,
        profile = null,
    } = options;

    const divesEq = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
                data: lastDiveDate ? [{ dive_date: lastDiveDate }] : [],
                count: divesCount,
                error: null,
            }),
        }),
    });

    const from = vi.fn((table: string) => {
        if (table === 'user_details') {
            return {
                select: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: details, error: null }),
                }),
            };
        }
        if (table === 'certifications') {
            return {
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({ data: certification, error: null }),
                            }),
                        }),
                    }),
                }),
            };
        }
        if (table === 'dives') {
            return { select: vi.fn().mockReturnValue({ eq: divesEq }) };
        }
        if (table === 'application_profiles') {
            return {
                select: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
                }),
            };
        }
        throw new Error(`unexpected table: ${table}`);
    });

    const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
        from,
    };
    createClient.mockResolvedValue(supabase);
    return { from, divesEq };
};

describe('getApplicationSheetPrefill', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 年齢算出（JST 基準）を安定させるため現在時刻を固定する
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-07-10T12:00:00+09:00'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('登録済みデータを各項目にマッピングする（FR-007）', async () => {
        buildSupabaseMock({
            details: {
                last_name: '山田',
                first_name: '太郎',
                birth_on: '1990-05-03',
                gender: 'male',
                height_cm: 172.5,
                weight_kg: 65,
            },
            certification: { rank: 'Advanced Open Water Diver' },
            divesCount: 52,
            lastDiveDate: '2026-05-10',
        });

        const prefill = await getApplicationSheetPrefill();

        expect(prefill.fullName).toBe('山田 太郎');
        expect(prefill.birthOn).toBe('1990-05-03');
        expect(prefill.age).toBe(36);
        expect(prefill.gender).toBe('male');
        expect(prefill.heightCm).toBe(172.5);
        expect(prefill.weightKg).toBe(65);
        expect(prefill.licenseRank).toBe('Advanced Open Water Diver');
        expect(prefill.diveCount).toBe(52);
        expect(prefill.lastDiveYearMonth).toBe('2026-05');
    });

    it('誕生日前は満年齢が 1 歳下がる', async () => {
        buildSupabaseMock({
            details: {
                last_name: '山田',
                first_name: '太郎',
                birth_on: '1990-08-01',
                gender: 'male',
                height_cm: null,
                weight_kg: null,
            },
        });

        const prefill = await getApplicationSheetPrefill();

        expect(prefill.age).toBe(35);
    });

    it('gender が unanswered の場合は null（空欄扱い）になる', async () => {
        buildSupabaseMock({
            details: {
                last_name: '山田',
                first_name: '花子',
                birth_on: '1995-01-01',
                gender: 'unanswered',
                height_cm: null,
                weight_kg: null,
            },
        });

        const prefill = await getApplicationSheetPrefill();

        expect(prefill.gender).toBeNull();
        expect(prefill.heightCm).toBeNull();
        expect(prefill.weightKg).toBeNull();
    });

    it('各ソースが未登録なら null を返しエラーにならない（FR-009）', async () => {
        buildSupabaseMock({ details: null, certification: null, divesCount: 0, lastDiveDate: null });

        const prefill = await getApplicationSheetPrefill();

        expect(prefill).toEqual({
            fullName: null,
            birthOn: null,
            age: null,
            gender: null,
            heightCm: null,
            weightKg: null,
            licenseRank: null,
            diveCount: null,
            lastDiveYearMonth: null,
            savedProfile: null,
        });
    });

    it('保存済み application_profiles があれば camelCase で savedProfile に返す（FR-010）', async () => {
        buildSupabaseMock({
            profile: {
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
                created_at: '2026-07-01T00:00:00Z',
                updated_at: '2026-07-01T00:00:00Z',
            },
        });

        const prefill = await getApplicationSheetPrefill();

        expect(prefill.savedProfile).toEqual({
            phone: '090-1234-5678',
            emergencyContactRelation: '妻',
            emergencyContactPhone: '080-9876-5432',
            nearestStation: '横浜駅',
            footSizeCm: 26.5,
            hasIzuChibaExperience: true,
            hasBoatExperience: false,
            hasDrySuitExperience: null,
            drySuitDiveCount: 10,
            hasContactLens: true,
            contactLensType: 'soft',
            needsPrescriptionMask: false,
        });
    });

    it('公開読み取り RLS で他人のログを数えないよう dives は本人 user_id で絞る', async () => {
        const { divesEq } = buildSupabaseMock({ divesCount: 3, lastDiveDate: '2025-12-31' });

        const prefill = await getApplicationSheetPrefill();

        expect(divesEq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(prefill.diveCount).toBe(3);
        expect(prefill.lastDiveYearMonth).toBe('2025-12');
    });
});
