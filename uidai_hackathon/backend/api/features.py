from fastapi import APIRouter

from backend.features.enrolment_features import enrolment_growth
from backend.features.biometric_features import biometric_failure_rate

router = APIRouter()


@router.get("/enrolment-growth")
def enrolment_growth_api(state: str):
    return {
        "state": state,
        "growth_rate": enrolment_growth(state)
    }


@router.get("/biometric-failure")
def biometric_failure_api(state: str):
    return {
        "state": state,
        "failure_rate": biometric_failure_rate(state)
    }
