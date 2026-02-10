import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FormField from '@/components/forms/FormField';
import EquipmentLookup from '@/components/EquipmentLookup';
import {
  useCreateCataloguingRecord,
  useGetCataloguingRecordsByEquipment,
  useUpdateCataloguingRecord,
  useDeleteCataloguingRecord,
} from '@/hooks/useQueries';
import { getTemplateFields } from '@/lib/cataloguingTemplates';
import { Variant_submitted_draft } from '@/backend';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Send, Pencil, Trash2 } from 'lucide-react';
import type { CataloguingRecord } from '@/backend';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function CataloguingPage() {
  const navigate = useNavigate();
  const createRecord = useCreateCataloguingRecord();
  const updateRecord = useUpdateCataloguingRecord();
  const deleteRecord = useDeleteCataloguingRecord();

  const [selectedEquipment, setSelectedEquipment] = useState<bigint | null>(null);
  const [materialDescription, setMaterialDescription] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [additionalInformation, setAdditionalInformation] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const { data: existingRecords } = useGetCataloguingRecordsByEquipment(selectedEquipment);

  const templateFields = getTemplateFields(templateName);

  const handleAttributeChange = (key: string, value: string) => {
    setAttributeValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!selectedEquipment) {
      toast.error('Please select an equipment');
      return;
    }

    if (!materialDescription || !templateName) {
      toast.error('Please fill in material description and template name');
      return;
    }

    const attributes: [string, string][] = Object.entries(attributeValues);

    if (editMode && editingIndex !== null) {
      // Update existing record
      updateRecord.mutate(
        {
          equipmentNumber: selectedEquipment,
          recordIndex: BigInt(editingIndex),
          materialDesc: materialDescription,
          templateName,
          attributes,
          isDraft,
          additionalInfo: additionalInformation,
        },
        {
          onSuccess: (success) => {
            if (success) {
              toast.success(
                isDraft ? 'Cataloguing record updated as draft' : 'Cataloguing record updated and submitted'
              );
              resetForm();
            } else {
              toast.error('Failed to update cataloguing record');
            }
          },
          onError: () => {
            toast.error('Failed to update cataloguing record');
          },
        }
      );
    } else {
      // Create new record
      createRecord.mutate(
        {
          equipmentNumber: selectedEquipment,
          materialDesc: materialDescription,
          templateName,
          attributes,
          isDraft,
          additionalInfo: additionalInformation,
        },
        {
          onSuccess: (result) => {
            if (result) {
              toast.success(
                isDraft ? 'Cataloguing record saved as draft' : 'Cataloguing record submitted for review'
              );
              resetForm();
            } else {
              toast.error('Equipment not found');
            }
          },
          onError: () => {
            toast.error('Failed to save cataloguing record');
          },
        }
      );
    }
  };

  const resetForm = () => {
    setMaterialDescription('');
    setTemplateName('');
    setAttributeValues({});
    setAdditionalInformation('');
    setEditMode(false);
    setEditingIndex(null);
  };

  const handleEdit = (record: CataloguingRecord, index: number) => {
    setMaterialDescription(record.materialDescription);
    setTemplateName(record.templateName);
    const attrs: Record<string, string> = {};
    record.attributes.forEach(([key, value]) => {
      attrs[key] = value;
    });
    setAttributeValues(attrs);
    setAdditionalInformation(record.additionalInformation || '');
    setEditMode(true);
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    setDeletingIndex(index);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedEquipment || deletingIndex === null) return;

    deleteRecord.mutate(
      {
        equipmentNumber: selectedEquipment,
        recordIndex: BigInt(deletingIndex),
      },
      {
        onSuccess: (success) => {
          if (success) {
            toast.success('Cataloguing record deleted successfully');
            setDeleteDialogOpen(false);
            setDeletingIndex(null);
          } else {
            toast.error('Failed to delete cataloguing record');
          }
        },
        onError: () => {
          toast.error('Failed to delete cataloguing record');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cataloguing</h1>
          <p className="text-muted-foreground mt-1">Attribute-based cataloguing using templates</p>
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
              <CardTitle>{editMode ? 'Edit Cataloguing Record' : 'Create Cataloguing Record'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Equipment Number" required>
                <EquipmentLookup value={selectedEquipment} onChange={setSelectedEquipment} />
              </FormField>

              <FormField label="Material Description" required>
                <textarea
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter material description"
                />
              </FormField>

              <FormField label="Attribute Template Name" required>
                <select
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value);
                    if (!editMode) {
                      setAttributeValues({});
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a template</option>
                  <option value="mechanical">Mechanical Equipment</option>
                  <option value="electrical">Electrical Equipment</option>
                  <option value="instrumentation">Instrumentation</option>
                  <option value="piping">Piping & Valves</option>
                </select>
              </FormField>

              {templateFields.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Attribute Values</h3>
                  {templateFields.map((field) => (
                    <FormField key={field.key} label={field.label}>
                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={attributeValues[field.key] || ''}
                          onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      )}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={attributeValues[field.key] || ''}
                          onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      )}
                      {field.type === 'select' && field.options && (
                        <select
                          value={attributeValues[field.key] || ''}
                          onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select {field.label.toLowerCase()}</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </FormField>
                  ))}
                </div>
              )}

              <FormField label="Additional Information">
                <textarea
                  value={additionalInformation}
                  onChange={(e) => setAdditionalInformation(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter any additional information about this cataloguing record"
                />
              </FormField>

              <div className="flex gap-3 pt-4">
                {editMode && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel Edit
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={createRecord.isPending || updateRecord.isPending}
                  className="flex-1"
                >
                  {(createRecord.isPending || updateRecord.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  {editMode ? 'Update as Draft' : 'Save as Draft'}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={createRecord.isPending || updateRecord.isPending}
                  className="flex-1"
                >
                  {(createRecord.isPending || updateRecord.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Send className="mr-2 h-4 w-4" />
                  {editMode ? 'Update & Submit' : 'Submit for Review'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Existing Records</CardTitle>
            </CardHeader>
            <CardContent>
              {existingRecords && existingRecords.length > 0 ? (
                <div className="space-y-3">
                  {existingRecords.map((record, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{record.materialDescription}</p>
                          <p className="text-xs text-muted-foreground mt-1">Template: {record.templateName}</p>
                        </div>
                        <Badge variant={record.status === Variant_submitted_draft.submitted ? 'default' : 'secondary'}>
                          {record.status === Variant_submitted_draft.submitted ? 'Submitted' : 'Draft'}
                        </Badge>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(record, index)} className="flex-1">
                          <Pencil className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(index)}
                          className="flex-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No cataloguing records yet. Create one to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Cataloguing Record"
        description="Are you sure you want to delete this cataloguing record? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
