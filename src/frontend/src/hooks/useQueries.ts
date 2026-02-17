import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Equipment, SparePart, CataloguingRecord, MaintenanceRecord, Document } from '@/backend';
import { ExternalBlob, Variant_scheduled_completed_overdue, Variant_submitted_draft, EngineeringDiscipline } from '@/backend';

// Equipment queries
export function useGetNextEquipmentNumber() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['next-equipment-number'],
    queryFn: async () => {
      if (!actor) return BigInt(1);
      // Calculate next number from existing equipment
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
      
      // Get next equipment number
      const allEquipment = await actor.getAllEquipment();
      const nextNumber = allEquipment.length === 0 ? BigInt(1) : 
        allEquipment.reduce((max, eq) => eq.equipmentNumber > max ? eq.equipmentNumber : max, BigInt(0)) + BigInt(1);
      
      // Create equipment object matching backend Equipment type
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
      
      // Use updateEquipment to create (it will add if doesn't exist)
      const result = await actor.updateEquipment(equipment);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
      queryClient.invalidateQueries({ queryKey: ['next-equipment-number'] });
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
      return actor.getSpareParts(equipmentNumber);
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
      
      // Get next part number for this equipment
      const existingParts = await actor.getSpareParts(data.equipmentNumber);
      const nextPartNumber = existingParts.length === 0 ? BigInt(1) :
        existingParts.reduce((max, p) => p.partNumber > max ? p.partNumber : max, BigInt(0)) + BigInt(1);
      
      const sparePart: SparePart = {
        partNumber: nextPartNumber,
        equipmentNumber: data.equipmentNumber,
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        supplier: data.supplier,
        manufacturer: data.manufacturer,
        partNo: data.partNo,
        modelSerial: data.modelSerial,
        attachment: data.attachment || undefined,
        additionalInformation: data.additionalInfo,
      };
      
      return actor.updateSparePart(sparePart);
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
      
      const sparePart: SparePart = {
        partNumber: data.partNumber,
        equipmentNumber: data.equipmentNumber,
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        supplier: data.supplier,
        manufacturer: data.manufacturer,
        partNo: data.partNo,
        modelSerial: data.modelSerial,
        attachment: data.attachment || undefined,
        additionalInformation: data.additionalInfo,
      };
      
      return actor.updateSparePart(sparePart);
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

// Spare Parts Search queries - client-side filtering
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

      // Get all equipment to find matching equipment numbers
      const allEquipment = await actor.getAllEquipment();
      
      // If searching by equipment tag number, find matching equipment
      if (criteria.equipmentTagNumber && criteria.equipmentTagNumber.trim()) {
        const matchingEquipment = allEquipment.filter(eq => 
          eq.equipmentTagNumber.toLowerCase().includes(criteria.equipmentTagNumber!.toLowerCase())
        );
        
        // Get spare parts for all matching equipment
        const allParts = await Promise.all(
          matchingEquipment.map(eq => actor.getSpareParts(eq.equipmentNumber))
        );
        return allParts.flat();
      }

      // For other searches, get all spare parts from all equipment and filter client-side
      const allParts = await Promise.all(
        allEquipment.map(eq => actor.getSpareParts(eq.equipmentNumber))
      );
      const flatParts = allParts.flat();

      // Filter by model/serial
      if (criteria.modelSerial && criteria.modelSerial.trim()) {
        return flatParts.filter(p => 
          p.modelSerial.toLowerCase().includes(criteria.modelSerial!.toLowerCase())
        );
      }

      // Filter by part number
      if (criteria.partNo && criteria.partNo.trim()) {
        return flatParts.filter(p => 
          p.partNo.toLowerCase().includes(criteria.partNo!.toLowerCase())
        );
      }

      // Filter by manufacturer
      if (criteria.manufacturer && criteria.manufacturer.trim()) {
        return flatParts.filter(p => 
          p.manufacturer.toLowerCase().includes(criteria.manufacturer!.toLowerCase())
        );
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
      return actor.getCataloguingRecords(equipmentNumber);
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
      
      const record: CataloguingRecord = {
        equipmentNumber: data.equipmentNumber,
        materialDescription: data.materialDesc,
        templateName: data.templateName,
        attributes: data.attributes,
        status: data.isDraft ? Variant_submitted_draft.draft : Variant_submitted_draft.submitted,
        additionalInformation: data.additionalInfo,
      };
      
      return actor.updateCataloguingRecord(record);
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
      
      const record: CataloguingRecord = {
        equipmentNumber: data.equipmentNumber,
        materialDescription: data.materialDesc,
        templateName: data.templateName,
        attributes: data.attributes,
        status: data.isDraft ? Variant_submitted_draft.draft : Variant_submitted_draft.submitted,
        additionalInformation: data.additionalInfo,
      };
      
      return actor.updateCataloguingRecord(record);
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
      // Backend doesn't have delete for cataloguing, so we can't delete
      // Return false to indicate operation not supported
      return false;
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
      return actor.getMaintenanceRecords(equipmentNumber);
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
      
      // Get next maintenance ID
      const existingRecords = await actor.getMaintenanceRecords(data.equipmentNumber);
      const nextId = existingRecords.length === 0 ? BigInt(1) :
        existingRecords.reduce((max, r) => r.maintenanceId > max ? r.maintenanceId : max, BigInt(0)) + BigInt(1);
      
      const record: MaintenanceRecord = {
        maintenanceId: nextId,
        equipmentNumber: data.equipmentNumber,
        maintenanceType: data.maintType,
        maintenanceStatus: data.status,
        lastMaintenanceDate: data.lastDate,
        nextMaintenanceDate: data.nextDate,
        additionalInformation: data.additionalInfo,
      };
      
      return actor.updateMaintenanceRecord(record);
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
      
      const record: MaintenanceRecord = {
        maintenanceId: data.maintenanceId,
        equipmentNumber: data.equipmentNumber,
        maintenanceType: data.maintType,
        maintenanceStatus: data.status,
        lastMaintenanceDate: data.lastDate,
        nextMaintenanceDate: data.nextDate,
        additionalInformation: data.additionalInfo,
      };
      
      return actor.updateMaintenanceRecord(record);
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
      // Backend doesn't have delete for maintenance records
      return false;
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
      return actor.getDocuments(equipmentNumber);
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
      
      // Get next doc ID
      const existingDocs = await actor.getDocuments(data.equipmentNumber);
      const nextDocId = existingDocs.length === 0 ? BigInt(1) :
        existingDocs.reduce((max, d) => d.docId > max ? d.docId : max, BigInt(0)) + BigInt(1);
      
      // Backend doesn't have uploadDocument, so we can't create new documents
      // This is a limitation that should be noted
      throw new Error('Document upload not supported by backend');
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
      // Backend doesn't have updateDocumentMetadata
      throw new Error('Document metadata update not supported by backend');
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
      // Get all equipment and their spare parts
      const allEquipment = await actor.getAllEquipment();
      const allParts = await Promise.all(
        allEquipment.map(eq => actor.getSpareParts(eq.equipmentNumber))
      );
      return allParts.flat();
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
      // Get all equipment and their maintenance records
      const allEquipment = await actor.getAllEquipment();
      const allRecords = await Promise.all(
        allEquipment.map(eq => actor.getMaintenanceRecords(eq.equipmentNumber))
      );
      const flatRecords = allRecords.flat();
      
      // Filter for overdue and scheduled maintenance
      const now = BigInt(Date.now() * 1000000); // Convert to nanoseconds
      return flatRecords.filter(r => 
        r.maintenanceStatus === Variant_scheduled_completed_overdue.overdue ||
        r.maintenanceStatus === Variant_scheduled_completed_overdue.scheduled
      );
    },
    enabled: !!actor && !isFetching,
  });
}
