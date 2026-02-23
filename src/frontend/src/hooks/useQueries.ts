import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Equipment, SparePart, CataloguingRecord, MaintenanceRecord, Document, UserProfile, UserRole, ExternalBlob } from '@/backend';
import { Variant_scheduled_completed_overdue } from '@/backend';
import { safeExtractErrorMessage } from '@/lib/errors';

// ============================================================================
// Type Exports for Components
// ============================================================================

// Define AttributeDefinition type locally since it's not in backend yet
export interface AttributeDefinition {
  fieldName: string;
  dataType: 'float' | 'int' | 'string' | 'bool' | 'dropdown';
  required: boolean;
  validationRules?: string;
}

// Extended types for cataloguing features (not yet in backend)
export interface SparePartWithAttributes extends SparePart {
  noun?: string;
  modifier?: string;
  attributes?: Record<string, string>;
  equipmentList?: Equipment[];
}

// ============================================================================
// User Profile Queries
// ============================================================================

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ============================================================================
// User Role Queries
// ============================================================================

/**
 * USER ROLE RETRIEVAL HOOK:
 * 
 * This hook retrieves the current authenticated user's role from the backend by calling
 * actor.getCallerUserRole(). The backend method returns a UserRole enum value which can be:
 * - UserRole.admin: Full administrative access
 * - UserRole.user: Standard user access
 * - UserRole.guest: Limited guest access
 * 
 * The backend determines the role by:
 * 1. Checking if the caller's principal matches the hardcoded admin principal
 * 2. Looking up any role assignments in the authorization component's state
 * 3. Defaulting to 'guest' for unauthenticated or unassigned users
 * 
 * React Query Configuration:
 * - queryKey: ['currentUserRole'] - Unique identifier for caching this query
 * - enabled: Only runs when actor is initialized and not fetching
 * - retry: false - Don't retry on failure to avoid unnecessary backend calls
 * 
 * Integration with Authorization Component:
 * This hook integrates with the prefabricated authorization component which provides
 * role-based access control. The backend's AccessControl module manages role assignments
 * and permission checks, ensuring that only authorized users can perform restricted actions.
 */
export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

/**
 * ADMIN STATUS CHECK HOOK:
 * 
 * This hook provides a simplified boolean check for whether the current user has admin privileges.
 * It calls the backend's isCallerAdmin() method, which internally checks if the authenticated
 * user's principal has admin permissions through the AccessControl module.
 * 
 * Backend Implementation:
 * The backend method isCallerAdmin() calls AccessControl.isAdmin(accessControlState, caller),
 * which checks if the caller's principal:
 * 1. Matches the hardcoded admin principal (set during canister initialization)
 * 2. Has been explicitly assigned the admin role via assignCallerUserRole
 * 
 * React Query Configuration:
 * - queryKey: ['isCallerAdmin'] - Cached separately from the full role query
 * - Returns: boolean (true if admin, false otherwise)
 * - enabled: Only runs when actor is initialized and not fetching
 * - retry: false - Prevents retry loops on permission errors
 * 
 * Usage Pattern:
 * This hook is used in components that need to conditionally render admin-only features,
 * such as the attribute template import interface in CataloguingPage. The boolean return
 * value makes it easy to use in conditional rendering logic:
 * 
 * const { data: isAdmin, isLoading } = useIsCallerAdmin();
 * if (isAdmin) { // render admin features }
 * 
 * The hook integrates with the authorization component's role-based UI rendering patterns,
 * ensuring that frontend visibility matches backend permission enforcement.
 */
export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

// ============================================================================
// Equipment Queries
// ============================================================================

