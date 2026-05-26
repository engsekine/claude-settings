import * as yup from 'yup';

/** 空文字 / null / undefined を null に、それ以外は yup の number 変換結果を返す */
const optionalNumber = (value: number, originalValue: unknown): number | null => {
    if (originalValue === '' || originalValue == null) return null;
    return value;
};

/** YYYY-MM-DD の日付文字列が 1900-01-01 〜 当日の範囲内かチェック */
const isDiveDateValid = (value: string | undefined): boolean => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date >= new Date('1900-01-01') && date <= new Date();
};

const optionalTime = yup
    .string()
    .transform((value) => (value === '' || value == null ? null : value))
    .nullable()
    .matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'HH:MM 形式で入力してください', excludeEmptyString: true })
    .default(null);

export const diveSchema = yup.object({
    diveNumber: yup
        .number()
        .typeError('ダイブ番号は数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .integer('ダイブ番号は整数で入力してください')
        .min(0, 'ダイブ番号は0以上で入力してください')
        .default(null),
    diveDate: yup
        .string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, '正しい日付を入力してください')
        .test('valid-range', '正しい日付を入力してください', isDiveDateValid)
        .required('潜水日を入力してください'),
    entryTime: optionalTime,
    exitTime: optionalTime,
    location: yup
        .string()
        .trim()
        .min(1, 'エリア / ポイント名を入力してください')
        .max(120, 'エリア / ポイント名は120文字以内で入力してください')
        .required('エリア / ポイント名を入力してください'),
    country: yup.string().trim().max(60).transform((v) => (v === '' ? null : v)).nullable().default(null),
    diveSite: yup.string().trim().max(120).transform((v) => (v === '' ? null : v)).nullable().default(null),
    diveType: yup.string().trim().max(40).transform((v) => (v === '' ? null : v)).nullable().default(null),
    weather: yup.string().trim().max(60).transform((v) => (v === '' ? null : v)).nullable().default(null),
    airTempC: yup
        .number()
        .typeError('気温は数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .min(-30, '気温は-30℃以上で入力してください')
        .max(60, '気温は60℃以下で入力してください')
        .default(null),
    waterTempC: yup
        .number()
        .typeError('水温は数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .min(-5, '水温は-5℃以上で入力してください')
        .max(45, '水温は45℃以下で入力してください')
        .default(null),
    visibilityM: yup
        .number()
        .typeError('透明度は数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .min(0, '透明度は0m以上で入力してください')
        .max(100, '透明度は100m以下で入力してください')
        .default(null),
    wave: yup.string().trim().max(60).transform((v) => (v === '' ? null : v)).nullable().default(null),
    currentCondition: yup.string().trim().max(60).transform((v) => (v === '' ? null : v)).nullable().default(null),
    maxDepthM: yup
        .number()
        .typeError('最大水深は数値で入力してください')
        .positive('最大水深は0より大きい値を入力してください')
        .max(300, '最大水深は300m以下で入力してください')
        .required('最大水深を入力してください'),
    avgDepthM: yup
        .number()
        .typeError('平均水深は数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .positive('平均水深は0より大きい値を入力してください')
        .max(300, '平均水深は300m以下で入力してください')
        .default(null),
    bottomTimeMin: yup
        .number()
        .typeError('潜水時間は数値で入力してください')
        .integer('潜水時間は整数で入力してください')
        .min(1, '潜水時間は1分以上で入力してください')
        .max(1440, '潜水時間は1440分以下で入力してください')
        .required('潜水時間を入力してください'),
    surfaceIntervalMin: yup
        .number()
        .typeError('水面休息時間は数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .integer('水面休息時間は整数で入力してください')
        .min(0, '水面休息時間は0分以上で入力してください')
        .default(null),
    tankType: yup.string().trim().max(40).transform((v) => (v === '' ? null : v)).nullable().default(null),
    tankVolumeL: yup
        .number()
        .typeError('タンク容量は数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .positive('タンク容量は0より大きい値を入力してください')
        .max(50, 'タンク容量は50L以下で入力してください')
        .default(null),
    gasType: yup.string().trim().max(40).transform((v) => (v === '' ? null : v)).nullable().default(null),
    o2Percent: yup
        .number()
        .typeError('酸素濃度は数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .min(0, '酸素濃度は0%以上で入力してください')
        .max(100, '酸素濃度は100%以下で入力してください')
        .default(null),
    pressureStartBar: yup
        .number()
        .typeError('開始残圧は数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .integer('開始残圧は整数で入力してください')
        .min(0, '開始残圧は0bar以上で入力してください')
        .max(400, '開始残圧は400bar以下で入力してください')
        .default(null),
    pressureEndBar: yup
        .number()
        .typeError('終了残圧は数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .integer('終了残圧は整数で入力してください')
        .min(0, '終了残圧は0bar以上で入力してください')
        .max(400, '終了残圧は400bar以下で入力してください')
        .default(null),
    weightKg: yup
        .number()
        .typeError('ウェイトは数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .min(0, 'ウェイトは0kg以上で入力してください')
        .max(30, 'ウェイトは30kg以下で入力してください')
        .default(null),
    suitType: yup.string().trim().max(40).transform((v) => (v === '' ? null : v)).nullable().default(null),
    equipmentNotes: yup.string().trim().max(1000).transform((v) => (v === '' ? null : v)).nullable().default(null),
    buddyName: yup.string().trim().max(100).transform((v) => (v === '' ? null : v)).nullable().default(null),
    instructorName: yup.string().trim().max(100).transform((v) => (v === '' ? null : v)).nullable().default(null),
    certificationDive: yup.boolean().default(false).required(),
    notes: yup.string().trim().max(2000).transform((v) => (v === '' ? null : v)).nullable().default(null),
});

export type DiveFormValues = yup.InferType<typeof diveSchema>;

/** 検索バー用の軽量スキーマ */
export const diveSearchSchema = yup.object({
    dateFrom: yup
        .string()
        .transform((v) => (v === '' || v == null ? null : v))
        .nullable()
        .matches(/^\d{4}-\d{2}-\d{2}$/, { message: '正しい日付を入力してください', excludeEmptyString: true })
        .default(null),
    dateTo: yup
        .string()
        .transform((v) => (v === '' || v == null ? null : v))
        .nullable()
        .matches(/^\d{4}-\d{2}-\d{2}$/, { message: '正しい日付を入力してください', excludeEmptyString: true })
        .default(null),
    location: yup
        .string()
        .trim()
        .max(120, 'エリア / ポイント名は120文字以内で入力してください')
        .transform((v) => (v === '' ? null : v))
        .nullable()
        .default(null),
});

export type DiveSearchValues = yup.InferType<typeof diveSearchSchema>;
