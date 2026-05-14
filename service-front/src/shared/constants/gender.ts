/** 性別の取りうる値（DB の CHECK 制約と一致させる） */
export const GENDER_VALUES = ['male', 'female', 'unanswered'] as const;

export type Gender = (typeof GENDER_VALUES)[number];

/** 画面表示用ラベル */
export const GENDER_LABELS: Record<Gender, string> = {
    male: '男性',
    female: '女性',
    unanswered: '未回答',
};

/** ラジオボタン描画用の順序付きオプション */
export const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; label: string }> = [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'unanswered', label: '未回答' },
];

/** 未選択時のデフォルト値 */
export const DEFAULT_GENDER: Gender = 'unanswered';
