import { expect, type Page, test } from '@playwright/test';

import { presetConsent } from './a11y/_helpers';

/** Cookie 同意バナーが操作に重ならないようプリセット（017-cookie-consent） */
test.beforeEach(async ({ context }) => {
    await presetConsent(context);
});

/** supabase/seed.sql のローカル開発専用テストユーザー */
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

const login = async (page: Page) => {
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill(TEST_EMAIL);
    await page.getByLabel('パスワード').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'ログイン', exact: true }).click();
    await page.waitForURL((url) => url.pathname === '/');
};

test('申し込みシート: 保存 → 再訪問で手入力項目が復元され、レンタル選択は復元されない（FR-010）', async ({ page }) => {
    await login(page);
    await page.goto('/application-sheet');

    // 手入力項目を入力
    await page.getByLabel('携帯電話').fill('090-1111-2222');
    await page.getByLabel('最寄りの駅').fill('保存テスト駅');

    // レンタル選択・省略トグルは保存対象外であることを確認するため選択しておく
    await page.getByRole('group', { name: 'レンタル器材の有無' }).getByLabel('有').check();
    await page.getByLabel('フィン').check();

    // 保存
    await page.getByRole('button', { name: '入力内容を保存する' }).click();
    await expect(page.getByRole('status').filter({ hasText: '保存しました' })).toBeVisible();

    // 再訪問 → 手入力項目が復元される
    await page.goto('/');
    await page.goto('/application-sheet');
    await expect(page.getByLabel('携帯電話')).toHaveValue('090-1111-2222');
    await expect(page.getByLabel('最寄りの駅')).toHaveValue('保存テスト駅');

    // レンタル有無は毎回未選択に戻り、品目一覧も表示されない
    const rentalGroup = page.getByRole('group', { name: 'レンタル器材の有無' });
    await expect(rentalGroup.getByLabel('有')).not.toBeChecked();
    await expect(rentalGroup.getByLabel('無')).not.toBeChecked();
    await expect(page.getByLabel('フィン')).toHaveCount(0);
});

test('申し込みシート: TOP ダッシュボードの導線から遷移できる（FR-001）', async ({ page }) => {
    await login(page);

    await page.goto('/');
    await page.getByRole('link', { name: '申し込みシートを作る' }).click();
    await page.waitForURL(/\/application-sheet/);
    await expect(page.getByRole('heading', { name: '申し込みシート', level: 1 })).toBeVisible();
});

test('申し込みシート: 未認証アクセスは /login へリダイレクトされる', async ({ page }) => {
    await page.goto('/application-sheet');
    await page.waitForURL(/\/login/);
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
});
