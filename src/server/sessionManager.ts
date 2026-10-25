import crypto from 'crypto';
import { UserRecord } from './foundationStore';

export interface UserSession {
  sessionId: string;
  userId: number;
  username: string;
  roleCodes: string[];
  installerPartyId?: number | null;
  ip: string;
  userAgent: string;
  csrfToken: string;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
}

export interface FailedLoginAttempt {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  blockedUntil?: number;
}

// Configurable constants
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours of inactivity
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes lockout
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

class SessionManager {
  private sessions = new Map<string, UserSession>();
  private failedAttempts = new Map<string, FailedLoginAttempt>();

  // Generate cryptographically secure token (64 hex characters / 256 bits)
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Parse Cookie header
  public parseCookies(cookieHeader?: string): Record<string, string> {
    if (!cookieHeader) return {};
    const list: Record<string, string> = {};
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const key = pair.substring(0, idx).trim();
        const val = pair.substring(idx + 1).trim();
        list[key] = decodeURIComponent(val);
      }
    }
    return list;
  }

  // Create an independent session
  public createSession(
    user: UserRecord,
    roles: string[],
    ip: string = '127.0.0.1',
    userAgent: string = 'unknown'
  ): UserSession {
    const now = Date.now();
    const sessionId = this.generateToken();
    const csrfToken = this.generateToken();

    const session: UserSession = {
      sessionId,
      userId: user.id,
      username: user.username,
      roleCodes: roles,
      installerPartyId: user.installerPartyId,
      ip,
      userAgent,
      csrfToken,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  // Retrieve and validate session
  public getSession(sessionId?: string): UserSession | null {
    if (!sessionId) return null;
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const now = Date.now();
    if (now > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Touch session for sliding window expiration
    session.lastActiveAt = now;
    session.expiresAt = now + SESSION_TTL_MS;
    return session;
  }

  // Terminate session (Logout)
  public destroySession(sessionId?: string): boolean {
    if (!sessionId) return false;
    return this.sessions.delete(sessionId);
  }

  // Terminate all sessions for a specific user (Password change / suspension)
  public destroyAllUserSessions(userId: number): number {
    let destroyed = 0;
    for (const [sId, sess] of this.sessions.entries()) {
      if (sess.userId === userId) {
        this.sessions.delete(sId);
        destroyed++;
      }
    }
    return destroyed;
  }

  // Rate Limiting on Login Attempts
  public checkRateLimit(identifier: string): { blocked: boolean; remainingSec: number } {
    const now = Date.now();
    const attempt = this.failedAttempts.get(identifier);
    if (!attempt) return { blocked: false, remainingSec: 0 };

    if (attempt.blockedUntil && attempt.blockedUntil > now) {
      const remainingSec = Math.ceil((attempt.blockedUntil - now) / 1000);
      return { blocked: true, remainingSec };
    }

    // If lockout expired, reset
    if (attempt.blockedUntil && attempt.blockedUntil <= now) {
      this.failedAttempts.delete(identifier);
      return { blocked: false, remainingSec: 0 };
    }

    return { blocked: false, remainingSec: 0 };
  }

  public recordFailedAttempt(identifier: string): { blocked: boolean; remainingSec: number; attempts: number } {
    const now = Date.now();
    let attempt = this.failedAttempts.get(identifier);

    if (!attempt || now - attempt.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
      attempt = {
        count: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
      };
    } else {
      attempt.count += 1;
      attempt.lastAttemptAt = now;
    }

    if (attempt.count >= MAX_FAILED_ATTEMPTS) {
      attempt.blockedUntil = now + LOCKOUT_WINDOW_MS;
      this.failedAttempts.set(identifier, attempt);
      const remainingSec = Math.ceil(LOCKOUT_WINDOW_MS / 1000);
      return { blocked: true, remainingSec, attempts: attempt.count };
    }

    this.failedAttempts.set(identifier, attempt);
    return { blocked: false, remainingSec: 0, attempts: attempt.count };
  }

  public resetFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  // Active session stats (for monitoring / audits)
  public getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  public cleanExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, sess] of this.sessions.entries()) {
      if (now > sess.expiresAt) {
        this.sessions.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}

export const sessionManager = new SessionManager();
