import type { MessageRole } from '../types';

interface StreamChatOptions {
  signal?: AbortSignal;
}

/** ストリーミングでチャットAPIを呼び出す */
export async function* streamChatResponse(
  messages: { role: MessageRole; content: string }[],
  options?: StreamChatOptions,
): AsyncGenerator<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal: options?.signal ?? null,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const maxErrorLength = 200;
    const errorMessage =
      body !== '' && body.length <= maxErrorLength
        ? body
        : `APIエラー: ${response.status}`;
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('レスポンスボディが取得できませんでした');
  }

  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
    /** マルチバイト文字の末尾フラッシュ */
    const remaining = decoder.decode();
    if (remaining !== '') {
      yield remaining;
    }
  } finally {
    reader.releaseLock();
  }
}
