import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Equipment, SparePart, CataloguingRecord, MaintenanceRecord, Document, UserProfile, ExternalBlob } from '@/backend';
import { extractErrorMessage } from '@/lib/errors';

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
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
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
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
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
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
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
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
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
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
    },
  });
}

// Alias for compatibility
export const useUpdateSparePart = useAddOrUpdateSparePart;

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
      queryClient.invalidateQueries({ queryKey: ['spareParts', 'equipment', equipmentNumber.toString()] });
    },
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
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
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
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
      return actor.findSparePartByMatching(searchTerm, matchManufacturerPartNo, matchName, matchDescription);
    },
  });
}

// Alias for compatibility
export const useSearchSpareParts = useFindSparePartByMatching;

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

// Link existing spare part to equipment
export function useLinkExistingSparePart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ part, equipmentNumber }: { part: SparePart; equipmentNumber: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.addOrUpdateSparePart(part, equipmentNumber);
      if (!result) throw new Error('Failed to link spare part');
      return result;
    },
    onSuccess: (_, { equipmentNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['spareParts', 'equipment', equipmentNumber.toString()] });
    },
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
    },
  });
}

// Get equipment using a spare part
export function useGetEquipmentUsingSparePart(partNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Equipment[]>({
    queryKey: ['equipmentUsingSparePart', partNumber?.toString()],
    queryFn: async () => {
      if (!actor || !partNumber) return [];
      const allEquipment = await actor.getAllEquipment();
      const equipmentWithPart: Equipment[] = [];
      
      for (const equipment of allEquipment) {
        const spareParts = await actor.getSparePartsForEquipment(equipment.equipmentNumber);
        if (spareParts.some(sp => sp.partNumber === partNumber)) {
          equipmentWithPart.push(equipment);
        }
      }
      
      return equipmentWithPart;
    },
    enabled: !!actor && !isFetching && partNumber !== null,
  });
}

// ============================================================================
// Cataloguing Module Queries (Pending Backend Implementation)
// ============================================================================

export type AttributeDefinition = {
  name: string;
  attributeType: 'text' | 'number' | 'textarea' | 'select' | 'date';
  validationRules?: string;
  required: boolean;
  allowedValues?: string[];
};

export type SparePartWithAttributes = {
  partNumber: bigint;
  noun: string;
  modifier: string;
  attributes: Record<string, string>;
  description: string;
  equipmentList?: Equipment[];
};

// Import attribute template from Excel file
export function useImportAttributeTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (excelBlob: ExternalBlob) => {
      if (!actor) throw new Error('Actor not initialized');
      
      // Backend method required: importAttributeTemplateFromExcel
      if (!('importAttributeTemplateFromExcel' in actor)) {
        throw new Error('Backend method importAttributeTemplateFromExcel not implemented');
      }
      
      const result = await (actor as any).importAttributeTemplateFromExcel(excelBlob);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeDefinitions'] });
      queryClient.invalidateQueries({ queryKey: ['nouns'] });
    },
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
    },
  });
}

// Get all attribute definitions
export function useGetAttributeDefinitions() {
  const { actor, isFetching } = useActor();

  return useQuery<AttributeDefinition[]>({
    queryKey: ['attributeDefinitions'],
    queryFn: async () => {
      if (!actor) return [];
      
      // Backend method required: getAttributeDefinitions
      if (!('getAttributeDefinitions' in actor)) {
        console.warn('Backend method getAttributeDefinitions not implemented');
        return [];
      }
      
      return (actor as any).getAttributeDefinitions();
    },
    enabled: !!actor && !isFetching,
  });
}

// Get list of nouns
export function useGetNouns() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['nouns'],
    queryFn: async () => {
      if (!actor) return [];
      
      // Backend method required: getNouns
      if (!('getNouns' in actor)) {
        console.warn('Backend method getNouns not implemented');
        return [];
      }
      
      return (actor as any).getNouns();
    },
    enabled: !!actor && !isFetching,
  });
}

