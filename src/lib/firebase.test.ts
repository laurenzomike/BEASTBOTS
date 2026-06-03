import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleFirestoreError, auth } from './firebase';

// Mock the entire firebase/app module
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

// Mock the entire firebase/auth module
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null, // Default to null, tests can override
  })),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

// Mock the entire firebase/firestore module
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDocFromServer: vi.fn(),
}));

describe('handleFirestoreError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset currentUser before each test
    (auth as any).currentUser = null;
  });

  it('should throw the original error if error code is not permission-denied', () => {
    const error = new Error('Some other error');
    (error as any).code = 'not-found';

    expect(() => handleFirestoreError(error, 'get', 'some/path')).toThrow(error);
  });

  it('should throw stringified error info with unauthenticated user if permission-denied and no user', () => {
    const error = new Error('Missing or insufficient permissions.');
    (error as any).code = 'permission-denied';

    try {
      handleFirestoreError(error, 'get', 'some/path');
      expect.fail('Should have thrown an error');
    } catch (e: any) {
      const parsedError = JSON.parse(e.message);
      expect(parsedError).toEqual({
        error: 'Missing or insufficient permissions.',
        operationType: 'get',
        path: 'some/path',
        authInfo: {
          userId: 'unauthenticated',
          email: 'none',
          emailVerified: false,
          isAnonymous: false,
          providerInfo: [],
        },
      });
    }
  });

  it('should throw stringified error info with authenticated user info if permission-denied', () => {
    const error = new Error('Missing or insufficient permissions.');
    (error as any).code = 'permission-denied';

    // Mock an authenticated user
    (auth as any).currentUser = {
      uid: 'user123',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      providerData: [
        {
          providerId: 'google.com',
          displayName: 'Test User',
          email: 'test@example.com',
        },
      ],
    };

    try {
      handleFirestoreError(error, 'update', 'users/user123');
      expect.fail('Should have thrown an error');
    } catch (e: any) {
      const parsedError = JSON.parse(e.message);
      expect(parsedError).toEqual({
        error: 'Missing or insufficient permissions.',
        operationType: 'update',
        path: 'users/user123',
        authInfo: {
          userId: 'user123',
          email: 'test@example.com',
          emailVerified: true,
          isAnonymous: false,
          providerInfo: [
            {
              providerId: 'google.com',
              displayName: 'Test User',
              email: 'test@example.com',
            },
          ],
        },
      });
    }
  });
});
