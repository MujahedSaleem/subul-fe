import { useState, useCallback } from 'react';

interface UseDataFetchingOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useDataFetching<T>(
  fetchFunction: () => Promise<T>,
  options: UseDataFetchingOptions<T> = {}
) {
  const { initialData, onSuccess, onError } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFunction();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, onSuccess, onError]);

  return {
    data,
    isLoading,
    error,
    fetchData,
    setData,
  };
} 