import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGetAllEquipment, useUpdateEquipment, useDeleteEquipment } from '@/hooks/useQueries';
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import { toast } from 'sonner';
import type { Equipment } from '@/backend';
import FormField from '@/components/forms/FormField';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function EquipmentListPage() {
  const navigate = useNavigate();
  const { data: equipment, isLoading } = useGetAllEquipment();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
  });

  const handleEdit = (item: Equipment) => {
    setSelectedEquipment(item);
    setFormData({
      name: item.name,
      location: item.location,
      manufacturer: item.manufacturer,
      model: item.model,
      serialNumber: item.serialNumber,
      purchaseDate: new Date(Number(item.purchaseDate) / 1000000).toISOString().split('T')[0],
      warrantyExpiry: new Date(Number(item.warrantyExpiry) / 1000000).toISOString().split('T')[0],
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (item: Equipment) => {
    setSelectedEquipment(item);
    setDeleteDialogOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEquipment) return;

    const purchaseDate = formData.purchaseDate
      ? BigInt(new Date(formData.purchaseDate).getTime() * 1000000)
      : BigInt(0);
    const warrantyExpiry = formData.warrantyExpiry
      ? BigInt(new Date(formData.warrantyExpiry).getTime() * 1000000)
      : BigInt(0);

    updateEquipment.mutate(
      {
        equipmentNumber: selectedEquipment.equipmentNumber,
        name: formData.name,
        location: formData.location,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial: formData.serialNumber,
        purchase: purchaseDate,
        warranty: warrantyExpiry,
      },
      {
        onSuccess: (success) => {
          if (success) {
            toast.success('Equipment updated successfully');
            setEditDialogOpen(false);
            setSelectedEquipment(null);
          } else {
            toast.error('Failed to update equipment');
          }
        },
        onError: () => {
          toast.error('Failed to update equipment');
        },
      }
    );
  };

  const confirmDelete = () => {
    if (!selectedEquipment) return;

    deleteEquipment.mutate(selectedEquipment.equipmentNumber, {
      onSuccess: (success) => {
        if (success) {
          toast.success('Equipment deleted successfully');
          setDeleteDialogOpen(false);
          setSelectedEquipment(null);
        } else {
          toast.error('Failed to delete equipment');
        }
      },
      onError: () => {
        toast.error('Failed to delete equipment');
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment List</h1>
          <p className="text-muted-foreground mt-1">View all equipment records</p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Equipment Master
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : equipment && equipment.length > 0 ? (
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.map((item) => (
                    <TableRow key={item.equipmentNumber.toString()}>
                      <TableCell className="font-medium">{item.equipmentNumber.toString()}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.model || '-'}</TableCell>
                      <TableCell>{item.serialNumber || '-'}</TableCell>
                      <TableCell>{item.manufacturer}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{formatDate(item.purchaseDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(item)}>
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
            <div className="text-center py-8 text-muted-foreground">
              No equipment records found. Create your first equipment record to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>Update equipment details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <FormField label="Equipment Name" required>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter equipment name"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Model">
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Enter model"
                />
              </FormField>

              <FormField label="Serial Number">
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Enter serial number"
                />
              </FormField>
            </div>

            <FormField label="Manufacturer" required>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData((prev) => ({ ...prev, manufacturer: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter manufacturer"
              />
            </FormField>

            <FormField label="Location" required>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter location"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Purchase Date">
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </FormField>

              <FormField label="Warranty Expiry">
                <input
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={(e) => setFormData((prev) => ({ ...prev, warrantyExpiry: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateEquipment.isPending}>
                {updateEquipment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
        title="Delete Equipment"
        description={`Are you sure you want to delete "${selectedEquipment?.name}"? This will also delete all related spare parts, cataloguing records, maintenance records, and documents. This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
