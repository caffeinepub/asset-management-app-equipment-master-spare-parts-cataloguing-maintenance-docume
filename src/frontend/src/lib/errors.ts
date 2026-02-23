/**
 * Safely extracts error message from any error type
 * Always returns a string, never throws
 */
export function safeExtractErrorMessage(error: unknown): string {
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
  if (typeof error === 'object' && error !== null) {
    if ('message' in error) {
      const msg = (error as any).message;
      if (typeof msg === 'string') {
        return extractErrorMessage(msg);
      }
      return extractErrorMessage(String(msg));
    }
    
    // Handle objects with error property
    if ('error' in error) {
      return safeExtractErrorMessage((error as any).error);
    }
  }

  // Last resort: convert to string
  try {
    return String(error);
  } catch {
    return 'An unexpected error occurred';
  }
}

/**
 * Normalizes backend errors into user-friendly messages
 */
export function normalizeError(error: unknown): string {
  return safeExtractErrorMessage(error);
}

/**
 * Extracts and cleans error messages from backend trap errors
 * Now safely handles non-string inputs
 */
export function extractErrorMessage(message: string | undefined | unknown): string {
  // Handle non-string inputs
  if (message === null || message === undefined) {
    return 'An unknown error occurred';
  }

  // Convert to string if not already
  const messageStr = typeof message === 'string' ? message : String(message);

  // Check for missing method errors (reject code 5)
  if (messageStr.includes('Canister has no update method') || messageStr.includes('has no update method')) {
    const methodMatch = messageStr.match(/method ['"](\w+)['"]/);
    const methodName = methodMatch ? methodMatch[1] : 'unknown';
    return `Backend configuration error: The deployed canister is missing the '${methodName}' method. ` +
      'The frontend and backend are out of sync. Please redeploy the application or contact support.';
  }

  // Check for reject code 5 errors
  if (messageStr.includes('Reject code: 5')) {
    return 'Backend configuration error: The canister rejected the request. ' +
      'This usually means the frontend and backend are out of sync. Please redeploy the application.';
  }

  // Check for authentication/authorization errors
  if (messageStr.includes('Unauthorized') || messageStr.includes('Authentication required')) {
    return messageStr;
  }

  // Check for trap errors
  if (messageStr.includes('Canister trapped:') || messageStr.includes('trapped explicitly:')) {
    const trapMatch = messageStr.match(/trapped(?:\s+explicitly)?:\s*(.+?)(?:\n|$)/i);
    if (trapMatch && trapMatch[1]) {
      return trapMatch[1].trim();
    }
  }

  // Check for other common error patterns
  if (messageStr.includes('Call was rejected:')) {
    const rejectMatch = messageStr.match(/Call was rejected:\s*(.+?)(?:\n|$)/i);
    if (rejectMatch && rejectMatch[1]) {
      return rejectMatch[1].trim();
    }
  }

  // Return the original message if no pattern matches
  return messageStr;
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
