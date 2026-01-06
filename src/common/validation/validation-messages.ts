export type FieldType = 'string' | 'number' | 'boolean' | 'email' | 'date';

export const ValidationMessages = {
  type: (field: string, type: FieldType): string =>
    `${field} must be a ${type}`,

  required: (field: string): string => `${field} is required`,

  minLength: (field: string, min: number): string =>
    `${field} must be at least ${min} characters`,

  maxLength: (field: string, max: number): string =>
    `${field} must not exceed ${max} characters`,

  min: (field: string, min: number): string =>
    `${field} must be at least ${min}`,

  max: (field: string, max: number): string =>
    `${field} must not exceed ${max}`,

  isIn: (field: string, values: string[]): string =>
    `${field} must be one of: ${values.join(', ')}`,

  email: (field: string): string => `${field} must be a valid email address`,
};
