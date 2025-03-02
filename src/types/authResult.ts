// authResult.ts
export interface AuthResult {
    succeeded: boolean; // Indicates whether the operation was successful
    accessToken?: string; // Access token (if applicable)
    refreshToken?: string; // Refresh token (if applicable)
    error?: string; // Error message (if the operation failed)
  }