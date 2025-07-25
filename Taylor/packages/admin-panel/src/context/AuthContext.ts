import { createContext } from 'react';
import { User, AuthError } from '@supabase/supabase-js';

// Defines the shape of the authentication context
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, partnerName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

// Create the context with an undefined initial value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);