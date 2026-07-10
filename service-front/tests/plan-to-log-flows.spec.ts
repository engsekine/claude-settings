import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { presetConsent } from './a11y/_helpers';

/**
 * spec 024 quickstart の E2E 検証。
 * - S1: 当日以前の予定からログへ移動できる（作成 +1 / 予定 -1）
 * - S3: 必須の潜水データ未入力では移動が確定しない
 * - S2: 未来日の予定には移動導線が出ない（一覧・詳細）
 * S5（部分失敗）/ S6（重複防止）は Server Action の Vitest で担保する。
 */

/** supabase/seed.sql のローカル開発専用テストユーザー */
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

// ダイブ番号の一意制約衝突を避けるため直列実行する
test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ context }) => {
    await presetConsent(context);
});

const login = async (page: Page) => {
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill(TEST_EMAIL);
    await page.getByLabel('パスワード').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'ログイン', exact: true }).click();
    await page.waitForURL((url) => url.pathname === '/');
};

/** 予定を 1 件作成し、作成後の詳細ページ（/plans/{id}）で止まる */
const createPlan = async (page: Page, plannedOn: string, location: string) => {
    await page.goto('/plans/new');
    await page.getByLabel(/予定日/).fill(plannedOn);
    await page.getByLabel(/ポイント名/).fill(location);
    await page.getByRole('button', { name: '作成する' }).click();
    await page.waitForURL(/\/plans\/[0-9a-f-]+$/);
};

test('S1: 当日以前の予定をログへ移動できる（引き継ぎ + 予定削除）', async ({ page }) => {
    await login(page);

    const location = 'S1 予定→ログ移動の検証';
    await createPlan(page, '2024-06-30', location);

    // 予定詳細の「ログに記録する」から新規ログフォームへ
    await page.getByRole('link', { name: `${location}の予定をログに記録する` }).click();
    await page.waitForURL(/\/dives\/new\?fromPlanId=/);

    // 予定日・ポイント名が引き継がれている
    await expect(page.getByLabel(/ポイント名/)).toHaveValue(location);
    await expect(page.getByLabel(/潜水日/)).toHaveValue('2024-06-30');

    // 必須の潜水データを入力（ダイブ番号は衝突回避のため明示）
    await page.getByLabel('ダイブ番号').fill('9241');
    await page.getByLabel(/最大水深/).fill('18');
    await page.getByLabel(/潜水時間/).fill('45');
    await page.getByRole('button', { name: '作成する' }).click();

    // ログ詳細へ遷移し、作成されたログが表示される
    await page.waitForURL(/\/dives\/[0-9a-f-]+$/);
    await expect(page.getByText(location)).toBeVisible();

    // 元の予定は消えている
    await page.goto('/plans');
    await expect(page.getByText(location)).toHaveCount(0);
});

test('S3: 必須の潜水データ未入力では移動が確定しない', async ({ page }) => {
    await login(page);

    const location = 'S3 必須未入力の検証';
    await createPlan(page, '2024-06-30', location);
    await page.getByRole('link', { name: `${location}の予定をログに記録する` }).click();
    await page.waitForURL(/\/dives\/new\?fromPlanId=/);

    // 最大水深を空にして保存 → バリデーションで弾かれ遷移しない
    await page.getByLabel(/最大水深/).fill('');
    await page.getByRole('button', { name: '作成する' }).click();

    await expect(page).toHaveURL(/\/dives\/new\?fromPlanId=/);

    // 後始末: 予定は残っているので削除する
    await page.goto('/plans');
    await expect(page.getByText(location)).toBeVisible();
});

test('S2: 未来日の予定には移動導線が出ない（一覧・詳細）', async ({ page }) => {
    await login(page);

    const location = 'S2 未来日ゲートの検証';
    await createPlan(page, '2099-12-01', location);

    // 詳細ページに「ログに記録する」が無い
    await expect(page.getByRole('link', { name: /ログに記録する/ })).toHaveCount(0);

    // 一覧でも当該予定に導線が無い
    await page.goto('/plans');
    await expect(page.getByRole('link', { name: `${location}の予定をログに記録する` })).toHaveCount(0);

    // a11y: 導線を含む一覧に WCAG 2.1 AA 違反がない
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);

    // 後始末
    await page.getByRole('link', { name: location }).click();
    await page.waitForURL(/\/plans\/[0-9a-f-]+$/);
    await page.getByRole('button', { name: /削除/ }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: /削除/ }).click();
    await page.waitForURL(/\/plans$/);
});
