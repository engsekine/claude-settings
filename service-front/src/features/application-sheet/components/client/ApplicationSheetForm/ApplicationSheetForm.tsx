'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useState, useTransition } from 'react';
import { useController, useForm } from 'react-hook-form';

import { FormField } from '@/shared/components/form/FormField';
import { FormRadioGroup } from '@/shared/components/form/FormRadioGroup';
import { FormSelect } from '@/shared/components/form/FormSelect';
import { Heading } from '@/shared/components/typography/Heading';
import { Button } from '@/shared/components/ui/Button';

import {
    CONTACT_LENS_TYPE_OPTIONS,
    NEEDS_MASK_OPTIONS,
    SHEET_GENDER_OPTIONS,
    YES_NO_OPTIONS,
} from '../../../constants';
import { buildSheetText } from '../../../lib/buildSheetText';
import { applicationSheetSchema } from '../../../schemas/application-sheet.schema';
import { saveApplicationProfile } from '../../../server/actions';
import type { SheetFormValues } from '../../../types';
import { RentalItemsField } from '../RentalItemsField';
import { SheetPreview } from '../SheetPreview';

interface ApplicationSheetFormProps {
    /** 自動入力・保存値から組み立てた初期値（上書き修正可能・FR-008） */
    defaultValues?: Partial<SheetFormValues>;
}

/**
 * 申し込みシート作成フォーム。入力のたびに buildSheetText でプレビューを更新する。
 * 全項目任意（FR-005）のため必須マークは付けない。
 */
