import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

// Mock firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDocFromServer: vi.fn(),
}));

// Mock the config
vi.mock('../../../firebase-applet-config.json', () => ({
  default: {
    firestoreDatabaseId: 'test-db',
  }
}));

describe('firebase auth functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should catch error and log it to console.error when login fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Auth failed');
      vi.mocked(signInWithPopup).mockRejectedValueOnce(testError);

      await login();

      expect(signInWithPopup).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Login failed:', testError);

      consoleSpy.mockRestore();
    });
  });
});
