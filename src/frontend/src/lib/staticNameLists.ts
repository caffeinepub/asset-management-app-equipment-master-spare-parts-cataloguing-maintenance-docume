/**
 * Static lists of equipment and spare part names for dropdown suggestions.
 * These lists are used for autocomplete functionality while still allowing free-typing.
 */

export const EQUIPMENT_NAMES = [
  'AIR COMPRESSOR',
  'AIR DRYER',
  'AIR FILTER',
  'AIR RECEIVER',
  'BALL VALVE',
  'BUTTERFLY VALVE',
  'CENTRIFUGAL PUMP',
  'CHECK VALVE',
  'CONTROL VALVE',
  'COOLING TOWER',
  'ELECTRIC MOTOR',
  'EXPANSION JOINT',
  'FILTER',
  'FIRE PUMP',
  'FLOW METER',
  'GATE VALVE',
  'GEAR BOX',
  'GLOBE VALVE',
  'HEAT EXCHANGER',
  'HYDRAULIC PUMP',
  'LEVEL TRANSMITTER',
  'MOTOR CONTROL CENTER',
  'NEEDLE VALVE',
  'PIPE',
  'PIPE FITTING',
  'PRESSURE GAUGE',
  'PRESSURE RELIEF VALVE',
  'PRESSURE TRANSMITTER',
  'PUMP',
  'SAFETY VALVE',
  'STRAINER',
  'TEMPERATURE TRANSMITTER',
  'VALVE',
  'WATER PUMP',
].sort();

// Spare part names use the same list as equipment names
export const SPARE_PART_NAMES = EQUIPMENT_NAMES;
