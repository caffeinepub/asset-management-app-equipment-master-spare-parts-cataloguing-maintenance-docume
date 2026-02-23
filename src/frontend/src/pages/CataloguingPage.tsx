import { useState } from 'react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import AttributeTemplateImport from '@/components/AttributeTemplateImport';
import SparePartMasterForm from '@/components/SparePartMasterForm';
import SparePartAdvancedSearch from '@/components/SparePartAdvancedSearch';

export default function CataloguingPage() {
  const { identity } = useInternetIdentity();
  const [activeTab, setActiveTab] = useState('import');

  if (!identity) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cataloguing Module</h1>
          <p className="text-muted-foreground mt-1">Spare Part Master with Noun-Modifier Classification</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the cataloguing module.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cataloguing Module</h1>
        <p className="text-muted-foreground mt-1">Spare Part Master with Noun-Modifier Classification</p>
      </div>

      <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>Backend Update Required:</strong> The cataloguing module requires additional backend methods for attribute management, 
          noun-modifier classification, and advanced search. The UI is ready but backend implementation is pending.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import Templates</TabsTrigger>
          <TabsTrigger value="master">Spare Part Master</TabsTrigger>
          <TabsTrigger value="search">Advanced Search</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6">
          <AttributeTemplateImport />
        </TabsContent>

        <TabsContent value="master" className="mt-6">
          <SparePartMasterForm />
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <SparePartAdvancedSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}
