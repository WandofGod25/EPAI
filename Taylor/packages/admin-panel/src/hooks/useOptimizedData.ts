import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface UseOptimizedDataOptions {
  cacheKey: string;
  cacheDuration?: number; // in milliseconds
  refetchInterval?: number; // in milliseconds
  enabled?: boolean;
}

export function useOptimizedData<T>(
  queryFn: () => Promise<T>,
  options: UseOptimizedDataOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cached, setCached] = useState(false);
  
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    refetchInterval,
    enabled = true
  } = options;

  const getCachedData = useCallback((): T | null => {
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  const setCachedData = useCallback((newData: T) => {
    const expiresAt = Date.now() + cacheDuration;
    cacheRef.current.set(cacheKey, {
      data: newData,
      timestamp: Date.now(),
      expiresAt
    });
  }, [cacheKey, cacheDuration]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
        setCached(true);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      setCached(false);

      const result = await queryFn();
      
      // Only update if request wasn't cancelled
      if (!abortControllerRef.current.signal.aborted) {
        setData(result);
        setCachedData(result);
        setLoading(false);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    }
  }, [enabled, queryFn, getCachedData, setCachedData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData(true); // Force refresh
      }, refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetchInterval, enabled, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const invalidateCache = useCallback(() => {
    cacheRef.current.delete(cacheKey);
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    cached,
    refetch,
    invalidateCache
  };
}

// Optimized hook for models data
export function useOptimizedModels() {
  return useOptimizedData(
    async () => {
      const { data, error } = await supabase.functions.invoke('get-models-optimized');
      if (error) throw error;
      return data;
    },
    {
      cacheKey: 'models',
      cacheDuration: 60 * 60 * 1000, // 1 hour
      refetchInterval: 30 * 60 * 1000, // 30 minutes
    }
  );
}

// Optimized hook for usage stats
export function useOptimizedUsageStats() {
  return useOptimizedData(
    async () => {
      const { data, error } = await supabase.functions.invoke('get-usage-stats-optimized');
      if (error) throw error;
      return data;
    },
    {
      cacheKey: 'usage-stats',
      cacheDuration: 15 * 60 * 1000, // 15 minutes
      refetchInterval: 5 * 60 * 1000, // 5 minutes
    }
  );
}

// Optimized hook for insights
export function useOptimizedInsights() {
  return useOptimizedData(
    async () => {
      const { data, error } = await supabase.functions.invoke('get-insights');
      if (error) throw error;
      return data;
    },
    {
      cacheKey: 'insights',
      cacheDuration: 10 * 60 * 1000, // 10 minutes
      refetchInterval: 2 * 60 * 1000, // 2 minutes
    }
  );
}

// Optimized hook for logs with pagination
export function useOptimizedLogs(page = 1, pageSize = 50) {
  return useOptimizedData(
    async () => {
      const { data, error } = await supabase.functions.invoke('get-partner-logs', {
        body: { page, pageSize }
      });
      if (error) throw error;
      return data;
    },
    {
      cacheKey: `logs-${page}-${pageSize}`,
      cacheDuration: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 30 * 1000, // 30 seconds
    }
  );
} 