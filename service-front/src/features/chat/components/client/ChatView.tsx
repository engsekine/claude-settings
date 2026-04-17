'use client';

import { useChat } from '../../hooks/use-chat';
import { useChatStore } from '../../stores/chat-store';

import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { Sidebar } from './Sidebar';

export const ChatView = () => {
    const { messages, streamingStatus, sendMessage, stopStreaming } = useChat();
    const setStreamingStatus = useChatStore((s) => s.setStreamingStatus);

    return (
        <div className="flex h-screen">
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col">
                <MessageList messages={messages} streamingStatus={streamingStatus} />
                {streamingStatus === 'error' && (
                    <div className="flex items-center justify-center gap-3 border-t border-destructive/20 bg-destructive/5 px-4 py-2" role="alert">
                        <p className="text-sm text-destructive">
                            メッセージの生成中にエラーが発生しました
                        </p>
                        <button
                            type="button"
                            onClick={() => setStreamingStatus('idle')}
                            className="rounded-md bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive hover:bg-destructive/20"
                        >
                            閉じる
                        </button>
                    </div>
                )}
                <ChatInput onSend={sendMessage} onStop={stopStreaming} streamingStatus={streamingStatus} />
            </main>
        </div>
    );
};
