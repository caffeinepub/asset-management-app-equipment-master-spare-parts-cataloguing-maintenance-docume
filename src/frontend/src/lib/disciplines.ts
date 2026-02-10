import { EngineeringDiscipline } from '@/backend';

export const DISCIPLINE_OPTIONS = [
  { value: EngineeringDiscipline.mechanical, label: 'MECHANICAL' },
  { value: EngineeringDiscipline.electrical, label: 'ELECTRICAL' },
  { value: EngineeringDiscipline.instrumentation, label: 'INSTRUMENTATION' },
  { value: EngineeringDiscipline.piping, label: 'PIPING' },
] as const;

export function disciplineToLabel(discipline: EngineeringDiscipline): string {
  switch (discipline) {
    case EngineeringDiscipline.mechanical:
      return 'MECHANICAL';
    case EngineeringDiscipline.electrical:
      return 'ELECTRICAL';
    case EngineeringDiscipline.instrumentation:
      return 'INSTRUMENTATION';
    case EngineeringDiscipline.piping:
      return 'PIPING';
    case EngineeringDiscipline.unknown_:
      return '';
    default:
      return '';
  }
}

export function labelToDiscipline(label: string): EngineeringDiscipline {
  switch (label) {
    case 'MECHANICAL':
      return EngineeringDiscipline.mechanical;
    case 'ELECTRICAL':
      return EngineeringDiscipline.electrical;
    case 'INSTRUMENTATION':
      return EngineeringDiscipline.instrumentation;
    case 'PIPING':
      return EngineeringDiscipline.piping;
    default:
      return EngineeringDiscipline.unknown_;
  }
}
