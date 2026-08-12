import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

// Mock the whole firebase/auth module to isolate logic
vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  };
});

// Mock the app module to prevent real init
vi.mock('firebase/app', () => {
  return {
    initializeApp: vi.fn(),
  };
});

// Mock firestore to prevent real init
vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(),
    doc: vi.fn(),
    getDocFromServer: vi.fn().mockRejectedValue(new Error('Mock getDocFromServer error')),
  };
});

describe('firebase auth functions', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('login', () => {
    it('should call console.error when signInWithPopup fails', async () => {
      // Arrange
      const mockError = new Error('Auth failed');
      vi.mocked(signInWithPopup).mockRejectedValueOnce(mockError);

      // Act
      await login();

      // Assert
      expect(signInWithPopup).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed:', mockError);
    });
  });
});
