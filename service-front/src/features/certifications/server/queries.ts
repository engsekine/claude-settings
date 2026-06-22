import 'server-only';

import { type Certification, type CertificationDive, mapCertification } from '@/features/certifications/types';
import { createClient } from '@/shared/lib/supabase/server';

/** 一覧・1 件取得で共通の select 句（タグ + 取得ダイブ + そのダイブサイトを join） */
const CERTIFICATION_SELECT =
    '*, certification_tags(tag), dive:dives(id, dive_date, location, dive_site:dive_sites(name, area))';

/** 子テーブル certification_tags の行をタグ名の昇順の配列に変換する */
const toSortedTags = (tagRows: { tag: string }[]): string[] => tagRows.map((row) => row.tag).sort();

/** join した dives 行を表示用サマリーに変換する。サイト参照ダイブは location が null のため名称をマスタから解決する */
const toDive = (
    dive: {
        id: string;
        dive_date: string;
        location: string | null;
        dive_site: { name: string; area: string | null } | null;
    } | null,
): CertificationDive | null => {
    if (!dive) return null;
    const site = dive.dive_site;
    const location = site ? (site.area ? `${site.area} / ${site.name}` : site.name) : (dive.location ?? '');
    return { id: dive.id, diveDate: dive.dive_date, location };
};

/** 自分の保有資格一覧（取得日の新しい順、同日取得は登録日時の新しい順）（FR-006） */
export const getCertifications = async (): Promise<Certification[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('certifications')
        .select(CERTIFICATION_SELECT)
        .order('acquired_on', { ascending: false })
        .order('created_at', { ascending: false });

    if (error || !data) {
        throw new Error(`[getCertifications] supabase error: ${error?.message ?? 'no data'}`);
    }

    return data.map(({ certification_tags: tagRows, dive, ...row }) =>
        mapCertification(row, toSortedTags(tagRows), toDive(dive)),
    );
};

/** 自分の保有資格を 1 件取得。データなし（RLS 含む）は null（404 セマンティクス） */
export const getCertificationById = async (id: string): Promise<Certification | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('certifications')
        .select(CERTIFICATION_SELECT)
        .eq('id', id)
        .maybeSingle();

    if (error) {
        throw new Error(`[getCertificationById] supabase error: ${error.message}`);
    }
    if (!data) return null;

    const { certification_tags: tagRows, dive, ...row } = data;
    return mapCertification(row, toSortedTags(tagRows), toDive(dive));
};
