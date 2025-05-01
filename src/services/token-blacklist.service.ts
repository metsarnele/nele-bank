import jwt from 'jsonwebtoken';

interface BlacklistedToken {
  token: string;
  expiresAt: number; // Unix timestamp
}

/**
 * Service to manage blacklisted JWT tokens
 * Used to invalidate tokens when users log out
 */
export class TokenBlacklistService {
  private static instance: TokenBlacklistService;
  private blacklist: Map<string, BlacklistedToken>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.blacklist = new Map<string, BlacklistedToken>();
    // Run cleanup every hour to remove expired tokens
    this.cleanupInterval = setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000);
  }

  public static getInstance(): TokenBlacklistService {
    if (!TokenBlacklistService.instance) {
      TokenBlacklistService.instance = new TokenBlacklistService();
    }
    return TokenBlacklistService.instance;
  }

  /**
   * Add a token to the blacklist
   * @param token JWT token to blacklist
   * @param decodedToken Decoded JWT payload
   */
  public addToBlacklist(token: string, decodedToken: jwt.JwtPayload): void {
    // Get expiration time from token or set a default (1 hour)
    const expiresAt = decodedToken.exp || Math.floor(Date.now() / 1000) + 3600;
    
    this.blacklist.set(token, {
      token,
      expiresAt
    });
  }

  /**
   * Check if a token is blacklisted
   * @param token JWT token to check
   * @returns true if token is blacklisted, false otherwise
   */
  public isBlacklisted(token: string): boolean {
    return this.blacklist.has(token);
  }

  /**
   * Remove expired tokens from the blacklist
   */
  private cleanupExpiredTokens(): void {
    const now = Math.floor(Date.now() / 1000);
    
    for (const [token, data] of this.blacklist.entries()) {
      if (data.expiresAt < now) {
        this.blacklist.delete(token);
      }
    }
  }

  /**
   * Clear the cleanup interval when the service is no longer needed
   * Used mainly for testing purposes
   */
  public clearCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
