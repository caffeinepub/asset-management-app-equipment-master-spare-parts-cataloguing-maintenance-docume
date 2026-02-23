import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function CataloguingPage() {
  const navigate = useNavigate();

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

      <Card>
        <CardHeader>
          <CardTitle>Feature Not Available</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The cataloguing feature requires additional backend support that is not yet implemented.
              This feature will be available in a future update.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Required backend methods:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>createCataloguingRecord - to create new cataloguing records</li>
              <li>deleteCataloguingRecord - to delete cataloguing records</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
