import easyocr

# Loaded once at process start (not per-request) — this is correct as your
# teammate had it. NOTE: the very first time this runs on a machine, EasyOCR
# downloads its model weights (~100MB+) to ~/.EasyOCR. That download can take
# 30-60s+ on a slow connection. If your frontend fetch has an aggressive
# timeout, THAT first request can also look like "Failed to fetch" even
# though the server is fine — it's just slow to answer. Warm the model up
# by hitting the server once after starting it, before wiring up the UI.
reader = easyocr.Reader(['en'], gpu=False)


def extract_text(image_path):
    """
    Extract readable text from an image using EasyOCR.
    Returns a single space-joined string of all detected text
    segments above the confidence threshold.
    """
    results = reader.readtext(
        image_path,
        detail=1,
        paragraph=False
    )

    words = []
    for detection in results:
        text = detection[1]
        confidence = detection[2]
        if confidence >= 0.40:
            words.append(text)

    return " ".join(words)