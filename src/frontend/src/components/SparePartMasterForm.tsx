import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, Plus, Edit } from 'lucide-react';
import FormField from '@/components/forms/FormField';
import SparePartNumberLookup from '@/components/SparePartNumberLookup';
import SparePartEquipmentLinks from '@/components/SparePartEquipmentLinks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetNouns,
  useGetModifiers,
  useGetAttributesForNounModifier,
  useGetNextSparePartNumber,
  useGetSparePartByNumber,
  useCreateSparePartWithAttributes,
  useUpdateSparePartAttributes,
} from '@/hooks/useQueries';
import { generateSparePartDescription } from '@/lib/descriptionGenerator';
import { validateAttributes } from '@/lib/validation';
import { toast } from 'sonner';

export default function SparePartMasterForm() {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedPartNumber, setSelectedPartNumber] = useState<bigint | null>(null);
  const [noun, setNoun] = useState('');
  const [modifier, setModifier] = useState('');
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [autoDescription, setAutoDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const nounsQuery = useGetNouns();
  const modifiersQuery = useGetModifiers(noun);
  const attributesQuery = useGetAttributesForNounModifier(noun, modifier);
  const nextNumberQuery = useGetNextSparePartNumber();
  const sparePartQuery = useGetSparePartByNumber(selectedPartNumber);
  const createMutation = useCreateSparePartWithAttributes();
  const updateMutation = useUpdateSparePartAttributes();

  // Update auto-description when attributes change
  useEffect(() => {
    if (noun && modifier) {
      const description = generateSparePartDescription(noun, modifier, attributes);
      setAutoDescription(description);
    }
  }, [noun, modifier, attributes]);

  // Load spare part data when editing
  useEffect(() => {
    if (sparePartQuery.data) {
      setNoun(sparePartQuery.data.noun || '');
      setModifier(sparePartQuery.data.modifier || '');
      setAttributes(sparePartQuery.data.attributes || {});
      setMode('edit');
    }
  }, [sparePartQuery.data]);

  // Clear validation errors when attributes change
  useEffect(() => {
    if (attributesQuery.data) {
      const validation = validateAttributes(attributes, attributesQuery.data);
      setValidationErrors(validation.errors);
    }
  }, [attributes, attributesQuery.data]);

  const handleSparePartSelect = (partNumber: bigint | null) => {
    setSelectedPartNumber(partNumber);
    if (!partNumber) {
      // Reset form for new spare part
      setMode('create');
      setNoun('');
      setModifier('');
      setAttributes({});
      setAutoDescription('');
      setValidationErrors({});
    }
  };

  const handleAttributeChange = (attrName: string, value: string) => {
    setAttributes((prev) => ({
      ...prev,
      [attrName]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!noun || !modifier) {
      toast.error('Please select both noun and modifier');
      return;
    }

    // Validate attributes
    if (attributesQuery.data) {
      const validation = validateAttributes(attributes, attributesQuery.data);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        toast.error('Please fix validation errors before submitting');
        return;
      }
    }

    try {
      if (mode === 'create') {
        const partNumber = await createMutation.mutateAsync({
          noun,
          modifier,
          attributes: Object.entries(attributes),
        });
        toast.success(`Spare part created successfully (Part #${partNumber})`);
        setSelectedPartNumber(partNumber);
        setMode('edit');
      } else if (selectedPartNumber) {
        await updateMutation.mutateAsync({
          partNumber: selectedPartNumber,
          noun,
          modifier,
          attributes: Object.entries(attributes),
        });
        toast.success('Spare part updated successfully');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to save spare part');
    }
  };

  const handleReset = () => {
    setMode('create');
    setSelectedPartNumber(null);
    setNoun('');
    setModifier('');
    setAttributes({});
    setAutoDescription('');
    setValidationErrors({});
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Backend methods required:</strong> getNouns(), getModifiers(noun), getAttributesForNounModifier(noun, modifier),
          createSparePartWithAttributes(), updateSparePartWithAttributes()
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Spare Part Master Form</CardTitle>
              <CardDescription>
                {mode === 'create' ? 'Create a new spare part with noun-modifier classification' : 'Edit existing spare part'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={mode === 'create' ? 'default' : 'secondary'}>
                {mode === 'create' ? <Plus className="h-3 w-3 mr-1" /> : <Edit className="h-3 w-3 mr-1" />}
                {mode === 'create' ? 'Create Mode' : 'Edit Mode'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Select Spare Part (for editing)" help="Leave empty to create new">
              <SparePartNumberLookup value={selectedPartNumber} onChange={handleSparePartSelect} />
            </FormField>

            <FormField label="Part Number" help="Auto-generated">
              <Input
                value={selectedPartNumber?.toString() || nextNumberQuery.data?.toString() || '...'}
                disabled
                className="bg-muted"
              />
            </FormField>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Noun" required>
                <Select value={noun} onValueChange={setNoun} disabled={nounsQuery.data?.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select noun" />
                  </SelectTrigger>
                  <SelectContent>
                    {nounsQuery.data && nounsQuery.data.length > 0 ? (
                      nounsQuery.data.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__placeholder__" disabled>
                        No nouns available - upload attribute template first
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Modifier" required>
                <Select value={modifier} onValueChange={setModifier} disabled={!noun || modifiersQuery.data?.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select modifier" />
                  </SelectTrigger>
                  <SelectContent>
                    {modifiersQuery.data && modifiersQuery.data.length > 0 ? (
                      modifiersQuery.data.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__placeholder__" disabled>
                        {!noun ? 'Select a noun first' : 'No modifiers available'}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {noun && modifier && attributesQuery.data && attributesQuery.data.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Dynamic Attributes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attributesQuery.data.map((attr) => (
                    <FormField
                      key={attr.fieldName}
                      label={attr.fieldName}
                      required={attr.required}
                      help={attr.validationRules || undefined}
                      error={validationErrors[attr.fieldName]}
                    >
                      {attr.dataType === 'dropdown' ? (
                        <Select
                          value={attributes[attr.fieldName] || ''}
                          onValueChange={(value) => handleAttributeChange(attr.fieldName, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${attr.fieldName}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="option1">Option 1</SelectItem>
                            <SelectItem value="option2">Option 2</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : attr.dataType === 'bool' ? (
                        <Select
                          value={attributes[attr.fieldName] || ''}
                          onValueChange={(value) => handleAttributeChange(attr.fieldName, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={attr.dataType === 'int' || attr.dataType === 'float' ? 'number' : 'text'}
                          step={attr.dataType === 'float' ? '0.01' : undefined}
                          value={attributes[attr.fieldName] || ''}
                          onChange={(e) => handleAttributeChange(attr.fieldName, e.target.value)}
                          placeholder={`Enter ${attr.fieldName}`}
                        />
                      )}
                    </FormField>
                  ))}
                </div>
              </div>
            )}

            <FormField label="Auto-Generated Description" help="Generated from noun, modifier, and key attributes">
              <Textarea value={autoDescription} disabled className="bg-muted" rows={3} />
            </FormField>

            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || !noun || !modifier}>
                <Save className="h-4 w-4 mr-2" />
                {mode === 'create' ? 'Create Spare Part' : 'Update Spare Part'}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {selectedPartNumber && mode === 'edit' && (
        <SparePartEquipmentLinks partNumber={selectedPartNumber} />
      )}
    </div>
  );
}