export function useGetAllEquipment() {
  const { actor, isFetching } = useActor();

  return useQuery<Equipment[]>({
    queryKey: ['equipment'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEquipment();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for compatibility
export const useGetEquipmentList = useGetAllEquipment;

export function useGetEquipment(equipmentNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Equipment | null>({
    queryKey: ['equipment', equipmentNumber?.toString()],
    queryFn: async () => {
      if (!actor || !equipmentNumber) return null;
      return actor.getEquipment(equipmentNumber);
    },
    enabled: !!actor && !isFetching && equipmentNumber !== null,
  });
}

export function useGetNextEquipmentNumber() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['nextEquipmentNumber'],
    queryFn: async () => {
      if (!actor) return BigInt(1);
      const allEquipment = await actor.getAllEquipment();
      if (allEquipment.length === 0) return BigInt(1);
      const maxNumber = allEquipment.reduce((max, eq) => 
        eq.equipmentNumber > max ? eq.equipmentNumber : max, BigInt(0));
      return maxNumber + BigInt(1);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateEquipment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipment: Equipment) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.createEquipment(equipment);
      if (!result) throw new Error('Failed to create equipment');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['nextEquipmentNumber'] });
    },
    onError: (error: unknown) => {
      throw new Error(safeExtractErrorMessage(error));
    },
  });
}

export function useUpdateEquipment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipment: Equipment) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.updateEquipment(equipment);
      if (!result) throw new Error('Failed to update equipment');
      return result;
    },
    onSuccess: (_, equipment) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', equipment.equipmentNumber.toString()] });
    },
    onError: (error: unknown) => {
      throw new Error(safeExtractErrorMessage(error));
    },
  });
}

export function useDeleteEquipment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipmentNumber: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.deleteEquipment(equipmentNumber);
      if (!result) throw new Error('Failed to delete equipment');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
    onError: (error: unknown) => {
      throw new Error(safeExtractErrorMessage(error));
    },
  });
}

export function useFindEquipmentByMatching() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      searchTerm,
      matchEquipmentNumber = false,
      matchEquipmentTagNumber = true,
      matchName = true,
      matchModel = true,
      matchSerialNumber = true,
    }: {
      searchTerm: string;
      matchEquipmentNumber?: boolean;
      matchEquipmentTagNumber?: boolean;
      matchName?: boolean;
      matchModel?: boolean;
      matchSerialNumber?: boolean;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.findEquipmentByMatching(
        searchTerm,
        matchEquipmentNumber,
        matchEquipmentTagNumber,
        matchName,
        matchModel,
        matchSerialNumber
      );
    },
  });
}

// Global search for equipment
export function useGlobalSearchEquipment(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Equipment[]>({
    queryKey: ['globalSearchEquipment', searchTerm],
    queryFn: async () => {
      if (!actor || searchTerm.length < 2) return [];
      return actor.findEquipmentByMatching(searchTerm, false, true, true, true, true);
    },
    enabled: !!actor && !isFetching && searchTerm.length >= 2,
  });
}

// ============================================================================
// Spare Parts Queries
// ============================================================================

export function useGetAllSpareParts() {
  const { actor, isFetching } = useActor();

  return useQuery<SparePart[]>({
    queryKey: ['spareParts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSpareParts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSparePartsForEquipment(equipmentNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SparePart[]>({
    queryKey: ['spareParts', 'equipment', equipmentNumber?.toString()],
    queryFn: async () => {
      if (!actor || !equipmentNumber) return [];
      return actor.getSparePartsForEquipment(equipmentNumber);
    },
    enabled: !!actor && !isFetching && equipmentNumber !== null,
  });
}

// Alias for compatibility
export const useGetSparePartsByEquipment = useGetSparePartsForEquipment;

export function useCreateSparePart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (part: SparePart) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.createSparePart(part);
      if (!result) throw new Error('Failed to create spare part');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spareParts'] });
    },
    onError: (error: unknown) => {
      throw new Error(safeExtractErrorMessage(error));
    },
  });
}

export function useAddOrUpdateSparePart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ part, equipmentNumber }: { part: SparePart; equipmentNumber: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.addOrUpdateSparePart(part, equipmentNumber);
      if (!result) throw new Error('Failed to add or update spare part');
      return result;
    },
    onSuccess: (_, { equipmentNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['spareParts'] });
      queryClient.invalidateQueries({ queryKey: ['spareParts', 'equipment', equipmentNumber.toString()] });
    },
    onError: (error: unknown) => {
      throw new Error(safeExtractErrorMessage(error));
    },
  });
}

