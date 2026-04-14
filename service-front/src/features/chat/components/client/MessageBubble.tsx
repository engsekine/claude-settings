'use client';

import { Bot, User } from 'lucide-react';
import { memo } from 'react';

import { cn } from '@/shared/lib/utils';

import type { Message } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export const MessageBubble = memo(
  ({ message, isStreaming = false }: MessageBubbleProps) => {
    const isUser = message.role === 'user';

    return (
      <div
        className={cn(
          'flex gap-3 px-4 py-4',
          isUser ? 'justify-end' : 'justify-start',
        )}
      >
        {/* アシスタントのアイコン */}
        {!isUser && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </div>
        )}

        {/* メッセージ本文 */}
        <div
          className={cn(
            'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-sm">
              {message.content ? (
                <MarkdownRenderer content={message.content} />
              ) : isStreaming ? (
                <span className="inline-block size-2 animate-pulse rounded-full bg-current" />
              ) : null}
            </div>
          )}
        </div>

        {/* ユーザーのアイコン */}
        {isUser && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <User className="size-5" />
          </div>
        )}
      </div>
    );
  },
);

MessageBubble.displayName = 'MessageBubble';
