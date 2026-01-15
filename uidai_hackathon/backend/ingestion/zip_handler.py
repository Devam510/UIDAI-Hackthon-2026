# ZIP file handling module
import zipfile
from pathlib import Path

def extract_zip(zip_path: Path, extract_to: Path) -> Path:
    if not zip_path.exists():
        raise FileNotFoundError(f"{zip_path} not found")

    extract_to.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_to)

    return extract_to
