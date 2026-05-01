// src/utils/slug.ts

export const generateSlug = (text: string): string => {
  if (!text) return '';

  return text
    .toLowerCase()  
    .trim()                     
    .replace(/[^a-z0-9\s-]/g, '')   
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')   
    .replace(/^-|-$/g, '');         
};


export const isValidSlug = (slug: string): boolean => {
  if (!slug) return false;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
};


export const generateUniqueSlug = (text: string, counter: number = 0): string => {
  const base = generateSlug(text);
  return counter > 0 ? `${base}-${counter}` : base;
};