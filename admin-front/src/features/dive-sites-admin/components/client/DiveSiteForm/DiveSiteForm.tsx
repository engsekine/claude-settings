'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@repo/ui/components/button';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { type DiveSiteFormValues, diveSiteSchema } from '@/features/dive-sites-admin/schemas/dive-site.schema';
import { createDiveSite, updateDiveSite } from '@/features/dive-sites-admin/server/actions';
import { FormField, FormTextarea } from '@/shared/components/form';

interface DiveSiteFormProps {
    mode: 'create' | 'edit';
    /** edit 時の対象 ID */
    siteId?: string;
    /** edit 時の楽観ロック用 updated_at */
    expectedUpdatedAt?: string;
    defaultValues?: Partial<DiveSiteFormValues>;
}

export const DiveSiteForm = ({ mode, siteId, expectedUpdatedAt, defaultValues }: DiveSiteFormProps) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<DiveSiteFormValues>({
        resolver: yupResolver(diveSiteSchema),
        defaultValues: { name: '', area: '', country: 'JP', description: '', ...defaultValues },
    });

    const onSubmit = handleSubmit((values) => {
        startTransition(async () => {
            const result =
                mode === 'edit' && siteId && expectedUpdatedAt
                    ? await updateDiveSite(siteId, values, expectedUpdatedAt)
                    : await createDiveSite(values);

            if (!result.success) {
                setError('root', { message: result.error });
                return;
            }
            router.push('/dive-sites');
            router.refresh();
        });
    });

    return (
        <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4" noValidate>
            <FormField id="name" label="名称" required error={errors.name?.message} {...register('name')} />
            <FormField id="area" label="エリア" error={errors.area?.message} {...register('area')} />
            <FormField
                id="country"
                label="国コード"
                required
                error={errors.country?.message}
                {...register('country')}
            />
            <FormTextarea
                id="description"
                label="説明"
                error={errors.description?.message}
                {...register('description')}
            />

            {errors.root && (
                <div role="alert" className="text-red-600 text-sm">
                    {errors.root.message}
                </div>
            )}

            <div className="flex gap-2">
                <Button type="submit" disabled={isPending} aria-busy={isPending}>
                    {isPending ? '保存中...' : '保存'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/dive-sites')}>
                    キャンセル
                </Button>
            </div>
        </form>
    );
};
