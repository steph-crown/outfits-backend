import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure, unique username
 * Following industry standards for username generation:
 * - Starts with a letter (a-z)
 * - Contains only alphanumeric characters and underscores
 * - Length between 8-20 characters
 * - No consecutive underscores
 * - Not starting or ending with underscore
 */
export class UsernameGenerator {
  private static readonly ADJECTIVES = [
    'swift',
    'bright',
    'calm',
    'brave',
    'clever',
    'cool',
    'bold',
    'wise',
    'kind',
    'neat',
    'quick',
    'sharp',
    'smart',
    'strong',
    'wild',
    'zen',
    'epic',
    'fire',
    'ice',
    'sky',
    'star',
    'moon',
    'sun',
    'wave',
    'royal',
    'urban',
    'cyber',
    'neon',
    'retro',
    'cosmic',
    'mystic',
    'electric',
  ];

  private static readonly NOUNS = [
    'tiger',
    'eagle',
    'wolf',
    'fox',
    'bear',
    'lion',
    'hawk',
    'owl',
    'shark',
    'whale',
    'raven',
    'phoenix',
    'dragon',
    'falcon',
    'panther',
    'viper',
    'thunder',
    'storm',
    'lightning',
    'blaze',
    'frost',
    'crystal',
    'shadow',
    'flame',
    'knight',
    'warrior',
    'hunter',
    'ranger',
    'wizard',
    'ninja',
    'samurai',
    'guardian',
  ];

  /**
   * Generates a secure random username
   * @returns Promise<string> A unique username
   */
  static async generate(): Promise<string> {
    const adjective = this.getRandomElement(this.ADJECTIVES);
    const noun = this.getRandomElement(this.NOUNS);
    const randomSuffix = this.generateSecureRandomNumber(100, 9999);

    // Combine with underscore separator for readability
    const username = `${adjective}_${noun}_${randomSuffix}`;

    // Ensure it meets length requirements (8-20 chars)
    if (username.length > 20) {
      // Fallback to shorter format if too long
      return `${adjective.slice(0, 4)}_${noun.slice(0, 4)}_${randomSuffix}`;
    }

    return username;
  }

  /**
   * Validates if a username meets security requirements
   * @param username The username to validate
   * @returns boolean True if valid, false otherwise
   */
  static isValid(username: string): boolean {
    // Check length (8-20 characters)
    if (username.length < 8 || username.length > 20) {
      return false;
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(username)) {
      return false;
    }

    // Only alphanumeric and underscores allowed
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return false;
    }

    // Cannot end with underscore
    if (username.endsWith('_')) {
      return false;
    }

    // No consecutive underscores
    if (username.includes('__')) {
      return false;
    }

    // No common security-sensitive words
    const forbiddenWords = [
      'admin',
      'root',
      'system',
      'user',
      'test',
      'guest',
      'null',
      'undefined',
    ];
    const lowerUsername = username.toLowerCase();

    for (const word of forbiddenWords) {
      if (lowerUsername.includes(word)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitizes a user-provided username to meet security requirements
   * @param input The input username
   * @returns string A sanitized username or null if can't be sanitized
   */
  static sanitize(input: string): string | null {
    if (!input || typeof input !== 'string') {
      return null;
    }

    // Remove invalid characters
    let sanitized = input
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

    // Ensure it starts with a letter
    if (!/^[a-z]/.test(sanitized)) {
      sanitized = 'u_' + sanitized;
    }

    // Ensure proper length
    if (sanitized.length < 8) {
      sanitized = sanitized + '_' + this.generateSecureRandomNumber(100, 999);
    } else if (sanitized.length > 20) {
      sanitized = sanitized.slice(0, 20);
    }

    // Final validation
    return this.isValid(sanitized) ? sanitized : null;
  }

  private static getRandomElement<T>(array: T[]): T {
    const randomIndex = this.generateSecureRandomNumber(0, array.length - 1);
    return array[randomIndex];
  }

  private static generateSecureRandomNumber(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const randomBytes = this.getSecureRandomBytes(bytesNeeded);

    let randomValue = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = randomValue * 256 + randomBytes[i];
    }

    return min + (randomValue % range);
  }

  private static getSecureRandomBytes(length: number): Uint8Array {
    return new Uint8Array(randomBytes(length));
  }
}
