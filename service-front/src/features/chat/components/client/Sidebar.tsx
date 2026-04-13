'use client';

import { MessageSquarePlus, PanelLeftClose, PanelLeftOpen, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useChatStore } from '../../stores/chat-store';

export const Sidebar = () => {
  const {
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    deleteConversation,
  } = useChatStore();

  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* 折りたたみ時のトグルボタン */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="fixed left-3 top-3 z-20"
          aria-label="サイドバーを開く"
        >
          <PanelLeftOpen className="size-5" />
        </Button>
      )}

      {/* サイドバー本体 */}
      <aside
        className={cn(
          'flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200',
          isOpen ? 'w-64' : 'w-0 overflow-hidden',
        )}
        aria-label="会話履歴"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsOpen(false)}
            aria-label="サイドバーを閉じる"
          >
            <PanelLeftClose className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => createConversation()}
            aria-label="新しいチャットを作成"
          >
            <MessageSquarePlus className="size-5" />
          </Button>
        </div>

        {/* 会話リスト */}
        <nav className="flex-1 overflow-y-auto p-2" aria-label="会話一覧">
          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              まだ会話がありません
            </p>
          ) : (
            <ul role="list" className="space-y-1">
              {conversations.map((conversation) => (
                <li
                  key={conversation.id}
                  className={cn(
                    'group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                    conversation.id === activeConversationId
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'hover:bg-sidebar-accent/50',
                  )}
                >
                  <button
                    onClick={() => setActiveConversation(conversation.id)}
                    className="min-w-0 flex-1 truncate text-left"
                    aria-current={
                      conversation.id === activeConversationId
                        ? 'true'
                        : undefined
                    }
                  >
                    {conversation.title}
                  </button>
                  <button
                    onClick={() => deleteConversation(conversation.id)}
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`「${conversation.title}」を削除`}
                  >
                    <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>
    </>
  );
};
