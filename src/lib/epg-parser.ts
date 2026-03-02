import { DOMParser } from '@xmldom/xmldom';

export interface Channel {
  id: string;
  displayName: string;
  icon?: string;
  url?: string;
}

export interface Program {
  channel: string;
  start: Date;
  stop: Date;
  title: string;
  desc?: string;
  category?: string[];
  episodeNum?: string;
}

export interface EPGData {
  channels: Channel[];
  programs: Program[];
  source: string;
  lastUpdated: Date;
}

export class EPGParser {
  private async fetchAndParse(url: string): Promise<Document> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type') || '';
      let text = await response.text();
      
      // Handle gzip compression
      if (contentType.includes('gzip') || url.endsWith('.gz')) {
        // For now, we'll assume the server handles decompression
        // In a full implementation, we'd use a gzip library
      }
      
      return new DOMParser().parseFromString(text, 'text/xml');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch or parse EPG from ${url}: ${errorMessage}`);
    }
  }

  private parseChannels(doc: Document): Channel[] {
    const channels: Channel[] = [];
    const channelElements = doc.getElementsByTagName('channel');
    
    for (let i = 0; i < channelElements.length; i++) {
      const channelElement = channelElements[i];
      const id = channelElement.getAttribute('id') || '';
      
      if (!id) continue;
      
      const displayNameElement = channelElement.getElementsByTagName('display-name')[0];
      const displayName = displayNameElement ? displayNameElement.textContent || id : id;
      
      const iconElement = channelElement.getElementsByTagName('icon')[0];
      const icon = iconElement ? iconElement.getAttribute('src') || undefined : undefined;
      
      const urlElement = channelElement.getElementsByTagName('url')[0];
      const url = urlElement ? urlElement.textContent || undefined : undefined;
      
      channels.push({
        id,
        displayName,
        icon,
        url
      });
    }
    
    return channels;
  }

  private parsePrograms(doc: Document): Program[] {
    const programs: Program[] = [];
    const programElements = doc.getElementsByTagName('programme');
    
    for (let i = 0; i < programElements.length; i++) {
      const programElement = programElements[i];
      const channel = programElement.getAttribute('channel') || '';
      
      if (!channel) continue;
      
      const startStr = programElement.getAttribute('start') || '';
      const stopStr = programElement.getAttribute('stop') || '';
      
      // Parse EPG time format (YYYYMMDDHHMMSS +0000)
      const parseEPGTime = (timeStr: string): Date => {
        if (!timeStr) return new Date();
        
        // Remove timezone offset for now
        const cleanTime = timeStr.replace(/[+-]\d{4}$/, '');
        
        if (cleanTime.length !== 14) {
          return new Date();
        }
        
        const year = parseInt(cleanTime.substring(0, 4));
        const month = parseInt(cleanTime.substring(4, 6)) - 1; // JS months are 0-indexed
        const day = parseInt(cleanTime.substring(6, 8));
        const hour = parseInt(cleanTime.substring(8, 10));
        const minute = parseInt(cleanTime.substring(10, 12));
        const second = parseInt(cleanTime.substring(12, 14));
        
        return new Date(year, month, day, hour, minute, second);
      };
      
      const start = parseEPGTime(startStr);
      const stop = parseEPGTime(stopStr);
      
      const titleElement = programElement.getElementsByTagName('title')[0];
      const title = titleElement ? titleElement.textContent || '' : '';
      
      const descElement = programElement.getElementsByTagName('desc')[0];
      const desc = descElement ? descElement.textContent || undefined : undefined;
      
      const categoryElements = programElement.getElementsByTagName('category');
      const category: string[] = [];
      for (let j = 0; j < categoryElements.length; j++) {
        const cat = categoryElements[j].textContent;
        if (cat) category.push(cat);
      }
      
      const episodeNumElement = programElement.getElementsByTagName('episode-num')[0];
      const episodeNum = episodeNumElement ? episodeNumElement.textContent || undefined : undefined;
      
      programs.push({
        channel,
        start,
        stop,
        title,
        desc,
        category,
        episodeNum
      });
    }
    
    return programs;
  }

  async parseEPG(url: string): Promise<EPGData> {
    try {
      const doc = await this.fetchAndParse(url);
      
      const channels = this.parseChannels(doc);
      const programs = this.parsePrograms(doc);
      
      return {
        channels,
        programs,
        source: url,
        lastUpdated: new Date()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse EPG from ${url}: ${errorMessage}`);
    }
  }
}

export const epgParser = new EPGParser();