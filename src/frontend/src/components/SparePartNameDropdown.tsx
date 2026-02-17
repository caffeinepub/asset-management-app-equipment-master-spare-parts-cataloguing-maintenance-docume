import { useMemo } from 'react';
import { SPARE_PART_NAMES } from '@/lib/staticNameLists';
import AutocompleteTextInput from './AutocompleteTextInput';

interface SparePartNameDropdownProps {
  value: string;
  onChange: (value: string) => void;
  equipmentNumber?: bigint | null;
  placeholder?: string;
}

/**
 * Spare part name dropdown with static suggestion list and free-typing support.
 * Uses a portaled autocomplete overlay to prevent clipping by parent containers.
 * Note: equipmentNumber parameter is kept for API compatibility but not used for filtering.
 */
export default function SparePartNameDropdown({ 
  value, 
  onChange, 
  equipmentNumber = null,
  placeholder = 'Select or type spare part name' 
}: SparePartNameDropdownProps) {
  // Use static spare part names list (same as equipment names)
  const suggestions = useMemo(() => SPARE_PART_NAMES, []);

  return (
    <AutocompleteTextInput
      value={value}
      onChange={onChange}
      suggestions={suggestions}
      placeholder={placeholder}
      className="w-full"
    />
  );
}
