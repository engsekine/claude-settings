import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { Conversation, Message, StreamingStatus } from '../types';

interface ChatStore {
  /** 全会話リスト */
  conversations: Conversation[];
  /** 現在選択中の会話ID */
  activeConversationId: string | null;
  /** ストリーミング状態 */
  streamingStatus: StreamingStatus;

  /** 新しい会話を作成し、アクティブにする */
  createConversation: () => string;
  /** 会話を選択する */
  setActiveConversation: (id: string) => void;
  /** 会話を削除する */
  deleteConversation: (id: string) => void;
  /** 会話のタイトルを更新する */
  updateConversationTitle: (id: string, title: string) => void;
  /** メッセージを追加する */
  addMessage: (conversationId: string, message: Message) => void;
  /** アシスタントメッセージのコンテンツを逐次更新する（ストリーミング用） */
  appendToLastMessage: (conversationId: string, chunk: string) => void;
  /** ストリーミング状態を設定する */
  setStreamingStatus: (status: StreamingStatus) => void;
}

const generateId = () => crypto.randomUUID();

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        conversations: [],
        activeConversationId: null,
        streamingStatus: 'idle',

        createConversation: () => {
          const id = generateId();
          const now = Date.now();
          const conversation: Conversation = {
            id,
            title: '新しいチャット',
            messages: [],
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            conversations: [conversation, ...state.conversations],
            activeConversationId: id,
          }));
          return id;
        },

        setActiveConversation: (id) => {
          set({ activeConversationId: id });
        },

        deleteConversation: (id) => {
          const { conversations, activeConversationId } = get();
          const filtered = conversations.filter((c) => c.id !== id);
          const nextActiveId =
            activeConversationId === id
              ? (filtered[0]?.id ?? null)
              : activeConversationId;
          set({
            conversations: filtered,
            activeConversationId: nextActiveId,
          });
        },

        updateConversationTitle: (id, title) => {
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
            ),
          }));
        },

        addMessage: (conversationId, message) => {
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    messages: [...c.messages, message],
                    updatedAt: Date.now(),
                  }
                : c,
            ),
          }));
        },

        appendToLastMessage: (conversationId, chunk) => {
          set((state) => ({
            conversations: state.conversations.map((c) => {
              if (c.id !== conversationId) return c;
              const messages = [...c.messages];
              const lastMessage = messages[messages.length - 1];
              if (!lastMessage || lastMessage.role !== 'assistant') return c;
              messages[messages.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + chunk,
              };
              return { ...c, messages, updatedAt: Date.now() };
            }),
          }));
        },

        setStreamingStatus: (status) => {
          set({ streamingStatus: status });
        },
      }),
      { name: 'chat-store' },
    ),
    { name: 'ChatStore' },
  ),
);
