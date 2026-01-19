from backend.ml.common import get_total_biometric_series
from backend.common.state_resolver import resolve_state

state = resolve_state("UP")
district = "Lucknow"

series = get_total_biometric_series(state=state, district=district)

print("State:", state)
print("District:", district)
print("Series length:", len(series))
print("First 5:", series[:5])
print("Last 5:", series[-5:])
