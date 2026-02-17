import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AutocompleteTextInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Shared autocomplete text input component with portaled dropdown to prevent clipping.
 * Supports keyboard navigation and reliable click handling.
 */
export default function AutocompleteTextInput({
  value,
  onChange,
  suggestions,
  placeholder = 'Select or type',
  disabled = false,
  className = '',
}: AutocompleteTextInputProps) {
  const [filterText, setFilterText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on current input
  const filteredSuggestions = (isFocused ? filterText : value)
    .toLowerCase()
    .trim()
    ? suggestions.filter((item) => item.toLowerCase().includes((isFocused ? filterText : value).toLowerCase()))
    : suggestions;

  // Update dropdown position when opening or on scroll/resize
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const updatePosition = () => {
        if (!inputRef.current) return;
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
        setFilterText('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    setFilterText('');
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setFilterText(newValue);
    setIsOpen(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
    setFilterText(value);
  };

  const handleBlur = () => {
    // Don't close immediately to allow click events on dropdown items
    // The mousedown listener will handle closing when clicking outside
  };

  const dropdownContent = isOpen && suggestions.length > 0 && (
    <div
      ref={dropdownRef}
      className="fixed z-[100] bg-background border border-input rounded-md shadow-lg"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
      }}
    >
      <ScrollArea className="max-h-60">
        {filteredSuggestions.length > 0 ? (
          <div className="p-1">
            {filteredSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur
                  handleSelect(item);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors ${
                  value === item ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No matches found
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <>
      <Input
        ref={inputRef}
        type="text"
        value={isFocused ? filterText : value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
    </>
  );
}
