import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Equipment, SparePart, CataloguingRecord, MaintenanceRecord, Document } from '@/backend';
import { ExternalBlob, Variant_scheduled_completed_overdue, EngineeringDiscipline } from '@/backend';

// Equipment queries
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
      return actor.getEquipmentList();
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
      const result = await actor.createEquipment(
        data.name,
        data.location,
        data.manufacturer,
        data.model,
        data.serial,
        data.purchase,
        data.warranty,
        data.additionalInfo,
        data.discipline
      );
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch equipment queries
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
      // Force refetch to ensure UI updates
      queryClient.refetchQueries({ queryKey: ['equipment'] });
      queryClient.refetchQueries({ queryKey: ['equipment-list'] });
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
      return actor.updateEquipment(
        data.equipmentNumber,
        data.name,
        data.location,
        data.manufacturer,
        data.model,
        data.serial,
        data.purchase,
        data.warranty,
        data.additionalInfo,
        data.discipline
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
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
    },
  });
}

// Spare Parts queries
export function useGetSparePartsByEquipment(equipmentNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SparePart[]>({
    queryKey: ['spare-parts', equipmentNumber?.toString()],
    queryFn: async () => {
      if (!actor || !equipmentNumber) return [];
      return actor.getSparePartsByEquipment(equipmentNumber);
    },
    enabled: !!actor && !isFetching && equipmentNumber !== null,
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
      return actor.createSparePart(
        data.equipmentNumber,
        data.name,
        data.description,
        data.quantity,
        data.supplier,
        data.manufacturer,
        data.partNo,
        data.modelSerial,
        data.attachment,
        data.additionalInfo
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts', variables.equipmentNumber.toString()] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-report'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
    },
  });
}

export function useUpdateSparePart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      equipmentNumber: bigint;
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
      return actor.updateSparePart(
        data.equipmentNumber,
        data.partNumber,
        data.name,
        data.description,
        data.quantity,
        data.supplier,
        data.manufacturer,
        data.partNo,
        data.modelSerial,
        data.attachment,
        data.additionalInfo
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts', variables.equipmentNumber.toString()] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-report'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
    },
  });
}

export function useDeleteSparePart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { equipmentNumber: bigint; partNumber: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteSparePart(data.equipmentNumber, data.partNumber);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts', variables.equipmentNumber.toString()] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-report'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
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

      // If equipment tag number is provided, search by that first
      if (criteria.equipmentTagNumber && criteria.equipmentTagNumber.trim()) {
        try {
          const equipmentNumber = BigInt(criteria.equipmentTagNumber);
          return await actor.findSparePartsByEquipmentTagNumber(equipmentNumber);
        } catch {
          // Invalid number format
          return [];
        }
      }

      // Search by model/serial
      if (criteria.modelSerial && criteria.modelSerial.trim()) {
        return await actor.findSparePartsByModelSerial(criteria.modelSerial.trim());
      }

      // Search by part number
      if (criteria.partNo && criteria.partNo.trim()) {
        return await actor.findSparePartsByPartNo(criteria.partNo.trim());
      }

      // Search by manufacturer
      if (criteria.manufacturer && criteria.manufacturer.trim()) {
        return await actor.findSparePartsByManufacturer(criteria.manufacturer.trim());
      }

      return [];
    },
    enabled: !!actor && !isFetching && Object.values(criteria).some((v) => v && v.trim()),
  });
}

// Cataloguing queries
export function useGetCataloguingRecordsByEquipment(equipmentNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<CataloguingRecord[]>({
    queryKey: ['cataloguing', equipmentNumber?.toString()],
    queryFn: async () => {
      if (!actor || !equipmentNumber) return [];
      return actor.getCataloguingRecordsByEquipment(equipmentNumber);
    },
    enabled: !!actor && !isFetching && equipmentNumber !== null,
  });
}

export function useCreateCataloguingRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      equipmentNumber: bigint;
      materialDesc: string;
      templateName: string;
      attributes: [string, string][];
      isDraft: boolean;
      additionalInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createCataloguingRecord(
        data.equipmentNumber,
        data.materialDesc,
        data.templateName,
        data.attributes,
        data.isDraft,
        data.additionalInfo
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cataloguing', variables.equipmentNumber.toString()] });
    },
  });
}

