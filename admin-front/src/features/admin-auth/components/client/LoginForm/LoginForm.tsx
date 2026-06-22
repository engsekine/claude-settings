'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@repo/ui/components/button';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { type LoginFormValues, loginSchema } from '@/features/admin-auth/schemas/login.schema';
import { signInAdmin } from '@/features/admin-auth/server/actions';
import { FormField } from '@/shared/components/form';

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
            /** 成功時は signInAdmin 内で redirect されるため、戻り値を受け取るのは失敗時のみ */
            const result = await signInAdmin(values.email, values.password);
            if (!result.success) {
                setError('root', { message: result.error });
            }
        });
    });

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <FormField
                id="email"
                label="メールアドレス"
                type="email"
                autoComplete="email"
                required
                error={errors.email?.message}
                {...register('email')}
            />

            <FormField
                id="password"
                label="パスワード"
                type="password"
                autoComplete="current-password"
                required
                error={errors.password?.message}
                {...register('password')}
            />

            {errors.root && (
                <div role="alert" className="text-red-600 text-sm">
                    {errors.root.message}
                </div>
            )}

            <Button type="submit" disabled={isPending} aria-busy={isPending}>
                {isPending ? 'ログイン中...' : 'ログイン'}
            </Button>
        </form>
    );
};
