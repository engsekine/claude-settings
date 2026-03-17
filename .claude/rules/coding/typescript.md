# TypeScript コーディング規約

## 型定義

- `any` の使用を禁止する（`unknown` を使用する）
- 型推論できる場合は型注釈を省略してよい
- オブジェクト型は `interface` を基本とし、ユニオン型・交差型には `type` を使用する
- 型名はPascalCase（例: `UserData`, `ApiResponse`）

```typescript
// Bad
const fetchUser = async (id: any): Promise<any> => { ... };

// Good
const fetchUser = async (id: string): Promise<User> => { ... };
```

## null / undefined 安全性

- `strictNullChecks: true` を前提とする
- Optional Chaining (`?.`) と Nullish Coalescing (`??`) を積極的に使用する
- 非nullアサーション (`!`) の使用は最小限にする

```typescript
// Good
const name = user?.profile?.name ?? '名無し';
```

## 非同期処理

- `Promise` より `async/await` を優先する
- エラーハンドリングは `try/catch` で行う
- 並列処理が可能な場合は `Promise.all` を使用する

## Enum / Union型

- 文字列 Enum より Union型を優先する

```typescript
// Union型（推奨）
type Status = 'pending' | 'active' | 'inactive';

// Enum（必要な場合のみ）
enum Direction {
  Up = 'UP',
  Down = 'DOWN',
}
```

## 命名規則

| 対象 | 規則 | 例 |
|------|------|----|
| 変数・関数 | camelCase | `getUserName` |
| クラス・型・インターフェース | PascalCase | `UserService` |
| 定数（イミュータブル） | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| プライベートメンバー | `_` プレフィックス | `_cache` |

## インポート

- インポートは以下の順に並べる（空行で区切る）:
  1. 外部ライブラリ
  2. 内部モジュール（絶対パス）
  3. 相対パス

```typescript
import React from 'react';
import { z } from 'zod';

import { UserService } from '@/services/user';

import { formatDate } from './utils';
```

## その他

- `console.log` は本番コードに残さない（`console.error` / `console.warn` は許可）
- `for...of` を優先し、インデックスループを避ける
- オブジェクトの分割代入を活用する
