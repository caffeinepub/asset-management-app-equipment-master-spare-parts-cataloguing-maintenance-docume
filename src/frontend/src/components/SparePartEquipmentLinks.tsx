import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import EquipmentLookup from '@/components/EquipmentLookup';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  useGetEquipmentForSparePart,
  useLinkSparePartToEquipment,
  useUnlinkSparePartFromEquipment,
} from '@/hooks/useQueries';
import { toast } from 'sonner';

interface SparePartEquipmentLinksProps {
  partNumber: bigint;
}

export default function SparePartEquipmentLinks({ partNumber }: SparePartEquipmentLinksProps) {
  const [selectedEquipmentNumber, setSelectedEquipmentNumber] = useState<bigint | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<bigint | null>(null);

  const equipmentQuery = useGetEquipmentForSparePart(partNumber);
  const linkMutation = useLinkSparePartToEquipment();
  const unlinkMutation = useUnlinkSparePartFromEquipment();

  const handleAddLink = async () => {
    if (!selectedEquipmentNumber) {
      toast.error('Please select equipment');
      return;
    }

    try {
      await linkMutation.mutateAsync({
        partNumber,
        equipmentNumber: selectedEquipmentNumber,
      });
      toast.success('Equipment linked successfully');
      setShowAddForm(false);
      setSelectedEquipmentNumber(null);
    } catch (error: any) {
      console.error('Link error:', error);
      toast.error(error.message || 'Failed to link equipment');
    }
  };

  const handleUnlink = async () => {
    if (!unlinkTarget) return;

    try {
      await unlinkMutation.mutateAsync({
        partNumber,
        equipmentNumber: unlinkTarget,
      });
      toast.success('Equipment unlinked successfully');
      setUnlinkTarget(null);
    } catch (error: any) {
      console.error('Unlink error:', error);
      toast.error(error.message || 'Failed to unlink equipment');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Equipment Links</CardTitle>
              <CardDescription>Equipment using this spare part</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Backend methods required:</strong> getEquipmentForSparePart, linkSparePartToEquipment,
              unlinkSparePartFromEquipment
            </AlertDescription>
          </Alert>

          {showAddForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h4 className="text-sm font-semibold">Add Equipment Link</h4>
              <EquipmentLookup
                value={selectedEquipmentNumber}
                onChange={setSelectedEquipmentNumber}
              />
              <div className="flex gap-2">
                <Button onClick={handleAddLink} disabled={!selectedEquipmentNumber || linkMutation.isPending}>
                  {linkMutation.isPending ? 'Linking...' : 'Link Equipment'}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {equipmentQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading equipment...</p>
          ) : equipmentQuery.data && equipmentQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment No</TableHead>
                  <TableHead>Tag Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipmentQuery.data.map((equipment) => (
                  <TableRow key={equipment.equipmentNumber.toString()}>
                    <TableCell>
                      <Badge variant="outline">{equipment.equipmentNumber.toString()}</Badge>
                    </TableCell>
                    <TableCell>{equipment.equipmentTagNumber}</TableCell>
                    <TableCell>{equipment.name}</TableCell>
                    <TableCell>{equipment.location}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUnlinkTarget(equipment.equipmentNumber)}
                        disabled={unlinkMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No equipment linked to this spare part</p>
              <p className="text-xs mt-1">Click "Add Equipment" to create a link</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={unlinkTarget !== null}
        onOpenChange={(open) => !open && setUnlinkTarget(null)}
        title="Unlink Equipment"
        description="Are you sure you want to remove this equipment link? The spare part will remain in the system."
        onConfirm={handleUnlink}
        confirmText="Unlink"
        isDestructive
      />
    </>
  );
}
