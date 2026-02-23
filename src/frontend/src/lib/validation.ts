/**
 * Validate required field
 */
export function validateRequired(value: string | undefined | null, fieldName: string): string | null {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * Validate number field
 */
export function validateNumber(value: string | undefined | null, fieldName: string): string | null {
  if (!value || value.trim() === '') {
    return null; // Allow empty for optional fields
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  
  return null;
}

/**
 * Validate email field
 */
export function validateEmail(value: string | undefined | null): string | null {
  if (!value || value.trim() === '') {
    return null; // Allow empty for optional fields
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address';
  }
  
  return null;
}

/**
 * Validate attribute value based on type and rules
 */
export function validateAttributeValue(
  value: string | undefined | null,
  attributeType: string,
  validationRules?: string,
  required?: boolean
): string | null {
  // Check required
  if (required && (!value || value.trim() === '')) {
    return 'This field is required';
  }

  // If empty and not required, it's valid
  if (!value || value.trim() === '') {
    return null;
  }

  // Type-specific validation
  switch (attributeType.toLowerCase()) {
    case 'number':
    case 'integer':
      const num = Number(value);
      if (isNaN(num)) {
        return 'Must be a valid number';
      }
      break;

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Must be a valid email address';
      }
      break;

    case 'url':
      try {
        new URL(value);
      } catch {
        return 'Must be a valid URL';
      }
      break;

    case 'date':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Must be a valid date';
      }
      break;
  }

  // Apply custom validation rules if provided
  if (validationRules) {
    // Parse validation rules (e.g., "min:0,max:100" or "pattern:^[A-Z]+$")
    const rules = validationRules.split(',').map((r) => r.trim());
    
    for (const rule of rules) {
      if (rule.startsWith('min:')) {
        const min = Number(rule.substring(4));
        if (!isNaN(min) && Number(value) < min) {
          return `Must be at least ${min}`;
        }
      } else if (rule.startsWith('max:')) {
        const max = Number(rule.substring(4));
        if (!isNaN(max) && Number(value) > max) {
          return `Must be at most ${max}`;
        }
      } else if (rule.startsWith('minLength:')) {
        const minLen = Number(rule.substring(10));
        if (!isNaN(minLen) && value.length < minLen) {
          return `Must be at least ${minLen} characters`;
        }
      } else if (rule.startsWith('maxLength:')) {
        const maxLen = Number(rule.substring(10));
        if (!isNaN(maxLen) && value.length > maxLen) {
          return `Must be at most ${maxLen} characters`;
        }
      } else if (rule.startsWith('pattern:')) {
        const pattern = rule.substring(8);
        try {
          const regex = new RegExp(pattern);
          if (!regex.test(value)) {
            return 'Invalid format';
          }
        } catch {
          // Invalid regex pattern, skip
        }
      }
    }
  }

  return null;
}
