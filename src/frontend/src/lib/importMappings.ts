import { EngineeringDiscipline } from '@/backend';
import { parseDateString, parseBigInt } from './csvImport';
import { labelToDiscipline } from './disciplines';

export const EQUIPMENT_TEMPLATE_HEADERS = [
  'name',
  'equipmentTagNumber',
  'location',
  'manufacturer',
  'model',
  'serialNumber',
  'purchaseDate',
  'warrantyExpiry',
  'discipline',
  'additionalInformation',
];

export const SPARE_PARTS_TEMPLATE_HEADERS = [
  'equipmentNumber',
  'equipmentTagNumber',
  'name',
  'description',
  'quantity',
  'supplier',
  'manufacturer',
  'manufacturerPartNo',
  'modelSerial',
  'additionalInformation',
];

export function mapEquipmentRow(row: Record<string, string>) {
  const name = row.name || row.Name || row.equipmentName || row.EquipmentName || '';
  const equipmentTagNumber = row.equipmentTagNumber || row.EquipmentTagNumber || row.tagNumber || row.TagNumber || '';
  const location = row.location || row.Location || '';
  const manufacturer = row.manufacturer || row.Manufacturer || '';
  const model = row.model || row.Model || '';
  const serialNumber = row.serialNumber || row.SerialNumber || row.serial || row.Serial || '';
  const purchaseDate = row.purchaseDate || row.PurchaseDate || '';
  const warrantyExpiry = row.warrantyExpiry || row.WarrantyExpiry || row.warranty || row.Warranty || '';
  const disciplineStr = row.discipline || row.Discipline || '';
  const additionalInformation = row.additionalInformation || row.AdditionalInformation || row.notes || row.Notes || '';

  const discipline = disciplineStr ? labelToDiscipline(disciplineStr.toUpperCase()) : EngineeringDiscipline.unknown_;

  // Generate equipment number (will be overridden by backend)
  const equipmentNumber = BigInt(Date.now());

  return {
    equipmentNumber,
    name,
    equipmentTagNumber,
    location,
    manufacturer,
    model,
    serialNumber,
    purchaseDate: parseDateString(purchaseDate),
    warrantyExpiry: parseDateString(warrantyExpiry),
    additionalInformation,
    discipline,
  };
}

export function mapSparePartRow(row: Record<string, string>, equipmentNumber: bigint) {
  const name = row.name || row.Name || row.partName || row.PartName || '';
  const description = row.description || row.Description || '';
  const quantity = row.quantity || row.Quantity || '0';
  const supplier = row.supplier || row.Supplier || '';
  const manufacturer = row.manufacturer || row.Manufacturer || '';
  const manufacturerPartNo = row.manufacturerPartNo || row.ManufacturerPartNo || row.partNo || row.PartNo || row.partNumber || row.PartNumber || '';
  const modelSerial = row.modelSerial || row.ModelSerial || row.model || row.Model || '';
  const additionalInformation = row.additionalInformation || row.AdditionalInformation || row.notes || row.Notes || '';

  // Generate part number (will be overridden by backend)
  const partNumber = BigInt(Date.now());

  return {
    partNumber,
    name,
    description,
    quantity: parseBigInt(quantity),
    supplier,
    manufacturer,
    manufacturerPartNo,
    modelSerial,
    attachment: undefined,
    additionalInformation,
  };
}
