export const ESCALOES = [
  'Seniores Femininos',
  'Sub-18 Femininos',
  'Sub-16 Femininos',
  'Sub-14 Femininos',
  'Sub-12 Femininos',
  'Sub-10 Femininos',
  'Bambis / Baby Andebol'
] as const;

export const CATEGORIES = [
  'Melhor Jogadora',
  'Melhor Defensora',
  'Melhor Guarda Redes'
] as const;

export function calculateEscalao(birthDate: string): string {
  const year = new Date(birthDate).getFullYear();
  
  if (year <= 2008) return 'Seniores Femininos';
  if (year === 2009 || year === 2010) return 'Sub-18 Femininos';
  if (year === 2011 || year === 2012) return 'Sub-16 Femininos';
  if (year === 2013 || year === 2014) return 'Sub-14 Femininos';
  if (year === 2015 || year === 2016) return 'Sub-12 Femininos';
  if (year === 2017) return 'Sub-10 Femininos';
  return 'Bambis / Baby Andebol'; // 2018 or later
}
