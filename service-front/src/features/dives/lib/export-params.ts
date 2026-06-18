// エクスポートの URL クエリ解析（純粋関数）。Route Handler から使う。
// 契約は specs/014-log-export/contracts/export-endpoint.md を参照。
import { parseDiveFilter } from '@/features/dives/lib/search-params';
import type { DiveListFilter } from '@/features/dives/types';

export type ExportFormat = 'csv' | 'pdf';

/** 一度に ids 指定できる最大件数（URL 長・生成負荷の上限） */
export const EXPORT_MAX_IDS = 500;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ExportParamsOk {
    ok: true;
    format: ExportFormat;
    /** 出力対象 ID。null のときはフィルタ経路（全件 or 一覧条件） */
    ids: string[] | null;
    /** ids 未指定時に適用する絞り込み（機能 013 と同一） */
    filter: DiveListFilter;
}

export interface ExportParamsError {
    ok: false;
    error: string;
}

export type ExportParamsResult = ExportParamsOk | ExportParamsError;

const isExportFormat = (value: string | null): value is ExportFormat => value === 'csv' || value === 'pdf';

/**
 * URL クエリ → エクスポート指定。
 * - `format` は csv / pdf のみ（不正は error）
 * - `ids` 指定時はフィルタより優先（UUID 形式・最大 EXPORT_MAX_IDS 件を検証、不正は error）
 * - `ids` 未指定（空含む）はフィルタ経路として `parseDiveFilter` の結果を返す
 */
export const parseExportParams = (params: URLSearchParams): ExportParamsResult => {
    const format = params.get('format');
    if (!isExportFormat(format)) {
        return { ok: false, error: 'format は csv または pdf を指定してください' };
    }

    const filter = parseDiveFilter(params);

    const rawIds = params.get('ids');
    if (rawIds === null || rawIds.trim() === '') {
        return { ok: true, format, ids: null, filter };
    }

    const ids = rawIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

    if (ids.length === 0) {
        return { ok: true, format, ids: null, filter };
    }
    if (ids.length > EXPORT_MAX_IDS) {
        return { ok: false, error: `一度にエクスポートできるのは ${EXPORT_MAX_IDS} 件までです` };
    }
    if (!ids.every((id) => UUID_PATTERN.test(id))) {
        return { ok: false, error: 'ids に不正な値が含まれています' };
    }

    return { ok: true, format, ids, filter };
};
