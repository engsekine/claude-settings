import {
    ReadableStream as NodeReadableStream,
    TransformStream as NodeTransformStream,
    WritableStream as NodeWritableStream,
} from 'node:stream/web';
import '@testing-library/jest-dom/vitest';

Object.defineProperty(globalThis, 'ReadableStream', {
    writable: true,
    configurable: true,
    value: NodeReadableStream,
});
Object.defineProperty(globalThis, 'WritableStream', {
    writable: true,
    configurable: true,
    value: NodeWritableStream,
});
Object.defineProperty(globalThis, 'TransformStream', {
    writable: true,
    configurable: true,
    value: NodeTransformStream,
});
