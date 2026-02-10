import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FormField from '@/components/forms/FormField';
import { useCreateEquipment } from '@/hooks/useQueries';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Loader2, List, Package, FileText, Wrench, FolderOpen, BarChart3, AlertCircle } from 'lucide-react';
import { normalizeError, isAuthenticationError } from '@/lib/errors';
import { DISCIPLINE_OPTIONS } from '@/lib/disciplines';
import { EngineeringDiscipline } from '@/backend';

export default function EquipmentMasterPage() {
  const navigate = useNavigate();
  const createEquipment = useCreateEquipment();
  const { identity, login } = useInternetIdentity();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    additionalInformation: '',
    discipline: EngineeringDiscipline.unknown_,
  });

  const isAuthenticated = !!identity;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDisciplineChange = (value: string) => {
    setFormData((prev) => ({ ...prev, discipline: value as EngineeringDiscipline }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication first
    if (!isAuthenticated) {
      toast.error('Please sign in to create equipment');
      return;
    }

    if (!formData.name || !formData.location || !formData.manufacturer) {
      toast.error('Please fill in all required fields');
      return;
    }

    const purchaseTime = formData.purchaseDate ? new Date(formData.purchaseDate).getTime() * 1000000 : 0;
    const warrantyTime = formData.warrantyExpiry ? new Date(formData.warrantyExpiry).getTime() * 1000000 : 0;

    createEquipment.mutate(
      {
        name: formData.name,
        location: formData.location,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial: formData.serialNumber,
        purchase: BigInt(purchaseTime),
        warranty: BigInt(warrantyTime),
        additionalInfo: formData.additionalInformation,
        discipline: formData.discipline,
      },
      {
        onSuccess: (equipmentNumber) => {
          toast.success(`Equipment created successfully! Equipment Number: ${equipmentNumber}`);
          setFormData({
            name: '',
            location: '',
            manufacturer: '',
            model: '',
            serialNumber: '',
            purchaseDate: '',
            warrantyExpiry: '',
            additionalInformation: '',
            discipline: EngineeringDiscipline.unknown_,
          });
        },
        onError: (error) => {
          const errorMessage = normalizeError(error);
          if (isAuthenticationError(error)) {
            toast.error('Authentication required. Please sign in to create equipment.');
          } else {
            toast.error(`Failed to create equipment: ${errorMessage}`);
          }
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Equipment Master</h1>
        <p className="text-muted-foreground mt-1">Create and manage equipment records</p>
      </div>

      {!isAuthenticated && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be signed in to create equipment.{' '}
            <button onClick={login} className="underline font-medium">
              Sign in now
            </button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Equipment Name" required>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={!isAuthenticated}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter equipment name"
                  />
                </FormField>

                <FormField label="Discipline">
                  <select
                    value={formData.discipline}
                    onChange={(e) => handleDisciplineChange(e.target.value)}
                    disabled={!isAuthenticated}
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
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    disabled={!isAuthenticated}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter location"
                  />
                </FormField>

                <FormField label="Manufacturer" required>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    disabled={!isAuthenticated}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter manufacturer"
                  />
                </FormField>

                <FormField label="Model">
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    disabled={!isAuthenticated}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter model"
                  />
                </FormField>

                <FormField label="Serial Number">
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => handleChange('serialNumber', e.target.value)}
                    disabled={!isAuthenticated}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter serial number"
                  />
                </FormField>

                <FormField label="Purchase Date">
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleChange('purchaseDate', e.target.value)}
                    disabled={!isAuthenticated}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </FormField>

                <FormField label="Warranty Expiry">
                  <input
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) => handleChange('warrantyExpiry', e.target.value)}
                    disabled={!isAuthenticated}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </FormField>

                <FormField label="Additional Information">
                  <textarea
                    value={formData.additionalInformation}
                    onChange={(e) => handleChange('additionalInformation', e.target.value)}
                    disabled={!isAuthenticated}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter any additional information about this equipment"
                  />
                </FormField>

                <Button type="submit" disabled={createEquipment.isPending || !isAuthenticated} className="w-full">
                  {createEquipment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Equipment
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate({ to: '/equipment-list' })}>
                <List className="mr-2 h-4 w-4" />
                View Equipment List
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate({ to: '/spare-parts' })}>
                <Package className="mr-2 h-4 w-4" />
                Manage Spare Parts
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate({ to: '/cataloguing' })}>
                <FileText className="mr-2 h-4 w-4" />
                Cataloguing
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate({ to: '/maintenance' })}>
                <Wrench className="mr-2 h-4 w-4" />
                Maintenance Records
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate({ to: '/documents' })}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Documents
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate({ to: '/reports' })}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
