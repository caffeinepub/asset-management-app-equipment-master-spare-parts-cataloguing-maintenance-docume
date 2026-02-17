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
import FormField from '@/components/forms/FormField';
import EquipmentNameDropdown from '@/components/EquipmentNameDropdown';
import { useGetEquipmentList, useUpdateEquipment, useDeleteEquipment } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Pencil, Trash2, Search } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import type { Equipment } from '@/backend';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DISCIPLINE_OPTIONS, disciplineToLabel } from '@/lib/disciplines';
import { EngineeringDiscipline } from '@/backend';

export default function EquipmentListPage() {
  const navigate = useNavigate();
  const { data: equipment, isLoading } = useGetEquipmentList();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [editFormData, setEditFormData] = useState({
    name: '',
    equipmentTagNumber: '',
    location: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    additionalInformation: '',
    discipline: EngineeringDiscipline.unknown_,
  });

  // Filter equipment based on search query and discipline
  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];

    let filtered = equipment;

    // Apply discipline filter
    if (disciplineFilter !== 'all') {
      filtered = filtered.filter((eq) => eq.discipline === disciplineFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((eq) => {
        return (
          eq.equipmentNumber.toString().includes(query) ||
          (eq.equipmentTagNumber && eq.equipmentTagNumber.toLowerCase().includes(query)) ||
          eq.name.toLowerCase().includes(query) ||
          eq.location.toLowerCase().includes(query) ||
          eq.manufacturer.toLowerCase().includes(query) ||
          (eq.model && eq.model.toLowerCase().includes(query)) ||
          (eq.serialNumber && eq.serialNumber.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  }, [equipment, searchQuery, disciplineFilter]);

  const handleEdit = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setEditFormData({
      name: eq.name,
      equipmentTagNumber: eq.equipmentTagNumber,
      location: eq.location,
      manufacturer: eq.manufacturer,
      model: eq.model,
      serialNumber: eq.serialNumber,
      purchaseDate: eq.purchaseDate ? new Date(Number(eq.purchaseDate) / 1000000).toISOString().split('T')[0] : '',
      warrantyExpiry: eq.warrantyExpiry ? new Date(Number(eq.warrantyExpiry) / 1000000).toISOString().split('T')[0] : '',
      additionalInformation: eq.additionalInformation || '',
      discipline: eq.discipline,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setDeleteDialogOpen(true);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditDisciplineChange = (value: string) => {
    setEditFormData((prev) => ({ ...prev, discipline: value as EngineeringDiscipline }));
  };

  const handleUpdateSubmit = async () => {
    if (!selectedEquipment) return;

    const purchaseTime = editFormData.purchaseDate
      ? new Date(editFormData.purchaseDate).getTime() * 1000000
      : 0;
    const warrantyTime = editFormData.warrantyExpiry
      ? new Date(editFormData.warrantyExpiry).getTime() * 1000000
      : 0;

    updateEquipment.mutate(
      {
        equipmentNumber: selectedEquipment.equipmentNumber,
        name: editFormData.name,
        equipmentTagNumber: editFormData.equipmentTagNumber,
        location: editFormData.location,
        manufacturer: editFormData.manufacturer,
        model: editFormData.model,
        serial: editFormData.serialNumber,
        purchase: BigInt(purchaseTime),
        warranty: BigInt(warrantyTime),
        additionalInfo: editFormData.additionalInformation,
        discipline: editFormData.discipline,
      },
      {
        onSuccess: (success) => {
          if (success) {
            toast.success('Equipment updated successfully');
            setEditDialogOpen(false);
          } else {
            toast.error('Equipment not found');
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
        } else {
          toast.error('Equipment not found');
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
          <p className="text-muted-foreground mt-1">View and manage all equipment</p>
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
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by equipment #, tag number, name, location, manufacturer, model, or serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All Disciplines</option>
              {DISCIPLINE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEquipment.length > 0 ? (
            <div className="overflow-x-auto">
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
                    <TableHead>Warranty Expiry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.map((eq) => (
                    <TableRow key={eq.equipmentNumber.toString()}>
                      <TableCell className="font-medium">{eq.equipmentNumber.toString()}</TableCell>
                      <TableCell>{eq.equipmentTagNumber || '-'}</TableCell>
                      <TableCell>{eq.name}</TableCell>
                      <TableCell>{disciplineToLabel(eq.discipline)}</TableCell>
                      <TableCell>{eq.location}</TableCell>
                      <TableCell>{eq.manufacturer}</TableCell>
                      <TableCell>{eq.model || '-'}</TableCell>
                      <TableCell>{eq.serialNumber || '-'}</TableCell>
                      <TableCell>{formatDate(eq.purchaseDate)}</TableCell>
                      <TableCell>{formatDate(eq.warrantyExpiry)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(eq)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(eq)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : equipment && equipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No equipment records found.</p>
              <p className="text-sm mt-1">Create your first equipment record to get started.</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No equipment found matching your search criteria.</p>
              <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>Update equipment information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField label="Equipment Name" required>
              <EquipmentNameDropdown
                value={editFormData.name}
                onChange={(value) => handleEditChange('name', value)}
                placeholder="Select or type equipment name"
              />
            </FormField>

            <FormField label="Equipment Tag Number">
              <input
                type="text"
                value={editFormData.equipmentTagNumber}
                onChange={(e) => handleEditChange('equipmentTagNumber', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter equipment tag number"
              />
            </FormField>

            <FormField label="Discipline">
              <select
                value={editFormData.discipline}
                onChange={(e) => handleEditDisciplineChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value={EngineeringDiscipline.unknown_}>Select discipline</option>
                {DISCIPLINE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Location" required>
              <input
                type="text"
                value={editFormData.location}
                onChange={(e) => handleEditChange('location', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter location"
              />
            </FormField>

            <FormField label="Manufacturer" required>
              <input
                type="text"
                value={editFormData.manufacturer}
                onChange={(e) => handleEditChange('manufacturer', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter manufacturer"
              />
            </FormField>

            <FormField label="Model">
              <input
                type="text"
                value={editFormData.model}
                onChange={(e) => handleEditChange('model', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter model"
              />
            </FormField>

            <FormField label="Serial Number">
              <input
                type="text"
                value={editFormData.serialNumber}
                onChange={(e) => handleEditChange('serialNumber', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter serial number"
              />
            </FormField>

            <FormField label="Purchase Date">
              <input
                type="date"
                value={editFormData.purchaseDate}
                onChange={(e) => handleEditChange('purchaseDate', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormField>

            <FormField label="Warranty Expiry">
              <input
                type="date"
                value={editFormData.warrantyExpiry}
                onChange={(e) => handleEditChange('warrantyExpiry', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormField>

            <FormField label="Additional Information">
              <textarea
                value={editFormData.additionalInformation}
                onChange={(e) => handleEditChange('additionalInformation', e.target.value)}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter any additional information"
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubmit} disabled={updateEquipment.isPending}>
              {updateEquipment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Equipment"
        description={`Are you sure you want to delete equipment "${selectedEquipment?.name}"? This action cannot be undone and will also delete all associated spare parts, cataloguing records, maintenance records, and documents.`}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
