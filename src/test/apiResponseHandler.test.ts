import { describe, it, expect } from 'vitest';
import { handleApiResponse, extractApiData, ApiSuccessResponse, ApiErrorResponse } from '../utils/apiResponseHandler';

describe('apiResponseHandler', () => {
  it('handles successful response with data', () => {
    const mockResponse: ApiSuccessResponse<{ id: number; name: string }> = {
      success: true as const,
      message: "Success message",
      data: { id: 1, name: 'Test' }
    };

    const result = handleApiResponse(mockResponse);
    expect(result).toEqual({ 
      data: { id: 1, name: 'Test' },
      message: "Success message"
    });
  });

  it('handles successful response with paginated data', () => {
    const mockResponse: ApiSuccessResponse<{
      items: { id: number }[];
      total: number;
      page: number;
      pageSize: number;
    }> = {
      success: true as const,
      data: {
        items: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
        pageSize: 10
      }
    };

    const result = handleApiResponse(mockResponse);
    expect(result).toEqual({ 
      data: {
        items: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
        pageSize: 10
      }
    });
  });

  it('handles successful response with array data', () => {
    const mockResponse: ApiSuccessResponse<{ id: number }[]> = {
      success: true as const,
      data: [{ id: 1 }, { id: 2 }]
    };

    const result = handleApiResponse(mockResponse);
    expect(result).toEqual({ data: [{ id: 1 }, { id: 2 }] });
  });

  it('handles unsuccessful response', () => {
    const mockResponse: ApiErrorResponse = {
      success: false as const,
      errors: ['Bad request']
    };

    const result = handleApiResponse(mockResponse);
    expect(result).toEqual({ error: 'Bad request' });
  });

  it('handles unsuccessful response with multiple errors', () => {
    const mockResponse: ApiErrorResponse = {
      success: false as const,
      errors: ['Error 1', 'Error 2']
    };

    const result = handleApiResponse(mockResponse);
    expect(result).toEqual({ error: 'Error 1\nError 2' });
  });

  it('handles unsuccessful response with no errors', () => {
    const mockResponse: ApiErrorResponse = {
      success: false as const,
      errors: []
    };

    const result = handleApiResponse(mockResponse);
    expect(result).toEqual({ error: 'حدث خطأ غير متوقع' });
  });

  it('throws error when extractApiData is called with unsuccessful response', () => {
    const mockResponse: ApiErrorResponse = {
      success: false as const,
      errors: ['Bad request']
    };

    expect(() => extractApiData(mockResponse)).toThrow('Bad request');
  });

  it('throws error when extractApiData is called with successful response but no data', () => {
    const mockResponse: ApiSuccessResponse<null> = {
      success: true as const,
      data: null
    };

    expect(() => extractApiData(mockResponse)).toThrow('API returned success but no data was provided');
  });
}); 