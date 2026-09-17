export type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Tiny class-name joiner (no dependency). Drops falsy values and flattens arrays. */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const push = (v: ClassValue): void => {
    if (!v && v !== 0) return;
    if (Array.isArray(v)) {
      v.forEach(push);
    } else {
      out.push(String(v));
    }
  };
  inputs.forEach(push);
  return out.join(' ').replace(/\s+/g, ' ').trim();
}
