/**
 * CSS Module を Jest でテストするためのモック。
 * `import styles from './foo.module.css'` のような import に対して、
 * `styles.foo` でアクセスされたキー名（'foo'）をそのまま文字列で返す。
 *
 * identity-obj-proxy の置き換え。メンテ停止していたため自前実装。
 */
const cssModuleMock = new Proxy(
    {},
    {
        get: (_target, prop) => {
            if (prop === '__esModule') return false;
            return typeof prop === 'string' ? prop : '';
        },
    },
);

export default cssModuleMock;
