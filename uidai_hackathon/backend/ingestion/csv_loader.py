from pathlib import Path
import pandas as pd

def load_all_csvs(folder: Path):
    csv_files = list(folder.rglob("*.csv"))

    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {folder}")

    for csv_file in csv_files:
        df = pd.read_csv(csv_file)
        yield csv_file.name, df

