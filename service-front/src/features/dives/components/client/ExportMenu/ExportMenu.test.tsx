import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

let currentSearch = '';
vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(currentSearch),
}));

import { ExportMenu } from './ExportMenu';

describe('ExportMenu', () => {
    beforeEach(() => {
        currentSearch = '';
    });

    it('初期はメニューが閉じている（aria-expanded=false）', () => {
        render(<ExportMenu />);
        expect(screen.getByRole('button', { name: 'エクスポート' })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('クリックで CSV / PDF のメニューを開く', async () => {
        const user = userEvent.setup();
        render(<ExportMenu />);

        await user.click(screen.getByRole('button', { name: 'エクスポート' }));

        expect(screen.getByRole('button', { name: 'エクスポート' })).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('menuitem', { name: /CSV/ })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /PDF/ })).toBeInTheDocument();
    });

    it('現在の絞り込み条件を引き継いだ export URL を生成する', async () => {
        currentSearch = 'date_from=2025-01-01&type=boat';
        const user = userEvent.setup();
        render(<ExportMenu />);

        await user.click(screen.getByRole('button', { name: 'エクスポート' }));

        const csv = screen.getByRole('menuitem', { name: /CSV/ });
        const href = csv.getAttribute('href') ?? '';
        expect(href).toContain('/dives/export?');
        expect(href).toContain('format=csv');
        expect(href).toContain('date_from=2025-01-01');
        expect(href).toContain('type=boat');
    });

    it('selectedIds 指定時は ids を載せ、フィルタは引き継がない', async () => {
        currentSearch = 'type=boat';
        const user = userEvent.setup();
        render(<ExportMenu selectedIds={['id-1', 'id-2']} />);

        await user.click(screen.getByRole('button', { name: 'エクスポート' }));

        const pdf = screen.getByRole('menuitem', { name: /PDF/ });
        const href = pdf.getAttribute('href') ?? '';
        expect(href).toContain('ids=id-1%2Cid-2');
        expect(href).toContain('format=pdf');
        expect(href).not.toContain('type=boat');
    });

    it('disabled のときボタンが無効', () => {
        render(<ExportMenu disabled />);
        expect(screen.getByRole('button', { name: 'エクスポート' })).toBeDisabled();
    });

    it('Escape でメニューを閉じる', async () => {
        const user = userEvent.setup();
        render(<ExportMenu />);

        await user.click(screen.getByRole('button', { name: 'エクスポート' }));
        expect(screen.getByRole('menu')).toBeInTheDocument();

        await user.keyboard('{Escape}');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
});
