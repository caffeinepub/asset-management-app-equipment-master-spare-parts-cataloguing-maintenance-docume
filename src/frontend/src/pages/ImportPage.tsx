import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useCreateEquipment, useCreateSparePart, useGetAllEquipment } from '@/hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { parseCSV, validateEquipmentRow, validateSparePartRow } from '@/lib/csvImport';
import { mapEquipmentRow, mapSparePartRow, EQUIPMENT_TEMPLATE_HEADERS, SPARE_PARTS_TEMPLATE_HEADERS } from '@/lib/importMappings';
import { downloadCSVTemplate } from '@/lib/exports';
import { normalizeError, isBackendConfigError } from '@/lib/errors';
import type { Equipment } from '@/backend';

type ImportType = 'equipment' | 'spareParts';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export default function ImportPage() {
  const { identity, login } = useInternetIdentity();
  const createEquipment = useCreateEquipment();
  const createSparePart = useCreateSparePart();
  const { data: allEquipment = [] } = useGetAllEquipment();
  const queryClient = useQueryClient();

  const [importType, setImportType] = useState<ImportType>('equipment');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = !!identity;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setImportResult(null);

    // Parse and preview
    const text = await selectedFile.text();
    const parsed = parseCSV(text);
    setPreviewData(parsed.slice(0, 5)); // Show first 5 rows
  };

  const findEquipmentNumber = (row: Record<string, string>, equipment: Equipment[]): bigint | null => {
    const equipmentNumberStr = row.equipmentNumber || row.EquipmentNumber || '';
    const equipmentTagNumber = row.equipmentTagNumber || row.EquipmentTagNumber || '';

    // Try to find by equipment number first
    if (equipmentNumberStr) {
      try {
        const eqNum = BigInt(parseInt(equipmentNumberStr, 10));
        const found = equipment.find((eq) => eq.equipmentNumber === eqNum);
        if (found) return eqNum;
      } catch {
        // Invalid number, continue
      }
    }

    // Try to find by equipment tag number
    if (equipmentTagNumber) {
      const found = equipment.find((eq) => eq.equipmentTagNumber === equipmentTagNumber);
      if (found) return found.equipmentNumber;
    }

    return null;
  };

  const handleImport = async () => {
    if (!file || !isAuthenticated) {
      toast.error('Please sign in and select a file');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error('No data found in CSV file');
        setIsImporting(false);
        return;
      }

      const result: ImportResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      if (importType === 'equipment') {
        // Import equipment
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const validation = validateEquipmentRow(row);

          if (!validation.valid) {
            result.failed++;
            result.errors.push({ row: i + 2, error: validation.error || 'Invalid row' });
            continue;
          }

          try {
            const equipmentData = mapEquipmentRow(row);
            await createEquipment.mutateAsync(equipmentData);
            result.success++;
          } catch (error) {
            result.failed++;
            const errorMessage = normalizeError(error);
            result.errors.push({ row: i + 2, error: errorMessage });
            
            // If we hit a backend config error, stop the import immediately
            if (isBackendConfigError(error)) {
              toast.error('Backend configuration error detected. Import stopped.', { duration: 10000 });
              console.error('[Import] Backend configuration error:', error);
              break;
            }
          }
        }
      } else {
        // Import spare parts
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const validation = validateSparePartRow(row);

          if (!validation.valid) {
            result.failed++;
            result.errors.push({ row: i + 2, error: validation.error || 'Invalid row' });
            continue;
          }

          try {
            // Find the equipment number
            const equipmentNumber = findEquipmentNumber(row, allEquipment);
            if (!equipmentNumber) {
              result.failed++;
              result.errors.push({ row: i + 2, error: 'Equipment not found' });
              continue;
            }

            const sparePartData = mapSparePartRow(row, equipmentNumber);
            await createSparePart.mutateAsync(sparePartData);
            result.success++;
          } catch (error) {
            result.failed++;
            const errorMessage = normalizeError(error);
            result.errors.push({ row: i + 2, error: errorMessage });
          }
        }
      }

      setImportResult(result);

      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} ${importType === 'equipment' ? 'equipment' : 'spare parts'}`);
        queryClient.invalidateQueries({ queryKey: ['equipment'] });
        queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      }

      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} rows. See details below.`);
      }
    } catch (error) {
      const errorMessage = normalizeError(error);
      toast.error(`Import failed: ${errorMessage}`);
      console.error('[Import] Error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (importType === 'equipment') {
      downloadCSVTemplate(EQUIPMENT_TEMPLATE_HEADERS, 'equipment_template.csv');
    } else {
      downloadCSVTemplate(SPARE_PARTS_TEMPLATE_HEADERS, 'spare_parts_template.csv');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
          <p className="text-muted-foreground mt-1">Bulk import equipment and spare parts from CSV files</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please <button onClick={login} className="underline font-medium">log in</button> to import data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
        <p className="text-muted-foreground mt-1">Bulk import equipment and spare parts from CSV files</p>
      </div>

      <Tabs value={importType} onValueChange={(v) => setImportType(v as ImportType)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="spareParts">Spare Parts</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Equipment</CardTitle>
              <CardDescription>Upload a CSV file to import multiple equipment records at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select CSV File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {file && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Selected: {file.name} ({previewData.length > 0 ? `${previewData.length}+ rows` : 'parsing...'})
                  </AlertDescription>
                </Alert>
              )}

              {previewData.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Preview (first 5 rows)</h3>
                  <div className="border rounded-md overflow-auto max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(previewData[0]).map((key) => (
                            <TableHead key={key} className="whitespace-nowrap">{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, idx) => (
                          <TableRow key={idx}>
                            {Object.values(row).map((val, i) => (
                              <TableCell key={i} className="whitespace-nowrap">{val}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={!file || isImporting} className="flex-1">
                  {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isImporting ? 'Importing...' : 'Import Equipment'}
                </Button>
                {file && (
                  <Button variant="outline" onClick={handleReset} disabled={isImporting}>
                    Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spareParts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Spare Parts</CardTitle>
              <CardDescription>Upload a CSV file to import multiple spare parts records at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select CSV File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {file && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Selected: {file.name} ({previewData.length > 0 ? `${previewData.length}+ rows` : 'parsing...'})
                  </AlertDescription>
                </Alert>
              )}

              {previewData.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Preview (first 5 rows)</h3>
                  <div className="border rounded-md overflow-auto max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(previewData[0]).map((key) => (
                            <TableHead key={key} className="whitespace-nowrap">{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, idx) => (
                          <TableRow key={idx}>
                            {Object.values(row).map((val, i) => (
                              <TableCell key={i} className="whitespace-nowrap">{val}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={!file || isImporting} className="flex-1">
                  {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isImporting ? 'Importing...' : 'Import Spare Parts'}
                </Button>
                {file && (
                  <Button variant="outline" onClick={handleReset} disabled={isImporting}>
                    Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-4 border rounded-md bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-sm font-medium">Success</div>
                  <div className="text-2xl font-bold">{importResult.success}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-4 border rounded-md bg-red-50 dark:bg-red-950">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <div className="text-sm font-medium">Failed</div>
                  <div className="text-2xl font-bold">{importResult.failed}</div>
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Errors</h3>
                <div className="border rounded-md overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.errors.map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{err.row}</TableCell>
                          <TableCell className="text-red-600 dark:text-red-400">{err.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
