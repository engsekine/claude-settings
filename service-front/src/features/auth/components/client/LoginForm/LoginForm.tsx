'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import Link from 'next/link';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { type LoginFormValues, loginSchema } from '@/features/auth/schemas/login.schema';
import { signIn } from '@/features/auth/server/actions';

export const LoginForm = () => {
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: yupResolver(loginSchema),
    });

    const onSubmit = handleSubmit((values) => {
        startTransition(async () => {
            const result = await signIn(values.email, values.password);
            if (result?.error) {
                setError('root', { message: result.error });
            }
        });
    });

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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
                    パスワード
                </label>
                <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
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

            {errors.root && (
                <div role="alert" className="text-red-600 text-sm">
                    {errors.root.message}
                </div>
            )}

            <Button type="submit" disabled={isPending} aria-busy={isPending}>
                {isPending ? 'ログイン中...' : 'ログイン'}
            </Button>

            <div className="flex flex-col gap-2 text-muted-foreground text-sm">
                <Link href="/signup" className="underline hover:text-foreground">
                    新規登録はこちら
                </Link>
                <Link href="/reset-password" className="underline hover:text-foreground">
                    パスワードを忘れた方
                </Link>
            </div>
        </form>
    );
};
