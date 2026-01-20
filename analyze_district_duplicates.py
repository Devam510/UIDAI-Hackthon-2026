"""
Analyze district name duplicates across all states in the CSV.
Identifies spelling variations, case issues, and special character discrepancies.
"""
import pandas as pd
import re
from collections import defaultdict

# Load the CSV
df = pd.read_csv('resources/data/processed/aadhaar_master_monthly.csv')

def normalize_for_comparison(name):
    """Normalize district name for comparison"""
    # Convert to lowercase, remove spaces, hyphens, underscores, special chars
    normalized = name.lower()
    normalized = re.sub(r'[^a-z0-9]', '', normalized)
    return normalized

def find_similar_districts(districts):
    """Find potential duplicates in a list of districts"""
    duplicates = []
    districts_list = list(districts)
    
    for i, d1 in enumerate(districts_list):
        for d2 in districts_list[i+1:]:
            norm1 = normalize_for_comparison(d1)
            norm2 = normalize_for_comparison(d2)
            
            # Check for exact normalized match
            if norm1 == norm2:
                duplicates.append((d1, d2, 'exact_normalized'))
            # Check for substring match (one is contained in other)
            elif len(norm1) > 3 and len(norm2) > 3:
                if norm1 in norm2 or norm2 in norm1:
                    if abs(len(norm1) - len(norm2)) <= 5:  # Similar length
                        duplicates.append((d1, d2, 'substring'))
    
    return duplicates

# Group districts by state
print("State,District1,District2,MatchType")
print("=" * 80)

states_with_issues = []
total_duplicates = 0

for state in sorted(df['state'].unique()):
    state_df = df[df['state'] == state]
    districts = state_df['district'].unique()
    
    duplicates = find_similar_districts(districts)
    
    if duplicates:
        states_with_issues.append(state)
        for d1, d2, match_type in duplicates:
            print(f"{state},{d1},{d2},{match_type}")
            total_duplicates += 1

print("\n" + "=" * 80)
print(f"\nSummary:")
print(f"States with duplicate/similar district names: {len(states_with_issues)}")
print(f"Total potential duplicate pairs found: {total_duplicates}")
print(f"\nStates affected: {', '.join(states_with_issues)}")
