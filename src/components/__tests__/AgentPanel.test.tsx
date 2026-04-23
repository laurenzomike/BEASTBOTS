import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgentPanel } from '../AgentPanel'
import { Bot } from '../../types'
import { doc, setDoc, onSnapshot, collection, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'

// Mock dependencies
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../../lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  handleFirestoreError: vi.fn()
}))

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      constructor() {}
      models = {
        generateContent: vi.fn()
      }
    }
  }
})

// Mock lucide-react to avoid missing icons issues and to make finding the close button easier
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react')
  return {
    ...actual,
    X: () => <svg data-testid="icon-x"></svg>,
  }
})

// Mock recharts because ResizeObserver might cause issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div></div>,
  XAxis: () => <div></div>,
  YAxis: () => <div></div>,
  CartesianGrid: () => <div></div>,
  Tooltip: () => <div></div>
}))

// Mock motion to just render children
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, initial, animate, exit, transition }: any) => (
      <div className={className}>{children}</div>
    )
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

describe('AgentPanel', () => {
  const mockBot: Bot = {
    id: 'bot-1',
    name: 'Test Bot',
    type: 'trading',
    status: 'offline',
    createdAt: new Date(),
    updatedAt: new Date(),
    config: {
      strategy: 'standard',
      parameters: { risk: 'low' },
      workflows: []
    }
  }

  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock snapshot handlers to do nothing by default
    ;(onSnapshot as any).mockImplementation((_query: any, callback: any) => {
      // Don't call callback immediately to avoid state updates during render issues
      return vi.fn() // unsubscribe function
    })

    // Mock window.confirm
    window.confirm = vi.fn()
  })

  it('renders nothing when bot is null', () => {
    const { container } = render(<AgentPanel bot={null} onClose={mockOnClose} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders bot name when bot is provided', () => {
    render(<AgentPanel bot={mockBot} onClose={mockOnClose} />)

    const nameInput = screen.getByDisplayValue('Test Bot')
    expect(nameInput).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<AgentPanel bot={mockBot} onClose={mockOnClose} />)

    // Find the button that contains the X icon
    const xIcon = screen.getByTestId('icon-x')
    const closeBtn = xIcon.closest('button')

    expect(closeBtn).toBeInTheDocument()

    if (closeBtn) {
      fireEvent.click(closeBtn)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('decommissions bot when decommission button is clicked and confirmed', async () => {
    ;(window.confirm as any).mockReturnValue(true)

    render(<AgentPanel bot={mockBot} onClose={mockOnClose} />)

    const decommissionBtn = screen.getByText('Decommission Bot')
    fireEvent.click(decommissionBtn)

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Are you sure'))
    expect(deleteDoc).toHaveBeenCalledTimes(1)

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  it('does not decommission bot when decommission is cancelled', async () => {
    ;(window.confirm as any).mockReturnValue(false)

    render(<AgentPanel bot={mockBot} onClose={mockOnClose} />)

    const decommissionBtn = screen.getByText('Decommission Bot')
    fireEvent.click(decommissionBtn)

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Are you sure'))
    expect(deleteDoc).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('updates bot name on blur', async () => {
    render(<AgentPanel bot={mockBot} onClose={mockOnClose} />)

    const nameInput = screen.getByDisplayValue('Test Bot')
    fireEvent.change(nameInput, { target: { value: 'New Bot Name' } })
    fireEvent.blur(nameInput)

    expect(setDoc).toHaveBeenCalledWith(
      undefined, // Because doc() is mocked and returns undefined
      expect.objectContaining({ name: 'New Bot Name' }),
      { merge: true }
    )
  })
})