// Alias for compatibility
export const useUpdateSparePart = useAddOrUpdateSparePart;
export const useLinkExistingSparePart = useAddOrUpdateSparePart;

export function useUnlinkSparePartFromEquipment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ equipmentNumber, partNumber }: { equipmentNumber: bigint; partNumber: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.unlinkSparePartFromEquipment(equipmentNumber, partNumber);
      if (!result) throw new Error('Failed to unlink spare part');
      return result;
    },
    onSuccess: (_, { equipmentNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['spareParts'] });
      queryClient.invalidateQueries({ queryKey: ['spareParts', 'equipment', equipmentNumber.toString()] });
    },
    onError: (error: unknown) => {
      throw new Error(safeExtractErrorMessage(error));
    },
  });
}

export function useDeleteSparePartByPartNumber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partNumber: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.deleteSparePartByPartNumber(partNumber);
      if (!result) throw new Error('Failed to delete spare part');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spareParts'] });
    },
    onError: (error: unknown) => {
      throw new Error(safeExtractErrorMessage(error));
    },
  });
}

// Alias for compatibility
export const useDeleteSparePart = useDeleteSparePartByPartNumber;

export function useFindSparePartByMatching() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      searchTerm,
      matchManufacturerPartNo = true,
      matchName = true,
      matchDescription = true,
    }: {
      searchTerm: string;
      matchManufacturerPartNo?: boolean;
      matchName?: boolean;
      matchDescription?: boolean;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.findSparePartByMatching(
        searchTerm,
        matchManufacturerPartNo,
        matchName,
        matchDescription
      );
    },
  });
}

// Global search for spare parts
export function useGlobalSearchSpareParts(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<SparePart[]>({
    queryKey: ['globalSearchSpareParts', searchTerm],
    queryFn: async () => {
      if (!actor || searchTerm.length < 2) return [];
      return actor.findSparePartByMatching(searchTerm, true, true, true);
    },
    enabled: !!actor && !isFetching && searchTerm.length >= 2,
  });
}

// ============================================================================
// Cataloguing Queries
// ============================================================================

export function useGetAllCataloguingRecords(equipmentNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<CataloguingRecord[]>({
    queryKey: ['cataloguing', equipmentNumber?.toString()],
    queryFn: async () => {
      if (!actor || !equipmentNumber) return [];
      return actor.getAllCataloguingRecords(equipmentNumber);
    },
    enabled: !!actor && !isFetching && equipmentNumber !== null,
  });
}

export function useUpdateCataloguingRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: CataloguingRecord) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.updateCataloguingRecord(record);
      if (!result) throw new Error('Failed to update cataloguing record');
      return result;
    },
    onSuccess: (_, record) => {
      queryClient.invalidateQueries({ queryKey: ['cataloguing', record.equipmentNumber.toString()] });
    },
    onError: (error: unknown) => {
      throw new Error(safeExtractErrorMessage(error));
    },
  });
}

export function useImportAttributeTemplate() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ blob, templateName }: { blob: ExternalBlob; templateName: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.importAttributeTemplateFromExcel(blob, templateName);
    },
    onError: (error: unknown) => {
      throw new Error(safeExtractErrorMessage(error));
    },
  });
}

// ============================================================================
// Stub Hooks for Features Not Yet Implemented in Backend
// ============================================================================

// Stub for advanced spare part search (not yet implemented in backend)
export function useSearchSparePartsAdvanced() {
  return {
    data: [] as SparePartWithAttributes[],
    isLoading: false,
    isError: false,
    error: null,
  };
}

