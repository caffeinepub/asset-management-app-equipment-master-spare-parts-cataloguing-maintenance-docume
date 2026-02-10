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
import FormField from '@/components/forms/FormField';
import EquipmentLookup from '@/components/EquipmentLookup';
import {
  useCreateSparePart,
  useGetSparePartsByEquipment,
  useUpdateSparePart,
  useDeleteSparePart,
} from '@/hooks/useQueries';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import type { SparePart } from '@/backend';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function SparePartsPage() {
  const navigate = useNavigate();
  const createSparePart = useCreateSparePart();
  const updateSparePart = useUpdateSparePart();
  const deleteSparePart = useDeleteSparePart();

  const [selectedEquipment, setSelectedEquipment] = useState<bigint | null>(null);
  const [viewEquipment, setViewEquipment] = useState<bigint | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    supplier: '',
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    supplier: '',
  });

  const { data: spareParts, isLoading: isLoadingParts } = useGetSparePartsByEquipment(viewEquipment);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEquipment) {
      toast.error('Please select an equipment');
      return;
    }

    if (!formData.name || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const quantity = formData.quantity ? BigInt(formData.quantity) : BigInt(0);

    createSparePart.mutate(
      {
        equipmentNumber: selectedEquipment,
        name: formData.name,
        description: formData.description,
        quantity,
        supplier: formData.supplier,
      },
      {
        onSuccess: (partNumber) => {
          if (partNumber) {
            toast.success(`Spare part created successfully! Part Number: ${partNumber}`);
            setFormData({
              name: '',
              description: '',
              quantity: '',
              supplier: '',
            });
          } else {
            toast.error('Equipment not found');
          }
        },
        onError: () => {
          toast.error('Failed to create spare part');
        },
      }
    );
  };

  const handleEdit = (part: SparePart) => {
    setSelectedPart(part);
    setEditFormData({
      name: part.name,
      description: part.description,
      quantity: part.quantity.toString(),
      supplier: part.supplier,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (part: SparePart) => {
    setSelectedPart(part);
    setDeleteDialogOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPart) return;

    const quantity = editFormData.quantity ? BigInt(editFormData.quantity) : BigInt(0);

    updateSparePart.mutate(
      {
        equipmentNumber: selectedPart.equipmentNumber,
        partNumber: selectedPart.partNumber,
        name: editFormData.name,
        description: editFormData.description,
        quantity,
        supplier: editFormData.supplier,
      },
      {
        onSuccess: (success) => {
          if (success) {
            toast.success('Spare part updated successfully');
            setEditDialogOpen(false);
            setSelectedPart(null);
          } else {
            toast.error('Failed to update spare part');
          }
        },
        onError: () => {
          toast.error('Failed to update spare part');
        },
      }
    );
  };

  const confirmDelete = () => {
    if (!selectedPart) return;

    deleteSparePart.mutate(
      {
        equipmentNumber: selectedPart.equipmentNumber,
        partNumber: selectedPart.partNumber,
      },
      {
        onSuccess: (success) => {
          if (success) {
            toast.success('Spare part deleted successfully');
            setDeleteDialogOpen(false);
            setSelectedPart(null);
          } else {
            toast.error('Failed to delete spare part');
          }
        },
        onError: () => {
          toast.error('Failed to delete spare part');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spare Parts</h1>
          <p className="text-muted-foreground mt-1">Manage spare parts linked to equipment</p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Equipment Master
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Spare Part</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Equipment Number" required>
                <EquipmentLookup value={selectedEquipment} onChange={setSelectedEquipment} />
              </FormField>

              <FormField label="Part Name" required>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter part name"
                />
              </FormField>

              <FormField label="Part Description" required>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter part description"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Quantity">
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="0"
                    min="0"
                  />
                </FormField>

                <FormField label="Supplier">
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => handleChange('supplier', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter supplier"
                  />
                </FormField>
              </div>

              <Button type="submit" disabled={createSparePart.isPending} className="w-full">
                {createSparePart.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Spare Part
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Spare Parts by Equipment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Select Equipment">
              <EquipmentLookup value={viewEquipment} onChange={setViewEquipment} />
            </FormField>

            {viewEquipment && (
              <>
                {isLoadingParts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : spareParts && spareParts.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part #</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {spareParts.map((part) => (
                          <TableRow key={part.partNumber.toString()}>
                            <TableCell className="font-medium">{part.partNumber.toString()}</TableCell>
                            <TableCell>{part.name}</TableCell>
                            <TableCell>{part.quantity.toString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(part)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(part)}>
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
                    No spare parts found for this equipment.
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
            <DialogTitle>Edit Spare Part</DialogTitle>
            <DialogDescription>Update spare part details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <FormField label="Part Name" required>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter part name"
              />
            </FormField>

            <FormField label="Part Description" required>
              <textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter part description"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Quantity">
                <input
                  type="number"
                  value={editFormData.quantity}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="0"
                  min="0"
                />
              </FormField>

              <FormField label="Supplier">
                <input
                  type="text"
                  value={editFormData.supplier}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, supplier: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Enter supplier"
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSparePart.isPending}>
                {updateSparePart.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
        title="Delete Spare Part"
        description={`Are you sure you want to delete "${selectedPart?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
