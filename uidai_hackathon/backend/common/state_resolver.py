from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord

# Comprehensive state abbreviations mapping
ABBREVIATIONS = {
    "UP": "Uttar Pradesh",
    "MP": "Madhya Pradesh",
    "TN": "Tamil Nadu",
    "WB": "West Bengal",
    "AP": "Andhra Pradesh",
    "TS": "Telangana",
    "RJ": "Rajasthan",
    "GJ": "Gujarat",
    "MH": "Maharashtra",
    "DL": "Delhi",
    "KA": "Karnataka",
    "KL": "Kerala",
    "OR": "Odisha",
    "PB": "Punjab",
    "HR": "Haryana",
    "HP": "Himachal Pradesh",
    "JH": "Jharkhand",
    "CT": "Chhattisgarh",
    "UK": "Uttarakhand",
    "GA": "Goa",
    "AS": "Assam",
    "MN": "Manipur",
    "MZ": "Mizoram",
    "NL": "Nagaland",
    "TR": "Tripura",
    "AR": "Arunachal Pradesh",
    "SK": "Sikkim",
    "ML": "Meghalaya",
    "JK": "Jammu and Kashmir",
    "LA": "Ladakh",
    "CH": "Chandigarh",
    "PY": "Puducherry",
    "AN": "Andaman and Nicobar Islands",
    "LK": "Lakshadweep",
    "DD": "Dadra and Nagar Haveli and Daman and Diu",
}

# Canonical state names (normalized forms)
CANONICAL_STATES = {
    # Delhi variants
    "DELHI": "Delhi",
    "NCT OF DELHI": "Delhi",
    "NATIONAL CAPITAL TERRITORY OF DELHI": "Delhi",
    "NEW DELHI": "Delhi",
    
    # Merged UT
    "DADRA AND NAGAR HAVELI": "Dadra and Nagar Haveli and Daman and Diu",
    "DAMAN AND DIU": "Dadra and Nagar Haveli and Daman and Diu",
    "DADRA & NAGAR HAVELI": "Dadra and Nagar Haveli and Daman and Diu",
    "DAMAN & DIU": "Dadra and Nagar Haveli and Daman and Diu",
    "DNH": "Dadra and Nagar Haveli and Daman and Diu",
    "DD": "Dadra and Nagar Haveli and Daman and Diu",
    
    # Other common variants
    "ORISSA": "Odisha",
    "PONDICHERRY": "Puducherry",
    "UTTARANCHAL": "Uttarakhand",
    "ANDAMAN & NICOBAR": "Andaman and Nicobar Islands",
    "ANDAMAN & NICOBAR ISLANDS": "Andaman and Nicobar Islands",
}

# Invalid state entries to filter out
INVALID_STATES = {
    "", "NA", "N/A", "UNKNOWN", "NULL", "-", "0", "NONE", "NOT AVAILABLE", "NOT SPECIFIED"
}


