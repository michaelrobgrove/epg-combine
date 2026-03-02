import type { Channel, Program } from './epg-parser';

export interface CachedEPGData {
  channels: Channel[];
  programs: Program[];
  channelCount: number;
  programCount: number;
  errors: string[];
  lastUpdated: number; // Unix ms timestamp
  urls: string[];
}

// Module-level cache — shared within the same V8 isolate instance.
// Data persists for the lifetime of the warm isolate.
// On cold starts a new isolate is created and the cache starts empty.
let cache: CachedEPGData | null = null;

export function setCache(data: CachedEPGData): void {
  cache = data;
}

export function getCache(): CachedEPGData | null {
  return cache;
}
