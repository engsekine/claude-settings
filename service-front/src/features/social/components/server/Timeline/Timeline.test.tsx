import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TimelineItem } from '@/features/social/types';
import { Timeline } from './Timeline';

const item = (id: string, diveDate: string): TimelineItem => ({
    diveId: id,
    diveDate,
    location: `ポイント${id}`,
    maxDepthM: 18,
    bottomTimeMin: 40,
    ownerId: `owner-${id}`,
    ownerNickname: `ニック${id}`,
});

describe('Timeline', () => {
    it('空のときはフォローを促す空状態を表示する', () => {
        render(<Timeline items={[]} />);
        expect(screen.getByText(/フォローしてみましょう/)).toBeInTheDocument();
    });

    it('公開ログを日付見出し付きで表示し、詳細へのリンクを張る', () => {
        render(<Timeline items={[item('1', '2026-06-30'), item('2', '2026-06-29')]} />);
        expect(screen.getByText('2026/06/30')).toBeInTheDocument();
        expect(screen.getByText('2026/06/29')).toBeInTheDocument();
        const link = screen.getByRole('link', { name: /ポイント1/ });
        expect(link).toHaveAttribute('href', '/dives/1');
    });

    it('所有者の nickname はプロフィールへリンクし、深度・時間も表示する', () => {
        render(<Timeline items={[item('1', '2026-06-30')]} />);
        const ownerLink = screen.getByRole('link', { name: 'ニック1' });
        expect(ownerLink).toHaveAttribute('href', '/users/owner-1');
        expect(screen.getByText(/最大 18m ・ 40分/, { selector: 'span' })).toBeInTheDocument();
    });
});
