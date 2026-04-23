import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentPanel } from '../AgentPanel';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, auth } from '../../lib/firebase';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the Firebase modules
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(),
    setDoc: vi.fn(),
    serverTimestamp: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()), // return unsubscribe mock
    limit: vi.fn(),
    orderBy: vi.fn(),
    getDocs: vi.fn(),
    deleteDoc: vi.fn(),
  };
});

vi.mock('../../lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  handleFirestoreError: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: vi.fn()
    };
  }
}));

// Mock the canvas or other missing dependencies for Recharts or animations if needed
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('AgentPanel', () => {
  const mockBot = {
    id: 'bot-123',
    name: 'Test Bot',
    type: 'trader',
    status: 'online',
    config: {
      strategy: 'standard',
      workflows: []
    },
    userId: 'test-user-id'
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles Firestore errors when save config fails', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Permission denied');
    (mockError as any).code = 'permission-denied';

    // Make setDoc throw an error
    vi.mocked(setDoc).mockRejectedValueOnce(mockError);

    render(<AgentPanel bot={mockBot as any} onClose={mockOnClose} />);

    // Find and click the save button
    const saveButton = screen.getByText('Save Bot Settings');
    await user.click(saveButton);

    // Wait for the rejection to be processed
    await waitFor(() => {
      expect(handleFirestoreError).toHaveBeenCalledWith(
        mockError,
        'update',
        `users/${mockBot.userId}/bots/${mockBot.id}`
      );
    });
  });
});
