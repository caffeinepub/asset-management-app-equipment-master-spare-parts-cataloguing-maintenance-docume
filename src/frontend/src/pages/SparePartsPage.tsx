import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
import SparePartLookup from '@/components/SparePartLookup';
import SparePartNameDropdown from '@/components/SparePartNameDropdown';
import {
  useCreateSparePart,
  useGetSparePartsByEquipment,
  useUpdateSparePart,
  useDeleteSparePart,
  useSearchSpareParts,
  useGetAllSpareParts,
  useGetEquipmentUsingSparePart,
  useLinkExistingSparePart,
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
  const linkExistingSparePart = useLinkExistingSparePart();

  const [selectedEquipment, setSelectedEquipment] = useState<bigint | null>(null);
  const [viewEquipment, setViewEquipment] = useState<bigint | null>(null);
  const [creationMode, setCreationMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingPart, setSelectedExistingPart] = useState<bigint | null>(null);
  
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
  const [viewUsedByDialogOpen, setViewUsedByDialogOpen] = useState(false);
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
  const { data: allSpareParts } = useGetAllSpareParts();
  const { data: equipmentUsingPart } = useGetEquipmentUsingSparePart(selectedPart?.partNumber || null);

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

  const handleExistingPartSelect = (partNumber: bigint | null) => {
    setSelectedExistingPart(partNumber);
    if (partNumber && allSpareParts) {
      const part = allSpareParts.find((p) => p.partNumber === partNumber);
      if (part) {
        setFormData({
          name: part.name,
          description: part.description,
          quantity: part.quantity.toString(),
          supplier: part.supplier,
          manufacturer: part.manufacturer,
          partNo: part.manufacturerPartNo,
          modelSerial: part.modelSerial,
          additionalInformation: part.additionalInformation || '',
        });
        setAttachment(part.attachment || null);
        setAttachmentName('');
      }
    }
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

    if (creationMode === 'existing' && selectedExistingPart) {
      linkExistingSparePart.mutate(
        {
          equipmentNumber: selectedEquipment,
          partNumber: selectedExistingPart,
        },
        {
          onSuccess: (success) => {
            if (success) {
              toast.success('Spare part linked to equipment successfully!');
              resetForm();
            } else {
              toast.error('Failed to link spare part');
            }
          },
          onError: () => {
            toast.error('Failed to link spare part');
          },
        }
      );
    } else {
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
              toast.success(`Spare part created successfully! Part Number: SP-${partNumber.toString().padStart(4, '0')}`);
              resetForm();
            } else {
              toast.error('Equipment not found');
            }
          },
          onError: () => {
            toast.error('Failed to create spare part');
          },
        }
      );
    }
  };

  const resetForm = () => {
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
    setSelectedExistingPart(null);
    setCreationMode('new');
  };

  const handleEdit = (part: SparePart) => {
    setSelectedPart(part);
    setEditFormData({
      name: part.name,
      description: part.description,
      quantity: part.quantity.toString(),
      supplier: part.supplier,
      manufacturer: part.manufacturer,
      partNo: part.manufacturerPartNo,
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

  const handleViewUsedBy = (part: SparePart) => {
    setSelectedPart(part);
    setViewUsedByDialogOpen(true);
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

    deleteSparePart.mutate(selectedPart.partNumber, {
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
    });
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

  const isFormDisabled = creationMode === 'existing' && !!selectedExistingPart;

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

                <FormField label="Mode" required>
                  <RadioGroup
                    value={creationMode}
                    onValueChange={(value) => {
                      setCreationMode(value as 'new' | 'existing');
                      if (value === 'new') {
                        setSelectedExistingPart(null);
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
                      }
                    }}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="new" id="mode-new" />
                      <Label htmlFor="mode-new">Create New</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="existing" id="mode-existing" />
                      <Label htmlFor="mode-existing">Select Existing</Label>
                    </div>
                  </RadioGroup>
                </FormField>

                {creationMode === 'existing' && (
                  <FormField label="Select Existing Spare Part" required>
                    <SparePartLookup
                      value={selectedExistingPart}
                      onChange={handleExistingPartSelect}
                    />
                  </FormField>
                )}

                <FormField label="Part Name" required>
                  <SparePartNameDropdown
                    value={formData.name}
                    onChange={(value) => handleChange('name', value)}
                    equipmentNumber={selectedEquipment}
                    placeholder="Select or type part name"
                  />
                </FormField>

                <FormField label="Description">
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter description"
                    disabled={isFormDisabled}
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
                    disabled={isFormDisabled}
                  />
                </FormField>

                <FormField label="Supplier">
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => handleChange('supplier', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter supplier"
                    disabled={isFormDisabled}
                  />
                </FormField>

                <FormField label="Manufacturer">
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter manufacturer"
                    disabled={isFormDisabled}
                  />
                </FormField>

                <FormField label="Manufacturer Part Number">
                  <input
                    type="text"
                    value={formData.partNo}
                    onChange={(e) => handleChange('partNo', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter manufacturer part number"
                    disabled={isFormDisabled}
                  />
                </FormField>

                <FormField label="Model/Serial">
                  <input
                    type="text"
                    value={formData.modelSerial}
                    onChange={(e) => handleChange('modelSerial', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter model/serial"
                    disabled={isFormDisabled}
                  />
                </FormField>

                <FormField label="Attachment">
                  {attachment ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 border rounded-md bg-muted text-sm">
                        {attachmentName || 'Attachment uploaded'}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <span className="ml-2 text-muted-foreground">({uploadProgress}%)</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleRemoveAttachment}
                        disabled={isFormDisabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="attachment"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isFormDisabled}
                      />
                      <label
                        htmlFor="attachment"
                        className={`flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          isFormDisabled ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </label>
                    </div>
                  )}
                </FormField>

                <FormField label="Additional Information">
                  <textarea
                    value={formData.additionalInformation}
                    onChange={(e) => handleChange('additionalInformation', e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter any additional information"
                    disabled={isFormDisabled}
                  />
                </FormField>

                <Button
                  type="submit"
                  disabled={createSparePart.isPending || linkExistingSparePart.isPending}
                  className="w-full"
                >
                  {(createSparePart.isPending || linkExistingSparePart.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {creationMode === 'existing' ? 'Link Spare Part' : 'Create Spare Part'}
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

              {viewEquipment && (
                <div className="border rounded-lg">
                  {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Loading spare parts...
                    </div>
                  ) : spareParts && spareParts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part No</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Manufacturer Part No</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Attachment</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {spareParts.map((part) => (
                          <TableRow key={part.partNumber.toString()}>
                            <TableCell>SP-{part.partNumber.toString().padStart(4, '0')}</TableCell>
                            <TableCell>{part.name}</TableCell>
                            <TableCell>{part.manufacturerPartNo}</TableCell>
                            <TableCell>{part.quantity.toString()}</TableCell>
                            <TableCell>{part.supplier}</TableCell>
                            <TableCell>
                              {part.attachment ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(part.attachment!, part.name)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(part)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(part)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleViewUsedBy(part)}>
                                  Used By
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No spare parts found for this equipment
                    </div>
                  )}
                </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <FormField label="Manufacturer Part Number">
                  <input
                    type="text"
                    value={searchCriteria.partNo}
                    onChange={(e) => handleSearchChange('partNo', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Search by manufacturer part number"
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

              <div className="border rounded-lg">
                {isSearching ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    Searching...
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Manufacturer Part No</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Attachment</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((part) => (
                        <TableRow key={part.partNumber.toString()}>
                          <TableCell>SP-{part.partNumber.toString().padStart(4, '0')}</TableCell>
                          <TableCell>{part.name}</TableCell>
                          <TableCell>{part.manufacturerPartNo}</TableCell>
                          <TableCell>{part.quantity.toString()}</TableCell>
                          <TableCell>{part.supplier}</TableCell>
                          <TableCell>
                            {part.attachment ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(part.attachment!, part.name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(part)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(part)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleViewUsedBy(part)}>
                                Used By
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Enter search criteria to find spare parts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Spare Part</DialogTitle>
            <DialogDescription>
              Update spare part information for SP-{selectedPart?.partNumber.toString().padStart(4, '0')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField label="Part Name" required>
              <SparePartNameDropdown
                value={editFormData.name}
                onChange={(value) => handleEditChange('name', value)}
                equipmentNumber={null}
                placeholder="Select or type part name"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={editFormData.description}
                onChange={(e) => handleEditChange('description', e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter description"
              />
            </FormField>

            <FormField label="Quantity" required>
              <input
                type="number"
                value={editFormData.quantity}
                onChange={(e) => handleEditChange('quantity', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter quantity"
                min="0"
              />
            </FormField>

            <FormField label="Supplier">
              <input
                type="text"
                value={editFormData.supplier}
                onChange={(e) => handleEditChange('supplier', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter supplier"
              />
            </FormField>

            <FormField label="Manufacturer">
              <input
                type="text"
                value={editFormData.manufacturer}
                onChange={(e) => handleEditChange('manufacturer', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter manufacturer"
              />
            </FormField>

            <FormField label="Manufacturer Part Number">
              <input
                type="text"
                value={editFormData.partNo}
                onChange={(e) => handleEditChange('partNo', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter manufacturer part number"
              />
            </FormField>

            <FormField label="Model/Serial">
              <input
                type="text"
                value={editFormData.modelSerial}
                onChange={(e) => handleEditChange('modelSerial', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter model/serial"
              />
            </FormField>

            <FormField label="Attachment">
              {editAttachment ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 border rounded-md bg-muted text-sm">
                    {editAttachmentName || 'Attachment uploaded'}
                    {editUploadProgress > 0 && editUploadProgress < 100 && (
                      <span className="ml-2 text-muted-foreground">({editUploadProgress}%)</span>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={handleEditRemoveAttachment}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="edit-attachment"
                    onChange={handleEditFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="edit-attachment"
                    className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </label>
                </div>
              )}
            </FormField>

            <FormField label="Additional Information">
              <textarea
                value={editFormData.additionalInformation}
                onChange={(e) => handleEditChange('additionalInformation', e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter any additional information"
              />
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
        onConfirm={confirmDelete}
        title="Delete Spare Part"
        description={`Are you sure you want to delete spare part "${selectedPart?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
      />

      {/* Used By Equipment Dialog */}
      <Dialog open={viewUsedByDialogOpen} onOpenChange={setViewUsedByDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Equipment Using This Spare Part</DialogTitle>
            <DialogDescription>
              SP-{selectedPart?.partNumber.toString().padStart(4, '0')} - {selectedPart?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {equipmentUsingPart && equipmentUsingPart.length > 0 ? (
              <div className="space-y-2">
                {equipmentUsingPart.map((equipment) => (
                  <div key={equipment.equipmentNumber.toString()} className="p-3 border rounded-lg">
                    <div className="font-medium">{equipment.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Equipment No: {equipment.equipmentNumber.toString()} | Tag: {equipment.equipmentTagNumber}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                This spare part is not currently linked to any equipment
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUsedByDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
