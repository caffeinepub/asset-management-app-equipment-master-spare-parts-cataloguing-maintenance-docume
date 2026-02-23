import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useGetAllSparePartsWithAttributes } from '@/hooks/useQueries';
import { Search } from 'lucide-react';

interface SparePartNumberLookupProps {
  value: bigint | null;
  onChange: (partNumber: bigint | null) => void;
  disabled?: boolean;
}

export default function SparePartNumberLookup({ value, onChange, disabled }: SparePartNumberLookupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: spareParts = [] } = useGetAllSparePartsWithAttributes();

  const filteredParts = spareParts.filter((part) => {
    const search = searchTerm.toLowerCase();
    return (
      part.partNumber.toString().includes(search) ||
      part.description?.toLowerCase().includes(search) ||
      part.noun?.toLowerCase().includes(search) ||
      part.modifier?.toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (partNumber: bigint) => {
    onChange(partNumber);
    setSearchTerm(partNumber.toString());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredParts.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredParts[highlightedIndex]) {
          handleSelect(filteredParts[highlightedIndex].partNumber);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search by part number or description..."
          disabled={disabled}
          className="pl-9"
        />
      </div>

      {isOpen && filteredParts.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredParts.map((part, index) => (
            <div
              key={part.partNumber.toString()}
              onMouseDown={() => handleSelect(part.partNumber)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === highlightedIndex ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
            >
              <div className="font-medium">Part #{part.partNumber.toString()}</div>
              <div className="text-xs text-muted-foreground">
                {part.noun} - {part.modifier}
              </div>
              {part.description && (
                <div className="text-xs text-muted-foreground truncate">{part.description}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {isOpen && searchTerm && filteredParts.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-3">
          <p className="text-sm text-muted-foreground">No spare parts found</p>
        </div>
      )}
    </div>
  );
}
