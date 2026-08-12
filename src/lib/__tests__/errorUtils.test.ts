import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as errorUtils from '../errorUtils';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

describe('errorUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActionableErrorMessage', () => {
    it('should identify auth errors', () => {
      const err = new Error('unauthorized access');
      const result = errorUtils.getActionableErrorMessage(err);
      expect(result.type).toBe('auth');
      expect(result.suggestedStatus).toBe('auth-required');
    });

    it('should identify rate limit errors', () => {
      const err = new Error('too many requests');
      const result = errorUtils.getActionableErrorMessage(err);
      expect(result.type).toBe('rate-limit');
      expect(result.suggestedStatus).toBe('error');
    });

    it('should identify permission errors', () => {
      const err = new Error('permission denied');
      const result = errorUtils.getActionableErrorMessage(err);
      expect(result.type).toBe('permission');
      expect(result.suggestedStatus).toBe('error');
    });

    it('should identify network errors', () => {
      const err = new Error('failed to fetch');
      const result = errorUtils.getActionableErrorMessage(err);
      expect(result.type).toBe('network');
      expect(result.suggestedStatus).toBe('error');
    });

    it('should default to unknown for unrecognized errors', () => {
      const err = new Error('something weird happened');
      const result = errorUtils.getActionableErrorMessage(err);
      expect(result.type).toBe('unknown');
      expect(result.suggestedStatus).toBe('error');
    });

    it('should handle null/undefined errors gracefully', () => {
      const result = errorUtils.getActionableErrorMessage(null);
      expect(result.type).toBe('unknown');
    });
  });

  describe('handleBotErrorTransition', () => {
    it('should catch error when setDoc fails and continue', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(firestore.setDoc).mockRejectedValueOnce(new Error('Firebase connection failed'));

      const result = await errorUtils.handleBotErrorTransition('bot-123', 'user-123', 'content', new Error('permission denied'));

      expect(result).toMatchObject({
        type: 'permission',
        suggestedStatus: 'error'
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Critical: Error transition logic failed',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should catch error when addDoc fails and continue', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(firestore.setDoc).mockResolvedValueOnce(undefined);
      vi.mocked(firestore.addDoc).mockRejectedValueOnce(new Error('Firebase collection failed'));

      const result = await errorUtils.handleBotErrorTransition('bot-123', 'user-123', 'content', new Error('permission denied'));

      expect(result).toMatchObject({
        type: 'permission',
        suggestedStatus: 'error'
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Critical: Error transition logic failed',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle success path', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(firestore.setDoc).mockResolvedValueOnce(undefined);
      vi.mocked(firestore.addDoc).mockResolvedValueOnce({} as any);

      const result = await errorUtils.handleBotErrorTransition('bot-123', 'user-123', 'content', new Error('permission denied'));

      expect(result).toMatchObject({
        type: 'permission',
        suggestedStatus: 'error'
      });
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
