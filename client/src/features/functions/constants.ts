export const FUNCTION_TYPES = [
  'Wedding',
  'Housewarming',
  'Birthday',
  'EarPiercing',
  'Engagement',
  'BabyShower',
  'Funeral',
  'Other',
] as const;

export type FunctionTypeEnum = (typeof FUNCTION_TYPES)[number];
