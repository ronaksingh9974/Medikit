import cv2
import numpy as np
import os

# Anchor every path to this file's own folder, NOT the current working
# directory. This is what makes the service safe to launch from anywhere
# (a script, gunicorn, a process manager, a different IDE) without breaking.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def preprocess_image(image_path):
    image = cv2.imread(image_path)
    if image is None:
        raise Exception("Unable to read image. File may be corrupted or in an unsupported format.")

    image = cv2.resize(
        image,
        None,
        fx=1.5,
        fy=1.5,
        interpolation=cv2.INTER_CUBIC
    )

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    thresh = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11,
        2
    )

    kernel = np.ones((2, 2), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

    filename = os.path.basename(image_path)
    cleaned_path = os.path.join(UPLOAD_DIR, "cleaned_" + filename)

    success = cv2.imwrite(cleaned_path, cleaned)
    if not success:
        raise Exception("Unable to save processed image.")

    return cleaned_path