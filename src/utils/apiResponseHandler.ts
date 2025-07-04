// Unified API Response Handler
// Handles the new unified response structure:
// Success: { success: true, message: "...", data: {...} }
// Error: { success: false, errors: ["..."] }

export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  errors: string[];
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface ProcessedApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Process unified API response and extract data, message, or error
 * @param response - The API response object
 * @returns Processed response with data, message, or error
 */
export function handleApiResponse<T>(response: ApiResponse<T>): ProcessedApiResponse<T> {
  if (response.success) {
    // Ensure data is always present in success responses
    if (response.data === undefined || response.data === null) {
      throw new Error('API returned success but no data was provided');
    }
    return { 
      data: response.data, 
      message: response.message 
    };
  } else {
    // Show the first error if available, join multiple errors, or fallback
    const error = response.errors && response.errors.length > 0 
      ? response.errors.join('\n')  // Join multiple errors with newlines
      : 'حدث خطأ غير متوقع';
    
    return { error };
  }
}

/**
 * Simplified version that directly returns the data or throws error
 * Use this when you only need the data and want to handle errors via try/catch
 * @param response - The API response object
 * @returns The data from successful response
 */
export function extractApiData<T>(response: ApiResponse<T>): T {
  if (response.success) {
    if (response.data === undefined || response.data === null) {
      throw new Error('API returned success but no data was provided');
    }
    return response.data;
  } else {
    const error = response.errors && response.errors.length > 0 
      ? response.errors.join('\n')
      : 'حدث خطأ غير متوقع';
    throw new Error(error);
  }
}

/**
 * Handle API errors in thunks - extracts error message for rejectWithValue
 * @param error - The caught error object
 * @returns Error message string
 */
export function handleApiError(error: any): string {
  // Check if it's our unified error response
  if (error.response?.data?.success === false) {
    const errors = error.response.data.errors;
    return errors && errors.length > 0 
      ? errors.join('\n')
      : 'حدث خطأ غير متوقع';
  }
  
  // Fallback to existing error handling
  return error.response?.data?.message || 
         error.response?.data?.error || 
         error.message || 
         'حدث خطأ غير متوقع';
} 