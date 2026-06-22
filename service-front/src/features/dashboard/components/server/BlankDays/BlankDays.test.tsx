import { render, screen } from '@testing-library/react';

import { BlankDays } from './BlankDays';

describe('BlankDays', () => {
    describe('blankDays が 1 以上のとき', () => {
        it('「最後に潜ってから」「日数」「日」が一続きの段落として表示される', () => {
            render(<BlankDays blankDays={45} />);
            const paragraph = screen.getByText(/最後に潜ってから/);
            expect(paragraph).toBeInTheDocument();
            expect(screen.getByText('45')).toBeInTheDocument();
            expect(paragraph).toHaveTextContent('日');
        });

        it('「今日もダイビング日和！」は表示されない', () => {
            render(<BlankDays blankDays={45} />);
            expect(screen.queryByText('今日もダイビング日和！')).not.toBeInTheDocument();
        });

        it('blankDays=1 でも「今日もダイビング日和！」は表示されない', () => {
            render(<BlankDays blankDays={1} />);
            expect(screen.queryByText('今日もダイビング日和！')).not.toBeInTheDocument();
        });
    });

    describe('blankDays=0 のとき', () => {
        it('「0」と「今日もダイビング日和！」が併記される', () => {
            render(<BlankDays blankDays={0} />);
            expect(screen.getByText('0')).toBeInTheDocument();
            expect(screen.getByText('今日もダイビング日和！')).toBeInTheDocument();
        });

        it('段落内に「最後に潜ってから」と「日」が含まれる', () => {
            render(<BlankDays blankDays={0} />);
            const paragraph = screen.getByText(/最後に潜ってから/);
            expect(paragraph).toHaveTextContent('日');
        });
    });
});
