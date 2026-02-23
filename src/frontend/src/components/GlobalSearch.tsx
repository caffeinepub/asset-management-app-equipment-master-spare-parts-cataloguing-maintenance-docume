import { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGlobalSearchEquipment, useGlobalSearchSpareParts } from '@/hooks/useQueries';
import { useDebounce } from '@/hooks/useDebounce';
import GlobalSearchFilters, { type FilterState, defaultFilters } from '@/components/GlobalSearchFilters';
import { filterEquipment, filterSpareParts } from '@/lib/filtering';
import { sortEquipment, sortSpareParts, type SortField, type SortDirection } from '@/lib/sorting';
import type { Equipment, SparePart } from '@/backend';
import { disciplineToLabel } from '@/lib/disciplines';

export default function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>(() => {
    const stored = sessionStorage.getItem('globalSearchFilters');
    return stored ? JSON.parse(stored) : defaultFilters;
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('relevance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: equipmentResults = [], isLoading: equipmentLoading } = useGlobalSearchEquipment(debouncedSearchTerm);
  const { data: sparePartResults = [], isLoading: sparePartsLoading } = useGlobalSearchSpareParts(debouncedSearchTerm);

  const isLoading = equipmentLoading || sparePartsLoading;

  // Apply filters
  const filteredEquipment = useMemo(() => {
    return filterEquipment(equipmentResults, filters);
  }, [equipmentResults, filters]);

  const filteredSpareParts = useMemo(() => {
    return filterSpareParts(sparePartResults, filters);
  }, [sparePartResults, filters]);

  // Apply sorting
  const sortedEquipment = useMemo(() => {
    return sortEquipment(filteredEquipment, sortField, sortDirection, debouncedSearchTerm);
  }, [filteredEquipment, sortField, sortDirection, debouncedSearchTerm]);

  const sortedSpareParts = useMemo(() => {
    return sortSpareParts(filteredSpareParts, sortField, sortDirection, debouncedSearchTerm);
  }, [filteredSpareParts, sortField, sortDirection, debouncedSearchTerm]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.discipline) count++;
    if (filters.equipmentType) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.resultType !== 'both') count++;
    return count;
  }, [filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    sessionStorage.setItem('globalSearchFilters', JSON.stringify(newFilters));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    sessionStorage.removeItem('globalSearchFilters');
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const showEquipment = filters.resultType === 'both' || filters.resultType === 'equipment';
  const showSpareParts = filters.resultType === 'both' || filters.resultType === 'spareParts';

  const totalResults = (showEquipment ? sortedEquipment.length : 0) + (showSpareParts ? sortedSpareParts.length : 0);

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search equipment and spare parts... (min 2 characters)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      {/* Filters Panel */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Advanced Filters</CardTitle>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <GlobalSearchFilters filters={filters} onChange={handleFilterChange} />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Sort Controls */}
      {debouncedSearchTerm.length >= 2 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={toggleSortDirection}>
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground ml-auto">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </div>
        </div>
      )}

      {/* Results */}
      {debouncedSearchTerm.length < 2 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter at least 2 characters to search</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="animate-pulse">Searching...</div>
          </CardContent>
        </Card>
      ) : totalResults === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No results found for "{debouncedSearchTerm}"</p>
            {activeFilterCount > 0 && (
              <Button variant="link" onClick={handleClearFilters} className="mt-2">
                Clear filters to see more results
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Equipment Results */}
          {showEquipment && sortedEquipment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Equipment
                  <Badge variant="secondary">{sortedEquipment.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedEquipment.map((equipment) => (
                    <EquipmentResultCard key={equipment.equipmentNumber.toString()} equipment={equipment} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Spare Parts Results */}
          {showSpareParts && sortedSpareParts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Spare Parts
                  <Badge variant="secondary">{sortedSpareParts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedSpareParts.map((sparePart) => (
                    <SparePartResultCard key={sparePart.partNumber.toString()} sparePart={sparePart} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function EquipmentResultCard({ equipment }: { equipment: Equipment }) {
  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Equipment</Badge>
            <h3 className="font-semibold">{equipment.name}</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Equipment No:</span>{' '}
              <span className="font-medium">{equipment.equipmentNumber.toString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tag No:</span>{' '}
              <span className="font-medium">{equipment.equipmentTagNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Model:</span>{' '}
              <span>{equipment.model || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Serial No:</span>{' '}
              <span>{equipment.serialNumber || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Discipline:</span>{' '}
              <span>{disciplineToLabel(equipment.discipline)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>{' '}
              <span>{equipment.location || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparePartResultCard({ sparePart }: { sparePart: SparePart }) {
  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">Spare Part</Badge>
            <h3 className="font-semibold">{sparePart.name}</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Part No:</span>{' '}
              <span className="font-medium">{sparePart.partNumber.toString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Manufacturer Part No:</span>{' '}
              <span className="font-medium">{sparePart.manufacturerPartNo || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Manufacturer:</span>{' '}
              <span>{sparePart.manufacturer || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Quantity:</span>{' '}
              <span>{sparePart.quantity.toString()}</span>
            </div>
            {sparePart.description && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Description:</span>{' '}
                <span>{sparePart.description}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
