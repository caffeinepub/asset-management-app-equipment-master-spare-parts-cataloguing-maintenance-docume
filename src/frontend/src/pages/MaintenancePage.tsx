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
    additionalInformation: '',
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    maintenanceType: '',
    status: Variant_scheduled_completed_overdue.scheduled,
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    additionalInformation: '',
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
        additionalInfo: formData.additionalInformation,
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
              additionalInformation: '',
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
      lastMaintenanceDate: record.lastMaintenanceDate
        ? new Date(Number(record.lastMaintenanceDate) / 1000000).toISOString().split('T')[0]
        : '',
      nextMaintenanceDate: record.nextMaintenanceDate
        ? new Date(Number(record.nextMaintenanceDate) / 1000000).toISOString().split('T')[0]
        : '',
      additionalInformation: record.additionalInformation || '',
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditStatusChange = (value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      status: value as Variant_scheduled_completed_overdue,
    }));
  };

  const handleUpdateSubmit = async () => {
    if (!selectedRecord) return;

    const lastDate = editFormData.lastMaintenanceDate
      ? BigInt(new Date(editFormData.lastMaintenanceDate).getTime() * 1000000)
      : BigInt(0);
    const nextDate = editFormData.nextMaintenanceDate
      ? BigInt(new Date(editFormData.nextMaintenanceDate).getTime() * 1000000)
      : BigInt(0);

    updateMaintenance.mutate(
      {
        equipmentNumber: selectedRecord.equipmentNumber,
        maintenanceId: selectedRecord.maintenanceId,
        maintType: editFormData.maintenanceType,
        status: editFormData.status,
        lastDate,
        nextDate,
        additionalInfo: editFormData.additionalInformation,
      },
      {
        onSuccess: (success) => {
          if (success) {
            toast.success('Maintenance record updated successfully');
            setEditDialogOpen(false);
          } else {
            toast.error('Maintenance record not found');
          }
        },
        onError: () => {
          toast.error('Failed to update maintenance record');
        },
      }
    );
  };

  const confirmDelete = () => {
    if (!selectedRecord) return;

    deleteMaintenance.mutate(
      {
        equipmentNumber: selectedRecord.equipmentNumber,
        maintenanceId: selectedRecord.maintenanceId,
      },
      {
        onSuccess: (success) => {
          if (success) {
            toast.success('Maintenance record deleted successfully');
            setDeleteDialogOpen(false);
          } else {
            toast.error('Maintenance record not found');
          }
        },
        onError: () => {
          toast.error('Failed to delete maintenance record');
        },
      }
    );
  };

  const getStatusBadge = (status: Variant_scheduled_completed_overdue) => {
    switch (status) {
      case Variant_scheduled_completed_overdue.scheduled:
        return <Badge variant="secondary">Scheduled</Badge>;
      case Variant_scheduled_completed_overdue.completed:
        return <Badge variant="default">Completed</Badge>;
      case Variant_scheduled_completed_overdue.overdue:
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Records</h1>
          <p className="text-muted-foreground mt-1">Track and manage equipment maintenance</p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Equipment Master
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
                  <input
                    type="text"
                    value={formData.maintenanceType}
                    onChange={(e) => handleChange('maintenanceType', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter maintenance type"
                  />
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

                <FormField label="Additional Information">
                  <textarea
                    value={formData.additionalInformation}
                    onChange={(e) => handleChange('additionalInformation', e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter any additional information about this maintenance record"
                  />
                </FormField>

                <Button type="submit" disabled={createMaintenance.isPending} className="w-full">
                  {createMaintenance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Maintenance Record
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>View Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Select Equipment">
                <EquipmentLookup value={viewEquipment} onChange={setViewEquipment} />
              </FormField>
            </CardContent>
          </Card>
        </div>
      </div>

      {viewEquipment && (
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Records for Equipment #{viewEquipment.toString()}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : maintenanceRecords && maintenanceRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Maintenance ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Maintenance</TableHead>
                      <TableHead>Next Maintenance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceRecords.map((record) => (
                      <TableRow key={record.maintenanceId.toString()}>
                        <TableCell className="font-medium">{record.maintenanceId.toString()}</TableCell>
                        <TableCell>{record.maintenanceType}</TableCell>
                        <TableCell>{getStatusBadge(record.maintenanceStatus)}</TableCell>
                        <TableCell>
                          {record.lastMaintenanceDate ? formatDate(record.lastMaintenanceDate) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.nextMaintenanceDate ? formatDate(record.nextMaintenanceDate) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(record)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(record)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No maintenance records found for this equipment.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Record</DialogTitle>
            <DialogDescription>Update maintenance record details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField label="Maintenance Type" required>
              <input
                type="text"
                value={editFormData.maintenanceType}
                onChange={(e) => handleEditChange('maintenanceType', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormField>

            <FormField label="Status">
              <select
                value={editFormData.status}
                onChange={(e) => handleEditStatusChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value={Variant_scheduled_completed_overdue.scheduled}>Scheduled</option>
                <option value={Variant_scheduled_completed_overdue.completed}>Completed</option>
                <option value={Variant_scheduled_completed_overdue.overdue}>Overdue</option>
              </select>
            </FormField>

            <FormField label="Last Maintenance Date">
              <input
                type="date"
                value={editFormData.lastMaintenanceDate}
                onChange={(e) => handleEditChange('lastMaintenanceDate', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormField>

            <FormField label="Next Maintenance Date">
              <input
                type="date"
                value={editFormData.nextMaintenanceDate}
                onChange={(e) => handleEditChange('nextMaintenanceDate', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormField>

            <FormField label="Additional Information">
              <textarea
                value={editFormData.additionalInformation}
                onChange={(e) => handleEditChange('additionalInformation', e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter any additional information about this maintenance record"
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubmit} disabled={updateMaintenance.isPending}>
              {updateMaintenance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Maintenance Record"
        description="Are you sure you want to delete this maintenance record? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
