import type { FormSelectOption } from '@/shared/components/form';

/** dives 由来の選択肢入力（feature 間 import を避けるため構造的型で受ける） */
interface DiveOptionInput {
    id: string;
    /** ダイブ日（YYYY-MM-DD） */
    diveDate: string;
    location: string;
}

const formatDate = (isoDate: string): string => {
    const [y, m, d] = isoDate.split('-');
    return `${y}/${m}/${d}`;
};

/** 取得ダイブセレクト用に「YYYY/MM/DD ポイント名」のラベルへ変換する */
export const toDiveSelectOptions = (dives: DiveOptionInput[]): FormSelectOption[] =>
    dives.map((dive) => ({ value: dive.id, label: `${formatDate(dive.diveDate)} ${dive.location}` }));
