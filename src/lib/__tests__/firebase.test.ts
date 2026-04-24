import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logout, login, handleFirestoreError } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      providerData: [{
        providerId: 'google.com',
        displayName: 'Test User',
        email: 'test@example.com'
      }]
    }
  })),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDocFromServer: vi.fn(),
}));

vi.mock('../../firebase-applet-config.json', () => ({
  default: {
    firestoreDatabaseId: 'test-db'
  }
}));

describe('firebase utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should call signInWithPopup', async () => {
      vi.mocked(signInWithPopup).mockResolvedValueOnce({} as any);

      await login();

      expect(signInWithPopup).toHaveBeenCalled();
    });

    it('should log an error when signInWithPopup fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Login failed');

      vi.mocked(signInWithPopup).mockRejectedValueOnce(mockError);

      await login();

      expect(signInWithPopup).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed:', mockError);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should call signOut', async () => {
      vi.mocked(signOut).mockResolvedValueOnce(undefined);

      await logout();

      expect(signOut).toHaveBeenCalled();
    });

    it('should log an error when signOut fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Sign out error');

      vi.mocked(signOut).mockRejectedValueOnce(mockError);

      await logout();

      expect(signOut).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', mockError);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleFirestoreError', () => {
    it('should throw original error if not permission-denied', () => {
      const mockError = { code: 'not-found', message: 'Document not found' };

      expect(() => handleFirestoreError(mockError, 'get', 'users/123')).toThrow(mockError);
    });

    it('should format and throw detailed error for permission-denied', () => {
      const mockError = { code: 'permission-denied', message: 'Missing permissions' };

      try {
        handleFirestoreError(mockError, 'get', 'users/123');
        expect.fail('Should have thrown an error');
      } catch (err: any) {
        expect(err).toBeInstanceOf(Error);
        const parsedError = JSON.parse(err.message);
        expect(parsedError).toEqual({
          error: 'Missing permissions',
          operationType: 'get',
          path: 'users/123',
          authInfo: {
            userId: 'test-user-123',
            email: 'test@example.com',
            emailVerified: true,
            isAnonymous: false,
            providerInfo: [{
              providerId: 'google.com',
              displayName: 'Test User',
              email: 'test@example.com'
            }]
          }
        });
      }
    });
  });
});
