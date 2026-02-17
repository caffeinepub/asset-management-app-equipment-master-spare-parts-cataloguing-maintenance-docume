/**
 * Production runtime checks to verify backend canister configuration
 */

import type { backendInterface } from '@/backend';

/**
 * Verifies that the backend actor has the required methods for equipment creation.
 * This check helps diagnose production deployment issues where the backend
 * canister may not have been properly upgraded.
 * 
 * @param actor - The backend actor instance
 * @throws Error if createEquipment method is not available
 */
export function assertCreateEquipmentAvailable(actor: backendInterface): void {
  // Check if updateEquipment exists (used for creating equipment)
  if (typeof actor.updateEquipment !== 'function') {
    throw new Error(
      'Backend configuration error: updateEquipment method not found. ' +
      'This usually means the backend canister needs to be upgraded. ' +
      'Please contact support or redeploy the application.'
    );
  }
}

/**
 * Checks if the backend has all required methods for the application to function.
 * Returns a user-friendly error message if any critical methods are missing.
 * 
 * @param actor - The backend actor instance
 * @returns null if all methods exist, or an error message string if methods are missing
 */
export function checkBackendMethods(actor: backendInterface): string | null {
  const requiredMethods = [
    'getAllEquipment',
    'getEquipment',
    'updateEquipment',
    'deleteEquipment',
    'getSpareParts',
    'updateSparePart',
    'deleteSparePart',
    'getCataloguingRecords',
    'updateCataloguingRecord',
    'getMaintenanceRecords',
    'updateMaintenanceRecord',
    'getDocuments',
    'deleteDocument',
  ];

  const missingMethods = requiredMethods.filter(
    method => typeof (actor as any)[method] !== 'function'
  );

  if (missingMethods.length > 0) {
    return `Backend is missing required methods: ${missingMethods.join(', ')}. Please upgrade the backend canister.`;
  }

  return null;
}
