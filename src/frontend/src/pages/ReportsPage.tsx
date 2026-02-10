import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import EquipmentLookup from '@/components/EquipmentLookup';
import {
  useGetEquipmentList,
  useGetSparePartsByEquipment,
  useGetMaintenanceDueReport,
} from '@/hooks/useQueries';
import { exportToCSV, exportToPDF } from '@/lib/exports';
import { formatDate } from '@/lib/dates';
import { ArrowLeft, Download, FileSpreadsheet, FileText } from 'lucide-react';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [selectedEquipment, setSelectedEquipment] = useState<bigint | null>(null);

  const { data: equipmentList } = useGetEquipmentList();
  const { data: spareParts } = useGetSparePartsByEquipment(selectedEquipment);
  const { data: maintenanceDue } = useGetMaintenanceDueReport();

  const handleExportEquipmentCSV = () => {
    if (!equipmentList) return;
    const data = equipmentList.map((eq) => ({
      'Equipment Number': eq.equipmentNumber.toString(),
      Name: eq.name,
      Model: eq.model,
      'Serial Number': eq.serialNumber,
      Manufacturer: eq.manufacturer,
      Location: eq.location,
      'Purchase Date': formatDate(eq.purchaseDate),
      'Warranty Expiry': formatDate(eq.warrantyExpiry),
    }));
    exportToCSV(data, 'equipment-list.csv');
  };

  const handleExportEquipmentPDF = () => {
    if (!equipmentList) return;
    const headers = [
      'Equipment #',
      'Name',
      'Model',
      'Serial Number',
      'Manufacturer',
      'Location',
      'Purchase Date',
    ];
    const rows = equipmentList.map((eq) => [
      eq.equipmentNumber.toString(),
      eq.name,
      eq.model,
      eq.serialNumber,
      eq.manufacturer,
      eq.location,
      formatDate(eq.purchaseDate),
    ]);
    exportToPDF('Equipment List Report', headers, rows, 'equipment-list.pdf');
  };

  const handleExportSparePartsCSV = () => {
    if (!spareParts) return;
    const data = spareParts.map((part) => ({
      'Part Number': part.partNumber.toString(),
      'Equipment Number': part.equipmentNumber.toString(),
      Name: part.name,
      Description: part.description,
      Quantity: part.quantity.toString(),
      Supplier: part.supplier,
    }));
    exportToCSV(data, 'spare-parts.csv');
  };

  const handleExportSparePartsPDF = () => {
    if (!spareParts) return;
    const headers = ['Part #', 'Equipment #', 'Name', 'Description', 'Quantity', 'Supplier'];
    const rows = spareParts.map((part) => [
      part.partNumber.toString(),
      part.equipmentNumber.toString(),
      part.name,
      part.description,
      part.quantity.toString(),
      part.supplier,
    ]);
    exportToPDF('Spare Parts Report', headers, rows, 'spare-parts.pdf');
  };

  const handleExportMaintenanceCSV = () => {
    if (!maintenanceDue) return;
    const data = maintenanceDue.map((record) => ({
      'Maintenance ID': record.maintenanceId.toString(),
      'Equipment Number': record.equipmentNumber.toString(),
      'Maintenance Type': record.maintenanceType,
      Status: record.maintenanceStatus,
      'Last Maintenance': formatDate(record.lastMaintenanceDate),
      'Next Due Date': formatDate(record.nextMaintenanceDate),
    }));
    exportToCSV(data, 'maintenance-due.csv');
  };

  const handleExportMaintenancePDF = () => {
    if (!maintenanceDue) return;
    const headers = ['ID', 'Equipment #', 'Type', 'Status', 'Last Maintenance', 'Next Due'];
    const rows = maintenanceDue.map((record) => [
      record.maintenanceId.toString(),
      record.equipmentNumber.toString(),
      record.maintenanceType,
      record.maintenanceStatus,
      formatDate(record.lastMaintenanceDate),
      formatDate(record.nextMaintenanceDate),
    ]);
    exportToPDF('Maintenance Due Report', headers, rows, 'maintenance-due.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Generate operational and management reports</p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Equipment Master
        </Button>
      </div>

      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equipment">Equipment List</TabsTrigger>
          <TabsTrigger value="spare-parts">Spare Parts by Equipment</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Due</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Equipment List Report</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleExportEquipmentCSV}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleExportEquipmentPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {equipmentList && equipmentList.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Purchase Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipmentList.map((item) => (
                        <TableRow key={item.equipmentNumber.toString()}>
                          <TableCell className="font-medium">{item.equipmentNumber.toString()}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.model || '-'}</TableCell>
                          <TableCell>{item.serialNumber || '-'}</TableCell>
                          <TableCell>{item.manufacturer}</TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell>{formatDate(item.purchaseDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No equipment records found.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spare-parts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Spare Parts by Equipment Report</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportSparePartsCSV}
                    disabled={!selectedEquipment || !spareParts || spareParts.length === 0}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportSparePartsPDF}
                    disabled={!selectedEquipment || !spareParts || spareParts.length === 0}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-md">
                <label className="text-sm font-medium mb-2 block">Select Equipment</label>
                <EquipmentLookup value={selectedEquipment} onChange={setSelectedEquipment} />
              </div>

              {selectedEquipment && (
                <>
                  {spareParts && spareParts.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Part #</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Supplier</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {spareParts.map((part) => (
                            <TableRow key={part.partNumber.toString()}>
                              <TableCell className="font-medium">{part.partNumber.toString()}</TableCell>
                              <TableCell>{part.name}</TableCell>
                              <TableCell>{part.description}</TableCell>
                              <TableCell>{part.quantity.toString()}</TableCell>
                              <TableCell>{part.supplier}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No spare parts found for this equipment.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Maintenance Due Report</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportMaintenanceCSV}
                    disabled={!maintenanceDue || maintenanceDue.length === 0}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportMaintenancePDF}
                    disabled={!maintenanceDue || maintenanceDue.length === 0}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Showing maintenance records with status "overdue"
              </p>
              {maintenanceDue && maintenanceDue.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Maintenance ID</TableHead>
                        <TableHead>Equipment #</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Maintenance</TableHead>
                        <TableHead>Next Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceDue.map((record) => (
                        <TableRow key={record.maintenanceId.toString()}>
                          <TableCell className="font-medium">{record.maintenanceId.toString()}</TableCell>
                          <TableCell>{record.equipmentNumber.toString()}</TableCell>
                          <TableCell>{record.maintenanceType}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{record.maintenanceStatus}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(record.lastMaintenanceDate)}</TableCell>
                          <TableCell>{formatDate(record.nextMaintenanceDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No overdue maintenance records found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
