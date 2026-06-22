import 'server-only';

import { DIVE_SITE_JOIN, type DiveRowWithSite, mapDive } from '@/features/dives/lib/dive-mapper';
import { diveLocationLabel } from '@/features/dives/lib/diveLabel';
import { fetchDiveListPage } from '@/features/dives/lib/list-query';
import type { Dive, DiveCursor, DiveListFilter, DiveListPage } from '@/features/dives/types';
import { createClient } from '@/shared/lib/supabase/server';

export interface ListDivesOptions {
    filter?: DiveListFilter;
    cursor?: DiveCursor;
    limit?: number;
}

/**
 * 自分の dives を日付降順で取得。
 * キーセットページネーション（(dive_date, id) の複合カーソル）対応。
 * Supabase エラー時は throw し、Next.js の error.tsx に委ねる。
 */
export const listDives = async (options: ListDivesOptions = {}): Promise<DiveListPage> => {
    const supabase = await createClient();
    return fetchDiveListPage(supabase, options);
};

/**
 * 自分の dives の中で最大の dive_number を取得する。
 * 一度も dive_number を入力していない / ログがない場合は null を返す。
 * 新規作成画面で「前回の番号 + 1」を初期値として提示するために使う。
 */
export const getLatestDiveNumber = async (): Promise<number | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('dives')
        .select('dive_number')
        .not('dive_number', 'is', null)
        .order('dive_number', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw new Error(`dive_number の取得に失敗しました: ${error.message}`);

    return data?.dive_number ?? null;
};

/** 自分の dive を 1 件取得。データなし（RLS により他人のレコードを含む）は null を返す */
export const getDive = async (id: string): Promise<Dive | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase.from('dives').select(`*, ${DIVE_SITE_JOIN}`).eq('id', id).maybeSingle();

    if (error) throw new Error(`dive の取得に失敗しました: ${error.message}`);
    if (!data) return null;

    return mapDive(data as unknown as DiveRowWithSite);
};

/** 他機能からの紐づけ選択用に最小限の項目だけ持つダイブの要約 */
export interface DiveOption {
    id: string;
    /** ダイブ日（YYYY-MM-DD） */
    diveDate: string;
    location: string;
}

/**
 * 自分の全 dives を選択肢用に日付降順で取得する（id / 日付 / ポイント名のみ）。
 * 資格の「取得ダイブ」セレクトなど、他機能がページ層で合成して使う想定
 */
export const listDiveOptions = async (): Promise<DiveOption[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('dives')
        .select(`id, dive_date, location, ${DIVE_SITE_JOIN}`)
        .order('dive_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error || !data) {
        throw new Error(`[listDiveOptions] supabase error: ${error?.message ?? 'no data'}`);
    }

    // サイト参照ログは location が null のため、表示名はマスタから解決する
    return (data as unknown as Array<{ id: string; dive_date: string } & DiveRowWithSite>).map((row) => ({
        id: row.id,
        diveDate: row.dive_date,
        location: diveLocationLabel({ location: row.location, diveSite: row.dive_site }),
    }));
};