def normalize_state_name(state_name: str) -> str:
    """
    Normalize a state name to its canonical form with aggressive normalization
    to handle spelling variations and dirty data.
    
    Args:
        state_name: Raw state name from database
        
    Returns:
        Canonical normalized state name
    """
    if not state_name:
        return None
    
    # Strip whitespace
    normalized = state_name.strip()
    
    # Check if invalid
    if normalized.upper() in INVALID_STATES:
        return None
    
    # Filter out numeric-only entries
    if normalized.isdigit():
        return None
    
    # Remove "The" prefix if present
    if normalized.upper().startswith("THE "):
        normalized = normalized[4:].strip()
    
    # Check abbreviations first
    if normalized.upper() in ABBREVIATIONS:
        return ABBREVIATIONS[normalized.upper()]
    
    # Check canonical mappings (case-insensitive)
    if normalized.upper() in CANONICAL_STATES:
        return CANONICAL_STATES[normalized.upper()]
    
    # Aggressive normalization for fuzzy matching
    # Remove spaces, special characters, convert to uppercase for comparison
    clean_input = ''.join(c.upper() for c in normalized if c.isalnum())
    
    # Common misspellings and variations mapping
    SPELLING_VARIATIONS = {
        'WESTBENGAL': 'West Bengal',
        'WESTBANGAL': 'West Bengal',
        'WESTBENGOL': 'West Bengal',
        'TAMILNADU': 'Tamil Nadu',
        'UTTARPRADESH': 'Uttar Pradesh',
        'MADHYAPRADESH': 'Madhya Pradesh',
        'ANDHRAPRADESH': 'Andhra Pradesh',
        'ARUNACHALPRADESH': 'Arunachal Pradesh',
        'HIMACHALPRADESH': 'Himachal Pradesh',
        'CHHATISGARH': 'Chhattisgarh',
        'CHATTISGARH': 'Chhattisgarh',
        'CHHATTISGARH': 'Chhattisgarh',
        'JHARKAND': 'Jharkhand',
        'UTTARAKHAND': 'Uttarakhand',
        'UTTARANCHAL': 'Uttarakhand',
        'ORISSA': 'Odisha',
        'PONDICHERRY': 'Puducherry',
        'ANDAMANANDNICOBARISLANDS': 'Andaman and Nicobar Islands',
        'ANDAMANANDNICOBAR': 'Andaman and Nicobar Islands',
        'ANDAMANNICOBAR': 'Andaman and Nicobar Islands',
        'DADRAANDNAGARHAVELI': 'Dadra and Nagar Haveli and Daman and Diu',
        'DADRAANDNAGARHAVELANDDAMANANDDIU': 'Dadra and Nagar Haveli and Daman and Diu',
        'DAMANANDDIU': 'Dadra and Nagar Haveli and Daman and Diu',
        'DADRANAGARHAVELI': 'Dadra and Nagar Haveli and Daman and Diu',
        'JAMMUANDKASHMIR': 'Jammu and Kashmir',
        'JAMMUKASHMIR': 'Jammu and Kashmir',
    }
    
    # Check spelling variations
    if clean_input in SPELLING_VARIATIONS:
        return SPELLING_VARIATIONS[clean_input]
    
    # For Dadra specifically, check if it contains the key parts
    # This catches any variation of "Dadra ... Nagar Haveli ... Daman ... Diu"
    normalized_upper = normalized.upper()
    if ('DADRA' in normalized_upper and 'NAGAR' in normalized_upper and 
        'HAVELI' in normalized_upper and 'DAMAN' in normalized_upper and 'DIU' in normalized_upper):
        return 'Dadra and Nagar Haveli and Daman and Diu'
    
    # Title case for consistency
    return normalized.title()


def resolve_state(user_input: str) -> str:
    """
    Resolve user input to a canonical state name.
    
    Args:
        user_input: State name or abbreviation from user
        
    Returns:
        Canonical state name
        
    Raises:
        ValueError: If state cannot be resolved
    """
    if not user_input:
        raise ValueError("State is required")

    # Normalize the input
    normalized = normalize_state_name(user_input)
    
    if not normalized:
        raise ValueError(f"Invalid state input: '{user_input}'")
    
    # Get all states from database
    session = SessionLocal()
    try:
        states_query = session.query(UIDAIRecord.state).distinct().all()
        db_states = [normalize_state_name(s[0]) for s in states_query if s[0]]
        db_states = [s for s in db_states if s]  # Filter None values
    finally:
        session.close()
    
    # Exact match (case-insensitive)
    for st in db_states:
        if st.lower() == normalized.lower():
            return st
    
    # Partial match
    for st in db_states:
        if normalized.lower() in st.lower():
            return st
    
    # If no match found, return normalized form anyway
    # (it might be a valid state not yet in database)
    return normalized


def get_all_canonical_states() -> list:
    """
    Get all unique canonical state names from the database.
    
    Returns:
        List of canonical state names, sorted alphabetically
    """
    session = SessionLocal()
    try:
        # Get all distinct states from database
        states_query = session.query(UIDAIRecord.state).distinct().all()
        raw_states = [s[0] for s in states_query if s[0]]
        
        # Normalize all states
        normalized_states = set()
        for state in raw_states:
            canonical = normalize_state_name(state)
            if canonical:
                normalized_states.add(canonical)
        
        # Sort alphabetically
        return sorted(list(normalized_states))
        
    finally:
        session.close()
