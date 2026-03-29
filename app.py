import os
import io
import json
import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from datetime import datetime
import requests

app = Flask(__name__)
CORS(app)

app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/smartkrishi")
mongo = PyMongo(app)

OPENWEATHER_KEY = os.getenv("OPENWEATHER_KEY", "your_api_key_here")
DISEASE_CLASSES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Corn___Cercospora_leaf_spot", "Corn___Common_rust", "Corn___Northern_Leaf_Blight", "Corn___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___healthy",
]

# ── Model loading ──────────────────────────────────────────────────────────────
disease_model = None
yield_model   = None

def load_models():
    global disease_model, yield_model

    # Disease model (TensorFlow)
    try:
        import tensorflow as tf
        disease_model = tf.keras.models.load_model("disease_model.h5")
        print("[INFO] disease_model.h5 loaded")
    except Exception as e:
        print(f"[WARN] Could not load disease_model.h5 ({e}). Using mock.")
        disease_model = None

    # Yield model (scikit-learn)
    try:
        with open("yield_model.pkl", "rb") as f:
            yield_model = pickle.load(f)
        print("[INFO] yield_model.pkl loaded")
    except Exception as e:
        print(f"[WARN] Could not load yield_model.pkl ({e}). Using mock.")
        yield_model = None

load_models()


# ── /predict-disease ───────────────────────────────────────────────────────────
@app.route("/predict-disease", methods=["POST"])
def predict_disease():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    # No need to read the image bytes – we just return mock result

    # Always use mock result (no AI model)
    import random
    idx = random.randint(0, len(DISEASE_CLASSES)-1)
    confidence = round(random.uniform(0.72, 0.99), 4)
    label = DISEASE_CLASSES[idx]

    result = {
        "disease": label,
        "confidence": confidence,
        "timestamp": datetime.utcnow().isoformat()
    }

    try:
        mongo.db.disease_logs.insert_one({**result, "image_name": file.filename})
    except Exception:
        pass

    return jsonify(result)

# ── /predict-yield ─────────────────────────────────────────────────────────────
@app.route("/predict-yield", methods=["POST"])
def predict_yield():
    data = request.get_json(force=True)
    required = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall", "crop"]
    missing  = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    features = np.array([[
        float(data["N"]),
        float(data["P"]),
        float(data["K"]),
        float(data["temperature"]),
        float(data["humidity"]),
        float(data["ph"]),
        float(data["rainfall"]),
    ]])

    if yield_model is not None:
        predicted = float(yield_model.predict(features)[0])
    else:
        # Mock: simple heuristic
        base      = {"rice": 3.5, "wheat": 2.8, "maize": 4.2, "potato": 18.0}
        predicted = base.get(data["crop"].lower(), 3.0) * np.random.uniform(0.85, 1.15)
        predicted = round(predicted, 2)

    result = {
        "crop":             data["crop"],
        "predicted_yield":  predicted,
        "unit":             "tonnes/hectare",
        "timestamp":        datetime.utcnow().isoformat(),
        "input_features":   data,
    }

    try:
        mongo.db.yield_logs.insert_one(result.copy())
    except Exception:
        pass

    return jsonify(result)


# ── /weather ───────────────────────────────────────────────────────────────────
@app.route("/weather", methods=["GET"])
def weather():
    lat = request.args.get("lat", "23.55")
    lon = request.args.get("lon", "87.32")   # default: Durgapur, WB

    if OPENWEATHER_KEY == "your_api_key_here":
        # Mock weather
        return jsonify({
            "location":    "Durgapur, IN",
            "temperature": 32,
            "humidity":    68,
            "rainfall":    0,
            "wind_speed":  12,
            "description": "Partly cloudy",
            "icon":        "02d",
            "mock":        True,
        })

    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}&appid={OPENWEATHER_KEY}&units=metric"
    )
    resp = requests.get(url, timeout=10)
    if resp.status_code != 200:
        return jsonify({"error": "Weather API failed"}), 502

    w = resp.json()
    return jsonify({
        "location":    w["name"],
        "temperature": w["main"]["temp"],
        "humidity":    w["main"]["humidity"],
        "rainfall":    w.get("rain", {}).get("1h", 0),
        "wind_speed":  w["wind"]["speed"],
        "description": w["weather"][0]["description"].title(),
        "icon":        w["weather"][0]["icon"],
    })


# ── /recommendations ──────────────────────────────────────────────────────────
@app.route("/recommendations", methods=["POST"])
def recommendations():
    data        = request.get_json(force=True)
    temperature = float(data.get("temperature", 25))
    humidity    = float(data.get("humidity", 60))
    ph          = float(data.get("ph", 6.5))
    rainfall    = float(data.get("rainfall", 0))
    crop        = data.get("crop", "").lower()

    tips = []

    if temperature > 38:
        tips.append({"category": "Heat Stress",    "message": "Temperature critically high. Apply mulch and increase irrigation frequency.", "severity": "high"})
    elif temperature < 10:
        tips.append({"category": "Cold Stress",    "message": "Risk of frost damage. Consider protective covers for seedlings.", "severity": "high"})

    if humidity > 85:
        tips.append({"category": "Disease Risk",   "message": "High humidity promotes fungal diseases. Ensure good canopy airflow and reduce overhead irrigation.", "severity": "medium"})
    elif humidity < 30:
        tips.append({"category": "Dry Conditions", "message": "Low humidity detected. Increase irrigation and use drip systems.", "severity": "medium"})

    if ph < 5.5:
        tips.append({"category": "Soil pH",        "message": "Soil is acidic. Apply lime at 2–4 t/ha to raise pH.", "severity": "medium"})
    elif ph > 7.5:
        tips.append({"category": "Soil pH",        "message": "Soil is alkaline. Add sulphur or organic matter to lower pH.", "severity": "medium"})

    if rainfall > 50:
        tips.append({"category": "Waterlogging",   "message": "Heavy rainfall expected. Ensure drainage channels are clear.", "severity": "high"})
    elif rainfall == 0 and humidity < 50:
        tips.append({"category": "Irrigation",     "message": "No rainfall and low humidity. Schedule irrigation within 24–48 h.", "severity": "low"})

    crop_tips = {
        "rice":   "Rice is at optimal growing range when temp 22–32 °C and rainfall > 100 mm/month.",
        "wheat":  "Wheat prefers 15–25 °C. Avoid waterlogging during grain fill.",
        "maize":  "Maize needs 500–800 mm water. Side-dress with urea at knee-high stage.",
        "potato": "Potato prefers cool nights (10–18 °C). Hill up soil to prevent greening.",
    }
    if crop in crop_tips:
        tips.append({"category": "Crop Advisory", "message": crop_tips[crop], "severity": "info"})

    if not tips:
        tips.append({"category": "General",       "message": "Conditions look favourable. Maintain regular monitoring.", "severity": "info"})

    return jsonify({"recommendations": tips, "timestamp": datetime.utcnow().isoformat()})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
