/** メッセージの送信者 */
export type MessageRole = 'user' | 'assistant';

/** 1件のメッセージ */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

/** 会話 */
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

/** チャットAPI へ送信するリクエスト */
export interface ChatRequest {
  conversationId: string;
  messages: { role: MessageRole; content: string }[];
}

/** ストリーミング状態 */
export type StreamingStatus = 'idle' | 'streaming' | 'error';
