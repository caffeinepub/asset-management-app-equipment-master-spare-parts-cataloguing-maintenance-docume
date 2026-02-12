import { useState, useMemo } from 'react';
import { useGetAllEquipment } from '@/hooks/useQueries';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EquipmentLookupProps {
  value: bigint | null;
  onChange: (value: bigint | null) => void;
}

export default function EquipmentLookup({ value, onChange }: EquipmentLookupProps) {
  const { data: equipment, isLoading } = useGetAllEquipment();
  const [filterText, setFilterText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter equipment based on filter text
  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];
    if (!filterText.trim()) return equipment;

    const query = filterText.toLowerCase();
    return equipment.filter((eq) => {
      return (
        eq.equipmentNumber.toString().includes(query) ||
        (eq.equipmentTagNumber && eq.equipmentTagNumber.toLowerCase().includes(query)) ||
        eq.name.toLowerCase().includes(query)
      );
    });
  }, [equipment, filterText]);

  // Get the selected equipment for display
  const selectedEquipment = equipment?.find((eq) => eq.equipmentNumber === value);

  const handleSelect = (equipmentNumber: bigint) => {
    onChange(equipmentNumber);
    setIsOpen(false);
    setFilterText('');
  };

  const handleClear = () => {
    onChange(null);
    setFilterText('');
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1">
          <select
            value={value?.toString() || ''}
            onChange={(e) => {
              if (e.target.value) {
                onChange(BigInt(e.target.value));
              } else {
                onChange(null);
              }
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            <option value="">Select equipment</option>
            {equipment?.map((eq) => (
              <option key={eq.equipmentNumber.toString()} value={eq.equipmentNumber.toString()}>
                {eq.equipmentNumber.toString()} - {eq.equipmentTagNumber ? `${eq.equipmentTagNumber} - ` : ''}{eq.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter dropdown overlay */}
      {isOpen && equipment && equipment.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg">
          <div className="p-2 border-b">
            <Input
              type="text"
              placeholder="Type to filter by equipment #, tag number, or name..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-60">
            {filteredEquipment.length > 0 ? (
              <div className="p-1">
                {filteredEquipment.map((eq) => (
                  <button
                    key={eq.equipmentNumber.toString()}
                    type="button"
                    onClick={() => handleSelect(eq.equipmentNumber)}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground ${
                      value === eq.equipmentNumber ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    <div className="font-medium">
                      {eq.equipmentNumber.toString()} - {eq.name}
                    </div>
                    {eq.equipmentTagNumber && (
                      <div className="text-xs text-muted-foreground">Tag: {eq.equipmentTagNumber}</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No equipment matched the filter
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
