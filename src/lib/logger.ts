export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: any;
  userId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  private addLog(level: LogEntry['level'], message: string, context?: any, userId?: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      userId
    };

    this.logs.push(logEntry);
    
    // Keep only the last MAX_LOGS entries
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Also log to console for development
    if (typeof window === 'undefined') {
      // Server-side logging
      console.log(`[${logEntry.timestamp.toISOString()}] [${level.toUpperCase()}] ${message}`, context);
    }
  }

  debug(message: string, context?: any, userId?: string): void {
    this.addLog('debug', message, context, userId);
  }

  info(message: string, context?: any, userId?: string): void {
    this.addLog('info', message, context, userId);
  }

  warn(message: string, context?: any, userId?: string): void {
    this.addLog('warn', message, context, userId);
  }

  error(message: string, context?: any, userId?: string): void {
    this.addLog('error', message, context, userId);
  }

  getLogs(level?: LogEntry['level'], limit: number = 100): LogEntry[] {
    let logs = this.logs;
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    return logs.slice(-limit).reverse(); // Return most recent first
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();