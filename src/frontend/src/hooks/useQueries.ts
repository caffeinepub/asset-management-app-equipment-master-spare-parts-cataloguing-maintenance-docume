import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Equipment, SparePart, CataloguingRecord, MaintenanceRecord, Document, UserProfile } from '@/backend';
import { ExternalBlob, Variant_scheduled_completed_overdue, Variant_submitted_draft, EngineeringDiscipline } from '@/backend';

// User Profile queries
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
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Equipment queries
export function useGetNextEquipmentNumber() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['next-equipment-number'],
    queryFn: async () => {
      if (!actor) return BigInt(1);
      const allEquipment = await actor.getAllEquipment();
      if (allEquipment.length === 0) return BigInt(1);
      const maxNumber = allEquipment.reduce((max, eq) => eq.equipmentNumber > max ? eq.equipmentNumber : max, BigInt(0));
      return maxNumber + BigInt(1);
    },
    enabled: !!actor && !isFetching,
  });
}

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

export function useGetEquipmentList() {
  const { actor, isFetching } = useActor();

  return useQuery<Equipment[]>({
    queryKey: ['equipment-list'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEquipment();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateEquipment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      equipmentTagNumber: string;
      location: string;
      manufacturer: string;
      model: string;
      serial: string;
      purchase: bigint;
      warranty: bigint;
      additionalInfo: string;
      discipline: EngineeringDiscipline;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      const allEquipment = await actor.getAllEquipment();
      const nextNumber = allEquipment.length === 0 ? BigInt(1) : 
        allEquipment.reduce((max, eq) => eq.equipmentNumber > max ? eq.equipmentNumber : max, BigInt(0)) + BigInt(1);
      
      const equipment: Equipment = {
        equipmentNumber: nextNumber,
        equipmentTagNumber: data.equipmentTagNumber,
        name: data.name,
        location: data.location,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serial,
        purchaseDate: data.purchase,
        warrantyExpiry: data.warranty,
        additionalInformation: data.additionalInfo,
        discipline: data.discipline,
      };
      
      const result = await actor.updateEquipment(equipment);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
      queryClient.invalidateQueries({ queryKey: ['next-equipment-number'] });
      queryClient.invalidateQueries({ queryKey: ['globalSearch'] });
      queryClient.refetchQueries({ queryKey: ['equipment'] });
      queryClient.refetchQueries({ queryKey: ['equipment-list'] });
      queryClient.refetchQueries({ queryKey: ['next-equipment-number'] });
    },
  });
}

export function useUpdateEquipment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      equipmentNumber: bigint;
      name: string;
      equipmentTagNumber: string;
      location: string;
      manufacturer: string;
      model: string;
      serial: string;
      purchase: bigint;
      warranty: bigint;
      additionalInfo: string;
      discipline: EngineeringDiscipline;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      const equipment: Equipment = {
        equipmentNumber: data.equipmentNumber,
        equipmentTagNumber: data.equipmentTagNumber,
        name: data.name,
        location: data.location,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serial,
        purchaseDate: data.purchase,
        warrantyExpiry: data.warranty,
        additionalInformation: data.additionalInfo,
        discipline: data.discipline,
      };
      
      return actor.updateEquipment(equipment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
      queryClient.invalidateQueries({ queryKey: ['globalSearch'] });
    },
  });
}

export function useDeleteEquipment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipmentNumber: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteEquipment(equipmentNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
      queryClient.invalidateQueries({ queryKey: ['globalSearch'] });
    },
  });
}

// Global Search queries
export function useGlobalSearchEquipment(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Equipment[]>({
    queryKey: ['globalSearch', 'equipment', searchTerm],
    queryFn: async () => {
      if (!actor || searchTerm.length < 2) return [];
      return actor.findEquipmentByMatching(
        searchTerm,
        false,
        true,
        true,
        true,
        true
      );
    },
    enabled: !!actor && !isFetching && searchTerm.length >= 2,
    staleTime: 5000,
  });
}

export function useGlobalSearchSpareParts(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<SparePart[]>({
    queryKey: ['globalSearch', 'spareParts', searchTerm],
    queryFn: async () => {
      if (!actor || searchTerm.length < 2) return [];
      return actor.findSparePartByMatching(
        searchTerm,
        true,
        true,
        true
      );
    },
    enabled: !!actor && !isFetching && searchTerm.length >= 2,
    staleTime: 5000,
  });
}

