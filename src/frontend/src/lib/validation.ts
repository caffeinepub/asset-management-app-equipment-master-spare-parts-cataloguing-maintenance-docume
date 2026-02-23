/**
 * Validation helper functions for form inputs
 */

import type { AttributeDefinition } from '@/hooks/useQueries';

/**
 * Validate an attribute value based on its definition
 */
export function validateAttributeValue(
  value: string,
  definition: AttributeDefinition
): { valid: boolean; error?: string } {
  // Check required
  if (definition.required && (!value || value.trim() === '')) {
    return { valid: false, error: `${definition.name} is required` };
  }

  // If not required and empty, it's valid
  if (!value || value.trim() === '') {
    return { valid: true };
  }

  // Type-specific validation
  switch (definition.attributeType) {
    case 'number':
      if (isNaN(Number(value))) {
        return { valid: false, error: `${definition.name} must be a valid number` };
      }
      break;

    case 'date':
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return { valid: false, error: `${definition.name} must be a valid date` };
      }
      break;

    case 'select':
      if (definition.allowedValues && !definition.allowedValues.includes(value)) {
        return {
          valid: false,
          error: `${definition.name} must be one of: ${definition.allowedValues.join(', ')}`,
        };
      }
      break;
  }

  // Parse and apply validation rules
  if (definition.validationRules) {
    const rules = parseValidationRules(definition.validationRules);

    // Min length
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return {
        valid: false,
        error: `${definition.name} must be at least ${rules.minLength} characters`,
      };
    }

    // Max length
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return {
        valid: false,
        error: `${definition.name} must be at most ${rules.maxLength} characters`,
      };
    }

    // Min value (for numbers)
    if (rules.min !== undefined && definition.attributeType === 'number') {
      const numValue = Number(value);
      if (numValue < rules.min) {
        return { valid: false, error: `${definition.name} must be at least ${rules.min}` };
      }
    }

    // Max value (for numbers)
    if (rules.max !== undefined && definition.attributeType === 'number') {
      const numValue = Number(value);
      if (numValue > rules.max) {
        return { valid: false, error: `${definition.name} must be at most ${rules.max}` };
      }
    }

    // Pattern (regex)
    if (rules.pattern) {
      try {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          return {
            valid: false,
            error: `${definition.name} does not match the required format`,
          };
        }
      } catch (e) {
        console.warn('Invalid regex pattern:', rules.pattern);
      }
    }
  }

  return { valid: true };
}

/**
 * Parse validation rules string into structured format
 * Expected format: "minLength:5;maxLength:50;pattern:^[A-Z]"
 */
function parseValidationRules(rulesString: string): {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
} {
  const rules: any = {};

  if (!rulesString) return rules;

  const parts = rulesString.split(';');
  for (const part of parts) {
    const [key, value] = part.split(':').map((s) => s.trim());
    if (!key || !value) continue;

    switch (key.toLowerCase()) {
      case 'minlength':
        rules.minLength = parseInt(value, 10);
        break;
      case 'maxlength':
        rules.maxLength = parseInt(value, 10);
        break;
      case 'min':
        rules.min = parseFloat(value);
        break;
      case 'max':
        rules.max = parseFloat(value);
        break;
      case 'pattern':
        rules.pattern = value;
        break;
    }
  }

  return rules;
}

/**
 * Validate all attributes in a form
 */
export function validateAttributes(
  attributes: Record<string, string>,
  definitions: AttributeDefinition[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const definition of definitions) {
    const value = attributes[definition.name] || '';
    const result = validateAttributeValue(value, definition);

    if (!result.valid && result.error) {
      errors[definition.name] = result.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
