'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { DIVE_TYPE_OPTIONS, GAS_TYPE_OPTIONS, SUIT_TYPE_OPTIONS } from '@/features/dives/constants';
import { useDiveFormSubmit } from '@/features/dives/hooks/useDiveFormSubmit';
import { calcBottomTimeMin } from '@/features/dives/lib/calcBottomTime';
import { type DiveFormValues, diveSchema } from '@/features/dives/schemas/dive.schema';

interface DiveFormProps {
    /** 編集モードで指定。新規作成のときは undefined */
    diveId?: string;
    defaultValues?: Partial<DiveFormValues>;
}

const createDefaultValues = (overrides?: Partial<DiveFormValues>): DiveFormValues => ({
    diveNumber: null,
    diveDate: new Date().toISOString().slice(0, 10),
    entryTime: null,
    exitTime: null,
    location: '',
    country: null,
    diveSite: null,
    diveType: null,
    weather: null,
    airTempC: null,
    waterTempC: null,
    visibilityM: null,
    wave: null,
    currentCondition: null,
    maxDepthM: 0,
    avgDepthM: null,
    bottomTimeMin: 1,
    surfaceIntervalMin: null,
    tankType: null,
    tankVolumeL: null,
    gasType: null,
    o2Percent: null,
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

export const DiveForm = ({ diveId, defaultValues }: DiveFormProps) => {
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="diveDate" className="font-medium text-sm">
                            潜水日
                            <span aria-hidden="true" className="ml-1 text-red-600">
                                *
                            </span>
                            <span className="sr-only">（必須）</span>
                        </label>
                        <Input
                            id="diveDate"
                            type="date"
                            autoComplete="off"
                            aria-required="true"
                            aria-invalid={!!errors.diveDate}
                            aria-describedby={errors.diveDate ? 'diveDate-error' : undefined}
                            {...register('diveDate')}
                        />
                        {errors.diveDate && (
                            <span id="diveDate-error" role="alert" className="text-red-600 text-sm">
                                {errors.diveDate.message}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="diveNumber" className="font-medium text-sm">
                            ダイブ番号
                        </label>
                        <Input
                            id="diveNumber"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            step={1}
                            autoComplete="off"
                            aria-invalid={!!errors.diveNumber}
                            aria-describedby={errors.diveNumber ? 'diveNumber-error' : undefined}
                            {...register('diveNumber')}
                        />
                        {errors.diveNumber && (
                            <span id="diveNumber-error" role="alert" className="text-red-600 text-sm">
                                {errors.diveNumber.message}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="location" className="font-medium text-sm">
                        エリア / ポイント名
                        <span aria-hidden="true" className="ml-1 text-red-600">
                            *
                        </span>
                        <span className="sr-only">（必須）</span>
                    </label>
                    <Input
                        id="location"
                        type="text"
                        autoComplete="off"
                        aria-required="true"
                        aria-invalid={!!errors.location}
                        aria-describedby={errors.location ? 'location-error' : undefined}
                        {...register('location')}
                    />
                    {errors.location && (
                        <span id="location-error" role="alert" className="text-red-600 text-sm">
                            {errors.location.message}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="diveSite" className="font-medium text-sm">
                            詳細ポイント名
                        </label>
                        <Input id="diveSite" type="text" autoComplete="off" {...register('diveSite')} />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="country" className="font-medium text-sm">
                            国
                        </label>
                        <Input id="country" type="text" autoComplete="off" {...register('country')} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="entryTime" className="font-medium text-sm">
                            エントリー時刻
                        </label>
                        <Input id="entryTime" type="time" autoComplete="off" {...register('entryTime')} />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="exitTime" className="font-medium text-sm">
                            エキジット時刻
                        </label>
                        <Input id="exitTime" type="time" autoComplete="off" {...register('exitTime')} />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="diveType" className="font-medium text-sm">
                        ダイブタイプ
                    </label>
                    <select
                        id="diveType"
                        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                        {...register('diveType')}
                    >
                        <option value="">選択しない</option>
                        {DIVE_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            <section aria-labelledby="dive-form-numbers" className="flex flex-col gap-4">
                <h2 id="dive-form-numbers" className="font-semibold text-lg">
                    水深・時間
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="maxDepthM" className="font-medium text-sm">
                            最大水深(m)
                            <span aria-hidden="true" className="ml-1 text-red-600">
                                *
                            </span>
                            <span className="sr-only">（必須）</span>
                        </label>
                        <Input
                            id="maxDepthM"
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min={0}
                            max={300}
                            autoComplete="off"
                            aria-required="true"
                            aria-invalid={!!errors.maxDepthM}
                            aria-describedby={errors.maxDepthM ? 'maxDepthM-error' : undefined}
                            {...register('maxDepthM')}
                        />
                        {errors.maxDepthM && (
                            <span id="maxDepthM-error" role="alert" className="text-red-600 text-sm">
                                {errors.maxDepthM.message}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="avgDepthM" className="font-medium text-sm">
                            平均水深(m)
                        </label>
                        <Input
                            id="avgDepthM"
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min={0}
                            max={300}
                            autoComplete="off"
                            aria-invalid={!!errors.avgDepthM}
                            aria-describedby={errors.avgDepthM ? 'avgDepthM-error' : undefined}
                            {...register('avgDepthM')}
                        />
                        {errors.avgDepthM && (
                            <span id="avgDepthM-error" role="alert" className="text-red-600 text-sm">
                                {errors.avgDepthM.message}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="bottomTimeMin" className="font-medium text-sm">
                            潜水時間(分)
                            <span aria-hidden="true" className="ml-1 text-red-600">
                                *
                            </span>
                            <span className="sr-only">（必須）</span>
                        </label>
                        <Input
                            id="bottomTimeMin"
                            type="number"
                            inputMode="numeric"
                            step={1}
                            min={1}
                            max={1440}
                            autoComplete="off"
                            aria-required="true"
                            aria-invalid={!!errors.bottomTimeMin}
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
                        {errors.bottomTimeMin && (
                            <span id="bottomTimeMin-error" role="alert" className="text-red-600 text-sm">
                                {errors.bottomTimeMin.message}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="surfaceIntervalMin" className="font-medium text-sm">
                            水面休息時間(分)
                        </label>
                        <Input
                            id="surfaceIntervalMin"
                            type="number"
                            inputMode="numeric"
                            step={1}
                            min={0}
                            autoComplete="off"
                            aria-invalid={!!errors.surfaceIntervalMin}
                            aria-describedby={errors.surfaceIntervalMin ? 'surfaceIntervalMin-error' : undefined}
                            {...register('surfaceIntervalMin')}
                        />
                        {errors.surfaceIntervalMin && (
                            <span id="surfaceIntervalMin-error" role="alert" className="text-red-600 text-sm">
                                {errors.surfaceIntervalMin.message}
                            </span>
                        )}
                    </div>
                </div>
            </section>

            <section aria-labelledby="dive-form-condition" className="flex flex-col gap-4">
                <h2 id="dive-form-condition" className="font-semibold text-lg">
                    コンディション
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="airTempC" className="font-medium text-sm">
                            気温(℃)
                        </label>
                        <Input
                            id="airTempC"
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            autoComplete="off"
                            {...register('airTempC')}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="waterTempC" className="font-medium text-sm">
                            水温(℃)
                        </label>
                        <Input
                            id="waterTempC"
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            autoComplete="off"
                            {...register('waterTempC')}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="visibilityM" className="font-medium text-sm">
                            透明度(m)
                        </label>
                        <Input
                            id="visibilityM"
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min={0}
                            max={100}
                            autoComplete="off"
                            {...register('visibilityM')}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="weather" className="font-medium text-sm">
                            天気
                        </label>
                        <Input id="weather" type="text" autoComplete="off" {...register('weather')} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="wave" className="font-medium text-sm">
                            波・うねり
                        </label>
                        <Input id="wave" type="text" autoComplete="off" {...register('wave')} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="currentCondition" className="font-medium text-sm">
                            流れ
                        </label>
                        <Input id="currentCondition" type="text" autoComplete="off" {...register('currentCondition')} />
                    </div>
                </div>
            </section>

            <section aria-labelledby="dive-form-equipment" className="flex flex-col gap-4">
                <h2 id="dive-form-equipment" className="font-semibold text-lg">
                    タンク・装備
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="tankType" className="font-medium text-sm">
                            タンク種別
                        </label>
                        <Input id="tankType" type="text" autoComplete="off" {...register('tankType')} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="tankVolumeL" className="font-medium text-sm">
                            タンク容量(L)
                        </label>
                        <Input
                            id="tankVolumeL"
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min={0}
                            autoComplete="off"
                            {...register('tankVolumeL')}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="gasType" className="font-medium text-sm">
                            ガス種類
                        </label>
                        <select
                            id="gasType"
                            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                            {...register('gasType')}
                        >
                            <option value="">選択しない</option>
                            {GAS_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="o2Percent" className="font-medium text-sm">
                            酸素濃度(%)
                        </label>
                        <Input
                            id="o2Percent"
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min={0}
                            max={100}
                            autoComplete="off"
                            {...register('o2Percent')}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="pressureStartBar" className="font-medium text-sm">
                            開始残圧(bar)
                        </label>
                        <Input
                            id="pressureStartBar"
                            type="number"
                            inputMode="numeric"
                            step={1}
                            min={0}
                            max={400}
                            autoComplete="off"
                            {...register('pressureStartBar')}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="pressureEndBar" className="font-medium text-sm">
                            終了残圧(bar)
                        </label>
                        <Input
                            id="pressureEndBar"
                            type="number"
                            inputMode="numeric"
                            step={1}
                            min={0}
                            max={400}
                            autoComplete="off"
                            {...register('pressureEndBar')}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="weightKg" className="font-medium text-sm">
                            ウェイト(kg)
                        </label>
                        <Input
                            id="weightKg"
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min={0}
                            max={30}
                            autoComplete="off"
                            {...register('weightKg')}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="suitType" className="font-medium text-sm">
                            スーツ
                        </label>
                        <select
                            id="suitType"
                            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                            {...register('suitType')}
                        >
                            <option value="">選択しない</option>
                            {SUIT_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="equipmentNotes" className="font-medium text-sm">
                        装備メモ
                    </label>
                    <textarea
                        id="equipmentNotes"
                        rows={2}
                        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                        {...register('equipmentNotes')}
                    />
                </div>
            </section>

            <section aria-labelledby="dive-form-others" className="flex flex-col gap-4">
                <h2 id="dive-form-others" className="font-semibold text-lg">
                    バディ・メモ
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="buddyName" className="font-medium text-sm">
                            バディ名
                        </label>
                        <Input id="buddyName" type="text" autoComplete="off" {...register('buddyName')} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="instructorName" className="font-medium text-sm">
                            インストラクター名
                        </label>
                        <Input id="instructorName" type="text" autoComplete="off" {...register('instructorName')} />
                    </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...register('certificationDive')} />
                    講習ダイブ
                </label>

                <div className="flex flex-col gap-1">
                    <label htmlFor="notes" className="font-medium text-sm">
                        メモ・印象
                    </label>
                    <textarea
                        id="notes"
                        rows={4}
                        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                        {...register('notes')}
                    />
                </div>
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
