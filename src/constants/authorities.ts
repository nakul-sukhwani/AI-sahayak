/** Client-side department list — matches seed data in bangalore_authorities.sql */
export const DEPARTMENTS = [
  'Roads & Infrastructure',
  'Solid Waste Management',
  'Electrical',
  'Drainage',
  'Water Supply',
  'Parks',
  'General Administration',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

/** Maps AI-suggested department strings to the canonical DB values */
export const DEPARTMENT_ALIASES: Record<string, Department> = {
  'roads':                    'Roads & Infrastructure',
  'road':                     'Roads & Infrastructure',
  'infrastructure':           'Roads & Infrastructure',
  'roads & infrastructure':   'Roads & Infrastructure',
  'solid waste':              'Solid Waste Management',
  'waste':                    'Solid Waste Management',
  'garbage':                  'Solid Waste Management',
  'swm':                      'Solid Waste Management',
  'electrical':               'Electrical',
  'streetlight':              'Electrical',
  'lighting':                 'Electrical',
  'drainage':                 'Drainage',
  'sewage':                   'Drainage',
  'water':                    'Water Supply',
  'water supply':             'Water Supply',
  'bwssb':                    'Water Supply',
  'parks':                    'Parks',
  'open spaces':              'Parks',
  'general':                  'General Administration',
  'general administration':   'General Administration',
};

/** Resolves an AI-suggested department string to a canonical department */
export function resolveDepartment(aiSuggested: string): Department {
  const normalized = aiSuggested.toLowerCase().trim();
  return DEPARTMENT_ALIASES[normalized] ?? 'General Administration';
}

/** Key Bangalore wards for the ward dropdown */
export const BANGALORE_WARDS = [
  'Jayanagar', 'JP Nagar', 'Banashankari', 'Basavanagudi',
  'Indiranagar', 'Koramangala', 'Whitefield', 'Yelahanka',
  'Malleswaram', 'Rajajinagar', 'Hebbal', 'BTM Layout',
  'Mahadevapura', 'KR Puram', 'RT Nagar', 'Dasarahalli',
  'Vijayanagar', 'Padmanabhanagar', 'Uttarahalli', 'Kengeri',
  'Domlur', 'HAL', 'Hoodi', 'Thanisandra',
  'Byatarayanapura', 'Seshadripuram', 'Shivajinagar', 'Chamrajpet',
] as const;

export type WardName = (typeof BANGALORE_WARDS)[number];
