import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleBotErrorTransition, getActionableErrorMessage } from '../errorUtils';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Mock Firestore functions
vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn(() => 'mock-doc-ref'),
    setDoc: vi.fn(),
    collection: vi.fn(() => 'mock-collection-ref'),
    addDoc: vi.fn(),
    serverTimestamp: vi.fn(() => 'mock-timestamp')
  };
});

// Mock the firebase db export to avoid initializing real Firebase
vi.mock('../firebase', () => {
  return {
    db: 'mock-db'
  };
});

describe('handleBotErrorTransition', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('updates bot status to error and logs activity on normal error', async () => {
    const errorInfo = await handleBotErrorTransition('bot123', 'user456', 'test-bot', new Error('permission denied'));

    // Check returned value
    expect(errorInfo.type).toBe('permission');
    expect(errorInfo.suggestedStatus).toBe('error');

    // Check setDoc for status update
    expect(doc).toHaveBeenCalledWith('mock-db', 'users', 'user456', 'bots', 'bot123');
    expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', {
      status: 'error',
      updatedAt: 'mock-timestamp'
    }, { merge: true });

    // Check addDoc for activity log
    expect(collection).toHaveBeenCalledWith('mock-db', 'users', 'user456', 'activities');
    expect(addDoc).toHaveBeenCalledWith('mock-collection-ref', {
      botId: 'bot123',
      botType: 'test-bot',
      userId: 'user456',
      text: expect.stringContaining('[TERMINAL_ALARM]'),
      timestamp: 'mock-timestamp'
    });
  });

  it('catches and logs errors during the transition logic itself', async () => {
    // Force setDoc to throw
    vi.mocked(setDoc).mockRejectedValueOnce(new Error('Firestore failed'));

    const errorInfo = await handleBotErrorTransition('bot123', 'user456', 'test-bot', new Error('permission denied'));

    // Should still return error info even if Firestore fails
    expect(errorInfo.type).toBe('permission');

    // Should log the internal error
    expect(consoleErrorSpy).toHaveBeenCalledWith('Critical: Error transition logic failed', expect.any(Error));
  });

  it('handles rate-limit errors appropriately', async () => {
    const errorInfo = await handleBotErrorTransition('bot123', 'user456', 'test-bot', new Error('too many requests'));

    expect(errorInfo.type).toBe('rate-limit');
    expect(errorInfo.suggestedStatus).toBe('error');

    expect(setDoc).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalled();
  });

  it('handles authentication errors appropriately', async () => {
    const errorInfo = await handleBotErrorTransition('bot123', 'user456', 'test-bot', new Error('401 unauthenticated'));

    expect(errorInfo.type).toBe('auth');
    expect(errorInfo.suggestedStatus).toBe('auth-required');

    expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', {
      status: 'auth-required',
      updatedAt: 'mock-timestamp'
    }, { merge: true });
    expect(addDoc).toHaveBeenCalled();
  });

  it('handles network errors appropriately', async () => {
    const errorInfo = await handleBotErrorTransition('bot123', 'user456', 'test-bot', new Error('failed to fetch'));

    expect(errorInfo.type).toBe('network');
    expect(errorInfo.suggestedStatus).toBe('error');

    expect(setDoc).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalled();
  });
});

describe('getActionableErrorMessage', () => {
  it('identifies auth errors', () => {
    expect(getActionableErrorMessage(new Error('401 unauthorized')).type).toBe('auth');
    expect(getActionableErrorMessage(new Error('invalid key')).type).toBe('auth');
  });

  it('identifies rate-limit errors', () => {
    expect(getActionableErrorMessage(new Error('429 rate_limit')).type).toBe('rate-limit');
    expect(getActionableErrorMessage(new Error('quota exceeded')).type).toBe('rate-limit');
  });

  it('identifies permission errors', () => {
    expect(getActionableErrorMessage(new Error('403 forbidden')).type).toBe('permission');
  });

  it('identifies network errors', () => {
    expect(getActionableErrorMessage(new Error('connection refused')).type).toBe('network');
  });

  it('identifies unknown errors', () => {
    expect(getActionableErrorMessage(new Error('random failure')).type).toBe('unknown');
  });
});
