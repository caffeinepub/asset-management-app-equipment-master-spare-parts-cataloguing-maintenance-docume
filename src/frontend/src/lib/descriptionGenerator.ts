/**
 * Generate a short description for a spare part based on its attributes
 */
export function generateSparePartDescription(
  noun: string,
  modifier: string,
  attributes: Record<string, string>
): string {
  const parts: string[] = [];

  // Start with noun and modifier
  if (noun) parts.push(noun);
  if (modifier) parts.push(modifier);

  // Add key attributes (prioritize common ones)
  const keyAttributeNames = [
    'Size',
    'Material',
    'Type',
    'Capacity',
    'Rating',
    'Pressure',
    'Temperature',
    'Voltage',
    'Power',
    'Model',
  ];

  for (const attrName of keyAttributeNames) {
    const value = attributes[attrName];
    if (value && value.trim()) {
      parts.push(value.trim());
    }
  }

  // Add any other non-empty attributes (limit to avoid overly long descriptions)
  const otherAttrs = Object.entries(attributes)
    .filter(([name, value]) => !keyAttributeNames.includes(name) && value && value.trim())
    .slice(0, 3)
    .map(([_, value]) => value.trim());

  parts.push(...otherAttrs);

  // Join with dashes and limit length
  const description = parts.join(' - ');
  return description.length > 200 ? description.substring(0, 197) + '...' : description;
}