export const ApplicationSheetForm = ({ defaultValues }: ApplicationSheetFormProps) => {
    const [isSaving, startSaving] = useTransition();
    const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        control,
        watch,
        handleSubmit,
        formState: { errors },
    } = useForm<SheetFormValues>({
        resolver: yupResolver(applicationSheetSchema),
        defaultValues: { ...applicationSheetSchema.getDefault(), ...defaultValues },
        mode: 'onBlur',
    });

    const hasRentalField = useController({ control, name: 'hasRental' });
    const rentalItemsField = useController({ control, name: 'rentalItems' });
    const omitRentalBlockField = useController({ control, name: 'omitRentalBlock' });

    const sheetText = buildSheetText(watch());

    // 保存対象の絞り込み（個人属性のみ・FR-010）はサーバー側で行う
    const onSave = handleSubmit((values) => {
        setSaveState('idle');
        setServerError(null);
        startSaving(async () => {
            const result = await saveApplicationProfile(values);
            if (!result.success) {
                setServerError(result.error);
                return;
            }
            setSaveState('saved');
        });
    });

    return (
        <form
            className="flex flex-col gap-10"
            onSubmit={(event) => {
                void onSave(event);
            }}
            noValidate
        >
            <section className="flex flex-col gap-4">
                <Heading level={2}>基本情報</Heading>
                <FormField
                    id="fullName"
                    label="お名前"
                    type="text"
                    error={errors.fullName?.message}
                    {...register('fullName')}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                        id="age"
                        label="年齢"
                        type="text"
                        inputMode="numeric"
                        error={errors.age?.message}
                        {...register('age')}
                    />
                    <FormField
                        id="birthOn"
                        label="生年月日"
                        type="date"
                        error={errors.birthOn?.message}
                        {...register('birthOn')}
                    />
                </div>
                <FormSelect
                    id="gender"
                    label="性別"
                    options={SHEET_GENDER_OPTIONS}
                    placeholder="選択してください"
                    error={errors.gender?.message}
                    {...register('gender')}
                />
                <FormField
                    id="phone"
                    label="携帯電話"
                    type="tel"
                    error={errors.phone?.message}
                    {...register('phone')}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                        id="emergencyContactRelation"
                        label="緊急連絡先の続柄"
                        type="text"
                        placeholder="例: 父・妻"
                        error={errors.emergencyContactRelation?.message}
                        {...register('emergencyContactRelation')}
                    />
                    <FormField
                        id="emergencyContactPhone"
                        label="緊急連絡先の電話番号"
                        type="tel"
                        error={errors.emergencyContactPhone?.message}
                        {...register('emergencyContactPhone')}
                    />
                </div>
                <FormField
                    id="nearestStation"
                    label="最寄りの駅"
                    type="text"
                    error={errors.nearestStation?.message}
                    {...register('nearestStation')}
                />
            </section>

            <section className="flex flex-col gap-4">
                <Heading level={2}>経験</Heading>
                <FormField
                    id="licenseRank"
                    label="ライセンスランク"
                    type="text"
                    placeholder="例: Open Water Diver"
                    error={errors.licenseRank?.message}
                    {...register('licenseRank')}
                />
                <FormField
                    id="diveCount"
                    label="経験本数"
                    type="text"
                    inputMode="numeric"
                    error={errors.diveCount?.message}
                    {...register('diveCount')}
                />
                <FormRadioGroup
                    legend="伊豆・千葉でのダイビング経験"
                    {...register('hasIzuChibaExperience')}
                    name="hasIzuChibaExperience"
                    options={YES_NO_OPTIONS}
                    error={errors.hasIzuChibaExperience?.message}
                />
                <FormRadioGroup
                    legend="ボートダイビングの経験"
                    {...register('hasBoatExperience')}
                    name="hasBoatExperience"
                    options={YES_NO_OPTIONS}
                    error={errors.hasBoatExperience?.message}
                />
                <FormField
                    id="lastDiveYearMonth"
                    label="最終ダイブ年月"
                    type="month"
                    error={errors.lastDiveYearMonth?.message}
                    {...register('lastDiveYearMonth')}
                />
                <FormRadioGroup
                    legend="ドライスーツの経験"
                    {...register('hasDrySuitExperience')}
                    name="hasDrySuitExperience"
                    options={YES_NO_OPTIONS}
                    error={errors.hasDrySuitExperience?.message}
                />
                <FormField
                    id="drySuitDiveCount"
                    label="ドライスーツの経験本数"
                    type="text"
                    inputMode="numeric"
                    error={errors.drySuitDiveCount?.message}
                    {...register('drySuitDiveCount')}
                />
            </section>

            <section className="flex flex-col gap-4">
                <Heading level={2}>レンタル器材</Heading>
                <RentalItemsField
                    hasRental={hasRentalField.field.value}
                    onHasRentalChange={hasRentalField.field.onChange}
                    selectedItems={rentalItemsField.field.value}
                    onSelectedItemsChange={rentalItemsField.field.onChange}
                    omitRentalBlock={omitRentalBlockField.field.value}
                    onOmitRentalBlockChange={omitRentalBlockField.field.onChange}
                />
                {/* レンタル「無」ではサイズ欄・コンタクトレンズ・度付きマスクの入力を求めない（FR-011） */}
                {hasRentalField.field.value !== 'no' && (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <FormField
                                id="heightCm"
                                label="身長"
                                type="text"
                                inputMode="decimal"
                                placeholder="cm"
                                error={errors.heightCm?.message}
                                {...register('heightCm')}
                            />
                            <FormField
                                id="weightKg"
                                label="体重"
                                type="text"
                                inputMode="decimal"
                                placeholder="kg"
                                error={errors.weightKg?.message}
                                {...register('weightKg')}
                            />
                            <FormField
                                id="footSizeCm"
                                label="足のサイズ"
                                type="text"
                                inputMode="decimal"
                                placeholder="cm"
                                error={errors.footSizeCm?.message}
                                {...register('footSizeCm')}
                            />
                        </div>
                        <FormRadioGroup
                            legend="コンタクトレンズの有無"
                            {...register('hasContactLens')}
                            name="hasContactLens"
                            options={YES_NO_OPTIONS}
                            error={errors.hasContactLens?.message}
                        />
                        <FormSelect
                            id="contactLensType"
                            label="コンタクトレンズの種類"
                            options={CONTACT_LENS_TYPE_OPTIONS}
                            placeholder="選択してください"
                            error={errors.contactLensType?.message}
                            {...register('contactLensType')}
                        />
                        <FormRadioGroup
                            legend="度付きマスクレンタルの要否"
                            {...register('needsPrescriptionMask')}
                            name="needsPrescriptionMask"
                            options={NEEDS_MASK_OPTIONS}
                            error={errors.needsPrescriptionMask?.message}
                        />
                    </>
                )}
            </section>

            <section className="flex flex-col gap-4">
                <Heading level={2}>出力</Heading>
                <SheetPreview generatedText={sheetText} />
            </section>

            <div className="flex flex-col items-start gap-2">
                <p className="text-muted-foreground text-sm">
                    携帯電話・緊急連絡先などの手入力項目を保存すると、次回から自動で復元されます（レンタル品目の選択は保存されません）
                </p>
                <Button type="submit" variant="outline" disabled={isSaving} aria-busy={isSaving}>
                    {isSaving ? '保存中...' : '入力内容を保存する'}
                </Button>
                {/* aria-live 領域は常設して更新を通知する */}
                <span role="status" aria-live="polite" className="text-sky-700 text-sm">
                    {saveState === 'saved' ? '保存しました' : ''}
                </span>
                {serverError && (
                    <span role="alert" className="text-red-600 text-sm">
                        {serverError}
                    </span>
                )}
            </div>
        </form>
    );
};
