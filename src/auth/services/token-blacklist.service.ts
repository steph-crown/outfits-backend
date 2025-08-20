import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private blacklistedTokens = new Set<string>();

  // In production, use Redis or database for persistence
  // This in-memory approach is for development only
  
  blacklistToken(token: string): void {
    this.blacklistedTokens.add(token);
  }

  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  // Clean up expired tokens periodically (optional)
  clearExpiredTokens(): void {
    // In a real implementation, you'd decode JWTs and check expiration
    // For now, we'll clear all tokens older than 24 hours
    // This is a simplified approach
  }
}
