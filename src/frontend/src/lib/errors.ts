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
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return extractErrorMessage(String(error.message));
  }

  return 'An unexpected error occurred';
}

/**
 * Extracts and cleans error messages from backend trap errors
 */
function extractErrorMessage(message: string | undefined): string {
  if (!message) {
    return 'An unknown error occurred';
  }

  // Check for missing method errors (reject code 5)
  if (message.includes('Canister has no update method') || message.includes('has no update method')) {
    const methodMatch = message.match(/method ['"](\w+)['"]/);
    const methodName = methodMatch ? methodMatch[1] : 'unknown';
    return `Backend configuration error: The deployed canister is missing the '${methodName}' method. ` +
      'The frontend and backend are out of sync. Please redeploy the application or contact support.';
  }

  // Check for reject code 5 errors
  if (message.includes('Reject code: 5')) {
    return 'Backend configuration error: The canister rejected the request. ' +
      'This usually means the frontend and backend are out of sync. Please redeploy the application.';
  }

  // Check for authentication/authorization errors
  if (message.includes('Unauthorized') || message.includes('Authentication required')) {
    return message;
  }

  // Check for trap errors
  if (message.includes('Canister trapped:') || message.includes('trapped explicitly:')) {
    const trapMatch = message.match(/trapped(?:\s+explicitly)?:\s*(.+?)(?:\n|$)/i);
    if (trapMatch && trapMatch[1]) {
      return trapMatch[1].trim();
    }
  }

  // Check for other common error patterns
  if (message.includes('Call was rejected:')) {
    const rejectMatch = message.match(/Call was rejected:\s*(.+?)(?:\n|$)/i);
    if (rejectMatch && rejectMatch[1]) {
      return rejectMatch[1].trim();
    }
  }

  // Return the original message if no pattern matches
  return message;
}

/**
 * Checks if an error is related to authentication
 */
export function isAuthenticationError(error: unknown): boolean {
  const message = normalizeError(error).toLowerCase();
  return message.includes('unauthorized') || 
         message.includes('authentication') || 
         message.includes('not authenticated') ||
         message.includes('please log in');
}

/**
 * Checks if an error is related to backend configuration/deployment mismatch
 */
export function isBackendConfigError(error: unknown): boolean {
  const message = normalizeError(error).toLowerCase();
  return message.includes('backend configuration error') ||
         message.includes('has no update method') ||
         message.includes('reject code: 5') ||
         message.includes('out of sync');
}