// Get modifiers for a specific noun
export function useGetModifiers(noun: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['modifiers', noun],
    queryFn: async () => {
      if (!actor || !noun) return [];
      
      // Backend method required: getModifiersForNoun
      if (!('getModifiersForNoun' in actor)) {
        console.warn('Backend method getModifiersForNoun not implemented');
        return [];
      }
      
      return (actor as any).getModifiersForNoun(noun);
    },
    enabled: !!actor && !isFetching && !!noun,
  });
}

// Get attributes for a specific noun-modifier combination
export function useGetAttributesForNounModifier(noun: string, modifier: string) {
  const { actor, isFetching } = useActor();

  return useQuery<AttributeDefinition[]>({
    queryKey: ['attributes', noun, modifier],
    queryFn: async () => {
      if (!actor || !noun || !modifier) return [];
      
      // Backend method required: getAttributesForNounModifier
      if (!('getAttributesForNounModifier' in actor)) {
        console.warn('Backend method getAttributesForNounModifier not implemented');
        return [];
      }
      
      return (actor as any).getAttributesForNounModifier(noun, modifier);
    },
    enabled: !!actor && !isFetching && !!noun && !!modifier,
  });
}

// Get next spare part number
export function useGetNextSparePartNumber() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['nextSparePartNumber'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      
      // Backend method required: getNextSparePartNumber
      if (!('getNextSparePartNumber' in actor)) {
        console.warn('Backend method getNextSparePartNumber not implemented');
        return BigInt(0);
      }
      
      return (actor as any).getNextSparePartNumber();
    },
    enabled: !!actor && !isFetching,
  });
}

// Create spare part with attributes
export function useCreateSparePartWithAttributes() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noun,
      modifier,
      attributes,
    }: {
      noun: string;
      modifier: string;
      attributes: Array<[string, string]>;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      // Backend method required: createSparePartWithAttributes
      if (!('createSparePartWithAttributes' in actor)) {
        throw new Error('Backend method createSparePartWithAttributes not implemented');
      }
      
      const partNumber = await (actor as any).createSparePartWithAttributes(noun, modifier, attributes);
      return partNumber;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spareParts'] });
      queryClient.invalidateQueries({ queryKey: ['nextSparePartNumber'] });
    },
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
    },
  });
}

// Update spare part attributes
export function useUpdateSparePartAttributes() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      partNumber,
      attributes,
    }: {
      partNumber: bigint;
      attributes: Array<[string, string]>;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      // Backend method required: updateSparePartAttributes
      if (!('updateSparePartAttributes' in actor)) {
        throw new Error('Backend method updateSparePartAttributes not implemented');
      }
      
      const result = await (actor as any).updateSparePartAttributes(partNumber, attributes);
      if (!result) throw new Error('Failed to update spare part attributes');
      return result;
    },
    onSuccess: (_, { partNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['spareParts'] });
      queryClient.invalidateQueries({ queryKey: ['sparePartByNumber', partNumber.toString()] });
    },
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
    },
  });
}

// Get spare part by number (with attributes)
export function useGetSparePartByNumber(partNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SparePartWithAttributes | null>({
    queryKey: ['sparePartByNumber', partNumber?.toString()],
    queryFn: async () => {
      if (!actor || !partNumber) return null;
      
      // Backend method required: getSparePartByNumber
      if (!('getSparePartByNumber' in actor)) {
        console.warn('Backend method getSparePartByNumber not implemented');
        return null;
      }
      
      return (actor as any).getSparePartByNumber(partNumber);
    },
    enabled: !!actor && !isFetching && partNumber !== null,
  });
}

// Get all spare parts with attributes (for cataloguing)
export function useGetAllSparePartsWithAttributes() {
  const { actor, isFetching } = useActor();

  return useQuery<SparePartWithAttributes[]>({
    queryKey: ['sparePartsWithAttributes'],
    queryFn: async () => {
      if (!actor) return [];
      
      // Backend method required: getAllSparePartsWithAttributes
      if (!('getAllSparePartsWithAttributes' in actor)) {
        console.warn('Backend method getAllSparePartsWithAttributes not implemented');
        return [];
      }
      
      return (actor as any).getAllSparePartsWithAttributes();
    },
    enabled: !!actor && !isFetching,
  });
}

