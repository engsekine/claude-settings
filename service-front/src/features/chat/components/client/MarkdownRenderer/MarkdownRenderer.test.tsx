import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from './MarkdownRenderer';

describe('MarkdownRenderer', () => {
    it('段落として通常テキストをレンダリングする', () => {
        render(<MarkdownRenderer content="これは本文です。" />);

        expect(screen.getByText('これは本文です。')).toBeInTheDocument();
    });

    it('Markdown 見出しを h1〜h3 として展開する', () => {
        const content = ['# H1 見出し', '## H2 見出し', '### H3 見出し'].join('\n\n');
        render(<MarkdownRenderer content={content} />);

        expect(screen.getByRole('heading', { level: 1, name: 'H1 見出し' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'H2 見出し' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: 'H3 見出し' })).toBeInTheDocument();
    });

    it('順序付き / 順序なしリストをレンダリングする', () => {
        const content = ['- りんご', '- バナナ', '', '1. 一番目', '2. 二番目'].join('\n');
        render(<MarkdownRenderer content={content} />);

        expect(screen.getByText('りんご')).toBeInTheDocument();
        expect(screen.getByText('一番目')).toBeInTheDocument();
    });

    it('安全なリンク（https / mailto / 相対パス）はアンカーとして展開する', () => {
        const content = '[公式サイト](https://example.com)';
        render(<MarkdownRenderer content={content} />);

        const link = screen.getByRole('link', { name: '公式サイト' });
        expect(link).toHaveAttribute('href', 'https://example.com');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('危険なスキーム（javascript:）のリンクはアンカーにせず span として描画する', () => {
        const content = '[クリック](javascript:alert(1))';
        render(<MarkdownRenderer content={content} />);

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.getByText('クリック')).toBeInTheDocument();
    });

    it('インラインコードとコードブロックを別スタイルで描画する', () => {
        const content = ['インラインの `code` を含む文。', '', '```', 'block code', '```'].join('\n');
        const { container } = render(<MarkdownRenderer content={content} />);

        expect(screen.getByText('code')).toBeInTheDocument();
        const pre = container.querySelector('pre');
        expect(pre).not.toBeNull();
        expect(pre?.textContent).toContain('block code');
    });

    it('GFM テーブル記法を <table> としてレンダリングする', () => {
        const content = ['| 列A | 列B |', '|------|------|', '| a1   | b1   |'].join('\n');
        render(<MarkdownRenderer content={content} />);

        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: '列A' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'a1' })).toBeInTheDocument();
    });

    it('blockquote をレンダリングする', () => {
        render(<MarkdownRenderer content="> 引用テキスト" />);

        const quote = screen.getByText('引用テキスト').closest('blockquote');
        expect(quote).not.toBeNull();
    });
});
