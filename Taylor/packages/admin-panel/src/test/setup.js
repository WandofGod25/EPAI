// Import Jest DOM extensions
import '@testing-library/jest-dom';

// Mock any browser APIs that Jest doesn't provide
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock the ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Intersection Observer
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
      getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user-id' } } } }),
      signIn: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
      signOut: jest.fn().mockResolvedValue({}),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation(callback => Promise.resolve(callback({ data: [], error: null }))),
    })),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
  })),
}));

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.VITE_API_BASE_URL = 'http://localhost:54321/functions/v1';

// Silence console errors during tests
console.error = jest.fn(); 