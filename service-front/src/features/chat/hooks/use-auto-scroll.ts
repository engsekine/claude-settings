'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * メッセージリストの自動スクロールを制御するフック
 * ユーザーが上にスクロールしている場合は自動スクロールを無効化する
 */
export const useAutoScroll = <T>(dependency: T) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (!containerRef.current || isUserScrollingRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, []);

  /** スクロール位置を監視して自動スクロールのオン/オフを判定 */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
      isUserScrollingRef.current = !isAtBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  /** 依存値が変更されたら自動スクロール */
  useEffect(() => {
    scrollToBottom();
  }, [dependency, scrollToBottom]);

  return { containerRef, scrollToBottom };
};
