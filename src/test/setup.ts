import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Polyfill ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver = MockResizeObserver;

// Polyfill scrollIntoView for cmdk / Radix dialog
if (typeof window !== "undefined" && window.HTMLElement) {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

// Polyfill localStorage
const storageStore: Record<string, string> = {};
const storageMock: Storage = {
  clear() {
    for (const key of Object.keys(storageStore)) {
      delete storageStore[key];
    }
  },
  getItem(key: string) {
    return Object.prototype.hasOwnProperty.call(storageStore, key) ? storageStore[key] : null;
  },
  setItem(key: string, value: string) {
    storageStore[key] = String(value);
  },
  removeItem(key: string) {
    delete storageStore[key];
  },
  get length() {
    return Object.keys(storageStore).length;
  },
  key(index: number) {
    return Object.keys(storageStore)[index] ?? null;
  },
};

Object.defineProperty(window, "localStorage", {
  value: storageMock,
  writable: true,
});
Object.defineProperty(globalThis, "localStorage", {
  value: storageMock,
  writable: true,
});
