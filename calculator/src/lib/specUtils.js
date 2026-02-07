import { supabase } from './supabase';

/**
 * Generate unique specification number: SPEC-YYYY-NNNNN
 */
export async function generateSpecNumber() {
  const year = new Date().getFullYear();
  const prefix = `SPEC-${year}-`;

  // Get last spec number for this year
  const { data, error } = await supabase
    .from('specifications')
    .select('number')
    .like('number', `${prefix}%`)
    .order('number', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching last spec number:', error);
  }

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].number;
    const numPart = parseInt(lastNumber.split('-')[2], 10);
    nextNumber = numPart + 1;
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}
