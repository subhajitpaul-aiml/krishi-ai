# train_yield.py
# Dataset: Crop Recommendation – https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
# pip install scikit-learn pandas kaggle

import pickle
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score

# Download:
#   kaggle datasets download -d atharvaingle/crop-recommendation-dataset
#   unzip crop-recommendation-dataset.zip

CSV_FILE  = "Crop_recommendation.csv"
MODEL_OUT = "yield_model.pkl"

df = pd.read_csv(CSV_FILE)

# Synthetic yield target (dataset has crop labels, not yield values)
# For real yield data use: https://www.kaggle.com/datasets/patelris/crop-yield-prediction-dataset
YIELD_MAP = {
    "rice": 3.5, "wheat": 2.8, "maize": 4.2, "potato": 18.0,
    "cotton": 1.8, "sugarcane": 65.0, "soybean": 2.0, "groundnuts": 1.5,
    "mungbean": 0.8, "blackgram": 0.7, "lentil": 1.2, "pomegranate": 12.0,
    "banana": 35.0, "mango": 8.0, "grapes": 12.0, "watermelon": 20.0,
    "muskmelon": 14.0, "apple": 10.0, "orange": 15.0, "papaya": 25.0,
    "coconut": 4.5, "jute": 2.0, "coffee": 0.8,
}
import numpy as np
df["yield"] = df["label"].map(YIELD_MAP).fillna(3.0)
df["yield"] += np.random.normal(0, 0.3, len(df))   # add noise

features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
X = df[features]
y = df["yield"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = GradientBoostingRegressor(n_estimators=300, max_depth=5, learning_rate=0.05, random_state=42)
model.fit(X_train, y_train)

preds = model.predict(X_test)
print(f"MAE : {mean_absolute_error(y_test, preds):.3f}")
print(f"R²  : {r2_score(y_test, preds):.3f}")

with open(MODEL_OUT, "wb") as f:
    pickle.dump(model, f)

print(f"Model saved to {MODEL_OUT}")
