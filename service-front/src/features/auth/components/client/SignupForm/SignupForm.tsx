'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@repo/ui/components/button';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { type SignupFormValues, signupSchema } from '@/features/auth/schemas/signup.schema';
import { signUp } from '@/features/auth/server/actions';
import { FormField, FormRadioGroup } from '@/shared/components/form';
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
            if (!result.success) {
                setError('root', { message: result.error });
                return;
            }
            if (result.needsEmailConfirmation) {
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
                <FormField
                    id="lastName"
                    label="姓"
                    type="text"
                    autoComplete="family-name"
                    aria-required="true"
                    error={errors.lastName?.message}
                    {...register('lastName')}
                />

                <FormField
                    id="firstName"
                    label="名"
                    type="text"
                    autoComplete="given-name"
                    aria-required="true"
                    error={errors.firstName?.message}
                    {...register('firstName')}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <FormField
                    id="lastNameRomaji"
                    label="姓（ローマ字）"
                    type="text"
                    autoComplete="off"
                    placeholder="Yamada"
                    aria-required="true"
                    error={errors.lastNameRomaji?.message}
                    {...register('lastNameRomaji')}
                />

                <FormField
                    id="firstNameRomaji"
                    label="名（ローマ字）"
                    type="text"
                    autoComplete="off"
                    placeholder="Taro"
                    aria-required="true"
                    error={errors.firstNameRomaji?.message}
                    {...register('firstNameRomaji')}
                />
            </div>

            <FormField
                id="nickname"
                label="ニックネーム"
                type="text"
                autoComplete="nickname"
                aria-required="true"
                error={errors.nickname?.message}
                {...register('nickname')}
            />

            <FormField
                id="birthOn"
                label="生年月日"
                type="date"
                autoComplete="bday"
                aria-required="true"
                error={errors.birthOn?.message}
                {...register('birthOn')}
            />

            <FormRadioGroup
                legend="性別"
                options={GENDER_OPTIONS}
                aria-required="true"
                error={errors.gender?.message}
                {...register('gender')}
            />

            <div className="grid grid-cols-2 gap-3">
                <FormField
                    id="heightCm"
                    label="身長(cm)"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={30}
                    max={300}
                    autoComplete="off"
                    error={errors.heightCm?.message}
                    {...register('heightCm')}
                />

                <FormField
                    id="weightKg"
                    label="体重(kg)"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={1}
                    max={500}
                    autoComplete="off"
                    error={errors.weightKg?.message}
                    {...register('weightKg')}
                />
            </div>

            <FormField
                id="email"
                label="メールアドレス"
                type="email"
                autoComplete="email"
                aria-required="true"
                error={errors.email?.message}
                {...register('email')}
            />

            <FormField
                id="password"
                label="パスワード（6文字以上）"
                type="password"
                autoComplete="new-password"
                aria-required="true"
                error={errors.password?.message}
                {...register('password')}
            />

            <FormField
                id="passwordConfirm"
                label="パスワード（確認）"
                type="password"
                autoComplete="new-password"
                aria-required="true"
                error={errors.passwordConfirm?.message}
                {...register('passwordConfirm')}
            />

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
