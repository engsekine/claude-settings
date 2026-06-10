'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import type { KeyboardEvent, WheelEvent } from 'react';
import { useForm } from 'react-hook-form';

import { type DiveSearchValues, diveSearchSchema } from '@/features/dives/schemas/dive.schema';
import type { DiveListFilter } from '@/features/dives/types';

interface DiveSearchBarProps {
    initialFilter?: DiveListFilter;
    onSubmit: (filter: DiveListFilter) => void;
}

/** number 入力にホイールでフォーカスしたまま値が変わる事故を防ぐ */
const blurOnWheel = (e: WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
};

/** type=number でも 'e' / '+' / '-' / '.' などは入力できてしまうのでブロックする（非負整数用） */
const BLOCKED_INTEGER_KEYS = new Set(['e', 'E', '+', '-', '.', ',']);
const blockNonIntegerKeys = (e: KeyboardEvent<HTMLInputElement>) => {
    if (BLOCKED_INTEGER_KEYS.has(e.key)) {
        e.preventDefault();
    }
};

export const DiveSearchBar = ({ initialFilter, onSubmit: onSubmitFilter }: DiveSearchBarProps) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<DiveSearchValues>({
        resolver: yupResolver(diveSearchSchema),
        defaultValues: {
            diveNumber: initialFilter?.diveNumber ?? null,
            diveDate: initialFilter?.diveDate ?? null,
            location: initialFilter?.location ?? null,
        },
    });

    const onSubmit = handleSubmit((values) => {
        const filter: DiveListFilter = {};
        if (values.diveNumber != null) filter.diveNumber = values.diveNumber;
        if (values.diveDate) filter.diveDate = values.diveDate;
        if (values.location) filter.location = values.location;
        onSubmitFilter(filter);
    });

    const handleClear = () => {
        reset({ diveNumber: null, diveDate: null, location: null });
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
                        <label htmlFor="dive-search-number" className="font-medium text-sm">
                            ダイブ番号
                        </label>
                        <Input
                            id="dive-search-number"
                            type="number"
                            onWheel={blurOnWheel}
                            onKeyDown={blockNonIntegerKeys}
                            inputMode="numeric"
                            min={0}
                            step={1}
                            autoComplete="off"
                            aria-invalid={!!errors.diveNumber}
                            aria-describedby={errors.diveNumber ? 'dive-search-number-error' : undefined}
                            {...register('diveNumber')}
                        />
                        {errors.diveNumber && (
                            <span id="dive-search-number-error" role="alert" className="text-red-600 text-sm">
                                {errors.diveNumber.message}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="dive-search-date" className="font-medium text-sm">
                            潜水日
                        </label>
                        <Input
                            id="dive-search-date"
                            type="date"
                            autoComplete="off"
                            aria-invalid={!!errors.diveDate}
                            aria-describedby={errors.diveDate ? 'dive-search-date-error' : undefined}
                            {...register('diveDate')}
                        />
                        {errors.diveDate && (
                            <span id="dive-search-date-error" role="alert" className="text-red-600 text-sm">
                                {errors.diveDate.message}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="dive-search-location" className="font-medium text-sm">
                            ポイント名（部分一致）
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
