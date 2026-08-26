export const ISSUE_TYPES = [
  { value: 'pothole',                   label: 'Pothole' },
  { value: 'road_damage',               label: 'Road Damage' },
  { value: 'road_crack',                label: 'Road Crack' },
  { value: 'streetlight',               label: 'Streetlight Issue' },
  { value: 'garbage',                   label: 'Garbage / Waste' },
  { value: 'waste_dumping',             label: 'Illegal Waste Dumping' },
  { value: 'drainage_block',            label: 'Drainage Blockage' },
  { value: 'sewage_overflow',           label: 'Sewage Overflow' },
  { value: 'manhole_open',              label: 'Open / Damaged Manhole' },
  { value: 'water_leak',                label: 'Water Pipe Leak' },
  { value: 'contaminated_water',        label: 'Contaminated Water' },
  { value: 'fallen_tree',               label: 'Fallen Tree / Branch' },
  { value: 'park_damage',               label: 'Park / Open Space Damage' },
  { value: 'footpath_damage',           label: 'Footpath Damage' },
  { value: 'unauthorized_construction', label: 'Unauthorized Construction' },
  { value: 'other',                     label: 'Other' },
] as const;

export type IssueTypeValue = (typeof ISSUE_TYPES)[number]['value'];

export function getIssueLabel(value: string): string {
  return ISSUE_TYPES.find((t) => t.value === value)?.label ?? value;
}
