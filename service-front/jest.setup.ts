import "@testing-library/jest-dom";
import {
    ReadableStream as NodeReadableStream,
    WritableStream as NodeWritableStream,
    TransformStream as NodeTransformStream
} from "node:stream/web";

// Polyfill for MSW v2
Object.defineProperty(global, "ReadableStream", {
    writable: true,
    configurable: true,
    value: NodeReadableStream
});
Object.defineProperty(global, "WritableStream", {
    writable: true,
    configurable: true,
    value: NodeWritableStream
});
Object.defineProperty(global, "TransformStream", {
    writable: true,
    configurable: true,
    value: NodeTransformStream
});

// Mock until-async to avoid ESM issues
jest.mock("until-async", () => ({
    until: jest.fn((fn) => fn())
}));

global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({}),
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers(),
    redirected: false,
    type: "basic",
    url: ""
});
