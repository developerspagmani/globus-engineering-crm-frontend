// All Indian States and Union Territories with their GST State Codes
export interface IndianState {
  name: string;
  code: number;
  tin: string; // 2-digit code as used in GSTIN
}

export const INDIAN_STATES: IndianState[] = [
  { name: 'Andaman and Nicobar Islands', code: 35, tin: '35' },
  { name: 'Andhra Pradesh', code: 37, tin: '37' },
  { name: 'Arunachal Pradesh', code: 12, tin: '12' },
  { name: 'Assam', code: 18, tin: '18' },
  { name: 'Bihar', code: 10, tin: '10' },
  { name: 'Chandigarh', code: 4, tin: '04' },
  { name: 'Chhattisgarh', code: 22, tin: '22' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 26, tin: '26' },
  { name: 'Delhi', code: 7, tin: '07' },
  { name: 'Goa', code: 30, tin: '30' },
  { name: 'Gujarat', code: 24, tin: '24' },
  { name: 'Haryana', code: 6, tin: '06' },
  { name: 'Himachal Pradesh', code: 2, tin: '02' },
  { name: 'Jammu and Kashmir', code: 1, tin: '01' },
  { name: 'Jharkhand', code: 20, tin: '20' },
  { name: 'Karnataka', code: 29, tin: '29' },
  { name: 'Kerala', code: 32, tin: '32' },
  { name: 'Ladakh', code: 38, tin: '38' },
  { name: 'Lakshadweep', code: 31, tin: '31' },
  { name: 'Madhya Pradesh', code: 23, tin: '23' },
  { name: 'Maharashtra', code: 27, tin: '27' },
  { name: 'Manipur', code: 14, tin: '14' },
  { name: 'Meghalaya', code: 17, tin: '17' },
  { name: 'Mizoram', code: 15, tin: '15' },
  { name: 'Nagaland', code: 13, tin: '13' },
  { name: 'Odisha', code: 21, tin: '21' },
  { name: 'Puducherry', code: 34, tin: '34' },
  { name: 'Punjab', code: 3, tin: '03' },
  { name: 'Rajasthan', code: 8, tin: '08' },
  { name: 'Sikkim', code: 11, tin: '11' },
  { name: 'Tamil Nadu', code: 33, tin: '33' },
  { name: 'Telangana', code: 36, tin: '36' },
  { name: 'Tripura', code: 16, tin: '16' },
  { name: 'Uttar Pradesh', code: 9, tin: '09' },
  { name: 'Uttarakhand', code: 5, tin: '05' },
  { name: 'West Bengal', code: 19, tin: '19' },
].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Given a state name (even partial/incorrect casing), return the matching IndianState.
 */
export function findStateByName(name: string): IndianState | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
  return INDIAN_STATES.find(
    s => s.name.toLowerCase() === normalized ||
         s.name.toLowerCase().replace(/\s+/g, '') === normalized.replace(/\s+/g, '')
  );
}

/**
 * Given the first 2 digits of a GSTIN, return the matching state.
 */
export function findStateByGstCode(code: string): IndianState | undefined {
  if (!code) return undefined;
  return INDIAN_STATES.find(s => s.tin === code.padStart(2, '0'));
}
