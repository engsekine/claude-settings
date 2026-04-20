import { ChatView, PAGE_DATA } from '@/features/chat';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(PAGE_DATA);

export default function ChatPage() {
    return <ChatView />;
}
