'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { useForm } from 'react-hook-form';

import { type DiveSearchValues, diveSearchSchema } from '@/features/dives/schemas/dive.schema';
import type { DiveListFilter } from '@/features/dives/types';

interface DiveSearchBarProps {
    initialFilter?: DiveListFilter;
    onSubmit: (filter: DiveListFilter) => void;
}

export const DiveSearchBar = ({ initialFilter, onSubmit: onSubmitFilter }: DiveSearchBarProps) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<DiveSearchValues>({
        resolver: yupResolver(diveSearchSchema),
        defaultValues: {
            dateFrom: initialFilter?.dateFrom ?? null,
            dateTo: initialFilter?.dateTo ?? null,
            location: initialFilter?.location ?? null,
        },
    });

    const onSubmit = handleSubmit((values) => {
        const filter: DiveListFilter = {};
        if (values.dateFrom) filter.dateFrom = values.dateFrom;
        if (values.dateTo) filter.dateTo = values.dateTo;
        if (values.location) filter.location = values.location;
        onSubmitFilter(filter);
    });

    const handleClear = () => {
        reset({ dateFrom: null, dateTo: null, location: null });
        onSubmitFilter({});
    };

    return (
        <search aria-label="ダイビングログ検索">
            <form
                onSubmit={(e) => {
                    void onSubmit(e);
                }}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4"
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="dive-search-date-from" className="font-medium text-sm">
                            開始日
                        </label>
                        <Input
                            id="dive-search-date-from"
                            type="date"
                            autoComplete="off"
                            aria-invalid={!!errors.dateFrom}
                            aria-describedby={errors.dateFrom ? 'dive-search-date-from-error' : undefined}
                            {...register('dateFrom')}
                        />
                        {errors.dateFrom && (
                            <span id="dive-search-date-from-error" role="alert" className="text-red-600 text-sm">
                                {errors.dateFrom.message}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="dive-search-date-to" className="font-medium text-sm">
                            終了日
                        </label>
                        <Input
                            id="dive-search-date-to"
                            type="date"
                            autoComplete="off"
                            aria-invalid={!!errors.dateTo}
                            aria-describedby={errors.dateTo ? 'dive-search-date-to-error' : undefined}
                            {...register('dateTo')}
                        />
                        {errors.dateTo && (
                            <span id="dive-search-date-to-error" role="alert" className="text-red-600 text-sm">
                                {errors.dateTo.message}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="dive-search-location" className="font-medium text-sm">
                            エリア / ポイント名
                        </label>
                        <Input
                            id="dive-search-location"
                            type="text"
                            autoComplete="off"
                            placeholder="例: 伊豆"
                            aria-invalid={!!errors.location}
                            aria-describedby={errors.location ? 'dive-search-location-error' : undefined}
                            {...register('location')}
                        />
                        {errors.location && (
                            <span id="dive-search-location-error" role="alert" className="text-red-600 text-sm">
                                {errors.location.message}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button type="submit">検索</Button>
                    <Button type="button" variant="outline" onClick={handleClear}>
                        クリア
                    </Button>
                </div>
            </form>
        </search>
    );
};
