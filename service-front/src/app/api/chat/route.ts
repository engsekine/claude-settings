import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({
    apiKey: process.env['GEMINI_API_KEY'] ?? '',
});

export async function POST(request: Request) {
    const { messages } = (await request.json()) as {
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
                    if (text) {
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
