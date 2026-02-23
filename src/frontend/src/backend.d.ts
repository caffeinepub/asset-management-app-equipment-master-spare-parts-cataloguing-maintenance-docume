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
export type Time = bigint;
export interface Document {
    documentType: string;
    additionalInformation: string;
    equipmentNumber: bigint;
    filePath: ExternalBlob;
    docId: bigint;
    uploadDate: Time;
}
export interface MaintenanceRecord {
    maintenanceStatus: Variant_scheduled_completed_overdue;
    additionalInformation: string;
    equipmentNumber: bigint;
    maintenanceType: string;
    maintenanceId: bigint;
    nextMaintenanceDate: Time;
    lastMaintenanceDate: Time;
}
export interface Equipment {
    model: string;
    manufacturer: string;
    discipline: EngineeringDiscipline;
    purchaseDate: Time;
    additionalInformation: string;
    name: string;
    equipmentNumber: bigint;
    serialNumber: string;
    warrantyExpiry: Time;
    location: string;
    equipmentTagNumber: string;
}
export interface SparePart {
    manufacturer: string;
    partNumber: bigint;
    supplier: string;
    additionalInformation: string;
    name: string;
    description: string;
    modelSerial: string;
    quantity: bigint;
    attachment?: ExternalBlob;
    manufacturerPartNo: string;
}
export interface AdminRoleInfo {
    roleType: string;
    adminPrincipal: Principal;
    isAdmin: boolean;
}
export interface CataloguingRecord {
    status: Variant_submitted_draft;
    additionalInformation: string;
    equipmentNumber: bigint;
    templateName: string;
    attributes: Array<[string, string]>;
    materialDescription: string;
}
export interface UserProfile {
    name: string;
    department: string;
}
export enum EngineeringDiscipline {
    mechanical = "mechanical",
    piping = "piping",
    electrical = "electrical",
    unknown_ = "unknown",
    instrumentation = "instrumentation"
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
    addOrUpdateSparePart(part: SparePart, equipmentNumber: bigint): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createEquipment(equipment: Equipment): Promise<boolean>;
    createSparePart(part: SparePart): Promise<boolean>;
    deleteDocument(equipmentNumber: bigint, docId: bigint): Promise<boolean>;
    deleteEquipment(equipmentNumber: bigint): Promise<boolean>;
    deleteSparePartByPartNumber(partNumber: bigint): Promise<boolean>;
    findEquipmentByMatching(searchTerm: string, matchEquipmentNumber: boolean, matchEquipmentTagNumber: boolean, matchName: boolean, matchModel: boolean, matchSerialNumber: boolean): Promise<Array<Equipment>>;
    findSparePartByMatching(searchTerm: string, matchManufacturerPartNo: boolean, matchName: boolean, matchDescription: boolean): Promise<Array<SparePart>>;
    getAdminRole(caller: Principal): Promise<AdminRoleInfo>;
    getAllCataloguingRecords(equipmentNumber: bigint): Promise<Array<CataloguingRecord>>;
    getAllDocuments(equipmentNumber: bigint): Promise<Array<Document>>;
    getAllEquipment(): Promise<Array<Equipment>>;
    getAllMaintenanceRecords(equipmentNumber: bigint): Promise<Array<MaintenanceRecord>>;
    getAllSpareParts(): Promise<Array<SparePart>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEquipment(equipmentNumber: bigint): Promise<Equipment | null>;
    getSparePartsForEquipment(equipmentNumber: bigint): Promise<Array<SparePart>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    importAttributeTemplateFromExcel(blob: ExternalBlob, templateName: string): Promise<string>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    unlinkSparePartFromEquipment(equipmentNumber: bigint, partNumber: bigint): Promise<boolean>;
    updateCataloguingRecord(record: CataloguingRecord): Promise<boolean>;
    updateEquipment(equipment: Equipment): Promise<boolean>;
    updateMaintenanceRecord(record: MaintenanceRecord): Promise<boolean>;
}
