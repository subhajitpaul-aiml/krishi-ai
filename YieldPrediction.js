import React, { useState } from "react";
import { predictYield, fetchRecommendations } from "./api";

const CROPS     = ["Rice", "Wheat", "Maize", "Potato", "Cotton", "Sugarcane", "Soybean", "Groundnut"];
const DEFAULTS  = { N: 90, P: 42, K: 43, temperature: 28, humidity: 65, ph: 6.5, rainfall: 150 };

export default function YieldPrediction() {
  const [form,   setForm]   = useState({ ...DEFAULTS, crop: "Rice" });
  const [result, setResult] = useState(null);
  const [recs,   setRecs]   = useState(null);
  const [loading,setLoading]= useState(false);
  const [error,  setError]  = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true); setError(null);
    try {
      const [yRes, rRes] = await Promise.all([
        predictYield({ ...form, crop: form.crop.toLowerCase() }),
        fetchRecommendations({ ...form, crop: form.crop.toLowerCase() }),
      ]);
      setResult(yRes.data);
      setRecs(rRes.data.recommendations);
    } catch {
      setError("Prediction failed. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  const sevColor = { high: "#ef4444", medium: "#f59e0b", low: "#3b82f6", info: "#10b981" };

  return (
    <section className="card yield-card">
      <h2 className="section-title">🌾 Yield Prediction</h2>

      <div className="form-grid">
        <label>Crop
          <select value={form.crop} onChange={e => set("crop", e.target.value)}>
            {CROPS.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>

        {[
          ["N (kg/ha)",        "N",           0, 200],
          ["P (kg/ha)",        "P",           0, 200],
          ["K (kg/ha)",        "K",           0, 200],
          ["Temperature (°C)", "temperature", 5, 50 ],
          ["Humidity (%)",     "humidity",    0, 100],
          ["Soil pH",          "ph",          3,  10],
          ["Rainfall (mm)",    "rainfall",    0, 500],
        ].map(([label, key, min, max]) => (
          <label key={key}>{label}
            <div className="range-wrap">
              <input
                type="range" min={min} max={max} step={key === "ph" ? 0.1 : 1}
                value={form[key]}
                onChange={e => set(key, parseFloat(e.target.value))}
              />
              <span className="range-val">{form[key]}</span>
            </div>
          </label>
        ))}
      </div>

      <button className="btn btn-primary" onClick={submit} disabled={loading}>
        {loading ? "Predicting…" : "Predict Yield"}
      </button>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <div className="yield-result">
          <div className="yield-number">{result.predicted_yield.toFixed(2)}</div>
          <div className="yield-unit">{result.unit}</div>
          <div className="yield-crop">Predicted for {result.crop}</div>
        </div>
      )}

      {recs && recs.length > 0 && (
        <div className="recommendations">
          <h3>📋 Recommendations</h3>
          {recs.map((r, i) => (
            <div key={i} className="rec-item" style={{ borderLeftColor: sevColor[r.severity] }}>
              <strong>{r.category}</strong>
              <p>{r.message}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
