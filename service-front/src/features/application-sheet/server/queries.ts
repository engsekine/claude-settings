import 'server-only';

import { todayInJst } from '@/shared/lib/date';
import { createClient } from '@/shared/lib/supabase/server';

import { mapSavedApplicationProfile, type SheetPrefill } from '../types';

const EMPTY_PREFILL: SheetPrefill = {
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
};

/** 生年月日（YYYY-MM-DD）から JST 基準の満年齢を算出する */
const calculateAge = (birthOn: string, today: string): number => {
    const [birthYear, birthMonth, birthDay] = birthOn.split('-').map(Number);
    const [thisYear, thisMonth, thisDay] = today.split('-').map(Number);
    if (!birthYear || !birthMonth || !birthDay || !thisYear || !thisMonth || !thisDay) return 0;

    const hasHadBirthdayThisYear = thisMonth > birthMonth || (thisMonth === birthMonth && thisDay >= birthDay);
    return thisYear - birthYear - (hasHadBirthdayThisYear ? 0 : 1);
};

/** gender は `unanswered` を空欄扱い（null）に落とす */
const toPrefillGender = (gender: string): SheetPrefill['gender'] => {
    if (gender === 'male' || gender === 'female') return gender;
    return null;
};

/**
 * 申し込みシートの自動入力データを取得する（FR-007）。
 * user_details / certifications / dives を並列参照し、未登録のソースは null を返す（FR-009）。
 */
export const getApplicationSheetPrefill = async (): Promise<SheetPrefill> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    // 認証は proxy.ts で担保されるが、未認証時も安全に空を返す
    if (!user) return EMPTY_PREFILL;

    const [detailsResult, certificationResult, divesResult, profileResult] = await Promise.all([
        supabase
            .from('user_details')
            .select('last_name, first_name, birth_on, gender, height_cm, weight_kg')
            .maybeSingle(),
        // 複数保有時は取得日降順の先頭 1 件（research.md Decision 1）
        supabase
            .from('certifications')
            .select('rank')
            .order('acquired_on', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        // 公開読み取り RLS で他人の公開ログを数えないよう本人に限定する
        supabase
            .from('dives')
            .select('dive_date', { count: 'exact' })
            .eq('user_id', user.id)
            .order('dive_date', { ascending: false })
            .limit(1),
        // 保存済みの手入力項目（RLS で本人の 1 件のみ・FR-010）
        supabase
            .from('application_profiles')
            .select(
                'user_id, phone, emergency_contact_relation, emergency_contact_phone, nearest_station, foot_size_cm, has_izu_chiba_experience, has_boat_experience, has_dry_suit_experience, dry_suit_dive_count, has_contact_lens, contact_lens_type, needs_prescription_mask, created_at, updated_at',
            )
            .maybeSingle(),
    ]);

    if (detailsResult.error) {
        throw new Error(`[getApplicationSheetPrefill] supabase error: ${detailsResult.error.message}`);
    }
    if (certificationResult.error) {
        throw new Error(`[getApplicationSheetPrefill] supabase error: ${certificationResult.error.message}`);
    }
    if (divesResult.error) {
        throw new Error(`[getApplicationSheetPrefill] supabase error: ${divesResult.error.message}`);
    }
    if (profileResult.error) {
        throw new Error(`[getApplicationSheetPrefill] supabase error: ${profileResult.error.message}`);
    }

    const details = detailsResult.data;
    const diveCount = divesResult.count ?? 0;
    const lastDiveDate = divesResult.data?.[0]?.dive_date ?? null;

    return {
        fullName: details ? `${details.last_name} ${details.first_name}` : null,
        birthOn: details?.birth_on ?? null,
        age: details ? calculateAge(details.birth_on, todayInJst()) : null,
        gender: details ? toPrefillGender(details.gender) : null,
        heightCm: details?.height_cm ?? null,
        weightKg: details?.weight_kg ?? null,
        licenseRank: certificationResult.data?.rank ?? null,
        // ログ 0 件は空欄扱い（spec Edge Cases）
        diveCount: diveCount > 0 ? diveCount : null,
        lastDiveYearMonth: lastDiveDate ? lastDiveDate.slice(0, 7) : null,
        savedProfile: profileResult.data ? mapSavedApplicationProfile(profileResult.data) : null,
    };
};
