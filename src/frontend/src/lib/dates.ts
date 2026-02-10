export function formatDate(time: bigint): string {
  if (time === BigInt(0)) return '-';
  const milliseconds = Number(time) / 1000000;
  const date = new Date(milliseconds);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function dateToTime(dateString: string): bigint {
  if (!dateString) return BigInt(0);
  return BigInt(new Date(dateString).getTime() * 1000000);
}
