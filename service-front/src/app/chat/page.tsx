import { ChatView } from '@/features/chat';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata({
    slug: '/chat',
    title: 'チャット',
    description: 'AIチャットアシスタント',
});

export default function ChatPage() {
    return <ChatView />;
}
