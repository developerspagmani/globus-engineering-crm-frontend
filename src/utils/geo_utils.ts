/**
 * Utility for mapping city/common names to official GeoJSON district names.
 * This ensures that business activity is correctly highlighted even if the
 * source data uses common city names.
 */

export const CANONICAL_STATES: Record<string, string> = {
  'ANDHRA PRADESH': 'Andhra Pradesh',
  'ANDHRA': 'Andhra Pradesh',
  'ANDHRAPRADESH': 'Andhra Pradesh',
  'AP': 'Andhra Pradesh',
  'A.P.': 'Andhra Pradesh',
  'ARUNACHAL PRADESH': 'Arunachal Pradesh',
  'ASSAM': 'Assam',
  'BIHAR': 'Bihar',
  'CHANDIGARH': 'Chandigarh',
  'CHHATTISGARH': 'Chhattisgarh',
  'CHATTISGARH': 'Chhattisgarh',
  'CHHATISGARH': 'Chhattisgarh',
  'CHATISGARH': 'Chhattisgarh',
  'CHATTISGAR': 'Chhattisgarh',
  'GOA': 'Goa',
  'GUJARAT': 'Gujarat',
  'GUJRAT': 'Gujarat',
  'RAJKOT': 'Gujarat',
  'HARYANA': 'Haryana',
  'HARIYANA': 'Haryana',
  'HIMACHAL PRADESH': 'Himachal Pradesh',
  'HP': 'Himachal Pradesh',
  'JAMMU AND KASHMIR': 'Jammu & Kashmir',
  'JAMMU & KASHMIR': 'Jammu & Kashmir',
  'J&K': 'Jammu & Kashmir',
  'JHARKHAND': 'Jharkhand',
  'JHARKAND': 'Jharkhand',
  'KARNATAKA': 'Karnataka',
  'KARNATAKE': 'Karnataka',
  'KARNATAK': 'Karnataka',
  'BANGALORE': 'Karnataka',
  'KERALA': 'Kerala',
  'LADAKH': 'Ladakh',
  'LAKSHADWEEP': 'Lakshadweep',
  'MADHYA PRADESH': 'Madhya Pradesh',
  'MP': 'Madhya Pradesh',
  'MAHARASHTRA': 'Maharashtra',
  'MAHARASTRA': 'Maharashtra',
  'MAHARASTRA STATE': 'Maharashtra',
  'MANIPUR': 'Manipur',
  'MEGHALAYA': 'Meghalaya',
  'MIZORAM': 'Mizoram',
  'NAGALAND': 'Nagaland',
  'ODISHA': 'Odisha',
  'ODHISHA': 'Odisha',
  'ORISSA': 'Odisha',
  'PUDUCHERRY': 'Puducherry',
  'PONDICHERRY': 'Puducherry',
  'PUNJAB': 'Punjab',
  'RAJASTHAN': 'Rajasthan',
  'SIKKIM': 'Sikkim',
  'TAMIL NADU': 'Tamil Nadu',
  'TAMILNADU': 'Tamil Nadu',
  'TAMILNADU STATE': 'Tamil Nadu',
  'TN': 'Tamil Nadu',
  'TELANGANA': 'Telangana',
  'TELEGANA': 'Telangana',
  'TELANGANA STATE': 'Telangana',
  'TS': 'Telangana',
  'TRIPURA': 'Tripura',
  'UTTAR PRADESH': 'Uttar Pradesh',
  'UP': 'Uttar Pradesh',
  'UTTARAKHAND': 'Uttarakhand',
  'UTTARANCHAL': 'Uttarakhand',
  'WEST BENGAL': 'West Bengal',
  'WB': 'West Bengal',
  'DELHI': 'Delhi',
  'NEW DELHI': 'Delhi',
  'NCT': 'Delhi',
  'DELHI NCT': 'Delhi',
};

const CITY_TO_DISTRICT: Record<string, string> = {
    // Karnataka
    'BANGALORE': 'Bengaluru Urban',
    'BENGALURU': 'Bengaluru Urban',
    'BANGALORE URBAN': 'Bengaluru Urban',
    'BENGALURU URBAN': 'Bengaluru Urban',
    'MYSORE': 'Mysuru',
    'MYSURU': 'Mysuru',

    // Maharashtra
    'MUMBAI': 'Greater Bombay',
    'BOMBAY': 'Greater Bombay',
    'PUNE': 'Pune',

    // Andhra Pradesh
    'VISAKHAPATNAM': 'Visakhapatnam',
    'VISHAKHAPATNAM': 'Visakhapatnam',
    'VIZAG': 'Visakhapatnam',
    'VIJAYAWADA': 'Krishna',
    'VIJAYVADA': 'Krishna',

    // Tamil Nadu
    'CHENNAI': 'Chennai',
    'MADRAS': 'Chennai',
    'COIMBATORE': 'Coimbatore',
    'KOVAI': 'Coimbatore',
    'TIRUPUR': 'Tiruppur',
    'TIRUPPUR': 'Tiruppur',
    'TUP': 'Tiruppur',
    'TRICHY': 'Tiruchirappalli',
    'TIRUCHIRAPPALLI': 'Tiruchirappalli',
    'SALEM': 'Salem',
    'SLM': 'Salem',
    'MADURAI': 'Madurai',
    'MDU': 'Madurai',
    'ERODE': 'Erode',
    'TIRUNELVELI': 'Tirunelveli',
    'NELLAI': 'Tirunelveli',
    'DINDIGUL': 'Dindigul',
    'THANJAVUR': 'Thanjavur',

    // Telangana
    'HYDERABAD': 'Hyderabad',
    'HYD': 'Hyderabad',
    'SECUNDERABAD': 'Hyderabad',
};

