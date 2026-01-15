from fastapi import APIRouter
from backend.common.state_resolver import get_all_canonical_states

router = APIRouter()


@router.get("/states")
def get_states():
    """
    Get all unique canonical state names from the database.
    
    Returns:
        {
            "status": "success",
            "count": int,
            "states": [list of state names]
        }
    """
    try:
        states = get_all_canonical_states()
        
        return {
            "status": "success",
            "count": len(states),
            "states": states
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to fetch states: {str(e)}",
            "count": 0,
            "states": []
        }
