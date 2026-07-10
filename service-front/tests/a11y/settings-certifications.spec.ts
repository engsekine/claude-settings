import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { presetConsent } from './_helpers';

/** a11y スイープでバナーが重ならないよう同意済み Cookie をプリセット（017-cookie-consent） */
test.beforeEach(async ({ context }) => {
    await presetConsent(context);
});

/** supabase/seed.sql のローカル開発専用テストユーザー */
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

const expectNoViolations = async (page: Page) => {
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
};

test('/settings/certifications 系 3 画面 - WCAG 2.1 AA 違反なし（要認証）', async ({ page }) => {
    // ログイン
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill(TEST_EMAIL);
    await page.getByLabel('パスワード').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'ログイン', exact: true }).click();
    await page.waitForURL((url) => url.pathname === '/');

    // 一覧（空状態 or 既存データあり、いずれも検証対象）
    await page.goto('/settings/certifications');
    await expectNoViolations(page);

    // 新規登録フォーム
    await page.goto('/settings/certifications/new');
    await expectNoViolations(page);

    // 1 件登録: 指導団体 PADI・資格ランク・取得日を入力して送信
    await page.getByLabel('指導団体').selectOption('padi');
    await page.getByLabel('資格ランク').fill('a11y テスト用資格');
    await page.getByLabel('取得日').fill('2023-04-01');
    await page.getByRole('button', { name: '登録する' }).click();
    await page.waitForURL('/settings/certifications');

    // 一覧に戻った直後（登録済みカードが表示された状態）を再検証
    await expectNoViolations(page);

    // 編集画面: 一覧の「編集」リンクから動的ルート /settings/certifications/[id]/edit へ遷移
    await page.getByRole('link', { name: '編集' }).first().click();
    await page.waitForURL(/\/settings\/certifications\/[0-9a-f-]+\/edit$/);
    await expectNoViolations(page);

    // 後始末: 一覧に戻り、登録した資格を削除
    await page.goto('/settings/certifications');
    await page.getByRole('button', { name: '削除' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: '削除する' }).click();
    await page.waitForLoadState('networkidle');
});
