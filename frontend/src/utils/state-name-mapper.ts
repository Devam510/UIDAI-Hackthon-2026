/**
 * Official Government of India State Name Mapping
 * 
 * This is the single source of truth for mapping @svg-maps/india location names
 * to CSV state names from aadhaar_master_monthly.csv
 * 
 * CRITICAL: All state names must match official Government of India naming.
 */

export interface StateData {
    name: string;
    risk_score: number;
}

/**
 * Maps @svg-maps/india location names to official CSV state names
 * Handles special cases like merged UTs
 */
export const STATE_NAME_MAP: Record<string, string> = {
    // Exact matches - most states
    'Andaman and Nicobar Islands': 'Andaman and Nicobar Islands',
    'Andhra Pradesh': 'Andhra Pradesh',
    'Arunachal Pradesh': 'Arunachal Pradesh',
    'Assam': 'Assam',
    'Bihar': 'Bihar',
    'Chandigarh': 'Chandigarh',
    'Chhattisgarh': 'Chhattisgarh',
    'Delhi': 'Delhi',
    'Goa': 'Goa',
    'Gujarat': 'Gujarat',
    'Haryana': 'Haryana',
    'Himachal Pradesh': 'Himachal Pradesh',
    'Jammu and Kashmir': 'Jammu and Kashmir',
    'Jharkhand': 'Jharkhand',
    'Karnataka': 'Karnataka',
    'Kerala': 'Kerala',
    'Lakshadweep': 'Lakshadweep',
    'Madhya Pradesh': 'Madhya Pradesh',
    'Maharashtra': 'Maharashtra',
    'Manipur': 'Manipur',
    'Meghalaya': 'Meghalaya',
    'Mizoram': 'Mizoram',
    'Nagaland': 'Nagaland',
    'Odisha': 'Odisha',
    'Puducherry': 'Puducherry',
    'Punjab': 'Punjab',
    'Rajasthan': 'Rajasthan',
    'Sikkim': 'Sikkim',
    'Tamil Nadu': 'Tamil Nadu',
    'Telangana': 'Telangana',
    'Tripura': 'Tripura',
    'Uttar Pradesh': 'Uttar Pradesh',
    'Uttarakhand': 'Uttarakhand',
    'West Bengal': 'West Bengal',

    // Special case: Merged UT (2020)
    // Map library has separate entries, CSV has merged entry
    'Dadra and Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'Daman and Diu': 'Dadra and Nagar Haveli and Daman and Diu',
};

/**
 * Normalize map state name to CSV state name
 * 
 * @param mapStateName - State name from @svg-maps/india library
 * @returns Official CSV state name
 */
export function normalizeStateName(mapStateName: string): string {
    return STATE_NAME_MAP[mapStateName] || mapStateName;
}

/**
 * Validate that all states in data have corresponding map entries
 * 
 * @param statesData - Array of state data from API
 * @returns Object with matched and unmatched state names
 */
export function validateStateMapping(statesData: Array<{ name: string }>): {
    matched: string[];
    unmatched: string[];
} {
    const csvStateNames = statesData.map(s => s.name);
    const mapStateNames = Object.values(STATE_NAME_MAP);

    const matched: string[] = [];
    const unmatched: string[] = [];

    csvStateNames.forEach(csvName => {
        if (mapStateNames.includes(csvName)) {
            matched.push(csvName);
        } else {
            unmatched.push(csvName);
        }
    });

    return { matched, unmatched };
}

/**
 * Get all official state names from CSV
 */
export const OFFICIAL_STATE_NAMES = [
    'Andaman and Nicobar Islands',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chandigarh',
    'Chhattisgarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jammu and Kashmir',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Ladakh', // In CSV but not in map library (created 2019)
    'Lakshadweep',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Puducherry',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
] as const;
