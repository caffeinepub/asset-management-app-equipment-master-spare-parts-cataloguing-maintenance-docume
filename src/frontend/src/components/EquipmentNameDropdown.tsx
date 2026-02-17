import { useMemo } from 'react';
import { EQUIPMENT_NAMES } from '@/lib/staticNameLists';
import AutocompleteTextInput from './AutocompleteTextInput';

interface EquipmentNameDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Equipment name dropdown with static suggestion list and free-typing support.
 * Uses a portaled autocomplete overlay to prevent clipping by parent containers.
 */
export default function EquipmentNameDropdown({ 
  value, 
  onChange, 
  placeholder = 'Select or type equipment name' 
}: EquipmentNameDropdownProps) {
  // Use static equipment names list
  const suggestions = useMemo(() => EQUIPMENT_NAMES, []);

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