const STATE_MAP: Record<string, string> = {
    'TN': 'TAMILNADU',
    'TAMILNADU': 'TAMILNADU',
    'TAMILNADUSTATE': 'TAMILNADU',
    'KA': 'KARNATAKA',
    'KARNATAKE': 'KARNATAKA',
    'AP': 'ANDHRAPRADESH',
    'ANDHRA': 'ANDHRAPRADESH',
    'ANDHRAPRADESH': 'ANDHRAPRADESH',
    'MH': 'MAHARASHTRA',
    'MAHARASTRA': 'MAHARASHTRA',
    'MAHARASTRASTATE': 'MAHARASHTRA',
    'TG': 'TELANGANA',
    'TS': 'TELANGANA',
    'TELANGANA': 'TELANGANA',
    'TELENGANA': 'TELANGANA',
    'TELEGANA': 'TELANGANA',
    'KL': 'KERALA',
    'GJ': 'GUJARAT',
    'GUJRAT': 'GUJARAT',
    'RAJKOT': 'GUJARAT',
    'RJ': 'RAJASTHAN',
    'MP': 'MADHYAPRADESH',
    'UP': 'UTTARPRADESH',
    'WB': 'WESTBENGAL',
    'HP': 'HIMACHALPRADESH',
    'AR': 'ARUNACHALPRADESH',
    'JK': 'JAMMUANDKASHMIR',
    'JAMMUKASHMIR': 'JAMMUANDKASHMIR',
    'HR': 'HARYANA',
    'PB': 'PUNJAB',
    'CHATTISGARH': 'CHHATTISGARH',
    'CHHATISGARH': 'CHHATTISGARH',
    'CHATISGARH': 'CHHATTISGARH',
    'JHARKAND': 'JHARKHAND',
    'UTTARANCHAL': 'UTTARAKHAND'
};

/**
 * Normalizes a region name for consistent matching.
 */
export const normalizeName = (name: string | null | undefined): string => {
    if (!name) return '';
    const cleaned = name.trim().toUpperCase().replace(/[^A-Z]/g, '');
    return STATE_MAP[cleaned] || cleaned;
};

/**
 * Checks if a data region matches a selected map region.
 */
export const isRegionMatch = (dataState: string | null | undefined, selectedRegion: string | null | undefined): boolean => {
    if (!selectedRegion || !dataState) return false;
    
    const dState = normalizeName(dataState);
    const sRegion = normalizeName(selectedRegion);

    return dState === sRegion;
};

/**
 * Matches a database region name to a GeoJSON district name.
 */
export const isDistrictMatch = (dataName: string | null | undefined, geoName: string | null | undefined): boolean => {
    if (!dataName || !geoName) return false;
    const dName = normalizeName(dataName);
    const gName = normalizeName(geoName);

    if (dName === gName) return true;

    // Check mapping table (Data -> Geo)
    if (CITY_TO_DISTRICT[dName] && normalizeName(CITY_TO_DISTRICT[dName]) === gName) {
        return true;
    }

    // Reverse mapping check (Geo -> Data)
    for (const [key, value] of Object.entries(CITY_TO_DISTRICT)) {
        if (normalizeName(value) === gName && key === dName) {
            return true;
        }
    }

    // Fuzzy matching for common suffixes (handles URBAN, RURAL, CITY, DISTRICT, etc.)
    const gNameClean = gName.replace(/URBAN|RURAL|CITY|DISTRICT|CORPORATION/g, '');
    const dNameClean = dName.replace(/URBAN|RURAL|CITY|DISTRICT|CORPORATION/g, '');

    if (dNameClean === gNameClean) return true;
    if (gNameClean.length > 3 && dNameClean.length > 3) {
        if (gNameClean.includes(dNameClean) || dNameClean.includes(gNameClean)) return true;
    }

    return false;
};

/**
 * Title case helper
 */
export const toTitleCase = (s: string): string =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Returns canonical state name or null if invalid
 */
export const canonicalState = (raw: string | undefined | null): string | null => {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return null;
  if (trimmed.length < 2) return null;

  const upper = trimmed.replace(/^[\s,.\-]+|[\s,.\-]+$/g, '').toUpperCase();
  if (CANONICAL_STATES[upper]) return CANONICAL_STATES[upper];

  return toTitleCase(trimmed);
};

