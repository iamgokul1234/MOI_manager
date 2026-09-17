import type { FunctionCategory } from '@/types';

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

export const FUNCTION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Wedding', label: 'Wedding' },
  { value: 'Housewarming', label: 'Housewarming' },
  { value: 'Birthday', label: 'Birthday' },
  { value: 'EarPiercing', label: 'Ear Piercing' },
  { value: 'Engagement', label: 'Engagement' },
  { value: 'BabyShower', label: 'Baby Shower' },
  { value: 'Funeral', label: 'Funeral' },
  { value: 'Other', label: 'Other (type your own)' },
];

export const isKnownType = (type: string): type is FunctionTypeEnum =>
  (FUNCTION_TYPES as readonly string[]).includes(type);

export const CATEGORY_LABEL: Record<FunctionCategory, string> = {
  OUR: 'Our Function',
  RELATIVE: 'Relative Function',
};

export type FunctionsTab = 'our' | 'relative';

export const tabToCategory = (tab: FunctionsTab): FunctionCategory =>
  tab === 'relative' ? 'RELATIVE' : 'OUR';