// Spare Parts queries
export function useGetAllSpareParts() {
  const { actor, isFetching } = useActor();

  return useQuery<SparePart[]>({
    queryKey: ['all-spare-parts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSpareParts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSparePartsByEquipment(equipmentNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SparePart[]>({
    queryKey: ['spare-parts', equipmentNumber?.toString()],
    queryFn: async () => {
      if (!actor || !equipmentNumber) return [];
      return actor.getSparePartsForEquipment(equipmentNumber);
    },
    enabled: !!actor && !isFetching && equipmentNumber !== null,
  });
}

export function useGetEquipmentUsingSparePart(partNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Equipment[]>({
    queryKey: ['equipment-using-part', partNumber?.toString()],
    queryFn: async () => {
      if (!actor || !partNumber) return [];
      
      const allEquipment = await actor.getAllEquipment();
      const equipmentWithPart: Equipment[] = [];
      for (const equipment of allEquipment) {
        const spareParts = await actor.getSparePartsForEquipment(equipment.equipmentNumber);
        const hasPart = spareParts.some((part) => part.partNumber === partNumber);
        if (hasPart) {
          equipmentWithPart.push(equipment);
        }
      }
      
      return equipmentWithPart;
    },
    enabled: !!actor && !isFetching && partNumber !== null,
  });
}

export function useCreateSparePart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      equipmentNumber: bigint;
      name: string;
      description: string;
      quantity: bigint;
      supplier: string;
      manufacturer: string;
      partNo: string;
      modelSerial: string;
      attachment: ExternalBlob | null;
      additionalInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      const allParts = await actor.getAllSpareParts();
      const nextPartNumber = allParts.length === 0 ? BigInt(1) :
        allParts.reduce((max, p) => p.partNumber > max ? p.partNumber : max, BigInt(0)) + BigInt(1);
      
      const sparePart: SparePart = {
        partNumber: nextPartNumber,
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        supplier: data.supplier,
        manufacturer: data.manufacturer,
        manufacturerPartNo: data.partNo,
        modelSerial: data.modelSerial,
        attachment: data.attachment || undefined,
        additionalInformation: data.additionalInfo,
      };
      
      const success = await actor.addOrUpdateSparePart(sparePart, data.equipmentNumber);
      return success ? nextPartNumber : null;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts', variables.equipmentNumber.toString()] });
      queryClient.invalidateQueries({ queryKey: ['all-spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-report'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
      queryClient.invalidateQueries({ queryKey: ['globalSearch'] });
    },
  });
}

export function useLinkExistingSparePart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      equipmentNumber: bigint;
      partNumber: bigint;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      const allParts = await actor.getAllSpareParts();
      const existingPart = allParts.find((p) => p.partNumber === data.partNumber);
      
      if (!existingPart) {
        throw new Error('Spare part not found');
      }
      
      return actor.addOrUpdateSparePart(existingPart, data.equipmentNumber);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts', variables.equipmentNumber.toString()] });
      queryClient.invalidateQueries({ queryKey: ['equipment-using-part', variables.partNumber.toString()] });
    },
  });
}

export function useUpdateSparePart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      partNumber: bigint;
      name: string;
      description: string;
      quantity: bigint;
      supplier: string;
      manufacturer: string;
      partNo: string;
      modelSerial: string;
      attachment: ExternalBlob | null;
      additionalInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      const allEquipment = await actor.getAllEquipment();
      let targetEquipment: bigint | null = null;
      
      for (const equipment of allEquipment) {
        const spareParts = await actor.getSparePartsForEquipment(equipment.equipmentNumber);
        const hasPart = spareParts.some((part) => part.partNumber === data.partNumber);
        if (hasPart) {
          targetEquipment = equipment.equipmentNumber;
          break;
        }
      }
      
      if (!targetEquipment) {
        return false;
      }
      
      const sparePart: SparePart = {
        partNumber: data.partNumber,
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        supplier: data.supplier,
        manufacturer: data.manufacturer,
        manufacturerPartNo: data.partNo,
        modelSerial: data.modelSerial,
        attachment: data.attachment || undefined,
        additionalInformation: data.additionalInfo,
      };
      
      return actor.addOrUpdateSparePart(sparePart, targetEquipment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['all-spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-report'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
      queryClient.invalidateQueries({ queryKey: ['globalSearch'] });
    },
  });
}

