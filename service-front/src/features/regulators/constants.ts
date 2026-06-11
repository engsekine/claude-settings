/** メーカー名の最大文字数（DB CHECK 制約と同期） */
export const REGULATOR_BRAND_MAX_LENGTH = 60;

/** モデル名の最大文字数（DB CHECK 制約と同期） */
export const REGULATOR_MODEL_MAX_LENGTH = 80;

/** メモの最大文字数（DB CHECK 制約と同期） */
export const REGULATOR_NOTES_MAX_LENGTH = 500;

/** OH 推奨周期（月）の範囲とデフォルト */
export const OVERHAUL_INTERVAL_MONTHS = { min: 1, max: 120, default: 12 } as const;

/** OH 推奨周期（本数）の範囲とデフォルト */
export const OVERHAUL_INTERVAL_DIVES = { min: 1, max: 1000, default: 100 } as const;
