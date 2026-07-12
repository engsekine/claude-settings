import { expect, type Page, test } from '@playwright/test';

import { presetConsent } from './a11y/_helpers';

/**
 * プロフィール URL のニックネーム化（034）の E2E 検証。quickstart.md のシナリオに対応する。
 * - US1: ニックネーム URL での表示・導線・404・大文字小文字解決
 * - US2: ID 形式 URL の恒久転送（seed の固定 uuid を使用）
 * - US3: ニックネーム変更と URL の追随・登録禁則
 */

/** supabase/seed.sql のローカル開発専用テストユーザー（nickname: たろう） */
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';
/** 2 人目のテストユーザー（固定 uuid / nickname: buddy-taro） */
const BUDDY_ID = '000000bd-0000-0000-0000-000000000002';
const BUDDY_NICKNAME = 'buddy-taro';

const login = async (page: Page) => {
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill(TEST_EMAIL);
    await page.getByLabel('パスワード').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'ログイン', exact: true }).click();
    await page.waitForURL((url) => url.pathname === '/');
};

test.beforeEach(async ({ context, page }) => {
    await presetConsent(context);
    await login(page);
});

// US1: ニックネーム URL での表示（quickstart シナリオ 1）
test('ニックネーム URL でプロフィールが表示される（日本語・英数字とも）', async ({ page }) => {
    // 英数字ニックネーム
    await page.goto(`/users/${BUDDY_NICKNAME}`);
    await expect(page.getByRole('heading', { name: BUDDY_NICKNAME })).toBeVisible();

    // 日本語ニックネーム（エンコードされた URL）
    await page.goto(`/users/${encodeURIComponent('たろう')}`);
    await expect(page.getByRole('heading', { name: 'たろう' })).toBeVisible();
});

test('ヘッダーのマイプロフィールからニックネーム URL で遷移する', async ({ page }) => {
    await page.getByRole('button', { name: 'アカウントメニューを開く' }).click();
    await page.getByRole('link', { name: /マイプロフィール/ }).click();

    // seed のサインアップ metadata に nickname が入っているためニックネーム URL になる
    await page.waitForURL((url) => decodeURIComponent(url.pathname) === '/users/たろう');
    await expect(page.getByRole('heading', { name: 'たろう' })).toBeVisible();
});

test('followers / following もニックネーム基準の URL で表示される', async ({ page }) => {
    await page.goto(`/users/${BUDDY_NICKNAME}/followers`);
    await expect(page.getByRole('heading', { name: `${BUDDY_NICKNAME} さんのフォロワー` })).toBeVisible();

    await page.goto(`/users/${BUDDY_NICKNAME}/following`);
    await expect(page.getByRole('heading', { name: `${BUDDY_NICKNAME} さんのフォロー中` })).toBeVisible();
});

test('大文字小文字だけが異なる URL は同一ユーザーに解決される（FR-002）', async ({ page }) => {
    await page.goto(`/users/${BUDDY_NICKNAME.toUpperCase()}`);
    await expect(page.getByRole('heading', { name: BUDDY_NICKNAME })).toBeVisible();
});

test('存在しないニックネームの URL は 404 になる（FR-008）', async ({ page }) => {
    const response = await page.goto('/users/no-such-user-xyz');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('お探しのページが見つかりませんでした')).toBeVisible();
});

// US2: ID 形式 URL の互換転送（quickstart シナリオ 2）
test('ID 形式の URL はニックネーム URL へ転送される（FR-004）', async ({ page }) => {
    await page.goto(`/users/${BUDDY_ID}`);
    await page.waitForURL((url) => url.pathname === `/users/${BUDDY_NICKNAME}`);
    await expect(page.getByRole('heading', { name: BUDDY_NICKNAME })).toBeVisible();

    // 下層パス（followers）も維持して転送される
    await page.goto(`/users/${BUDDY_ID}/followers`);
    await page.waitForURL((url) => url.pathname === `/users/${BUDDY_NICKNAME}/followers`);
});

test('存在しない uuid の URL は 404 になる', async ({ page }) => {
    const response = await page.goto('/users/00000000-0000-0000-0000-00000000dead');
    expect(response?.status()).toBe(404);
});

// US3: ニックネーム変更と URL の追随（quickstart シナリオ 3・4）。
// 並列実行中の他テスト（buddy-taro 依存）と干渉しないよう、リネーム専用ユーザーで実施し最後に戻す
const RENAME_EMAIL = 'rename@example.com';
const RENAME_ID = '000000ce-0000-0000-0000-000000000003';
const RENAME_NICKNAME = 'rename-saburo';

const changeNickname = async (page: Page, nickname: string) => {
    await page.goto('/settings/profile');
    await page.getByLabel(/ニックネーム/).fill(nickname);
    await page.getByRole('button', { name: '更新する' }).click();
    await expect(page.getByText('プロフィールを更新しました')).toBeVisible({ timeout: 15_000 });
};

test('ニックネーム変更で URL が追随し、旧ニックネームは無効・ID URL は転送される（US3）', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await presetConsent(context);
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill(RENAME_EMAIL);
    await page.getByLabel('パスワード').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'ログイン', exact: true }).click();
    await page.waitForURL((url) => url.pathname === '/');

    const NEW_NICKNAME = 'rename-shiro';
    await changeNickname(page, NEW_NICKNAME);

    try {
        // 新しいニックネーム URL で表示できる（SC-004）
        await page.goto(`/users/${NEW_NICKNAME}`);
        await expect(page.getByRole('heading', { name: NEW_NICKNAME })).toBeVisible();

        // 旧ニックネームの URL は 404（FR-007）
        const oldResponse = await page.goto(`/users/${RENAME_NICKNAME}`);
        expect(oldResponse?.status()).toBe(404);

        // ID 形式 URL は新しいニックネーム URL へ転送される（ID 経由は変更に影響されない）
        await page.goto(`/users/${RENAME_ID}`);
        await page.waitForURL((url) => url.pathname === `/users/${NEW_NICKNAME}`);

        // ヘッダーのマイプロフィールも新ニックネーム URL になる（metadata 同期。リロードで SSR セッションに反映）
        await page.goto('/');
        await page.getByRole('button', { name: 'アカウントメニューを開く' }).click();
        await expect(page.getByRole('link', { name: /マイプロフィール/ })).toHaveAttribute(
            'href',
            `/users/${NEW_NICKNAME}`,
        );
    } finally {
        // 後始末: ニックネームを元に戻す
        await changeNickname(page, RENAME_NICKNAME);
        await context.close();
    }
});

test('URL に使えないニックネームへの変更は拒否される（FR-006）', async ({ page }) => {
    await page.goto('/settings/profile');

    for (const invalid of ['search', 'a/b', '00000000-0000-0000-0000-00000000dead']) {
        await page.getByLabel(/ニックネーム/).fill(invalid);
        await page.getByRole('button', { name: '更新する' }).click();
        await expect(
            page.getByText(/このニックネームは使用できません|ニックネームに \/ \? # % \\ は使用できません/),
        ).toBeVisible();
    }
});
