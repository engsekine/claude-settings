/** dive_type の選択肢 */
export const DIVE_TYPE_OPTIONS = [
    { value: 'boat', label: 'ボート' },
    { value: 'beach', label: 'ビーチ' },
    { value: 'drift', label: 'ドリフト' },
    { value: 'night', label: 'ナイト' },
    { value: 'deep', label: 'ディープ' },
    { value: 'wreck', label: 'レック' },
    { value: 'cave', label: 'ケーブ' },
    { value: 'training', label: '講習' },
    { value: 'other', label: 'その他' },
] as const;

/** gas_type の選択肢 */
export const GAS_TYPE_OPTIONS = [
    { value: 'air', label: 'Air' },
    { value: 'nitrox', label: 'Nitrox' },
    { value: 'trimix', label: 'Trimix' },
    { value: 'other', label: 'その他' },
] as const;

/** suit_type の選択肢 */
export const SUIT_TYPE_OPTIONS = [
    { value: 'wetsuit_3mm', label: 'ウェット 3mm' },
    { value: 'wetsuit_5mm', label: 'ウェット 5mm' },
    { value: 'wetsuit_7mm', label: 'ウェット 7mm' },
    { value: 'drysuit', label: 'ドライ' },
    { value: 'skin', label: 'スキン' },
    { value: 'other', label: 'その他' },
] as const;

/** 一覧 1 ページあたりの件数 */
export const DIVE_PAGE_SIZE = 20;
