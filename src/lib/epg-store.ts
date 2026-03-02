// Cloudflare KV-backed persistent storage for EPG sources and cached data

export interface EPGSource {
  id: string; // unique identifier (hash of URL)
  url: string;
  enabled: boolean;
  priority: number; // lower = higher priority
  lastFetch: number | null; // Unix ms
  lastError: string | null;
  channelCount: number;
  programCount: number;
  addedAt: number; // Unix ms
}

export interface EPGSourceData {
  channels: Array<{
    id: string;
    displayName: string;
    icon?: string;
    url?: string;
  }>;
  programs: Array<{
    channel: string;
    start: number; // Unix ms
    stop: number;
    title: string;
    desc?: string;
    category?: string[];
    episodeNum?: string;
  }>;
  fetchedAt: number;
}

const KV_PREFIX_SOURCE = 'epg_source:';
const KV_PREFIX_DATA = 'epg_data:';
const KV_KEY_SOURCES_LIST = 'epg_sources_list';

/** Generate a stable ID from a URL */
export function urlToId(url: string): string {
  // Simple hash - could use crypto.subtle.digest for better collisions
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const chr = url.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export class EPGStore {
  constructor(private kv: KVNamespace) {}

  async getAllSources(): Promise<EPGSource[]> {
    const list = await this.kv.get<string[]>(KV_KEY_SOURCES_LIST, { type: 'json' });
    if (!list || list.length === 0) return [];
    
    const sources = await Promise.all(
      list.map((id: string) => this.kv.get<EPGSource>(`${KV_PREFIX_SOURCE}${id}`, { type: 'json' }))
    );
    return sources.filter((s): s is EPGSource => s !== null);
  }

  async getSource(id: string): Promise<EPGSource | null> {
    return this.kv.get<EPGSource>(`${KV_PREFIX_SOURCE}${id}`, { type: 'json' });
  }

  async getSourceByUrl(url: string): Promise<EPGSource | null> {
    const id = urlToId(url);
    return this.getSource(id);
  }

  async addSource(url: string, priority?: number): Promise<EPGSource> {
    const id = urlToId(url);
    const existing = await this.getSource(id);
    
    if (existing) {
      return existing; // Already exists
    }

    const sources = await this.getAllSources();
    const maxPriority = sources.length > 0 ? Math.max(...sources.map(s => s.priority)) : 0;

    const source: EPGSource = {
      id,
      url,
      enabled: true,
      priority: priority ?? maxPriority + 1,
      lastFetch: null,
      lastError: null,
      channelCount: 0,
      programCount: 0,
      addedAt: Date.now(),
    };

    await this.kv.put(`${KV_PREFIX_SOURCE}${id}`, JSON.stringify(source));
    
    const list = await this.kv.get<string[]>(KV_KEY_SOURCES_LIST, { type: 'json' }) ?? [];
    list.push(id);
    await this.kv.put(KV_KEY_SOURCES_LIST, JSON.stringify(list));

    return source;
  }

  async updateSource(id: string, updates: Partial<EPGSource>): Promise<EPGSource | null> {
    const source = await this.getSource(id);
    if (!source) return null;

    const updated = { ...source, ...updates };
    await this.kv.put(`${KV_PREFIX_SOURCE}${id}`, JSON.stringify(updated));
    return updated;
  }

  async deleteSource(id: string): Promise<boolean> {
    const source = await this.getSource(id);
    if (!source) return false;

    await this.kv.delete(`${KV_PREFIX_SOURCE}${id}`);
    await this.kv.delete(`${KV_PREFIX_DATA}${id}`);

    const list = (await this.kv.get<string[]>(KV_KEY_SOURCES_LIST, { type: 'json' })) ?? [];
    const filtered = list.filter((i: string) => i !== id);
    await this.kv.put(KV_KEY_SOURCES_LIST, JSON.stringify(filtered));

    return true;
  }

  async getSourceData(id: string): Promise<EPGSourceData | null> {
    return this.kv.get<EPGSourceData>(`${KV_PREFIX_DATA}${id}`, { type: 'json' });
  }

  async setSourceData(id: string, data: EPGSourceData): Promise<void> {
    await this.kv.put(`${KV_PREFIX_DATA}${id}`, JSON.stringify(data));
  }

  async getAllEnabledSourcesData(): Promise<Map<string, EPGSourceData>> {
    const sources = await this.getAllSources();
    const enabled = sources.filter(s => s.enabled).sort((a, b) => a.priority - b.priority);
    
    const dataPromises = enabled.map(async s => {
      const data = await this.getSourceData(s.id);
      return { id: s.id, data };
    });

    const results = await Promise.all(dataPromises);
    const map = new Map<string, EPGSourceData>();
    for (const { id, data } of results) {
      if (data) map.set(id, data);
    }
    return map;
  }
}
