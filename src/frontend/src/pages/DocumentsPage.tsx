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
  useUploadDocument,
  useGetDocumentsByEquipment,
  useUpdateDocumentMetadata,
  useDeleteDocument,
} from '@/hooks/useQueries';
import { ExternalBlob } from '@/backend';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Download, Upload, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import type { Document } from '@/backend';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const uploadDocument = useUploadDocument();
  const updateDocumentMetadata = useUpdateDocumentMetadata();
  const deleteDocument = useDeleteDocument();

  const [selectedEquipment, setSelectedEquipment] = useState<bigint | null>(null);
  const [viewEquipment, setViewEquipment] = useState<bigint | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [additionalInformation, setAdditionalInformation] = useState('');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [editDocType, setEditDocType] = useState('');
  const [editAdditionalInformation, setEditAdditionalInformation] = useState('');

  const { data: documents, isLoading } = useGetDocumentsByEquipment(viewEquipment);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEquipment) {
      toast.error('Please select an equipment');
      return;
    }

    if (!documentType || !selectedFile) {
      toast.error('Please select document type and file');
      return;
    }

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      uploadDocument.mutate(
        {
          equipmentNumber: selectedEquipment,
          docType: documentType,
          file: blob,
          additionalInfo: additionalInformation,
        },
        {
          onSuccess: (docId) => {
            if (docId) {
              toast.success(`Document uploaded successfully! Document ID: ${docId}`);
              setDocumentType('');
              setSelectedFile(null);
              setUploadProgress(0);
              setAdditionalInformation('');
              const fileInput = document.getElementById('file-input') as HTMLInputElement;
              if (fileInput) fileInput.value = '';
            } else {
              toast.error('Equipment not found');
            }
          },
          onError: () => {
            toast.error('Failed to upload document');
            setUploadProgress(0);
          },
        }
      );
    } catch (error) {
      toast.error('Failed to read file');
    }
  };

  const handleEdit = (doc: Document) => {
    setSelectedDoc(doc);
    setEditDocType(doc.documentType);
    setEditAdditionalInformation(doc.additionalInformation || '');
    setEditDialogOpen(true);
  };

  const handleDelete = (doc: Document) => {
    setSelectedDoc(doc);
    setDeleteDialogOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoc || !viewEquipment) return;

    updateDocumentMetadata.mutate(
      {
        equipmentNumber: viewEquipment,
        docId: selectedDoc.docId,
        newDocType: editDocType,
        additionalInfo: editAdditionalInformation,
      },
      {
        onSuccess: (success) => {
          if (success) {
            toast.success('Document metadata updated successfully');
            setEditDialogOpen(false);
            setSelectedDoc(null);
          } else {
            toast.error('Failed to update document metadata');
          }
        },
        onError: () => {
          toast.error('Failed to update document metadata');
        },
      }
    );
  };

  const confirmDelete = () => {
    if (!selectedDoc || !viewEquipment) return;

    deleteDocument.mutate(
      {
        equipmentNumber: viewEquipment,
        docId: selectedDoc.docId,
      },
      {
        onSuccess: (success) => {
          if (success) {
            toast.success('Document deleted successfully');
            setDeleteDialogOpen(false);
            setSelectedDoc(null);
          } else {
            toast.error('Failed to delete document');
          }
        },
        onError: () => {
          toast.error('Failed to delete document');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">Centralized storage of technical documents</p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Equipment Master
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Equipment Number" required>
                <EquipmentLookup value={selectedEquipment} onChange={setSelectedEquipment} />
              </FormField>

              <FormField label="Document Type" required>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select document type</option>
                  <option value="Datasheet">Datasheet</option>
                  <option value="Drawing">Drawing</option>
                  <option value="Manual">Manual</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Inspection Report">Inspection Report</option>
                  <option value="Photo">Photo</option>
                </select>
              </FormField>

              <FormField label="File Upload" required>
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </FormField>

              <FormField label="Additional Information">
                <textarea
                  value={additionalInformation}
                  onChange={(e) => setAdditionalInformation(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter any additional information about this document"
                />
              </FormField>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={uploadDocument.isPending} className="w-full">
                {uploadDocument.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload Document
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Documents by Equipment</CardTitle>
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
                ) : documents && documents.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Upload Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow key={doc.docId.toString()}>
                            <TableCell className="font-medium">{doc.documentType}</TableCell>
                            <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const url = doc.filePath.getDirectURL();
                                    window.open(url, '_blank');
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(doc)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(doc)}>
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
                    No documents found for this equipment.
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
            <DialogTitle>Edit Document Metadata</DialogTitle>
            <DialogDescription>Update the document type and additional information below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <FormField label="Document Type" required>
              <select
                value={editDocType}
                onChange={(e) => setEditDocType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select document type</option>
                <option value="Datasheet">Datasheet</option>
                <option value="Drawing">Drawing</option>
                <option value="Manual">Manual</option>
                <option value="Certificate">Certificate</option>
                <option value="Inspection Report">Inspection Report</option>
                <option value="Photo">Photo</option>
              </select>
            </FormField>

            <FormField label="Additional Information">
              <textarea
                value={editAdditionalInformation}
                onChange={(e) => setEditAdditionalInformation(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter any additional information about this document"
              />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateDocumentMetadata.isPending}>
                {updateDocumentMetadata.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
        title="Delete Document"
        description={`Are you sure you want to delete this ${selectedDoc?.documentType} document? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
