export function parseCSV(text: string): Record<string, string>[] {
  if (!text) return [];
  
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  if (!line) return [];
  
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

export function validateEquipmentRow(row: Record<string, string>): { valid: boolean; error?: string } {
  if (!row) {
    return { valid: false, error: 'Invalid row data' };
  }

  const name = row.name || row.Name || row.equipmentName || row.EquipmentName || '';
  const location = row.location || row.Location || '';
  const manufacturer = row.manufacturer || row.Manufacturer || '';

  if (!name) {
    return { valid: false, error: 'Missing required field: name' };
  }

  if (!location) {
    return { valid: false, error: 'Missing required field: location' };
  }

  if (!manufacturer) {
    return { valid: false, error: 'Missing required field: manufacturer' };
  }

  return { valid: true };
}

export function validateSparePartRow(row: Record<string, string>): { valid: boolean; error?: string } {
  if (!row) {
    return { valid: false, error: 'Invalid row data' };
  }

  const equipmentNumber = row.equipmentNumber || row.EquipmentNumber || '';
  const equipmentTagNumber = row.equipmentTagNumber || row.EquipmentTagNumber || '';
  const name = row.name || row.Name || row.partName || row.PartName || '';

  if (!equipmentNumber && !equipmentTagNumber) {
    return { valid: false, error: 'Missing required field: equipmentNumber or equipmentTagNumber' };
  }

  if (!name) {
    return { valid: false, error: 'Missing required field: name' };
  }

  return { valid: true };
}

export function parseDateString(dateStr: string | undefined): bigint {
  if (!dateStr || !dateStr.trim()) return BigInt(0);

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return BigInt(0);
    return BigInt(date.getTime() * 1000000);
  } catch {
    return BigInt(0);
  }
}

export function parseBigInt(value: string | undefined): bigint {
  if (!value || !value.trim()) return BigInt(0);
  try {
    return BigInt(parseInt(value, 10));
  } catch {
    return BigInt(0);
  }
}
