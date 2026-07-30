import os
import pandas as pd
from rapidfuzz import process, fuzz

# THE FIX: anchor to this script's folder, not the working directory the
# server happens to be launched from, and use a lowercase filename that
# matches the CSV shipped alongside this file. This is what was crashing
# app.py on import (FileNotFoundError -> Flask never starts -> browser
# sees "Failed to fetch" because there's nothing listening on the port).
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "medicine.csv")

if not os.path.exists(CSV_PATH):
    raise FileNotFoundError(
        f"medicine.csv not found at {CSV_PATH}. "
        "Make sure the file sits next to medicine_match.py and the "
        "filename is lowercase 'medicine.csv'."
    )

# dtype=str avoids pandas silently turning things like dosage numbers into
# floats/NaN, and fillna keeps downstream .format()/JSON calls from
# choking on NaN values if a row has a blank cell.
medicine_df = pd.read_csv(CSV_PATH, dtype=str).fillna("")
medicine_names = medicine_df["Medicine"].tolist()


def _row_to_dict(row):
    return {
        "medicine": row["Medicine"],
        "composition": row["Composition"],
        "usage": row["Usage"],
        "dosage": row["Dosage"],
        "alternative": row["Alternative"]
    }


def match_medicines(extracted_text):
    if not extracted_text or not extracted_text.strip():
        return []

    words = extracted_text.split()
    detected = []
    used = set()

    for word in words:
        # Guard against false positives: a bare "L" or "8" can still score
        # >=80 against a short medicine name under fuzzy matching, because
        # there's too little information in 1-3 characters to distinguish
        # "similar" from "coincidence". Real medicine names in medicine.csv
        # are all 4+ letters, so anything shorter or purely numeric/punctuation
        # can't be a genuine match and would only produce noise.
        cleaned_word = word.strip(".,:;()[]")
        if len(cleaned_word) < 4 or not any(c.isalpha() for c in cleaned_word):
            continue

        match = process.extractOne(
            query=cleaned_word,
            choices=medicine_names,
            scorer=fuzz.WRatio
        )
        if match is None:
            continue

        medicine_name, score = match[0], match[1]
        if score < 80:
            continue
        if medicine_name in used:
            continue
        used.add(medicine_name)

        row = medicine_df[medicine_df["Medicine"] == medicine_name].iloc[0]
        detected.append(_row_to_dict(row))

    return detected


def search_medicine(query, limit=5):
    """
    Manual/autocomplete search used by the fallback UI when OCR can't
    confidently read a prescription (e.g. difficult handwriting).

    Unlike match_medicines(), this is driven by a human typing a name on
    purpose, not noisy OCR output — so it uses a lower confidence
    threshold (60 instead of 80) and returns several ranked candidates
    instead of a single best guess per word, since the user is meant to
    pick the right one from a short list (handles partial input like
    "para" while they're still typing).
    """
    if not query or not query.strip():
        return []

    query = query.strip()
    matches = process.extract(
        query,
        medicine_names,
        scorer=fuzz.WRatio,
        limit=limit
    )

    results = []
    seen = set()
    for medicine_name, score, _ in matches:
        if score < 60:
            continue
        if medicine_name in seen:
            continue
        seen.add(medicine_name)
        row = medicine_df[medicine_df["Medicine"] == medicine_name].iloc[0]
        results.append(_row_to_dict(row))

    return results