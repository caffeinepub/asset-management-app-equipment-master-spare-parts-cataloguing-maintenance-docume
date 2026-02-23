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
import { toast } from 'sonner';

export default function SparePartMasterForm() {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedPartNumber, setSelectedPartNumber] = useState<bigint | null>(null);
  const [noun, setNoun] = useState('');
  const [modifier, setModifier] = useState('');
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [autoDescription, setAutoDescription] = useState('');

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
      setNoun(sparePartQuery.data.noun);
      setModifier(sparePartQuery.data.modifier);
      setAttributes(sparePartQuery.data.attributes);
      setMode('edit');
    }
  }, [sparePartQuery.data]);

  const handleSparePartSelect = (partNumber: bigint | null) => {
    setSelectedPartNumber(partNumber);
    if (!partNumber) {
      // Reset form for new spare part
      setMode('create');
      setNoun('');
      setModifier('');
      setAttributes({});
      setAutoDescription('');
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
          attributes: Object.entries(attributes),
        });
        toast.success('Spare part updated successfully');
      }
    } catch (error: any) {
      console.error('Save error:', error);
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
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Spare Part Master</CardTitle>
              <CardDescription>Create or edit spare parts using noun-modifier classification</CardDescription>
            </div>
            {mode === 'edit' ? (
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                <Edit className="h-3 w-3 mr-1" />
                Editing Existing
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                <Plus className="h-3 w-3 mr-1" />
                Creating New
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Backend methods required:</strong> getNouns, getModifiersForNoun, getAttributesForNounModifier,
              getNextSparePartNumber, createSparePartWithAttributes, updateSparePartAttributes, getSparePartByNumber
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Spare Part Number Lookup */}
            <FormField label="Spare Part Number" help="Search for existing spare part or leave empty to create new">
              <SparePartNumberLookup
                value={selectedPartNumber}
                onChange={handleSparePartSelect}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </FormField>

            {/* Auto-generated Part Number Display */}
            {mode === 'create' && (
              <FormField label="Auto-Generated Part Number">
                <div className="flex items-center gap-2">
                  <Input
                    value={nextNumberQuery.data?.toString() || 'Loading...'}
                    disabled
                    className="bg-muted"
                  />
                  <Badge variant="secondary" className="text-xs">System Generated</Badge>
                </div>
              </FormField>
            )}

            {mode === 'edit' && selectedPartNumber && (
              <FormField label="Part Number">
                <div className="flex items-center gap-2">
                  <Input value={selectedPartNumber.toString()} disabled className="bg-muted" />
                  <Badge variant="secondary" className="text-xs">Existing</Badge>
                </div>
              </FormField>
            )}

            {/* Noun Selection */}
            <FormField label="Noun" required>
              <Select value={noun} onValueChange={setNoun} disabled={mode === 'edit'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select noun" />
                </SelectTrigger>
                <SelectContent>
                  {nounsQuery.data?.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Modifier Selection */}
            {noun && (
              <FormField label="Modifier" required>
                <Select value={modifier} onValueChange={setModifier} disabled={mode === 'edit'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select modifier" />
                  </SelectTrigger>
                  <SelectContent>
                    {modifiersQuery.data?.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}

            {/* Dynamic Attributes */}
            {noun && modifier && attributesQuery.data && attributesQuery.data.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold">Attributes</h3>
                {attributesQuery.data.map((attr) => (
                  <FormField
                    key={attr.name}
                    label={attr.name}
                    required={attr.required}
                    help={attr.validationRules || undefined}
                  >
                    {attr.attributeType === 'textarea' ? (
                      <Textarea
                        value={attributes[attr.name] || ''}
                        onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                        placeholder={`Enter ${attr.name.toLowerCase()}`}
                      />
                    ) : attr.attributeType === 'number' ? (
                      <Input
                        type="number"
                        value={attributes[attr.name] || ''}
                        onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                        placeholder={`Enter ${attr.name.toLowerCase()}`}
                      />
                    ) : (
                      <Input
                        type="text"
                        value={attributes[attr.name] || ''}
                        onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                        placeholder={`Enter ${attr.name.toLowerCase()}`}
                      />
                    )}
                  </FormField>
                ))}
              </div>
            )}

            {/* Auto-generated Description */}
            {autoDescription && (
              <FormField label="Short Description">
                <div className="flex items-center gap-2">
                  <Textarea value={autoDescription} disabled className="bg-muted" rows={2} />
                  <Badge variant="secondary" className="text-xs">Auto-generated</Badge>
                </div>
              </FormField>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!noun || !modifier || createMutation.isPending || updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {mode === 'create' ? 'Create Spare Part' : 'Update Attributes'}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Equipment Links Section */}
      {mode === 'edit' && selectedPartNumber && (
        <SparePartEquipmentLinks partNumber={selectedPartNumber} />
      )}
    </div>
  );
}
