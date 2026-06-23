/**
 * Lightweight pub/sub for streaming token content.
 * Completely bypasses React state / Zustand so streaming never triggers
 * component re-renders. StageCards subscribe and update their DOM nodes directly.
 */
type Listener = (text: string) => void;

const registry = new Map<string, Set<Listener>>();

export const streamingStore = {
  emit(key: string, text: string) {
    registry.get(key)?.forEach((fn) => fn(text));
  },

  subscribe(key: string, fn: Listener): () => void {
    if (!registry.has(key)) registry.set(key, new Set());
    registry.get(key)!.add(fn);
    return () => registry.get(key)?.delete(fn);
  },

  clear(key: string) {
    registry.get(key)?.forEach((fn) => fn(''));
    registry.delete(key);
  },

  clearAll() {
    registry.forEach((_, key) => streamingStore.clear(key));
  },
};
