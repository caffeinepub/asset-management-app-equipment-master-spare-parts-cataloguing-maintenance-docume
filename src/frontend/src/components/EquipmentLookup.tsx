import { useGetAllEquipment } from '@/hooks/useQueries';

interface EquipmentLookupProps {
  value: bigint | null;
  onChange: (value: bigint | null) => void;
}

export default function EquipmentLookup({ value, onChange }: EquipmentLookupProps) {
  const { data: equipment, isLoading } = useGetAllEquipment();

  return (
    <select
      value={value?.toString() || ''}
      onChange={(e) => onChange(e.target.value ? BigInt(e.target.value) : null)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={isLoading}
    >
      <option value="">Select equipment</option>
      {equipment?.map((eq) => (
        <option key={eq.equipmentNumber.toString()} value={eq.equipmentNumber.toString()}>
          {eq.equipmentNumber.toString()} - {eq.name}
        </option>
      ))}
    </select>
  );
}
