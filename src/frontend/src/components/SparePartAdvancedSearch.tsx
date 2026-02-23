import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, X, AlertCircle } from 'lucide-react';
import FormField from '@/components/forms/FormField';
import { useSearchSparePartsAdvanced } from '@/hooks/useQueries';
import { useDebounce } from '@/hooks/useDebounce';

export default function SparePartAdvancedSearch() {
  const [filters, setFilters] = useState({
    equipmentNo: '',
    tagNo: '',
    sparePartNo: '',
    spareName: '',
    description: '',
    modelNo: '',
    partNumber: '',
    serialNum: '',
  });

  const debouncedFilters = useDebounce(filters, 500);
  const searchQuery = useSearchSparePartsAdvanced(debouncedFilters);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      equipmentNo: '',
      tagNo: '',
      sparePartNo: '',
      spareName: '',
      description: '',
      modelNo: '',
      partNumber: '',
      serialNum: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v.trim() !== '');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Search</CardTitle>
          <CardDescription>Search spare parts using multiple criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Backend method required:</strong> searchSparePartsAdvanced(filters: SearchFilters)
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Equipment No">
              <Input
                value={filters.equipmentNo}
                onChange={(e) => handleFilterChange('equipmentNo', e.target.value)}
                placeholder="Search by equipment number"
              />
            </FormField>

            <FormField label="Tag No">
              <Input
                value={filters.tagNo}
                onChange={(e) => handleFilterChange('tagNo', e.target.value)}
                placeholder="Search by tag number"
              />
            </FormField>

            <FormField label="Spare Part No">
              <Input
                value={filters.sparePartNo}
                onChange={(e) => handleFilterChange('sparePartNo', e.target.value)}
                placeholder="Search by spare part number"
              />
            </FormField>

            <FormField label="Spare Name">
              <Input
                value={filters.spareName}
                onChange={(e) => handleFilterChange('spareName', e.target.value)}
                placeholder="Search by spare name"
              />
            </FormField>

            <FormField label="Description">
              <Input
                value={filters.description}
                onChange={(e) => handleFilterChange('description', e.target.value)}
                placeholder="Search by description"
              />
            </FormField>

            <FormField label="Model No">
              <Input
                value={filters.modelNo}
                onChange={(e) => handleFilterChange('modelNo', e.target.value)}
                placeholder="Search by model number"
              />
            </FormField>

            <FormField label="Part Number">
              <Input
                value={filters.partNumber}
                onChange={(e) => handleFilterChange('partNumber', e.target.value)}
                placeholder="Search by part number"
              />
            </FormField>

            <FormField label="Serial Num">
              <Input
                value={filters.serialNum}
                onChange={(e) => handleFilterChange('serialNum', e.target.value)}
                placeholder="Search by serial number"
              />
            </FormField>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClearFilters} disabled={!hasActiveFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>
            {searchQuery.data ? `${searchQuery.data.length} spare part(s) found` : 'Enter search criteria above'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searchQuery.isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Searching...</p>
          ) : searchQuery.data && searchQuery.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part No</TableHead>
                    <TableHead>Noun</TableHead>
                    <TableHead>Modifier</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Equipment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchQuery.data.map((result) => (
                    <TableRow key={result.partNumber.toString()}>
                      <TableCell>
                        <Badge variant="outline">{result.partNumber.toString()}</Badge>
                      </TableCell>
                      <TableCell>{result.noun}</TableCell>
                      <TableCell>{result.modifier}</TableCell>
                      <TableCell className="max-w-xs truncate">{result.description}</TableCell>
                      <TableCell>
                        {result.equipmentList && result.equipmentList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {result.equipmentList.map((eq) => (
                              <Badge key={eq.equipmentNumber.toString()} variant="secondary" className="text-xs">
                                {eq.equipmentTagNumber}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : hasActiveFilters ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No spare parts match your search criteria</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Enter search criteria to find spare parts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
