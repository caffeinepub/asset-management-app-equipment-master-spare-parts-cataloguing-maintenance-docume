export function validateRequired(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') {
    return 'This field is required';
  }
  return null;
}

export function validateNumber(value: string): string | null {
  if (value && isNaN(Number(value))) {
    return 'Please enter a valid number';
  }
  return null;
}

export function validateEmail(value: string): string | null {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Please enter a valid email address';
  }
  return null;
}
