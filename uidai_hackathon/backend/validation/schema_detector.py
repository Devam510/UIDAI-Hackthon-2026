# Schema detection module
def detect_dataset_type(df):
    cols = set(df.columns)

    if any(c.startswith("age_") for c in cols):
        return "ENROLMENT"

    if any(c.startswith("demo_") for c in cols):
        return "DEMOGRAPHIC"

    if any(c.startswith("bio_") for c in cols):
        return "BIOMETRIC"

    raise ValueError("Unknown UIDAI dataset schema")
