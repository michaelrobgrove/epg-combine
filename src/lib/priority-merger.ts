import type { Channel, Program, EPGData } from './epg-parser';

export interface ChannelMapping {
  originalId: string;
  mappedId: string;
  sourceFeed?: string;
}

export interface MergeResult {
  channels: Channel[];
  programs: Program[];
  channelCount: number;
  programCount: number;
  errors: string[];
  lastUpdated: Date;
}

export class PriorityMerger {
  private channelMappings: Map<string, string> = new Map();
  private sourcePriorities: string[] = [];

  setSourcePriorities(urls: string[]): void {
    this.sourcePriorities = [...urls];
  }

  addChannelMapping(originalId: string, mappedId: string, sourceFeed?: string): void {
    const key = sourceFeed ? `${sourceFeed}:${originalId}` : originalId;
    this.channelMappings.set(key, mappedId);
  }

  getChannelMapping(originalId: string, sourceFeed?: string): string {
    const key = sourceFeed ? `${sourceFeed}:${originalId}` : originalId;
    return this.channelMappings.get(key) || originalId;
  }

  mergeEPGData(epgDataList: EPGData[]): MergeResult {
    const errors: string[] = [];
    const channels = new Map<string, Channel>();
    const programs = new Map<string, Program>();
    
    // Process each EPG data source in priority order
    for (let i = 0; i < epgDataList.length; i++) {
      const epgData = epgDataList[i];
      const sourcePriority = this.sourcePriorities.indexOf(epgData.source);
      const isHighPriority = sourcePriority === 0;
      
      try {
        // Merge channels
        for (const channel of epgData.channels) {
          const mappedId = this.getChannelMapping(channel.id, epgData.source);
          
          if (!channels.has(mappedId)) {
            // New channel - add it
            channels.set(mappedId, {
              ...channel,
              id: mappedId
            });
          } else if (isHighPriority) {
            // High priority source - update channel info if it's better
            const existingChannel = channels.get(mappedId)!;
            channels.set(mappedId, {
              ...existingChannel,
              displayName: channel.displayName || existingChannel.displayName,
              icon: channel.icon || existingChannel.icon,
              url: channel.url || existingChannel.url
            });
          }
        }

        // Merge programs with conflict resolution
        for (const program of epgData.programs) {
          const mappedChannelId = this.getChannelMapping(program.channel, epgData.source);
          const programKey = `${mappedChannelId}:${program.start.getTime()}:${program.stop.getTime()}`;
          
          if (!programs.has(programKey)) {
            // New program slot - add it
            programs.set(programKey, {
              ...program,
              channel: mappedChannelId
            });
          } else {
            // Conflict - resolve based on priority
            const existingProgram = programs.get(programKey)!;
            const existingPriority = this.sourcePriorities.indexOf(existingProgram.channel);
            const currentPriority = this.sourcePriorities.indexOf(program.channel);
            
            // Keep the program from the higher priority source
            if (currentPriority < existingPriority) {
              programs.set(programKey, {
                ...program,
                channel: mappedChannelId
              });
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error processing ${epgData.source}: ${errorMessage}`);
      }
    }

    return {
      channels: Array.from(channels.values()),
      programs: Array.from(programs.values()),
      channelCount: channels.size,
      programCount: programs.size,
      errors,
      lastUpdated: new Date()
    };
  }

  // Method to find overlapping programs and resolve conflicts
  private resolveTimeConflicts(programs: Program[]): Program[] {
    const result: Program[] = [];
    const channelGroups = new Map<string, Program[]>();
    
    // Group programs by channel
    for (const program of programs) {
      if (!channelGroups.has(program.channel)) {
        channelGroups.set(program.channel, []);
      }
      channelGroups.get(program.channel)!.push(program);
    }
    
    // Sort and resolve conflicts for each channel
    for (const [channelId, channelPrograms] of channelGroups) {
      // Sort by start time
      channelPrograms.sort((a, b) => a.start.getTime() - b.start.getTime());
      
      for (let i = 0; i < channelPrograms.length; i++) {
        const currentProgram = channelPrograms[i];
        let shouldAdd = true;
        
        // Check for overlaps with previous programs
        for (let j = i - 1; j >= 0; j--) {
          const previousProgram = channelPrograms[j];
          
          // Check if current program overlaps with previous
          if (currentProgram.start < previousProgram.stop) {
            // Overlap detected - keep the one from higher priority source
            const currentPriority = this.sourcePriorities.indexOf(currentProgram.channel);
            const previousPriority = this.sourcePriorities.indexOf(previousProgram.channel);
            
            if (currentPriority >= previousPriority) {
              shouldAdd = false;
              break;
            }
          } else {
            break; // No more overlaps possible due to sorting
          }
        }
        
        if (shouldAdd) {
          result.push(currentProgram);
        }
      }
    }
    
    return result;
  }

  // Method to validate EPG data
  validateEPGData(epgData: EPGData): string[] {
    const errors: string[] = [];
    
    // Check for duplicate channels
    const channelIds = new Set<string>();
    for (const channel of epgData.channels) {
      if (channelIds.has(channel.id)) {
        errors.push(`Duplicate channel ID: ${channel.id}`);
      }
      channelIds.add(channel.id);
    }
    
    // Check for invalid programs
    for (const program of epgData.programs) {
      if (program.start >= program.stop) {
        errors.push(`Invalid program time range for ${program.title} on ${program.channel}`);
      }
      
      if (!program.title) {
        errors.push(`Program missing title on ${program.channel}`);
      }
    }
    
    return errors;
  }
}

export const priorityMerger = new PriorityMerger();