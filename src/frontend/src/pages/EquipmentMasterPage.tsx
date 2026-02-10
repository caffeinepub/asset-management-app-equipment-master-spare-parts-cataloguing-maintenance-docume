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
  });

  const isAuthenticated = !!identity;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    const purchaseTime = formData.purchaseDate ? new Date(formData.purchaseDate).getTime() * 1000000 : BigInt(0);
    const warrantyTime = formData.warrantyExpiry ? new Date(formData.warrantyExpiry).getTime() * 1000000 : BigInt(0);

    createEquipment.mutate(
      {
        name: formData.name,
        location: formData.location,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial: formData.serialNumber,
        purchase: BigInt(purchaseTime),
        warranty: BigInt(warrantyTime),
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
          });
        },
        onError: (error) => {
          const errorMessage = normalizeError(error);
          
          if (isAuthenticationError(error)) {
            toast.error(errorMessage, {
              description: 'Please sign in to continue',
              action: {
                label: 'Sign In',
                onClick: () => login(),
              },
            });
          } else {
            toast.error('Failed to create equipment', {
              description: errorMessage,
            });
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
            You must be signed in to create equipment records.{' '}
            <button
              onClick={() => login()}
              className="font-medium underline underline-offset-4 hover:text-primary"
            >
              Sign in now
            </button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Equipment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Equipment Name" required>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter equipment name"
                disabled={!isAuthenticated}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Model">
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter model"
                  disabled={!isAuthenticated}
                />
              </FormField>

              <FormField label="Serial Number">
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter serial number"
                  disabled={!isAuthenticated}
                />
              </FormField>
            </div>

            <FormField label="Manufacturer" required>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter manufacturer"
                disabled={!isAuthenticated}
              />
            </FormField>

            <FormField label="Location" required>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter location"
                disabled={!isAuthenticated}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Purchase Date">
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange('purchaseDate', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!isAuthenticated}
                />
              </FormField>

              <FormField label="Warranty Expiry">
                <input
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={(e) => handleChange('warrantyExpiry', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!isAuthenticated}
                />
              </FormField>
            </div>

            <Button type="submit" disabled={createEquipment.isPending || !isAuthenticated} className="w-full">
              {createEquipment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isAuthenticated ? 'Sign In to Save Equipment' : 'Save Equipment'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" onClick={() => navigate({ to: '/equipment-list' })} className="justify-start">
              <List className="mr-2 h-4 w-4" />
              Equipment List
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: '/spare-parts' })} className="justify-start">
              <Package className="mr-2 h-4 w-4" />
              Spare Parts
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: '/cataloguing' })} className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Cataloguing
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: '/maintenance' })} className="justify-start">
              <Wrench className="mr-2 h-4 w-4" />
              Maintenance
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: '/documents' })} className="justify-start">
              <FolderOpen className="mr-2 h-4 w-4" />
              Documents
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: '/reports' })} className="justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
