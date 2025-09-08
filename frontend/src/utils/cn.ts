// Simple implementation to replace clsx and tailwind-merge dependencies
type ClassValue = string | number | boolean | undefined | null | { [key: string]: boolean } | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter(Boolean)
    .map((input) => {
      if (typeof input === 'string') return input;
      if (typeof input === 'object' && input !== null) {
        return Object.entries(input)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .join(' ');
}
