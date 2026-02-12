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
            result.errors.push({ row: i + 2, error: validation.error || 'Validation failed' });
            continue;
          }

          try {
            const equipmentData = mapEquipmentRow(row);
            await createEquipment.mutateAsync(equipmentData);
            result.success++;
          } catch (error: any) {
            result.failed++;
            result.errors.push({ row: i + 2, error: error.message || 'Failed to create equipment' });
          }
        }

        // Refresh equipment queries
        queryClient.invalidateQueries({ queryKey: ['equipment'] });
        queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
      } else {
        // Import spare parts
        // Build equipment lookup map
        const equipmentByNumber = new Map<string, bigint>();
        const equipmentByTag = new Map<string, bigint>();

        allEquipment.forEach((eq) => {
          equipmentByNumber.set(eq.equipmentNumber.toString(), eq.equipmentNumber);
          if (eq.equipmentTagNumber) {
            equipmentByTag.set(eq.equipmentTagNumber.toLowerCase(), eq.equipmentNumber);
          }
        });

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const validation = validateSparePartRow(row);

          if (!validation.valid) {
            result.failed++;
            result.errors.push({ row: i + 2, error: validation.error || 'Validation failed' });
            continue;
          }

          // Resolve equipment reference
          let equipmentNumber: bigint | null = null;

          if (row.equipmentNumber) {
            equipmentNumber = equipmentByNumber.get(row.equipmentNumber) || null;
          } else if (row.equipmentTagNumber) {
            equipmentNumber = equipmentByTag.get(row.equipmentTagNumber.toLowerCase()) || null;
          }

          if (!equipmentNumber) {
            result.failed++;
            result.errors.push({
              row: i + 2,
              error: `Equipment not found for ${row.equipmentNumber ? 'equipmentNumber=' + row.equipmentNumber : 'equipmentTagNumber=' + row.equipmentTagNumber}`,
            });
            continue;
          }

          try {
            const sparePartData = mapSparePartRow(row, equipmentNumber);
            await createSparePart.mutateAsync(sparePartData);
            result.success++;
          } catch (error: any) {
            result.failed++;
            result.errors.push({ row: i + 2, error: error.message || 'Failed to create spare part' });
          }
        }

        // Refresh spare parts queries
        queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
        queryClient.invalidateQueries({ queryKey: ['spare-parts-report'] });
      }

      setImportResult(result);

      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} ${importType === 'equipment' ? 'equipment' : 'spare parts'} records`);
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} records failed to import`);
      }
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (importType === 'equipment') {
      downloadCSVTemplate(EQUIPMENT_TEMPLATE_HEADERS, 'equipment_import_template.csv');
    } else {
      downloadCSVTemplate(SPARE_PARTS_TEMPLATE_HEADERS, 'spare_parts_import_template.csv');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import</h1>
        <p className="text-muted-foreground mt-1">Import equipment and spare parts from CSV files</p>
      </div>

      {!isAuthenticated && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be signed in to import data.{' '}
            <button onClick={login} className="underline font-medium">
              Sign in now
            </button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={importType} onValueChange={(value) => setImportType(value as ImportType)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="spareParts">Spare Parts</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Import</CardTitle>
              <CardDescription>Import equipment records from a CSV file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Required columns:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>name (required)</li>
                      <li>location (required)</li>
                      <li>manufacturer (required)</li>
                      <li>equipmentTagNumber (optional)</li>
                      <li>model (optional)</li>
                      <li>serialNumber (optional)</li>
                      <li>purchaseDate (optional, format: YYYY-MM-DD)</li>
                      <li>warrantyExpiry (optional, format: YYYY-MM-DD)</li>
                      <li>discipline (optional, values: MECHANICAL, ELECTRICAL, INSTRUMENTATION, PIPING)</li>
                      <li>additionalInformation (optional)</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

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
                  disabled={!isAuthenticated}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {file && previewData.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview (first 5 rows)</p>
                  <div className="border rounded-md overflow-auto max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(previewData[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, idx) => (
                          <TableRow key={idx}>
                            {Object.values(row).map((value, cellIdx) => (
                              <TableCell key={cellIdx} className="text-xs">
                                {value}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={!file || !isAuthenticated || isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Equipment
                    </>
                  )}
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
              <CardTitle>Spare Parts Import</CardTitle>
              <CardDescription>Import spare parts records from a CSV file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Required columns:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>equipmentNumber OR equipmentTagNumber (required, to link to equipment)</li>
                      <li>name (required)</li>
                      <li>description (optional)</li>
                      <li>quantity (optional, default: 0)</li>
                      <li>supplier (optional)</li>
                      <li>manufacturer (optional)</li>
                      <li>partNo (optional)</li>
                      <li>modelSerial (optional)</li>
                      <li>additionalInformation (optional)</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

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
                  disabled={!isAuthenticated}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {file && previewData.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview (first 5 rows)</p>
                  <div className="border rounded-md overflow-auto max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(previewData[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, idx) => (
                          <TableRow key={idx}>
                            {Object.values(row).map((value, cellIdx) => (
                              <TableCell key={cellIdx} className="text-xs">
                                {value}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={!file || !isAuthenticated || isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Spare Parts
                    </>
                  )}
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
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">{importResult.success} successful</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium">{importResult.failed} failed</span>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Errors:</p>
                <div className="border rounded-md max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.errors.map((error, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell className="text-xs text-red-600">{error.error}</TableCell>
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
