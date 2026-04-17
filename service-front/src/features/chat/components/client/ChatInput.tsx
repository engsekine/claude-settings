'use client';

import { ArrowUp, Square } from 'lucide-react';
import { type KeyboardEvent, useCallback, useRef, useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

import type { StreamingStatus } from '../../types';

interface ChatInputProps {
  onSend: (message: string) => void | Promise<void>;
  onStop: () => void;
  streamingStatus: StreamingStatus;
}

export const ChatInput = ({ onSend, onStop, streamingStatus }: ChatInputProps) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = streamingStatus === 'streaming';
  const canSend = value.trim().length > 0 && !isStreaming;

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    await onSend(value);
    setValue('');

    /** テキストエリアの高さをリセット */
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [canSend, value, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    /** Enter で送信、Shift+Enter で改行 */
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void handleSend();
    }
  };

  /** テキストエリアの高さを自動調整 */
  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-muted/50 px-4 py-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            rows={1}
            disabled={isStreaming}
            className={cn(
              'max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent text-sm leading-6 outline-none',
              'placeholder:text-muted-foreground',
              'disabled:opacity-50',
            )}
            aria-label="チャットメッセージ入力"
          />

          {isStreaming ? (
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={onStop}
              aria-label="生成を停止"
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon-sm"
              onClick={() => void handleSend()}
              disabled={!canSend}
              aria-label="メッセージを送信"
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Claude は間違えることがあります。重要な情報は確認してください。
        </p>
      </div>
    </div>
  );
};
