const results = new Map<string, any>();
export function cacheSet(id: string, data: any) { results.set(id, data); }
export function cacheGet(id: string) { return results.get(id) ?? null; }
export function cacheHas(id: string) { return results.has(id); }