/**
 * Cleans district/city values (removes leading commas, pincodes, hyphens, country suffixes, and standardizes abbreviations)
 */
export const cleanDistrict = (raw: string | undefined | null): string => {
  if (!raw) return '';
  let str = raw.trim();

  // Strip country suffixes like "India", "(In)", "India (In)"
  str = str.replace(/\b(India|\(In\)|India\s*\(\w+\))\b/gi, '').trim();

  // Strip leading/trailing commas, dots, hyphens, spaces
  str = str.replace(/^[\s,.\-]+|[\s,.\-]+$/g, '').trim();

  // Strip pincode suffixes like "-641048", "- 641107", "-58", " - 600044"
  str = str.replace(/[-\s]+\d{2,6}$/g, '').trim();
  str = str.replace(/[-\s]+\d+$/g, '').trim();

  // Strip state code prefixes if attached to pincodes, e.g. "Cg- 490026" or "TN - 641001"
  if (/^[A-Za-z]{2,3}[-\s]*\d*$/i.test(str)) {
    return '';
  }

  const upper = str.toUpperCase();
  if (upper === 'CBE' || upper === 'COIMBATORE') return 'Coimbatore';
  if (upper === 'CHN' || upper === 'CHENNAI') return 'Chennai';
  if (upper === 'BLR' || upper === 'BANGALORE' || upper === 'BENGALURU') return 'Bengaluru';
  if (upper === 'HYD' || upper === 'HYDERABAD') return 'Hyderabad';
  if (upper === 'MDU' || upper === 'MADURAI') return 'Madurai';
  if (upper === 'TRICHY' || upper === 'TIRUCHIRAPPALLI') return 'Tiruchirappalli';
  if (upper === 'SLM' || upper === 'SALEM') return 'Salem';
  if (upper === 'TUP' || upper === 'TIRUPUR' || upper === 'TIRUPPUR') return 'Tiruppur';
  if (upper.includes('BHILAI')) return 'Bhilai';
  if (upper.includes('RAIPUR')) return 'Raipur';
  if (upper.includes('DURG')) return 'Durg';

  // If the string is purely numbers or punctuation, return empty
  if (/^[\d\s,.-]+$/.test(str)) return '';

  return toTitleCase(str);
};

/**
 * Get district value: sanitized district field or city as fallback
 */
export const getDistrict = (c: { district?: string; city?: string; area?: string }): string => {
  const d = cleanDistrict(c.district);
  if (d) return d;
  const city = cleanDistrict(c.city);
  if (city) return city;
  const area = cleanDistrict(c.area);
  if (area) return area;
  return '';
};


/**
 * Known cities/districts to parent state mapping for fallback resolution
 */
export const DISTRICT_TO_STATE: Record<string, string> = {
    'COIMBATORE': 'Tamil Nadu',
    'CHENNAI': 'Tamil Nadu',
    'TIRUPPUR': 'Tamil Nadu',
    'TIRUPUR': 'Tamil Nadu',
    'SALEM': 'Tamil Nadu',
    'MADURAI': 'Tamil Nadu',
    'ERODE': 'Tamil Nadu',
    'TRICHY': 'Tamil Nadu',
    'TIRUCHIRAPPALLI': 'Tamil Nadu',
    'DINDIGUL': 'Tamil Nadu',
    'THANJAVUR': 'Tamil Nadu',
    'TIRUNELVELI': 'Tamil Nadu',
    'VELLORE': 'Tamil Nadu',
    'HOSUR': 'Tamil Nadu',
    'KRISHNAGIRI': 'Tamil Nadu',
    'KANCHIPURAM': 'Tamil Nadu',
    'BANGALORE': 'Karnataka',
    'BENGALURU': 'Karnataka',
    'MYSORE': 'Karnataka',
    'MYSURU': 'Karnataka',
    'MUMBAI': 'Maharashtra',
    'PUNE': 'Maharashtra',
    'HYDERABAD': 'Telangana',
    'VISAKHAPATNAM': 'Andhra Pradesh',
    'VIZAG': 'Andhra Pradesh',
    'VIJAYAWADA': 'Andhra Pradesh',
};

/**
 * Resolves the state for a customer with fallbacks to shippingState and city/district mapping
 */
export const getCustomerState = (c: { state?: string; shippingState?: string; district?: string; city?: string }): string => {
  const direct = canonicalState(c.state || c.shippingState);
  if (direct) return direct;
  const d = getDistrict(c).toUpperCase();
  if (DISTRICT_TO_STATE[d]) return DISTRICT_TO_STATE[d];
  return '';
};

/**
 * Format number as Indian Rupee currency (INR)
 */
export const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

/**
 * Gets the display name for a district, mapping back to common names if preferred.
 */
export const getDisplayName = (geoName: string): string => {
    return geoName;
};


