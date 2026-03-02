import { EPGParser, type EPGData } from './epg-parser';
import { priorityMerger } from './priority-merger';
import { logger } from './logger';
import { EPGStore, type EPGSourceData } from './epg-store';

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const MERGED_CACHE_KEY = 'merged_epg_cache';

export async function getCache(kv: KVNamespace): Promise<EPGData | null> {
  const cached = await kv.get<EPGData>(MERGED_CACHE_KEY, { type: 'json' });
  if (!cached || new Date(cached.lastUpdated).getTime() + CACHE_TTL_SECONDS * 1000 < Date.now()) {
    logger.info("Merged EPG cache expired or not found, refreshing in background...");
    // Trigger refresh but don't wait for it
    refreshEPGCache(kv).catch(error => logger.error("Background EPG refresh failed:", error));
    return null; // Return null immediately if expired/not found
  }
  return cached;
}

export async function refreshEPGCache(kv: KVNamespace, force = false): Promise<EPGData | null> {
  const store = new EPGStore(kv);
  
  if (!force) {
    const existingMerged = await kv.get<EPGData>(MERGED_CACHE_KEY, { type: 'json' });
    if (existingMerged && new Date(existingMerged.lastUpdated).getTime() + CACHE_TTL_SECONDS * 1000 > Date.now()) {
      logger.info("Merged cache is still fresh, no refresh needed.");
      return existingMerged; // Cache is still fresh
    }
  }

  logger.info("Starting EPG cache refresh...");
  const parser = new EPGParser();
  const sources = await store.getAllSources();
  const enabledSources = sources.filter(s => s.enabled).sort((a, b) => a.priority - b.priority);

  const fetchedEPGs: EPGData[] = [];
  for (const source of enabledSources) {
    try {
      const data = await parser.parseEPG(source.url);
      const sourceData: EPGSourceData = {
        channels: data.channels.map(c => ({ ...c })),
        programs: data.programs.map(p => ({ ...p, start: p.start.getTime(), stop: p.stop.getTime() })),
        fetchedAt: Date.now(),
      };
      await store.setSourceData(source.id, sourceData);
      await store.updateSource(source.id, {
        lastFetch: Date.now(),
        lastError: null,
        channelCount: data.channels.length,
        programCount: data.programs.length,
      });
      fetchedEPGs.push(data);
      logger.info(`Successfully fetched EPG from ${source.url}`);
    } catch (error) {
      await store.updateSource(source.id, {
        lastFetch: Date.now(),
        lastError: String(error),
      });
      logger.error(`Failed to fetch EPG from ${source.url}:`, error);
    }
  }

  if (fetchedEPGs.length === 0) {
    logger.warn("No EPG data fetched from any source. Attempting to load from KV...");
    const allSourceData = await store.getAllEnabledSourcesData();
    for (const [id, data] of allSourceData.entries()) {
      fetchedEPGs.push({
        channels: data.channels,
        programs: data.programs.map(p => ({ ...p, start: new Date(p.start), stop: new Date(p.stop) })),
        source: (await store.getSource(id))?.url || 'unknown',
        lastUpdated: new Date(data.fetchedAt),
      });
    }

    if (fetchedEPGs.length === 0) {
      logger.warn("No EPG data found in KV or fetched from any source.");
      return null;
    }
  }

  const merged = priorityMerger.mergeEPGData(fetchedEPGs);
  const finalMerged: EPGData = {
    ...merged,
    source: "merged", // Add missing source property
    lastUpdated: new Date(), // Use current time for merged cache update
  };

  await kv.put(MERGED_CACHE_KEY, JSON.stringify(finalMerged), { expirationTtl: CACHE_TTL_SECONDS });
  logger.info(
    `EPG cache refreshed. ${finalMerged.channels.length} channels, ${finalMerged.programs.length} programs.`
  );
  return finalMerged;
}
