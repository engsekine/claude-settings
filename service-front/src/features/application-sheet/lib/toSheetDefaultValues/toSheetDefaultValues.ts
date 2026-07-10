import type { SheetFormValues, SheetPrefill } from '../../types';

/** null / 空文字を取り除き、値のあるキーだけ残す */
const compact = (entries: Partial<SheetFormValues>): Partial<SheetFormValues> =>
    Object.fromEntries(
        Object.entries(entries).filter(([, value]) => value !== null && value !== undefined && value !== ''),
    ) as Partial<SheetFormValues>;

/**
 * 自動入力データ（FR-007）を新規シートのフォーム初期値に変換する。
 * 未登録（null）の項目はキーごと省き、フォーム側のデフォルト（空欄）に任せる（FR-009）。
 * 保存済みシートを開く場合は sheetToFormValues でスナップショットをそのまま復元する。
 */
export const toSheetDefaultValues = (prefill: SheetPrefill | null): Partial<SheetFormValues> => {
    if (!prefill) return {};

    return compact({
        fullName: prefill.fullName ?? '',
        birthOn: prefill.birthOn ?? '',
        age: prefill.age !== null ? String(prefill.age) : '',
        gender: prefill.gender ?? '',
        heightCm: prefill.heightCm !== null ? String(prefill.heightCm) : '',
        weightKg: prefill.weightKg !== null ? String(prefill.weightKg) : '',
        licenseRank: prefill.licenseRank ?? '',
        diveCount: prefill.diveCount !== null ? String(prefill.diveCount) : '',
        lastDiveYearMonth: prefill.lastDiveYearMonth ?? '',
    });
};
