export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
}

const templates: Record<string, TemplateField[]> = {
  mechanical: [
    { key: 'power', label: 'Power Rating', type: 'text' },
    { key: 'speed', label: 'Speed (RPM)', type: 'number' },
    { key: 'material', label: 'Material', type: 'text' },
    { key: 'weight', label: 'Weight (kg)', type: 'number' },
  ],
  electrical: [
    { key: 'voltage', label: 'Voltage', type: 'text' },
    { key: 'current', label: 'Current (A)', type: 'number' },
    { key: 'frequency', label: 'Frequency (Hz)', type: 'number' },
    { key: 'phase', label: 'Phase', type: 'select', options: ['Single Phase', 'Three Phase'] },
  ],
  instrumentation: [
    { key: 'range', label: 'Measurement Range', type: 'text' },
    { key: 'accuracy', label: 'Accuracy', type: 'text' },
    { key: 'output', label: 'Output Signal', type: 'text' },
    { key: 'calibration', label: 'Calibration Date', type: 'text' },
  ],
  piping: [
    { key: 'size', label: 'Pipe Size', type: 'text' },
    { key: 'pressure', label: 'Pressure Rating', type: 'text' },
    { key: 'material', label: 'Material', type: 'text' },
    { key: 'connection', label: 'Connection Type', type: 'select', options: ['Flanged', 'Threaded', 'Welded'] },
  ],
};

export function getTemplateFields(templateName: string): TemplateField[] {
  return templates[templateName] || [];
}
