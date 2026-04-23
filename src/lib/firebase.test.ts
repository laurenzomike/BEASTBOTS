import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, logout } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

// Mock firebase/app
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDocFromServer: vi.fn(),
}));

// Mock config
vi.mock('../../firebase-applet-config.json', () => ({
  default: {
    firestoreDatabaseId: 'test-db',
  },
}));

describe('firebase auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should catch error when signInWithPopup fails and log to console.error', async () => {
      const mockError = new Error('Sign in error');
      vi.mocked(signInWithPopup).mockRejectedValueOnce(mockError);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await login();

      expect(signInWithPopup).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("Login failed:", mockError);

      consoleSpy.mockRestore();
    });

    it('should call signInWithPopup successfully', async () => {
      vi.mocked(signInWithPopup).mockResolvedValueOnce({} as any);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await login();

      expect(signInWithPopup).toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should catch error when signOut fails and log to console.error', async () => {
      const mockError = new Error('Sign out error');
      vi.mocked(signOut).mockRejectedValueOnce(mockError);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await logout();

      expect(signOut).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("Logout failed:", mockError);

      consoleSpy.mockRestore();
    });

    it('should call signOut successfully', async () => {
      vi.mocked(signOut).mockResolvedValueOnce(undefined);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await logout();

      expect(signOut).toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});