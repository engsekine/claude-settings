import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

const createDive = vi.fn();
const updateDive = vi.fn();
const routerPush = vi.fn();
const routerRefresh = vi.fn();

vi.mock('@/features/dives/server/actions', () => ({
    createDive: (...args: unknown[]) => createDive(...args),
    updateDive: (...args: unknown[]) => updateDive(...args),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
}));

import type { DiveFormValues } from '@/features/dives/schemas/dive.schema';
import { useDiveFormSubmit } from './useDiveFormSubmit';

const buildValues = (overrides: Partial<DiveFormValues> = {}): DiveFormValues =>
    ({
        diveNumber: null,
        diveDate: '2026-04-15',
        entryTime: null,
        exitTime: null,
        location: '伊豆',
        diveType: null,
        weather: null,
        airTempC: null,
        waterTempC: null,
        visibilityM: null,
        wave: null,
        currentCondition: null,
        maxDepthM: 18,
        avgDepthM: null,
        bottomTimeMin: 45,
        tankType: null,
        tankVolumeL: null,
        gasType: null,
        o2Percent: null,
        pressureStartBar: null,
        pressureEndBar: null,
        weightKg: null,
        suitType: null,
        equipmentNotes: null,
        buddyName: null,
        instructorName: null,
        certificationDive: false,
        notes: null,
        ...overrides,
    }) as DiveFormValues;

describe('useDiveFormSubmit', () => {
    beforeEach(() => {
        createDive.mockReset();
        updateDive.mockReset();
        routerPush.mockReset();
        routerRefresh.mockReset();
    });

    it('diveId 未指定（新規作成）で submit すると createDive を呼び詳細ページへ遷移する', async () => {
        createDive.mockResolvedValueOnce({ success: true, id: 'new-id' });
        const { result } = renderHook(() => useDiveFormSubmit());

        act(() => {
            result.current.submit(buildValues());
        });

        await waitFor(() => {
            expect(routerPush).toHaveBeenCalledWith('/dives/new-id');
        });
        expect(createDive).toHaveBeenCalled();
        expect(updateDive).not.toHaveBeenCalled();
        expect(routerRefresh).toHaveBeenCalled();
        expect(result.current.serverError).toBeNull();
    });

    it('createDive がエラーを返すと serverError に反映する', async () => {
        createDive.mockResolvedValueOnce({ success: false, error: '作成に失敗しました' });
        const { result } = renderHook(() => useDiveFormSubmit());

        act(() => {
            result.current.submit(buildValues());
        });

        await waitFor(() => {
            expect(result.current.serverError).toBe('作成に失敗しました');
        });
        expect(routerPush).not.toHaveBeenCalled();
    });

    it('diveId 指定時は updateDive を呼び詳細ページへ遷移する', async () => {
        updateDive.mockResolvedValueOnce({ success: true });
        const { result } = renderHook(() => useDiveFormSubmit('existing-id'));

        act(() => {
            result.current.submit(buildValues());
        });

        await waitFor(() => {
            expect(routerPush).toHaveBeenCalledWith('/dives/existing-id');
        });
        expect(updateDive).toHaveBeenCalledWith('existing-id', expect.any(Object));
        expect(createDive).not.toHaveBeenCalled();
    });

    it('updateDive がエラーを返すと serverError に反映し遷移しない', async () => {
        updateDive.mockResolvedValueOnce({ success: false, error: '更新に失敗しました' });
        const { result } = renderHook(() => useDiveFormSubmit('existing-id'));

        act(() => {
            result.current.submit(buildValues());
        });

        await waitFor(() => {
            expect(result.current.serverError).toBe('更新に失敗しました');
        });
        expect(routerPush).not.toHaveBeenCalled();
    });
});
