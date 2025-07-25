// Set up environment variables for Jest tests

process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.VITE_API_BASE_URL = 'http://localhost:54321/functions/v1';
process.env.NODE_ENV = 'test'; 