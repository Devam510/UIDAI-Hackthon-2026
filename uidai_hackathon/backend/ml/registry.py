from pathlib import Path
import joblib

# ✅ Always resolve project root from this file location
# registry.py is at: backend/ml/registry.py
PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_DIR = PROJECT_ROOT / "data" / "processed" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def _path(name: str) -> Path:
    return MODEL_DIR / f"{name}.joblib"


def save_model(model, name: str):
    p = _path(name)
    joblib.dump(model, p)
    return str(p)


def load_model(name: str):
    p = _path(name)
    if not p.exists():
        return None
    return joblib.load(p)


def list_models():
    return sorted([f.stem for f in MODEL_DIR.glob("*.joblib")])
