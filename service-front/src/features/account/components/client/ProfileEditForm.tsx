'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { type ProfileFormValues, profileSchema } from '@/features/account/schemas/profile.schema';
import { updateProfile } from '@/features/account/server/actions';
import { GENDER_OPTIONS } from '@/shared/constants/gender';

interface ProfileEditFormProps {
    email: string;
    defaultValues: ProfileFormValues;
}

export const ProfileEditForm = ({ email, defaultValues }: ProfileEditFormProps) => {
    const [isPending, startTransition] = useTransition();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isDirty },
    } = useForm<ProfileFormValues>({
        resolver: yupResolver(profileSchema),
        defaultValues,
    });

    const onSubmit = handleSubmit((values) => {
        setSuccessMessage(null);
        startTransition(async () => {
            const result = await updateProfile(values);
            if (result.error) {
                setError('root', { message: result.error });
                return;
            }
            setSuccessMessage('プロフィールを更新しました');
        });
    });

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1">
                <label htmlFor="email" className="font-medium text-sm">
                    メールアドレス
                </label>
                <Input id="email" type="email" value={email} readOnly disabled aria-readonly="true" />
                <span className="text-muted-foreground text-xs">メールアドレスは変更できません</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <label htmlFor="lastName" className="font-medium text-sm">
                        姓
                    </label>
                    <Input
                        id="lastName"
                        type="text"
                        autoComplete="family-name"
                        aria-required="true"
                        aria-invalid={!!errors.lastName}
                        aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                        {...register('lastName')}
                    />
                    {errors.lastName && (
                        <span id="lastName-error" role="alert" className="text-red-600 text-sm">
                            {errors.lastName.message}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="firstName" className="font-medium text-sm">
                        名
                    </label>
                    <Input
                        id="firstName"
                        type="text"
                        autoComplete="given-name"
                        aria-required="true"
                        aria-invalid={!!errors.firstName}
                        aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                        {...register('firstName')}
                    />
                    {errors.firstName && (
                        <span id="firstName-error" role="alert" className="text-red-600 text-sm">
                            {errors.firstName.message}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <label htmlFor="lastNameRomaji" className="font-medium text-sm">
                        姓（ローマ字）
                    </label>
                    <Input
                        id="lastNameRomaji"
                        type="text"
                        autoComplete="off"
                        placeholder="Yamada"
                        aria-required="true"
                        aria-invalid={!!errors.lastNameRomaji}
                        aria-describedby={errors.lastNameRomaji ? 'lastNameRomaji-error' : undefined}
                        {...register('lastNameRomaji')}
                    />
                    {errors.lastNameRomaji && (
                        <span id="lastNameRomaji-error" role="alert" className="text-red-600 text-sm">
                            {errors.lastNameRomaji.message}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="firstNameRomaji" className="font-medium text-sm">
                        名（ローマ字）
                    </label>
                    <Input
                        id="firstNameRomaji"
                        type="text"
                        autoComplete="off"
                        placeholder="Taro"
                        aria-required="true"
                        aria-invalid={!!errors.firstNameRomaji}
                        aria-describedby={errors.firstNameRomaji ? 'firstNameRomaji-error' : undefined}
                        {...register('firstNameRomaji')}
                    />
                    {errors.firstNameRomaji && (
                        <span id="firstNameRomaji-error" role="alert" className="text-red-600 text-sm">
                            {errors.firstNameRomaji.message}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="nickname" className="font-medium text-sm">
                    ニックネーム
                </label>
                <Input
                    id="nickname"
                    type="text"
                    autoComplete="nickname"
                    aria-required="true"
                    aria-invalid={!!errors.nickname}
                    aria-describedby={errors.nickname ? 'nickname-error' : undefined}
                    {...register('nickname')}
                />
                {errors.nickname && (
                    <span id="nickname-error" role="alert" className="text-red-600 text-sm">
                        {errors.nickname.message}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="birthOn" className="font-medium text-sm">
                    生年月日
                </label>
                <Input
                    id="birthOn"
                    type="date"
                    autoComplete="bday"
                    aria-required="true"
                    aria-invalid={!!errors.birthOn}
                    aria-describedby={errors.birthOn ? 'birthOn-error' : undefined}
                    {...register('birthOn')}
                />
                {errors.birthOn && (
                    <span id="birthOn-error" role="alert" className="text-red-600 text-sm">
                        {errors.birthOn.message}
                    </span>
                )}
            </div>

            <fieldset className="flex flex-col gap-1">
                <legend className="font-medium text-sm">性別</legend>
                <div
                    role="radiogroup"
                    aria-required="true"
                    aria-invalid={!!errors.gender}
                    aria-describedby={errors.gender ? 'gender-error' : undefined}
                    className="flex gap-4"
                >
                    {GENDER_OPTIONS.map((option) => (
                        <label key={option.value} className="flex items-center gap-2 text-sm">
                            <input type="radio" value={option.value} {...register('gender')} />
                            {option.label}
                        </label>
                    ))}
                </div>
                {errors.gender && (
                    <span id="gender-error" role="alert" className="text-red-600 text-sm">
                        {errors.gender.message}
                    </span>
                )}
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <label htmlFor="heightCm" className="font-medium text-sm">
                        身長（cm）
                    </label>
                    <Input
                        id="heightCm"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min={30}
                        max={300}
                        autoComplete="off"
                        aria-invalid={!!errors.heightCm}
                        aria-describedby={errors.heightCm ? 'heightCm-error' : undefined}
                        {...register('heightCm')}
                    />
                    {errors.heightCm && (
                        <span id="heightCm-error" role="alert" className="text-red-600 text-sm">
                            {errors.heightCm.message}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="weightKg" className="font-medium text-sm">
                        体重（kg）
                    </label>
                    <Input
                        id="weightKg"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min={1}
                        max={500}
                        autoComplete="off"
                        aria-invalid={!!errors.weightKg}
                        aria-describedby={errors.weightKg ? 'weightKg-error' : undefined}
                        {...register('weightKg')}
                    />
                    {errors.weightKg && (
                        <span id="weightKg-error" role="alert" className="text-red-600 text-sm">
                            {errors.weightKg.message}
                        </span>
                    )}
                </div>
            </div>

            {errors.root && (
                <div role="alert" className="text-red-600 text-sm">
                    {errors.root.message}
                </div>
            )}

            {successMessage && (
                <div role="status" aria-live="polite" className="text-green-600 text-sm">
                    {successMessage}
                </div>
            )}

            <Button type="submit" disabled={isPending || !isDirty} aria-busy={isPending}>
                {isPending ? '更新中...' : '更新する'}
            </Button>
        </form>
    );
};
