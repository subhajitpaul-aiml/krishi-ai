# SmartKrishi AI – Setup Guide

## Project Structure
```
smartkrishi/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── disease_model.h5    ← place trained model here
│   └── yield_model.pkl     ← place trained model here
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.js / App.css
│       ├── Dashboard.js
│       ├── DiseaseDetection.js
│       ├── YieldPrediction.js
│       ├── WeatherWidget.js
│       └── api.js
└── model_scripts/
    ├── train_disease.py
    └── train_yield.py
```

---

## Backend Setup

```bash
# 1. Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set environment variables
export OPENWEATHER_KEY=your_openweathermap_api_key
export MONGO_URI=mongodb://localhost:27017/smartkrishi

# 4. (Optional) Train models first — see model_scripts/
#    Otherwise app will use mock predictions automatically

# 5. Start Flask server
python app.py
# → Running on http://localhost:5000
```

---

## Frontend Setup

```bash
# 1. Install Node dependencies
cd frontend
npm install

# 2. (Optional) set backend URL if not localhost
echo "REACT_APP_API_URL=http://localhost:5000" > .env

# 3. Start React dev server
npm start
# → Opens http://localhost:3000
```

---

## Training Models (optional)

```bash
cd model_scripts

# Disease model (needs PlantVillage dataset)
# Download: kaggle datasets download -d emmarex/plantdisease
pip install tensorflow pillow kaggle
python train_disease.py
cp disease_model.h5 ../backend/

# Yield model (needs Crop Recommendation dataset)
# Download: kaggle datasets download -d atharvaingle/crop-recommendation-dataset
pip install scikit-learn pandas kaggle
python train_yield.py
cp yield_model.pkl ../backend/
```

---

## MongoDB (local)

```bash
# Install MongoDB Community Edition, then:
mongod --dbpath /data/db
# Default URI used: mongodb://localhost:27017/smartkrishi
```

---

## API Endpoints

| Method | Endpoint           | Payload / Params                            |
|--------|--------------------|---------------------------------------------|
| POST   | /predict-disease   | `multipart/form-data` with `image` file     |
| POST   | /predict-yield     | JSON: N, P, K, temperature, humidity, ph, rainfall, crop |
| GET    | /weather           | `?lat=23.55&lon=87.32`                      |
| POST   | /recommendations   | JSON: temperature, humidity, ph, rainfall, crop |

---

## OpenWeatherMap API Key

Register free at https://openweathermap.org/api and copy your key into `OPENWEATHER_KEY`.
Without it the `/weather` endpoint returns mock data automatically.
