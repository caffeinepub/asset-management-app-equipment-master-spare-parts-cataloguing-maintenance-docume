import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import FormField from '@/components/forms/FormField';
import EquipmentLookup from '@/components/EquipmentLookup';
import {
  useCreateMaintenanceRecord,
  useGetMaintenanceByEquipment,
  useUpdateMaintenanceRecord,
  useDeleteMaintenanceRecord,
} from '@/hooks/useQueries';
import { Variant_scheduled_completed_overdue } from '@/backend';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import type { MaintenanceRecord } from '@/backend';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function MaintenancePage() {
  const navigate = useNavigate();
  const createMaintenance = useCreateMaintenanceRecord();
  const updateMaintenance = useUpdateMaintenanceRecord();
  const deleteMaintenance = useDeleteMaintenanceRecord();

  const [selectedEquipment, setSelectedEquipment] = useState<bigint | null>(null);
  const [viewEquipment, setViewEquipment] = useState<bigint | null>(null);
  const [formData, setFormData] = useState({
    maintenanceType: '',
    status: Variant_scheduled_completed_overdue.scheduled,
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    maintenanceType: '',
    status: Variant_scheduled_completed_overdue.scheduled,
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
  });

  const { data: maintenanceRecords, isLoading } = useGetMaintenanceByEquipment(viewEquipment);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value as Variant_scheduled_completed_overdue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEquipment) {
      toast.error('Please select an equipment');
      return;
    }

    if (!formData.maintenanceType) {
      toast.error('Please fill in maintenance type');
      return;
    }

    const lastDate = formData.lastMaintenanceDate
      ? BigInt(new Date(formData.lastMaintenanceDate).getTime() * 1000000)
      : BigInt(0);
    const nextDate = formData.nextMaintenanceDate
      ? BigInt(new Date(formData.nextMaintenanceDate).getTime() * 1000000)
      : BigInt(0);

    createMaintenance.mutate(
      {
        equipmentNumber: selectedEquipment,
        maintType: formData.maintenanceType,
        status: formData.status,
        lastDate,
        nextDate,
      },
      {
        onSuccess: (maintenanceId) => {
          if (maintenanceId) {
            toast.success(`Maintenance record created successfully! ID: ${maintenanceId}`);
            setFormData({
              maintenanceType: '',
              status: Variant_scheduled_completed_overdue.scheduled,
              lastMaintenanceDate: '',
              nextMaintenanceDate: '',
            });
          } else {
            toast.error('Equipment not found');
          }
        },
        onError: () => {
          toast.error('Failed to create maintenance record');
        },
      }
    );
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setEditFormData({
      maintenanceType: record.maintenanceType,
      status: record.maintenanceStatus,
      lastMaintenanceDate: new Date(Number(record.lastMaintenanceDate) / 1000000).toISOString().split('T')[0],
      nextMaintenanceDate: new Date(Number(record.nextMaintenanceDate) / 1000000).toISOString().split('T')[0],
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRecord || !viewEquipment) return;

    const lastDate = editFormData.lastMaintenanceDate
      ? BigInt(new Date(editFormData.lastMaintenanceDate).getTime() * 1000000)
      : BigInt(0);
    const nextDate = editFormData.nextMaintenanceDate
      ? BigInt(new Date(editFormData.nextMaintenanceDate).getTime() * 1000000)
      : BigInt(0);

    updateMaintenance.mutate(
      {
        equipmentNumber: viewEquipment,
        maintenanceId: selectedRecord.maintenanceId,
        maintType: editFormData.maintenanceType,
        status: editFormData.status,
        lastDate,
        nextDate,
      },
      {
        onSuccess: (success) => {
          if (success) {
            toast.success('Maintenance record updated successfully');
            setEditDialogOpen(false);
            setSelectedRecord(null);
          } else {
            toast.error('Failed to update maintenance record');
          }
        },
        onError: () => {
          toast.error('Failed to update maintenance record');
        },
      }
    );
  };

  const confirmDelete = () => {
    if (!selectedRecord || !viewEquipment) return;

    deleteMaintenance.mutate(
      {
        equipmentNumber: viewEquipment,
        maintenanceId: selectedRecord.maintenanceId,
      },
      {
        onSuccess: (success) => {
          if (success) {
            toast.success('Maintenance record deleted successfully');
            setDeleteDialogOpen(false);
            setSelectedRecord(null);
          } else {
            toast.error('Failed to delete maintenance record');
          }
        },
        onError: () => {
          toast.error('Failed to delete maintenance record');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground mt-1">Manage preventive maintenance and reliability data</p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Equipment Master
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Maintenance Record</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Equipment Number" required>
                <EquipmentLookup value={selectedEquipment} onChange={setSelectedEquipment} />
              </FormField>

              <FormField label="Maintenance Type" required>
                <select
                  value={formData.maintenanceType}
                  onChange={(e) => handleChange('maintenanceType', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select type</option>
                  <option value="Preventive">Preventive</option>
                  <option value="Breakdown">Breakdown</option>
                </select>
              </FormField>

              <FormField label="Status">
                <select
                  value={formData.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value={Variant_scheduled_completed_overdue.scheduled}>Scheduled</option>
                  <option value={Variant_scheduled_completed_overdue.completed}>Completed</option>
                  <option value={Variant_scheduled_completed_overdue.overdue}>Overdue</option>
                </select>
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Last Maintenance Date">
                  <input
                    type="date"
                    value={formData.lastMaintenanceDate}
                    onChange={(e) => handleChange('lastMaintenanceDate', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </FormField>

                <FormField label="Next Maintenance Date">
                  <input
                    type="date"
                    value={formData.nextMaintenanceDate}
                    onChange={(e) => handleChange('nextMaintenanceDate', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </FormField>
              </div>

              <Button type="submit" disabled={createMaintenance.isPending} className="w-full">
                {createMaintenance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Maintenance Record
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Maintenance Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Select Equipment">
              <EquipmentLookup value={viewEquipment} onChange={setViewEquipment} />
            </FormField>

            {viewEquipment && (
              <>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : maintenanceRecords && maintenanceRecords.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Next Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maintenanceRecords.map((record) => (
                          <TableRow key={record.maintenanceId.toString()}>
                            <TableCell className="font-medium">{record.maintenanceId.toString()}</TableCell>
                            <TableCell>{record.maintenanceType}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  record.maintenanceStatus === Variant_scheduled_completed_overdue.completed
                                    ? 'default'
                                    : record.maintenanceStatus === Variant_scheduled_completed_overdue.overdue
                                      ? 'destructive'
                                      : 'secondary'
                                }
                              >
                                {record.maintenanceStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(record.nextMaintenanceDate)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(record)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(record)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No maintenance records found for this equipment.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Maintenance Record</DialogTitle>
            <DialogDescription>Update maintenance record details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <FormField label="Maintenance Type" required>
              <select
                value={editFormData.maintenanceType}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, maintenanceType: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select type</option>
                <option value="Preventive">Preventive</option>
                <option value="Breakdown">Breakdown</option>
              </select>
            </FormField>

            <FormField label="Status">
              <select
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, status: e.target.value as Variant_scheduled_completed_overdue }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value={Variant_scheduled_completed_overdue.scheduled}>Scheduled</option>
                <option value={Variant_scheduled_completed_overdue.completed}>Completed</option>
                <option value={Variant_scheduled_completed_overdue.overdue}>Overdue</option>
              </select>
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Last Maintenance Date">
                <input
                  type="date"
                  value={editFormData.lastMaintenanceDate}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, lastMaintenanceDate: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </FormField>

              <FormField label="Next Maintenance Date">
                <input
                  type="date"
                  value={editFormData.nextMaintenanceDate}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMaintenance.isPending}>
                {updateMaintenance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Maintenance Record"
        description={`Are you sure you want to delete this maintenance record (ID: ${selectedRecord?.maintenanceId.toString()})? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
