import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

from preprocess import preprocess_image
from ocr import extract_text
from medicine_match import match_medicines, search_medicine

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

app = Flask(__name__)

# Dev-friendly wide-open CORS. Before this goes anywhere near production,
# restrict this to the actual frontend origin(s), e.g.:
# CORS(app, origins=["https://your-frontend.vercel.app", "http://localhost:5173"])
CORS(app)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB upload cap


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Medikit Scanner Backend Running"})


@app.route("/search", methods=["GET"])
def search():
    """
    Manual fallback for when OCR can't confidently read a prescription
    (common with cursive/handwritten prescriptions). Reuses the exact
    same medicine.csv + fuzzy-matching logic as the OCR pipeline, so a
    medicine found this way is guaranteed consistent with one found via
    scanning — same fields, same source of truth, just a different way
    of getting the query text (typed instead of OCR'd).
    """
    query = request.args.get("q", "")
    results = search_medicine(query)
    return jsonify({
        "success": True,
        "query": query,
        "result_count": len(results),
        "results": results
    })


@app.route("/upload", methods=["POST"])
def upload():
    try:
        if "prescription" not in request.files:
            return jsonify({"success": False, "message": "No file uploaded."}), 400

        file = request.files["prescription"]

        if file.filename == "":
            return jsonify({"success": False, "message": "No file selected."}), 400

        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "message": f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            }), 400

        filename = secure_filename(file.filename)
        image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(image_path)
        print("Image Saved")

        cleaned_image = preprocess_image(image_path)
        print("Image Preprocessed")

        extracted_text = extract_text(cleaned_image)
        print("OCR Completed")

        medicines = match_medicines(extracted_text)
        print("Medicine Matching Completed")

        return jsonify({
            "success": True,
            "filename": filename,
            "ocr_text": extracted_text,
            "medicine_count": len(medicines),
            "medicines": medicines
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)