export function useUpdateCataloguingRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      equipmentNumber: bigint;
      recordIndex: bigint;
      materialDesc: string;
      templateName: string;
      attributes: [string, string][];
      isDraft: boolean;
      additionalInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateCataloguingRecord(
        data.equipmentNumber,
        data.recordIndex,
        data.materialDesc,
        data.templateName,
        data.attributes,
        data.isDraft,
        data.additionalInfo
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cataloguing', variables.equipmentNumber.toString()] });
    },
  });
}

export function useDeleteCataloguingRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { equipmentNumber: bigint; recordIndex: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteCataloguingRecord(data.equipmentNumber, data.recordIndex);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cataloguing', variables.equipmentNumber.toString()] });
    },
  });
}

// Maintenance queries
export function useGetMaintenanceByEquipment(equipmentNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<MaintenanceRecord[]>({
    queryKey: ['maintenance', equipmentNumber?.toString()],
    queryFn: async () => {
      if (!actor || !equipmentNumber) return [];
      return actor.getMaintenanceByEquipment(equipmentNumber);
    },
    enabled: !!actor && !isFetching && equipmentNumber !== null,
  });
}

export function useCreateMaintenanceRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      equipmentNumber: bigint;
      maintType: string;
      status: Variant_scheduled_completed_overdue;
      lastDate: bigint;
      nextDate: bigint;
      additionalInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createMaintenanceRecord(
        data.equipmentNumber,
        data.maintType,
        data.status,
        data.lastDate,
        data.nextDate,
        data.additionalInfo
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', variables.equipmentNumber.toString()] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-due-report'] });
    },
  });
}

export function useUpdateMaintenanceRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      equipmentNumber: bigint;
      maintenanceId: bigint;
      maintType: string;
      status: Variant_scheduled_completed_overdue;
      lastDate: bigint;
      nextDate: bigint;
      additionalInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateMaintenanceRecord(
        data.equipmentNumber,
        data.maintenanceId,
        data.maintType,
        data.status,
        data.lastDate,
        data.nextDate,
        data.additionalInfo
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', variables.equipmentNumber.toString()] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-due-report'] });
    },
  });
}

export function useDeleteMaintenanceRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { equipmentNumber: bigint; maintenanceId: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteMaintenanceRecord(data.equipmentNumber, data.maintenanceId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', variables.equipmentNumber.toString()] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-due-report'] });
    },
  });
}

// Document queries
export function useGetDocumentsByEquipment(equipmentNumber: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Document[]>({
    queryKey: ['documents', equipmentNumber?.toString()],
    queryFn: async () => {
      if (!actor || !equipmentNumber) return [];
      return actor.getDocumentsByEquipment(equipmentNumber);
    },
    enabled: !!actor && !isFetching && equipmentNumber !== null,
  });
}

export function useUploadDocument() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      equipmentNumber: bigint; 
      docType: string; 
      file: ExternalBlob;
      additionalInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.uploadDocument(data.equipmentNumber, data.docType, data.file, data.additionalInfo);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.equipmentNumber.toString()] });
    },
  });
}

export function useUpdateDocumentMetadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      equipmentNumber: bigint; 
      docId: bigint; 
      newDocType: string;
      additionalInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateDocumentMetadata(data.equipmentNumber, data.docId, data.newDocType, data.additionalInfo);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.equipmentNumber.toString()] });
    },
  });
}

export function useDeleteDocument() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { equipmentNumber: bigint; docId: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteDocument(data.equipmentNumber, data.docId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.equipmentNumber.toString()] });
    },
  });
}

// Reports queries
export function useGetSparePartsReport() {
  const { actor, isFetching } = useActor();

  return useQuery<SparePart[]>({
    queryKey: ['spare-parts-report'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSparePartsReport();
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
      return actor.getMaintenanceDueReport();
    },
    enabled: !!actor && !isFetching,
  });
}
