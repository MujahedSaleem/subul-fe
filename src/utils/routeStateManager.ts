/**
 * Route State Manager
 * 
 * Utilities to save and restore the current route when the app is restored
 */

const ROUTE_STATE_KEY = 'subul-current-route';

/**
 * Save the current route to localStorage
 */
export const saveCurrentRoute = (path: string): void => {
  try {
    localStorage.setItem(ROUTE_STATE_KEY, path);
  } catch (error) {
    console.error('Failed to save current route:', error);
  }
};

/**
 * Get the saved route from localStorage
 */
export const getSavedRoute = (): string | null => {
  try {
    return localStorage.getItem(ROUTE_STATE_KEY);
  } catch (error) {
    console.error('Failed to get saved route:', error);
    return null;
  }
};

/**
 * Clear the saved route
 */
export const clearSavedRoute = (): void => {
  try {
    localStorage.removeItem(ROUTE_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear saved route:', error);
  }
}; 