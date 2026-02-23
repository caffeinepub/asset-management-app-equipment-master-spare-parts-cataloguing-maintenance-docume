import type { Equipment, SparePart } from '@/backend';

export type SortField = 'relevance' | 'name' | 'number' | 'date';
export type SortDirection = 'asc' | 'desc';

function calculateRelevanceScore(text: string | undefined, searchTerm: string): number {
  if (!text || !searchTerm) return 0;
  
  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();

  // Exact match gets highest score
  if (lowerText === lowerSearch) return 1000;

  // Starts with search term gets high score
  if (lowerText.startsWith(lowerSearch)) return 500;

  // Contains search term gets medium score
  if (lowerText.includes(lowerSearch)) return 100;

  return 0;
}

export function sortEquipment(
  equipment: Equipment[],
  sortField: SortField,
  direction: SortDirection,
  searchTerm: string = ''
): Equipment[] {
  const sorted = [...equipment].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'relevance': {
        const scoreA = Math.max(
          calculateRelevanceScore(a.name, searchTerm),
          calculateRelevanceScore(a.equipmentTagNumber, searchTerm),
          calculateRelevanceScore(a.model, searchTerm),
          calculateRelevanceScore(a.serialNumber, searchTerm)
        );
        const scoreB = Math.max(
          calculateRelevanceScore(b.name, searchTerm),
          calculateRelevanceScore(b.equipmentTagNumber, searchTerm),
          calculateRelevanceScore(b.model, searchTerm),
          calculateRelevanceScore(b.serialNumber, searchTerm)
        );
        comparison = scoreB - scoreA; // Higher score first
        break;
      }
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        break;
      case 'number':
        comparison = Number(a.equipmentNumber - b.equipmentNumber);
        break;
      case 'date':
        comparison = Number(a.purchaseDate - b.purchaseDate);
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function sortSpareParts(
  spareParts: SparePart[],
  sortField: SortField,
  direction: SortDirection,
  searchTerm: string = ''
): SparePart[] {
  const sorted = [...spareParts].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'relevance': {
        const scoreA = Math.max(
          calculateRelevanceScore(a.name, searchTerm),
          calculateRelevanceScore(a.manufacturerPartNo, searchTerm),
          calculateRelevanceScore(a.description, searchTerm)
        );
        const scoreB = Math.max(
          calculateRelevanceScore(b.name, searchTerm),
          calculateRelevanceScore(b.manufacturerPartNo, searchTerm),
          calculateRelevanceScore(b.description, searchTerm)
        );
        comparison = scoreB - scoreA; // Higher score first
        break;
      }
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        break;
      case 'number':
        comparison = Number(a.partNumber - b.partNumber);
        break;
      case 'date':
        // Spare parts don't have dates, so keep original order
        comparison = 0;
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
