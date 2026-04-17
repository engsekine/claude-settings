'use client';

import { useCallback, useRef } from 'react';

import { streamChatResponse } from '../api/chat-api';
import { useChatStore } from '../stores/chat-store';
import type { Message } from '../types';

const generateId = () => crypto.randomUUID();

/** 最初のユーザーメッセージから会話タイトルを生成する */
const generateTitle = (content: string): string => {
  const maxLength = 30;
  const trimmed = content.replace(/\n/g, ' ').trim();
  return trimmed.length > maxLength
    ? `${trimmed.slice(0, maxLength)}...`
    : trimmed;
};

export const useChat = () => {
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const streamingStatus = useChatStore((s) => s.streamingStatus);
  const createConversation = useChatStore((s) => s.createConversation);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendToLastMessage = useChatStore((s) => s.appendToLastMessage);
  const setStreamingStatus = useChatStore((s) => s.setStreamingStatus);
  const updateConversationTitle = useChatStore((s) => s.updateConversationTitle);

  const abortControllerRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      /** 会話がなければ新規作成 */
      const conversationId = activeConversationId ?? createConversation();

      /** ユーザーメッセージを追加 */
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        createdAt: Date.now(),
      };
      addMessage(conversationId, userMessage);

      /** 最初のメッセージならタイトルを更新 */
      const conversation = useChatStore
        .getState()
        .conversations.find((c) => c.id === conversationId);
      if (conversation?.messages.length === 1) {
        updateConversationTitle(conversationId, generateTitle(trimmed));
      }

      /** アシスタントの空メッセージを追加（ストリーミング先） */
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      };
      addMessage(conversationId, assistantMessage);
      setStreamingStatus('streaming');

      /** APIリクエスト用のメッセージ履歴を構築 */
      const apiMessages = useChatStore
        .getState()
        .conversations.find((c) => c.id === conversationId)!
        .messages.filter((m) => m.content !== '')
        .map(({ role, content }) => ({ role, content }));

      /** AbortController を生成してストリーミングに渡す */
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        for await (const chunk of streamChatResponse(apiMessages, {
          signal: abortController.signal,
        })) {
          appendToLastMessage(conversationId, chunk);
        }
        setStreamingStatus('idle');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setStreamingStatus('idle');
        } else {
          console.error('ストリーミングエラー:', error);
          setStreamingStatus('error');
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [
      activeConversationId,
      createConversation,
      addMessage,
      appendToLastMessage,
      setStreamingStatus,
      updateConversationTitle,
    ],
  );

  /** ストリーミングを中断する */
  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    messages: activeConversation?.messages ?? [],
    streamingStatus,
    sendMessage,
    stopStreaming,
  };
};
