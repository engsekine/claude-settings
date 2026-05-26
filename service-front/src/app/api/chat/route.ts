import { GoogleGenAI } from '@google/genai';

const apiKey = process.env['GEMINI_API_KEY'] ?? '';
if (apiKey === '') {
    throw new Error('GEMINI_API_KEY 環境変数が設定されていません');
}

const genai = new GoogleGenAI({ apiKey });

const VALID_ROLES = new Set(['user', 'assistant']);

function isValidMessages(value: unknown): value is { role: 'user' | 'assistant'; content: string }[] {
    if (Array.isArray(value) === false) return false;
    if (value.length === 0) return false;
    return value.every(
        (m: unknown) =>
            typeof m === 'object' &&
            m !== null &&
            'role' in m &&
            'content' in m &&
            typeof (m as Record<string, unknown>)['content'] === 'string' &&
            VALID_ROLES.has((m as Record<string, unknown>)['role'] as string),
    );
}

export async function POST(request: Request) {
    const body: unknown = await request.json().catch(() => null);

    if (
        body === null ||
        typeof body !== 'object' ||
        !('messages' in body) ||
        !isValidMessages((body as Record<string, unknown>)['messages'])
    ) {
        return new Response('リクエスト形式が不正です', { status: 400 });
    }

    const { messages } = body as {
        messages: { role: 'user' | 'assistant'; content: string }[];
    };

    /** Gemini の role は 'user' | 'model' なので変換する */
    const geminiMessages = messages.map(({ role, content }) => ({
        role: role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: content }],
    }));

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
        async start(controller) {
            try {
                const stream = await genai.models.generateContentStream({
                    model: 'gemini-2.5-flash',
                    contents: geminiMessages,
                });

                for await (const chunk of stream) {
                    const text = chunk.text ?? '';
                    if (text !== '') {
                        controller.enqueue(encoder.encode(text));
                    }
                }
                controller.close();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'ストリーミング中にエラーが発生しました';
                controller.enqueue(encoder.encode(`\n\n[エラー]: ${message}`));
                controller.close();
            }
        },
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}
