import type { Message } from '../types';

import { useChatStore } from './chat-store';

const buildMessage = (overrides: Partial<Message> = {}): Message => ({
    id: 'msg-1',
    role: 'user',
    content: 'hello',
    createdAt: 1_700_000_000_000,
    ...overrides,
});

describe('useChatStore', () => {
    beforeEach(() => {
        useChatStore.setState({
            conversations: [],
            activeConversationId: null,
            streamingStatus: 'idle',
        });
    });

    describe('createConversation', () => {
        it('新しい会話を先頭に追加してアクティブにする', () => {
            const id = useChatStore.getState().createConversation();
            const state = useChatStore.getState();

            expect(state.conversations).toHaveLength(1);
            expect(state.conversations[0]?.id).toBe(id);
            expect(state.conversations[0]?.title).toBe('新しいチャット');
            expect(state.conversations[0]?.messages).toEqual([]);
            expect(state.activeConversationId).toBe(id);
        });

        it('複数作成すると新しいものが先頭に来る', () => {
            const first = useChatStore.getState().createConversation();
            const second = useChatStore.getState().createConversation();

            const ids = useChatStore.getState().conversations.map((c) => c.id);
            expect(ids).toEqual([second, first]);
        });
    });

    describe('setActiveConversation', () => {
        it('指定 ID をアクティブにする', () => {
            const a = useChatStore.getState().createConversation();
            const b = useChatStore.getState().createConversation();

            useChatStore.getState().setActiveConversation(a);
            expect(useChatStore.getState().activeConversationId).toBe(a);

            useChatStore.getState().setActiveConversation(b);
            expect(useChatStore.getState().activeConversationId).toBe(b);
        });
    });

    describe('deleteConversation', () => {
        it('指定 ID を削除する', () => {
            const a = useChatStore.getState().createConversation();
            const b = useChatStore.getState().createConversation();

            useChatStore.getState().deleteConversation(a);

            const state = useChatStore.getState();
            expect(state.conversations.map((c) => c.id)).toEqual([b]);
        });

        it('アクティブな会話を削除すると先頭の会話がアクティブになる', () => {
            const a = useChatStore.getState().createConversation();
            const b = useChatStore.getState().createConversation();
            useChatStore.getState().setActiveConversation(a);

            useChatStore.getState().deleteConversation(a);

            expect(useChatStore.getState().activeConversationId).toBe(b);
        });

        it('最後の会話を削除するとアクティブは null になる', () => {
            const a = useChatStore.getState().createConversation();
            useChatStore.getState().deleteConversation(a);

            expect(useChatStore.getState().activeConversationId).toBeNull();
        });

        it('非アクティブな会話を削除してもアクティブは維持される', () => {
            const a = useChatStore.getState().createConversation();
            const b = useChatStore.getState().createConversation();
            useChatStore.getState().setActiveConversation(a);

            useChatStore.getState().deleteConversation(b);

            expect(useChatStore.getState().activeConversationId).toBe(a);
        });
    });

    describe('updateConversationTitle', () => {
        it('指定 ID のタイトルを更新する', () => {
            const id = useChatStore.getState().createConversation();
            useChatStore.getState().updateConversationTitle(id, '新しいタイトル');

            const conversation = useChatStore.getState().conversations.find((c) => c.id === id);
            expect(conversation?.title).toBe('新しいタイトル');
        });

        it('存在しない ID を指定しても他の会話は変更されない', () => {
            const id = useChatStore.getState().createConversation();
            const before = useChatStore.getState().conversations[0]?.title;

            useChatStore.getState().updateConversationTitle('not-exist', 'X');

            expect(useChatStore.getState().conversations[0]?.title).toBe(before);
            expect(useChatStore.getState().conversations[0]?.id).toBe(id);
        });
    });

    describe('addMessage', () => {
        it('指定の会話にメッセージを追加する', () => {
            const id = useChatStore.getState().createConversation();
            const message = buildMessage({ id: 'm1', content: 'hi' });

            useChatStore.getState().addMessage(id, message);

            const conversation = useChatStore.getState().conversations.find((c) => c.id === id);
            expect(conversation?.messages).toEqual([message]);
        });

        it('別の会話のメッセージは影響を受けない', () => {
            const a = useChatStore.getState().createConversation();
            const b = useChatStore.getState().createConversation();
            useChatStore.getState().addMessage(a, buildMessage({ id: 'm-a' }));

            const conversationB = useChatStore.getState().conversations.find((c) => c.id === b);
            expect(conversationB?.messages).toEqual([]);
        });
    });

    describe('appendToLastMessage', () => {
        it('最後の assistant メッセージにチャンクを追記する', () => {
            const id = useChatStore.getState().createConversation();
            useChatStore.getState().addMessage(id, buildMessage({ role: 'user', content: 'Q' }));
            useChatStore.getState().addMessage(id, buildMessage({ id: 'a1', role: 'assistant', content: 'A' }));

            useChatStore.getState().appendToLastMessage(id, 'BC');

            const messages = useChatStore.getState().conversations.find((c) => c.id === id)?.messages;
            expect(messages?.[1]?.content).toBe('ABC');
        });

        it('最後が user メッセージなら何もしない', () => {
            const id = useChatStore.getState().createConversation();
            useChatStore.getState().addMessage(id, buildMessage({ role: 'user', content: 'Q' }));

            useChatStore.getState().appendToLastMessage(id, 'X');

            const messages = useChatStore.getState().conversations.find((c) => c.id === id)?.messages;
            expect(messages?.[0]?.content).toBe('Q');
        });

        it('対象外の会話 ID なら何もしない', () => {
            const id = useChatStore.getState().createConversation();
            useChatStore.getState().addMessage(id, buildMessage({ role: 'assistant', content: 'A' }));

            useChatStore.getState().appendToLastMessage('not-exist', 'X');

            const messages = useChatStore.getState().conversations.find((c) => c.id === id)?.messages;
            expect(messages?.[0]?.content).toBe('A');
        });
    });

    describe('setStreamingStatus', () => {
        it('ストリーミング状態を更新する', () => {
            useChatStore.getState().setStreamingStatus('streaming');
            expect(useChatStore.getState().streamingStatus).toBe('streaming');

            useChatStore.getState().setStreamingStatus('error');
            expect(useChatStore.getState().streamingStatus).toBe('error');

            useChatStore.getState().setStreamingStatus('idle');
            expect(useChatStore.getState().streamingStatus).toBe('idle');
        });
    });
});
