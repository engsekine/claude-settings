# service-front プロジェクト

## アーキテクチャ

設計の詳細は `arch/feature-based.md` に基づく Feature-based アーキテクチャに従う。
コードを生成するときは `arch/` 配下のドキュメントを参照すること。

## 技術スタック

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- React Compiler

## 設計方針

- Server Components をデフォルトとする
- Client Components は `'use client'` で明示的に指定する
- データフェッチは Server Components で行う
- ページ作成時は必ず `generatePageMetadata`（`@/shared/config/metadata`）を使用して `metadata` をエクスポートする
- ページには基本的に `Header` と `Footer`（`@/shared/components/layout`）を含める
