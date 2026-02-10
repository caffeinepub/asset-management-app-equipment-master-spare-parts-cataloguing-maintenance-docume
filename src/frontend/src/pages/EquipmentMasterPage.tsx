import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FormField from '@/components/forms/FormField';
import { useCreateEquipment } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Loader2, List, Package, FileText, Wrench, FolderOpen, BarChart3 } from 'lucide-react';

export default function EquipmentMasterPage() {
  const navigate = useNavigate();
  const createEquipment = useCreateEquipment();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        onError: () => {
          toast.error('Failed to create equipment');
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter equipment name"
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Model Number">
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => handleChange('model', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter model number"
                    />
                  </FormField>

                  <FormField label="Serial Number">
                    <input
                      type="text"
                      value={formData.serialNumber}
                      onChange={(e) => handleChange('serialNumber', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter serial number"
                    />
                  </FormField>
                </div>

                <FormField label="Manufacturer" required>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter manufacturer"
                  />
                </FormField>

                <FormField label="Location" required>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter location"
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Purchase Date">
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => handleChange('purchaseDate', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormField>

                  <FormField label="Warranty Expiry">
                    <input
                      type="date"
                      value={formData.warrantyExpiry}
                      onChange={(e) => handleChange('warrantyExpiry', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormField>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={createEquipment.isPending}>
                    {createEquipment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Equipment
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate({ to: '/equipment-list' })}>
                    <List className="mr-2 h-4 w-4" />
                    View Equipment List
                  </Button>
                </div>
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
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate({ to: '/spare-parts' })}
              >
                <Package className="mr-2 h-4 w-4" />
                Spare Parts
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate({ to: '/cataloguing' })}
              >
                <FileText className="mr-2 h-4 w-4" />
                Cataloguing
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate({ to: '/maintenance' })}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Maintenance
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate({ to: '/documents' })}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Documents
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate({ to: '/reports' })}
              >
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