export function useDeleteSparePart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partNumber: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteSparePartByPartNumber(partNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['all-spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-report'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
      queryClient.invalidateQueries({ queryKey: ['globalSearch'] });
    },
  });
}

// Spare Parts Search queries
export function useSearchSpareParts(criteria: {
  equipmentTagNumber?: string;
  modelSerial?: string;
  partNo?: string;
  manufacturer?: string;
}) {
  const { actor, isFetching } = useActor();

  return useQuery<SparePart[]>({
    queryKey: ['spare-parts-search', criteria],
    queryFn: async () => {
      if (!actor) return [];

      const allEquipment = await actor.getAllEquipment();
      
      if (criteria.equipmentTagNumber && criteria.equipmentTagNumber.trim()) {
        const matchingEquipment = allEquipment.filter(eq => 
          eq.equipmentTagNumber.toLowerCase().includes(criteria.equipmentTagNumber!.toLowerCase())
        );
        
        const allParts = await Promise.all(
          matchingEquipment.map(eq => actor.getSparePartsForEquipment(eq.equipmentNumber))
        );
        return allParts.flat();
      }

      const allParts = await actor.getAllSpareParts();

      if (criteria.modelSerial && criteria.modelSerial.trim()) {
        return allParts.filter(p => 
          p.modelSerial.toLowerCase().includes(criteria.modelSerial!.toLowerCase())
        );
      }

      if (criteria.partNo && criteria.partNo.trim()) {
        return allParts.filter(p => 
          p.manufacturerPartNo.toLowerCase().includes(criteria.partNo!.toLowerCase())
        );
      }

      if (criteria.manufacturer && criteria.manufacturer.trim()) {
        return allParts.filter(p => 
          p.manufacturer.toLowerCase().includes(criteria.manufacturer!.toLowerCase())
        );
      }

      return allParts;
    },
    enabled: !!actor && !isFetching,
  });
}

// Cataloguing queries
export function useGetCataloguingRecords(equipmentNumber: bigint | null) {
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
      return actor.updateCataloguingRecord(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cataloguing', variables.equipmentNumber.toString()] });
    },
  });
}

// Maintenance queries
export function useGetMaintenanceRecords(equipmentNumber: bigint | null) {
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
      return actor.updateMaintenanceRecord(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', variables.equipmentNumber.toString()] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-due-report'] });
    },
  });
}

// Document queries
export function useGetDocuments(equipmentNumber: bigint | null) {
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
      return actor.deleteDocument(equipmentNumber, docId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.equipmentNumber.toString()] });
    },
  });
}

// Report queries
export function useGetEquipmentReport() {
  const { actor, isFetching } = useActor();

  return useQuery<Equipment[]>({
    queryKey: ['equipment-report'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEquipment();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSparePartsReport() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<{ equipment: Equipment; spareParts: SparePart[] }>>({
    queryKey: ['spare-parts-report'],
    queryFn: async () => {
      if (!actor) return [];
      
      const allEquipment = await actor.getAllEquipment();
      const results = await Promise.all(
        allEquipment.map(async (equipment) => {
          const spareParts = await actor.getSparePartsForEquipment(equipment.equipmentNumber);
          return { equipment, spareParts };
        })
      );
      
      return results;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMaintenanceDueReport() {
  const { actor, isFetching } = useActor();

  return useQuery<MaintenanceRecord[]>({
    queryKey: ['maintenance-due-report'],
    queryFn: async () => {
      if (!actor) return [];
      
      const allEquipment = await actor.getAllEquipment();
      const allRecords: MaintenanceRecord[] = [];
      
      for (const equipment of allEquipment) {
        const records = await actor.getAllMaintenanceRecords(equipment.equipmentNumber);
        allRecords.push(...records);
      }
      
      return allRecords;
    },
    enabled: !!actor && !isFetching,
  });
}
