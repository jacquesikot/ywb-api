export const capitalize = (str: unknown): string => {
  if (typeof str !== 'string' || !str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const uppercase = (str: string): string => {
  if (!str) return '';
  return str?.charAt(0)?.toUpperCase() + str?.slice(1)?.toUpperCase();
};
