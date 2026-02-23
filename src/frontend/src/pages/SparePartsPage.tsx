import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FormField from '@/components/forms/FormField';
import SparePartNameDropdown from '@/components/SparePartNameDropdown';
import EquipmentLookup from '@/components/EquipmentLookup';
import SparePartLookup from '@/components/SparePartLookup';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  useGetAllSpareParts,
  useGetSparePartsByEquipment,
  useAddOrUpdateSparePart,
  useDeleteSparePart,
  useFindSparePartByMatching,
  useGetAllEquipment,
  useGetEquipmentUsingSparePart,
  useLinkExistingSparePart,
} from '@/hooks/useQueries';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Plus, Link as LinkIcon, Search, Trash2, AlertCircle, Package } from 'lucide-react';
import { formatFileSize } from '@/lib/files';
import type { SparePart, ExternalBlob } from '@/backend';

export default function SparePartsPage() {
  const navigate = useNavigate();
  const { identity, login } = useInternetIdentity();
  const { data: allSpareParts = [], isLoading: loadingAllParts } = useGetAllSpareParts();
  const { data: allEquipment = [] } = useGetAllEquipment();
  const addOrUpdateSparePart = useAddOrUpdateSparePart();
  const deleteSparePart = useDeleteSparePart();
  const searchMutation = useFindSparePartByMatching();
  const linkExistingMutation = useLinkExistingSparePart();

  const [mode, setMode] = useState<'create' | 'link'>('create');
  const [activeTab, setActiveTab] = useState('create');
  const [selectedEquipment, setSelectedEquipment] = useState<bigint | null>(null);
  const [selectedExistingPart, setSelectedExistingPart] = useState<bigint | null>(null);
  const [searchCriteria, setSearchCriteria] = useState('');
  const [searchResults, setSearchResults] = useState<SparePart[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    supplier: '',
    manufacturer: '',
    manufacturerPartNo: '',
    modelSerial: '',
    additionalInformation: '',
  });

  const [attachment, setAttachment] = useState<ExternalBlob | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<SparePart | null>(null);

  const [usedByDialogOpen, setUsedByDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  const { data: equipmentUsingPart = [] } = useGetEquipmentUsingSparePart(selectedPart?.partNumber || null);

  const isAuthenticated = !!identity;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
      // Note: In a real implementation, you would convert this to ExternalBlob
      // For now, we'll handle this in the submit
    }
  };

  const handleSearch = async () => {
    if (!searchCriteria.trim()) {
      toast.error('Please enter search criteria');
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchMutation.mutateAsync({
        searchTerm: searchCriteria,
        matchManufacturerPartNo: true,
        matchName: true,
        matchDescription: true,
      });
      setSearchResults(results);
      if (results.length === 0) {
        toast.info('No spare parts found matching your criteria');
      }
    } catch (error: any) {
      toast.error(error.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      toast.error('Please log in to create spare parts');
      return;
    }

    if (!selectedEquipment) {
      toast.error('Please select an equipment');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a spare part name');
      return;
    }

    try {
      const part: SparePart = {
        partNumber: BigInt(Date.now()), // Temporary, will be assigned by backend
        name: formData.name,
        description: formData.description,
        quantity: BigInt(formData.quantity || '0'),
        supplier: formData.supplier,
        manufacturer: formData.manufacturer,
        manufacturerPartNo: formData.manufacturerPartNo,
        modelSerial: formData.modelSerial,
        attachment: attachment || undefined,
        additionalInformation: formData.additionalInformation,
      };

      await addOrUpdateSparePart.mutateAsync({
        part,
        equipmentNumber: selectedEquipment,
      });

      toast.success('Spare part created successfully');
      setFormData({
        name: '',
        description: '',
        quantity: '',
        supplier: '',
        manufacturer: '',
        manufacturerPartNo: '',
        modelSerial: '',
        additionalInformation: '',
      });
      setAttachment(null);
      setAttachmentFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create spare part');
    }
  };

  const handleLinkExisting = async () => {
    if (!selectedEquipment || !selectedExistingPart) {
      toast.error('Please select both equipment and spare part');
      return;
    }

    try {
      const part = allSpareParts.find(p => p.partNumber === selectedExistingPart);
      if (!part) {
        toast.error('Selected spare part not found');
        return;
      }

      await linkExistingMutation.mutateAsync({
        part,
        equipmentNumber: selectedEquipment,
      });

      toast.success('Spare part linked to equipment successfully');
      setSelectedExistingPart(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to link spare part');
    }
  };

  const handleDeleteClick = (part: SparePart) => {
    setPartToDelete(part);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!partToDelete) return;

    try {
      await deleteSparePart.mutateAsync(partToDelete.partNumber);
      toast.success('Spare part deleted successfully');
      setDeleteConfirmOpen(false);
      setPartToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete spare part');
    }
  };

  const handleShowUsedBy = (part: SparePart) => {
    setSelectedPart(part);
    setUsedByDialogOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Spare Parts</h1>
            <p className="text-muted-foreground mt-1">Manage spare parts inventory</p>
          </div>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please <button onClick={login} className="underline font-medium">log in</button> to manage spare parts.
          </AlertDescription>
        </Alert>
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
          <h1 className="text-3xl font-bold tracking-tight">Spare Parts</h1>
          <p className="text-muted-foreground mt-1">Manage spare parts inventory</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="byEquipment">View by Equipment</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create or Link Spare Part</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Button
                  variant={mode === 'create' ? 'default' : 'outline'}
                  onClick={() => setMode('create')}
                  className="flex-1"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New
                </Button>
                <Button
                  variant={mode === 'link' ? 'default' : 'outline'}
                  onClick={() => setMode('link')}
                  className="flex-1"
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Link Existing
                </Button>
              </div>

              {mode === 'create' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField label="Equipment" required>
                    <EquipmentLookup value={selectedEquipment} onChange={setSelectedEquipment} />
                  </FormField>

                  <FormField label="Spare Part Name" required>
                    <SparePartNameDropdown
                      value={formData.name}
                      onChange={(value) => handleChange('name', value)}
                      placeholder="Select or type spare part name"
                    />
                  </FormField>

                  <FormField label="Description">
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Enter description"
                      rows={3}
                    />
                  </FormField>

                  <FormField label="Quantity">
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleChange('quantity', e.target.value)}
                      placeholder="Enter quantity"
                    />
                  </FormField>

                  <FormField label="Supplier">
                    <Input
                      value={formData.supplier}
                      onChange={(e) => handleChange('supplier', e.target.value)}
                      placeholder="Enter supplier"
                    />
                  </FormField>

                  <FormField label="Manufacturer">
                    <Input
                      value={formData.manufacturer}
                      onChange={(e) => handleChange('manufacturer', e.target.value)}
                      placeholder="Enter manufacturer"
                    />
                  </FormField>

                  <FormField label="Manufacturer Part No">
                    <Input
                      value={formData.manufacturerPartNo}
                      onChange={(e) => handleChange('manufacturerPartNo', e.target.value)}
                      placeholder="Enter manufacturer part number"
                    />
                  </FormField>

                  <FormField label="Model/Serial">
                    <Input
                      value={formData.modelSerial}
                      onChange={(e) => handleChange('modelSerial', e.target.value)}
                      placeholder="Enter model or serial"
                    />
                  </FormField>

                  <FormField label="Attachment">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {attachmentFile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {attachmentFile.name} ({formatFileSize(attachmentFile.size)})
                      </p>
                    )}
                  </FormField>

                  <FormField label="Additional Information">
                    <Textarea
                      value={formData.additionalInformation}
                      onChange={(e) => handleChange('additionalInformation', e.target.value)}
                      placeholder="Enter any additional information"
                      rows={3}
                    />
                  </FormField>

                  <Button type="submit" className="w-full" disabled={addOrUpdateSparePart.isPending}>
                    {addOrUpdateSparePart.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Spare Part
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <FormField label="Equipment" required>
                    <EquipmentLookup value={selectedEquipment} onChange={setSelectedEquipment} />
                  </FormField>

                  <FormField label="Spare Part" required>
                    <SparePartLookup value={selectedExistingPart} onChange={setSelectedExistingPart} />
                  </FormField>

                  <Button
                    onClick={handleLinkExisting}
                    className="w-full"
                    disabled={!selectedEquipment || !selectedExistingPart || linkExistingMutation.isPending}
                  >
                    {linkExistingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Link to Equipment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="byEquipment" className="space-y-6">
          <SparePartsByEquipmentView
            allEquipment={allEquipment}
            onShowUsedBy={handleShowUsedBy}
            onDelete={handleDeleteClick}
          />
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Spare Parts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchCriteria}
                  onChange={(e) => setSearchCriteria(e.target.value)}
                  placeholder="Search by name, description, or manufacturer part no..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="border rounded-md overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Manufacturer Part No</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((part) => (
                        <TableRow key={part.partNumber.toString()}>
                          <TableCell className="font-medium">{part.partNumber.toString()}</TableCell>
                          <TableCell>{part.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{part.description}</TableCell>
                          <TableCell>{part.manufacturerPartNo}</TableCell>
                          <TableCell>{part.quantity.toString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleShowUsedBy(part)}>
                                <Package className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(part)}>
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
        </TabsContent>
      </Tabs>

      {/* Used By Equipment Dialog */}
      <Dialog open={usedByDialogOpen} onOpenChange={setUsedByDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Equipment Using This Spare Part</DialogTitle>
            <DialogDescription>
              {selectedPart?.name} (Part #{selectedPart?.partNumber.toString()})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {equipmentUsingPart.length === 0 ? (
              <p className="text-sm text-muted-foreground">No equipment is currently using this spare part.</p>
            ) : (
              <div className="space-y-2">
                {equipmentUsingPart.map((eq) => (
                  <div key={eq.equipmentNumber.toString()} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex-1">
                      <p className="font-medium">{eq.name}</p>
                      <p className="text-sm text-muted-foreground">Tag: {eq.equipmentTagNumber}</p>
                    </div>
                    <Badge variant="secondary">EQ-{eq.equipmentNumber.toString()}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsedByDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Spare Part"
        description={`Are you sure you want to delete spare part "${partToDelete?.name}" (Part #${partToDelete?.partNumber.toString()})? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}

// Helper component for viewing spare parts by equipment
function SparePartsByEquipmentView({
  allEquipment,
  onShowUsedBy,
  onDelete,
}: {
  allEquipment: any[];
  onShowUsedBy: (part: SparePart) => void;
  onDelete: (part: SparePart) => void;
}) {
  const [selectedEq, setSelectedEq] = useState<bigint | null>(null);
  const { data: spareParts = [], isLoading } = useGetSparePartsByEquipment(selectedEq);

  return (
    <Card>
      <CardHeader>
        <CardTitle>View Spare Parts by Equipment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField label="Select Equipment">
          <EquipmentLookup value={selectedEq} onChange={setSelectedEq} />
        </FormField>

        {selectedEq && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : spareParts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No spare parts found for this equipment.
              </p>
            ) : (
              <div className="border rounded-md overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Manufacturer Part No</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spareParts.map((part) => (
                      <TableRow key={part.partNumber.toString()}>
                        <TableCell className="font-medium">{part.partNumber.toString()}</TableCell>
                        <TableCell>{part.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{part.description}</TableCell>
                        <TableCell>{part.manufacturerPartNo}</TableCell>
                        <TableCell>{part.quantity.toString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => onShowUsedBy(part)}>
                              <Package className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(part)}>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
