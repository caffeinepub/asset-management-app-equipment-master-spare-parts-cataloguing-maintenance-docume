import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useImportAttributeTemplate } from '@/hooks/useQueries';
import { fileToExternalBlob, formatFileSize } from '@/lib/files';
import { toast } from 'sonner';

export default function AttributeTemplateImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const blob = await fileToExternalBlob(selectedFile, (percentage) => {
        setUploadProgress(percentage);
      });

      const result = await importMutation.mutateAsync(blob);
      
      const attributeCount = (result as any)?.attributeCount || 0;
      toast.success(`Attribute template imported successfully! ${attributeCount} attributes loaded.`);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import attribute template');
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
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
                    {importMutation.error?.message || 'Failed to import template'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending || uploadProgress > 0}
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
