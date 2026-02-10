import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  useSearchSpareParts,
} from '@/hooks/useQueries';
import { ExternalBlob } from '@/backend';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Upload, Download, X, Pencil, Trash2, Search } from 'lucide-react';
import { fileToExternalBlob } from '@/lib/files';
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
    manufacturer: '',
    partNo: '',
    modelSerial: '',
    additionalInformation: '',
  });
  const [attachment, setAttachment] = useState<ExternalBlob | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    supplier: '',
    manufacturer: '',
    partNo: '',
    modelSerial: '',
    additionalInformation: '',
  });
  const [editAttachment, setEditAttachment] = useState<ExternalBlob | null>(null);
  const [editAttachmentName, setEditAttachmentName] = useState<string>('');
  const [editUploadProgress, setEditUploadProgress] = useState<number>(0);

  const [searchCriteria, setSearchCriteria] = useState({
    equipmentTagNumber: '',
    modelSerial: '',
    partNo: '',
    manufacturer: '',
  });

  const { data: spareParts, isLoading } = useGetSparePartsByEquipment(viewEquipment);
  const { data: searchResults, isLoading: isSearching } = useSearchSpareParts(searchCriteria);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentName(file.name);
    setUploadProgress(0);

    const blob = await fileToExternalBlob(file, (progress) => {
      setUploadProgress(progress);
    });

    setAttachment(blob);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentName('');
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEquipment) {
      toast.error('Please select an equipment');
      return;
    }

    if (!formData.name || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    createSparePart.mutate(
      {
        equipmentNumber: selectedEquipment,
        name: formData.name,
        description: formData.description,
        quantity: BigInt(formData.quantity),
        supplier: formData.supplier,
        manufacturer: formData.manufacturer,
        partNo: formData.partNo,
        modelSerial: formData.modelSerial,
        attachment: attachment,
        additionalInfo: formData.additionalInformation,
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
              manufacturer: '',
              partNo: '',
              modelSerial: '',
              additionalInformation: '',
            });
            setAttachment(null);
            setAttachmentName('');
            setUploadProgress(0);
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
      manufacturer: part.manufacturer,
      partNo: part.partNo,
      modelSerial: part.modelSerial,
      additionalInformation: part.additionalInformation || '',
    });
    setEditAttachment(part.attachment || null);
    setEditAttachmentName('');
    setEditUploadProgress(0);
    setEditDialogOpen(true);
  };

  const handleDelete = (part: SparePart) => {
    setSelectedPart(part);
    setDeleteDialogOpen(true);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditAttachmentName(file.name);
    setEditUploadProgress(0);

    const blob = await fileToExternalBlob(file, (progress) => {
      setEditUploadProgress(progress);
    });

    setEditAttachment(blob);
  };

  const handleEditRemoveAttachment = () => {
    setEditAttachment(null);
    setEditAttachmentName('');
    setEditUploadProgress(0);
  };

  const handleUpdateSubmit = async () => {
    if (!selectedPart) return;

    updateSparePart.mutate(
      {
        equipmentNumber: selectedPart.equipmentNumber,
        partNumber: selectedPart.partNumber,
        name: editFormData.name,
        description: editFormData.description,
        quantity: BigInt(editFormData.quantity),
        supplier: editFormData.supplier,
        manufacturer: editFormData.manufacturer,
        partNo: editFormData.partNo,
        modelSerial: editFormData.modelSerial,
        attachment: editAttachment,
        additionalInfo: editFormData.additionalInformation,
      },
      {
        onSuccess: (success) => {
          if (success) {
            toast.success('Spare part updated successfully');
            setEditDialogOpen(false);
          } else {
            toast.error('Spare part not found');
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
          } else {
            toast.error('Spare part not found');
          }
        },
        onError: () => {
          toast.error('Failed to delete spare part');
        },
      }
    );
  };

  const handleSearchChange = (field: string, value: string) => {
    setSearchCriteria((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownload = (blob: ExternalBlob, partName: string) => {
    const url = blob.getDirectURL();
    const link = document.createElement('a');
    link.href = url;
    link.download = `${partName}-attachment`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spare Parts Management</h1>
          <p className="text-muted-foreground mt-1">Manage spare parts inventory with attachments</p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Equipment Master
        </Button>
      </div>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Spare Part</TabsTrigger>
          <TabsTrigger value="view">View by Equipment</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Spare Part</CardTitle>
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

                <FormField label="Description">
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter description"
                  />
                </FormField>

                <FormField label="Quantity" required>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter quantity"
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

                <FormField label="Manufacturer">
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter manufacturer"
                  />
                </FormField>

                <FormField label="Part Number">
                  <input
                    type="text"
                    value={formData.partNo}
                    onChange={(e) => handleChange('partNo', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter part number"
                  />
                </FormField>

                <FormField label="Model/Serial">
                  <input
                    type="text"
                    value={formData.modelSerial}
                    onChange={(e) => handleChange('modelSerial', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter model/serial"
                  />
                </FormField>

                <FormField label="Additional Information">
                  <textarea
                    value={formData.additionalInformation}
                    onChange={(e) => handleChange('additionalInformation', e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter any additional information about this spare part"
                  />
                </FormField>

                <FormField label="Attachment">
                  {!attachment ? (
                    <div>
                      <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="*/*"
                      />
                      <label htmlFor="file-upload">
                        <Button type="button" variant="outline" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                          </span>
                        </Button>
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 border rounded-md">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{attachmentName}</p>
                        {uploadProgress < 100 && (
                          <div className="mt-2">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{uploadProgress}% uploaded</p>
                          </div>
                        )}
                      </div>
                      <Button type="button" size="sm" variant="ghost" onClick={handleRemoveAttachment}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </FormField>

                <Button type="submit" disabled={createSparePart.isPending} className="w-full">
                  {createSparePart.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Spare Part
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>View Spare Parts by Equipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Select Equipment">
                <EquipmentLookup value={viewEquipment} onChange={setViewEquipment} />
              </FormField>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : spareParts && spareParts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Part No</TableHead>
                        <TableHead>Model/Serial</TableHead>
                        <TableHead>Attachment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                          <TableCell>{part.manufacturer}</TableCell>
                          <TableCell>{part.partNo}</TableCell>
                          <TableCell>{part.modelSerial}</TableCell>
                          <TableCell>
                            {part.attachment ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(part.attachment!, part.name)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(part)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(part)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : viewEquipment ? (
                <p className="text-center py-8 text-muted-foreground">
                  No spare parts found for this equipment.
                </p>
              ) : (
                <p className="text-center py-8 text-muted-foreground">Select an equipment to view spare parts.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Spare Parts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Equipment Tag Number">
                  <input
                    type="text"
                    value={searchCriteria.equipmentTagNumber}
                    onChange={(e) => handleSearchChange('equipmentTagNumber', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Search by equipment tag number"
                  />
                </FormField>

                <FormField label="Model/Serial">
                  <input
                    type="text"
                    value={searchCriteria.modelSerial}
                    onChange={(e) => handleSearchChange('modelSerial', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Search by model/serial"
                  />
                </FormField>

                <FormField label="Part Number">
                  <input
                    type="text"
                    value={searchCriteria.partNo}
                    onChange={(e) => handleSearchChange('partNo', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Search by part number"
                  />
                </FormField>

                <FormField label="Manufacturer">
                  <input
                    type="text"
                    value={searchCriteria.manufacturer}
                    onChange={(e) => handleSearchChange('manufacturer', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Search by manufacturer"
                  />
                </FormField>
              </div>

              {isSearching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment #</TableHead>
                        <TableHead>Part #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Part No</TableHead>
                        <TableHead>Model/Serial</TableHead>
                        <TableHead>Attachment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((part) => (
                        <TableRow key={`${part.equipmentNumber}-${part.partNumber}`}>
                          <TableCell className="font-medium">{part.equipmentNumber.toString()}</TableCell>
                          <TableCell>{part.partNumber.toString()}</TableCell>
                          <TableCell>{part.name}</TableCell>
                          <TableCell>{part.description}</TableCell>
                          <TableCell>{part.quantity.toString()}</TableCell>
                          <TableCell>{part.supplier}</TableCell>
                          <TableCell>{part.manufacturer}</TableCell>
                          <TableCell>{part.partNo}</TableCell>
                          <TableCell>{part.modelSerial}</TableCell>
                          <TableCell>
                            {part.attachment ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(part.attachment!, part.name)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : Object.values(searchCriteria).some((v) => v.trim()) ? (
                <p className="text-center py-8 text-muted-foreground">No spare parts found matching your search.</p>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Enter search criteria to find spare parts.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Spare Part</DialogTitle>
            <DialogDescription>Update spare part details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField label="Part Name" required>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => handleEditChange('name', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={editFormData.description}
                onChange={(e) => handleEditChange('description', e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormField>

            <FormField label="Quantity" required>
              <input
                type="number"
                value={editFormData.quantity}
                onChange={(e) => handleEditChange('quantity', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                min="0"
              />
            </FormField>

            <FormField label="Supplier">
              <input
                type="text"
                value={editFormData.supplier}
                onChange={(e) => handleEditChange('supplier', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormField>

            <FormField label="Manufacturer">
              <input
                type="text"
                value={editFormData.manufacturer}
                onChange={(e) => handleEditChange('manufacturer', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormField>

            <FormField label="Part Number">
              <input
                type="text"
                value={editFormData.partNo}
                onChange={(e) => handleEditChange('partNo', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormField>

            <FormField label="Model/Serial">
              <input
                type="text"
                value={editFormData.modelSerial}
                onChange={(e) => handleEditChange('modelSerial', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormField>

            <FormField label="Additional Information">
              <textarea
                value={editFormData.additionalInformation}
                onChange={(e) => handleEditChange('additionalInformation', e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter any additional information about this spare part"
              />
            </FormField>

            <FormField label="Attachment">
              {!editAttachment ? (
                <div>
                  <input
                    type="file"
                    id="edit-file-upload"
                    onChange={handleEditFileSelect}
                    className="hidden"
                    accept="*/*"
                  />
                  <label htmlFor="edit-file-upload">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-md">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {editAttachmentName || 'Existing attachment'}
                    </p>
                    {editUploadProgress > 0 && editUploadProgress < 100 && (
                      <div className="mt-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${editUploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{editUploadProgress}% uploaded</p>
                      </div>
                    )}
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={handleEditRemoveAttachment}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubmit} disabled={updateSparePart.isPending}>
              {updateSparePart.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Spare Part
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Spare Part"
        description="Are you sure you want to delete this spare part? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
