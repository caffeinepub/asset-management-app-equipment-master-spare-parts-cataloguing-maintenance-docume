import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import GlobalSearch from '@/components/GlobalSearch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function GlobalSearchPage() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Global Search</h2>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Global Search</h2>
          <p className="text-muted-foreground mt-2">
            Search across all equipment and spare parts with advanced filters
          </p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the global search functionality.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Global Search</h2>
        <p className="text-muted-foreground mt-2">
          Search across all equipment and spare parts with advanced filters
        </p>
      </div>
      <GlobalSearch />
    </div>
  );
}
