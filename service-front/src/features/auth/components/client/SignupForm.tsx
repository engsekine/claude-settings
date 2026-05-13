'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { signUp } from '@/features/auth/server/actions';
import { signupSchema, type SignupFormValues } from '@/features/auth/schemas/signup.schema';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

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
    });

    const onSubmit = handleSubmit((values) => {
        startTransition(async () => {
            const result = await signUp(values.email, values.password);
            if (result?.error) {
                setError('root', { message: result.error });
                return;
            }
            if (result?.needsEmailConfirmation) {
                setSentTo(values.email);
            }
        });
    });

    if (sentTo) {
        return (
            <div className="flex flex-col gap-4" role="status" aria-live="polite">
                <h2 className="text-lg font-semibold">確認メールを送信しました</h2>
                <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{sentTo}</span> 宛に確認メールを送信しました。
                    <br />
                    メール内のリンクをクリックして登録を完了してください。
                </p>
                <p className="text-sm text-muted-foreground">
                    メールが届かない場合は、迷惑メールフォルダもご確認ください。
                </p>
                <Link
                    href="/login"
                    className="text-sm text-muted-foreground underline hover:text-foreground"
                >
                    ログイン画面に戻る
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium">
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
                    <span id="email-error" role="alert" className="text-sm text-red-600">
                        {errors.email.message}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm font-medium">
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
                    <span id="password-error" role="alert" className="text-sm text-red-600">
                        {errors.password.message}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="passwordConfirm" className="text-sm font-medium">
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
                    <span id="passwordConfirm-error" role="alert" className="text-sm text-red-600">
                        {errors.passwordConfirm.message}
                    </span>
                )}
            </div>

            {errors.root && (
                <div role="alert" className="text-sm text-red-600">
                    {errors.root.message}
                </div>
            )}

            <Button type="submit" disabled={isPending} aria-busy={isPending}>
                {isPending ? '登録中...' : '新規登録'}
            </Button>

            <Link href="/login" className="text-sm text-muted-foreground underline hover:text-foreground">
                ログインはこちら
            </Link>
        </form>
    );
};
