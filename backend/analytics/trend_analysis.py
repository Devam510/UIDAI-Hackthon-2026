# Trend analysis module
import pandas as pd
from backend.ml.common import get_total_enrolment_series


def moving_average_trend(state: str, window: int = 7):
    series = get_total_enrolment_series(state=state)
    df = pd.DataFrame(series)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"]).sort_values("date")

    df["ma"] = df["total_enrolment"].rolling(window).mean()
    df["pct_change"] = df["total_enrolment"].pct_change() * 100

    df = df.tail(60)

    df["date"] = df["date"].dt.date.astype(str)
    return df[["date", "total_enrolment", "ma", "pct_change"]].to_dict(orient="records")
