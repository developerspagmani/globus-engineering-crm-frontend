/**
 * Utility for mapping city/common names to official GeoJSON district names.
 * This ensures that business activity is correctly highlighted even if the
 * source data uses common city names.
 */

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

    // Telangana
    'HYDERABAD': 'Hyderabad',
};

/**
 * Normalizes a region name for consistent matching.
 */
export const normalizeName = (name: string | null | undefined): string => {
    if (!name) return '';
    return name.trim().toUpperCase();
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

    // Fuzzy matching for common suffixes
    const gNameClean = gName.replace(' URBAN', '').replace(' RURAL', '').replace(' CITY', '').replace(' DISTRICT', '').replace(' CORPORATION', '');
    const dNameClean = dName.replace(' URBAN', '').replace(' RURAL', '').replace(' CITY', '').replace(' DISTRICT', '').replace(' CORPORATION', '');

    if (dNameClean === gNameClean) return true;
    if (gNameClean.length > 3 && dNameClean.length > 3) {
        if (gNameClean.includes(dNameClean) || dNameClean.includes(gNameClean)) return true;
    }

    return false;
};

/**
 * Gets the display name for a district, mapping back to common names if preferred.
 */
export const getDisplayName = (geoName: string): string => {
    // Reverse lookup for display if needed, but usually GeoJSON names are fine
    return geoName;
};
