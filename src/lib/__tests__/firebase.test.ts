import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleFirestoreError, login, logout } from '../firebase';
import { auth } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
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

describe('firebase', () => {
  beforeEach(() => {
    (auth as any).currentUser = null;
    vi.clearAllMocks();
  });

  describe('handleFirestoreError', () => {
    it('should throw original error if not permission-denied', () => {
      const error = new Error('Some other error');
      (error as any).code = 'other-code';
      expect(() => handleFirestoreError(error, 'read' as any, null)).toThrow(error);
    });

    it('should throw enriched error when permission-denied with no user', () => {
      const error = new Error('Permission Denied');
      (error as any).code = 'permission-denied';

      try {
        handleFirestoreError(error, 'get', 'users/1');
      } catch (e: any) {
        const parsed = JSON.parse(e.message);
        expect(parsed.operationType).toBe('get');
        expect(parsed.path).toBe('users/1');
        expect(parsed.authInfo.userId).toBe('unauthenticated');
        expect(parsed.authInfo.email).toBe('none');
      }
    });

    it('should throw enriched error when permission-denied with user', () => {
      const error = new Error('Permission Denied');
      (error as any).code = 'permission-denied';

      (auth as any).currentUser = {
        uid: 'user123',
        email: 'test@example.com',
        emailVerified: true,
        isAnonymous: false,
        providerData: [
          {
            providerId: 'google.com',
            displayName: 'Test User',
            email: 'test@example.com'
          }
        ]
      };

      try {
        handleFirestoreError(error, 'get', 'users/1');
      } catch (e: any) {
        const parsed = JSON.parse(e.message);
        expect(parsed.authInfo.userId).toBe('user123');
        expect(parsed.authInfo.email).toBe('test@example.com');
        expect(parsed.authInfo.emailVerified).toBe(true);
        expect(parsed.authInfo.isAnonymous).toBe(false);
        expect(parsed.authInfo.providerInfo[0].providerId).toBe('google.com');
      }
    });

    it('should throw enriched error with missing user details gracefully', () => {
      const error = new Error('Permission Denied');
      (error as any).code = 'permission-denied';

      (auth as any).currentUser = {
        uid: 'user123',
        providerData: [
          {
            providerId: 'google.com'
          }
        ]
      };

      try {
        handleFirestoreError(error, 'get', 'users/1');
      } catch (e: any) {
        const parsed = JSON.parse(e.message);
        expect(parsed.authInfo.userId).toBe('user123');
        expect(parsed.authInfo.email).toBe('none');
        expect(parsed.authInfo.emailVerified).toBe(false);
        expect(parsed.authInfo.isAnonymous).toBe(false);
        expect(parsed.authInfo.providerInfo[0].displayName).toBe('');
      }
    });
  });

  describe('auth functions', () => {
    it('login should call signInWithPopup', async () => {
      await login();
      expect(signInWithPopup).toHaveBeenCalled();
    });

    it('login should catch error and log it', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Login failed');
      vi.mocked(signInWithPopup).mockRejectedValueOnce(error);

      await login();

      expect(consoleSpy).toHaveBeenCalledWith('Login failed:', error);
      consoleSpy.mockRestore();
    });

    it('logout should call signOut', async () => {
      await logout();
      expect(signOut).toHaveBeenCalled();
    });

    it('logout should catch error and log it', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Logout failed');
      vi.mocked(signOut).mockRejectedValueOnce(error);

      await logout();

      expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', error);
      consoleSpy.mockRestore();
    });
  });
});
