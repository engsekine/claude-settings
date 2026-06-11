import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { PackingItem } from '@/features/plans/types';

const togglePackingItem = vi.fn();
const addPackingItem = vi.fn();
const deletePackingItem = vi.fn();
const routerRefresh = vi.fn();

vi.mock('@/features/plans/server/actions', () => ({
    togglePackingItem: (...args: unknown[]) => togglePackingItem(...args),
    addPackingItem: (...args: unknown[]) => addPackingItem(...args),
    deletePackingItem: (...args: unknown[]) => deletePackingItem(...args),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh: routerRefresh }),
}));

import { PackingList } from './PackingList';

const createItem = (overrides: Partial<PackingItem> = {}): PackingItem => ({
    id: 'item-1',
    name: 'マスク',
    isChecked: false,
    position: 0,
    ...overrides,
});

const defaultItems: PackingItem[] = [
    createItem({ id: 'item-1', name: 'マスク', isChecked: true, position: 0 }),
    createItem({ id: 'item-2', name: 'フィン', isChecked: false, position: 1 }),
    createItem({ id: 'item-3', name: 'レギュレーター', isChecked: false, position: 2 }),
];

describe('PackingList', () => {
    beforeEach(() => {
        togglePackingItem.mockReset();
        addPackingItem.mockReset();
        deletePackingItem.mockReset();
        routerRefresh.mockReset();
    });

    it('チェック済み件数 / 全件数を aria-live 領域に表示する', () => {
        render(<PackingList planId="plan-1" items={defaultItems} />);

        const progress = screen.getByText(/準備済み/);
        expect(progress).toHaveTextContent('1 / 3 準備済み');
        expect(progress).toHaveAttribute('aria-live', 'polite');
    });

    it('全件チェック済みのとき「準備完了」を表示する', () => {
        const allChecked = defaultItems.map((item) => ({ ...item, isChecked: true }));
        render(<PackingList planId="plan-1" items={allChecked} />);

        expect(screen.getByText('準備完了')).toBeInTheDocument();
    });

    it('全件チェック済みでも 0 件のときは「準備完了」を表示しない', () => {
        render(<PackingList planId="plan-1" items={[]} />);

        expect(screen.getByText(/準備済み/)).toHaveTextContent('0 / 0 準備済み');
        expect(screen.queryByText('準備完了')).not.toBeInTheDocument();
    });

    it('チェックボックスの変更で togglePackingItem を反転値で呼び、成功時に router.refresh する', async () => {
        togglePackingItem.mockResolvedValueOnce({ success: true });
        const user = userEvent.setup();
        render(<PackingList planId="plan-1" items={defaultItems} />);

        await user.click(screen.getByRole('checkbox', { name: 'フィン' }));

        expect(togglePackingItem).toHaveBeenCalledWith('item-2', true);
        expect(routerRefresh).toHaveBeenCalled();
    });

    it('チェック済み項目のチェックボックスを変更すると isChecked=false で呼ぶ', async () => {
        togglePackingItem.mockResolvedValueOnce({ success: true });
        const user = userEvent.setup();
        render(<PackingList planId="plan-1" items={defaultItems} />);

        await user.click(screen.getByRole('checkbox', { name: 'マスク' }));

        expect(togglePackingItem).toHaveBeenCalledWith('item-1', false);
    });

    it('削除ボタンで deletePackingItem を呼び、成功時に router.refresh する', async () => {
        deletePackingItem.mockResolvedValueOnce({ success: true });
        const user = userEvent.setup();
        render(<PackingList planId="plan-1" items={defaultItems} />);

        await user.click(screen.getByRole('button', { name: 'フィン を削除' }));

        expect(deletePackingItem).toHaveBeenCalledWith('item-2');
        expect(routerRefresh).toHaveBeenCalled();
    });

    it('項目名が空のまま追加するとバリデーションエラーを表示し addPackingItem は呼ばれない', async () => {
        const user = userEvent.setup();
        render(<PackingList planId="plan-1" items={defaultItems} />);

        await user.click(screen.getByRole('button', { name: '追加' }));

        expect(await screen.findByText('項目名を入力してください')).toBeInTheDocument();
        expect(addPackingItem).not.toHaveBeenCalled();
    });

    it('項目名を入力して追加すると addPackingItem を呼び、成功時に入力をリセットして router.refresh する', async () => {
        addPackingItem.mockResolvedValueOnce({ success: true, id: 'new-id' });
        const user = userEvent.setup();
        render(<PackingList planId="plan-1" items={defaultItems} />);

        const input = screen.getByLabelText('持ち物を追加');
        await user.type(input, 'カメラ');
        await user.click(screen.getByRole('button', { name: '追加' }));

        expect(addPackingItem).toHaveBeenCalledWith('plan-1', 'カメラ');
        expect(input).toHaveValue('');
        expect(routerRefresh).toHaveBeenCalled();
    });

    it('Server Action が失敗すると role="alert" でエラーを表示し router.refresh しない', async () => {
        togglePackingItem.mockResolvedValueOnce({ success: false, error: 'チェック状態の保存に失敗しました' });
        const user = userEvent.setup();
        render(<PackingList planId="plan-1" items={defaultItems} />);

        await user.click(screen.getByRole('checkbox', { name: 'フィン' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('チェック状態の保存に失敗しました');
        expect(routerRefresh).not.toHaveBeenCalled();
    });
});
