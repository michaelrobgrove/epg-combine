export interface Session {
  id: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

class AuthManager {
  private sessions = new Map<string, Session>();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifyCredentials(username: string, password: string): Promise<boolean> {
    const expectedUsername = import.meta.env.ADMIN_USERNAME;
    const [expectedPasswordHash, passwordHash] = await Promise.all([
      this.hashPassword(import.meta.env.ADMIN_PASSWORD),
      this.hashPassword(password)
    ]);
    
    return username === expectedUsername && passwordHash === expectedPasswordHash;
  }

  createSession(username: string): Session {
    const session: Session = {
      id: crypto.randomUUID(),
      username,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.SESSION_TIMEOUT
    };
    
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    return session;
  }

  invalidateSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
      }
    }
  }
}

export const authManager = new AuthManager();