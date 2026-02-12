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
  'partNo',
  'modelSerial',
  'additionalInformation',
];

export function mapEquipmentRow(row: Record<string, string>) {
  const name = row.name || row.Name || row.equipmentName || row.EquipmentName || '';
  const equipmentTagNumber = row.equipmentTagNumber || row.EquipmentTagNumber || row.tagNumber || row.TagNumber || '';
  const location = row.location || row.Location || '';
  const manufacturer = row.manufacturer || row.Manufacturer || '';
  const model = row.model || row.Model || '';
  const serial = row.serialNumber || row.SerialNumber || row.serial || row.Serial || '';
  const purchaseDate = row.purchaseDate || row.PurchaseDate || '';
  const warrantyExpiry = row.warrantyExpiry || row.WarrantyExpiry || row.warranty || row.Warranty || '';
  const disciplineStr = row.discipline || row.Discipline || '';
  const additionalInfo = row.additionalInformation || row.AdditionalInformation || row.notes || row.Notes || '';

  const discipline = disciplineStr ? labelToDiscipline(disciplineStr.toUpperCase()) : EngineeringDiscipline.unknown_;

  return {
    name,
    equipmentTagNumber,
    location,
    manufacturer,
    model,
    serial,
    purchase: parseDateString(purchaseDate),
    warranty: parseDateString(warrantyExpiry),
    additionalInfo,
    discipline,
  };
}

export function mapSparePartRow(row: Record<string, string>, equipmentNumber: bigint) {
  const name = row.name || row.Name || row.partName || row.PartName || '';
  const description = row.description || row.Description || '';
  const quantity = row.quantity || row.Quantity || '0';
  const supplier = row.supplier || row.Supplier || '';
  const manufacturer = row.manufacturer || row.Manufacturer || '';
  const partNo = row.partNo || row.PartNo || row.partNumber || row.PartNumber || '';
  const modelSerial = row.modelSerial || row.ModelSerial || row.model || row.Model || '';
  const additionalInfo = row.additionalInformation || row.AdditionalInformation || row.notes || row.Notes || '';

  return {
    equipmentNumber,
    name,
    description,
    quantity: parseBigInt(quantity),
    supplier,
    manufacturer,
    partNo,
    modelSerial,
    attachment: null,
    additionalInfo,
  };
}