// Stub for getting all spare parts with attributes (not yet implemented in backend)
export function useGetAllSparePartsWithAttributes() {
  const { data: spareParts = [] } = useGetAllSpareParts();
  
  return useQuery<SparePartWithAttributes[]>({
    queryKey: ['sparePartsWithAttributes'],
    queryFn: async () => {
      // Convert regular spare parts to extended type
      return spareParts.map(part => ({
        ...part,
        noun: undefined,
        modifier: undefined,
        attributes: {},
        equipmentList: [],
      }));
    },
    enabled: spareParts.length > 0,
  });
}

// Stub for getting nouns (not yet implemented in backend)
export function useGetNouns() {
  return useQuery<string[]>({
    queryKey: ['nouns'],
    queryFn: async () => {
      return ['Pump', 'Valve', 'Motor', 'Bearing', 'Seal', 'Filter'];
    },
  });
}

// Stub for getting modifiers (not yet implemented in backend)
export function useGetModifiers(noun: string) {
  return useQuery<string[]>({
    queryKey: ['modifiers', noun],
    queryFn: async () => {
      if (!noun) return [];
      return ['Centrifugal', 'Rotary', 'Reciprocating', 'Positive Displacement'];
    },
    enabled: !!noun,
  });
}

// Stub for getting attributes for noun-modifier combination (not yet implemented in backend)
export function useGetAttributesForNounModifier(noun: string, modifier: string) {
  return useQuery<AttributeDefinition[]>({
    queryKey: ['attributes', noun, modifier],
    queryFn: async () => {
      if (!noun || !modifier) return [];
      return [
        { fieldName: 'Material', dataType: 'string', required: true, validationRules: undefined },
        { fieldName: 'Size', dataType: 'string', required: true, validationRules: undefined },
        { fieldName: 'Pressure Rating', dataType: 'string', required: false, validationRules: undefined },
      ];
    },
    enabled: !!noun && !!modifier,
  });
}

// Stub for getting next spare part number (not yet implemented in backend)
export function useGetNextSparePartNumber() {
  const { data: spareParts = [] } = useGetAllSpareParts();
  
  return useQuery<bigint>({
    queryKey: ['nextSparePartNumber'],
    queryFn: async () => {
      if (spareParts.length === 0) return BigInt(1);
      const maxNumber = spareParts.reduce((max, part) => 
        part.partNumber > max ? part.partNumber : max, BigInt(0));
      return maxNumber + BigInt(1);
    },
  });
}

// Stub for getting spare part by number (not yet implemented in backend)
export function useGetSparePartByNumber(partNumber: bigint | null) {
  const { data: spareParts = [] } = useGetAllSpareParts();
  
  return useQuery<SparePartWithAttributes | null>({
    queryKey: ['sparePart', partNumber?.toString()],
    queryFn: async () => {
      if (!partNumber) return null;
      const part = spareParts.find(p => p.partNumber === partNumber);
      if (!part) return null;
      return {
        ...part,
        noun: undefined,
        modifier: undefined,
        attributes: {},
        equipmentList: [],
      };
    },
    enabled: partNumber !== null,
  });
}

// Stub for creating spare part with attributes (not yet implemented in backend)
export function useCreateSparePartWithAttributes() {
  const createMutation = useCreateSparePart();
  
  return useMutation({
    mutationFn: async ({ noun, modifier, attributes }: { noun: string; modifier: string; attributes: [string, string][] }) => {
      // For now, create a basic spare part without attributes
      const part: SparePart = {
        partNumber: BigInt(Date.now()),
        name: `${noun} - ${modifier}`,
        description: `${noun} ${modifier}`,
        quantity: BigInt(0),
        supplier: '',
        manufacturer: '',
        manufacturerPartNo: '',
        modelSerial: '',
        attachment: undefined,
        additionalInformation: '',
      };
      await createMutation.mutateAsync(part);
      return part.partNumber;
    },
  });
}

// Stub for updating spare part attributes (not yet implemented in backend)
export function useUpdateSparePartAttributes() {
  return useMutation({
    mutationFn: async ({ partNumber, noun, modifier, attributes }: { partNumber: bigint; noun: string; modifier: string; attributes: [string, string][] }) => {
      // Stub implementation - backend method not available
      console.log('Update spare part attributes:', { partNumber, noun, modifier, attributes });
      return true;
    },
  });
}

