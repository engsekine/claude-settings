'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { type SignupFormValues, signupSchema } from '@/features/auth/schemas/signup.schema';
import { signUp } from '@/features/auth/server/actions';
import { DEFAULT_GENDER, GENDER_OPTIONS } from '@/shared/constants/gender';

export const SignupForm = () => {
    const [isPending, startTransition] = useTransition();
    const [sentTo, setSentTo] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<SignupFormValues>({
        resolver: yupResolver(signupSchema),
        defaultValues: { gender: DEFAULT_GENDER },
    });

    const onSubmit = handleSubmit((values) => {
        startTransition(async () => {
            const result = await signUp({
                email: values.email,
                password: values.password,
                lastName: values.lastName,
                firstName: values.firstName,
                lastNameRomaji: values.lastNameRomaji,
                firstNameRomaji: values.firstNameRomaji,
                nickname: values.nickname,
                birthOn: values.birthOn,
                gender: values.gender,
                heightCm: values.heightCm,
                weightKg: values.weightKg,
            });
            if (result.error !== undefined) {
                setError('root', { message: result.error });
                return;
            }
            if (result.needsEmailConfirmation === true) {
                setSentTo(values.email);
            }
        });
    });

    if (sentTo !== null) {
        return (
            <div className="flex flex-col gap-4" role="status" aria-live="polite">
                <h2 className="font-semibold text-lg">確認メールを送信しました</h2>
                <p className="text-muted-foreground text-sm">
                    <span className="font-medium text-foreground">{sentTo}</span> 宛に確認メールを送信しました。
                    <br />
                    メール内のリンクをクリックして登録を完了してください。
                </p>
                <p className="text-muted-foreground text-sm">
                    メールが届かない場合は、迷惑メールフォルダもご確認ください。
                </p>
                <Link href="/login" className="text-muted-foreground text-sm underline hover:text-foreground">
                    ログイン画面に戻る
                </Link>
            </div>
        );
    }

    return (
        <form
            onSubmit={(e) => {
                void onSubmit(e);
            }}
            className="flex flex-col gap-4"
            noValidate
        >
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
                        身長(cm)
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
                        体重(kg)
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

            <div className="flex flex-col gap-1">
                <label htmlFor="email" className="font-medium text-sm">
                    メールアドレス
                </label>
                <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    {...register('email')}
                />
                {errors.email && (
                    <span id="email-error" role="alert" className="text-red-600 text-sm">
                        {errors.email.message}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="password" className="font-medium text-sm">
                    パスワード（6文字以上）
                </label>
                <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    {...register('password')}
                />
                {errors.password && (
                    <span id="password-error" role="alert" className="text-red-600 text-sm">
                        {errors.password.message}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="passwordConfirm" className="font-medium text-sm">
                    パスワード（確認）
                </label>
                <Input
                    id="passwordConfirm"
                    type="password"
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={!!errors.passwordConfirm}
                    aria-describedby={errors.passwordConfirm ? 'passwordConfirm-error' : undefined}
                    {...register('passwordConfirm')}
                />
                {errors.passwordConfirm && (
                    <span id="passwordConfirm-error" role="alert" className="text-red-600 text-sm">
                        {errors.passwordConfirm.message}
                    </span>
                )}
            </div>

            {errors.root && (
                <div role="alert" className="text-red-600 text-sm">
                    {errors.root.message}
                </div>
            )}

            <Button type="submit" disabled={isPending} aria-busy={isPending}>
                {isPending ? '登録中...' : '新規登録'}
            </Button>

            <Link href="/login" className="text-muted-foreground text-sm underline hover:text-foreground">
                ログインはこちら
            </Link>
        </form>
    );
};
