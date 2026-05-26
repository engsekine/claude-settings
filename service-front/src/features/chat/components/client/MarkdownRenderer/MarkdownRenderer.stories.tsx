import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MarkdownRenderer } from './MarkdownRenderer';

const meta = {
    title: 'features/chat/MarkdownRenderer',
    component: MarkdownRenderer,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof MarkdownRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlainText: Story = {
    args: {
        content: 'これは通常の段落です。複数行に渡って書くこともできます。',
    },
};

export const Headings: Story = {
    args: {
        content: ['# 見出し H1', '## 見出し H2', '### 見出し H3', '', '本文がこの後に続きます。'].join('\n'),
    },
};

export const Lists: Story = {
    args: {
        content: [
            '## 順序なし',
            '- りんご',
            '- バナナ',
            '- みかん',
            '',
            '## 順序付き',
            '1. 一番目',
            '2. 二番目',
            '3. 三番目',
        ].join('\n'),
    },
};

export const Links: Story = {
    args: {
        content:
            '安全なリンク: [公式サイト](https://example.com) / 不正リンク（描画されない）: [危険](javascript:alert(1))',
    },
};

export const CodeBlock: Story = {
    args: {
        content: [
            'インラインは `useState` のように表示されます。',
            '',
            '```ts',
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Markdown コードブロックの内容として TS のテンプレートリテラル例を表示するため
            'const greet = (name: string) => `Hello, ${name}`;',
            '```',
        ].join('\n'),
    },
};

export const Table: Story = {
    args: {
        content: [
            '## 比較表',
            '',
            '| プラン | 月額 | 機能 |',
            '|--------|------|------|',
            '| Free   | ¥0   | 基本 |',
            '| Pro    | ¥980 | 全機能 |',
        ].join('\n'),
    },
};

export const Blockquote: Story = {
    args: {
        content: '> これは引用文です。\n> 複数行にわたって書けます。',
    },
};
