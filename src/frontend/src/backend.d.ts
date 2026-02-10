import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface CataloguingRecord {
    status: Variant_submitted_draft;
    equipmentNumber: bigint;
    templateName: string;
    attributes: Array<[string, string]>;
    materialDescription: string;
}
export type Time = bigint;
export interface MaintenanceRecord {
    maintenanceStatus: Variant_scheduled_completed_overdue;
    equipmentNumber: bigint;
    maintenanceType: string;
    maintenanceId: bigint;
    nextMaintenanceDate: Time;
    lastMaintenanceDate: Time;
}
export interface Equipment {
    model: string;
    manufacturer: string;
    purchaseDate: Time;
    name: string;
    equipmentNumber: bigint;
    serialNumber: string;
    warrantyExpiry: Time;
    location: string;
}
export interface SparePart {
    partNumber: bigint;
    supplier: string;
    name: string;
    equipmentNumber: bigint;
    description: string;
    quantity: bigint;
}
export interface Document {
    documentType: string;
    equipmentNumber: bigint;
    filePath: ExternalBlob;
    docId: bigint;
    uploadDate: Time;
}
export interface UserProfile {
    name: string;
    department: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_scheduled_completed_overdue {
    scheduled = "scheduled",
    completed = "completed",
    overdue = "overdue"
}
export enum Variant_submitted_draft {
    submitted = "submitted",
    draft = "draft"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCataloguingRecord(equipmentNumber: bigint, materialDesc: string, templateName: string, attributes: Array<[string, string]>, isDraft: boolean): Promise<bigint | null>;
    createEquipment(name: string, location: string, manufacturer: string, model: string, serial: string, purchase: Time, warranty: Time): Promise<bigint>;
    createMaintenanceRecord(equipmentNumber: bigint, maintType: string, status: Variant_scheduled_completed_overdue, lastDate: Time, nextDate: Time): Promise<bigint | null>;
    createSparePart(equipmentNumber: bigint, name: string, description: string, quantity: bigint, supplier: string): Promise<bigint | null>;
    deleteCataloguingRecord(equipmentNumber: bigint, recordIndex: bigint): Promise<boolean>;
    deleteDocument(equipmentNumber: bigint, docId: bigint): Promise<boolean>;
    deleteEquipment(equipmentNumber: bigint): Promise<boolean>;
    deleteMaintenanceRecord(equipmentNumber: bigint, maintenanceId: bigint): Promise<boolean>;
    deleteSparePart(equipmentNumber: bigint, partNumber: bigint): Promise<boolean>;
    getAllEquipment(): Promise<Array<Equipment>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCataloguingRecordsByEquipment(equipmentNumber: bigint): Promise<Array<CataloguingRecord>>;
    getDocumentsByEquipment(equipmentNumber: bigint): Promise<Array<Document>>;
    getEquipment(equipmentNumber: bigint): Promise<Equipment | null>;
    getEquipmentList(): Promise<Array<Equipment>>;
    getMaintenanceByEquipment(equipmentNumber: bigint): Promise<Array<MaintenanceRecord>>;
    getMaintenanceDueReport(): Promise<Array<MaintenanceRecord>>;
    getSparePartsByEquipment(equipmentNumber: bigint): Promise<Array<SparePart>>;
    getSparePartsReport(): Promise<Array<SparePart>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCataloguingRecord(equipmentNumber: bigint, recordIndex: bigint, materialDesc: string, templateName: string, attributes: Array<[string, string]>, isDraft: boolean): Promise<boolean>;
    updateDocumentMetadata(equipmentNumber: bigint, docId: bigint, newDocType: string): Promise<boolean>;
    updateEquipment(equipmentNumber: bigint, name: string, location: string, manufacturer: string, model: string, serial: string, purchase: Time, warranty: Time): Promise<boolean>;
    updateMaintenanceRecord(equipmentNumber: bigint, maintenanceId: bigint, maintType: string, status: Variant_scheduled_completed_overdue, lastDate: Time, nextDate: Time): Promise<boolean>;
    updateSparePart(equipmentNumber: bigint, partNumber: bigint, name: string, description: string, quantity: bigint, supplier: string): Promise<boolean>;
    uploadDocument(equipmentNumber: bigint, docType: string, file: ExternalBlob): Promise<bigint | null>;
}
