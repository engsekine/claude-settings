# PHP コーディング規約

## 基本方針

- PSR-12 コーディングスタンダードに準拠する
- PHP 8.0以上を前提とする
- 型宣言を積極的に使用する

## 命名規則

| 対象 | 規則 | 例 |
|------|------|----|
| クラス | PascalCase | `UserService` |
| メソッド・関数 | camelCase | `getUserById` |
| 変数 | camelCase | `$userName` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| プロパティ | camelCase | `$isActive` |

## 型宣言

- 引数・戻り値に型宣言を必ず付ける
- `nullable` は `?型名` で表現する
- PHP 8.0以上: `union型`、`mixed`、`null` を活用する

```php
// Good
function findUser(int $id): ?User
{
    return User::find($id);
}

function processData(string|array $data): array
{
    // ...
}
```

## クラス設計

- 1ファイル1クラスを基本とする
- クラスはオープン/クローズド原則に従う
- コンストラクタインジェクションで依存性を注入する

```php
class UserService
{
    public function __construct(
        private readonly UserRepository $repository,
        private readonly MailService $mailService,
    ) {}

    public function register(RegisterUserDto $dto): User
    {
        // ...
    }
}
```

## エラーハンドリング

- 例外は具体的なクラスを使用する（`\Exception` の直接スローは避ける）
- カスタム例外クラスは `Exception` を継承し、ドメインに応じて分類する

```php
// Bad
throw new \Exception('User not found');

// Good
throw new UserNotFoundException("User with ID {$id} was not found");
```

## 配列

- 短縮配列構文 `[]` を使用する（`array()` は使わない）
- 配列の末尾にカンマをつける（trailing comma）

```php
$config = [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'myapp',
];
```

## データベース

- SQL インジェクション対策として、バインドパラメータを必ず使用する
- ORM / クエリビルダーを使用する場合も、生SQLは最小限にする

## セキュリティ

- ユーザー入力は必ずバリデーション・サニタイズする
- パスワードは `password_hash()` / `password_verify()` を使用する
- セッションは `session_regenerate_id(true)` でセッション固定攻撃を防ぐ
- XSS 対策として出力時に `htmlspecialchars()` を使用する（テンプレートエンジンの自動エスケープを推奨）

## その他

- `var_dump` / `print_r` は本番コードに残さない
- ファイルの末尾に改行を1つ入れる
- PHP タグは `<?php` のみ使用する（短縮タグ `<?` は禁止）
