# Data Contract validation module
DATASET_CONTRACT = {
    "ENROLMENT": {
        "required_columns": {"date", "state", "district", "pincode"},
        "metric_prefixes": ["age_"],
        "date_columns": {"date"}
    },
    "DEMOGRAPHIC": {
        "required_columns": {"date", "state", "district", "pincode"},
        "metric_prefixes": ["demo_"],
        "date_columns": {"date"}
    },
    "BIOMETRIC": {
        "required_columns": {"date", "state", "district", "pincode"},
        "metric_prefixes": ["bio_"],
        "date_columns": {"date"}
    },
    "AGGREGATED_MONTHLY": {
        "required_columns": {"month", "state", "district"},
        "metric_prefixes": ["total_"],
        "date_columns": {"month"}
    }
}

