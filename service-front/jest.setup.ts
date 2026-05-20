import '@testing-library/jest-dom';
import {
    ReadableStream as NodeReadableStream,
    TransformStream as NodeTransformStream,
    WritableStream as NodeWritableStream,
} from 'node:stream/web';

// Polyfill for MSW v2
Object.defineProperty(global, 'ReadableStream', {
    writable: true,
    configurable: true,
    value: NodeReadableStream,
});
Object.defineProperty(global, 'WritableStream', {
    writable: true,
    configurable: true,
    value: NodeWritableStream,
});
Object.defineProperty(global, 'TransformStream', {
    writable: true,
    configurable: true,
    value: NodeTransformStream,
});
