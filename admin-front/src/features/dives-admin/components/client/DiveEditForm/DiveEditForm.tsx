'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@repo/ui/components/button';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { type DiveEditFormValues, diveEditSchema } from '@/features/dives-admin/schemas/dive-edit.schema';
import { updateDive } from '@/features/dives-admin/server/actions';
import { FormField, FormTextarea } from '@/shared/components/form';

interface DiveEditFormProps {
    diveId: string;
    expectedUpdatedAt: string;
    defaultValues: DiveEditFormValues;
}

export const DiveEditForm = ({ diveId, expectedUpdatedAt, defaultValues }: DiveEditFormProps) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<DiveEditFormValues>({
        resolver: yupResolver(diveEditSchema),
        defaultValues,
    });

    const onSubmit = handleSubmit((values) => {
        startTransition(async () => {
            const result = await updateDive(diveId, values, expectedUpdatedAt);
            if (!result.success) {
                setError('root', { message: result.error });
                return;
            }
            router.push(`/dives/${diveId}`);
            router.refresh();
        });
    });

    return (
        <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4" noValidate>
            <FormField
                id="dive_date"
                label="潜水日"
                type="date"
                required
                error={errors.dive_date?.message}
                {...register('dive_date')}
            />
            <FormField
                id="max_depth_m"
                label="最大水深(m)"
                type="number"
                step="0.01"
                required
                error={errors.max_depth_m?.message}
                {...register('max_depth_m')}
            />
            <FormField
                id="bottom_time_min"
                label="潜水時間(分)"
                type="number"
                required
                error={errors.bottom_time_min?.message}
                {...register('bottom_time_min')}
            />
            <FormField id="buddy_name" label="バディ" error={errors.buddy_name?.message} {...register('buddy_name')} />
            <FormTextarea id="notes" label="メモ" error={errors.notes?.message} {...register('notes')} />

            {errors.root && (
                <div role="alert" className="text-red-600 text-sm">
                    {errors.root.message}
                </div>
            )}

            <div className="flex gap-2">
                <Button type="submit" disabled={isPending} aria-busy={isPending}>
                    {isPending ? '保存中...' : '保存'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push(`/dives/${diveId}`)}>
                    キャンセル
                </Button>
            </div>
        </form>
    );
};
