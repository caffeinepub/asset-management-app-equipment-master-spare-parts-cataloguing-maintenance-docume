import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useImportAttributeTemplate } from '@/hooks/useQueries';
import { fileToExternalBlob, formatFileSize } from '@/lib/files';
import { toast } from 'sonner';
import { safeExtractErrorMessage } from '@/lib/errors';

/**
 * ADMIN-ONLY ATTRIBUTE TEMPLATE IMPORT COMPONENT:
 * 
 * This component is only rendered when the user has admin role, as determined by the parent
 * CataloguingPage's role checking logic using the useIsCallerAdmin hook.
 * 
 * The component provides an interface for uploading Excel files containing attribute definitions
 * for noun-modifier combinations. When the user uploads a file and clicks "Import Template",
 * the component:
 * 
 * 1. Converts the browser File object to an ExternalBlob (with upload progress tracking)
 * 2. Calls the backend's importAttributeTemplateFromExcel method via the useImportAttributeTemplate hook
 * 3. The backend method is protected by admin-only access control:
 *    - Checks: AccessControl.hasPermission(accessControlState, caller, #admin)
 *    - Traps with "Unauthorized: Only admins can import attribute templates from Excel" if not admin
 * 
 * This ensures that only administrators can define the dynamic attribute fields that appear
 * in the Spare Part Master form. The backend stores these templates and uses them to validate
 * and structure spare part data with custom attributes.
 * 
 * Security Note:
 * The admin-only restriction is enforced at both the UI level (conditional rendering in parent)
 * and the backend level (permission check in the canister method), providing defense in depth.
 */
export default function AttributeTemplateImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const importMutation = useImportAttributeTemplate();

  const handleFileSelect = (file: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet',
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|ods)$/i)) {
      toast.error('Invalid file type. Please upload an Excel file (.xls, .xlsx, .ods)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10 MB limit');
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
    
    // Auto-populate template name from filename if empty
    if (!templateName) {
      const nameWithoutExt = file.name.replace(/\.(xlsx?|ods)$/i, '');
      setTemplateName(nameWithoutExt);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [templateName]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      const blob = await fileToExternalBlob(selectedFile, (percentage) => {
        setUploadProgress(percentage);
      });

      const result = await importMutation.mutateAsync({ 
        blob, 
        templateName: templateName.trim() 
      });
      
      toast.success(`Attribute template "${templateName}" imported successfully!`);
      
      // Reset form
      setSelectedFile(null);
      setTemplateName('');
      setUploadProgress(0);
    } catch (error: unknown) {
      console.error('Import error:', error);
      const errorMessage = safeExtractErrorMessage(error);
      toast.error(errorMessage || 'Failed to import attribute template');
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setTemplateName('');
    setUploadProgress(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Attribute Template</CardTitle>
        <CardDescription>
          Upload an Excel file containing attribute definitions for noun-modifier combinations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Expected Excel format:</strong> Columns for Noun, Modifier, Attribute Name, Attribute Type, Validation Rules, Required.
            The uploaded file will define the dynamic attributes shown in the Spare Part Master form.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="templateName">Template Name</Label>
          <Input
            id="templateName"
            type="text"
            placeholder="e.g., Mechanical Parts Template"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            disabled={importMutation.isPending}
          />
          <p className="text-xs text-muted-foreground">
            Give this template a descriptive name for easy identification
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          {!selectedFile ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Drag and drop your Excel file here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              </div>
              <input
                type="file"
                accept=".xls,.xlsx,.ods"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
                id="file-upload"
              />
              <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-xs text-muted-foreground">Uploading: {uploadProgress}%</p>
                </div>
              )}

              {importMutation.isSuccess && (
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Template imported successfully! The Spare Part Master form will now use the uploaded attributes.
                  </AlertDescription>
                </Alert>
              )}

              {importMutation.isError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {safeExtractErrorMessage(importMutation.error) || 'Failed to import template'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending || uploadProgress > 0 || !templateName.trim()}
                >
                  {importMutation.isPending ? 'Importing...' : 'Import Template'}
                </Button>
                <Button variant="outline" onClick={handleClear} disabled={importMutation.isPending}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Supported formats:</strong> .xls, .xlsx, .ods</p>
          <p><strong>Maximum file size:</strong> 10 MB</p>
          <p><strong>Note:</strong> After importing, switch to the Spare Part Master tab to see the dynamic attributes.</p>
        </div>
      </CardContent>
    </Card>
  );
}
