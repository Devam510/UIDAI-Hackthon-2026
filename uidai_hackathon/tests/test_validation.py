# Validation tests
from backend.validation.normalizer import normalize_columns

def test_normalize_columns():
    cols = [" Date ", "State", "District", "Pincode"]
    out = normalize_columns(cols)
    assert "date" in out
    assert "state" in out
