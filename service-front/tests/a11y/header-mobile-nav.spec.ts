import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { presetConsent } from './_helpers';

/**
 * HeaderMobileNav（SP ハンバーガーメニュー）の a11y テスト。
 *
 * playwright.config.ts の projects はデスクトップビューポート（Desktop Chrome）のみ定義しているため、
 * `md:hidden` クラスが付いたトリガーは通常スキャンでは display:none となり axe の解析対象外になる。
 * ここではモバイルビューポートを明示的に指定し、Sheet を開いた状態で axe スキャンを行う。
 */

/** supabase/seed.sql のローカル開発専用テストユーザー */
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

test.beforeEach(async ({ context }) => {
    // Cookie 同意バナーが axe スキャンに干渉しないようプリセット（017-cookie-consent）
    await presetConsent(context);
});

test('HeaderMobileNav - トリガー表示状態（メニュー閉） - WCAG 2.1 AA 違反なし', async ({ page }) => {
    // モバイルビューポートに変更（md ブレークポイント 768px 未満）
    await page.setViewportSize({ width: 375, height: 812 });

    // 認証不要の公開ページで検証（ログインフロー不要）
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // トリガーボタンが表示されていることを確認
    await expect(page.getByRole('button', { name: 'メニューを開く' })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

    expect(results.violations).toEqual([]);
});

test('HeaderMobileNav - Sheet 開状態（メニュー開） - WCAG 2.1 AA 違反なし', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // ハンバーガーボタンをクリックして Sheet を開く
    await page.getByRole('button', { name: 'メニューを開く' }).click();

    // Sheet 内の nav が表示されるまで待機
    await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

    expect(results.violations).toEqual([]);
});

test('HeaderMobileNav - 認証済みページでの Sheet 開状態 - WCAG 2.1 AA 違反なし', async ({ page }) => {
    // 認証済みページでのナビゲーション項目が公開ページと異なる場合に備えて検証
    await page.setViewportSize({ width: 375, height: 812 });

    // ログイン
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill(TEST_EMAIL);
    await page.getByLabel('パスワード').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'ログイン', exact: true }).click();
    await page.waitForURL((url) => url.pathname === '/');

    // 認証済みページ（ダッシュボード）でモバイルメニューを開く
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'メニューを開く' }).click();
    await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

    expect(results.violations).toEqual([]);
});
