'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { requestPasswordReset } from '@/features/auth/server/actions';
import {
    resetPasswordRequestSchema,
    type ResetPasswordRequestFormValues,
} from '@/features/auth/schemas/reset.schema';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export const ResetPasswordForm = () => {
    const [isPending, startTransition] = useTransition();
    const [submitted, setSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordRequestFormValues>({
        resolver: yupResolver(resetPasswordRequestSchema),
    });

    const onSubmit = handleSubmit((values) => {
        startTransition(async () => {
            await requestPasswordReset(values.email);
            setSubmitted(true);
        });
    });

    if (submitted) {
        return (
            <div role="status" aria-live="polite" className="flex flex-col gap-4">
                <p className="text-sm">
                    入力されたメールアドレス宛にリセット用のリンクを送信しました。
                    メールに記載されたリンクから新しいパスワードを設定してください。
                </p>
                <Link href="/login" className="text-sm underline hover:text-foreground">
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

            <Button type="submit" disabled={isPending} aria-busy={isPending}>
                {isPending ? '送信中...' : 'リセットリンクを送信'}
            </Button>

            <Link href="/login" className="text-sm text-muted-foreground underline hover:text-foreground">
                ログイン画面に戻る
            </Link>
        </form>
    );
};
