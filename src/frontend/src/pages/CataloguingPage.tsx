import { useState } from 'react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useIsCallerAdmin } from '@/hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import AttributeTemplateImport from '@/components/AttributeTemplateImport';
import SparePartMasterForm from '@/components/SparePartMasterForm';
import SparePartAdvancedSearch from '@/components/SparePartAdvancedSearch';

export default function CataloguingPage() {
  const { identity } = useInternetIdentity();
  
  /**
   * ADMIN ROLE CHECKING MECHANISM:
   * 
   * The useIsCallerAdmin hook retrieves the current user's admin status from the backend
   * by calling actor.isCallerAdmin(). This backend method checks if the authenticated user's
   * principal matches the admin principal or has been assigned the admin role through the
   * authorization component.
   * 
   * The hook returns a React Query object with:
   * - data: boolean indicating if the user is an admin
   * - isLoading: true while the backend call is in progress
   * 
   * This admin status is used to control access to the attribute template import feature,
   * which is restricted to administrators only.
   */
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  
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
          noun-modifier classification, and advanced search. Upload an attribute template in the Import Templates tab to define the dynamic attributes.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import Templates</TabsTrigger>
          <TabsTrigger value="master">Spare Part Master</TabsTrigger>
          <TabsTrigger value="search">Advanced Search</TabsTrigger>
        </TabsList>

        {/**
         * CONDITIONAL RENDERING BASED ON ADMIN ROLE:
         * 
         * The "Import Templates" tab content is conditionally rendered based on the user's admin status:
         * 
         * 1. While loading (isAdminLoading === true):
         *    - Shows a "Loading permissions..." message to prevent UI flashing
         * 
         * 2. If user is admin (isAdmin === true):
         *    - Renders the AttributeTemplateImport component, allowing Excel file upload
         *    - This component calls the backend's importAttributeTemplateFromExcel method
         * 
         * 3. If user is NOT admin (isAdmin === false):
         *    - Shows an access-denied alert with a clear message
         *    - Prevents non-admin users from accessing the import functionality
         * 
         * This pattern ensures that only administrators can import attribute templates,
         * which define the dynamic fields shown in the Spare Part Master form. The backend
         * enforces this restriction by checking permissions in the importAttributeTemplateFromExcel
         * method, which calls AccessControl.hasPermission(accessControlState, caller, #admin).
         */}
        <TabsContent value="import" className="mt-6">
          {isAdminLoading ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Loading permissions...
              </AlertDescription>
            </Alert>
          ) : isAdmin ? (
            <AttributeTemplateImport />
          ) : (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                <strong>Admin Access Required:</strong> Only administrators can import attribute templates from Excel. 
                Please contact your system administrator if you need to upload templates.
              </AlertDescription>
            </Alert>
          )}
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
