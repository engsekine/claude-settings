'use client';

import { useChat } from '../../hooks/use-chat';

import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { Sidebar } from './Sidebar';

export const ChatView = () => {
    const { messages, streamingStatus, sendMessage, stopStreaming } = useChat();

    return (
        <div className="flex h-screen">
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col">
                <MessageList messages={messages} streamingStatus={streamingStatus} />
                <ChatInput onSend={sendMessage} onStop={stopStreaming} streamingStatus={streamingStatus} />
            </main>
        </div>
    );
};
