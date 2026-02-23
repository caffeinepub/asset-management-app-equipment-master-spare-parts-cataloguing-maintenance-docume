import { useState, useMemo } from 'react';
import { useGetAllSpareParts } from '@/hooks/useQueries';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SparePartLookupProps {
  value: bigint | null;
  onChange: (value: bigint | null) => void;
}

export default function SparePartLookup({ value, onChange }: SparePartLookupProps) {
  const { data: spareParts, isLoading } = useGetAllSpareParts();
  const [filterText, setFilterText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter spare parts based on filter text
  const filteredSpareParts = useMemo(() => {
    if (!spareParts) return [];
    if (!filterText.trim()) return spareParts;

    const query = filterText.toLowerCase();
    return spareParts.filter((part) => {
      return (
        part.partNumber.toString().includes(query) ||
        part.name.toLowerCase().includes(query) ||
        (part.manufacturerPartNo && part.manufacturerPartNo.toLowerCase().includes(query)) ||
        part.description.toLowerCase().includes(query)
      );
    });
  }, [spareParts, filterText]);

  // Get the selected spare part for display
  const selectedSparePart = spareParts?.find((part) => part.partNumber === value);

  const handleSelect = (partNumber: bigint) => {
    onChange(partNumber);
    setIsOpen(false);
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
            <option value="">Select spare part</option>
            {spareParts?.map((part) => (
              <option key={part.partNumber.toString()} value={part.partNumber.toString()}>
                SP-{part.partNumber.toString().padStart(4, '0')} - {part.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter dropdown overlay */}
      {isOpen && spareParts && spareParts.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg">
          <div className="p-2 border-b">
            <Input
              type="text"
              placeholder="Type to filter by part #, name, part number, or description..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-60">
            {filteredSpareParts.length > 0 ? (
              <div className="p-1">
                {filteredSpareParts.map((part) => (
                  <button
                    key={part.partNumber.toString()}
                    type="button"
                    onClick={() => handleSelect(part.partNumber)}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground ${
                      value === part.partNumber ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    <div className="font-medium">
                      SP-{part.partNumber.toString().padStart(4, '0')} - {part.name}
                    </div>
                    {part.manufacturerPartNo && (
                      <div className="text-xs text-muted-foreground">Part #: {part.manufacturerPartNo}</div>
                    )}
                    {part.description && (
                      <div className="text-xs text-muted-foreground">{part.description}</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No spare parts matched the filter
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
