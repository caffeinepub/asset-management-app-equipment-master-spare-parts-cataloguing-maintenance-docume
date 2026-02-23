import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import FormField from '@/components/forms/FormField';
import EquipmentNameDropdown from '@/components/EquipmentNameDropdown';
import { useGetEquipmentList, useUpdateEquipment, useDeleteEquipment } from '@/hooks/useQueries';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Pencil, Trash2, Search, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Equipment, EngineeringDiscipline } from '@/backend';

const disciplineOptions: { value: EngineeringDiscipline; label: string }[] = [
  { value: 'mechanical' as EngineeringDiscipline, label: 'Mechanical' },
  { value: 'electrical' as EngineeringDiscipline, label: 'Electrical' },
  { value: 'instrumentation' as EngineeringDiscipline, label: 'Instrumentation' },
  { value: 'piping' as EngineeringDiscipline, label: 'Piping' },
  { value: 'unknown_' as EngineeringDiscipline, label: 'Unknown' },
];

export default function EquipmentListPage() {
  const navigate = useNavigate();
  const { identity, login } = useInternetIdentity();
  const { data: equipment = [], isLoading, isFetching, refetch } = useGetEquipmentList();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();

  const [searchTerm, setSearchTerm] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

  const isAuthenticated = !!identity;

  // Filter equipment based on search term and discipline with defensive null checks
  const filteredEquipment = useMemo(() => {
    return equipment.filter((eq) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        (eq.equipmentNumber?.toString() ?? '').includes(searchTerm) ||
        (eq.equipmentTagNumber ?? '').toLowerCase().includes(searchLower) ||
        (eq.name ?? '').toLowerCase().includes(searchLower) ||
        (eq.location ?? '').toLowerCase().includes(searchLower) ||
        (eq.manufacturer ?? '').toLowerCase().includes(searchLower) ||
        (eq.model ?? '').toLowerCase().includes(searchLower) ||
        (eq.serialNumber ?? '').toLowerCase().includes(searchLower);

      const matchesDiscipline =
        disciplineFilter === 'all' || eq.discipline === disciplineFilter;

      return matchesSearch && matchesDiscipline;
    });
  }, [equipment, searchTerm, disciplineFilter]);

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
  };

  const handleSaveEdit = async () => {
    if (!editingEquipment) return;

    try {
      await updateEquipment.mutateAsync({
        equipmentNumber: editingEquipment.equipmentNumber,
        name: editingEquipment.name,
        equipmentTagNumber: editingEquipment.equipmentTagNumber,
        location: editingEquipment.location,
        manufacturer: editingEquipment.manufacturer,
        model: editingEquipment.model,
        serial: editingEquipment.serialNumber,
        purchase: editingEquipment.purchaseDate,
        warranty: editingEquipment.warrantyExpiry,
        additionalInfo: editingEquipment.additionalInformation,
        discipline: editingEquipment.discipline,
      });
      toast.success('Equipment updated successfully');
      setEditingEquipment(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update equipment');
    }
  };

  const handleDeleteClick = (eq: Equipment) => {
    setEquipmentToDelete(eq);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!equipmentToDelete) return;

    try {
      await deleteEquipment.mutateAsync(equipmentToDelete.equipmentNumber);
      toast.success('Equipment deleted successfully');
      setDeleteConfirmOpen(false);
      setEquipmentToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete equipment');
    }
  };

  // Helper function to format discipline display with null safety
  const formatDiscipline = (discipline: EngineeringDiscipline | null | undefined): string => {
    if (!discipline) return 'N/A';
    const disciplineStr = String(discipline);
    return disciplineStr.replace('_', '').charAt(0).toUpperCase() + disciplineStr.replace('_', '').slice(1);
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipment List</h1>
            <p className="text-muted-foreground mt-1">View and manage all equipment</p>
          </div>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please <button onClick={login} className="underline font-medium">log in</button> to view equipment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipment List</h1>
            <p className="text-muted-foreground mt-1">View and manage all equipment</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Equipment List</h1>
          <p className="text-muted-foreground mt-1">View and manage all equipment</p>
        </div>
        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Refreshing...</span>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Equipment ({equipment.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by equipment #, tag, name, location, manufacturer, model, or serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Disciplines</SelectItem>
                {disciplineOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {equipment.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No equipment found. Create your first equipment entry to get started.</p>
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No equipment matches your search criteria.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment #</TableHead>
                    <TableHead>Tag Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Discipline</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.map((eq) => (
                    <TableRow key={eq.equipmentNumber?.toString() ?? 'unknown'}>
                      <TableCell className="font-medium">
                        EQ-{(eq.equipmentNumber?.toString() ?? '0').padStart(4, '0')}
                      </TableCell>
                      <TableCell>{eq.equipmentTagNumber ?? 'N/A'}</TableCell>
                      <TableCell>{eq.name ?? 'N/A'}</TableCell>
                      <TableCell>{formatDiscipline(eq.discipline)}</TableCell>
                      <TableCell>{eq.location ?? 'N/A'}</TableCell>
                      <TableCell>{eq.manufacturer ?? 'N/A'}</TableCell>
                      <TableCell>{eq.model ?? 'N/A'}</TableCell>
                      <TableCell>{eq.serialNumber ?? 'N/A'}</TableCell>
                      <TableCell>{formatDate(eq.purchaseDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(eq)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(eq)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEquipment} onOpenChange={(open) => !open && setEditingEquipment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>Update equipment information</DialogDescription>
          </DialogHeader>
          {editingEquipment && (
            <div className="space-y-4">
              <FormField label="Equipment Number" required>
                <Input
                  value={`EQ-${(editingEquipment.equipmentNumber?.toString() ?? '0').padStart(4, '0')}`}
                  disabled
                  className="bg-muted"
                />
              </FormField>

              <FormField label="Equipment Tag Number" required>
                <Input
                  value={editingEquipment.equipmentTagNumber ?? ''}
                  onChange={(e) =>
                    setEditingEquipment({ ...editingEquipment, equipmentTagNumber: e.target.value })
                  }
                />
              </FormField>

              <FormField label="Equipment Name" required>
                <EquipmentNameDropdown
                  value={editingEquipment.name ?? ''}
                  onChange={(value) => setEditingEquipment({ ...editingEquipment, name: value })}
                />
              </FormField>

              <FormField label="Discipline" required>
                <Select
                  value={editingEquipment.discipline ?? 'unknown_'}
                  onValueChange={(value) =>
                    setEditingEquipment({ ...editingEquipment, discipline: value as EngineeringDiscipline })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplineOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Location" required>
                <Input
                  value={editingEquipment.location ?? ''}
                  onChange={(e) => setEditingEquipment({ ...editingEquipment, location: e.target.value })}
                />
              </FormField>

              <FormField label="Manufacturer" required>
                <Input
                  value={editingEquipment.manufacturer ?? ''}
                  onChange={(e) => setEditingEquipment({ ...editingEquipment, manufacturer: e.target.value })}
                />
              </FormField>

              <FormField label="Model" required>
                <Input
                  value={editingEquipment.model ?? ''}
                  onChange={(e) => setEditingEquipment({ ...editingEquipment, model: e.target.value })}
                />
              </FormField>

              <FormField label="Serial Number" required>
                <Input
                  value={editingEquipment.serialNumber ?? ''}
                  onChange={(e) => setEditingEquipment({ ...editingEquipment, serialNumber: e.target.value })}
                />
              </FormField>

              <FormField label="Purchase Date" required>
                <Input
                  type="date"
                  value={new Date(Number(editingEquipment.purchaseDate ?? 0n) / 1_000_000).toISOString().split('T')[0]}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setEditingEquipment({
                      ...editingEquipment,
                      purchaseDate: BigInt(date.getTime()) * 1_000_000n,
                    });
                  }}
                />
              </FormField>

              <FormField label="Warranty Expiry" required>
                <Input
                  type="date"
                  value={new Date(Number(editingEquipment.warrantyExpiry ?? 0n) / 1_000_000).toISOString().split('T')[0]}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setEditingEquipment({
                      ...editingEquipment,
                      warrantyExpiry: BigInt(date.getTime()) * 1_000_000n,
                    });
                  }}
                />
              </FormField>

              <FormField label="Additional Information">
                <Textarea
                  value={editingEquipment.additionalInformation ?? ''}
                  onChange={(e) =>
                    setEditingEquipment({ ...editingEquipment, additionalInformation: e.target.value })
                  }
                  rows={3}
                />
              </FormField>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEquipment(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateEquipment.isPending}>
              {updateEquipment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Equipment"
        description={`Are you sure you want to delete equipment "${equipmentToDelete?.name ?? 'Unknown'}" (${equipmentToDelete?.equipmentTagNumber ?? 'N/A'})? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}
