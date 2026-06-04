// Empty stub aliased in place of the real `server-only` package during tests.
// In production the real package throws if a server module is bundled for the
// client; under Vitest we deliberately exercise those modules in isolation.
export {};
