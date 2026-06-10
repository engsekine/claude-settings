import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/nextjs-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
    stories: ['./*.mdx', '../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: [
        getAbsolutePath('@chromatic-com/storybook'),
        getAbsolutePath('@storybook/addon-vitest'),
        getAbsolutePath('@storybook/addon-a11y'),
        getAbsolutePath('@storybook/addon-docs'),
        getAbsolutePath('@storybook/addon-mcp'),
    ],
    framework: getAbsolutePath('@storybook/nextjs-vite'),
    staticDirs: ['../public'],

    viteFinal: (config) => {
        config.plugins = config.plugins ?? [];
        config.plugins.unshift(tailwindcss());
        return config;
    },
};

export default config;

function getAbsolutePath(value: string): string {
    return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
