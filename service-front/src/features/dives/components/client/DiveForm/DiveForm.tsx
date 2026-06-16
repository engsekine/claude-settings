'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@repo/ui/components/button';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type KeyboardEvent, useEffect, useState, type WheelEvent } from 'react';
import { useForm } from 'react-hook-form';

import { DIVE_TYPE_OPTIONS, GAS_TYPE_OPTIONS, TANK_TYPE_OPTIONS } from '@/features/dives/constants';
import { useDiveFormSubmit } from '@/features/dives/hooks/useDiveFormSubmit';
import { calcBottomTimeMin } from '@/features/dives/lib/calcBottomTime';
import { type DiveFormValues, diveSchema } from '@/features/dives/schemas/dive.schema';
import { FormField, type FormSelectOption, FormSelect, FormTextarea, SearchSelect } from '@/shared/components/form';
import { todayInJst } from '@/shared/lib/date';

interface DiveFormProps {
    /** 編集モードで指定。新規作成のときは undefined */
    diveId?: string;
    defaultValues?: Partial<DiveFormValues>;
    /** ダイブサイト選択肢（マスタ）。ページ層で listDiveSites + siteLabel から組み立てて渡す */
    siteOptions?: FormSelectOption[];
}

/** number 入力にホイールでフォーカスしたまま値が変わる事故を防ぐ */
const blurOnWheel = (e: WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
};

/** type=number でも 'e' / '+' / '-' / '.' などは入力できてしまうのでブロックする（非負整数用） */
const BLOCKED_INTEGER_KEYS = new Set(['e', 'E', '+', '-', '.', ',']);
const blockNonIntegerKeys = (e: KeyboardEvent<HTMLInputElement>) => {
    if (BLOCKED_INTEGER_KEYS.has(e.key)) {
        e.preventDefault();
    }
};

const createDefaultValues = (overrides?: Partial<DiveFormValues>): DiveFormValues => ({
    diveNumber: null,
    diveDate: todayInJst(),
    entryTime: null,
    exitTime: null,
    location: '',
    diveSiteId: null,
    diveType: null,
    weather: null,
    airTempC: null,
    waterTempC: null,
    visibilityM: null,
    wave: null,
    currentCondition: null,
    maxDepthM: 1,
    avgDepthM: null,
    bottomTimeMin: 1,
    tankType: 'steel',
    tankVolumeL: 10,
    gasType: 'air',
    o2Percent: 21,
    pressureStartBar: null,
    pressureEndBar: null,
    weightKg: null,
    suitType: null,
    equipmentNotes: null,
    buddyName: null,
    instructorName: null,
    certificationDive: false,
    notes: null,
    ...overrides,
});

