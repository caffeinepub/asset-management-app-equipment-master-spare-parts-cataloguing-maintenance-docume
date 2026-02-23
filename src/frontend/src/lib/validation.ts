/**
 * Form validation helper functions
 */

import type { AttributeDefinition } from '@/hooks/useQueries';

/**
 * Validates a single attribute value based on its definition
 */
export function validateAttributeValue(
  value: string,
  definition: AttributeDefinition
): { valid: boolean; error?: string } {
  // Check required fields
  if (definition.required && (!value || value.trim() === '')) {
    return { valid: false, error: `${definition.fieldName} is required` };
  }

  // If empty and not required, it's valid
  if (!value || value.trim() === '') {
    return { valid: true };
  }

  // Validate based on data type
  switch (definition.dataType) {
    case 'int':
      if (!/^-?\d+$/.test(value)) {
        return { valid: false, error: `${definition.fieldName} must be an integer` };
      }
      break;

    case 'float':
      if (!/^-?\d*\.?\d+$/.test(value)) {
        return { valid: false, error: `${definition.fieldName} must be a number` };
      }
      break;

    case 'bool':
      if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
        return { valid: false, error: `${definition.fieldName} must be a boolean value` };
      }
      break;

    case 'string':
      // String validation - check validation rules if present
      if (definition.validationRules) {
        try {
          const rules = JSON.parse(definition.validationRules);
          if (rules.minLength && value.length < rules.minLength) {
            return {
              valid: false,
              error: `${definition.fieldName} must be at least ${rules.minLength} characters`,
            };
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            return {
              valid: false,
              error: `${definition.fieldName} must be at most ${rules.maxLength} characters`,
            };
          }
          if (rules.pattern) {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(value)) {
              return {
                valid: false,
                error: `${definition.fieldName} format is invalid`,
              };
            }
          }
        } catch (e) {
          // If validation rules can't be parsed, skip validation
          console.warn('Failed to parse validation rules:', definition.validationRules);
        }
      }
      break;

    case 'dropdown':
      // Dropdown validation - check if value is in allowed options
      if (definition.validationRules) {
        try {
          const rules = JSON.parse(definition.validationRules);
          if (rules.options && Array.isArray(rules.options)) {
            if (!rules.options.includes(value)) {
              return {
                valid: false,
                error: `${definition.fieldName} must be one of: ${rules.options.join(', ')}`,
              };
            }
          }
        } catch (e) {
          console.warn('Failed to parse dropdown options:', definition.validationRules);
        }
      }
      break;
  }

  return { valid: true };
}

/**
 * Validates all attributes against their definitions
 */
export function validateAttributes(
  attributes: Record<string, string>,
  definitions: AttributeDefinition[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const definition of definitions) {
    const value = attributes[definition.fieldName] || '';
    const result = validateAttributeValue(value, definition);

    if (!result.valid && result.error) {
      errors[definition.fieldName] = result.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates equipment form data
 */
export function validateEquipmentForm(data: {
  equipmentTagNumber: string;
  name: string;
  location: string;
  manufacturer: string;
  model: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.equipmentTagNumber || data.equipmentTagNumber.trim() === '') {
    errors.equipmentTagNumber = 'Equipment tag number is required';
  }

  if (!data.name || data.name.trim() === '') {
    errors.name = 'Equipment name is required';
  }

  if (!data.location || data.location.trim() === '') {
    errors.location = 'Location is required';
  }

  if (!data.manufacturer || data.manufacturer.trim() === '') {
    errors.manufacturer = 'Manufacturer is required';
  }

  if (!data.model || data.model.trim() === '') {
    errors.model = 'Model is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates spare part form data
 */
export function validateSparePartForm(data: {
  name: string;
  description: string;
  quantity: number;
  supplier: string;
  manufacturer: string;
  manufacturerPartNo: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim() === '') {
    errors.name = 'Spare part name is required';
  }

  if (!data.description || data.description.trim() === '') {
    errors.description = 'Description is required';
  }

  if (data.quantity < 0) {
    errors.quantity = 'Quantity must be a positive number';
  }

  if (!data.supplier || data.supplier.trim() === '') {
    errors.supplier = 'Supplier is required';
  }

  if (!data.manufacturer || data.manufacturer.trim() === '') {
    errors.manufacturer = 'Manufacturer is required';
  }

  if (!data.manufacturerPartNo || data.manufacturerPartNo.trim() === '') {
    errors.manufacturerPartNo = 'Manufacturer part number is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
