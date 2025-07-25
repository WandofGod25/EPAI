import { createContext } from 'react';

export interface ApiKeyContextType {
    apiKey: string | null;
    loading: boolean;
    error: Error | null;
    regenerateApiKey: () => Promise<void>;
    getApiKey: () => Promise<void>;
}

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined); 