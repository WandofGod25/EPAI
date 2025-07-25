// packages/admin-panel/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Create a .env file in the packages/admin-panel/ directory
// and add your Supabase URL and anon key.
// VITE_SUPABASE_URL=YOUR_SUPABASE_URL
// VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Enhanced environment validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🔍 Supabase Client: Missing environment variables');
  console.error('🔍 Supabase Client: VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('🔍 Supabase Client: VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  throw new Error("Supabase URL and anon key are required.");
}

// Enhanced client creation with debugging
console.log('🔍 Supabase Client: Creating client with URL:', supabaseUrl);
console.log('🔍 Supabase Client: Anon key length:', supabaseAnonKey.length);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'epai-admin-panel'
    }
  }
});

// Enhanced error handling for Edge Function calls
const originalFunctionsInvoke = supabase.functions.invoke;

supabase.functions.invoke = async function<T = any>(name: string, options?: any): Promise<any> {
  console.log(`🔍 Supabase Client: Calling Edge Function: ${name}`);
  console.log(`🔍 Supabase Client: Options:`, options);
  
  try {
    const result = await originalFunctionsInvoke.call(this, name, options);
    console.log(`🔍 Supabase Client: Edge Function ${name} completed`);
    return result;
  } catch (error) {
    console.error(`🔍 Supabase Client: Edge Function ${name} failed:`, error);
    throw error;
  }
};

console.log('🔍 Supabase Client: Client created successfully'); 