export const DiveForm = ({ diveId, defaultValues, siteOptions = [] }: DiveFormProps) => {
    const router = useRouter();
    const isEdit = diveId !== undefined;

    const { isPending, serverError, submit } = useDiveFormSubmit(diveId);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<DiveFormValues>({
        resolver: yupResolver(diveSchema),
        defaultValues: createDefaultValues(defaultValues),
    });

    const onSubmit = handleSubmit(submit);

    /**
     * 編集モードで既存値が渡されている場合は手動扱いで初期化する。
     * 新規作成は自動計算モードで開始し、ユーザーが潜水時間を編集した時点で停止する。
     */
    const [isBottomTimeAutoCalc, setIsBottomTimeAutoCalc] = useState(defaultValues?.bottomTimeMin == null);

    const entryTime = watch('entryTime');
    const exitTime = watch('exitTime');
    const diveSiteId = watch('diveSiteId') ?? '';

    useEffect(() => {
        if (!isBottomTimeAutoCalc) return;
        const calculated = calcBottomTimeMin(entryTime, exitTime);
        if (calculated === null) return;
        setValue('bottomTimeMin', calculated, { shouldDirty: false, shouldValidate: true });
    }, [entryTime, exitTime, isBottomTimeAutoCalc, setValue]);

    const bottomTimeRegister = register('bottomTimeMin', {
        onChange: () => setIsBottomTimeAutoCalc(false),
    });

    return (
        <form
            onSubmit={(e) => {
                void onSubmit(e);
            }}
            className="flex flex-col gap-6"
            noValidate
        >
            <section aria-labelledby="dive-form-basic" className="flex flex-col gap-4">
                <h2 id="dive-form-basic" className="font-semibold text-lg">
                    基本情報
                </h2>

                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        id="diveNumber"
                        label="ダイブ番号"
                        error={errors.diveNumber?.message}
                        type="number"
                        onWheel={blurOnWheel}
                        onKeyDown={blockNonIntegerKeys}
                        inputMode="numeric"
                        min={0}
                        step={1}
                        autoComplete="off"
                        {...register('diveNumber')}
                    />

                    <FormField
                        id="diveDate"
                        label="潜水日"
                        required
                        error={errors.diveDate?.message}
                        type="date"
                        autoComplete="off"
                        {...register('diveDate')}
                    />
                </div>

                <fieldset className="flex flex-col gap-2">
                    <legend className="font-medium text-sm">
                        ポイント
                        <span aria-hidden="true" className="ml-1 text-red-600">
                            *
                        </span>
                        <span className="sr-only">必須</span>
                    </legend>
                    <p className="text-muted-foreground text-xs">
                        登録済みのダイブサイトを検索して選ぶか、無ければ下の欄にポイント名を入力してください
                    </p>
                    <SearchSelect
                        id="diveSiteId"
                        label="ダイブサイト（マスタから選択）"
                        options={siteOptions}
                        value={diveSiteId}
                        onChange={(value) => {
                            setValue('diveSiteId', value === '' ? null : value, { shouldValidate: true });
                            // サイト選択時は自由入力を空にして排他にする
                            if (value) setValue('location', '', { shouldValidate: true });
                        }}
                        placeholder="ポイント名・エリアで検索"
                        error={errors.diveSiteId?.message}
                    />
                    <FormField
                        id="location"
                        label="ポイント名（マスタに無い場合に直接入力）"
                        error={errors.location?.message}
                        type="text"
                        autoComplete="off"
                        {...register('location', {
                            // 自由入力したらサイト選択を解除して排他にする
                            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                                if (e.target.value) setValue('diveSiteId', null, { shouldValidate: true });
                            },
                        })}
                    />
                </fieldset>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <FormField
                        id="entryTime"
                        label="エントリー時刻"
                        type="time"
                        autoComplete="off"
                        {...register('entryTime')}
                    />

                    <FormField
                        id="exitTime"
                        label="エキジット時刻"
                        type="time"
                        autoComplete="off"
                        {...register('exitTime')}
                    />

                    <FormField
                        id="pressureStartBar"
                        label="開始残圧(bar)"
                        type="number"
                        onWheel={blurOnWheel}
                        inputMode="numeric"
                        step={5}
                        min={0}
                        max={400}
                        autoComplete="off"
                        {...register('pressureStartBar')}
                    />

                    <FormField
                        id="pressureEndBar"
                        label="終了残圧(bar)"
                        error={errors.pressureEndBar?.message}
                        type="number"
                        onWheel={blurOnWheel}
                        inputMode="numeric"
                        step={5}
                        min={0}
                        max={400}
                        autoComplete="off"
                        {...register('pressureEndBar')}
                    />
                </div>

                <FormSelect
                    id="diveType"
                    label="ダイブタイプ"
                    options={DIVE_TYPE_OPTIONS}
                    placeholder="選択しない"
                    {...register('diveType')}
                />
            </section>

            <section aria-labelledby="dive-form-numbers" className="flex flex-col gap-4">
                <h2 id="dive-form-numbers" className="font-semibold text-lg">
                    水深・時間
                </h2>

                <div className="grid grid-cols-3 gap-3">
                    <FormField
                        id="maxDepthM"
                        label="最大水深(m)"
                        required
                        error={errors.maxDepthM?.message}
                        type="number"
                        onWheel={blurOnWheel}
                        inputMode="decimal"
                        step="0.1"
                        min={0}
                        max={300}
                        autoComplete="off"
                        {...register('maxDepthM')}
                    />

                    <FormField
                        id="avgDepthM"
                        label="平均水深(m)"
                        error={errors.avgDepthM?.message}
                        type="number"
                        onWheel={blurOnWheel}
                        inputMode="decimal"
                        step="0.1"
                        min={0}
                        max={300}
                        autoComplete="off"
                        {...register('avgDepthM')}
                    />

                    {/* 自動計算ヒントは FormField 非対応のため外側に置き、aria-describedby を明示的に上書きする */}
                    <div className="flex flex-col gap-1">
                        <FormField
                            id="bottomTimeMin"
                            label="潜水時間(分)"
                            required
                            error={errors.bottomTimeMin?.message}
                            type="number"
                            onWheel={blurOnWheel}
                            inputMode="numeric"
                            step={1}
                            min={1}
                            max={1440}
                            autoComplete="off"
                            aria-describedby={
                                errors.bottomTimeMin
                                    ? 'bottomTimeMin-error'
                                    : isBottomTimeAutoCalc
                                      ? 'bottomTimeMin-hint'
                                      : undefined
                            }
                            {...bottomTimeRegister}
                        />
                        {isBottomTimeAutoCalc && !errors.bottomTimeMin && (
                            <span id="bottomTimeMin-hint" className="text-muted-foreground text-xs">
                                エントリー / エキジット時刻から自動計算します
                            </span>
                        )}
                    </div>
                </div>
            </section>

            <section aria-labelledby="dive-form-condition" className="flex flex-col gap-4">
                <h2 id="dive-form-condition" className="font-semibold text-lg">
                    コンディション
                </h2>

                <div className="grid grid-cols-3 gap-3">
                    <FormField
                        id="airTempC"
                        label="気温(℃)"
                        type="number"
                        onWheel={blurOnWheel}
                        inputMode="decimal"
                        step="0.1"
                        autoComplete="off"
                        {...register('airTempC')}
                    />
                    <FormField
                        id="waterTempC"
                        label="水温(℃)"
                        type="number"
                        onWheel={blurOnWheel}
                        inputMode="decimal"
                        step="0.1"
                        autoComplete="off"
                        {...register('waterTempC')}
                    />
                    <FormField
                        id="visibilityM"
                        label="透明度(m)"
                        type="number"
                        onWheel={blurOnWheel}
                        inputMode="decimal"
                        step="0.1"
                        min={0}
                        max={100}
                        autoComplete="off"
                        {...register('visibilityM')}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FormField id="weather" label="天気" type="text" autoComplete="off" {...register('weather')} />
                    <FormField id="wave" label="波・うねり" type="text" autoComplete="off" {...register('wave')} />
                    <FormField
                        id="currentCondition"
                        label="流れ"
                        type="text"
                        autoComplete="off"
                        {...register('currentCondition')}
                    />
                </div>
            </section>

            <section aria-labelledby="dive-form-equipment" className="flex flex-col gap-4">
                <h2 id="dive-form-equipment" className="font-semibold text-lg">
                    タンク・装備
                </h2>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <FormSelect
                        id="tankType"
                        label="タンク種別"
                        options={TANK_TYPE_OPTIONS}
                        placeholder="選択しない"
                        {...register('tankType')}
                    />
                    <FormField
                        id="tankVolumeL"
                        label="タンク容量(L)"
                        type="number"
                        onWheel={blurOnWheel}
                        inputMode="decimal"
                        step="0.1"
                        min={0}
                        autoComplete="off"
                        {...register('tankVolumeL')}
                    />
                    <FormSelect
                        id="gasType"
                        label="ガス種類"
                        options={GAS_TYPE_OPTIONS}
                        placeholder="選択しない"
                        {...register('gasType')}
                    />
                    <FormField
                        id="o2Percent"
                        label="酸素濃度(%)"
                        type="number"
                        onWheel={blurOnWheel}
                        inputMode="decimal"
                        step="0.1"
                        min={0}
                        max={100}
                        autoComplete="off"
                        {...register('o2Percent')}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        id="weightKg"
                        label="ウェイト(kg)"
                        type="number"
                        onWheel={blurOnWheel}
                        inputMode="decimal"
                        step="0.1"
                        min={0}
                        max={30}
                        autoComplete="off"
                        {...register('weightKg')}
                    />
                    <FormField
                        id="suitType"
                        label="スーツ"
                        type="text"
                        maxLength={40}
                        autoComplete="off"
                        placeholder="例: ウェット 5mm"
                        {...register('suitType')}
                    />
                </div>

                <FormTextarea id="equipmentNotes" label="装備メモ" rows={2} {...register('equipmentNotes')} />
            </section>

            <section aria-labelledby="dive-form-others" className="flex flex-col gap-4">
                <h2 id="dive-form-others" className="font-semibold text-lg">
                    バディ・メモ
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField
                        id="buddyName"
                        label="バディ名"
                        type="text"
                        autoComplete="off"
                        {...register('buddyName')}
                    />
                    <FormField
                        id="instructorName"
                        label="インストラクター名"
                        type="text"
                        autoComplete="off"
                        {...register('instructorName')}
                    />
                </div>

                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...register('certificationDive')} />
                    講習ダイブ
                </label>

                <FormTextarea id="notes" label="メモ・印象" rows={4} {...register('notes')} />
            </section>

            {serverError && (
                <div role="alert" className="text-red-600 text-sm">
                    {serverError}
                </div>
            )}

            <div className="flex items-center justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        router.back();
                    }}
                >
                    キャンセル
                </Button>
                <Button type="submit" disabled={isPending} aria-busy={isPending}>
                    {isPending ? '保存中...' : isEdit ? '更新する' : '作成する'}
                </Button>
            </div>
        </form>
    );
};
