import type { Metadata } from 'next';

import { ChatView } from '@/features/chat';

export const metadata: Metadata = {
  title: 'チャット',
  description: 'AIチャットアシスタント',
};

export default function ChatPage() {
  return <ChatView />;
}
