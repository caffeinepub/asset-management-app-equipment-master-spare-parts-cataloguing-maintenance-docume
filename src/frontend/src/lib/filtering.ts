import type { Equipment, SparePart, EngineeringDiscipline } from '@/backend';
import type { FilterState } from '@/components/GlobalSearchFilters';

export function filterEquipment(equipment: Equipment[], filters: FilterState): Equipment[] {
  return equipment.filter((eq) => {
    // Filter by discipline
    if (filters.discipline && eq.discipline !== filters.discipline) {
      return false;
    }

    // Filter by equipment type (model substring match)
    if (filters.equipmentType && filters.equipmentType.trim()) {
      const model = eq.model || '';
      const modelMatch = model.toLowerCase().includes(filters.equipmentType.toLowerCase());
      if (!modelMatch) {
        return false;
      }
    }

    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom).getTime();
      const purchaseDate = Number(eq.purchaseDate / BigInt(1000000)); // Convert nanoseconds to milliseconds
      if (purchaseDate < fromDate) {
        return false;
      }
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo).getTime();
      const purchaseDate = Number(eq.purchaseDate / BigInt(1000000)); // Convert nanoseconds to milliseconds
      if (purchaseDate > toDate) {
        return false;
      }
    }

    return true;
  });
}

export function filterSpareParts(spareParts: SparePart[], filters: FilterState): SparePart[] {
  // If equipment type filter is applied, don't show spare parts
  // (spare parts don't have a direct equipment type field)
  if (filters.equipmentType && filters.equipmentType.trim()) {
    return [];
  }

  return spareParts;
}