// Get equipment for spare part
export function useGetEquipmentForSparePart(partNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Equipment[]>({
    queryKey: ['equipmentForSparePart', partNumber?.toString()],
    queryFn: async () => {
      if (!actor || !partNumber) return [];
      
      // Backend method required: getEquipmentForSparePart
      if (!('getEquipmentForSparePart' in actor)) {
        console.warn('Backend method getEquipmentForSparePart not implemented');
        return [];
      }
      
      return (actor as any).getEquipmentForSparePart(partNumber);
    },
    enabled: !!actor && !isFetching && partNumber !== null,
  });
}

// Link spare part to equipment
export function useLinkSparePartToEquipment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partNumber, equipmentNumber }: { partNumber: bigint; equipmentNumber: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      // Backend method required: linkSparePartToEquipment
      if (!('linkSparePartToEquipment' in actor)) {
        throw new Error('Backend method linkSparePartToEquipment not implemented');
      }
      
      const result = await (actor as any).linkSparePartToEquipment(partNumber, equipmentNumber);
      if (!result) throw new Error('Failed to link spare part to equipment');
      return result;
    },
    onSuccess: (_, { partNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['equipmentForSparePart', partNumber.toString()] });
    },
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
    },
  });
}

// Unlink spare part from equipment (cataloguing version)
export function useUnlinkSparePartFromEquipmentCataloguing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partNumber, equipmentNumber }: { partNumber: bigint; equipmentNumber: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      // Use existing backend method
      const result = await actor.unlinkSparePartFromEquipment(equipmentNumber, partNumber);
      if (!result) throw new Error('Failed to unlink spare part from equipment');
      return result;
    },
    onSuccess: (_, { partNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['equipmentForSparePart', partNumber.toString()] });
    },
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
    },
  });
}

// Advanced search for spare parts
export function useSearchSparePartsAdvanced(filters: any) {
  const { actor, isFetching } = useActor();

  return useQuery<SparePartWithAttributes[]>({
    queryKey: ['sparePartsAdvancedSearch', filters],
    queryFn: async () => {
      if (!actor) return [];
      
      // Backend method required: searchSparePartsAdvanced
      if (!('searchSparePartsAdvanced' in actor)) {
        console.warn('Backend method searchSparePartsAdvanced not implemented');
        return [];
      }
      
      return (actor as any).searchSparePartsAdvanced(filters);
    },
    enabled: !!actor && !isFetching,
  });
}

// ============================================================================
// Cataloguing Records Queries
// ============================================================================

export function useGetAllCataloguingRecords(equipmentNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<CataloguingRecord[]>({
    queryKey: ['cataloguingRecords', equipmentNumber?.toString()],
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
      queryClient.invalidateQueries({ queryKey: ['cataloguingRecords', record.equipmentNumber.toString()] });
    },
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
    },
  });
}

// ============================================================================
// Maintenance Records Queries
// ============================================================================

export function useGetAllMaintenanceRecords(equipmentNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<MaintenanceRecord[]>({
    queryKey: ['maintenanceRecords', equipmentNumber?.toString()],
    queryFn: async () => {
      if (!actor || !equipmentNumber) return [];
      return actor.getAllMaintenanceRecords(equipmentNumber);
    },
    enabled: !!actor && !isFetching && equipmentNumber !== null,
  });
}

export type MaintenanceDueReportItem = {
  equipment: Equipment;
  maintenanceRecords: MaintenanceRecord[];
};

export function useGetMaintenanceDueReport() {
  const { actor, isFetching } = useActor();

  return useQuery<MaintenanceDueReportItem[]>({
    queryKey: ['maintenanceDueReport'],
    queryFn: async () => {
      if (!actor) return [];
      const allEquipment = await actor.getAllEquipment();
      const results: MaintenanceDueReportItem[] = [];
      
      for (const equipment of allEquipment) {
        const maintenanceRecords = await actor.getAllMaintenanceRecords(equipment.equipmentNumber);
        if (maintenanceRecords.length > 0) {
          results.push({ equipment, maintenanceRecords });
        }
      }
      
      return results;
    },
    enabled: !!actor && !isFetching,
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
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords', record.equipmentNumber.toString()] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceDueReport'] });
    },
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
    },
  });
}

// ============================================================================
// Documents Queries
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
    onError: (error: any) => {
      throw new Error(extractErrorMessage(error));
    },
  });
}
