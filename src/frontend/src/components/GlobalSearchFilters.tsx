import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DISCIPLINE_OPTIONS } from '@/lib/disciplines';
import { EngineeringDiscipline } from '@/backend';

export interface FilterState {
  discipline: EngineeringDiscipline | null;
  equipmentType: string;
  dateFrom: string;
  dateTo: string;
  resultType: 'both' | 'equipment' | 'spareParts';
}

export const defaultFilters: FilterState = {
  discipline: null,
  equipmentType: '',
  dateFrom: '',
  dateTo: '',
  resultType: 'both',
};

interface GlobalSearchFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export default function GlobalSearchFilters({ filters, onChange }: GlobalSearchFiltersProps) {
  const handleDisciplineChange = (value: string) => {
    onChange({
      ...filters,
      discipline: value === 'all' ? null : (value as EngineeringDiscipline),
    });
  };

  const handleEquipmentTypeChange = (value: string) => {
    onChange({
      ...filters,
      equipmentType: value,
    });
  };

  const handleDateFromChange = (value: string) => {
    onChange({
      ...filters,
      dateFrom: value,
    });
  };

  const handleDateToChange = (value: string) => {
    onChange({
      ...filters,
      dateTo: value,
    });
  };

  const handleResultTypeChange = (value: string) => {
    onChange({
      ...filters,
      resultType: value as FilterState['resultType'],
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Result Type Filter */}
      <div className="space-y-2">
        <Label>Result Type</Label>
        <Select value={filters.resultType} onValueChange={handleResultTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">Both Equipment & Spare Parts</SelectItem>
            <SelectItem value="equipment">Equipment Only</SelectItem>
            <SelectItem value="spareParts">Spare Parts Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Discipline Filter */}
      <div className="space-y-2">
        <Label>Discipline</Label>
        <Select
          value={filters.discipline || 'all'}
          onValueChange={handleDisciplineChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Disciplines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Disciplines</SelectItem>
            {DISCIPLINE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Equipment Type Filter */}
      <div className="space-y-2">
        <Label>Equipment Type (Model)</Label>
        <Input
          type="text"
          placeholder="Filter by model..."
          value={filters.equipmentType}
          onChange={(e) => handleEquipmentTypeChange(e.target.value)}
        />
      </div>

      {/* Date Range Filters */}
      <div className="space-y-2">
        <Label>Purchase Date From</Label>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleDateFromChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Purchase Date To</Label>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleDateToChange(e.target.value)}
        />
      </div>
    </div>
  );
}
