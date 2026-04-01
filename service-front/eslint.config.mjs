import nextEslintPluginNext from "@next/eslint-plugin-next";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsEslintParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginSecurity from "eslint-plugin-security";
import pluginJest from "eslint-plugin-jest";
import pluginTestingLibrary from "eslint-plugin-testing-library";
import pluginJsdoc from "eslint-plugin-jsdoc";

export default [
    {
        ignores: [
            "**/storybook-static/**",
            "**/.next/**",
            "**/node_modules/**",
            "**/public/mockServiceWorker.js",
            "**/playwright-report/**",
            "**/test-results/**"
        ]
    },
    {
        files: ["**/*.{js,mjs,cjs,ts,jsx,tsx,mts,cts}"],
        languageOptions: {
            parser: tsEslintParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true
                },
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname
            }
        },
        plugins: {
            "@next/next": nextEslintPluginNext,
            "@typescript-eslint": tsEslintPlugin,
            react: eslintPluginReact,
            "react-hooks": eslintPluginReactHooks,
            import: importPlugin,
            "jsx-a11y": jsxA11y,
            security: pluginSecurity,
            jsdoc: pluginJsdoc
        },
        settings: {
            react: {
                version: "detect" // Reactバージョン自動検出
            },
            "import/resolver": {
                typescript: {
                    project: "./tsconfig.json"
                },
                node: true
            }
        },
        rules: {
            // Next.js推奨ルール
            ...nextEslintPluginNext.configs.recommended.rules,
            ...nextEslintPluginNext.configs["core-web-vitals"].rules,

            // TypeScript推奨ルール
            ...tsEslintPlugin.configs.recommended.rules,

            // カスタムルール
            "object-shorthand": "error",
            "react/jsx-curly-brace-presence": "error",
            "react/self-closing-comp": [
                "error",
                {
                    component: true,
                    html: false
                }
            ],
            "no-console": ["error", { allow: ["warn", "error"] }],
            "@typescript-eslint/unbound-method": "off",
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "error",

            // コード品質
            "no-duplicate-imports": "error",
            "no-param-reassign": "error",
            "prefer-const": "error",
            "prefer-template": "error",
            eqeqeq: ["error", "always"],

            // TypeScript厳格化
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_"
                }
            ],
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-unnecessary-type-assertion": "error",
            "@typescript-eslint/prefer-nullish-coalescing": "error",
            "@typescript-eslint/prefer-optional-chain": "error",
            "@typescript-eslint/strict-boolean-expressions": "error",

            // インポート整理
            "sort-imports": [
                "error",
                {
                    ignoreCase: false,
                    ignoreDeclarationSort: true,
                    ignoreMemberSort: false,
                    memberSyntaxSortOrder: ["none", "all", "multiple", "single"]
                }
            ],
            "import/order": [
                "error",
                {
                    groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
                    "newlines-between": "always",
                    alphabetize: { order: "asc" }
                }
            ],

            // React/Next.js最適化
            "react/jsx-no-target-blank": "error",
            "react/jsx-key": "error",
            "react/prop-types": "off",
            "@next/next/no-img-element": "error",
            "react/jsx-no-constructed-context-values": "warn",
            "react/hook-use-state": "error",
            "@next/next/no-html-link-for-pages": "error",

            // アクセシビリティ
            ...jsxA11y.configs.recommended.rules,
            "jsx-a11y/anchor-is-valid": [
                "error",
                {
                    components: ["Link"],
                    specialLink: ["hrefLeft", "hrefRight"],
                    aspects: ["invalidHref", "preferButton"]
                }
            ],
            "jsx-a11y/no-autofocus": "warn",

            // TypeScript型ベースのルール
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/no-misused-promises": "error",

            // async/await関連
            "no-async-promise-executor": "error",
            "require-await": "error",
            "no-return-await": "off",
            "@typescript-eslint/return-await": "error",

            // パフォーマンス最適化
            "react/jsx-no-bind": [
                "warn",
                {
                    allowArrowFunctions: true,
                    allowBind: false
                }
            ],

            // セキュリティ
            "security/detect-object-injection": "warn",
            "security/detect-non-literal-regexp": "warn",
            "security/detect-unsafe-regex": "error",

            // JSDoc
            "jsdoc/require-jsdoc": "off",
            "jsdoc/check-alignment": "warn",
            "jsdoc/check-indentation": "warn"
        }
    },
    // テストファイル用の設定
    {
        files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
        plugins: {
            jest: pluginJest,
            "testing-library": pluginTestingLibrary
        },
        rules: {
            ...pluginJest.configs.recommended.rules,
            ...pluginTestingLibrary.configs.react.rules
        }
    },
    // Prettierとの競合ルールを無効化（最後に配置）
    eslintConfigPrettier
];
