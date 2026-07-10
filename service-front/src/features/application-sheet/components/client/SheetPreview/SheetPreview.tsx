'use client';

import { useState } from 'react';

import { Button } from '@/shared/components/ui/Button';

interface SheetPreviewProps {
    /** buildSheetText で生成した全文 */
    text: string;
}

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * 生成テキストの全文表示 + コピー（FR-006）。
 * Clipboard API が使えない環境でも readonly textarea から手動コピーできる。
 */
export const SheetPreview = ({ text }: SheetPreviewProps) => {
    const [copyState, setCopyState] = useState<CopyState>('idle');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyState('copied');
        } catch {
            setCopyState('failed');
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor="sheet-preview-text" className="font-medium text-sm">
                生成テキスト
            </label>
            <textarea
                id="sheet-preview-text"
                className="min-h-96 rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-sm"
                value={text}
                readOnly
            />
            <div className="flex flex-col items-start gap-2">
                <Button
                    type="button"
                    onClick={() => {
                        void handleCopy();
                    }}
                >
                    コピーする
                </Button>
                {/* aria-live 領域は常設して更新を通知する */}
                <span role="status" aria-live="polite" className="text-sky-700 text-sm">
                    {copyState === 'copied' ? 'コピーしました' : ''}
                </span>
                {copyState === 'failed' && (
                    <span role="alert" className="text-red-600 text-sm">
                        コピーできませんでした。テキストを選択して手動でコピーしてください
                    </span>
                )}
            </div>
        </div>
    );
};
