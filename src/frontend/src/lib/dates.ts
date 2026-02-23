export function formatDate(time: bigint | undefined): string {
  if (!time || time === BigInt(0)) return '-';
  
  try {
    const milliseconds = Number(time) / 1000000;
    const date = new Date(milliseconds);
    
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function dateToTime(dateString: string | undefined): bigint {
  if (!dateString || !dateString.trim()) return BigInt(0);
  
  try {
    const timestamp = new Date(dateString).getTime();
    if (isNaN(timestamp)) return BigInt(0);
    return BigInt(timestamp * 1000000);
  } catch {
    return BigInt(0);
  }
}
