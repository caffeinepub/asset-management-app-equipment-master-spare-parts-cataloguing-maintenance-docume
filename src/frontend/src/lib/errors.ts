/**
 * Normalizes backend errors into user-friendly messages
 */
export function normalizeError(error: unknown): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return extractErrorMessage(error);
  }

  // Handle Error objects
  if (error instanceof Error) {
    return extractErrorMessage(error.message);
  }

  // Handle objects with message property
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return extractErrorMessage(error.message);
  }

  return 'An unexpected error occurred';
}

/**
 * Extracts meaningful error messages from backend trap messages
 */
function extractErrorMessage(message: string): string {
  // Check for "Unauthorized" messages
  if (message.includes('Unauthorized')) {
    // Extract the specific unauthorized message
    const match = message.match(/Unauthorized: (.+?)(?:\n|$)/);
    if (match) {
      return match[1];
    }
    return 'You are not authorized to perform this action';
  }

  // Check for authentication-related errors
  if (message.toLowerCase().includes('not authenticated') || 
      message.toLowerCase().includes('anonymous') ||
      message.toLowerCase().includes('sign in') ||
      message.toLowerCase().includes('login')) {
    return 'Please sign in to continue';
  }

  // Check for "trap" messages and extract the actual error
  if (message.includes('trap')) {
    const match = message.match(/trap: (.+?)(?:\n|$)/);
    if (match) {
      return match[1];
    }
  }

  // Return the original message if no pattern matches
  return message;
}

/**
 * Checks if an error indicates the user needs to authenticate
 */
export function isAuthenticationError(error: unknown): boolean {
  const message = normalizeError(error).toLowerCase();
  return message.includes('unauthorized') || 
         message.includes('not authenticated') || 
         message.includes('sign in') ||
         message.includes('login') ||
         message.includes('only users can');
}