// Stub for getting equipment for spare part (not yet implemented in backend)
export function useGetEquipmentForSparePart(partNumber: bigint | null) {
  return useQuery<Equipment[]>({
    queryKey: ['equipmentForSparePart', partNumber?.toString()],
    queryFn: async () => {
      // Backend method not available
      return [];
    },
    enabled: partNumber !== null,
  });
}

// Stub for linking spare part to equipment (not yet implemented in backend)
export function useLinkSparePartToEquipment() {
  const linkMutation = useAddOrUpdateSparePart();
  
  return useMutation({
    mutationFn: async ({ partNumber, equipmentNumber }: { partNumber: bigint; equipmentNumber: bigint }) => {
      // Use existing addOrUpdateSparePart as a workaround
      // This requires fetching the spare part first
      throw new Error('Backend method linkSparePartToEquipment not available');
    },
  });
}

// Stub for getting equipment using spare part (not yet implemented in backend)
export function useGetEquipmentUsingSparePart(partNumber: bigint | null) {
  return useQuery<Equipment[]>({
    queryKey: ['equipmentUsingSparePart', partNumber?.toString()],
    queryFn: async () => {
      // Backend method not available
      return [];
    },
    enabled: partNumber !== null,
  });
}

// ============================================================================
// Maintenance Queries
// ============================================================================

export function useGetAllMaintenanceRecords(equipmentNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<MaintenanceRecord[]>({
    queryKey: ['maintenance', equipmentNumber?.toString()],
    queryFn: async () => {
      if (!actor || !equipmentNumber) return [];
      return actor.getAllMaintenanceRecords(equipmentNumber);
    },
    enabled: !!actor && !isFetching && equipmentNumber !== null,
  });
}

export function useUpdateMaintenanceRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: MaintenanceRecord) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.updateMaintenanceRecord(record);
      if (!result) throw new Error('Failed to update maintenance record');
      return result;
    },
    onSuccess: (_, record) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', record.equipmentNumber.toString()] });
    },
    onError: (error: unknown) => {
      throw new Error(safeExtractErrorMessage(error));
    },
  });
}

// Get maintenance records filtered by status
export function useGetMaintenanceDue() {
  const { actor, isFetching } = useActor();

  return useQuery<MaintenanceRecord[]>({
    queryKey: ['maintenanceDue'],
    queryFn: async () => {
      if (!actor) return [];
      const allEquipment = await actor.getAllEquipment();
      const allRecords: MaintenanceRecord[] = [];
      
      for (const equipment of allEquipment) {
        const records = await actor.getAllMaintenanceRecords(equipment.equipmentNumber);
        allRecords.push(...records);
      }
      
      return allRecords.filter(
        record => record.maintenanceStatus === Variant_scheduled_completed_overdue.scheduled ||
                  record.maintenanceStatus === Variant_scheduled_completed_overdue.overdue
      );
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for compatibility
export const useGetMaintenanceDueReport = useGetMaintenanceDue;

// ============================================================================
// Document Queries
// ============================================================================

export function useGetAllDocuments(equipmentNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Document[]>({
    queryKey: ['documents', equipmentNumber?.toString()],
    queryFn: async () => {
      if (!actor || !equipmentNumber) return [];
      return actor.getAllDocuments(equipmentNumber);
    },
    enabled: !!actor && !isFetching && equipmentNumber !== null,
  });
}

export function useDeleteDocument() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ equipmentNumber, docId }: { equipmentNumber: bigint; docId: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.deleteDocument(equipmentNumber, docId);
      if (!result) throw new Error('Failed to delete document');
      return result;
    },
    onSuccess: (_, { equipmentNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', equipmentNumber.toString()] });
    },
    onError: (error: unknown) => {
      throw new Error(safeExtractErrorMessage(error));
    },
  });
}
