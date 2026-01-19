# Schema detection module
def detect_dataset_type(df):
    cols = set(df.columns)
    
    # Check for aggregated monthly format (aadhaar_master_monthly.csv)
    if "total_enrolments" in cols or "total_demo_updates" in cols or "total_bio_updates" in cols:
        return "AGGREGATED_MONTHLY"

    if any(c.startswith("age_") for c in cols):
        return "ENROLMENT"

    if any(c.startswith("demo_") for c in cols):
        return "DEMOGRAPHIC"

    if any(c.startswith("bio_") for c in cols):
        return "BIOMETRIC"

    raise ValueError("Unknown UIDAI dataset schema")

