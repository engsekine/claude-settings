import 'server-only';

import { todayInJst } from '@/shared/lib/date';
import { createClient } from '@/shared/lib/supabase/server';

import { sheetToFormValues } from '../lib/sheetToFormValues';
import type { SavedApplicationSheet, SavedSheetSummary, SheetPrefill } from '../types';

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
 * 新規シートの初期値にのみ使う（保存済みシートは getApplicationSheet でスナップショットを復元）。
 */
export const getApplicationSheetPrefill = async (): Promise<SheetPrefill> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    // 認証は proxy.ts で担保されるが、未認証時も安全に空を返す
    if (!user) return EMPTY_PREFILL;

    const [detailsResult, certificationResult, divesResult] = await Promise.all([
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
    };
};

/** 保存済みシートの一覧（本人分のみ・更新日時の降順） */
export const listApplicationSheets = async (): Promise<SavedSheetSummary[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('application_sheets')
        .select('id, name, updated_at')
        .order('updated_at', { ascending: false });

    if (error || !data) {
        throw new Error(`[listApplicationSheets] supabase error: ${error?.message ?? 'no data'}`);
    }

    return data.map((row) => ({ id: row.id, name: row.name, updatedAt: row.updated_at }));
};

/** UUID 形式の簡易チェック（URL 直打ちの不正値で DB エラーにしない） */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 保存済みシート 1 件をフォーム値のスナップショットとして取得する（RLS で本人分のみ・無ければ null） */
export const getApplicationSheet = async (sheetId: string): Promise<SavedApplicationSheet | null> => {
    if (!UUID_PATTERN.test(sheetId)) return null;

    const supabase = await createClient();

    const { data, error } = await supabase.from('application_sheets').select('*').eq('id', sheetId).maybeSingle();

    if (error) {
        throw new Error(`[getApplicationSheet] supabase error: ${error.message}`);
    }
    if (!data) return null;

    return { id: data.id, name: data.name, values: sheetToFormValues(data) };
};
