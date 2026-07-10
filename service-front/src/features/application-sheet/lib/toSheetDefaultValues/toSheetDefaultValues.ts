import type { SheetFormValues, SheetPrefill, YesNoValue } from '../../types';

/** boolean | null（DB 値）→ 有無ラジオの値。null は未選択 */
const toYesNoValue = (value: boolean | null): YesNoValue => {
    if (value === true) return 'yes';
    if (value === false) return 'no';
    return '';
};

/** null / 空文字を取り除き、値のあるキーだけ残す */
const compact = (entries: Partial<SheetFormValues>): Partial<SheetFormValues> =>
    Object.fromEntries(
        Object.entries(entries).filter(([, value]) => value !== null && value !== undefined && value !== ''),
    ) as Partial<SheetFormValues>;

/**
 * 自動入力データ（FR-007）と保存済みプロフィール（FR-010）をフォームの初期値に変換する。
 * 未登録（null）の項目はキーごと省き、フォーム側のデフォルト（空欄）に任せる（FR-009）。
 */
export const toSheetDefaultValues = (prefill: SheetPrefill | null): Partial<SheetFormValues> => {
    if (!prefill) return {};

    const prefillValues = compact({
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

    const saved = prefill.savedProfile;
    if (!saved) return prefillValues;

    // 保存済みの手入力項目を復元する（レンタル選択・省略トグルは保存対象外・FR-010）
    const savedValues = compact({
        phone: saved.phone,
        emergencyContactRelation: saved.emergencyContactRelation,
        emergencyContactPhone: saved.emergencyContactPhone,
        nearestStation: saved.nearestStation,
        footSizeCm: saved.footSizeCm !== null ? String(saved.footSizeCm) : '',
        hasIzuChibaExperience: toYesNoValue(saved.hasIzuChibaExperience),
        hasBoatExperience: toYesNoValue(saved.hasBoatExperience),
        hasDrySuitExperience: toYesNoValue(saved.hasDrySuitExperience),
        drySuitDiveCount: saved.drySuitDiveCount !== null ? String(saved.drySuitDiveCount) : '',
        hasContactLens: toYesNoValue(saved.hasContactLens),
        contactLensType: saved.contactLensType ?? '',
        needsPrescriptionMask: toYesNoValue(saved.needsPrescriptionMask),
    });

    return { ...prefillValues, ...savedValues };
};
