import { describe, it, expect } from 'vitest';
import { handleApiResponse } from '../utils/apiResponseHandler';

describe('apiResponseHandler', () => {
  it('handles successful response with data', () => {
    const mockResponse = {
      status: 200,
      data: {
        success: true,
        data: { id: 1, name: 'Test' }
      }
    };

    const result = handleApiResponse(mockResponse);
    expect(result).toEqual({ id: 1, name: 'Test' });
  });

  it('handles successful response with paginated data', () => {
    const mockResponse = {
      status: 200,
      data: {
        success: true,
        data: {
          items: [{ id: 1 }, { id: 2 }],
          total: 2,
          page: 1,
          pageSize: 10
        }
      }
    };

    const result = handleApiResponse(mockResponse);
    expect(result).toEqual({
      items: [{ id: 1 }, { id: 2 }],
      total: 2,
      page: 1,
      pageSize: 10
    });
  });

  it('handles successful response with array data', () => {
    const mockResponse = {
      status: 200,
      data: {
        success: true,
        data: [{ id: 1 }, { id: 2 }]
      }
    };

    const result = handleApiResponse(mockResponse);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('throws error for unsuccessful response', () => {
    const mockResponse = {
      status: 400,
      data: {
        success: false,
        message: 'Bad request'
      }
    };

    expect(() => handleApiResponse(mockResponse)).toThrow('Bad request');
  });

  it('throws error for response with no data', () => {
    const mockResponse = {
      status: 200,
      data: {
        success: false
      }
    };

    expect(() => handleApiResponse(mockResponse)).toThrow('No data provided');
  });
}); 