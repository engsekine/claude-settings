'use client';

import { MessageSquare } from 'lucide-react';

import { useAutoScroll } from '../../hooks/use-auto-scroll';
import type { Message, StreamingStatus } from '../../types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  streamingStatus: StreamingStatus;
}

export const MessageList = ({ messages, streamingStatus }: MessageListProps) => {
  const { containerRef } = useAutoScroll(messages);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
        <MessageSquare className="size-12 opacity-50" />
        <div className="text-center">
          <p className="text-lg font-medium">メッセージはまだありません</p>
          <p className="text-sm">
            下の入力欄からメッセージを送信してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl py-4">
        {messages.map((message, index) => {
          const isLastAssistant =
            message.role === 'assistant' && index === messages.length - 1;
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={isLastAssistant && streamingStatus === 'streaming'}
            />
          );
        })}
      </div>
    </div>
  );
};
